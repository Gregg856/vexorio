'use strict';
// RX ANT TASK BOARD: bounded, deterministic triage. No autonomous code edits.
const fs=require('node:fs');
const path=require('node:path');
const PRIORITY={critical:0,high:1,medium:2,low:3};
const {allocate}=require('./rx-bibi-budget.cjs');
function buildBoard(supervisor,{maxTasks=50}={}){
 if(!supervisor||supervisor.kind!=='rx-queen-ant-supervisor'||!Array.isArray(supervisor.issues)||supervisor.issues.length>500||!Number.isSafeInteger(maxTasks)||maxTasks<1||maxTasks>100)throw Error('Invalid supervisor report or task limit');
 const tasks=new Map();
 for(const issue of supervisor.issues){
  if(!issue||typeof issue.source!=='string'||typeof issue.action!=='string'||typeof issue.target!=='string'||!Object.hasOwn(PRIORITY,issue.priority))throw Error('Invalid issue');
  const source=issue.source.slice(0,40),action=issue.action.slice(0,80),target=issue.target.slice(0,120);
  const id=JSON.stringify([source,action,target]);
  if(!tasks.has(id))tasks.set(id,{source,action,target,priority:issue.priority,status:'needs_review',requiresApproval:true});
  else if(PRIORITY[issue.priority]<PRIORITY[tasks.get(id).priority])tasks.get(id).priority=issue.priority;
 }
 const sorted=[...tasks.values()].sort((a,b)=>PRIORITY[a.priority]-PRIORITY[b.priority]||a.source.localeCompare(b.source)||a.action.localeCompare(b.action)||a.target.localeCompare(b.target));
 return {schema:1,kind:'rx-ant-task-board',tasks:sorted.slice(0,maxTasks),totalUnique:sorted.length,overflow:Math.max(0,sorted.length-maxTasks),autoFixesApplied:0,note:'Deduplicated recommendations only; no code changes, production access, or paid jobs.'};
}
if(require.main===module){
 const input=path.join('rx-bibi-reports','rx-queen-ant-supervisor.json');
 const board=buildBoard(JSON.parse(fs.readFileSync(input,'utf8')));
 const budget=allocate(board);
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-ant-task-board.json',JSON.stringify(board,null,2)+'\n');
 fs.writeFileSync('rx-bibi-reports/rx-bibi-budget.json',JSON.stringify(budget,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX ANT TASK BOARD\n- Unikalne zadania: '+board.totalUnique+'\n- W kolejce: '+board.tasks.length+'\n- Wymagają zatwierdzenia: tak\n');
 console.log('RX ANT TASK BOARD:',board.tasks.length,'queued,',board.overflow,'overflow');
}
module.exports={buildBoard};
