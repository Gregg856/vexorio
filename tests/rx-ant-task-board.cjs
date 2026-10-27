'use strict';
const assert=require('node:assert/strict');
const {buildBoard,buildCosmosQueue}=require('../rx-ant-task-board.cjs');
const {allocate}=require('../rx-bibi-budget.cjs');
const issues=[
 {source:'panel',action:'inspect',target:'panel.js',priority:'medium'},
 {source:'cloud',action:'inspect',target:'test.cjs',priority:'high'},
 {source:'panel',action:'inspect',target:'panel.js',priority:'high'}
];
const board=buildBoard({kind:'rx-queen-ant-supervisor',issues});
assert.equal(board.totalUnique,2);
assert.equal(board.tasks[0].source,'cloud');
assert.equal(board.tasks[1].priority,'high');
assert.equal(board.autoFixesApplied,0);
assert.equal(allocate(board,{maxTasks:1}).planned.length,1);
assert.equal(allocate(board,{maxTasks:1}).deferred.length,1);
assert.equal(buildBoard({kind:'rx-queen-ant-supervisor',issues},{maxTasks:1}).overflow,1);
assert.throws(()=>buildBoard({kind:'wrong',issues}),/Invalid supervisor/);
assert.throws(()=>buildBoard({kind:'rx-queen-ant-supervisor',issues:[{source:'x',action:'a',target:'t',priority:'unknown'}]}),/Invalid issue/);
const memory={kind:'rx-signal-memory',entries:[{key:JSON.stringify(['panel','inspect','panel.js']),seen:3,lastRun:'run3'}]};
const prioritized=buildBoard({kind:'rx-queen-ant-supervisor',issues:[{source:'panel',action:'inspect',target:'panel.js',priority:'low'},{source:'cloud',action:'inspect',target:'test.cjs',priority:'medium'}]},{memory});
assert.equal(prioritized.tasks[0].source,'panel');
assert.equal(prioritized.tasks[0].priority,'high');
assert.equal(prioritized.tasks[0].historyOccurrences,3);
assert.equal(prioritized.tasks[0].recurrent,true);
assert.equal(prioritized.tasks[0].requiresApproval,true);
assert.throws(()=>buildBoard({kind:'rx-queen-ant-supervisor',issues:[]},{memory:{kind:'wrong',entries:[]}}),/Invalid RX MEMORY/);
const cosmos=buildCosmosQueue(board,{maxTasks:1});
assert.equal(cosmos.planned.length,1);
assert.equal(cosmos.deferred,1);
assert.equal(cosmos.deferredTasks.length,1);
assert.equal(cosmos.deferredTasks[0].status,'deferred');
assert.equal(cosmos.priorityCounts.high,2);
assert.equal(cosmos.planned[0].requiresApproval,true);
assert.equal(cosmos.executed,0);
assert.throws(()=>buildCosmosQueue(board,{maxTasks:21}),/Invalid COSMOS queue/);
const shuffled=buildCosmosQueue({kind:'rx-ant-task-board',tasks:[{source:'z',action:'inspect',target:'z.js',priority:'low',requiresApproval:true},{source:'a',action:'inspect',target:'a.js',priority:'critical',requiresApproval:true}]},{maxTasks:1});
assert.equal(shuffled.planned[0].source,'a');
assert.equal(shuffled.deferredTasks[0].source,'z');
assert.deepEqual(buildCosmosQueue(board,{maxTasks:0}).planned,[]);
assert.throws(()=>buildCosmosQueue({kind:'rx-ant-task-board',tasks:[{source:'x',action:'run',target:'x',priority:'high',requiresApproval:false}]}),/Invalid COSMOS task/);
assert.throws(()=>buildCosmosQueue({kind:'rx-ant-task-board',tasks:[board.tasks[0],board.tasks[0]]}),/Duplicate COSMOS task/);
console.log('PASS RX ANT TASK BOARD: priority, deduplication, bounded tasks');
