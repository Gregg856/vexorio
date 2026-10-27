'use strict';
const assert=require('node:assert/strict');
const {summarizeRxBibi}=require('../rx-bibi-dashboard-summary.cjs');
const report={kind:'rx-bibi-unified-adapter',runId:'ci_1',
 summary:{signals:3},board:{tasks:[{recurrent:true},{recurrent:false}]},
 reviewQueue:{tasks:[{approved:false,executed:false},{approved:false,executed:false}]},
 developerQueue:{reviews:[{suggestions:[{rule:'remove-debugger'}]}]}};
const result=summarizeRxBibi(report);
assert.equal(result.signals,3);
assert.equal(result.tasks,2);
assert.equal(result.recurring,1);
assert.equal(result.reviewedFiles,1);
assert.equal(result.proposedPatches,1);
assert.equal(result.awaitingApproval,2);
assert.equal(result.productionModified,false);
assert.equal(result.automaticDeployment,false);
assert.throws(()=>summarizeRxBibi({}),/Invalid RX BIBI report/);
assert.throws(()=>summarizeRxBibi({...report,developerQueue:{reviews:[{suggestions:new Array(21)}]}}),/Invalid RX developer review/);
console.log('PASS RX BIBI dashboard summary (read-only, bounded)');
