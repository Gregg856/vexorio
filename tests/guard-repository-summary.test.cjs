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
console.log('PASS: RX Developer 5.0 ranked repository risk overview');
console.log('PASS: Strażak Developer summary counts and no source content');
