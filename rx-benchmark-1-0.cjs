'use strict';
// RX BENCHMARK 1.0 — deterministic, offline, rule-based JavaScript audit benchmark.
// This is NOT a general AI intelligence ranking or a comparison with GPT/Claude/Gemini.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const {analyzeJavaScript}=require('./guard/rx-developer-core.cjs');
const positives=[
 ['RX001','eval(payload)'],['RX002','node.innerHTML = payload'],['RX003','node.outerHTML = payload'],
 ['RX004','node.insertAdjacentHTML("beforeend",payload)'],['RX005','console.log(payload)'],
 ['RX006','document.write(payload)'],['RX007','new Function(payload)'],
 ['RX008','document.cookie = payload'],['RX009','window.postMessage(payload,"*")'],
 ['RX010','location.href = payload']
];
const negatives=[
 'const answer = 42;', 'const sum = (a,b) => a+b;',
 'const value = "eval(payload)";', '// eval(payload)\nconst safe=1;',
 '/* node.innerHTML = payload */ const safe=1;',
 'const t = "document.write(payload)";',
 'const result = [1,2,3].map(x=>x*2);',
 'const x = {name:"console.log(payload)"};',
 'const safe = Math.max(2,3);',
 'const text = "location.href = payload";'
];
const prefixes=['','const safe = 1;\n','// harmless prelude\n','let count=0;\n','function ok(){}\n'];
const cases=[];
for(let i=0;i<50;i++){
 const [rule,code]=positives[i%positives.length];
 cases.push({id:'P'+String(i+1).padStart(3,'0'),input:prefixes[Math.floor(i/10)]+code,expected:[rule]});
}
for(let i=0;i<50;i++)cases.push({id:'N'+String(i+1).padStart(3,'0'),input:prefixes[Math.floor(i/10)]+negatives[i%negatives.length],expected:[]});
assert.equal(cases.length,100);
const start=performance.now();
const failures=[];let tp=0,tn=0,fp=0,fn=0;
for(const test of cases){
 const actual=[...new Set(analyzeJavaScript(test.input).findings.map(x=>x.id))].sort();
 const expected=[...test.expected].sort();
 const ok=JSON.stringify(actual)===JSON.stringify(expected);
 if(!ok)failures.push({id:test.id,expected,actual});
 if(expected.length){if(ok)tp++;else fn++;}
 else if(ok)tn++;else fp++;
}
const elapsedMs=Number((performance.now()-start).toFixed(3));
const report={suite:'RX BENCHMARK 1.0',scope:'Deterministic JS rule-detection only; not a model leaderboard',total:cases.length,passed:tp+tn,failed:failures.length,confusion:{tp,tn,fp,fn},accuracy:Number(((tp+tn)/cases.length).toFixed(4)),elapsedMs,failures};
fs.mkdirSync(path.join(__dirname,'rx-bibi-reports'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'rx-bibi-reports','rx-benchmark-1-0.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
assert.equal(failures.length,0,'RX BENCHMARK 1.0 has mismatches');
