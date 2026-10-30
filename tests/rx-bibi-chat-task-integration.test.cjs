'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {start}=require('../rx-bibi-local-chat-adapter.cjs');
const {saveTasks}=require('../rx-bibi-task-store.cjs');
function ask(port,message){
 return new Promise((resolve,reject)=>{
  const req=http.request({hostname:'127.0.0.1',port,path:'/chat',method:'POST',headers:{'Content-Type':'application/json'}},res=>{
   let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(body)}));
  });
  req.on('error',reject);
  req.end(JSON.stringify({source:'rx-bibi-learning-test',message}));
 });
}
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rx-bibi-chat-tasks-'));
 const taskFile=path.join(dir,'tasks.json');
 let server;
 try{
  saveTasks(taskFile,[{title:'Naprawa panelu RX',status:'completed'},{title:'Test czatu',status:'pending'}]);
  server=await start({taskFile});
  const port=server.address().port;
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
  console.log('RX BIBI level 8: local chat reads updated persistent task register');
 }finally{
  if(server)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
  fs.rmSync(dir,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
