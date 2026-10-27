'use strict';
// RX ANT TASK BOARD: bounded, deterministic triage. No autonomous code edits.
const fs=require('node:fs');
const path=require('node:path');
const PRIORITY={critical:0,high:1,medium:2,low:3};
const {allocate}=require('./rx-bibi-budget.cjs');
function buildCosmosQueue(board,{maxTasks=9}={}){
 if(!board||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks)||board.tasks.length>100||!Number.isSafeInteger(maxTasks)||maxTasks<0||maxTasks>20)throw Error('Invalid COSMOS queue');
 const seen=new Set();
 const normalized=board.tasks.map(task=>{
  if(!task||typeof task.source!=='string'||typeof task.action!=='string'||typeof task.target!=='string'||!Object.hasOwn(PRIORITY,task.priority)||task.requiresApproval!==true||task.source.length>40||task.action.length>80||task.target.length>120)throw Error('Invalid COSMOS task');
  const key=JSON.stringify([task.source,task.action,task.target]);
  if(seen.has(key))throw Error('Duplicate COSMOS task');
  seen.add(key);
  return {source:task.source,action:task.action,target:task.target,priority:task.priority};
 });
 normalized.sort((a,b)=>PRIORITY[a.priority]-PRIORITY[b.priority]||a.source.localeCompare(b.source)||a.action.localeCompare(b.action)||a.target.localeCompare(b.target));
 const planned=normalized.slice(0,maxTasks).map((task,index)=>({id:'RXJOB-ant-'+index,...task,status:'needs_review',requiresApproval:true}));
 const deferredTasks=normalized.slice(maxTasks).map(task=>({...task,status:'deferred',requiresApproval:true}));
 const priorityCounts=Object.fromEntries(Object.keys(PRIORITY).map(key=>[key,normalized.filter(task=>task.priority===key).length]));
 return {schema:1,kind:'rx-cosmos-ant-queue',planned,deferred:deferredTasks.length,deferredTasks,priorityCounts,limit:maxTasks,executed:0,autoFixesApplied:0,note:'Read-only queue. Tasks require approval; no arbitrary commands, edits or deployments.'};
}
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
if(require.main===module){
 const input=path.join('rx-bibi-reports','rx-queen-ant-supervisor.json');
 let medusa=null;
 try{medusa=JSON.parse(fs.readFileSync(path.join('rx-bibi-reports','rx-medusa-signals.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
 let memory=null;
 try{memory=JSON.parse(fs.readFileSync(path.join('rx-bibi-reports','rx-signal-memory.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
 const board=buildBoard(JSON.parse(fs.readFileSync(input,'utf8')),{medusa,memory});
 const budget=allocate(board);
 const cosmos=buildCosmosQueue(board);
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-ant-task-board.json',JSON.stringify(board,null,2)+'\n');
 fs.writeFileSync('rx-bibi-reports/rx-cosmos-ant-queue.json',JSON.stringify(cosmos,null,2)+'\n');
 fs.writeFileSync('rx-bibi-reports/rx-bibi-budget.json',JSON.stringify(budget,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX ANT TASK BOARD\n- Unikalne zadania: '+board.totalUnique+'\n- W kolejce: '+board.tasks.length+'\n- Wymagają zatwierdzenia: tak\n');
 console.log('RX ANT TASK BOARD:',board.tasks.length,'queued,',board.overflow,'overflow, source:',medusa?'RX MEDUSA':'RX QUEEN');
}
module.exports={buildBoard,buildCosmosQueue};
