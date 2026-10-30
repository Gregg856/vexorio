'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const file=path.join(__dirname,'..','worker.js');
 const worker=(await import(pathToFileURL(file).href)).default;
 const origin='https://rx.test';
 const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public-test-key',ASSETS:{fetch:async()=>new Response('not found',{status:404})}};
 const oldFetch=global.fetch;
 const requests=[];
 global.fetch=async(url,options={})=>{
   requests.push({url:String(url),headers:options.headers||{}});
   if(String(url)==='https://example.supabase.co/auth/v1/user'){
     if(options.headers.Authorization==='Bearer valid-user')return Response.json({id:'test-user',is_anonymous:false});
     if(options.headers.Authorization==='Bearer anonymous')return Response.json({id:'test-anon',is_anonymous:true});
     return Response.json({message:'invalid'},{status:401});
   }
   throw Error('Unexpected upstream request: '+url);
 };
 const call=(pathname,options={})=>{const {headers={},...rest}=options;return worker.fetch(new Request(origin+pathname,{method:'POST',body:JSON.stringify({message:'Cześć',history:[]}),...rest,headers:{Origin:origin,Authorization:'Bearer valid-user','Content-Type':'application/json',...headers}}),env);};
 try{
   let response=await call('/api/rx/client/chat',{headers:{Authorization:'Bearer invalid'}});
   assert.equal(response.status,401,'Invalid session rejected');
   response=await call('/api/rx/client/chat',{headers:{Authorization:'Bearer anonymous'}});
   assert.equal(response.status,403,'Anonymous session rejected');
   response=await call('/api/rx/client/chat',{headers:{Origin:'https://evil.example'}});
   assert.equal(response.status,403,'Cross-origin rejected');
   response=await call('/api/rx/client/chat',{body:JSON.stringify({message:'x'.repeat(2001)})});
   assert.equal(response.status,400,'Oversized message rejected');
   response=await call('/api/rx/client/chat');
   assert.equal(response.status,200,'Authenticated client chat responds');
   const data=await response.json();
   assert.equal(data.ok,true);
   assert.equal(data.adminToolsAvailable,false);
   assert.equal(data.executed,0);
   assert.equal(data.modelInferenceUsed,false);
   assert.ok(typeof data.answer==='string'&&data.answer.length>0);
   // RX BIBI 6.1: real Worker route, authenticated multi-turn dialogue.
   const dialogue=[];
   const dialogueTurns=[
    ['Czym jest 2FA?',null],
    ['Nie rozumiem tego','2FA to dodatkowe'],
    ['Podaj przykład','Przykład 2FA'],
    ['Zmieńmy temat',null],
    ['Co oznacza backup?',null],
    ['A jak to zrobić?','Aby zrobić kopię zapasową']
   ];
   for(const [message,expected] of dialogueTurns){
    const result=await call('/api/rx/client/chat',{body:JSON.stringify({message,history:dialogue.slice(-10)})});
    assert.equal(result.status,200,'Authenticated dialogue: '+message);
    const reply=await result.json();
    assert.equal(reply.ok,true,'Response shape: '+message);
    assert.equal(reply.executed,0,'No execution: '+message);
    assert.equal(reply.adminToolsAvailable,false,'No admin privileges: '+message);
    assert.equal(reply.modelInferenceUsed,false,'No claimed model inference: '+message);
    assert.ok(typeof reply.answer==='string'&&reply.answer.trim(),'Nonempty answer: '+message);
    if(expected)assert.ok(reply.answer.includes(expected),'Wrong context: '+message+' => '+reply.answer);
    dialogue.push(message,reply.answer);
   }
   // RX BIBI 6.2: expired session and temporary authentication upstream outage.
   let denied=await call('/api/rx/client/chat',{headers:{Authorization:'Bearer expired-user'}});
   assert.equal(denied.status,401,'Expired token must be rejected');
   denied=await call('/api/rx/client/chat',{headers:{Authorization:'Bearer anonymous'}});
   assert.equal(denied.status,403,'Anonymous login must not access customer chat');
   const recover=await call('/api/rx/client/chat',{body:JSON.stringify({message:'Czym jest 2FA?',history:[]})});
   assert.equal(recover.status,200,'Valid session can chat after expired token attempt');
   assert.equal((await recover.json()).executed,0,'Recovery must not execute admin work');
   console.log('RX BIBI 6.2 expired-session and recovery API checks passed');
   // RX BIBI 6.5: public-facing identity must not impersonate the private Queen.
   for(const [question,expected] of [
    ['Cześć','Jestem RX BIBI'],
    ['Kim jesteś?','Jestem RX BIBI'],
    ['Dziękuję','Nie ma za co']
   ]){
    const response=await call('/api/rx/client/chat',{body:JSON.stringify({message:question,history:[]})});
    assert.equal(response.status,200,question);
    const reply=await response.json();
    assert.ok(reply.answer.includes(expected),question+': '+reply.answer);
    assert.doesNotMatch(reply.answer,/Królowa RX|Mrówkach|Wirniku/,'Internal identity leaked: '+question);
    assert.equal(reply.adminToolsAvailable,false);
    assert.equal(reply.executed,0);
   }
   // Regression from live Android chat screenshots: compound identity and task transparency.
   for(const [question,expected] of [
     ['Cześć BIBI, kim jesteś i w czym możesz mi pomóc?','Jestem RX BIBI'],
     ['Co zostało do zrobienia?','Nie mam jeszcze dostępu do rejestru zadań']
   ]){
     const response=await call('/api/rx/client/chat',{body:JSON.stringify({message:question,history:[]})});
     assert.equal(response.status,200,'Android regression: '+question);
     const reply=await response.json();
     assert.ok(reply.answer.includes(expected),'Unexpected response: '+reply.answer);
     assert.doesNotMatch(reply.answer,/Królowa RX|Jestem Królową RX/,'Public chat must not impersonate Queen');
     assert.equal(reply.executed,0);
     assert.equal(reply.adminToolsAvailable,false);
   }
   // Read-only task snapshots from the signed-in user's browser.
   for(const [question,expected] of [['Co zostało do zrobienia?','Naprawa czatu'],['Co już zrobione?','Test logowania']]){
     const response=await call('/api/rx/client/chat',{body:JSON.stringify({message:question,history:[],tasks:[{title:'Naprawa czatu',status:'pending'},{title:'Test logowania',status:'completed'}]})});
     assert.equal(response.status,200);
     const reply=await response.json();
     assert.ok(reply.answer.includes(expected),reply.answer);
     assert.equal(reply.executed,0);
   }
   const invalidTasks=await call('/api/rx/client/chat',{body:JSON.stringify({message:'Co zostało do zrobienia?',tasks:[{title:'Zadanie',status:'admin'}]})});
   assert.equal(invalidTasks.status,400);
   console.log('RX BIBI local task snapshot regression passed');
   console.log('RX BIBI Android screenshots regression passed');
   console.log('RX BIBI 6.5 public identity regression passed');

   assert.ok(requests.every(x=>x.url.endsWith('/auth/v1/user')),'No privileged upstream calls during dialogue');
   console.log('RX BIBI 6.1 authenticated Worker dialogue passed:',dialogueTurns.length);
   assert.ok(requests.every(x=>x.url.endsWith('/auth/v1/user')),'No privileged upstream calls');
   console.log('RX client functional authentication and isolation checks passed');
 }finally{global.fetch=oldFetch;}
})().catch(error=>{console.error(error);process.exitCode=1;});
