'use strict';
// Real RX turbine cloud executor. Only predefined repository tests; no arbitrary commands.
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const {createTurbine,executeApproved}=require('./rx-turbine-engine.cjs');
const {CHECKS}=require('./rx-mega-cloud-computer.cjs');
async function run({approved=false,maxParallel=2,selected=CHECKS.slice(0,4)}={}){
 if(!Array.isArray(selected)||selected.length>9||selected.some(x=>!CHECKS.includes(x))||new Set(selected).size!==selected.length)throw Error('Invalid allowlisted tests');
 const turbine=createTurbine({maxParallel,maxQueued:20});
 selected.forEach((target,i)=>turbine.submit({id:'RXJOB-cloud-'+i,kind:'run_unit_tests',target}));
 const handlers={run_unit_tests:target=>new Promise(resolve=>{
  const child=spawn(process.execPath,[target],{cwd:__dirname,env:{PATH:process.env.PATH||''},stdio:'ignore'});
  let finished=false;
  const timer=setTimeout(()=>{child.kill('SIGKILL');done(false)},20000);
  function done(ok){if(finished)return;finished=true;clearTimeout(timer);resolve(ok)}
  child.once('error',()=>done(false));child.once('close',code=>done(code===0));
 })};
 const report=await executeApproved(turbine,{approved,handlers,maxParallel});
 return {...report,environment:'github-actions-or-local-node',cloudExecutorConnected:process.env.GITHUB_ACTIONS==='true',physicalHardwareOwned:false,modelTrained:false};
}
if(require.main===module)run({approved:process.env.RX_TURBINE_APPROVED==='true'}).then(report=>{
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-turbine-power-execution.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({executed:report.executed,peakActive:report.peakActive,durationMs:report.durationMs,results:report.results},null,2));
 if(report.results.some(x=>x.status!=='completed'||!x.ok))process.exitCode=1;
}).catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={run};
