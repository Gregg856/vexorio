'use strict';
const assert=require('node:assert/strict');
const {inspectSource}=require('../guard/developer-inspector.cjs');
const source=['const a=eval(userInput);','el.innerHTML = html;','console.log(token);'].join('\n');
const result=inspectSource({path:'src/main.js',source});
assert.equal(result.readOnly,true);
assert.deepEqual(result.findings.map(f=>[f.rule,f.line]),[['eval',1],['inner-html',2],['console-log',3]]);
assert.equal(inspectSource({path:'ok.js',source:'const x = 1;'}).findings.length,0);
assert.throws(()=>inspectSource({path:'../secret.js',source:'x'}),/Invalid source input/);
assert.throws(()=>inspectSource({path:'test.js',source:'x'.repeat(100001)}),/Invalid source input/);
console.log('PASS: Strażak Developer read-only source inspection');

const boundaries=inspectSource({path:'src/boundary.js',source:'const x=1;'.repeat(10000)});
assert.equal(boundaries.readOnly,true);
assert.equal(boundaries.findings.length,0);
assert.equal(boundaries.lines,1);
const capped=inspectSource({path:'src/repeated.js',source:'eval(x);\n'.repeat(60)});
assert.equal(capped.findings.length,50);
assert.equal(capped.limited,true);
assert.deepEqual(capped.findings.map(f=>f.line),Array.from({length:50},(_,i)=>i+1));
assert.throws(()=>inspectSource({path:'/absolute.js',source:'x'}),/Invalid source input/);
assert.throws(()=>inspectSource({path:'safe.js',source:42}),/Invalid source input/);
console.log('PASS: RX Developer 2.0 boundary and finding limit tests');

const commentCases=inspectSource({path:'src/comments.js',source:[
 '// eval(userInput);',
 '  // console.log(secret);',
 '// const api_key = "abcdefghijklmnopqrstuvwxyz123456";',
 'const real=eval(userInput);',
 'console.log(real);'
].join('\n')});
assert.deepEqual(commentCases.findings.map(f=>[f.rule,f.line]),[['eval',4],['console-log',5]]);
console.log('PASS: RX Developer 2.0 full-line comment false-positive regression');
