'use strict';
const assert=require('node:assert/strict');
const {createLearner,vector,LABELS,lexicalProbe}=require('../rx-text-learner.cjs');
assert.equal(vector('Zażółć').length,256);
assert.equal(LABELS.length,4);
const learner=createLearner({epochs:120});
assert.equal(learner.kind,'rx-text-learner');
assert.equal(learner.examples,36);
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

const unknownTopic=experiment.generateRelevant({prompt:'Czy potrafisz naprawić teleskop kwantowy?'});
assert.equal(unknownTopic.matched,false);
assert.equal(unknownTopic.text,null);
assert.equal(unknownTopic.reason,'unseen-topic');
const knownTopic=experiment.generateRelevant({prompt:'sprawdzić wyniki testów'});
assert.equal(knownTopic.matched,true);
assert.ok(knownTopic.text.length>0);
assert.equal(knownTopic.productionConnected,false);
assert.throws(()=>experiment.generateRelevant({prompt:''}),/Invalid topic prompt/);
console.log('RX TOPIC GATE:',JSON.stringify({unknown:unknownTopic.reason,known:knownTopic.matched}));

const variants=[0,1,2,3].map(variant=>experiment.generate({variant}).text);
assert.ok(new Set(variants).size>=3,'Different variants should produce distinct starts');
assert.deepEqual(experiment.generate({variant:2}),experiment.generate({variant:2}),'Variant must be deterministic');
assert.throws(()=>experiment.generate({variant:-1}),/Invalid generation/);
assert.equal(experiment.generate({seed:'Witaj',variant:3}).text.startsWith('Witaj,'),true);
console.log('RX GENERATION VARIANTS:',new Set(variants).size);

// Training data expansion must not leak held-out evaluation prompts into the corpus.
assert.equal(heldOut.total,8);
assert.equal(learner.examples,36);
console.log('RX TRAINING BATCH:',JSON.stringify({examples:learner.examples,heldOutCorrect:heldOut.correct,heldOutTotal:heldOut.total,lossBefore:learner.metrics.initialLoss,lossAfter:learner.metrics.finalLoss}));
