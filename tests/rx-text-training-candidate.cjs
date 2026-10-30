'use strict';
const assert=require('node:assert/strict');
const {EXTRAS,WAVE2,compare,compareWave2,diagnoseWave2}=require('../rx-text-training-candidate.cjs');
const {HOLDOUT,CHALLENGE}=require('../rx-text-evaluation.cjs');
const norm=s=>s.normalize('NFC').toLocaleLowerCase('pl').trim();
const seen=new Set([...HOLDOUT,...CHALLENGE].map(x=>norm(x[0])));
assert.equal(EXTRAS.length,24);
for(const [phrase] of EXTRAS)assert.ok(!seen.has(norm(phrase)),'Evaluation leakage: '+phrase);
const a=compare();assert.deepEqual(a,compare());
assert.equal(a.productionConnected,false);
assert.equal(a.trainingSamples,48);
for(const score of [a.baseline,a.candidate]){
 assert.ok(score.holdout>=0&&score.holdout<=24);
 assert.ok(score.challenge>=0&&score.challenge<=32);
}
console.log('RX TRAINING CANDIDATE',JSON.stringify(a));

assert.equal(WAVE2.length,16);
const existing=new Set(EXTRAS.map(x=>norm(x[0])));
for(const [phrase] of WAVE2){
 assert.ok(!seen.has(norm(phrase)),'Evaluation leakage: '+phrase);
 assert.ok(!existing.has(norm(phrase)),'Duplicate training phrase: '+phrase);
}
const b=compareWave2();
assert.deepEqual(b,compareWave2());
assert.equal(b.trainingSamples,64);
assert.equal(b.productionConnected,false);
assert.deepEqual(b.previous,a.candidate);
console.log('RX TRAINING WAVE2',JSON.stringify(b));

const diagnosis=diagnoseWave2();
assert.equal(diagnosis.trainingSamples,64);
assert.equal(diagnosis.productionConnected,false);
for(const [setName,total] of [['holdout',24],['challenge',32]]){
 const rows=Object.values(diagnosis[setName]);
 assert.equal(rows.reduce((sum,row)=>sum+row.total,0),total);
 assert.equal(rows.reduce((sum,row)=>sum+row.correct,0),b.candidate[setName]);
 assert.equal(rows.reduce((sum,row)=>sum+row.errors.length,0),total-b.candidate[setName]);
}
console.log('RX WAVE2 DIAGNOSIS',JSON.stringify(diagnosis));
