'use strict';
// RX Benchmark 3.0 — independent exploratory edge cases; misses do not fail CI.
const fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const {analyzeJavaScript}=require('./guard/rx-developer-core.cjs');
const cases=[
 [
  "const e = eval; e(input)",
  1
 ],
 [
  "let e=eval;e(input)",
  1
 ],
 [
  "var e=eval;e(input)",
  1
 ],
 [
  "const s = localStorage; s.setItem('token',secret)",
  1
 ],
 [
  "const s=localStorage; s.getItem('theme')",
  0
 ],
 [
  "let e=eval;e=JSON.parse;e(input)",
  0
 ],
 [
  "const e=eval;function f(e){return e(input)}",
  0
 ],
 [
  "const e=eval;const text='e(input)'",
  0
 ],
 [
  "// const e=eval;e(input)",
  0
 ],
 [
  "const text='const e=eval;e(input)'",
  0
 ],
 [
  "/* (0,eval)(input) */",
  0
 ],
 [
  "const text='(0,eval)(input)'",
  0
 ],
 [
  "const r=/(0,eval)/",
  0
 ],
 [
  "obj[\"innerHTML\"] = input",
  1
 ],
 [
  "obj['innerHTML'] = input",
  1
 ],
 [
  "const s=\"obj['innerHTML']=input\"",
  0
 ],
 [
  "// obj['innerHTML']=input",
  0
 ],
 [
  "location[\"href\"] = nextUrl",
  1
 ],
 [
  "const s=\"location['href']=nextUrl\"",
  0
 ],
 [
  "// location['href']=nextUrl",
  0
 ],
 [
  "other['href']=url",
  0
 ],
 [
  "const locationValue={href:1}",
  0
 ],
 [
  "console.warn(secret)",
  1
 ],
 [
  "console.warn('hello')",
  1
 ],
 [
  "const s='console.warn(secret)'",
  0
 ],
 [
  "// console.warn(secret)",
  0
 ],
 [
  "localStorage.setItem('token',value)",
  1
 ],
 [
  "localStorage.getItem('theme')",
  0
 ],
 [
  "const s=localStorage;s=other;s.setItem('x',value)",
  0
 ],
 [
  "const s=localStorage;function f(s){s.setItem('x',value)}",
  0
 ],
 [
  "(0, eval)(input)",
  1
 ],
 [
  "const fn=eval;fn(userInput)",
  1
 ],
 [
  "const fn=JSON.parse;fn(userInput)",
  0
 ],
 [
  "globalThis.eval(userInput)",
  1
 ],
 [
  "const a={eval(){return 1}};a.eval()",
  0
 ],
 [
  "document.write(userInput)",
  1
 ],
 [
  "const s='document.write(userInput)'",
  0
 ],
 [
  "window.open(url)",
  1
 ],
 [
  "const s='window.open(url)'",
  0
 ],
 [
  "setInterval('go()',100)",
  1
 ],
 [
  "setInterval(()=>tick(),100)",
  1
 ],
 [
  "clearInterval(id)",
  0
 ],
 [
  "window.postMessage(data,'*')",
  1
 ],
 [
  "const s=\"window.postMessage(data,'*')\"",
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
  "obj.textContent=userInput",
  0
 ],
 [
  "JSON.parse(input)",
  0
 ],
 [
  "const x=1/2",
  0
 ],
 [
  "const t=`hello`",
  0
 ]
];
const start=performance.now();let tp=0,tn=0,fp=0,fn=0;const misses=[];
for(const [source,expected] of cases){const findings=analyzeJavaScript(source).findings;const actual=Number(findings.length>0);if(expected&&actual)tp++;else if(expected)fn++;else if(actual)fp++;else tn++;if(actual!==expected)misses.push({source,expected,actual,ids:findings.map(f=>f.id)});}
const report={suite:'RX Benchmark 3.0',scope:'50 exploratory edge cases including alias shadowing, reassignment, strings and computed properties; not a security certification',total:cases.length,passed:tp+tn,accuracy:(tp+tn)/cases.length,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,confusion:{tp,tn,fp,fn},elapsedMs:Number((performance.now()-start).toFixed(3)),misses};
fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-benchmark-3-0.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(cases.length!==50)process.exitCode=1;
