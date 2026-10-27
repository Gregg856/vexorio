'use strict';
// RX Benchmark 5.0: fresh exploratory cases; labels are heuristic expectations, not security proofs.
const fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const {analyzeJavaScript}=require('./guard/rx-developer-core.cjs');
const cases=[
  [
    "const x = eval; function outer(){function inner(x){return x(code)};return x(code)}",
    1
  ],
  [
    "const x = eval; function outer(x){return ()=>x(code)}",
    0
  ],
  [
    "const x = eval; const f=(x)=>{return x(code)};x(code)",
    1
  ],
  [
    "const x = eval; x(code); x = JSON.parse",
    1
  ],
  [
    "const x = eval; x = JSON.parse; x(code)",
    0
  ],
  [
    "const x = eval; {const x=JSON.parse;x(code)};x(code)",
    1
  ],
  [
    "const x = eval; {const x=JSON.parse;x(code)}",
    0
  ],
  [
    "const x=eval;function f(){const x=JSON.parse;return x(code)}",
    0
  ],
  [
    "const x=eval;function f(){return x(code)}",
    1
  ],
  [
    "const x=eval;function f(x){return x(code)};function g(){return x(code)}",
    1
  ],
  [
    "const x=eval;const f=x?.(code)",
    1
  ],
  [
    "const x=eval;const f=x /*comment*/ (code)",
    1
  ],
  [
    "const x=eval;const f=x?.call(null,code)",
    1
  ],
  [
    "const x=eval;const f=x.call(null,code)",
    1
  ],
  [
    "const x=eval;const f=x.bind(null)",
    1
  ],
  [
    "const x=eval;const f=x",
    0
  ],
  [
    "const x=eval;console.log(x)",
    1
  ],
  [
    "const x=eval;JSON.stringify(x)",
    0
  ],
  [
    "const obj={eval(){return 1}};obj.eval()",
    0
  ],
  [
    "const obj={eval(){return eval(code)}}",
    1
  ],
  [
    "const obj={eval:(code)=>code};obj.eval(code)",
    0
  ],
  [
    "const obj={eval(){return 1},x:eval(code)}",
    1
  ],
  [
    "const obj={eval(){return 1},x(){return eval(code)}}",
    1
  ],
  [
    "const document={write(x){return x}};document.write(data)",
    0
  ],
  [
    "function f(document){document.write(data)}",
    0
  ],
  [
    "document.write(data)",
    1
  ],
  [
    "window.document.write(data)",
    1
  ],
  [
    "globalThis.document.write(data)",
    1
  ],
  [
    "document?.write(data)",
    1
  ],
  [
    "document['write'](data)",
    1
  ],
  [
    "document[`write`](data)",
    1
  ],
  [
    "const console={log(){}};console.log(secret)",
    0
  ],
  [
    "function f(console){console.log(secret)}",
    0
  ],
  [
    "console.log(secret)",
    1
  ],
  [
    "globalThis.console.log(secret)",
    1
  ],
  [
    "console['error'](secret)",
    1
  ],
  [
    "console?.warn(secret)",
    1
  ],
  [
    "const location={href:'/'};location.href=next",
    0
  ],
  [
    "function f(location){location.href=next}",
    0
  ],
  [
    "location.href=next",
    1
  ],
  [
    "window.location.href=next",
    1
  ],
  [
    "globalThis.location.href=next",
    1
  ],
  [
    "location.assign(next)",
    1
  ],
  [
    "location.replace(next)",
    1
  ],
  [
    "location['href']=next",
    1
  ],
  [
    "location[`href`]=next",
    1
  ],
  [
    "const el={innerHTML:''};el.innerHTML=input",
    1
  ],
  [
    "el.innerHTML=input",
    1
  ],
  [
    "el.innerHTML+=input",
    1
  ],
  [
    "el['innerHTML']+=input",
    1
  ],
  [
    "el[`innerHTML`]=input",
    1
  ],
  [
    "el[`inner${name}HTML`]=input",
    0
  ],
  [
    "el.textContent=input",
    0
  ],
  [
    "const html='el.innerHTML=input'",
    0
  ],
  [
    "const html=`el.innerHTML=input`",
    0
  ],
  [
    "const html=`${el.innerHTML=input}`",
    1
  ],
  [
    "const rx=/el\\.innerHTML=input/",
    0
  ],
  [
    "// el.innerHTML=input",
    0
  ],
  [
    "/* el.innerHTML=input */",
    0
  ],
  [
    "localStorage.setItem('token',secret)",
    1
  ],
  [
    "const store=localStorage;store.setItem('token',secret)",
    1
  ],
  [
    "const store=localStorage;function f(store){store.setItem('token',secret)};store.setItem('token',secret)",
    1
  ],
  [
    "const store=localStorage;function f(store){store.setItem('token',secret)}",
    0
  ],
  [
    "const store=localStorage;store=other;store.setItem('token',secret)",
    0
  ],
  [
    "const store=localStorage;store.setItem('token',secret);store=other",
    1
  ],
  [
    "sessionStorage.setItem('token',secret)",
    1
  ],
  [
    "const sessionStorage={setItem(){}};sessionStorage.setItem('token',secret)",
    0
  ],
  [
    "window.postMessage(data,'*')",
    1
  ],
  [
    "window.postMessage(data,'https://example.org')",
    1
  ],
  [
    "setInterval(()=>run(),100)",
    1
  ],
  [
    "const setInterval=(fn)=>fn();setInterval(()=>run(),100)",
    0
  ],
  [
    "new Function(code)",
    1
  ],
  [
    "Function(code)",
    1
  ],
  [
    "const Function=(code)=>code;Function(code)",
    0
  ],
  [
    "document.cookie=secret",
    1
  ],
  [
    "const document={cookie:''};document.cookie=secret",
    0
  ],
  [
    "window.open(url)",
    1
  ],
  [
    "const window={open(){}};window.open(url)",
    0
  ],
  [
    "JSON.parse(code)",
    0
  ],
  [
    "const value=1+2",
    0
  ]
];
const start=performance.now();let tp=0,tn=0,fp=0,fn=0;const misses=[];
for(const [source,expected] of cases){const findings=analyzeJavaScript(source).findings;const actual=Number(findings.length>0);if(expected&&actual)tp++;else if(expected)fn++;else if(actual)fp++;else tn++;if(actual!==expected)misses.push({source,expected,actual,ids:findings.map(f=>f.id)});}
const report={suite:'RX Benchmark 5.0',scope:'80 independent exploratory JavaScript patterns; binary finding presence, not a security certification',total:cases.length,passed:tp+tn,accuracy:(tp+tn)/cases.length,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,confusion:{tp,tn,fp,fn},elapsedMs:Number((performance.now()-start).toFixed(3)),misses};
fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-benchmark-5-0.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(cases.length!==80)process.exitCode=1;
