'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {save,read}=require('../rx-bibi-training-store.cjs');
const {readHistory}=require('../rx-bibi-exercise-rotation.cjs');
const {preview,apply}=require('../rx-bibi-supervised-cycle.cjs');
const baseline={version:1,samples:[
 {input:'cześć królowo',answer:'Witaj!'},
 {input:'witaj królowo',answer:'Witaj!'},
 {input:'status serwera',answer:'Status RX.'},
 {input:'stan serwera',answer:'Status RX.'}
]};
const cases=[{input:'cześć',answer:'Witaj!'},{input:'status',answer:'Status RX.'},{input:'nowe pytanie',answer:'Nowa odpowiedź'}];
test('supervised cycle blocks regressions and only marks a successfully trained exercise',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-cycle-'));
 const trainingFile=path.join(dir,'training.json'),historyFile=path.join(dir,'history.json');
 try{
  await save(trainingFile,baseline);
  const initial=await preview(trainingFile,historyFile,cases);
  assert.equal(initial.pending.length,1);
  const exerciseId=initial.next.id;
  const bad={version:1,samples:[
   {input:'cześć królowo',answer:'Niepoprawnie'},
   {input:'witaj królowo',answer:'Niepoprawnie'},
   ...baseline.samples.slice(2),
   {input:'nowe pytanie',answer:'Nowa odpowiedź'}
  ]};
  const rejected=await apply({trainingFile,historyFile,cases,exerciseId,candidate:bad,expectedCurrent:baseline});
  assert.equal(rejected.saved,false);
  assert.equal(rejected.exerciseCompleted,false);
  assert.deepEqual(await read(trainingFile),baseline);
  assert.equal((await readHistory(historyFile)).completed.length,0);
  const good={version:1,samples:[...baseline.samples,{input:'nowe pytanie',answer:'Nowa odpowiedź'}]};
  const accepted=await apply({trainingFile,historyFile,cases,exerciseId,candidate:good,expectedCurrent:baseline});
  assert.equal(accepted.saved,true);
  assert.equal(accepted.exerciseCompleted,true);
  assert.equal(accepted.remaining,0);
  assert.equal((await readHistory(historyFile)).completed.length,1);
  assert.equal((await preview(trainingFile,historyFile,cases)).report.correct,3);
  await assert.rejects(apply({trainingFile,historyFile,cases,exerciseId,candidate:good,expectedCurrent:baseline}),/Exercise is not pending/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
