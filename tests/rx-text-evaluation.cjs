'use strict';
const assert=require('node:assert/strict');
const {HOLDOUT,evaluate}=require('../rx-text-evaluation.cjs');
const {LABELS,createLearner}=require('../rx-text-learner.cjs');
const report=evaluate({epochs:120});
assert.equal(report.sampleCount,24);
assert.equal(report.cases.length,24);
assert.ok(report.accuracy>=0&&report.accuracy<=1);
// Regression guard for the reproducible 120-epoch held-out evaluation.
assert.ok(report.correct>=15,`RX model regression: ${report.correct}/24 (minimum 15/24)`);
assert.equal(report.correct,report.cases.filter(x=>x.correct).length);
for(const method of ['lexical','hybrid']){
 assert.ok(report[method].correct>=0&&report[method].correct<=report.sampleCount);
 assert.equal(report[method].accuracy,report[method].correct/report.sampleCount);
}
assert.equal(report.productionConnected,false);
for(const label of LABELS)assert.equal(Object.values(report.confusion[label]).reduce((a,b)=>a+b,0),6);
assert.equal(new Set(HOLDOUT.map(x=>x[0])).size,24);
assert.ok(report.training.finalLoss<report.training.initialLoss);
const full=evaluate({epochs:180});
assert.ok(full.correct>=16,`RX full training regression: ${full.correct}/24 (minimum 16/24)`);
const trainedPhrases=[
 'cześć królowo','dzień dobry RX','hej witaj','pokaż testy','sprawdź wyniki testów','czy testy są zielone',
 'co pamiętasz','przypomnij nasze ustalenia','pamiętasz rozmowę','policz 2 plus 3','oblicz wynik','ile to 7 razy 8',
 'witaj przyjacielu','serdeczne pozdrowienia','miłego dnia','pokaż raport kontroli','uruchom sprawdzanie',
 'jaki status testu','zachowaj w pamięci','przywołaj wspomnienia','historia naszych wiadomości',
 'dodaj dwie liczby','wykonaj mnożenie','policz procent'
];
const normalize=text=>text.toLocaleLowerCase('pl').normalize('NFC').trim();
const seen=new Set(trainedPhrases.map(normalize));
for(const [phrase] of HOLDOUT)assert.ok(!seen.has(normalize(phrase)),`Evaluation leakage: ${phrase}`);
console.log('PASS RX TEXT HELDOUT EVALUATION',report.correct+'/'+report.sampleCount);
