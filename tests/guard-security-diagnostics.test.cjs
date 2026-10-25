'use strict';
const assert=require('node:assert/strict');
const {diagnose}=require('../guard/security-diagnostics.cjs');
const source=[
 'const a = eval(input);',
 'const b = new Function("return 1");',
 'node.innerHTML = message;',
 'const url = "http://example.org/path";'
].join('\n');
const results=diagnose(source);
assert.deepEqual(results.map(x=>x.rule),['dynamic-code-execution','dynamic-code-execution','unsafe-html-sink','insecure-http']);
assert.deepEqual(results.map(x=>x.line),[1,2,3,4]);
assert.ok(results.every(x=>x.automaticFix===false));
assert.deepEqual(diagnose('element.textContent = value; const url="https://example.org";'),[]);
assert.throws(()=>diagnose(null),/source/i);
console.log('PASS: read-only RX security diagnostics');
