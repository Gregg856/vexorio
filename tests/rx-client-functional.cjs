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
   // Real authenticated Worker responses: curated knowledge, not generic task proposals.
   for(const [question,expectedTitle] of [
     ['Opowiedz o mrówkach RX','Mrówki RX'],
     ['Czym jest RX Wiedza Świata?','RX Wiedza Świata'],
     ['Co to jest wirnik RX?','Wirnik RX']
   ]){
     const result=await call('/api/rx/client/chat',{body:JSON.stringify({message:question,history:[]})});
     assert.equal(result.status,200,question);
     const reply=await result.json();
     assert.equal(reply.engine,'rx-bibi-client-public-knowledge',question);
     assert.equal(reply.knowledge.title,expectedTitle,question);
     assert.match(reply.answer,/Źródło:/,'Sourced reply: '+question);
     assert.equal(reply.executed,0);
     assert.equal(reply.adminToolsAvailable,false);
     assert.equal(reply.modelInferenceUsed,false);
   }
   // RX BIBI 7.1: RX Tester CI status is read-only and cannot trigger privileged work.
   const originalFetch=global.fetch;
   global.fetch=async(url,options={})=>{
     if(String(url).includes('/actions/workflows/rx-client-dialogue-baseline.yml/runs?')){
       assert.equal(options.headers.Authorization,undefined,'Tester lookup must not send credentials');
       return Response.json({workflow_runs:[{status:'completed',conclusion:'success',run_number:42}]});
     }
     return originalFetch(url,options);
   };
   const testerStatus=await call('/api/rx/client/chat',{body:JSON.stringify({message:'Sprawdź status RX Tester',history:[]})});
   assert.equal(testerStatus.status,200);
   const testerResult=await testerStatus.json();
   assert.match(testerResult.answer,/RX Tester/);
   assert.match(testerResult.answer,/success/);
   assert.equal(testerResult.executed,0);
   assert.equal(testerResult.adminToolsAvailable,false);
   global.fetch=originalFetch;
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
   const longCapability=await call('/api/rx/client/chat',{body:JSON.stringify({message:'BIBI, co umiesz? Opowiedz mi o swoich możliwościach i ograniczeniach. Chcę cię dalej rozwijać, żebyś mogła pomagać mi w budowaniu naszego systemu RX.',tasks:[{title:'Test BIBI',status:'completed'}]})});
   assert.equal(longCapability.status,200,'Long-form capability request accepted');
   const capabilityReply=await longCapability.json();
   assert.match(capabilityReply.answer,/lokalnym planerze reguł/,'BIBI should transparently describe its capabilities');
   assert.equal(capabilityReply.executed,0);
   assert.equal(capabilityReply.adminToolsAvailable,false);
   const repairHistory=await call('/api/rx/client/chat',{body:JSON.stringify({message:'Pokaż historię napraw',tasks:[{title:'Poprawić czat BIBI',status:'completed'},{title:'Dodać pamięć',status:'pending'}]})});
   assert.equal(repairHistory.status,200);
   const repairReply=await repairHistory.json();
   assert.match(repairReply.answer,/Poprawić czat BIBI/);
   assert.match(repairReply.answer,/nie dowód wykonania naprawy/);
   assert.doesNotMatch(repairReply.answer,/Dodać pamięć/);
   assert.equal(repairReply.executed,0);
   const invalidTasks=await call('/api/rx/client/chat',{body:JSON.stringify({message:'Co zostało do zrobienia?',tasks:[{title:'Zadanie',status:'admin'}]})});
   assert.equal(invalidTasks.status,400);
   console.log('RX BIBI local task snapshot regression passed');
   console.log('RX BIBI Android screenshots regression passed');
   console.log('RX BIBI 6.5 public identity regression passed');

   assert.ok(requests.every(x=>x.url.endsWith('/auth/v1/user')||/https:\/\/(?:pl|en)\.wikipedia\.org\/w\/api\.php/.test(x.url)),'No privileged upstream calls during dialogue');
   console.log('RX BIBI 6.1 authenticated Worker dialogue passed:',dialogueTurns.length);
   assert.ok(requests.every(x=>x.url.endsWith('/auth/v1/user')||/https:\/\/(?:pl|en)\.wikipedia\.org\/w\/api\.php/.test(x.url)),'No privileged upstream calls');
   console.log('RX client functional authentication and isolation checks passed');
   const authFetch=global.fetch;
   global.fetch=async(url,options={})=>{
     if(String(url)==='https://api.github.com/repos/Gregg856/vexorio/actions/runs/41062304558'){
       assert.equal(options.headers.Authorization,undefined,'Run lookup must not send GitHub token');
       return Response.json({id:41062304558,status:'completed',conclusion:'success',head_sha:'ca22d2871234',repository:{full_name:'Gregg856/vexorio'}});
     }
     if(String(url).startsWith('https://api.github.com/repos/Gregg856/vexorio/actions/runs?')){
       assert.equal(options.headers.Authorization,undefined,'No GitHub token sent');
       return Response.json({workflow_runs:[{name:'VEXORIO checks',status:'completed',conclusion:'success',head_sha:'abcdef123456'}]});
     }
     return authFetch(url,options);
   };
   const ciStatus=await call('/api/rx/client/chat',{body:JSON.stringify({message:'Sprawdź testy GitHub',tasks:[]})});
   assert.equal(ciStatus.status,200);
   const ciReply=await ciStatus.json();
   assert.match(ciReply.answer,/VEXORIO checks: success/);
   assert.equal(ciReply.executed,0);
   assert.equal(ciReply.adminToolsAvailable,false);
   console.log('RX BIBI read-only GitHub status passed');
   const runResult=await call('/api/rx/client/chat',{body:JSON.stringify({message:'Sprawdź test 41062304558',tasks:[]})});
   assert.equal(runResult.status,200);
   const runReply=await runResult.json();
   assert.match(runReply.answer,/41062304558: success/);
   assert.match(runReply.answer,/ca22d287/);
   assert.equal(runReply.executed,0);
   assert.equal(runReply.adminToolsAvailable,false);
   console.log('RX BIBI authenticated read-only individual run lookup passed');


   // RX BIBI 7.4: owner-only Queen triage, real failed jobs, and no dispatch.
   const queenEnv={...env,RX_ADMIN_USER_ID:'admin-user'};
   const queenCall=(message)=>worker.fetch(new Request(origin+'/api/rx/chat',{method:'POST',headers:{Origin:origin,Authorization:'Bearer valid-user','Content-Type':'application/json'},body:JSON.stringify({message,history:[]})}),queenEnv);
   let githubReads=0;
   global.fetch=async(url,options={})=>{
     const target=String(url);
     if(target==='https://example.supabase.co/auth/v1/user')return Response.json({id:'admin-user',is_anonymous:false});
     if(target==='https://example.supabase.co/rest/v1/rpc/is_vexorio_admin')return Response.json(true);
     if(target.includes('/actions/workflows/rx-client-dialogue-baseline.yml/runs?')){
       assert.equal(options.method,undefined,'Triage must only read');githubReads++;
       return Response.json({workflow_runs:[{id:12345678,status:'completed',conclusion:'failure'}]});
     }
     if(target.endsWith('/actions/runs/12345678/jobs?per_page=100')){
       assert.equal(options.method,undefined,'Job inspection must only read');githubReads++;
       return Response.json({jobs:[{name:'RX dialogue tests',conclusion:'failure',steps:[{name:'Regression assertion',conclusion:'failure'}]}]});
     }
     throw Error('Unexpected privileged request: '+target);
   };
   const triage=await queenCall('Przygotuj zadanie dla RX Developer z wyniku RX Tester');
   assert.equal(triage.status,200,'Owner triage accepted');
   const triageData=await triage.json();
   assert.equal(triageData.proposed,true);
   assert.equal(triageData.executed,0);
   assert.equal(triageData.queued,false);
   assert.equal(triageData.requiresApproval,true);
   assert.match(triageData.answer,/RX dialogue tests/);
   assert.match(triageData.answer,/Regression assertion/);
   assert.equal(triageData.developerTickets.length,1);
   assert.equal(triageData.developerTickets[0].runId,12345678);
   assert.equal(triageData.developerTickets[0].jobName,'RX dialogue tests');
   assert.equal(triageData.developerTickets[0].stepName,'Regression assertion');
   assert.equal(triageData.developerTickets[0].requiresApproval,true);
   assert.equal(triageData.developerTickets[0].executed,false);
   assert.equal(githubReads,2,'Exactly two read-only GitHub calls');
   queenEnv.RX_ADMIN_USER_ID='someone-else';
   const deniedTriage=await queenCall('Przygotuj zadanie dla RX Developer z wyniku RX Tester');
   assert.equal(deniedTriage.status,403,'Only owner can request triage');
   global.fetch=authFetch;
   // Admin learning bridge: never query private cloud before verified admin authorization.
   const learningPath='/api/rx/admin/learning';
   const getLearning=(headers={})=>worker.fetch(new Request(origin+learningPath,{headers:{Origin:origin,Authorization:'Bearer valid-user',...headers}}),env);
   assert.equal((await getLearning({Authorization:'Bearer invalid'})).status,401);
   assert.equal((await getLearning({Origin:'https://evil.example'})).status,403);
   assert.equal((await worker.fetch(new Request(origin+learningPath,{method:'POST',headers:{Origin:origin}}),env)).status,405);
   const beforeAdmin=requests.length;
   global.fetch=async(url,options={})=>{
     requests.push({url:String(url)});
     if(String(url)==='https://example.supabase.co/auth/v1/user')return Response.json({id:'admin-user',is_anonymous:false});
     if(String(url)==='https://example.supabase.co/rest/v1/rpc/is_vexorio_admin')return Response.json(false);
     throw Error('Private cloud must not be contacted before admin authorization');
   };
   assert.equal((await getLearning()).status,403);
   assert.equal(requests.length,beforeAdmin+2);
   global.fetch=async(url,options={})=>{
     if(String(url)==='https://example.supabase.co/auth/v1/user')return Response.json({id:'admin-user',is_anonymous:false});
     if(String(url)==='https://example.supabase.co/rest/v1/rpc/is_vexorio_admin')return Response.json(true);
     if(String(url)==='https://cloud.example.org/__rxcloud/bibi/learning'){
       assert.equal(options.headers.Authorization,'Bearer '+env.RX_QUEEN_LOCAL_TOKEN);
       return Response.json({kind:'rx-queen-verified-learning',lessons:[{observation:'example',verifiedResolution:false}],verified:[],suggestions:[]});
     }
     throw Error('Unexpected request: '+url);
   };
   env.RX_QUEEN_LOCAL_TOKEN='a'.repeat(40);
   env.RX_CLOUD_LEARNING_URL='https://cloud.example.org/__rxcloud/bibi/learning';
   const bridge=await getLearning();
   assert.equal(bridge.status,200);
   const bridgeData=await bridge.json();
   assert.equal(bridgeData.ok,true);
   assert.equal(bridgeData.lessons[0].verifiedResolution,false);
   assert(!JSON.stringify(bridgeData).includes(env.RX_QUEEN_LOCAL_TOKEN));
   console.log('RX BIBI admin-only learning bridge passed');
 }finally{global.fetch=oldFetch;}
})().catch(error=>{console.error(error);process.exitCode=1;});
