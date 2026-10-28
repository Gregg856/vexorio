'use strict';
// Exercise the real Worker request pipeline with mocked upstream identity/RPC.
// No live credentials, private sessions, paid AI or external calls.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const source=fs.readFileSync('worker.js','utf8');
 const planner=pathToFileURL(path.resolve('rx-chat-planner.mjs')).href;
 const knowledge=pathToFileURL(path.resolve('rx-world-knowledge.mjs')).href;
 const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source.replace("'./rx-chat-planner.mjs'",JSON.stringify(planner)).replace("'./rx-world-knowledge.mjs'",JSON.stringify(knowledge)).replace("'./rx-knowledge-base.mjs'",JSON.stringify(pathToFileURL(path.resolve('rx-knowledge-base.mjs')).href)).replace("'./rx-persistent-memory.mjs'",JSON.stringify(pathToFileURL(path.resolve('rx-persistent-memory.mjs')).href))).toString('base64'));
 const url='https://example.test/api/rx/chat';
 const env={RX_GITHUB_DISPATCH_TOKEN:'dummy',RX_ADMIN_USER_ID:'dummy',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'dummy',RX_AI_ENABLED:'false'};
 const send=(message,extra={})=>worker.fetch(new Request(url,{method:'POST',headers:{Origin:'https://example.test',Authorization:'Bearer fake.test.token','Content-Type':'application/json',...extra.headers},body:JSON.stringify({message,history:[],...extra.body})}),env);
 const original=global.fetch;
 let authCalls=0,adminCalls=0;
 try{
  global.fetch=async(input)=>{
   const endpoint=String(input);
   if(endpoint.endsWith('/auth/v1/user')){authCalls++;return Response.json({id:'owner',is_anonymous:false});}
   if(endpoint.endsWith('/rest/v1/rpc/is_vexorio_admin')){adminCalls++;return Response.json(true);}
   throw Error('Unexpected upstream request: '+endpoint);
  };
  let response=await send('Sprawdź testy i chmurę');
  assert.equal(response.status,200);
  let data=await response.json();
  assert.equal(typeof data.answer,'string');
  assert.ok(data.answer.length>0);
  assert.equal(data.engine,'rx-local-planner');
  assert.equal(data.executed,0);
  assert.ok(Array.isArray(data.tasks));
  assert.equal(data.turbine.executionConnected,false);
  assert.equal(authCalls,1);assert.equal(adminCalls,1);
  global.fetch=async(input)=>{
   const endpoint=String(input);
   if(endpoint.endsWith('/auth/v1/user'))return Response.json({id:'owner',is_anonymous:false});
   if(endpoint.endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(true);
   if(endpoint.startsWith('https://api.github.com/search/issues?'))return Response.json({items:[{title:'Fix Cloudflare Worker error',html_url:'https://github.com/example/project/issues/42'}]});
   throw Error('Unexpected upstream: '+endpoint);
  };
  response=await send('Szukaj pomocy: Cloudflare Worker error');
  data=await response.json();
  assert.equal(response.status,200);
  assert.equal(data.engine,'rx-tech-help');
  assert.equal(data.sources.length,1);
  assert.equal(data.executed,0);
  assert.match(data.answer,/github\.com/);
  response=await send('Szukaj pomocy: x');
  assert.equal((await response.json()).engine,'rule-based-fallback');
  response=await send('status RX',{headers:{Origin:'https://evil.test'}});
  assert.equal(response.status,403);
  response=await worker.fetch(new Request(url,{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json'},body:JSON.stringify({message:'status'})}),env);
  assert.equal(response.status,401);
  response=await send('x'.repeat(8001));assert.equal(response.status,400);
  global.fetch=async(input)=>{
   if(String(input).endsWith('/auth/v1/user'))return Response.json({id:'owner',is_anonymous:false});
   if(String(input).endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(false);
   throw Error('Unexpected upstream request');
  };
  response=await send('status');assert.equal(response.status,403);
  console.log('RX chat Worker end-to-end mocked request/response and access controls: PASS');
 }finally{global.fetch=original;}
})().catch(error=>{console.error(error);process.exitCode=1;});
