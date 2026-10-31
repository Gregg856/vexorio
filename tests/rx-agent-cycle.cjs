'use strict';
// RX BIBI multi-agent cycle: actual local work, not a claim of live production learning.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const outputDir='rx-bibi-reports';
fs.mkdirSync(outputDir,{recursive:true});
const agents=[
 {id:'nauczyciel',command:process.execPath,args:['tests/rx-learning-gate.cjs'],artifact:'rx-learning-gate.json'},
 {id:'tester',command:process.execPath,args:['--test','tests/rx-ai-router.cjs','tests/rx-coordinator.cjs']},
 {id:'strazak',command:process.execPath,args:['--check','rx-neural-core.cjs']}
];
const result={schema:1,kind:'rx-bibi-agent-cycle',timestamp:new Date().toISOString(),productionConnected:false,agents:[],status:'FAIL'};
for(const agent of agents){
 const started=Date.now();
 const run=cp.spawnSync(agent.command,agent.args,{cwd:process.cwd(),encoding:'utf8',timeout:90000,maxBuffer:1024*1024,env:{...process.env,CI:'true'}});
 const ok=run.status===0&&!run.error;
 result.agents.push({id:agent.id,status:ok?'PASS':'FAIL',durationMs:Date.now()-started,
  exitCode:run.status,error:run.error?run.error.message:null,
  artifact:agent.artifact||null,
  outputTail:(run.stdout||'').slice(-800),
  errorTail:(run.stderr||'').slice(-800)});
}
result.status=result.agents.every(a=>a.status==='PASS')?'PASS':'FAIL';
const reportPath=path.join(outputDir,'rx-agent-cycle.json');
fs.writeFileSync(reportPath,JSON.stringify(result,null,2)+'\n');
console.log('RX BIBI AGENT CYCLE',JSON.stringify({status:result.status,agents:result.agents.map(a=>({id:a.id,status:a.status}))}));
if(result.status!=='PASS')process.exitCode=1;
