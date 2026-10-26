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

const blockCases=inspectSource({path:'src/blocks.js',source:[
 '/* eval(fake);',
 'console.log(fake); */',
 'const real=eval(input);',
 '/* const api_key = "abcdefghijklmnopqrstuvwxyz123456"; */'
].join('\n')});
assert.deepEqual(blockCases.findings.map(f=>[f.rule,f.line]),[['eval',3]]);
console.log('PASS: RX Developer 2.1 multiline comment regression');

const crlfCases=inspectSource({path:'src/windows.js',source:[
 '/* eval(fake); */',
 'const api_key = "abcdefghijklmnopqrstuvwxyz123456";',
 'fetch("http://example.org/data");',
 'console.log("real");'
].join('\r\n')});
assert.deepEqual(crlfCases.findings.map(f=>[f.rule,f.line]),[
 ['hardcoded-secret',2],['insecure-http',3],['console-log',4]
]);
assert.ok(!JSON.stringify(crlfCases).includes('abcdefghijklmnopqrstuvwxyz123456'));
console.log('PASS: RX Developer 2.1 CRLF, real findings and secret redaction');

const safeLiteral=inspectSource({path:'src/literal.js',source:'const note = "ordinary text";'});
assert.equal(safeLiteral.findings.length,0);
const multiline=inspectSource({path:'src/multiline.js',source:'/* harmless\n eval(ignored)\n*/\neval(real);'});
assert.deepEqual(multiline.findings.map(f=>[f.rule,f.line]),[['eval',4]]);
const httpSecret=inspectSource({path:'src/valid.js',source:'const secret = "abcdefghijklmnopqrstuvwxyz123456";\nfetch("http://example.org");'});
assert.deepEqual(httpSecret.findings.map(f=>[f.rule,f.line]),[['hardcoded-secret',1],['insecure-http',2]]);
console.log('PASS: RX Developer 2.1 literal, multiline and active security checks');

const inlineBlock=inspectSource({path:'src/inline.js',source:'const a=1; /* eval(fake); */ eval(real);'});
assert.deepEqual(inlineBlock.findings.map(f=>[f.rule,f.line]),[['eval',1]]);
const multiInline=inspectSource({path:'src/inline-block.js',source:'const a=1; /* console.log(fake);\n eval(fake); */ console.log(real);'});
assert.deepEqual(multiInline.findings.map(f=>[f.rule,f.line]),[['console-log',2]]);
console.log('PASS: RX Developer 2.1 inline block comments preserve real code');

const quotedCases=inspectSource({path:'src/quoted.js',source:[
 'const note = "eval(fake) and console.log(fake)";',
 "const other = 'document.write(fake)';",
 'const real = eval(userInput);',
 'console.log(real);'
].join('\n')});
assert.deepEqual(quotedCases.findings.map(f=>[f.rule,f.line]),[['eval',3],['console-log',4]]);
const inlineComment=inspectSource({path:'src/inline-comment.js',source:'const x=1; // eval(fake)\nconsole.log(x);'});
assert.deepEqual(inlineComment.findings.map(f=>[f.rule,f.line]),[['console-log',2]]);
const urlLiteral=inspectSource({path:'src/url-literal.js',source:'const url="https://example.org/path";\nfetch("http://example.org");'});
assert.deepEqual(urlLiteral.findings.map(f=>[f.rule,f.line]),[['insecure-http',2]]);
console.log('PASS: RX Developer 2.2 quoted strings and inline comments');

const severityReport=inspectSource({path:'src/report.js',source:[
 'const a=eval(input);',
 'el.innerHTML = html;',
 'console.log(value);',
 'const api_key = "abcdefghijklmnopqrstuvwxyz123456";'
].join('\n')});
assert.deepEqual(severityReport.findings.map(({rule,severity,line})=>[rule,severity,line]),[
 ['eval','high',1],['hardcoded-secret','high',4],['inner-html','medium',2],['console-log','low',3]
]);
assert.ok(severityReport.findings.every(f=>typeof f.message==='string'&&f.message.length>0));
assert.ok(severityReport.findings.every(f=>!('source' in f)&&!('match' in f)));
assert.ok(!JSON.stringify(severityReport).includes('abcdefghijklmnopqrstuvwxyz123456'));
console.log('PASS: RX Developer 2.3 safe severity, line and secret-free reports');

assert.deepEqual(severityReport.summary,{high:2,medium:1,low:1,total:4});
assert.deepEqual(inspectSource({path:'src/empty.js',source:'const ok = true;'}).summary,{high:0,medium:0,low:0,total:0});
assert.equal(capped.summary.total,50);
assert.equal(capped.summary.high,50);
assert.ok(!JSON.stringify(severityReport.summary).includes('abcdefghijklmnopqrstuvwxyz123456'));
console.log('PASS: RX Developer 2.3 severity summary and finding cap');

const priorityReport=inspectSource({path:'src/priorities.js',source:[
 'console.log(value);',
 'el.innerHTML = html;',
 'eval(userInput);',
 'const secret = "abcdefghijklmnopqrstuvwxyz123456";',
 'document.write(html);',
 'console.log(again);'
].join('\n')});
assert.deepEqual(priorityReport.findings.map(({rule,line})=>[rule,line]),[
 ['eval',3],['hardcoded-secret',4],
 ['inner-html',2],['document-write',5],
 ['console-log',1],['console-log',6]
]);
assert.deepEqual(priorityReport.summary,{high:2,medium:2,low:2,total:6});
console.log('PASS: RX Developer 2.4 priority sorting and stable line order');
