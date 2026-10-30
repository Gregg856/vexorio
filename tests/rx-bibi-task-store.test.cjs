'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {readTasks,saveTasks}=require('../rx-bibi-task-store.cjs');
const {chatRX}=require('../rx-brain-chat-engine.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rx-bibi-store-'));
try{
 const file=path.join(dir,'tasks.json');
 assert.deepEqual(readTasks(file),[]);
 const tasks=[{title:'Naprawa czatu Android',status:'completed'},{title:'Test panelu',status:'pending'}];
 assert.equal(saveTasks(file,tasks),2);
 assert.deepEqual(readTasks(file),tasks);
 const response=chatRX('Co już zrobione?',{tasks:readTasks(file)});
 assert.match(response.answer,/Naprawa czatu Android/);
 assert.doesNotMatch(response.answer,/Test panelu/);
 assert.equal(response.completedCount,1);
 assert.equal(response.executed,0);
 assert.throws(()=>saveTasks(file,[{title:'Zadanie',status:'verified'}]),/Invalid tasks/);
 assert.deepEqual(readTasks(file),tasks);
 fs.writeFileSync(file,'{broken json');
 assert.throws(()=>readTasks(file),SyntaxError);
 console.log('RX BIBI level 7: persistence, reload, validation and corrupt file tests passed');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
