'use strict';
const assert=require('node:assert/strict');
const {trainErrorClassifier}=require('../rx-error-learner.js');
const examples=[
 {input:{cell:'tests',errorCode:'mobile_overflow'},expectedFixId:'fix_01',approvedForTraining:true},
 {input:{cell:'tests',errorCode:'mobile_overflow'},expectedFixId:'fix_01',approvedForTraining:true},
 {input:{cell:'tests',errorCode:'mobile_overflow'},expectedFixId:'fix_02',approvedForTraining:true}
];
const model=trainErrorClassifier(examples);
assert.equal(model.status,'trained_locally');
assert.equal(model.examplesUsed,3);
assert.equal(model.ruleCount,1);
assert.deepEqual(model.predict({cell:'tests',errorCode:'mobile_overflow'}),{fixId:'fix_01',requiresApproval:true});
assert.equal(model.predict({cell:'tests',errorCode:'unknown'}),null);
assert.equal(model.deployable,false);
assert.throws(()=>trainErrorClassifier([{...examples[0],approvedForTraining:false}]),/not approved/);
assert.throws(()=>trainErrorClassifier([{...examples[0],input:{cell:'tests',errorCode:'secret=abc'}}]),/not approved/);
console.log('RX ERROR LEARNER: PASS');
