'use strict';
// RX #641: one-command local end-to-end smoke test, no external AI or network.
// Runs only on loopback with a temporary, explicitly supplied test curriculum.
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const {start}=require('../rx-cloud-server.cjs');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-own-smoke-'));
 const training=path.join(dir,'training.json');
 const before={...process.env};
 const originalFetch=globalThis.fetch;
 let server;
 try{
  await fs.writeFile(training,JSON.stringify({version:1,samples:[
   {input:'witaj bibi',answer:'Witaj! Tu nasz RX BIBI.'},
   {input:'jak masz na imie',answer:'Nazywam się RX BIBI.'}
  ]}),{mode:0o600});
  process.env.SUPABASE_URL='https://example.supabase.co';
  process.env.RX_BIBI_MODEL_ENABLED='true';
  process.env.RX_BIBI_EMBEDDED_MODEL='true';
  process.env.RX_BIBI_TRAINING_FILE=training;
  process.env.RX_BIBI_CLIENT_MODEL_FIRST='true';
  process.env.SUPABASE_ANON_KEY='rx-test-public-anon-key';
  globalThis.fetch=async(input,options)=>{
   const target=String(input);
   if(target==='https://example.supabase.co/auth/v1/user'){
    if(options?.headers?.Authorization==='Bearer rx-test-client-session')return new Response(JSON.stringify({id:'rx-test-user',is_anonymous:false}),{status:200,headers:{'Content-Type':'application/json'}});
    return new Response('{}',{status:401});
   }
   return originalFetch(input,options);
  };
  process.env.RX_QUEEN_LOCAL_TOKEN='rx-test-local-probe-token-643-000000000000';
  server=await start({port:0,host:'127.0.0.1'});
  const url='http://127.0.0.1:'+server.address().port;
  const capabilities=await (await fetch(url+'/__rxcloud/model/capabilities')).json();
  assert.equal(capabilities.modelConfigured,true);
  const denied=await fetch(url+'/__rxcloud/model/probe');
  assert.equal(denied.status,401);
  const probe=await fetch(url+'/__rxcloud/model/probe',{headers:{Authorization:'Bearer '+process.env.RX_QUEEN_LOCAL_TOKEN}});
  assert.equal(probe.status,200,'embedded inference must respond to authorized probe');
  const probeResult=await probe.json();
  assert.equal(probeResult.modelVerified,true);
  assert.equal(probeResult.status,422,'unknown input must abstain');
  const endpoint=url+'/api/rx/client/chat';
  const headers={'Content-Type':'application/json',Origin:'http://localhost',Authorization:'Bearer rx-test-client-session'};
  const client=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({message:'witaj bibi',history:[]})});
  assert.equal(client.status,200,'authenticated client chat must work');
  const reply=await client.json();
  assert.equal(reply.answer,'Witaj! Tu nasz RX BIBI.');
  assert.equal(reply.modelInferenceUsed,true);
  assert.equal(reply.adminToolsAvailable,false);
  const unauthorized=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:url},body:JSON.stringify({message:'witaj bibi'})});
  assert.equal(unauthorized.status,401);
  console.log(JSON.stringify({ok:true,authenticatedClientChat:true,unauthorizedClientDenied:true,embeddedModelConfigured:true,probeProtected:true,liveInferenceProbe:true,unknownInputAbstains:true,publicModelEndpoint:false,note:'local-only smoke; no production or generative model'}));
 }finally{
  globalThis.fetch=originalFetch;
  if(server)await new Promise(resolve=>server.close(resolve));
  for(const key of ['SUPABASE_URL','RX_BIBI_MODEL_ENABLED','RX_BIBI_EMBEDDED_MODEL','RX_BIBI_TRAINING_FILE','RX_BIBI_CLIENT_MODEL_FIRST','RX_QUEEN_LOCAL_TOKEN','SUPABASE_ANON_KEY']){if(Object.hasOwn(before,key))process.env[key]=before[key];else delete process.env[key];}
  await fs.rm(dir,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
