'use strict';
const assert=require('node:assert/strict');
const {SETTINGS,benchmark}=require('../rx-text-training-benchmark.cjs');
const a=benchmark(),b=benchmark();
assert.deepEqual(a,b,'Training comparisons must be reproducible');
assert.equal(a.productionConnected,false);
assert.equal(a.settingsChanged,false);
assert.equal(a.runs.length,SETTINGS.length);
for(const run of a.runs){
 assert.equal(run.holdout.total,24);
 assert.equal(run.challenge.total,32);
 assert.ok(run.training.finalLoss<run.training.initialLoss);
 assert.ok(run.holdout.correct>=0&&run.holdout.correct<=24);
 assert.ok(run.challenge.correct>=0&&run.challenge.correct<=32);
}
console.log('RX OFFLINE TRAINING BENCHMARK',JSON.stringify(a.runs));
