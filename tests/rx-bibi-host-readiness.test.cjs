'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {inspect}=require('../deploy/rx-bibi-host-readiness.cjs');
test('read-only host diagnostic distinguishes absent configuration from valid curriculum',async()=>{
 const missing=await inspect({});
 assert.equal(missing.curriculum,'not-configured');
 assert.equal(missing.readyForManualStart,false);
 assert.equal(missing.modelEnabled,false);
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-bibi-ready-'));
 try{
  const file=path.join(dir,'training.json');
  await fs.writeFile(file,JSON.stringify({version:1,samples:[{input:'cześć',answer:'Witaj'},{input:'witaj',answer:'Witaj'}]}));
  const ready=await inspect({RX_BIBI_TRAINING_FILE:file,RX_BIBI_MODEL_PORT:'0',RX_BIBI_MODEL_ENABLED:'true'});
  assert.equal(ready.curriculum,'valid');
  assert.equal(ready.sampleCount,2);
  assert.equal(ready.modelPortConfigured,false);
  assert.equal(ready.readyForManualStart,false);
  assert.equal(ready.modelEnabled,true);
  assert.equal(ready.modelFirstEnabled,false);
  assert.equal(JSON.stringify(ready).includes(file),false,'Never leak training path');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
