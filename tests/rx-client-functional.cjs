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
 const call=(pathname,options={})=>worker.fetch(new Request(origin+pathname,{method:'POST',headers:{Origin:origin,Authorization:'Bearer valid-user','Content-Type':'application/json',...options.headers},body:JSON.stringify({message:'Cześć',history:[]}),...options}),env);
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
   assert.ok(requests.every(x=>x.url.endsWith('/auth/v1/user')),'No privileged upstream calls');
   console.log('RX client functional authentication and isolation checks passed');
 }finally{global.fetch=oldFetch;}
})().catch(error=>{console.error(error);process.exitCode=1;});
