'use strict';
// End-to-end injected failure simulation; no source changes, no production access.
const assert=require('node:assert/strict');
const {reviewRX}=require('../rx-unified-review.cjs');
const issue={source:'fast',priority:'high',action:'inspect_failed_test',target:'src/rx-fixture.js'};
const supervisor={kind:'rx-queen-ant-supervisor',issues:[issue]};
const sources={'src/rx-fixture.js':'const healthy=true;\ndebugger;\n'};
const first=reviewRX({supervisor,runId:'rx-fixture-1',sources});
assert.equal(first.medusa.signals.length,1);
assert.equal(first.board.tasks.length,1);
assert.equal(first.reviews.length,1);
assert.equal(first.reviews[0].review.suggestions.length,1);
assert.equal(first.reviews[0].review.suggestions[0].preview.applied,false);
assert.equal(first.autoFixesApplied,0);
const repeated=reviewRX({supervisor,previousMemory:first.memory,runId:'rx-fixture-2',sources});
assert.equal(repeated.board.tasks[0].recurrent,true);
assert.equal(repeated.builder.queue.length,1);
assert.equal(repeated.builder.queue[0].requiresApproval,true);
assert.equal(repeated.productionModified,false);
console.log('PASS RX injected diagnostic -> Medusa -> Memory -> Queen board -> Ant Builder -> Developer patch preview (no writes)');

// Verify that an actual failing child-process result is transformed by QUEEN.
const {runFastTests}=require('../rx-fast-test-engine.cjs');
const {summarize}=require('../rx-queen-ant-supervisor.cjs');
(async()=>{
 const report=await runFastTests({tests:['tests/rx-unified-failure-simulation.cjs'],parallel:1,timeoutMs:1000});
 assert.equal(report.kind,'rx-fast-test-engine');
 assert.equal(report.total,1);
 const queen=summarize({fast:{...report,results:[{file:'tests/rx-unified-failure-simulation.cjs',ok:false,timedOut:true}]}});
 assert.equal(queen.issues.length,1);
 assert.equal(reviewRX({supervisor:queen,runId:'timeout-fixture'}).board.tasks.length,1);
 console.log('PASS RX FAST report -> QUEEN -> unified tasks');
})().catch(e=>{console.error(e);process.exitCode=1});
