'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {CASES,evaluate}=require('./rx-queen-writing-heldout.cjs');
const {CURRICULUM}=require('./rx-queen-writing-reviewed-batch.cjs');
test('held-out cases do not overlap the scheduled curriculum',()=>{
 const known=new Set(CURRICULUM.map(x=>x.mode+'|'+x.prompt.trim().toLocaleLowerCase('pl')));
 assert.equal(CASES.length,6);
 assert.ok(CASES.every(x=>!known.has(x.mode+'|'+x.prompt.trim().toLocaleLowerCase('pl'))));
});
test('unseen writing prompts produce independently examined offline outputs',()=>{
 const report=evaluate();
 assert.equal(report.cases,6);
 assert.equal(report.passed,6);
 assert.equal(report.failed,0);
 assert.equal(report.semanticAccuracyVerified,false);
 assert.equal(report.modelWeightsUpdated,false);
 assert.ok(report.results.every(x=>x.passed&&x.productionConnected===false&&x.semanticAccuracyVerified===false));
});
