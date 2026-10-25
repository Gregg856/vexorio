'use strict';
const assert=require('node:assert/strict');
const {summarize}=require('../guard/repository-summary.cjs');
const report={signals:3,files:[
 {path:'a.js',findings:[{severity:'high'},{severity:'medium'}]},
 {path:'b.js',findings:[{severity:'low'}]},
 {path:'c.js',error:'too_large'}
]};
const s=summarize(report);
assert.equal(s.filesScanned,2);
assert.equal(s.filesSkipped,1);
assert.equal(s.signals,3);
assert.deepEqual(s.severity,{high:1,medium:1,low:1});
assert.deepEqual(s.files[2],{path:'c.js',status:'too_large'});
assert.equal(JSON.stringify(s).includes('source'),false);
console.log('PASS: Strażak Developer summary counts and no source content');
