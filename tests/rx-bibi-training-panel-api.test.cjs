'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {start}=require('../rx-cloud-server.cjs');
const {save}=require('../rx-bibi-training-store.cjs');
const keys=['SUPABASE_URL','RX_QUEEN_LOCAL_TOKEN','RX_BIBI_TRAINING_FILE','RX_BIBI_HISTORY_FILE','RX_BIBI_HOLDOUT_FILE'];
test('private training preview rejects unauthenticated callers and reveals only counts',async()=>{
 const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-panel-api-'));
 let server;
 try{
  const training=path.join(dir,'training.json'),holdout=path.join(dir,'holdout.json'),history=path.join(dir,'history.json');
  await save(training,{version:1,samples:[{input:'cześć królowo',answer:'Witaj!'},{input:'witaj królowo',answer:'Witaj!'}]});
  await fs.writeFile(holdout,JSON.stringify([{input:'cześć',answer:'Witaj!'},{input:'status',answer:'Status RX.'}]));
  process.env.SUPABASE_URL='https://rxcloud-staging-test.supabase.co';
  process.env.RX_QUEEN_LOCAL_TOKEN='z'.repeat(40);
  process.env.RX_BIBI_TRAINING_FILE=training;
  process.env.RX_BIBI_HISTORY_FILE=history;
  process.env.RX_BIBI_HOLDOUT_FILE=holdout;
  server=await start({port:0,host:'127.0.0.1'});
  const url='http://127.0.0.1:'+server.address().port+'/__rxcloud/bibi/training-preview';
  assert.equal((await fetch(url)).status,401);
  const headers={Authorization:'Bearer '+'z'.repeat(40)};
  assert.equal((await fetch(url,{method:'POST',headers})).status,405);
  const response=await fetch(url,{headers});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.deepEqual(body,{ok:true,mode:'read-only',total:2,correct:1,incorrect:1,pending:1,accuracy:0.5});
  assert.equal(JSON.stringify(body).includes('królowo'),false);
  assert.equal(JSON.stringify(body).includes('Witaj'),false);
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  for(const [k,v] of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
  await fs.rm(dir,{recursive:true,force:true});
 }
});
