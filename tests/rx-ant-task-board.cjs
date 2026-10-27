'use strict';
const assert=require('node:assert/strict');
const {buildBoard}=require('../rx-ant-task-board.cjs');
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
console.log('PASS RX ANT TASK BOARD: priority, deduplication, bounded tasks');
