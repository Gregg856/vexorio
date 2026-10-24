'use strict';
const assert=require('node:assert/strict');
const {evaluateDataset}=require('../guard/metrics.cjs');
// All examples below are synthetic, not copied from real users.
const training=[
 {label:'safe',text:'Sprzedam rower miejski odbiór osobisty'},
 {label:'safe',text:'Fahrrad gebraucht Abholung möglich'},
 {label:'safe',text:'Used bicycle good condition local pickup'},
 {label:'safe',text:'Продам велосипед самовивіз хороший стан'},
 {label:'suspicious',text:'Wyślij hasło kod SMS płatność western union'},
 {label:'suspicious',text:'Guaranteed profit pay immediately gift card'},
 {label:'suspicious',text:'Gwarantowany zysk wpłać natychmiast inwestycja'},
 {label:'suspicious',text:'Send password verification code pay outside'}
];
const testing=[
 {label:'safe',text:'Rower miejski sprawny odbiór'},
 {label:'safe',text:'Used bicycle local pickup'},
 {label:'safe',text:'Gebrauchtes Fahrrad Abholung'},
 {label:'safe',text:'Велосипед хороший стан самовивіз'},
 {label:'suspicious',text:'Wyślij kod SMS hasło'},
 {label:'suspicious',text:'Guaranteed profit gift card'},
 {label:'suspicious',text:'Gwarantowany zysk inwestycja wpłać'},
 {label:'suspicious',text:'Send password pay outside'},
 {label:'safe',text:'Sprzedam używaną lampę do salonu, stan bardzo dobry'},
 {label:'safe',text:'Laptop Lenovo sprawny, bateria trzyma dwie godziny'},
 {label:'safe',text:'Kinderwagen gepflegt mit Zubehör zur Abholung'},
 {label:'safe',text:'Стіл дерев’яний, можливий самовивіз завтра'},
 {label:'safe',text:'Selling a winter jacket in excellent condition'},
 {label:'safe',text:'Oddam książki szkolne bezpłatnie, odbiór na miejscu'},
 {label:'suspicious',text:'Kup kartę podarunkową i prześlij kod zanim wyślę paczkę'},
 {label:'suspicious',text:'Only today pay immediately for guaranteed returns'},
 {label:'suspicious',text:'Sofort bezahlen, sonst verlieren Sie die Chance'},
 {label:'suspicious',text:'Надішліть пароль і код підтвердження'},
 {label:'suspicious',text:'Send your verification code to unlock your account'},
 {label:'suspicious',text:'Płatność poza platformą przez moneygram, bez spotkania'}
];
const result=evaluateDataset(training,testing);
assert.equal(result.samples,20);
assert.equal(result.errors.length,result.counts.fp+result.counts.fn);
assert.ok(result.errors.every(x=>Number.isInteger(x.index)&&x.correct===false&&!('text' in x)));
assert.ok(result.examples.every(x=>typeof x.correct==='boolean'));
assert.throws(()=>evaluateDataset(training,[null,testing[0]]),/Invalid test example/);
assert.equal(Object.values(result.counts).reduce((a,b)=>a+b,0),20);
assert.ok(result.accuracy>=0&&result.accuracy<=1);
assert.ok(result.falsePositiveRate>=0&&result.falsePositiveRate<=1);
assert.throws(()=>evaluateDataset(training,[training[0],testing[0]]),/Near-duplicate/);
assert.throws(()=>evaluateDataset(training,[{label:'safe',text:'Osobisty odbiór rower miejski sprzedam'},testing[1]]),/Near-duplicate/);
console.log('Guard SYNTHETIC HOLDOUT metrics:',JSON.stringify({...result,examples:undefined}));
console.log('Guard MISCLASSIFIED example indexes:',JSON.stringify(result.errors));
const {compareModels}=require('../guard/compare.cjs');
const comparison=compareModels(training,testing);
assert.equal(comparison.dataset,'synthetic_holdout');
assert.equal(comparison.learned.samples,20);
assert.equal(comparison.rules.samples,20);
assert.equal(Object.values(comparison.rules.counts).reduce((a,b)=>a+b,0),20);
assert.ok(comparison.accuracyDifference>=-1&&comparison.accuracyDifference<=1);
console.log('Guard SYNTHETIC model comparison:',JSON.stringify(comparison));
const {evaluateThresholds}=require('../guard/threshold-evaluation.cjs');
const sweep=evaluateThresholds(training,testing);
assert.equal(sweep.length,5);
assert.ok(sweep.every(x=>x.samples===20&&x.reviewCount>=x.flaggedSuspicious));
assert.ok(sweep.every(x=>x.missedSuspiciousRate>=0&&x.missedSuspiciousRate<=1));
assert.ok(sweep.every(x=>x.safeReviewRate>=0&&x.safeReviewRate<=1));
assert.ok(sweep.every((x,i)=>i===0||x.reviewCount>=sweep[i-1].reviewCount));
assert.ok(sweep.every((x,i)=>i===0||x.missedSuspicious<=sweep[i-1].missedSuspicious));
assert.throws(()=>evaluateThresholds(training,[training[0],testing[1]]),/Near-duplicate/);
console.log('Guard SYNTHETIC workload vs misses:',JSON.stringify(sweep));
const {buildThresholdReport}=require('../guard/threshold-report.cjs');
const report=buildThresholdReport(training,testing);
assert.equal(report.automaticConfiguration,false);
assert.equal(report.status,'experimental_synthetic_only');
assert.ok(report.results.some(x=>x.minimumCoverage===report.suggestedCoverageForFurtherTesting));
assert.equal(report.results.length,5);
const chosen=report.results.find(x=>x.minimumCoverage===report.suggestedCoverageForFurtherTesting);
assert.equal(chosen.missedSuspicious,Math.min(...report.results.map(x=>x.missedSuspicious)));
assert.equal(chosen.reviewCount,Math.min(...report.results.filter(x=>x.missedSuspicious===chosen.missedSuspicious).map(x=>x.reviewCount)));
console.log('Guard SYNTHETIC threshold report:',JSON.stringify(report));
console.log('PASS: separate holdout evaluation; no user data and no automatic moderation');
