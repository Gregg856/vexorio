// RX NAUKA 4.4 — safe read-only memory integration boundary tests.
// Run: node --test tests/rx-nauka-4-4.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {learnAndSaveBrain}=require('../rx-brain-store.cjs');
const {chatRXWithStoredMemory}=require('../rx-brain-chat-engine.cjs');
async function withMemory(fn){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-44-'));
 try{await fn(path.join(dir,'memory.json'));}finally{await fs.rm(dir,{recursive:true,force:true});}
}
test('stored Brain evidence is read-only across repeated chat requests',async()=>withMemory(async file=>{
 await learnAndSaveBrain(file,{key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified Android test 4401'});
 const before=await fs.readFile(file,'utf8');
 const answers=await Promise.all(Array.from({length:10},()=>chatRXWithStoredMemory('Co pamiętasz o zadaniu: android_chat?',{memoryFile:file})));
 for(const reply of answers){
  assert.match(reply.answer,/inspect_logs/);
  assert.match(reply.answer,/wymaga zatwierdzenia/);
  assert.equal(reply.executed,0);
 }
 assert.equal(await fs.readFile(file,'utf8'),before);
}));
test('ordinary chat stays available when memory is empty',async()=>withMemory(async file=>{
 const reply=await chatRXWithStoredMemory('Cześć!',{memoryFile:file});
 assert.match(reply.answer,/Cześć/);
 assert.equal(reply.executed,0);
}));
test('invalid memory path is rejected before reading',async()=>{
 for(const memoryFile of [undefined,'',null,42]){
  await assert.rejects(chatRXWithStoredMemory('Cześć!',{memoryFile}),/Invalid memory path/);
 }
});
test('corrupt persisted memory fails closed',async()=>withMemory(async file=>{
 await fs.writeFile(file,'{broken json');
 await assert.rejects(chatRXWithStoredMemory('Co pamiętasz o zadaniu: android_chat?',{memoryFile:file}));
}));
