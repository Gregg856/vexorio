'use strict';
const assert=require('node:assert/strict');
const {createRXHearts}=require('../rx-million-hearts.js');
const {buildModelPlan,coordinateModelPlan}=require('../rx-ai-builder.js');
const rx=createRXHearts();
const empty=buildModelPlan(rx);
assert.equal(empty.status,'proposal_only');
assert.equal(empty.requiresApproval,true);
assert.deepEqual(empty.blockers,['No verified examples available']);
rx.rememberFailure('tests','regression');
rx.rememberVerifiedFix('tests','regression','fix_123',{testsPassed:true});
const plan=buildModelPlan(rx,{goal:'error_classifier'});
assert.equal(plan.evidence.verifiedPatterns,1);
assert.equal(plan.blockers.length,0);
assert.equal(plan.steps.length,5);
assert.throws(()=>buildModelPlan(rx,{datasetId:'../secret'}),/Invalid model plan input/);
(async()=>{
 const blocked=await coordinateModelPlan(createRXHearts());
 assert.equal(blocked.status,'blocked');
 assert.equal(blocked.tasks.length,0);
 const coordinated=await coordinateModelPlan(rx,{goal:'error_classifier'});
 assert.equal(coordinated.tasks.length,5);
 assert.deepEqual(coordinated.tasks.map(t=>t.status),[
  'needs-integration','needs-integration','needs-integration',
  'awaiting-human-approval','awaiting-human-approval'
 ]);
 assert.equal(coordinated.requiresApproval,true);
 console.log('RX AI BUILDER: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
