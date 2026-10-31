'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {start}=require('../rx-cloud-server.cjs');
const original={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_ANON_KEY:process.env.SUPABASE_ANON_KEY,RX_BIBI_MODEL_ENABLED:process.env.RX_BIBI_MODEL_ENABLED,RX_BIBI_MODEL_PORT:process.env.RX_BIBI_MODEL_PORT};
function restore(){for(const [k,v] of Object.entries(original)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
function listen(server){return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));}
function close(server){return new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
test('RX CLOUD loopback inference transport + existing bridge (mock backend only)',async()=>{
 const requests=[];
 const mock=http.createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;
  requests.push({method:req.method,url:req.url,body});
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({answer:'Odpowiedź testowa RX'}));
 });
 let cloud;
 try{
  const port=await listen(mock);
  process.env.SUPABASE_URL='https://rxcloud-staging-test.supabase.co';
  process.env.SUPABASE_ANON_KEY='rx-cloud-local-test-public-key';
  process.env.RX_BIBI_MODEL_ENABLED='true';
  process.env.RX_BIBI_MODEL_PORT=String(port);
  cloud=await start({port:0,host:'127.0.0.1'});
  // The self-host app uses an internal fetch binding; check the same contract
  // through a real local TCP server, without touching Supabase or production.
  const bridge=await import(pathToFileURL(path.join(__dirname,'..','rx-bibi-model-bridge.mjs')));
  const env={RX_BIBI_MODEL_ENABLED:'true',RX_BIBI_MODEL_SERVICE:{
   fetch:(_url,options)=>fetch('http://127.0.0.1:'+port+'/infer',{
    method:'POST',headers:{'Content-Type':'application/json'},body:options.body,signal:options.signal
   })
  }};
  const result=await bridge.askClientModel('Zapytaj model: test RX',env);
  assert.equal(result.answer,'Odpowiedź testowa RX');
  assert.equal(result.modelInferenceUsed,true);
  assert.deepEqual(requests,[{method:'POST',url:'/infer',body:JSON.stringify({message:'test RX'})}]);
  const status=await fetch('http://127.0.0.1:'+cloud.address().port+'/__rxcloud/model/capabilities');
  assert.equal((await status.json()).modelVerified,false,'mock response cannot prove a real model');
 }finally{
  if(cloud)await close(cloud);
  await close(mock);
  restore();
 }
});
