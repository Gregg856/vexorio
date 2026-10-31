'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {read,save,evaluate,validate}=require('../rx-bibi-training-store.cjs');
const samples=[
 {input:'cześć królowo',answer:'Witaj!'},
 {input:'witaj królowo',answer:'Witaj!'},
 {input:'status serwera',answer:'Sprawdź stan RX CLOUD.'},
 {input:'stan serwera',answer:'Sprawdź stan RX CLOUD.'}
];
test('atomic versioned training data survives reload without duplicate examples',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-bibi-training-'));
 const file=path.join(dir,'training.json');
 try{
  await save(file,{version:1,samples});
  assert.deepEqual(await read(file),{version:1,samples});
  await assert.rejects(save(file,{version:1,samples:[...samples,samples[0]]}),/Duplicate training input/);
  assert.deepEqual(await read(file),{version:1,samples},'Invalid update must preserve saved curriculum');
  await assert.rejects(save(file,{version:2,samples}),/Invalid curriculum version/);
  const names=await fs.readdir(dir);
  assert.deepEqual(names,['training.json'],'Atomic save must clean temporary files');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('holdout evaluation measures correct, wrong and abstained responses',()=>{
 const report=evaluate(samples,[
  {input:'cześć',answer:'Witaj!'},
  {input:'status',answer:'Sprawdź stan RX CLOUD.'},
  {input:'nieznane pytanie',answer:'Witaj!'},
  {input:'status',answer:'Witaj!'}
 ]);
 assert.equal(report.total,4);
 assert.equal(report.correct,2);
 assert.equal(report.abstained,1);
 assert.equal(report.accuracy,0.5);
 assert.equal(report.results[3].correct,false);
 assert.throws(()=>validate({version:1,samples:[...samples,samples[0]]}),/Duplicate training input/);
});
