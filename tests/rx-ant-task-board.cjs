'use strict';
const assert=require('node:assert/strict');
const {buildBoard,buildReviewQueue}=require('../rx-ant-task-board.cjs');
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
console.log('PASS RX ANT TASK BOARD: priority, deduplication, bounded tasks');

const queue1=buildReviewQueue(board,{runId:'ci-1'});
const queue2=buildReviewQueue(board,{previous:queue1,runId:'ci-2'});
assert.equal(queue1.tasks.length,2);
assert.equal(queue2.tasks[0].occurrences,2);
assert.equal(queue2.tasks[0].firstSeen,'ci-1');
assert.equal(queue2.tasks[0].lastSeen,'ci-2');
assert.equal(queue2.tasks[0].approved,false);
assert.equal(queue2.tasks[0].executed,false);
assert.equal(queue2.executions,0);
assert.equal(queue2.productionModified,false);
assert.equal(buildReviewQueue(buildBoard({kind:'rx-queen-ant-supervisor',issues:[]}),{previous:queue2,runId:'ci-3'}).closedSincePrevious,2);
assert.throws(()=>buildReviewQueue(board,{runId:'../unsafe'}),/Invalid RX run ID/);
console.log('PASS RX QUEEN review queue: history, closure, approval gate');

assert.throws(()=>buildReviewQueue(board,{previous:{...queue1,schema:99},runId:'ci-4'}),/Invalid prior review queue/);
assert.throws(()=>buildReviewQueue(board,{previous:{...queue1,tasks:[{...queue1.tasks[0],approved:true}]},runId:'ci-4'}),/Invalid prior queue item/);
assert.throws(()=>buildReviewQueue(board,{previous:{...queue1,tasks:[queue1.tasks[0],queue1.tasks[0]]},runId:'ci-4'}),/Invalid prior queue item/);
console.log('PASS RX QUEEN rejects corrupt, duplicate or unauthorized prior approvals');

assert.throws(()=>buildReviewQueue(board,{previous:{...queue1,tasks:[{...queue1.tasks[0],id:'wrong-id'}]},runId:'ci-4'}),/Invalid prior queue item/);
assert.throws(()=>buildReviewQueue(board,{previous:{...queue1,tasks:[{...queue1.tasks[0],occurrences:Number.MAX_SAFE_INTEGER}]},runId:'ci-4'}),/Invalid prior queue item/);
assert.throws(()=>buildReviewQueue(board,{previous:{...queue1,tasks:[{...queue1.tasks[0],firstSeen:'../../bad'}]},runId:'ci-4'}),/Invalid prior queue item/);
console.log('PASS RX QUEEN rejects identity tampering and counter overflow');
