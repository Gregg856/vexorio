'use strict';
const assert=require('node:assert/strict');
const {summarizeGuardReports}=require('../guard/metrics-summary.cjs');
const data=summarizeGuardReports([
 {priority:'high',reasonIds:['credential_phishing','credential_phishing'],requiresHumanReview:true,title:'private'},
 {priority:'normal',reasonIds:['possible_duplicate'],requiresHumanReview:true},
 {priority:'none',reasonIds:[],requiresHumanReview:false},
 null
]);
assert.deepEqual(data.counts,{total:4,high:2,normal:1,none:1,invalid:1,requiresHumanReview:3});
assert.equal(data.reasons.credential_phishing,1);
assert.equal(data.reasons.possible_duplicate,1);
assert.equal(data.automaticAction,false);
assert.ok(!JSON.stringify(data).includes('private'));
assert.throws(()=>summarizeGuardReports(null),/Invalid report batch/);
console.log('PASS: privacy-preserving Guard metrics, invalid report escalation and no automatic action');
