'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {CHALLENGES,evaluateGap}=require('./rx-queen-semantic-gap.cjs');
test('semantic-gap evaluation exposes current rule-based limitations',()=>{
 const r=evaluateGap();
 assert.equal(r.total,CHALLENGES.length);
 assert.equal(r.constraintsFailed,4);
 assert.equal(r.constraintsMet,0);
 assert.equal(r.semanticUnderstandingVerified,false);
 assert.equal(r.modelWeightsUpdated,false);
 assert.ok(r.results.every(x=>x.productionConnected===false));
});
test('generic phrase examiner can pass while a specific instruction fails',()=>{
 const r=evaluateGap();
 assert.ok(r.results.some(x=>x.genericExamPassed&&!x.meetsConstraint));
});
