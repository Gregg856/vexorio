'use strict';
// RX Benchmark 4.0: independent exploratory stress set. Misses are reported, not hidden.
const fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const {analyzeJavaScript}=require('./guard/rx-developer-core.cjs');
const cases=[
  [
    "function f(e){return e(input)};const e=eval;e(input)",
    1
  ],
  [
    "const e=eval;function f(e){return e(input)};e(input)",
    1
  ],
  [
    "const s=localStorage;function f(s){s.setItem('x',v)};s.setItem('x',v)",
    1
  ],
  [
    "const e=eval;function f(e){return e(input)}",
    0
  ],
  [
    "const e=eval;const f=(e)=>e(input)",
    0
  ],
  [
    "const e=eval;{let e=JSON.parse;e(input)}",
    0
  ],
  [
    "const e=eval;e(input);e=JSON.parse",
    1
  ],
  [
    "const e=eval; e?.(input)",
    1
  ],
  [
    "globalThis['eval'](input)",
    1
  ],
  [
    "window['eval'](input)",
    1
  ],
  [
    "(0,globalThis.eval)(input)",
    1
  ],
  [
    "const obj={eval(){return 1}};obj.eval()",
    0
  ],
  [
    "const obj={eval:(x)=>x};obj.eval(input)",
    0
  ],
  [
    "class A{eval(){return 1}}",
    0
  ],
  [
    "function evalSafe(x){return x}",
    0
  ],
  [
    "const msg='eval(input)'",
    0
  ],
  [
    "const t=`eval(input)`",
    0
  ],
  [
    "const t=`hello ${eval(input)}`",
    1
  ],
  [
    "const r=/eval\\(input\\)/",
    0
  ],
  [
    "/* eval(input) */ console.info('ok')",
    1
  ],
  [
    "// eval(input)\nconst x=1",
    0
  ],
  [
    "document['write'](input)",
    1
  ],
  [
    "document.write(input)",
    1
  ],
  [
    "const document={write(x){return x}};document.write(input)",
    0
  ],
  [
    "element.innerHTML = input",
    1
  ],
  [
    "element['innerHTML']=input",
    1
  ],
  [
    "element[`innerHTML`]=input",
    1
  ],
  [
    "element.textContent=input",
    0
  ],
  [
    "element.innerHTML += input",
    1
  ],
  [
    "element.outerHTML=input",
    1
  ],
  [
    "element.insertAdjacentHTML('beforeend',input)",
    1
  ],
  [
    "location.href=next",
    1
  ],
  [
    "location['href']=next",
    1
  ],
  [
    "window.location.href=next",
    1
  ],
  [
    "const location={href:1};location.href=next",
    0
  ],
  [
    "console.error(secret)",
    1
  ],
  [
    "console.log(secret)",
    1
  ],
  [
    "console['log'](secret)",
    1
  ],
  [
    "const console={log(){}};console.log(secret)",
    0
  ],
  [
    "localStorage.setItem('token',secret)",
    1
  ],
  [
    "sessionStorage.setItem('token',secret)",
    1
  ],
  [
    "const store=localStorage;store.setItem('token',secret)",
    1
  ],
  [
    "const store=localStorage;function f(store){store.setItem('x',1)}",
    0
  ],
  [
    "window.postMessage(data,'*')",
    1
  ],
  [
    "window.postMessage(data,'https://example.com')",
    1
  ],
  [
    "window.open(url)",
    1
  ],
  [
    "setInterval(()=>tick(),100)",
    1
  ],
  [
    "setTimeout(()=>tick(),100)",
    0
  ],
  [
    "document.cookie=token",
    1
  ],
  [
    "const s='document.cookie=token'",
    0
  ],
  [
    "const a={foo:'eval(input)'}",
    0
  ],
  [
    "const a={foo(){return eval(input)}}",
    1
  ],
  [
    "const x=JSON.parse(input)",
    0
  ],
  [
    "const x=Function(input)",
    1
  ],
  [
    "new Function(input)",
    1
  ],
  [
    "const x=1/2",
    0
  ],
  [
    "const r=/https?:\\/\\//",
    0
  ],
  [
    "const x='innerHTML='",
    0
  ],
  [
    "const x=({eval(){}})",
    0
  ],
  [
    "const x=window.open",
    0
  ]
];
const start=performance.now();let tp=0,tn=0,fp=0,fn=0;const misses=[];
for(const [source,expected] of cases){const findings=analyzeJavaScript(source).findings;const actual=Number(findings.length>0);if(expected&&actual)tp++;else if(expected)fn++;else if(actual)fp++;else tn++;if(actual!==expected)misses.push({source,expected,actual,ids:findings.map(f=>f.id)});}
const report={suite:'RX Benchmark 4.0',scope:'60 exploratory cases, including new lexical and scope stressors; not a security certification',total:cases.length,passed:tp+tn,accuracy:(tp+tn)/cases.length,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,confusion:{tp,tn,fp,fn},elapsedMs:Number((performance.now()-start).toFixed(3)),misses};
fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-benchmark-4-0.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(cases.length!==60)process.exitCode=1;
