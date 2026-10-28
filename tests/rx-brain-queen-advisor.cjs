'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createBrainMemory}=require('../rx-brain-memory.cjs');
const {adviseQueen}=require('../rx-brain-queen-advisor.cjs');
test('Queen advice is bounded and never executes',()=>{
 const brain=createBrainMemory();
 brain.learn({key:'inspect_tests',action:'review_ci_logs',success:true,evidence:'CI investigation verified by reviewer'});
 const report=adviseQueen({kind:'rx-queen-ai-bridge',tasks:[{id:'RXQ-001',intent:'inspect_tests',action:'inspect_failed_test',target:'CI',supported:true},{id:'RXQ-002',intent:'unknown',action:'unknown',target:'CI',supported:false}]},brain);
 assert.equal(report.tasks[0].recommendation,'review_ci_logs');
 assert.equal(report.tasks[1].recommendation,null);
 assert.equal(report.tasks[0].requiresApproval,true);
 assert.equal(report.autoExecuted,0);
});
