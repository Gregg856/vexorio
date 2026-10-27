'use strict';
// RX QUEEN ANT SUPERVISOR: read-only, evidence-based triage of local reports.
const fs=require('node:fs');
const path=require('node:path');
function summarize({computer=null,ai=null,panel=null,browser=null,studio=null,programs=null,fast=null,layout=null}={}){
 const issues=[];
 if(layout){
  if(layout.kind!=='rx-queen-mobile-layout'||layout.schema!==1||typeof layout.programsCollapsed!=='boolean'||!layout.hero||!layout.catalog||!Number.isFinite(layout.documentWidth)||!Number.isFinite(layout.viewportWidth))throw Error('Invalid mobile layout report');
  if(!layout.programsCollapsed)issues.push({source:'layout',priority:'medium',action:'collapse_program_catalog',target:'guard-rx-programs.js'});
  if(!(layout.hero.top<layout.catalog.top))issues.push({source:'layout',priority:'medium',action:'fix_mobile_panel_order',target:'guard-rx-programs.js'});
  if(layout.documentWidth>layout.viewportWidth+2)issues.push({source:'layout',priority:'high',action:'fix_horizontal_overflow',target:'guard-lab.html'});
 }

 if(fast){
  if(fast.kind!=='rx-fast-test-engine'||!Array.isArray(fast.results))throw Error('Invalid RX FAST report');
  for(const t of fast.results){
   if(t.ok===false)issues.push({source:'fast',priority:'high',action:t.timedOut?'inspect_test_timeout':'inspect_failed_test',target:String(t.file).slice(0,120)});
  }
 }
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
 return {schema:1,kind:'rx-queen-ant-supervisor',state:issues.length?'attention_required':'no_reported_failures',sourcesChecked:{computer:!!computer,ai:!!ai,panel:!!panel,browser:!!browser,studio:!!studio,programs:!!programs,fast:!!fast,layout:!!layout},issues,autoFixesApplied:0,productionChanges:0,note:'Only reports available in current CI workspace. No autonomous code modifications or real-world AI quality claims.'};
}
if(require.main===module){
 const invalidReports=[];
 const read=name=>{
  let raw;
  try{raw=fs.readFileSync(path.join('rx-bibi-reports',name),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  try{return JSON.parse(raw);}
  catch(e){
   // A corrupt or concatenated CI report must not disable MEDUSA and the ant board.
   invalidReports.push({source:'report',priority:'high',action:'inspect_invalid_json_report',target:name});
   return null;
  }
 };
 const panel=read('rx-queen-panel-check.json');
 const browser=read('rx-queen-panel-browser.json');
 const report=summarize({computer:read('rx-mega-cloud-computer.json'),ai:read('rx-ant-ai-evaluation.json'),panel,browser,studio:read('rx-bibi-studio-check.json'),programs:read('rx-programs-browser.json'),fast:read('rx-fast-tests.json'),layout:read('rx-queen-live-layout.json')});
 for(const [name,exists] of [['panel',!!panel],['browser',!!browser],['studio',!!read('rx-bibi-studio-check.json')],['programs',!!read('rx-programs-browser.json')]]){
  if(!exists)report.issues.push({source:name,priority:'medium',action:'missing_'+name+'_report',target:'rx-bibi-reports'});
 }
 report.issues.push(...invalidReports);
 if(report.issues.length)report.state='attention_required';
 const fastReport=read('rx-fast-tests.json');
 if(fastReport)report.fastMetrics={elapsedMs:fastReport.elapsedMs??null,slowest:Array.isArray(fastReport.slowest)?fastReport.slowest:[]};
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-queen-ant-supervisor.json',JSON.stringify(report,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY){
  const fast=report.fastMetrics;
  const slow=fast?.slowest?.map(t=>'  - '+t.file+': '+t.ms+' ms'+(t.ok?'':' (błąd)')).join('\n');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX QUEEN — zadania mrówek\n- Stan: '+report.state+'\n- Zgłoszenia: '+report.issues.length+'\n- Automatyczne poprawki: 0\n'+(fast?'- RX FAST, czas całej serii: '+(fast.elapsedMs===null?'brak pomiaru':fast.elapsedMs+' ms')+'\n- Najwolniejsze testy:\n'+(slow||'  - brak danych')+'\n':''));
 }
 console.log('RX QUEEN ANT SUPERVISOR:',report.state,report.issues.length,'issues');
}
module.exports={summarize};
