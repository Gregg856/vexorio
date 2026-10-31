'use strict';
// RX NAUKA 4.9: exercise the real Worker Brain route with mocked private upstreams.
// No real credentials, network calls, or production writes.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const src=fs.readFileSync(path.join(__dirname,'..','worker.js'),'utf8');
const root=path.join(__dirname,'..');
const deps=['rx-persistent-memory.mjs','rx-knowledge-base.mjs','rx-world-knowledge.mjs','rx-chat-planner.mjs','rx-bibi-task-reasoner.mjs'];
let patched=src;
for(const dep of deps)patched=patched.replace("'./"+dep+"'",JSON.stringify(pathToFileURL(path.join(root,dep)).href));
const load=()=>import('data:text/javascript;base64,'+Buffer.from(patched).toString('base64'));
const base='https://example.test/api/rx/admin/brain-memory';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public-test',RX_QUEEN_LOCAL_TOKEN:'t'.repeat(40),RX_CLOUD_BRAIN_MEMORY_URL:'https://private.example.test/__rxcloud/bibi/brain-memory'};
const req=(method='GET',headers={})=>new Request(base,{method,headers:{Authorization:'Bearer test.token',Origin:'https://example.test',...headers}});
test('authenticated Worker reads private Brain and returns only approved UI fields',async()=>{
 const {default:worker}=await load();
 const calls=[];const original=global.fetch;
 global.fetch=async input=>{
  const url=String(input);calls.push(url);
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'admin',is_anonymous:false});
  if(url.endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(true);
  if(url===env.RX_CLOUD_BRAIN_MEMORY_URL)return Response.json({ok:true,kind:'rx-brain-memory',snapshot:{schema:1,kind:'rx-brain-memory',records:[{key:'android_chat',action:'inspect_logs',successes:3,failures:1,lastEvidence:'private verified evidence'}]}});
  throw Error('Unexpected URL: '+url);
 };
 try{
  const res=await worker.fetch(req(),env);
  assert.equal(res.status,200);
  const data=await res.json();
  assert.deepEqual(data,{ok:true,kind:'rx-brain-memory',records:[{key:'android_chat',action:'inspect_logs',samples:4,successRate:0.75,requiresApproval:true}]});
  assert.equal(calls.length,3);
  assert.equal(res.headers.get('Cache-Control'),'no-store');
 }finally{global.fetch=original;}
});
test('Worker rejects missing auth without contacting upstream',async()=>{
 const {default:worker}=await load();
 const original=global.fetch;global.fetch=()=>{throw Error('No upstream expected');};
 try{
  const res=await worker.fetch(new Request(base),env);
  assert.equal(res.status,401);
 }finally{global.fetch=original;}
});
test('Worker denies non-admin before reading private memory',async()=>{
 const {default:worker}=await load();
 const original=global.fetch;let privateReads=0;
 global.fetch=async input=>{
  const url=String(input);
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'user'});
  if(url.endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(false);
  privateReads++;throw Error('Private endpoint must not be called');
 };
 try{
  const res=await worker.fetch(req(),env);
  assert.equal(res.status,403);assert.equal(privateReads,0);
 }finally{global.fetch=original;}
});
