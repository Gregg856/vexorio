'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {trainQueen}=require('../rx-queen-training-selection.cjs');
const validation=[['serdecznie pozdrawiam','greeting'],['przeanalizuj kontrolę','tests'],['przywołaj stare zadania','memory'],['wyznacz sumę wartości','math']];
test('Queen trains multiple neural candidates and selects only on separate validation',()=>{
 const r=trainQueen({validation});
 assert.equal(r.candidates.length,5);
 assert.equal(r.selected.correct,Math.max(...r.candidates.map(x=>x.correct)));
 assert.equal(r.benchmarkSetsUntouched,true);
 assert.equal(r.productionConnected,false);
});
test('Queen refuses benchmark leakage and overlapping training',()=>{
 assert.throws(()=>trainQueen({validation:[...validation.slice(0,3),['witaj królowo','greeting']]}),/leakage/);
 assert.throws(()=>trainQueen({validation,approvedTraining:[[{text:'serdecznie pozdrawiam',approvedForTraining:true},'greeting']]}),/leakage/);
});
