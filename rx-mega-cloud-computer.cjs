'use strict';
// RX MEGA CLOUD COMPUTER: runs bounded, local, allowlisted Node checks in GitHub Actions.
// No shell, arbitrary commands, cloud provisioning, credentials, spending or deployment.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {createRXCloudComputer}=require('./rx-cloud-computer.cjs');
const {simulateRing}=require('./rx-cosmic-collider.cjs');
const {estimateSolar}=require('./rx-energy-lab.cjs');
const {syntheticDemo}=require('./rx-higgs-lab.cjs');
const CHECKS=Object.freeze([
 'tests/rx-ai-core.cjs','tests/rx-cloud-computer.cjs','tests/rx-integration.cjs',
 'tests/rx-higgs-lab.cjs','tests/rx-cosmic-collider.cjs','tests/rx-energy-lab.cjs',
 'tests/rx-ant-ai-trainer.cjs','tests/rx-ant-task-board.cjs','tests/rx-medusa-engine.cjs'
]);
function runCloudComputer({execute=false,selectedChecks=CHECKS,maxChecks=CHECKS.length}={}){
 if(!Array.isArray(selectedChecks)||selectedChecks.length>CHECKS.length||!Number.isSafeInteger(maxChecks)||maxChecks<0||maxChecks>CHECKS.length)throw Error('Invalid RX ant check budget');
 if(selectedChecks.some(file=>typeof file!=='string'||!CHECKS.includes(file))||new Set(selectedChecks).size!==selectedChecks.length)throw Error('RX ant check not allowlisted or duplicate');
 const selected=selectedChecks.slice(0,maxChecks);
 const planner=createRXCloudComputer({maxTasks:20});
 for(let i=0;i<selected.length;i++)planner.enqueue({id:'RXJOB-check-'+i,kind:'run_unit_tests',target:selected[i]});
 const checks=selected.map(file=>{
  if(!execute)return {file,status:'planned'};
  const started=Date.now();
  const result=spawnSync(process.execPath,[file],{cwd:__dirname,encoding:'utf8',timeout:20000,maxBuffer:65536,env:{PATH:process.env.PATH||''}});
  return {file,durationMs:Date.now()-started,status:result.status===0&&!result.error?'passed':'failed',exitCode:result.status,error:result.error?String(result.error.message).slice(0,200):null};
 });
 return {schema:1,kind:'rx-mega-cloud-computer',executionEnvironment:'github-actions-or-local-node',cloudServerProvisioned:false,physicalHardwareOwned:false,checks,requested:selectedChecks.length,deferred:selectedChecks.length-selected.length,limit:maxChecks,executed:execute?checks.length:0,passed:checks.filter(x=>x.status==='passed').length,failed:checks.filter(x=>x.status==='failed').length,planned:checks.filter(x=>x.status==='planned').length,totalTestDurationMs:checks.reduce((sum,x)=>sum+(x.durationMs||0),0),queue:planner.report(),labs:{collider:simulateRing(),energy:estimateSolar(),higgs:syntheticDemo()},note:'Only fixed repository tests execute. Lab inputs are synthetic or estimates. No live CERN data, trained model, physical collider or automatic deployment.'};
}
if(require.main===module){
 const report=runCloudComputer({execute:true});
 const file=path.join('rx-bibi-reports','rx-mega-cloud-computer.json');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 console.log('RX MEGA CLOUD COMPUTER:',report.passed,'passed,',report.failed,'failed');
 if(report.failed)process.exitCode=1;
}
module.exports={runCloudComputer,CHECKS};
