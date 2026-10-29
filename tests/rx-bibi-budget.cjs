'use strict';
const assert=require('node:assert/strict');
const {allocate,enforceLimits}=require('../rx-bibi-budget.cjs');
const board={kind:'rx-ant-task-board',tasks:Array.from({length:40},(_,i)=>({action:'inspect',target:String(i)}))};
const result=allocate(board,{maxTasks:30});
assert.equal(result.planned.length,30);
assert.equal(result.deferred.length,10);
assert.equal(result.autoExecuted,0);
assert.equal(result.actualProviderUsage,null);
assert.throws(()=>allocate(board,{maxTasks:101}),/Invalid/);
console.log('PASS RX BIBI BUDGET');
const limited=enforceLimits({kind:'rx-ant-task-board',tasks:[
 {source:'A',priority:'high',id:1},{source:'A',priority:'high',id:2},
 {source:'A',priority:'low',id:3},{source:'B',priority:'high',id:4},
 {source:'B',priority:'low',id:5}
]},{maxTasks:3,maxPerSource:2,maxHighPriority:2});
assert.deepEqual(limited.planned.map(t=>t.id),[1,2,5]);
assert.deepEqual(limited.deferred.map(t=>t.reason),['source-limit','priority-limit']);
assert.equal(limited.autoExecuted,0);
assert.equal(limited.providerQuotaKnown,false);
assert.throws(()=>enforceLimits(board,{maxTasks:-1}),/Invalid/);
console.log('PASS RX MODULE 1 LIMITS');
