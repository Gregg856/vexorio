'use strict';
// Bounded RX task planner; does not execute jobs or measure provider credits.
function allocate(board,{maxTasks=30}={}){
 if(!board||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks)||!Number.isSafeInteger(maxTasks)||maxTasks<0||maxTasks>100)throw Error('Invalid task board or limit');
 return {schema:1,kind:'rx-bibi-budget',planned:board.tasks.slice(0,maxTasks),deferred:board.tasks.slice(maxTasks),limit:maxTasks,autoExecuted:0,actualProviderUsage:null};
}
// Module 1 — LIMITS: local planning guardrails, never claims live provider quotas.
function enforceLimits(board,{maxTasks=10,maxPerSource=4,maxHighPriority=5}={}){
 if(!board||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks)||board.tasks.length>100)throw Error('Invalid task board');
 for(const n of [maxTasks,maxPerSource,maxHighPriority])if(!Number.isSafeInteger(n)||n<0||n>100)throw Error('Invalid limits');
 const planned=[],deferred=[],sourceCounts=new Map();let highPriority=0;
 for(const task of board.tasks){
  if(!task||typeof task!=='object')throw Error('Invalid task');
  const source=String(task.source||'unknown').slice(0,80);
  const priority=String(task.priority||'normal');
  const high=priority==='critical'||priority==='high';
  const reason=planned.length>=maxTasks?'task-limit':(sourceCounts.get(source)||0)>=maxPerSource?'source-limit':high&&highPriority>=maxHighPriority?'priority-limit':null;
  if(reason){deferred.push({task,reason});continue;}
  planned.push(task);sourceCounts.set(source,(sourceCounts.get(source)||0)+1);if(high)highPriority++;
 }
 return {schema:1,kind:'rx-module-1-limits',limits:{maxTasks,maxPerSource,maxHighPriority},planned,deferred,autoExecuted:0,actualProviderUsage:null,providerQuotaKnown:false};
}
module.exports={allocate,enforceLimits};
