'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createBrainMemory}=require('../rx-brain-memory.cjs');
test('records evidence and recommends without executing',()=>{
 const brain=createBrainMemory();
 assert.equal(brain.recommend('ci_failure').known,false);
 brain.learn({key:'ci_failure',action:'inspect_tests',success:true,evidence:'CI run passed after review'});
 brain.learn({key:'ci_failure',action:'inspect_tests',success:false,evidence:'CI run failed on retry'});
 const r=brain.recommend('ci_failure');
 assert.equal(r.successRate,0.5);
 assert.equal(r.requiresApproval,true);
 assert.equal(brain.snapshot().autoExecuted,0);
 assert.equal(brain.snapshot().trainedModel,false);
});
test('rejects invalid and conflicting records',()=>{
 const brain=createBrainMemory();
 assert.throws(()=>brain.learn({key:'bad key',action:'run',success:true,evidence:'sufficient evidence'}));
 brain.learn({key:'test',action:'inspect_tests',success:true,evidence:'sufficient evidence'});
 assert.throws(()=>brain.learn({key:'test',action:'deploy',success:true,evidence:'sufficient evidence'}));
});
