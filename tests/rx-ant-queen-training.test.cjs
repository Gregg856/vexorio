'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {prepareAntBatch}=require('../rx-ant-queen-training.cjs');
const reviews=[['nowe pozdrowienie','greeting'],['kontrola repozytorium','tests'],['odtworzenie ustaleń','memory'],['obliczenie ilorazu','math']].map(([text,label],i)=>({text,label,humanApproved:true,testReference:'review-1234'+i}));
const validation=[['serdeczne przywitanie','greeting'],['przeprowadź inspekcję','tests'],['przywołaj dawny plan','memory'],['wylicz sumę liczb','math']];
test('ants prepare only approved and deduplicated training samples',()=>{
 const batch=prepareAntBatch({reviews,validation});
 assert.equal(batch.training.length,4);
 assert.ok(batch.training.every(x=>x.approvedForTraining));
 assert.throws(()=>prepareAntBatch({reviews:[{...reviews[0],humanApproved:false},...reviews.slice(1)],validation}),/Unapproved/);
 assert.throws(()=>prepareAntBatch({reviews:[...reviews.slice(0,3),reviews[0]],validation}),/Duplicate/);
});
