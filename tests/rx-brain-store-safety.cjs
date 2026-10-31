'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {loadBrain,saveBrain}=require('../rx-brain-store.cjs');
const {createBrainMemory}=require('../rx-brain-memory.cjs');

test('RX NAUKA 3.7 roundtrip and reject unsafe snapshot paths',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-brain-safety-'));
 try{
  const file=path.join(dir,'memory.json');
  const brain=createBrainMemory();
  brain.learn({key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified Android regression run 101'});
  await saveBrain(file,brain);
  const loaded=await loadBrain(file);
  assert.deepEqual(loaded.snapshot(),brain.snapshot());
  const link=path.join(dir,'memory-link.json');
  await fs.symlink(file,link);
  await assert.rejects(loadBrain(link),/Invalid snapshot file/);
  await assert.rejects(loadBrain(dir),/Invalid snapshot file/);
  const missing=await loadBrain(path.join(dir,'missing.json'));
  assert.equal(missing.snapshot().records.length,0);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
