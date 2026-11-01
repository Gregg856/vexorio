'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {CHALLENGES,evaluateGap}=require('./rx-queen-semantic-gap.cjs');
test('surface constraints pass while semantic rewrite remains unresolved',()=>{
 const r=evaluateGap();
 assert.equal(r.total,CHALLENGES.length);
 assert.equal(r.constraintsFailed,1);
 assert.equal(r.constraintsMet,3);
 assert.equal(r.semanticUnderstandingVerified,false);
 assert.equal(r.modelWeightsUpdated,false);
 assert.ok(r.results.every(x=>x.productionConnected===false));
});
test('unverified semantic rewriting is not counted as successful',()=>{
 const r=evaluateGap();
 assert.equal(r.results.find(x=>x.id==='no-verbatim').meetsConstraint,false);
 assert.equal(r.results.find(x=>x.id==='no-verbatim').semanticRewriteClaimed,false);
 assert.equal(r.semanticUnderstandingVerified,false);
});
