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
 ['hardcoded-secret',3,'high'],
 ['document-write',1,'medium'],
 ['insecure-http',2,'medium']
]);
const extra=inspectSource({path:'security.js',source:['const options={rejectUnauthorized:false};','otherWindow.postMessage(payload, "*");'].join('\n')});
assert.deepEqual(extra.findings.map(f=>[f.rule,f.line,f.severity]),[
 ['tls-verification-disabled',1,'high'],
 ['postmessage-wildcard',2,'medium']
]);
assert.equal(inspectSource({path:'secure.js',source:'otherWindow.postMessage(payload, "https://example.org");'}).findings.length,0);
assert.ok(!JSON.stringify(report).includes('abcdefghijklmnopqrstuvwxyz123456'),'Do not leak possible secret in reports');
assert.equal(inspectSource({path:'safe.js',source:'fetch("https://example.org");'}).findings.length,0);
console.log('PASS: Strażak Developer additional security rules and secret redaction');
