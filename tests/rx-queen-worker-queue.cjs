'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const source=fs.readFileSync('worker.js','utf8');
 const modules=['rx-chat-planner.mjs','rx-world-knowledge.mjs','rx-knowledge-base.mjs','rx-persistent-memory.mjs'];
 let transformed=source;
 for(const file of modules)transformed=transformed.replace("'./"+file+"'",JSON.stringify(pathToFileURL(path.resolve(file)).href));
 const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(transformed).toString('base64'));
 const endpoint='https://example.test/api/rx/ants/tasks';
 const env={RX_GITHUB_DISPATCH_TOKEN:'test',RX_ADMIN_USER_ID:'test',SUPABASE_URL:'https://owkjdlpawczrnwyszduj.supabase.co',SUPABASE_ANON_KEY:'test',RX_SUPABASE_SERVICE_ROLE_KEY:'mock-secret'};
 const original=global.fetch;
 let privateReads=0;
 try{
  global.fetch=async(input)=>{
   const url=String(input);
   if(url.endsWith('/auth/v1/user'))return Response.json({id:'owner',is_anonymous:false});
   if(url.endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(true);
   if(url.includes('/rest/v1/ant_task_queue')){privateReads++;return Response.json([]);}
   throw Error('Unexpected upstream '+url);
  };
  const send=(e=env,method='GET',headers={})=>worker.fetch(new Request(endpoint,{method,headers:{Authorization:'Bearer mock.token.value',...headers}}),e);
  let res=await send();
  assert.equal(res.status,200);
  assert.deepEqual((await res.json()).tasks,[]);
  assert.equal(privateReads,1);
  res=await send({...env,RX_SUPABASE_SERVICE_ROLE_KEY:undefined});
  assert.equal(res.status,503);
  res=await send({...env,SUPABASE_URL:'https://lfytoxcnutduahshbsko.supabase.co'});
  assert.equal(res.status,503);
  res=await send(env,'POST',{Origin:'https://example.test'});
  assert.equal(res.status,405);
  res=await send(env,'GET',{Origin:'https://evil.test'});
  assert.equal(res.status,403);
  global.fetch=async(input)=>{
   const url=String(input);
   if(url.endsWith('/auth/v1/user'))return Response.json({id:'owner',is_anonymous:false});
   if(url.endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(false);
   throw Error('Unauthorized private access');
  };
  res=await send();
  assert.equal(res.status,403);
  console.log('RX Queen staging queue security checks passed');
 }finally{global.fetch=original;}
})().catch(error=>{console.error(error);process.exitCode=1;});
