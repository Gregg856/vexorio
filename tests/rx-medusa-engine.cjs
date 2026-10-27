'use strict';
const assert=require('node:assert/strict');
const {routeSignals}=require('../rx-medusa-engine.cjs');
const {buildBoard}=require('../rx-ant-task-board.cjs');
const empty=routeSignals({kind:'rx-queen-ant-supervisor',issues:[]});
assert.equal(empty.engine,'RX');
assert.equal(empty.signals.length,0);
const result=routeSignals({kind:'rx-queen-ant-supervisor',issues:[
 {source:'fast',action:'inspect_failed_test',target:'tests/a.cjs',priority:'medium'},
 {source:'fast',action:'inspect_failed_test',target:'tests/a.cjs',priority:'high'},
 {source:'studio',action:'inspect_studio_test',target:'tests/b.cjs',priority:'critical'}
]});
assert.equal(result.totalUnique,2);
assert.equal(result.signals[0].priority,'critical');
assert.equal(result.signals[1].occurrences,2);
assert.equal(result.signals[1].priority,'high');
assert.equal(result.signals[1].recipient,'rx-queen');
assert.equal(result.autoExecuted,0);
assert.equal(routeSignals({kind:'rx-queen-ant-supervisor',issues:result.signals.map(s=>({...s}))},{maxSignals:1}).overflow,1);
assert.throws(()=>routeSignals({kind:'bad',issues:[]}),/Invalid RX supervisor/);
assert.throws(()=>routeSignals({kind:'rx-queen-ant-supervisor',issues:[{source:'x',action:'a',target:'t',priority:'urgent'}]}),/Invalid RX issue/);
const supervisor={kind:'rx-queen-ant-supervisor',issues:[{source:'fast',action:'inspect_failed_test',target:'tests/a.cjs',priority:'high'}]};
const routed=routeSignals(supervisor);
const board=buildBoard(supervisor,{medusa:routed});
assert.equal(board.tasks.length,1);
assert.equal(board.tasks[0].requiresApproval,true);
assert.equal(board.tasks[0].status,'needs_review');
assert.equal(board.autoFixesApplied,0);
assert.throws(()=>buildBoard(supervisor,{medusa:{kind:'bad',signals:[]}}),/Invalid RX MEDUSA/);
console.log('PASS RX MEDUSA: deduplication, priority, limits, safe routing');
