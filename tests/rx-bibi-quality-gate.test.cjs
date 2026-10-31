'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {save,read}=require('../rx-bibi-training-store.cjs');
const {compare,approve}=require('../rx-bibi-quality-gate.cjs');
const baseline={version:1,samples:[
 {input:'cześć królowo',answer:'Witaj!'},
 {input:'witaj królowo',answer:'Witaj!'},
 {input:'status serwera',answer:'Status RX.'},
 {input:'stan serwera',answer:'Status RX.'}
]};
const cases=[{input:'cześć',answer:'Witaj!'},{input:'status',answer:'Status RX.'}];
test('reject regression and preserve existing training file',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-quality-'));
 const file=path.join(dir,'training.json');
 try{
  await save(file,baseline);
  const bad={version:1,samples:[
   {input:'cześć królowo',answer:'Inna odpowiedź'},
   {input:'witaj królowo',answer:'Inna odpowiedź'},
   {input:'status serwera',answer:'Status RX.'},
   {input:'stan serwera',answer:'Status RX.'}
  ]};
  const result=await approve(file,bad,cases,{expectedCurrent:baseline});
  assert.equal(result.saved,false);
  assert.equal(result.regressions.length,1);
  assert.deepEqual(await read(file),baseline);
  const good={version:1,samples:[...baseline.samples,{input:'nowe pytanie',answer:'Nowa odpowiedź'}]};
  const accepted=await approve(file,good,cases,{expectedCurrent:baseline});
  assert.equal(accepted.saved,true);
  assert.equal(accepted.before.correct,accepted.after.correct);
  assert.deepEqual(await read(file),good);
  await assert.rejects(approve(file,baseline,cases,{expectedCurrent:baseline}),/Curriculum changed/);
  await assert.rejects(approve(file,baseline,cases),/Expected current/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('report counts improvements without hiding failures',()=>{
 const next={version:1,samples:[...baseline.samples,{input:'nowe pytanie',answer:'Nowa odpowiedź'}]};
 const result=compare(baseline,next,[...cases,{input:'nowe',answer:'Nowa odpowiedź'}]);
 assert.equal(result.before.correct,2);
 assert.equal(result.after.correct,3);
 assert.equal(result.improvements.length,1);
 assert.equal(result.regressions.length,0);
 assert.equal(result.accepted,true);
});
