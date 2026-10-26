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
console.log('PASS: RX Developer 5.0 ranked repository risk overview');
console.log('PASS: Strażak Developer summary counts and no source content');
