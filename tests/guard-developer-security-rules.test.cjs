'use strict';
const assert=require('node:assert/strict');
const {inspectSource}=require('../guard/developer-inspector.cjs');
const sample=[
 'document.write(input);',
 'fetch("http://example.org/data");',
 'const api_key = "abcdefghijklmnopqrstuvwxyz123456";'
].join('\n');
const report=inspectSource({path:'example.js',source:sample});
assert.deepEqual(report.findings.map(f=>[f.rule,f.line,f.severity]),[
 ['document-write',1,'medium'],
 ['insecure-http',2,'medium'],
 ['hardcoded-secret',3,'high']
]);
assert.ok(!JSON.stringify(report).includes('abcdefghijklmnopqrstuvwxyz123456'),'Do not leak possible secret in reports');
assert.equal(inspectSource({path:'safe.js',source:'fetch("https://example.org");'}).findings.length,0);
console.log('PASS: Strażak Developer additional security rules and secret redaction');
