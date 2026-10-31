'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {start:cloudStart}=require('../rx-cloud-server.cjs');
const {start:modelStart}=require('../rx-bibi-own-inference.cjs');
const keys=['SUPABASE_URL','RX_QUEEN_LOCAL_TOKEN','RX_BIBI_MODEL_ENABLED','RX_BIBI_MODEL_PORT'];
test('real local classifier process is probed over loopback with bearer auth',async()=>{
 const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 let model,cloud;
 try{
  model=await modelStart({port:0,samples:[{input:'cześć królowo',answer:'Witaj!'},{input:'witaj królowo',answer:'Witaj!'}]});
  process.env.SUPABASE_URL='https://rxcloud-staging-test.supabase.co';
  process.env.RX_QUEEN_LOCAL_TOKEN='q'.repeat(40);
  process.env.RX_BIBI_MODEL_ENABLED='true';
  process.env.RX_BIBI_MODEL_PORT=String(model.address().port);
  cloud=await cloudStart({port:0});
  const url='http://127.0.0.1:'+cloud.address().port+'/__rxcloud/model/probe';
  assert.equal((await fetch(url)).status,401);
  const headers={Authorization:'Bearer '+'q'.repeat(40)};
  assert.equal((await fetch(url,{method:'POST',headers})).status,405);
  const result=await fetch(url,{headers});
  assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{ok:true,modelVerified:true,mode:'live-loopback-probe',status:422});
  await new Promise(resolve=>model.close(resolve));model=null;
  const down=await fetch(url,{headers});
  assert.equal(down.status,503);
  assert.equal((await down.json()).modelVerified,false);
 }finally{
  if(cloud)await new Promise(resolve=>cloud.close(resolve));
  if(model)await new Promise(resolve=>model.close(resolve));
  for(const [k,v] of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
 }
});
