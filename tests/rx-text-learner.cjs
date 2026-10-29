'use strict';
const assert=require('node:assert/strict');
const {createLearner,vector,LABELS,lexicalProbe}=require('../rx-text-learner.cjs');
assert.equal(vector('Zażółć').length,256);
assert.equal(LABELS.length,4);
const learner=createLearner({epochs:120});
assert.equal(learner.kind,'rx-text-learner');
assert.equal(learner.examples,24);
assert.ok(Number.isFinite(learner.metrics.finalLoss));
assert.ok(learner.metrics.finalLoss<learner.metrics.initialLoss,'Training must reduce loss');
for(const text of ['cześć królowo','pokaż testy','przypomnij nasze ustalenia','policz 2 plus 3']){
 const prediction=learner.classify(text);
 assert.ok(LABELS.includes(prediction.label));
 assert.equal(prediction.scores.length,4);
}
assert.equal(lexicalProbe('pokaż testy').label,'tests');
assert.equal(lexicalProbe('pokaż testy').matched,true);
assert.equal(lexicalProbe('niezwiązane wyrazy').matched,false);
assert.throws(()=>lexicalProbe(''),/Invalid/);
assert.throws(()=>createLearner({epochs:1001}),/Invalid/);
console.log('PASS RX TEXT LEARNER',learner.metrics.initialLoss,learner.metrics.finalLoss);
