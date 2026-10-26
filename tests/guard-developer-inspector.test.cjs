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

const capPriority=inspectSource({path:'src/cap-priority.js',source:[
 ...Array.from({length:60},(_,i)=>'console.log(value'+i+');'),
 'eval(untrusted);',
 'const secret = "abcdefghijklmnopqrstuvwxyz123456";'
].join('\n')});
assert.equal(capPriority.findings.length,50);
assert.equal(capPriority.limited,true);
assert.deepEqual(capPriority.findings.slice(0,2).map(f=>[f.rule,f.line]),[
 ['eval',61],['hardcoded-secret',62]
]);
assert.deepEqual(capPriority.summary,{high:2,medium:0,low:48,total:50});
const exactCap=inspectSource({path:'src/exact-cap.js',source:'console.log(x);\n'.repeat(50)});
assert.equal(exactCap.findings.length,50);
assert.equal(exactCap.limited,false);
console.log('PASS: RX Developer 2.5 high-risk findings survive cap and exact cap is not truncated');

assert.equal(capPriority.omitted,12);
assert.equal(exactCap.omitted,0);
assert.equal(inspectSource({path:'src/empty.js',source:'const ok=true;'}).omitted,0);
console.log('PASS: RX Developer 2.6 omitted finding counts');

const indexedLines=inspectSource({path:'src/indexed-lines.js',source:[
 'const x = 1;',
 '',
 'console.log(x);',
 'eval(x);',
 'const safe = true;'
].join('\r\n')});
assert.equal(indexedLines.lines,5);
assert.deepEqual(indexedLines.findings.map(f=>[f.rule,f.line]),[['eval',4],['console-log',3]]);
const manyLines=inspectSource({path:'src/many-lines.js',source:'x;\n'.repeat(10000)+'eval(x);'});
assert.equal(manyLines.lines,10001);
assert.equal(manyLines.findings[0].line,10001);
console.log('PASS: RX Developer 2.8 indexed line lookup with CRLF and large files');

const quotedSecurityText=inspectSource({path:'src/quoted-security.js',source:[
 'const a = "fetch(\u0027http://example.org\u0027)";',
 'const b = "otherWindow.postMessage(payload, \u0027*\u0027)";',
 'const c = "api_key = \u0027abcdefghijklmnopqrstuvwxyz123456\u0027";',
 'fetch("http://example.org");',
 'otherWindow.postMessage(payload, "*");',
 'const api_key = "abcdefghijklmnopqrstuvwxyz123456";'
].join('\n')});
assert.deepEqual(quotedSecurityText.findings.map(f=>[f.rule,f.line]),[
 ['hardcoded-secret',6],['insecure-http',4],['postmessage-wildcard',5]
]);
console.log('PASS: RX Developer 2.9 quoted security examples do not trigger false positives');

const timerReport=inspectSource({path:'src/timers.js',source:[
 'setTimeout("alert(1)", 100);',
 "setInterval('runTask()', 1000);",
 'setTimeout(() => runTask(), 100);',
 'const example = "setTimeout(\'alert(1)\', 100)";',
 '// setInterval("unsafe()", 100);',
 'setInterval(`runTask()`, 1000);'
].join('\n')});
assert.deepEqual(timerReport.findings.map(f=>[f.rule,f.severity,f.line]),[
 ['timer-string-code','high',1],
 ['timer-string-code','high',2],
 ['timer-string-code','high',6]
]);
assert.equal(timerReport.summary.high,3);
console.log('PASS: RX Developer 3.0 string-based timer execution and false-positive checks');

const jsUrlReport=inspectSource({path:'src/navigation.js',source:[
 'location.href = "javascript:alert(1)";',
 "window.open('javascript:alert(2)');",
 'location = "https://example.org";',
 'const example = "location.href = \'javascript:alert(1)\'";',
 '// location.href = "javascript:alert(3)";',
 'location.href = "JAVASCRIPT:alert(4)";'
].join('\n')});
assert.deepEqual(jsUrlReport.findings.map(f=>[f.rule,f.severity,f.line]),[
 ['javascript-url','high',1],
 ['javascript-url','high',2],
 ['javascript-url','high',6]
]);
console.log('PASS: RX Developer 3.1 javascript navigation URL detection and quoted-text exclusion');

const srcdocReport=inspectSource({path:'src/iframe.js',source:[
 'frame.srcdoc = userHtml;',
 'const example = "frame.srcdoc = userHtml";',
 '// frame.srcdoc = maliciousHtml;',
 'frame.srcdoc = "<p>Safe static example</p>";'
].join('\n')});
assert.deepEqual(srcdocReport.findings.map(f=>[f.rule,f.severity,f.line]),[
 ['unsafe-iframe-srcdoc','medium',1],
 ['unsafe-iframe-srcdoc','medium',4]
]);
console.log('PASS: RX Developer 3.2 iframe srcdoc assignment detection');

const adjacentReport=inspectSource({path:'src/adjacent.js',source:[
 'panel.insertAdjacentHTML("beforeend", userHtml);',
 'const example = "panel.insertAdjacentHTML(\'beforeend\', userHtml)";',
 '// panel.insertAdjacentHTML("beforeend", maliciousHtml);',
 'panel.insertAdjacentText("beforeend", safeText);',
 'panel.insertAdjacentHTML("afterbegin", "<b>Static</b>");'
].join('\n')});
assert.deepEqual(adjacentReport.findings.map(f=>[f.rule,f.severity,f.line]),[
 ['insert-adjacent-html','medium',1],
 ['insert-adjacent-html','medium',5]
]);
console.log('PASS: RX Developer 3.3 insertAdjacentHTML detection and text/comment exclusions');

const outerReport=inspectSource({path:'src/outer.js',source:[
 'node.outerHTML = untrustedMarkup;',
 'const example = "node.outerHTML = untrustedMarkup";',
 '// node.outerHTML = maliciousMarkup;',
 'node.outerHTML = "<section>Static</section>";',
 'node.outerHTML === currentMarkup;'
].join('\n')});
assert.deepEqual(outerReport.findings.map(f=>[f.rule,f.severity,f.line]),[
 ['outer-html','medium',1],
 ['outer-html','medium',4]
]);
console.log('PASS: RX Developer 3.4 outerHTML detection and quoted/comment exclusions');

const parserReport=inspectSource({path:'src/parser.js',source:[
 'parser.parseFromString(userHtml, "text/html");',
 'parser.parseFromString(xml, "application/xml");',
 'const example = "parser.parseFromString(x, \'text/html\')";',
 '// parser.parseFromString(malicious, "text/html");',
 "parser.parseFromString(otherHtml, 'text/html');"
].join('\n')});
assert.deepEqual(parserReport.findings.map(f=>[f.rule,f.severity,f.line]),[
 ['domparser-html','medium',1],
 ['domparser-html','medium',5]
]);
console.log('PASS: RX Developer 3.5 DOMParser HTML detection and safe XML/text exclusions');

const domainReport=inspectSource({path:'src/domain.js',source:[
 'document.domain = "example.org";',
 'const example = "document.domain = example.org";',
 '// document.domain = "bad.example.org";',
 'if (document.domain === expectedDomain) {}',
 'document . domain = host;'
].join('\n')});
assert.deepEqual(domainReport.findings.map(f=>[f.rule,f.severity,f.line]),[
 ['dangerous-document-domain','high',1],
 ['dangerous-document-domain','high',5]
]);
console.log('PASS: RX Developer 3.6 document.domain assignment detection');

const equalityReport=inspectSource({path:'src/equality.js',source:[
 'if (node.innerHTML === expectedHtml) {}',
 'if (frame.srcdoc == expectedDoc) {}',
 'node.innerHTML = userHtml;',
 'frame.srcdoc = userHtml;',
 'const sample = "node.innerHTML = userHtml";',
 '// frame.srcdoc = userHtml;'
].join('\n')});
assert.deepEqual(equalityReport.findings.map(f=>[f.rule,f.severity,f.line]),[
 ['inner-html','medium',3],
 ['unsafe-iframe-srcdoc','medium',4]
]);
console.log('PASS: RX Developer 3.7 HTML assignment versus equality');

const arrowReport=inspectSource({path:'src/arrow.js',source:[
 'const a = node.innerHTML => value;',
 'const b = frame.srcdoc => value;',
 'const c = node.outerHTML => value;',
 'const d = document.domain => value;',
 'node.innerHTML = userHtml;',
 'frame.srcdoc = userHtml;',
 'node.outerHTML = userHtml;',
 'document.domain = newDomain;'
].join('\n')});
assert.deepEqual(arrowReport.findings.map(f=>[f.rule,f.severity,f.line]),[
 ['dangerous-document-domain','high',8],
 ['inner-html','medium',5],
 ['unsafe-iframe-srcdoc','medium',6],
 ['outer-html','medium',7]
]);
console.log('PASS: RX Developer 3.8 arrow syntax is not HTML/domain assignment');
