'use strict';
// RX QUEEN ANT SUPERVISOR: read-only, evidence-based triage of local reports.
const fs=require('node:fs');
const path=require('node:path');
function summarize({computer=null,ai=null,panel=null,browser=null,studio=null,programs=null}={}){
 const issues=[];
 if(computer){
  if(!Array.isArray(computer.checks))throw Error('Invalid computer report');
  for(const c of computer.checks)if(c.status==='failed')issues.push({source:'cloud',priority:'high',action:'inspect_failed_test',target:String(c.file).slice(0,120)});
 }
 if(ai){
  if(ai.kind!=='rx-ant-ai-evaluation'||typeof ai.candidateAccuracy!=='number')throw Error('Invalid AI report');
  if(ai.previousAccuracy!==null&&ai.candidateAccuracy<ai.previousAccuracy)issues.push({source:'ai',priority:'medium',action:'investigate_model_regression',target:'rx-ant-ai-trainer'});
 }
 if(panel){
  if(panel.kind!=='rx-queen-panel-check'||typeof panel.ok!=='boolean')throw Error('Invalid panel report');
  if(!panel.ok)issues.push({source:'panel',priority:'high',action:'inspect_panel_test',target:'guard-rx-queen-panel.js'});
 }
 if(browser){
  if(browser.kind!=='rx-queen-panel-browser'||typeof browser.ok!=='boolean')throw Error('Invalid browser report');
  if(!browser.ok)issues.push({source:'browser',priority:'high',action:'inspect_browser_test',target:'tests/rx-queen-panel-browser.cjs'});
 }
 for(const [name,report] of [['studio',studio],['programs',programs]]){
  if(report){if(report.kind!==('rx-'+(name==='studio'?'bibi-studio':'programs-browser'))||typeof report.ok!=='boolean')throw Error('Invalid '+name+' report');if(!report.ok)issues.push({source:name,priority:'high',action:'inspect_'+name+'_test',target:name==='studio'?'tests/rx-bibi-studio.cjs':'tests/rx-programs-browser.cjs'});}
 }
 return {schema:1,kind:'rx-queen-ant-supervisor',state:issues.length?'attention_required':'no_reported_failures',sourcesChecked:{computer:!!computer,ai:!!ai,panel:!!panel,browser:!!browser,studio:!!studio,programs:!!programs},issues,autoFixesApplied:0,productionChanges:0,note:'Only reports available in current CI workspace. No autonomous code modifications or real-world AI quality claims.'};
}
if(require.main===module){
 const read=name=>{try{return JSON.parse(fs.readFileSync(path.join('rx-bibi-reports',name),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 const panel=read('rx-queen-panel-check.json');
 const browser=read('rx-queen-panel-browser.json');
 const report=summarize({computer:read('rx-mega-cloud-computer.json'),ai:read('rx-ant-ai-evaluation.json'),panel:panel||{kind:'rx-queen-panel-check',ok:false},browser:browser||{kind:'rx-queen-panel-browser',ok:false},studio:read('rx-bibi-studio-check.json'),programs:read('rx-programs-browser.json')});
 if(!browser)report.issues[report.issues.length-1].action='missing_browser_report';
 if(!panel)report.issues[report.issues.length-1].action='missing_panel_report';
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-queen-ant-supervisor.json',JSON.stringify(report,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX QUEEN — zadania mrówek\n- Stan: '+report.state+'\n- Zgłoszenia: '+report.issues.length+'\n- Automatyczne poprawki: 0\n');
 console.log('RX QUEEN ANT SUPERVISOR:',report.state,report.issues.length,'issues');
}
module.exports={summarize};
