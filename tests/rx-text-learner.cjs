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

const {evaluateHeldOut,HELD_OUT}=require('../rx-text-learner.cjs');
const heldOut=evaluateHeldOut(learner);
assert.equal(heldOut.total,8);
assert.equal(HELD_OUT.length,8);
assert.ok(heldOut.accuracy>=0&&heldOut.accuracy<=1);
assert.equal(heldOut.correct,heldOut.cases.filter(c=>c.expected===c.predicted).length);
assert.throws(()=>evaluateHeldOut({}),/Invalid learner/);
console.log('RX QUEEN HELD-OUT:',heldOut.correct+'/'+heldOut.total,'accuracy',heldOut.accuracy);

for(const label of LABELS){
 const group=heldOut.perLabel[label];
 assert.equal(group.total,2);
 assert.equal(group.correct,heldOut.cases.filter(c=>c.expected===label&&c.predicted===label).length);
}
console.log('RX QUEEN HELD-OUT BY INTENT',JSON.stringify(heldOut.perLabel));

const {createSentenceExperiment,SAFE_SENTENCES}=require('../rx-text-learner.cjs');
const experiment=createSentenceExperiment();
const generated=experiment.generate({seed:'Cześć'});
assert.match(generated.text,/^Cześć,/);
assert.ok(generated.text.length>10);
assert.equal(generated.productionConnected,false);
assert.equal(generated.trainedSentences,SAFE_SENTENCES.length);
assert.deepEqual(experiment.generate({seed:'Cześć'}),generated,'Generation must be reproducible');
assert.ok(experiment.generate({maxWords:2}).text.trim().split(/\s+/u).length<=2);
assert.throws(()=>createSentenceExperiment({sentences:[]}),/Invalid training/);
assert.throws(()=>experiment.generate({maxWords:1000}),/Invalid generation/);
console.log('RX EXPERIMENTAL SENTENCE MODEL:',generated.text);

const {evaluateSentenceExperiment}=require('../rx-text-learner.cjs');
const quality=evaluateSentenceExperiment(experiment);
assert.equal(quality.total,SAFE_SENTENCES.length);
assert.ok(quality.exactCopyRate>=0&&quality.exactCopyRate<=1);
assert.equal(quality.exactTrainingCopies,quality.cases.filter(x=>x.exactTrainingCopy).length);
assert.equal(quality.completeSentences,quality.cases.filter(x=>x.endsWithPunctuation).length);
assert.equal(quality.distinctOutputs,new Set(quality.cases.map(x=>x.text)).size);
assert.equal(quality.productionConnected,false);
assert.throws(()=>evaluateSentenceExperiment({}),/Invalid sentence evaluation/);
console.log('RX SENTENCE QUALITY (memorization, not fluency):',JSON.stringify({
 total:quality.total,exactCopyRate:quality.exactCopyRate,completeRate:quality.completeRate,distinctRate:quality.distinctRate
}));

const {reviewSentenceCandidates}=require('../rx-text-learner.cjs');
const reviewed=reviewSentenceCandidates([
 'Cześć, możemy dziś wspólnie sprawdzić wyniki testów.',
 'Niespójne słowa i zupełnie przypadkowy ciąg'
],{prompt:'sprawdzić testów'});
assert.equal(reviewed.accepted,true);
assert.equal(reviewed.answer,'Cześć, możemy dziś wspólnie sprawdzić wyniki testów.');
assert.equal(reviewed.productionConnected,false);
assert.equal(reviewed.candidates.length,2);
assert.ok(reviewed.candidates[0].score>reviewed.candidates[1].score);
const rejected=reviewSentenceCandidates(['Losowe fragmenty bez związku'],{prompt:'nowy temat',minScore:0.8});
assert.equal(rejected.accepted,false);
assert.equal(rejected.answer,null);
assert.throws(()=>reviewSentenceCandidates([]),/Invalid RX thought review/);
console.log('RX DNA THOUGHT REVIEW:',JSON.stringify({accepted:reviewed.accepted,rejected:rejected.reason}));
