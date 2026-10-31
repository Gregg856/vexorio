// RX NAUKA 4.3 — real persisted memory -> existing BIBI chat integration.
// Run: node --test tests/rx-nauka-4-3-engine.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {learnAndSaveBrain}=require('../rx-brain-store.cjs');
const {chatRXWithStoredMemory}=require('../rx-brain-chat-engine.cjs');

test('verified experience survives disk reload and informs existing chat without execution',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-nauka-43-'));
 try{
  const file=path.join(dir,'brain.json');
  await learnAndSaveBrain(file,{key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified test evidence for RX NAUKA 4.3'});
  const before=await fs.readFile(file,'utf8');
  const response=await chatRXWithStoredMemory('Co pamiętasz o zadaniu: android_chat?',{memoryFile:file});
  assert.match(response.answer,/inspect_logs/);
  assert.match(response.answer,/wymaga zatwierdzenia/);
  assert.equal(response.executed,0);
  assert.equal(await fs.readFile(file,'utf8'),before);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('missing stored experience never fabricates a recommendation',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-nauka-43-missing-'));
 try{
  const response=await chatRXWithStoredMemory('Co pamiętasz o zadaniu: unknown?',{memoryFile:path.join(dir,'missing.json')});
  assert.match(response.answer,/Nie mam zweryfikowanych doświadczeń/);
  assert.equal(response.executed,0);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('corrupt memory is rejected rather than silently trusted',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-nauka-43-corrupt-'));
 try{
  const file=path.join(dir,'brain.json');
  await fs.writeFile(file,'{broken');
  await assert.rejects(chatRXWithStoredMemory('Co pamiętasz o zadaniu: android_chat?',{memoryFile:file}));
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
