'use strict';
const assert=require('node:assert/strict');
const {summarize}=require('../guard/repository-summary.cjs');
const report={signals:3,files:[
 {path:'a.js',findings:[{severity:'high'},{severity:'medium'}]},
 {path:'tests/b.test.js',findings:[{severity:'low'}]},
 {path:'c.js',error:'too_large'}
]};
const s=summarize(report);
assert.equal(s.filesScanned,2);
assert.equal(s.filesSkipped,1);
assert.equal(s.coveragePercent,67);
assert.deepEqual(s.skippedByReason,{too_large:1});
assert.equal(s.signals,3);
assert.deepEqual(s.byScope.application,{high:1,medium:1,low:0});
assert.deepEqual(s.byScope.tests,{high:0,medium:0,low:1});
assert.deepEqual(s.severity,{high:1,medium:1,low:1});
assert.deepEqual(s.files[2],{path:'c.js',status:'too_large'});
assert.equal(JSON.stringify(s).includes('source'),false);
assert.deepEqual(s.priorityFiles.map(f=>f.path),['a.js','tests/b.test.js']);
assert.deepEqual(s.priorityFiles[0].severity,{high:1,medium:1,low:0});
const prioritized=summarize({signals:4,files:[
 {path:'low.js',findings:[{severity:'low'},{severity:'low'}]},
 {path:'critical.js',findings:[{severity:'high'}]},
 {path:'medium.js',findings:[{severity:'medium'}]}
]});
assert.deepEqual(prioritized.priorityFiles.map(f=>f.path),['critical.js','medium.js','low.js']);
assert.equal(JSON.stringify(prioritized).includes('source'),false);
assert.deepEqual(s.recommendations.map(r=>r.priority),['high','medium','low','review']);
assert.deepEqual(prioritized.recommendations.map(r=>r.priority),['high','medium','low']);
assert.deepEqual(summarize({signals:0,files:[{path:'ok.js',findings:[]}]}).recommendations,[]);
assert.equal(JSON.stringify(s.recommendations).includes('source'),false);
console.log('PASS: RX Developer 5.1 prioritized remediation guidance');
const skipped=summarize({signals:0,files:[
 {path:'a.js',error:'missing'},
 {path:'b.js',error:'unreadable'},
 {path:'c.js',error:'missing'},
 {path:'d.js',error:'unsafe_file_type'},
 {path:'ok.js',findings:[]}
]});
assert.deepEqual(skipped.skippedByReason,{missing:2,unreadable:1,unsafe_file_type:1});
assert.equal(skipped.filesSkipped,4);
console.log('PASS: RX Developer 5.2 skipped-file reasons');
assert.equal(skipped.coveragePercent,20);
assert.equal(summarize({signals:0,files:[]}).coveragePercent,0);
assert.equal(summarize({signals:0,files:[{path:'ok.js',findings:[]}]}).coveragePercent,100);
console.log('PASS: RX Developer 5.3 scan coverage percentage');
const emptyFileSummary=summarize({signals:0,files:[{path:'blank.js',error:'empty_file'},{path:'ok.js',findings:[]}]});
assert.equal(emptyFileSummary.skippedByReason.empty_file,1);
assert.equal(emptyFileSummary.coveragePercent,50);
assert.equal(emptyFileSummary.recommendations.filter(r=>r.priority==='review').length,2);
assert.ok(emptyFileSummary.recommendations.some(r=>r.action.includes('puste pliki')));
console.log('PASS: RX Developer 5.9 empty-file remediation');
const unknownStatuses=summarize({signals:0,files:[{path:'a.js',error:'__proto__'},{path:'b.js',error:'constructor'},{path:'c.js',error:'missing'}]});
assert.deepEqual(unknownStatuses.skippedByReason,{other:2,missing:1});
assert.equal(Object.prototype.polluted,undefined);
console.log('PASS: RX Developer 6.0 safe skipped-file aggregation');
const ruleSummary=summarize({signals:5,files:[
 {path:'a.js',findings:[{rule:'eval',severity:'high'},{rule:'console-log',severity:'low'},{rule:'unsafe secret',severity:'high'}]},
 {path:'b.js',findings:[{rule:'eval',severity:'high'},{rule:'inner-html',severity:'medium'}]}
]});
assert.deepEqual(ruleSummary.topRules,[{rule:'eval',count:2},{rule:'console-log',count:1},{rule:'inner-html',count:1}]);
assert.equal(JSON.stringify(ruleSummary.topRules).includes('unsafe secret'),false);
assert.deepEqual(summarize({signals:0,files:[]}).topRules,[]);
console.log('PASS: RX Developer 6.1 top detection rules');
const rankedRules=summarize({signals:4,files:[{path:'rank.js',findings:[
 {rule:'low-rule',severity:'low'},{rule:'high-rule',severity:'high'},
 {rule:'medium-rule',severity:'medium'},{rule:'high-rule',severity:'high'}
]}]});
assert.deepEqual(rankedRules.priorityRules,[
 {rule:'high-rule',severity:{high:2,medium:0,low:0}},
 {rule:'medium-rule',severity:{high:0,medium:1,low:0}},
 {rule:'low-rule',severity:{high:0,medium:0,low:1}}
]);
console.log('PASS: RX Developer 6.2 severity-prioritized rules');
const affected=summarize({signals:4,files:[
 {path:'a.js',findings:[{rule:'eval',severity:'high'},{rule:'eval',severity:'high'}]},
 {path:'b.js',findings:[{rule:'eval',severity:'high'},{rule:'log',severity:'low'}]},
 {path:'c.js',findings:[]},{path:'d.js',error:'missing'}
]});
assert.deepEqual(affected.affectedFiles,{high:2,medium:0,low:1});
assert.equal(affected.severity.high,3);
console.log('PASS: RX Developer 6.3 affected-file counts');
assert.equal(affected.filesWithSignals,2);
assert.equal(affected.cleanFiles,1);
assert.equal(affected.filesWithSignals+affected.cleanFiles,affected.filesScanned);
console.log('PASS: RX Developer 6.4 clean-file counts');
assert.equal(affected.cleanPercent,33);
assert.equal(summarize({signals:0,files:[]}).cleanPercent,0);
assert.equal(summarize({signals:0,files:[{path:'ok.js',findings:[]}]}).cleanPercent,100);
console.log('PASS: RX Developer 6.5 clean-file percentage');
assert.equal(affected.scanStatus,'review_required');
assert.equal(summarize({signals:0,files:[{path:'ok.js',findings:[]}]}).scanStatus,'no_signals');
assert.equal(summarize({signals:0,files:[{path:'missing.js',error:'missing'}]}).scanStatus,'incomplete');
assert.equal(summarize({signals:0,files:[]}).scanStatus,'no_files_scanned');
assert.equal(summarize({signals:0,files:[{path:'ok.js',findings:[]},{path:'missing.js',error:'missing'}]}).scanStatus,'incomplete');
console.log('PASS: RX Developer 6.6 scan status');
assert.equal(affected.scanComplete,false);
assert.equal(summarize({signals:1,files:[{path:'flagged.js',findings:[{rule:'eval',severity:'high'}]}]}).scanComplete,true);
assert.equal(summarize({signals:0,files:[{path:'ok.js',findings:[]}]}).scanComplete,true);
assert.equal(summarize({signals:0,files:[]}).scanComplete,false);
console.log('PASS: RX Developer 6.8 scan completeness');
assert.equal(affected.reviewFiles,2);
assert.equal(summarize({signals:1,files:[{path:'low.js',findings:[{rule:'log',severity:'low'}]}]}).reviewFiles,0);
assert.equal(summarize({signals:0,files:[]}).reviewFiles,0);
console.log('PASS: RX Developer 6.9 high-priority file count');
const tiers=summarize({signals:5,files:[
 {path:'a.js',findings:[{rule:'a',severity:'high'},{rule:'b',severity:'medium'}]},
 {path:'b.js',findings:[{rule:'b',severity:'medium'}]},
 {path:'c.js',findings:[{rule:'c',severity:'low'}]},
 {path:'d.js',findings:[]}
]});
assert.equal(tiers.reviewFiles,1);
assert.equal(tiers.mediumReviewFiles,1);
assert.equal(tiers.lowReviewFiles,1);
assert.equal(tiers.reviewFiles+tiers.mediumReviewFiles+tiers.lowReviewFiles,tiers.filesWithSignals);
console.log('PASS: RX Developer 7.0 non-overlapping review tiers');
console.log('PASS: RX Developer 5.0 ranked repository risk overview');
console.log('PASS: Strażak Developer summary counts and no source content');
