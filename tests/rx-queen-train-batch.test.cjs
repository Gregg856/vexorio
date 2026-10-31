'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {trainQueenFromBatch}=require('../rx-queen-train-batch.cjs');
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
  assert.equal(result.productionConnected,false);
  training[0].approvedForTraining=false;
  await fs.writeFile(file,JSON.stringify({schema:1,approvedForTraining:true,training,validation}));
  await assert.rejects(trainQueenFromBatch(file),/not approved/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
