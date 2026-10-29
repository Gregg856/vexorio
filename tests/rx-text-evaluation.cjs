'use strict';
const assert=require('node:assert/strict');
const {HOLDOUT,evaluate}=require('../rx-text-evaluation.cjs');
const {LABELS}=require('../rx-text-learner.cjs');
const report=evaluate({epochs:120});
assert.equal(report.sampleCount,24);
assert.equal(report.cases.length,24);
assert.ok(report.accuracy>=0&&report.accuracy<=1);
// Regression guard for the reproducible 120-epoch held-out evaluation.
assert.ok(report.correct>=15,`RX model regression: ${report.correct}/24 (minimum 15/24)`);
assert.equal(report.correct,report.cases.filter(x=>x.correct).length);
assert.equal(report.productionConnected,false);
for(const label of LABELS)assert.equal(Object.values(report.confusion[label]).reduce((a,b)=>a+b,0),6);
assert.equal(new Set(HOLDOUT.map(x=>x[0])).size,24);
assert.ok(report.training.finalLoss<report.training.initialLoss);
console.log('PASS RX TEXT HELDOUT EVALUATION',report.correct+'/'+report.sampleCount);
