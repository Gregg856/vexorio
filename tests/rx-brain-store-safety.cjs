'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {loadBrain,saveBrain,learnAndSaveBrain}=require('../rx-brain-store.cjs');
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

test('RX NAUKA 4.0 preserves all concurrent verified updates in one process',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-brain-learning-'));
 try{
  const file=path.join(dir,'memory.json');
  const updates=Array.from({length:20},(_,i)=>({
   key:'android_chat',action:'inspect_logs',success:i%4!==0,
   evidence:'Verified Android CI evidence run '+String(i).padStart(3,'0')
  }));
  const results=await Promise.all(updates.map(item=>learnAndSaveBrain(file,item)));
  assert.equal(results.length,20);
  const record=(await loadBrain(file)).recommend('android_chat');
  assert.equal(record.samples,20);
  assert.equal(record.successRate,0.75);
  assert.equal(record.requiresApproval,true);
  await assert.rejects(learnAndSaveBrain(file,updates[0]),/Duplicate learning evidence|Conflicting action/);
  const after=(await loadBrain(file)).recommend('android_chat');
  assert.equal(after.samples,20);
  await learnAndSaveBrain(file,{key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified Android CI recovery run 021'});
  assert.equal((await loadBrain(file)).recommend('android_chat').samples,21);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});

test('RX NAUKA 4.1 BIBI reads persisted evidence without writing or executing',async()=>{
 const {chatRXWithStoredMemory}=require('../rx-brain-chat-engine.cjs');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-brain-chat-'));
 try{
  const file=path.join(dir,'memory.json');
  await learnAndSaveBrain(file,{key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified Android CI chat run 401'});
  const before=await fs.readFile(file,'utf8');
  const reply=await chatRXWithStoredMemory('Co pamiętasz o zadaniu: android_chat?',{memoryFile:file});
  assert.match(reply.answer,/inspect_logs/);
  assert.match(reply.answer,/wymaga zatwierdzenia/);
  assert.equal(reply.executed,0);
  assert.equal(await fs.readFile(file,'utf8'),before);
  const unknown=await chatRXWithStoredMemory('Co pamiętasz o zadaniu: android_chat?',{memoryFile:path.join(dir,'missing.json')});
  assert.match(unknown.answer,/Nie mam zweryfikowanych doświadczeń/);
  await fs.writeFile(file,'not-json');
  await assert.rejects(chatRXWithStoredMemory('Co pamiętasz o zadaniu: android_chat?',{memoryFile:file}));
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
