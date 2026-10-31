'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {teachFromFile}=require('../rx-brain-teach.cjs');
const {loadBrain}=require('../rx-brain-store.cjs');
test('verified observations teach persisted RX Brain and count success/failure',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-teach-'));
 try{
  const memoryFile=path.join(dir,'brain.json'),observationFile=path.join(dir,'observation.json');
  const record={verified:true,testReference:'test-run-12345',key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified by test-run-12345'};
  await fs.writeFile(observationFile,JSON.stringify(record));
  assert.equal((await teachFromFile(observationFile,{memoryFile})).samples,1);
  record.success=false;record.testReference='test-run-12346';record.evidence='Verified by test-run-12346';
  await fs.writeFile(observationFile,JSON.stringify(record));
  assert.equal((await teachFromFile(observationFile,{memoryFile})).samples,2);
  const brain=await loadBrain(memoryFile);
  assert.equal(brain.recommend('android_chat').successRate,0.5);
  await assert.rejects(teachFromFile(observationFile,{memoryFile}),/Duplicate learning evidence/);
  record.verified=false;record.testReference='test-run-12347';record.evidence='Verified by test-run-12347';
  await fs.writeFile(observationFile,JSON.stringify(record));
  await assert.rejects(teachFromFile(observationFile,{memoryFile}),/Verified test reference required/);
  assert.equal((await loadBrain(memoryFile)).recommend('android_chat').samples,2);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
