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
// Paired masking comparison on identical inputs; no production source changes.
const maskCoreText=fs.readFileSync(require.resolve('./guard/rx-developer-core.cjs'),'utf8');
const optimizedFrame='const c=source[i],n=source[i+1],f=frames[frames.length-1];';
assert(maskCoreText.includes(optimizedFrame),'Expected current optimized frame lookup');
const legacyCore=maskCoreText.replace(" const emit=i=>{out[i]=source[i];};"," const top=()=>frames[frames.length-1];\n const emit=i=>{out[i]=source[i];};").replace(optimizedFrame,'const c=source[i],n=source[i+1],f=top();');
const maskSandbox={module:{exports:{}}};
vm.runInNewContext(legacyCore,maskSandbox,{timeout:1000});
const legacyMask=maskSandbox.module.exports.maskJavaScript;
const maskAB=largeSources.map(({lines,text})=>{
 assert.equal(legacyMask(text),maskJavaScript(text),'Mask output must remain identical');
 for(let i=0;i<20;i++){legacyMask(text);maskJavaScript(text);}
 const oldSamples=[],newSamples=[];
 const run=fn=>{const start=performance.now();for(let j=0;j<8;j++)fn(text);return (performance.now()-start)/8;};
 for(let i=0;i<7;i++){
  if(i%2===0){oldSamples.push(run(legacyMask));newSamples.push(run(maskJavaScript));}
  else{newSamples.push(run(maskJavaScript));oldSamples.push(run(legacyMask));}
 }
 const median=x=>x.sort((a,b)=>a-b)[3];
 const oldMs=median(oldSamples),newMs=median(newSamples);
 return {lines,oldMs:Number(oldMs.toFixed(5)),newMs:Number(newMs.toFixed(5)),ratio:Number((newMs/oldMs).toFixed(3))};
});
// Compare lexer behavior on diverse source syntax, not only repetitive safe lines.
const syntaxCases=[
 {name:'strings-and-comments',text:("const msg='// not a comment'; // eval(hidden)\nconst s=\"/* literal */\";\n").repeat(80)},
 {name:'templates-and-interpolation',text:("const t=`hello ${value + 1} world`;\nconst nested=`x${{a:1}.a}y`;\n").repeat(80)},
 {name:'regex-and-escapes',text:("const re=/https?:\\/\\/[^ ]+/g;\nconst escaped='\\\\n\\\\t';\n").repeat(80)},
 {name:'mixed-risk-patterns',text:("eval(userInput); // eval(fake)\nconst value=localStorage.getItem('key');\n").repeat(80)}
];
const maskSyntaxAB=syntaxCases.map(({name,text})=>{
 assert.equal(legacyMask(text),maskJavaScript(text),'Mask parity for '+name);
 for(let i=0;i<20;i++){legacyMask(text);maskJavaScript(text);}
 const oldSamples=[],newSamples=[];
 const run=fn=>{const t=performance.now();for(let i=0;i<20;i++)fn(text);return (performance.now()-t)/20;};
 for(let i=0;i<7;i++){
  if(i%2===0){oldSamples.push(run(legacyMask));newSamples.push(run(maskJavaScript));}
  else{newSamples.push(run(maskJavaScript));oldSamples.push(run(legacyMask));}
 }
 const median=a=>a.sort((x,y)=>x-y)[3];
 const oldMs=median(oldSamples),newMs=median(newSamples);
 return {name,bytes:Buffer.byteLength(text),oldMs:Number(oldMs.toFixed(5)),newMs:Number(newMs.toFixed(5)),ratio:Number((newMs/oldMs).toFixed(3))};
});
// Repeated paired runs quantify noise before choosing another lexer change.
const maskStability=syntaxCases.map(({name,text})=>{
 const rounds=[];
 const run=fn=>{const start=performance.now();for(let k=0;k<30;k++)fn(text);return (performance.now()-start)/30;};
 for(let round=0;round<9;round++){
  const firstLegacy=round%2===0;
  const oldMs=firstLegacy?run(legacyMask):null;
  const newMs=run(maskJavaScript);
  rounds.push({oldMs:oldMs??run(legacyMask),newMs});
 }
 const ratios=rounds.map(x=>x.newMs/x.oldMs).sort((a,b)=>a-b);
 return {name,rounds:ratios.length,medianRatio:Number(ratios[4].toFixed(3)),minRatio:Number(ratios[0].toFixed(3)),maxRatio:Number(ratios[8].toFixed(3)),note:'Paired local microbenchmarks; variation across rounds is expected.'};
});
// Memory footprint measurements are isolated in fresh child Node processes.
// heapUsed deltas are approximate and GC/JIT-sensitive; never treat as retained memory.
const {spawnSync}=require('node:child_process');
const memoryCases=[{name:'small',bytes:10600},{name:'medium',bytes:53000},{name:'large',bytes:159000}];
const maskMemory=memoryCases.map(({name,bytes})=>{
 const script=[
  "const {maskJavaScript}=require('./guard/rx-developer-core.cjs');",
  "const source=('const safe = 1;\\nconsole.debug(safe);\\n// eval(secret)\\n').repeat("+Math.floor(bytes/53)+");",
  "for(let i=0;i<20;i++)maskJavaScript(source);",
  "if(global.gc)global.gc();",
  "const before=process.memoryUsage().heapUsed;",
  "const result=maskJavaScript(source);",
  "const after=process.memoryUsage().heapUsed;",
  "process.stdout.write(JSON.stringify({sourceBytes:Buffer.byteLength(source),outputLength:result.length,heapDeltaBytes:after-before}));"
 ].join('');
 const child=spawnSync(process.execPath,['--expose-gc','-e',script],{cwd:process.cwd(),encoding:'utf8',timeout:15000,maxBuffer:1024*1024});
 assert.equal(child.status,0,'Memory probe failed: '+child.stderr);
 return {name,...JSON.parse(child.stdout),note:'Approximate per-call heapUsed delta in isolated Node process; not retained heap or peak RSS.'};
});
// Compare memory footprint of current character array with a Uint16Array buffer.
// This is an allocation experiment only; no production lexer change.
const memoryRepresentation=memoryCases.map(({name,bytes})=>{
 const script=[
  "const source=('const safe = 1;\\nconsole.debug(safe);\\n// eval(secret)\\n').repeat("+Math.floor(bytes/53)+");",
  "const measure=fn=>{if(global.gc)global.gc();const before=process.memoryUsage().heapUsed;const value=fn();return {heapDeltaBytes:process.memoryUsage().heapUsed-before,length:value.length};};",
  "const array=measure(()=>Array(source.length).fill(' '));",
  "const typed=measure(()=>new Uint16Array(source.length));",
  "process.stdout.write(JSON.stringify({array,typed}));"
 ].join('');
 const child=spawnSync(process.execPath,['--expose-gc','-e',script],{cwd:process.cwd(),encoding:'utf8',timeout:15000,maxBuffer:1024*1024});
 assert.equal(child.status,0,'Representation probe failed: '+child.stderr);
 return {name,bytes,...JSON.parse(child.stdout),note:'Heap-only measurements do not include typed-array external backing memory; not a direct total-memory comparison.'};
});
// Measure heap and external memory together in separate processes, including text conversion.
const memoryTotal=memoryCases.map(({name,bytes})=>{
 const probe=kind=>{
  const script=[
   "const source=('const safe = 1;\\nconsole.debug(safe);\\n// eval(secret)\\n').repeat("+Math.floor(bytes/53)+");",
   "for(let i=0;i<10;i++){const a="+(kind==='array'?"Array(source.length).fill(' ')":"new Uint16Array(source.length)")+";void a.length;}",
   "if(global.gc)global.gc();",
   "const before=process.memoryUsage();const start=performance.now();",
   kind==='array'?"const buffer=Array(source.length).fill(' ');const result=buffer.join('');":"const buffer=new Uint16Array(source.length);buffer.fill(32);const result=Array.from(buffer,x=>String.fromCharCode(x)).join('');",
   "const elapsedMs=performance.now()-start;const after=process.memoryUsage();",
   "process.stdout.write(JSON.stringify({length:result.length,elapsedMs,heapDeltaBytes:after.heapUsed-before.heapUsed,externalDeltaBytes:after.external-before.external,arrayBufferDeltaBytes:after.arrayBuffers-before.arrayBuffers,rssDeltaBytes:after.rss-before.rss}));"
  ].join('');
  const child=spawnSync(process.execPath,['--expose-gc','-e',script],{cwd:process.cwd(),encoding:'utf8',timeout:15000,maxBuffer:1024*1024});
  assert.equal(child.status,0,'Total memory probe failed: '+child.stderr);
  return JSON.parse(child.stdout);
 };
 return {name,bytes,array:probe('array'),typed:probe('typed'),note:'One-shot allocation plus conversion; RSS and heap are noisy and overlap external/arrayBuffers, so do not sum these metrics.'};
});
// Compare allocation strategies that preserve the existing string output.
const maskOutputStrategies=memoryCases.map(({name,bytes})=>{
 const sample=('const safe = 1;\nconsole.debug(safe);\n// eval(secret)\n').repeat(Math.floor(bytes/53));
 const expected=maskJavaScript(sample);
 const variants={
  baseline:()=>maskJavaScript(sample),
  chunkedJoin:()=>{
   const chars=Array(sample.length).fill(' ');
   for(let i=0;i<expected.length;i++)if(expected[i]!==' ')chars[i]=expected[i];
   const chunks=[];
   for(let i=0;i<chars.length;i+=4096)chunks.push(chars.slice(i,i+4096).join(''));
   return chunks.join('');
  },
  sparseReplacement:()=>{
   const chars=Array(sample.length).fill(' ');
   for(let i=0;i<expected.length;i++)if(expected[i]!==' ')chars[i]=expected[i];
   return chars.join('');
  }
 };
 for(const [variant,fn] of Object.entries(variants))assert.equal(fn(),expected,'Output mismatch: '+variant);
 return {name,bytes,variants:Object.entries(variants).map(([variant,fn])=>measure(variant,fn,30)),note:'Experimental output construction only; variants reuse precomputed mask, so timings are not full scanner alternatives.'};
});
// Full-lexer A/B: identical scanner, different final output assembly.
const joinSnippet="return out.join('');";
const chunkedSnippet="const chunks=[];for(let k=0;k<out.length;k+=4096)chunks.push(out.slice(k,k+4096).join(''));return chunks.join('');";
assert(coreText.includes(joinSnippet)||coreText.includes(chunkedSnippet),'RX mask output changed; update A/B benchmark deliberately');
const chunkedCore=coreText.includes(joinSnippet)?coreText.replace(joinSnippet,chunkedSnippet):coreText;
const chunkSandbox={module:{exports:{}},exports:{}};vm.runInNewContext(chunkedCore,chunkSandbox,{timeout:5000});
const chunkedMask=chunkSandbox.module.exports.maskJavaScript;
assert.equal(typeof chunkedMask,'function');
const fullMaskAB=memoryCases.map(({name,bytes})=>{
 const sample=('const safe = 1;\nconsole.debug(safe);\n// eval(secret)\n').repeat(Math.floor(bytes/53));
 assert.equal(chunkedMask(sample),maskJavaScript(sample),'Full lexer output mismatch: '+name);
 const rounds=[];
 for(let i=0;i<9;i++){
  const first=i%2===0?maskJavaScript:chunkedMask;
  const second=i%2===0?chunkedMask:maskJavaScript;
  const a=measure('first',()=>first(sample),20).medianMs;
  const b=measure('second',()=>second(sample),20).medianMs;
  rounds.push({baselineMs:i%2===0?a:b,chunkedMs:i%2===0?b:a});
 }
 const ratios=rounds.map(x=>x.chunkedMs/x.baselineMs).sort((a,b)=>a-b);
 return {name,bytes,rounds:9,medianRatio:Number(ratios[4].toFixed(3)),minRatio:Number(ratios[0].toFixed(3)),maxRatio:Number(ratios[8].toFixed(3)),note:'Paired full-scanner comparisons; lower than 1 means chunked is faster.'};
});
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
const output={schema:1,kind:'rx-performance-benchmark',node:process.version,disclaimer:'Local CI microbenchmarks only; no paid provider calls, production changes, or end-to-end latency claims.',developerAB,developerScale,developerPhases,maskAB,maskSyntaxAB,maskStability,maskMemory,memoryRepresentation,memoryTotal,maskOutputStrategies,fullMaskAB,results};
fs.mkdirSync('rx-bibi-reports',{recursive:true});
fs.writeFileSync('rx-bibi-reports/rx-performance-benchmark.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX performance microbenchmarks\n'+results.map(x=>'- '+x.name+': '+x.medianMs+' ms median/call').join('\n')+'\n');
