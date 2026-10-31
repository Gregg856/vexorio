'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {CHALLENGES,evaluateGap}=require('./rx-queen-semantic-gap.cjs');
test('four explicit instructions now satisfy the baseline constraints',()=>{
 const r=evaluateGap();
 assert.equal(r.total,CHALLENGES.length);
 assert.equal(r.constraintsFailed,0);
 assert.equal(r.constraintsMet,4);
 assert.equal(r.semanticUnderstandingVerified,false);
 assert.equal(r.modelWeightsUpdated,false);
 assert.ok(r.results.every(x=>x.productionConnected===false));
});
test('all baseline constraints pass but semantic understanding remains unverified',()=>{
 const r=evaluateGap();
 assert.ok(r.results.every(x=>x.meetsConstraint));
 assert.equal(r.semanticUnderstandingVerified,false);
});
