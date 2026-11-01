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
function ask(port,message,history,historyToken){
 return new Promise((resolve,reject)=>{
  const req=http.request({hostname:'127.0.0.1',port,path:'/chat',method:'POST',headers:{'Content-Type':'application/json'}},res=>{
   let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(body)}));
  });
  req.on('error',reject);
  req.end(JSON.stringify({source:'rx-bibi-learning-test',message,...(history?{history}:{}),...(historyToken?{historyToken}:{})}));
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
  assert.equal(invalidContext.code,'INVALID_REQUEST');
  const historyFile=path.join(dir,'history.json');
  const historyToken='rx-test-token-625-abcdefghijklmnopqrstuvwxyz';
  const historyServerFirst=await start({historyFile,historyToken});
  try{
   const unauthorized=await ask(historyServerFirst.address().port,'Sprawdź testy');
   assert.equal(unauthorized.status,401);
   assert.equal(unauthorized.code,'AUTH_REQUIRED');
   const saved=await ask(historyServerFirst.address().port,'Sprawdź testy',undefined,historyToken);
   assert.equal(saved.status,200);
   assert.equal(saved.executed,0);
  }finally{await new Promise(resolve=>historyServerFirst.close(resolve));}
  const historyServerSecond=await start({historyFile,historyToken});
  try{
   const followup=await ask(historyServerSecond.address().port,'A chmura?',undefined,historyToken);
   assert.equal(followup.status,200);
   assert.equal(followup.executed,0);
   assert.match(fs.readFileSync(historyFile,'utf8'),/A chmura/);
  }finally{await new Promise(resolve=>historyServerSecond.close(resolve));}
  // RX #626: both persisted conversation context and RX Brain observations survive restart.
  const combinedHistory=path.join(dir,'combined-history.json');
  const combinedToken='rx-test-token-626-abcdefghijklmnopqrstuvwxyz';
  const combinedFirst=await start({historyFile:combinedHistory,historyToken:combinedToken,memoryFile});
  try{
   const learned=await ask(combinedFirst.address().port,'Co pamiętasz o zadaniu: android_chat',undefined,combinedToken);
   assert.equal(learned.status,200);
   assert.match(learned.reply,/inspect_logs/);
   assert.equal(learned.executed,0);
  }finally{await new Promise(resolve=>combinedFirst.close(resolve));}
  const combinedSecond=await start({historyFile:combinedHistory,historyToken:combinedToken,memoryFile});
  try{
   const later=await ask(combinedSecond.address().port,'Co pamiętasz o zadaniu: restart_chat',undefined,combinedToken);
   assert.equal(later.status,200);
   assert.match(later.reply,/check_health/);
   assert.equal(later.executed,0);
   const persisted=JSON.parse(fs.readFileSync(combinedHistory,'utf8'));
   assert.ok(persisted.some(turn=>turn.includes('android_chat')));
   assert.ok(persisted.some(turn=>turn.includes('restart_chat')));
   assert.ok(persisted.length<=6);
  }finally{await new Promise(resolve=>combinedSecond.close(resolve));}
  // RX #627: preserve the last meaningful user request while rotating six saved turns.
  const rotationFile=path.join(dir,'rotation-history.json');
  const rotationToken='rx-test-token-627-abcdefghijklmnopqrstuvwxyz';
  const rotationServer=await start({historyFile:rotationFile,historyToken:rotationToken});
  try{
   for(const message of ['Naprawa czatu Android','Gotowe','Dalej','Zielone']){
    const result=await ask(rotationServer.address().port,message,undefined,rotationToken);
    assert.equal(result.status,200);
    assert.equal(result.executed,0);
   }
   const rotated=JSON.parse(fs.readFileSync(rotationFile,'utf8'));
   assert.equal(rotated.length,6);
   assert.ok(rotated.every(item=>typeof item==='string'));
   const followup=await ask(rotationServer.address().port,'Sprawdź jeszcze raz',undefined,rotationToken);
   assert.equal(followup.status,200);
   assert.equal(followup.executed,0);
   assert.match(followup.reply,/Naprawa czatu Android/);
  }finally{await new Promise(resolve=>rotationServer.close(resolve));}
  // RX #628: malformed history must fail closed without overwriting existing data.
  const damagedFile=path.join(dir,'damaged-history.json');
  fs.writeFileSync(damagedFile,'{invalid-json');
  const damagedServer=await start({historyFile:damagedFile,historyToken:combinedToken});
  try{
   const response=await ask(damagedServer.address().port,'Dalej',undefined,combinedToken);
   assert.equal(response.status,503);
   assert.equal(response.code,'HISTORY_UNAVAILABLE');
   assert.match(response.diagnostic,/plik historii/);
   assert.doesNotMatch(response.diagnostic,/rx-test-token-627/);
   assert.equal(fs.readFileSync(damagedFile,'utf8'),'{invalid-json');
  }finally{await new Promise(resolve=>damagedServer.close(resolve));}
  // Requests arriving concurrently must be serialized and persist both messages.
  const parallelFile=path.join(dir,'parallel-history.json');
  const parallelServer=await start({historyFile:parallelFile,historyToken:combinedToken});
  try{
   const responses=await Promise.all(['Sprawdź testy','Co dalej?'].map(message=>ask(parallelServer.address().port,message,undefined,combinedToken)));
   assert.ok(responses.every(result=>result.status===200&&result.executed===0));
   const saved=JSON.parse(fs.readFileSync(parallelFile,'utf8'));
   assert.equal(saved.length,4);
   assert.ok(saved.includes('Sprawdź testy'));
   assert.ok(saved.includes('Co dalej?'));
  }finally{await new Promise(resolve=>parallelServer.close(resolve));}
  console.log('RX BIBI level 8: local chat reads updated persistent task register');
 }finally{
  if(server)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
  fs.rmSync(dir,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
