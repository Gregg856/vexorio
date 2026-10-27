'use strict';
// RX QUEEN <-> RX AI 2.0: bounded planning only; never executes tasks.
const {route,report}=require('./rx-ai-router.cjs');
const {summarize}=require('./rx-queen-ant-supervisor.cjs');
const ACTION_TO_INTENT=Object.freeze({
 inspect_failed_test:'inspect_tests',
 inspect_panel_test:'inspect_tests',
 inspect_browser_test:'inspect_tests',
 inspect_studio_test:'inspect_tests',
 inspect_programs_test:'inspect_tests',
 investigate_model_regression:'classify_task'
});
function plan(supervisor){
 if(!supervisor||supervisor.kind!=='rx-queen-ant-supervisor'||!Array.isArray(supervisor.issues)||supervisor.issues.length>100)throw Error('Invalid supervisor report');
 const tasks=supervisor.issues.map((issue,index)=>{
  if(!issue||typeof issue.action!=='string'||typeof issue.target!=='string')throw Error('Invalid issue');
  const intent=ACTION_TO_INTENT[issue.action]||'unknown';
  const decision=route(intent);
  return {id:'RXQ-'+String(index+1).padStart(3,'0'),source:String(issue.source||'unknown').slice(0,60),action:issue.action.slice(0,80),target:issue.target.slice(0,120),intent,supported:decision.supported,handler:decision.supported?decision.module:null,requiresApproval:true,status:'proposed'};
 });
 return {schema:1,kind:'rx-queen-ai-bridge',aiVersion:report().version,availableCapabilities:report().capabilities.length,issuesReceived:tasks.length,tasks,autoExecuted:0,productionChanges:0};
}
if(require.main===module){
 const fs=require('node:fs');let supervisor=null;
 try{supervisor=JSON.parse(fs.readFileSync('rx-bibi-reports/rx-queen-ant-supervisor.json','utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
 const result=plan(supervisor||summarize());
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-queen-ai-bridge.json',JSON.stringify(result,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX QUEEN ↔ RX AI 2.0\n- Zaplanowane zadania: '+result.tasks.length+'\n- Automatycznie wykonane: 0\n');
 console.log('RX QUEEN AI BRIDGE:',result.tasks.length,'tasks proposed');
}
module.exports={plan};
