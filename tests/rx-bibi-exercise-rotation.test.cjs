'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {select,readHistory,markCompleted}=require('../rx-bibi-exercise-rotation.cjs');
const samples=[{input:'cześć królowo',answer:'Witaj!'},{input:'witaj królowo',answer:'Witaj!'}];
const cases=[{input:'cześć',answer:'Witaj!'},{input:'status',answer:'Status RX.'},{input:'nowy temat',answer:'Inna odpowiedź'}];
test('only failed holdout cases are queued and completed exercises do not repeat after reload',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-rotation-'));
 const file=path.join(dir,'history.json');
 try{
  let history=await readHistory(file);
  let result=select(samples,cases,history);
  assert.equal(result.report.correct,1);
  assert.equal(result.queue.length,2);
  assert.equal(result.next.input,'status');
  await markCompleted(file,result.next.id);
  history=await readHistory(file);
  result=select(samples,cases,history);
  assert.equal(result.next.input,'nowy temat');
  await markCompleted(file,result.next.id);
  result=select(samples,cases,await readHistory(file));
  assert.equal(result.next,null);
  assert.equal(result.exhausted,true);
  assert.equal(result.report.correct,1,'Marking done does not pretend model learned');
  await markCompleted(file,history.completed[0]);
  assert.equal((await readHistory(file)).completed.length,2,'No repeated completed ids');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('reject invalid history and invalid ids',async()=>{
 assert.throws(()=>select(samples,cases,{completed:'bad'}),/Invalid exercise history/);
 await assert.rejects(markCompleted('/tmp/unused','bad'),/Invalid exercise id/);
});
