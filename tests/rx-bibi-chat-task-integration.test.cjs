'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {start}=require('../rx-bibi-local-chat-adapter.cjs');
const {saveTasks,readTasks}=require('../rx-bibi-task-store.cjs');
const {createBrainMemory}=require('../rx-brain-memory.cjs');
const {saveBrain,learnAndSaveBrain}=require('../rx-brain-store.cjs');
function ask(port,message,history){
 return new Promise((resolve,reject)=>{
  const req=http.request({hostname:'127.0.0.1',port,path:'/chat',method:'POST',headers:{'Content-Type':'application/json'}},res=>{
   let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(body)}));
  });
  req.on('error',reject);
  req.end(JSON.stringify({source:'rx-bibi-learning-test',message,...(history?{history}:{})}));
 });
}
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rx-bibi-chat-tasks-'));
 const taskFile=path.join(dir,'tasks.json');
 let server;
 try{
  saveTasks(taskFile,[{title:'Naprawa panelu RX',status:'completed'},{title:'Test czatu',status:'pending'}]);
  server=await start({taskFile,knowledgeLookup:async()=>({summary:'Ryż to zboże.',url:'https://pl.wikipedia.org/wiki/Ry%C5%BC'})});
  const port=server.address().port;
  const knowledge=await ask(port,'Co to jest ryż?');
  assert.equal(knowledge.status,200);
  assert.match(knowledge.reply,/Ryż to zboże/);
  assert.match(knowledge.reply,/Źródło:/);
  assert.equal(knowledge.executed,0);
  const first=await ask(port,'Co już zrobione?');
  assert.equal(first.status,200);
  assert.match(first.reply,/Naprawa panelu RX/);
  assert.doesNotMatch(first.reply,/Test czatu/);
  assert.equal(first.executed,0);
  saveTasks(taskFile,[{title:'Test czatu',status:'completed'}]);
  const second=await ask(port,'Co już zrobione?');
  assert.match(second.reply,/Test czatu/);
  assert.doesNotMatch(second.reply,/Naprawa panelu RX/);
  assert.equal(second.executed,0);
  saveTasks(taskFile,[{title:'Naprawa czatu Android',status:'completed'},{title:'Test czatu',status:'pending'}]);
  const pending=await ask(port,'Co zostało do zrobienia?');
  assert.equal(pending.status,200);
  assert.match(pending.reply,/Test czatu/);
  assert.doesNotMatch(pending.reply,/Naprawa czatu Android/);
  assert.equal(pending.executed,0);
  const pendingStatus=await ask(port,'Jaki status zadania: Test czatu');
  assert.match(pendingStatus.reply,/oczekujące/);
  const completedStatus=await ask(port,'Sprawdź status zadania: NAPRAWA  CZATU ANDROID');
  assert.match(completedStatus.reply,/ukończone/);
  const missingStatus=await ask(port,'Jaki status zadania: Nieznane zadanie');
  assert.match(missingStatus.reply,/Nie znalazłam/);
  assert.equal(completedStatus.executed,0);
  const related=await ask(port,'Czy to zadanie już było: Poprawienie czatu na telefonie');
  assert.equal(related.status,200);
  assert.match(related.reply,/Naprawa czatu Android/);
  assert.match(related.reply,/ręcznej weryfikacji/);
  assert.equal(related.executed,0);
  const exact=await ask(port,'Czy to zadanie już było: NAPRAWA  CZATU ANDROID');
  assert.match(exact.reply,/tej samej nazwie/);
  const unrelated=await ask(port,'Czy to zadanie już było: Rozliczenie ogrodu');
  assert.match(unrelated.reply,/Nie znalazłam/);
  assert.deepEqual(readTasks(taskFile).map(t=>t.status),['completed','pending']);
  // RX #622: exercise existing chat HTTP endpoint with persisted brain memory.
  const memoryFile=path.join(dir,'brain.json');
  const brain=createBrainMemory();
  brain.learn({key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified offline chat test 622'});
  await saveBrain(memoryFile,brain);
  const memoryServer=await start({memoryFile});
  try{
   const remembered=await ask(memoryServer.address().port,'Co pamiętasz o zadaniu: android_chat');
   assert.equal(remembered.status,200);
   assert.match(remembered.reply,/inspect_logs/);
   assert.equal(remembered.executed,0);
   const unknown=await ask(memoryServer.address().port,'Co pamiętasz o zadaniu: missing_key');
   assert.equal(unknown.status,200);
   assert.doesNotMatch(unknown.reply,/inspect_logs/);
  }finally{await new Promise((resolve,reject)=>memoryServer.close(e=>e?reject(e):resolve()));}
  await learnAndSaveBrain(memoryFile,{key:'restart_chat',action:'check_health',success:true,evidence:'Verified offline restart test 623'});
  const restarted=await start({memoryFile});
  try{
   const response=await ask(restarted.address().port,'Co pamiętasz o zadaniu: restart_chat');
   assert.equal(response.status,200);
   assert.match(response.reply,/check_health/);
   assert.equal(response.executed,0);
   const earlier=await ask(restarted.address().port,'Co pamiętasz o zadaniu: android_chat');
   assert.match(earlier.reply,/inspect_logs/);
  }finally{await new Promise((resolve,reject)=>restarted.close(e=>e?reject(e):resolve()));}
  await assert.rejects(learnAndSaveBrain(memoryFile,{key:'restart_chat',action:'check_health',success:true,evidence:'Verified offline restart test 623'}),/Duplicate learning evidence/);
  const contextual=await ask(port,'A chmura?',['Sprawdź testy','Sprawdzam testy','Gotowe','Dobrze']);
  assert.equal(contextual.status,200);
  assert.equal(contextual.executed,0);
  const invalidContext=await ask(port,'Dalej',Array(7).fill('Sprawdź testy'));
  assert.equal(invalidContext.status,400);
  console.log('RX BIBI level 8: local chat reads updated persistent task register');
 }finally{
  if(server)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
  fs.rmSync(dir,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
