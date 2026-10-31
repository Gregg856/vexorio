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

test('duplicate evidence does not inflate learned success counts',()=>{
 const brain=createBrainMemory();
 const record={key:'ci_failure',action:'inspect_tests',success:true,evidence:'Verified GitHub run 12345678'};
 brain.learn(record);
 assert.throws(()=>brain.learn(record),/Duplicate learning evidence/);
 const result=brain.recommend('ci_failure');
 assert.equal(result.samples,1);
 assert.equal(result.successRate,1);
 assert.equal(result.requiresApproval,true);
});

test('RX NAUKA 3.4 labels weak evidence and repeated failures without executing',()=>{
 const brain=createBrainMemory();
 brain.learn({key:'android_chat',action:'inspect_logs',success:false,evidence:'Verified Android test failure run 001'});
 let advice=brain.recommend('android_chat');
 assert.equal(advice.confidence,'insufficient');
 assert.equal(advice.warning,'more_failures_than_successes');
 brain.learn({key:'android_chat',action:'inspect_logs',success:false,evidence:'Verified Android test failure run 002'});
 brain.learn({key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified Android test success run 003'});
 advice=brain.recommend('android_chat');
 assert.equal(advice.confidence,'limited');
 assert.equal(advice.warning,'more_failures_than_successes');
 for(let i=4;i<=10;i++)brain.learn({key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified Android test success run '+i});
 advice=brain.recommend('android_chat');
 assert.equal(advice.confidence,'observed');
 assert.equal(advice.warning,null);
 assert.equal(advice.requiresApproval,true);
 assert.equal(brain.snapshot().autoExecuted,0);
});

test('RX NAUKA 3.6 blocks sample overflow and preserves original evidence',()=>{
 const brain=createBrainMemory({initialRecords:[{key:'android_chat',action:'inspect_logs',successes:1000000,failures:0,lastEvidence:'Verified Android baseline evidence'}]});
 const before=brain.snapshot();
 assert.throws(()=>brain.learn({key:'android_chat',action:'inspect_logs',success:true,evidence:'Verified Android new test result'}),/Learning sample limit reached/);
 assert.deepEqual(brain.snapshot(),before);
 assert.equal(brain.recommend('android_chat').samples,1000000);
 assert.equal(brain.snapshot().autoExecuted,0);
});
