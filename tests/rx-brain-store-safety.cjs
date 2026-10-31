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

test('RX NAUKA 3.8 rejects snapshots that claim training or auto execution',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-brain-meta-'));
 try{
  const file=path.join(dir,'memory.json');
  const valid=createBrainMemory().snapshot();
  for(const changes of [{trainedModel:true},{autoExecuted:1},{trainedModel:null},{autoExecuted:null}]){
   await fs.writeFile(file,JSON.stringify({...valid,...changes}));
   await assert.rejects(loadBrain(file),/Invalid snapshot/);
  }
  await fs.writeFile(file,JSON.stringify(valid));
  assert.deepEqual((await loadBrain(file)).snapshot(),valid);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});

test('RX NAUKA 3.9 concurrent saves avoid temporary file collisions',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-brain-parallel-'));
 try{
  const a=createBrainMemory();
  const b=createBrainMemory();
  a.learn({key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified Android save test A'});
  b.learn({key:'android_chat',action:'inspect_logs',success:false,evidence:'Verified Android save test B'});
  const file=path.join(dir,'memory.json');
  await Promise.all(Array.from({length:12},(_,i)=>saveBrain(file,i%2?a:b)));
  const final=(await loadBrain(file)).snapshot();
  assert.ok([JSON.stringify(a.snapshot()),JSON.stringify(b.snapshot())].includes(JSON.stringify(final)));
  assert.deepEqual((await fs.readdir(dir)),['memory.json']);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
