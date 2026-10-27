'use strict';
// RX MEDUSA 1.0 — deterministic signal routing inside RX. No autonomous execution.
const PRIORITY=Object.freeze({critical:0,high:1,medium:2,low:3});
function routeSignals(supervisor,{maxSignals=100}={}){
 if(!supervisor||supervisor.kind!=='rx-queen-ant-supervisor'||!Array.isArray(supervisor.issues)||supervisor.issues.length>500||!Number.isSafeInteger(maxSignals)||maxSignals<1||maxSignals>500)throw Error('Invalid RX supervisor report or limit');
 const signals=new Map();
 for(const issue of supervisor.issues){
  if(!issue||typeof issue.source!=='string'||typeof issue.action!=='string'||typeof issue.target!=='string'||!Object.hasOwn(PRIORITY,issue.priority))throw Error('Invalid RX issue');
  const source=issue.source.slice(0,40),action=issue.action.slice(0,80),target=issue.target.slice(0,120);
  const key=JSON.stringify([source,action,target]);
  if(!signals.has(key))signals.set(key,{source,action,target,priority:issue.priority,occurrences:1,recipient:'rx-queen',requiresApproval:true});
  else{const s=signals.get(key);s.occurrences++;if(PRIORITY[issue.priority]<PRIORITY[s.priority])s.priority=issue.priority;}
 }
 const ordered=[...signals.values()].sort((a,b)=>PRIORITY[a.priority]-PRIORITY[b.priority]||b.occurrences-a.occurrences||a.source.localeCompare(b.source)||a.target.localeCompare(b.target));
 return {schema:1,kind:'rx-medusa-engine',engine:'RX',signals:ordered.slice(0,maxSignals),totalUnique:ordered.length,overflow:Math.max(0,ordered.length-maxSignals),autoExecuted:0,productionChanges:0,note:'Signals are recommendations for RX QUEEN; no autonomous fixes or model training.'};
}
if(require.main===module){
 const fs=require('node:fs');const path=require('node:path');
 const read=file=>{try{return JSON.parse(fs.readFileSync(path.join('rx-bibi-reports',file),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 const supervisor=read('rx-queen-ant-supervisor.json');
 if(!supervisor)throw Error('Missing RX QUEEN report');
 const result=routeSignals(supervisor);
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-medusa-signals.json',JSON.stringify(result,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX MEDUSA 1.0\n- Sygnały: '+result.signals.length+'\n- Wymagają weryfikacji: tak\n');
 console.log('RX MEDUSA:',result.signals.length,'signals to RX QUEEN');
}
module.exports={routeSignals};
