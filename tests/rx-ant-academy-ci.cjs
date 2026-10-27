'use strict';
const assert=require('node:assert/strict');
const {rankChecks}=require('../rx-ant-academy-ci.cjs');
const report=rankChecks([{antId:'RX-000001',passed:true},{antId:'RX-000001',passed:false},{antId:'RX-000002',passed:true}],{runId:'test123'});
assert.equal(report.receipts,3);
assert.equal(report.rankings.length,2);
assert.equal(report.rankings.find(a=>a.antId==='RX-000001').metrics.passedTests,1);
assert.throws(()=>rankChecks([{antId:'bad',passed:true}]),/Invalid check/);
console.log('PASS RX ANT ACADEMY CI');
