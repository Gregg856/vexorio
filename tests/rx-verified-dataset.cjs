'use strict';
const assert=require('node:assert/strict');
const {createRXHearts}=require('../rx-million-hearts.js');
const {buildVerifiedDataset}=require('../rx-verified-dataset.js');
const rx=createRXHearts();
rx.rememberFailure('tests','mobile_overflow');
rx.rememberFailure('security','unreviewed');
rx.rememberVerifiedFix('tests','mobile_overflow','fix_101',{testsPassed:true});
const dataset=buildVerifiedDataset(rx);
assert.equal(dataset.status,'candidate_only');
assert.equal(dataset.requiresDataApproval,true);
assert.equal(dataset.examples.length,1);
assert.equal(dataset.excluded,1);
assert.deepEqual(dataset.examples[0],{
 input:{cell:'tests',errorCode:'mobile_overflow'},
 expectedFixId:'fix_101',source:'verified_rx_pattern',approvedForTraining:false
});
assert.equal(JSON.stringify(dataset).includes('unreviewed'),false);
assert.throws(()=>buildVerifiedDataset(rx,{maxExamples:1001}),/Invalid dataset limit/);
assert.deepEqual(buildVerifiedDataset(createRXHearts()).examples,[]);
console.log('RX VERIFIED DATASET: PASS');
