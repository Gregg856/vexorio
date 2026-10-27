'use strict';
// Deterministic, read-only microbenchmarks. These timings are not production latency.
const {performance}=require('node:perf_hooks');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {selectFastTests}=require('./rx-fast-test-engine.cjs');
const {summarizeRxBibi}=require('./rx-bibi-dashboard-summary.cjs');
const {analyzeJavaScript,maskJavaScript}=require('./guard/rx-developer-core.cjs');
const {buildBoard,buildCosmosQueue}=require('./rx-ant-task-board.cjs');
function measure(name,fn,iterations=200){
 for(let i=0;i<20;i++)fn();
 const samples=[];
 for(let i=0;i<5;i++){
  const start=performance.now();
  for(let j=0;j<iterations;j++)fn();
  samples.push((performance.now()-start)/iterations);
 }
 samples.sort((a,b)=>a-b);
 return {name,iterations,medianMs:Number(samples[2].toFixed(5)),minMs:Number(samples[0].toFixed(5)),maxMs:Number(samples[4].toFixed(5))};
}
const tasks=Array.from({length:80},(_,i)=>({source:'fast',action:'inspect',target:'tests/test-'+i+'.cjs',priority:i%4===0?'critical':i%4===1?'high':i%4===2?'medium':'low'}));
const supervisor={kind:'rx-queen-ant-supervisor',issues:tasks};
const board=buildBoard(supervisor,{maxTasks:80});
const report={kind:'rx-bibi-unified-adapter',runId:'benchmark',summary:{signals:80},board,reviewQueue:{tasks:board.tasks.map(()=>({approved:false,executed:false}))},developerQueue:{reviews:[]}};
const source=('const safe = 1;\nconsole.debug(safe);\n// eval(secret)\n').repeat(200);
// Compare previous and current line indexing in the same process and input.
const coreText=fs.readFileSync(require.resolve('./guard/rx-developer-core.cjs'),'utf8');
const oldSnippet="const lineStarts=[0];\n for(let i=0;i<source.length;i++)if(source[i]==='\\n')lineStarts.push(i+1);";
const newSnippet="const lineStarts=[0];\n for(let i=source.indexOf('\\n');i!==-1;i=source.indexOf('\\n',i+1))lineStarts.push(i+1);";
assert(coreText.includes(newSnippet),'Current RX Developer indexing changed; update A/B benchmark deliberately');
const legacyText=coreText.replace(newSnippet,oldSnippet);
const sandbox={module:{exports:{}},exports:{}};
vm.runInNewContext(legacyText,sandbox,{timeout:1000,filename:'rx-developer-legacy-benchmark.cjs'});
const legacyAnalyze=sandbox.module.exports.analyzeJavaScript;
assert.deepEqual(JSON.parse(JSON.stringify(legacyAnalyze(source))),JSON.parse(JSON.stringify(analyzeJavaScript(source))),'A/B implementations must return identical findings');
function pairedBenchmark(rounds=9,iterations=60){
 const pairs=[];
 for(let k=0;k<60;k++){legacyAnalyze(source);analyzeJavaScript(source);}
 for(let i=0;i<rounds;i++){
  const run=fn=>{const t=performance.now();for(let k=0;k<iterations;k++)fn(source);return (performance.now()-t)/iterations;};
  const oldFirst=i%2===0;
  const legacy=oldFirst?run(legacyAnalyze):null;
  const current=run(analyzeJavaScript);
  pairs.push({legacyMs:legacy??run(legacyAnalyze),currentMs:current});
 }
 const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
 const legacyMedianMs=median(pairs.map(p=>p.legacyMs));
 const currentMedianMs=median(pairs.map(p=>p.currentMs));
 return {name:'RX Developer indexing A/B',rounds,iterations,legacyMedianMs:Number(legacyMedianMs.toFixed(5)),currentMedianMs:Number(currentMedianMs.toFixed(5)),ratio:Number((currentMedianMs/legacyMedianMs).toFixed(3)),note:'Ratio below 1 suggests improvement; different-process benchmarks are not directly comparable.'};
}
const developerAB=pairedBenchmark();
// Scale analysis with file size; cap iterations to keep CI inexpensive.
const largeSources=[1000,5000,15000].map(lines=>({lines,text:('const safe = 1;\nconsole.debug(safe);\n// eval(secret)\n').repeat(lines/5)}));
const developerScale=largeSources.map(({lines,text})=>({lines,bytes:Buffer.byteLength(text),...measure('RX Developer large source',()=>analyzeJavaScript(text),lines>=15000?5:lines>=5000?10:20)}));
// Phase-level profiling: mask and full scan on identical inputs.
// The remainder is estimated from independent medians, not a direct timer.
const developerPhases=largeSources.map(({lines,text})=>{
 const iterations=lines>=15000?5:lines>=5000?10:20;
 const masking=measure('RX Developer masking',()=>maskJavaScript(text),iterations);
 const total=measure('RX Developer full scan',()=>analyzeJavaScript(text),iterations);
 return {lines,bytes:Buffer.byteLength(text),maskingMs:masking.medianMs,totalMs:total.medianMs,remainingMs:Number(Math.max(0,total.medianMs-masking.medianMs).toFixed(5)),note:'Remaining includes line indexing, regex matching, sorting and object creation; independently measured medians are approximate.'};
});
const results=[
 measure('RX FAST test selection',()=>selectFastTests(['rx-ant-task-board.cjs']),1000),
 measure('RX BIBI dashboard summary',()=>summarizeRxBibi(report),1000),
 measure('RX Developer source analysis',()=>analyzeJavaScript(source),30),
 measure('RX ants task board',()=>buildBoard(supervisor,{maxTasks:80}),200),
 measure('RX COSMOS queue',()=>buildCosmosQueue(board),200)
];
const output={schema:1,kind:'rx-performance-benchmark',node:process.version,disclaimer:'Local CI microbenchmarks only; no paid provider calls, production changes, or end-to-end latency claims.',developerAB,developerScale,developerPhases,results};
fs.mkdirSync('rx-bibi-reports',{recursive:true});
fs.writeFileSync('rx-bibi-reports/rx-performance-benchmark.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX performance microbenchmarks\n'+results.map(x=>'- '+x.name+': '+x.medianMs+' ms median/call').join('\n')+'\n');
