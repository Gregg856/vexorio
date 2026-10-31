'use strict';
// RX BIBI Agent Manager — bounded, deterministic multi-agent pipeline.
// No network, secrets, unapproved conversation data, code writes, or production deploy.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'rx-bibi-reports');
const JOBS=Object.freeze([
 {id:'nauczyciel',role:'training',args:['tests/rx-learning-gate.cjs'],dependsOn:[]},
 {id:'tester',role:'regression',args:['--test','tests/rx-ai-router.cjs','tests/rx-coordinator.cjs'],dependsOn:['nauczyciel']},
 {id:'strazak',role:'safety',args:['--check','rx-neural-core.cjs'],dependsOn:['nauczyciel']},
 {id:'weryfikator',role:'validation',args:['--check','rx-text-learner.cjs'],dependsOn:['tester','strazak']}
]);
function plan(){
 return JOBS.map(j=>({...j,command:'node',status:'PENDING'}));
}
function runCycle({execute=true}={}){
 const jobs=plan(),results=new Map();
 const runId=crypto.randomUUID();
 for(const job of jobs){
  if(job.dependsOn.some(id=>results.get(id)!=='PASS')){
   job.status='BLOCKED';results.set(job.id,job.status);continue;
  }
  if(!execute){job.status='PLANNED';results.set(job.id,job.status);continue;}
  const started=Date.now();
  const run=cp.spawnSync(process.execPath,job.args,{cwd:ROOT,encoding:'utf8',timeout:90000,maxBuffer:1024*1024,
    env:{PATH:process.env.PATH||'',CI:'true',HOME:process.env.HOME||''}});
  job.status=run.status===0&&!run.error?'PASS':'FAIL';
  job.durationMs=Date.now()-started;
  job.exitCode=run.status;
  job.outputTail=(run.stdout||'').slice(-500);
  job.errorTail=(run.stderr||'').slice(-500);
  results.set(job.id,job.status);
 }
 const report={schema:1,kind:'rx-bibi-agent-manager',runId,createdAt:new Date().toISOString(),
  status:execute?(jobs.every(j=>j.status==='PASS')?'PASS':'FAIL'):'PLANNED',
  productionConnected:false,autonomousCodeChanges:false,trainingData:'approved-static-only',
  jobs:jobs.map(({id,role,dependsOn,status,durationMs,exitCode,outputTail,errorTail})=>({id,role,dependsOn,status,durationMs,exitCode,outputTail,errorTail}))};
 if(execute){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'rx-agent-manager.json'),JSON.stringify(report,null,2)+'\n');}
 return report;
}
if(require.main===module){
 const dry=process.argv.includes('--dry-run');
 const report=runCycle({execute:!dry});
 console.log('RX BIBI AGENT MANAGER',JSON.stringify({status:report.status,jobs:report.jobs.map(j=>({id:j.id,status:j.status}))}));
 if(report.status==='FAIL')process.exitCode=1;
}
module.exports={plan,runCycle};
