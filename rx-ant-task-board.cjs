'use strict';
// RX ANT TASK BOARD: bounded, deterministic triage. No autonomous code edits.
const fs=require('node:fs');
const path=require('node:path');
const PRIORITY={critical:0,high:1,medium:2,low:3};
const {allocate}=require('./rx-bibi-budget.cjs');
function buildBoard(supervisor,{maxTasks=50,medusa=null,memory=null}={}){
 if(!supervisor||supervisor.kind!=='rx-queen-ant-supervisor'||!Array.isArray(supervisor.issues)||supervisor.issues.length>500||!Number.isSafeInteger(maxTasks)||maxTasks<1||maxTasks>100)throw Error('Invalid supervisor report or task limit');
 if(medusa&&(!Array.isArray(medusa.signals)||medusa.kind!=='rx-medusa-engine'||medusa.engine!=='RX'||medusa.signals.length>500))throw Error('Invalid RX MEDUSA report');
 if(memory&&(!Array.isArray(memory.entries)||memory.kind!=='rx-signal-memory'||memory.entries.length>200))throw Error('Invalid RX MEMORY report');
 const counts=new Map();
 for(const e of memory?.entries||[]){if(!e||typeof e.key!=='string'||!Number.isSafeInteger(e.seen)||e.seen<1)throw Error('Invalid RX MEMORY entry');counts.set(e.key,e.seen);}
 const tasks=new Map();
 for(const issue of medusa?medusa.signals:supervisor.issues){
  if(!issue||typeof issue.source!=='string'||typeof issue.action!=='string'||typeof issue.target!=='string'||!Object.hasOwn(PRIORITY,issue.priority))throw Error('Invalid issue');
  const source=issue.source.slice(0,40),action=issue.action.slice(0,80),target=issue.target.slice(0,120);
  const id=JSON.stringify([source,action,target]);
  if(!tasks.has(id))tasks.set(id,{source,action,target,priority:issue.priority,status:'needs_review',requiresApproval:true});
  else if(PRIORITY[issue.priority]<PRIORITY[tasks.get(id).priority])tasks.get(id).priority=issue.priority;
 }
 for(const [id,task] of tasks){const seen=counts.get(id)||0;task.historyOccurrences=seen;task.recurrent=seen>=2;if(task.recurrent&&PRIORITY[task.priority]>PRIORITY.high)task.priority='high';}
 const sorted=[...tasks.values()].sort((a,b)=>PRIORITY[a.priority]-PRIORITY[b.priority]||a.source.localeCompare(b.source)||a.action.localeCompare(b.action)||a.target.localeCompare(b.target));
 return {schema:1,kind:'rx-ant-task-board',tasks:sorted.slice(0,maxTasks),totalUnique:sorted.length,overflow:Math.max(0,sorted.length-maxTasks),autoFixesApplied:0,note:'Deduplicated recommendations only; no code changes, production access, or paid jobs.'};
}
// Deterministic review queue; approvals are recorded as requests, never executed.
function buildReviewQueue(board,{previous=null,runId}={}){
 if(!board||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks)||board.tasks.length>100)throw Error('Invalid RX board');
 if(typeof runId!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(runId))throw Error('Invalid RX run ID');
 if(previous!==null&&(!previous||previous.kind!=='rx-ant-review-queue'||previous.schema!==1||!Array.isArray(previous.tasks)||previous.tasks.length>100))throw Error('Invalid prior review queue');
 const old=new Map();
 for(const task of previous?.tasks||[]){if(!task||typeof task.id!=='string'||typeof task.firstSeen!=='string'||!Number.isSafeInteger(task.occurrences)||task.occurrences<1||task.requiresApproval!==true||task.approved!==false||task.executed!==false||old.has(task.id))throw Error('Invalid prior queue item');old.set(task.id,task);}
 const tasks=board.tasks.map(task=>{
  const id=JSON.stringify([task.source,task.action,task.target]);
  const prior=old.get(id);
  return {id,source:task.source,action:task.action,target:task.target,priority:task.priority,
   firstSeen:prior?.firstSeen||runId,lastSeen:runId,occurrences:prior?prior.occurrences+1:1,
   status:'awaiting_review',requiresApproval:true,approved:false,executed:false};
 });
 return {schema:1,kind:'rx-ant-review-queue',runId,tasks,closedSincePrevious:[...old.keys()].filter(id=>!tasks.some(t=>t.id===id)).length,
  requiresApproval:true,executions:0,productionModified:false,note:'History and review requests only; no approvals inferred and no execution.'};
}
if(require.main===module){
 const input=path.join('rx-bibi-reports','rx-queen-ant-supervisor.json');
 let medusa=null;
 try{medusa=JSON.parse(fs.readFileSync(path.join('rx-bibi-reports','rx-medusa-signals.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
 let memory=null;
 try{memory=JSON.parse(fs.readFileSync(path.join('rx-bibi-reports','rx-signal-memory.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
 const board=buildBoard(JSON.parse(fs.readFileSync(input,'utf8')),{medusa,memory});
 const budget=allocate(board);
 const runId=String(process.env.GITHUB_RUN_ID||'local').replace(/[^-a-zA-Z0-9_]/g,'').slice(0,80)||'local';
 let previous=null;
 try{previous=JSON.parse(fs.readFileSync(path.join('rx-queue-cache','history.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const reviewQueue=buildReviewQueue(board,{previous,runId});
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-ant-task-board.json',JSON.stringify(board,null,2)+'\n');
 fs.writeFileSync('rx-bibi-reports/rx-ant-review-queue.json',JSON.stringify(reviewQueue,null,2)+'\n');
 fs.mkdirSync('rx-queue-cache',{recursive:true});
 fs.writeFileSync('rx-queue-cache/history.json',JSON.stringify(reviewQueue,null,2)+'\n');
 fs.writeFileSync('rx-bibi-reports/rx-bibi-budget.json',JSON.stringify(budget,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY){
  const safe=value=>String(value).replace(/[\r\n|<>\\`]/g,' ').slice(0,120);
  const lines=['## RX QUEEN — kolejka do przeglądu','- Przebieg: '+safe(runId),'- Unikalne zgłoszenia: '+board.totalUnique,'- W kolejce: '+reviewQueue.tasks.length,'- Wykonane automatycznie: **0**','- Zatwierdzone automatycznie: **0**'];
  if(reviewQueue.tasks.length){
   lines.push('','| Priorytet | Źródło | Zadanie | Wystąpienia |','| --- | --- | --- | ---: |');
   for(const task of reviewQueue.tasks.slice(0,20))lines.push('| '+safe(task.priority)+' | '+safe(task.source)+' | '+safe(task.action)+' → '+safe(task.target)+' | '+task.occurrences+' |');
   if(reviewQueue.tasks.length>20)lines.push('','Pozostałe zadania w artefakcie rx-bibi-mobile-report.');
  }else lines.push('- Brak oczekujących zadań w tym raporcie.');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
 }
 console.log('RX ANT TASK BOARD:',board.tasks.length,'queued,',board.overflow,'overflow, source:',medusa?'RX MEDUSA':'RX QUEEN');
}
module.exports={buildBoard,buildReviewQueue};
