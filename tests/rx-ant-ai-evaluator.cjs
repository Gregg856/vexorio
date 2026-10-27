'use strict';
const assert=require('node:assert/strict');
const {train}=require('../rx-ant-ai-trainer.cjs');
const {accuracy,evaluate,VALIDATION}=require('../rx-ant-ai-evaluator.cjs');
const first=evaluate();
assert.equal(first.validationExamples,VALIDATION.length);
assert.equal(first.previousAccuracy,null);
assert.equal(first.decision,'initial_model');
assert.equal(first.accuracyDelta,null);
assert.ok(first.candidateAccuracy>=0&&first.candidateAccuracy<=1);
const second=evaluate({previous:first.selectedModel});
assert.equal(second.previousAccuracy,accuracy(first.selectedModel));
assert.equal(second.accuracyDelta,Number((second.candidateAccuracy-second.previousAccuracy).toFixed(6)));
assert.equal(second.decision,second.candidateAccuracy>second.previousAccuracy?'promoted':'retained_previous');
assert.ok(accuracy(second.selectedModel)>=second.previousAccuracy);
if(second.candidateAccuracy===second.previousAccuracy){assert.equal(second.selectedModel,first.selectedModel);assert.equal(second.modelChanged,false);}
assert.throws(()=>accuracy({weights:[NaN,0],bias:0}),/Invalid model/);
assert.throws(()=>train({checkpoint:{schema:1,kind:'rx-ant-ai-trained-classifier',dataset:'synthetic-toy',weights:[Infinity,0],bias:0}}),/Invalid checkpoint/);
console.log('PASS RX AI EVALUATOR: held-out validation and no model regression');
