'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {trainQueenFromBatch,convertAntReviews}=require('../rx-queen-train-batch.cjs');
test('Queen trains approved examples from a local batch without changing production',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-queen-batch-'));
 try{
  const file=path.join(dir,'batch.json');
  const training=[['serdeczne ukłony','greeting'],['sprawdzenie modułów','tests'],['przywołanie wiadomości','memory'],['mnożenie wartości','math']].map(([text,label])=>({text,label,approvedForTraining:true}));
  const validation=[['witam cię ponownie','greeting'],['skontroluj działanie','tests'],['odtwórz plan projektu','memory'],['dodaj wartości liczbowe','math']];
  await fs.writeFile(file,JSON.stringify({schema:1,approvedForTraining:true,training,validation}));
  const result=await trainQueenFromBatch(file);
  assert.equal(result.trainingExamples,4);
  assert.equal(result.candidates.length,5);
  assert.equal(result.baseline.total,4);
  assert.deepEqual(Object.keys(result.baseline.byLabel),['greeting','tests','memory','math']);
  assert.equal(Object.values(result.baseline.byLabel).reduce((n,v)=>n+v.total,0),4);
  assert.ok(result.candidates.every(c=>Object.values(c.byLabel).reduce((n,v)=>n+v.correct,0)===c.correct));
  assert.equal(result.improvement,result.selected.correct-result.baseline.correct);
  console.log('BIBI OFFLINE TRAINING METRICS',JSON.stringify({training:result.trainingExamples,validation:result.validationExamples,baseline:result.baseline,selected:result.selected,improvement:result.improvement,productionConnected:result.productionConnected}));
  assert.equal(result.productionConnected,false);
  training[0].approvedForTraining=false;
  await fs.writeFile(file,JSON.stringify({schema:1,approvedForTraining:true,training,validation}));
  await assert.rejects(trainQueenFromBatch(file),/not approved/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('existing Queen trainer accepts human-reviewed ant samples without another RX trainer',()=>{
 const reviews=[['serdeczne ukłony','greeting'],['sprawdzenie modułów','tests'],['przywołanie wiadomości','memory'],['mnożenie wartości','math']].map(([text,label],i)=>({text,label,humanApproved:true,testReference:'verified-123'+i}));
 const validation=[['witam cię ponownie','greeting'],['skontroluj działanie','tests'],['odtwórz plan projektu','memory'],['dodaj wartości liczbowe','math']];
 const batch=convertAntReviews({reviews,validation});
 assert.equal(batch.training.length,4);
 assert.ok(batch.training.every(x=>x.approvedForTraining));
 assert.throws(()=>convertAntReviews({reviews:[{...reviews[0],humanApproved:false},...reviews.slice(1)],validation}),/Unapproved/);
 assert.throws(()=>convertAntReviews({reviews:[...reviews.slice(0,3),reviews[0]],validation}),/Duplicate/);
});

test('Queen rejects validation phrases seen in its original training set',async()=>{
 const {trainQueen}=require('../rx-queen-training-selection.cjs');
 const validation=[['cześć królowo','greeting'],['skontroluj działanie','tests'],['odtwórz plan projektu','memory'],['dodaj wartości liczbowe','math']];
 assert.throws(()=>trainQueen({validation}),/Validation overlap/);
});

test('Queen keeps baseline when candidate cannot improve independent validation',()=>{
 const {trainQueen}=require('../rx-queen-training-selection.cjs');
 const validation=[['witam cię ponownie','greeting'],['skontroluj działanie','tests'],['odtwórz plan projektu','memory'],['dodaj wartości liczbowe','math']];
 const result=trainQueen({validation});
 assert.ok(result.selected.correct>=result.baseline.correct);
 assert.equal(result.improvement,Math.max(0,result.candidateImprovement));
 assert.equal(result.accepted,result.candidateImprovement>0);
 if(!result.accepted)assert.equal(result.selected.source,'baseline');
});
