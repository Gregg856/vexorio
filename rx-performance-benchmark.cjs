'use strict';
// Deterministic, read-only microbenchmarks. These timings are not production latency.
const {performance}=require('node:perf_hooks');
const fs=require('node:fs');
const {selectFastTests}=require('./rx-fast-test-engine.cjs');
const {summarizeRxBibi}=require('./rx-bibi-dashboard-summary.cjs');
const {analyzeJavaScript}=require('./guard/rx-developer-core.cjs');
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
const results=[
 measure('RX FAST test selection',()=>selectFastTests(['rx-ant-task-board.cjs']),1000),
 measure('RX BIBI dashboard summary',()=>summarizeRxBibi(report),1000),
 measure('RX Developer source analysis',()=>analyzeJavaScript(source),30),
 measure('RX ants task board',()=>buildBoard(supervisor,{maxTasks:80}),200),
 measure('RX COSMOS queue',()=>buildCosmosQueue(board),200)
];
const output={schema:1,kind:'rx-performance-benchmark',node:process.version,disclaimer:'Local CI microbenchmarks only; no paid provider calls, production changes, or end-to-end latency claims.',results};
fs.mkdirSync('rx-bibi-reports',{recursive:true});
fs.writeFileSync('rx-bibi-reports/rx-performance-benchmark.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX performance microbenchmarks\n'+results.map(x=>'- '+x.name+': '+x.medianMs+' ms median/call').join('\n')+'\n');
