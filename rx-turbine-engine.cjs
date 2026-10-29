'use strict';
// RX TURBINE: bounded, deduplicated cloud-work scheduling plan. No actual execution.
const ALLOWED=Object.freeze(['check_syntax','run_unit_tests','run_browser_tests','inspect_ci','plan_build']);
function createTurbine({maxParallel=4,maxQueued=100}={}){
 if(!Number.isSafeInteger(maxParallel)||maxParallel<1||maxParallel>16||!Number.isSafeInteger(maxQueued)||maxQueued<1||maxQueued>500)throw Error('Invalid turbine capacity');
 const queue=[],seen=new Set();
 function submit({id,kind,target}){
  if(typeof id!=='string'||!/^RXJOB-[A-Za-z0-9_-]{1,40}$/.test(id)||!ALLOWED.includes(kind)||typeof target!=='string'||!/^[-A-Za-z0-9_./]{1,120}$/.test(target)||target.includes('..')||target.startsWith('/'))throw Error('Invalid task');
  const key=kind+':'+target;
  if(seen.has(key))return {accepted:false,reason:'duplicate'};
  if(queue.length>=maxQueued)return {accepted:false,reason:'queue_full'};
  seen.add(key);queue.push(Object.freeze({id,kind,target,status:'planned',requiresApproval:true}));
  return {accepted:true,id};
 }
 function plan(){
  const waves=[];for(let i=0;i<queue.length;i+=maxParallel)waves.push(queue.slice(i,i+maxParallel).map(t=>({...t})));
  return {schema:1,kind:'rx-turbine-plan',waves,planned:queue.length,maxParallel,deduplicated:true,phoneComputeRequired:false,cloudExecutorConnected:false,cosmosExecutorConnected:false,executed:0,requiresApproval:true};
 }
 return Object.freeze({submit,plan});
}
// Execute only explicitly approved, allowlisted work. Real concurrency is bounded.
async function executeApproved(turbine,{approved=false,handlers={},maxParallel=2}={}){
 if(!approved)throw Error('Owner approval required');
 if(!Number.isSafeInteger(maxParallel)||maxParallel<1||maxParallel>8)throw Error('Invalid execution capacity');
 const tasks=turbine.plan().waves.flat();
 const results=new Array(tasks.length);
 let cursor=0,active=0,peakActive=0;
 const started=Date.now();
 async function worker(){
  while(cursor<tasks.length){
   const index=cursor++,task=tasks[index];
   const handler=handlers[task.kind];
   if(typeof handler!=='function'){results[index]={id:task.id,kind:task.kind,status:'skipped',reason:'handler_unavailable'};continue;}
   active++;peakActive=Math.max(peakActive,active);
   const at=Date.now();
   try{const result=await handler(task.target);results[index]={id:task.id,kind:task.kind,status:result===true?'completed':'failed',durationMs:Date.now()-at,ok:result===true,...(result===true?{}:{errorCode:'handler_returned_failure'})};}
   catch(error){results[index]={id:task.id,kind:task.kind,status:'failed',durationMs:Date.now()-at,errorCode:'handler_failed'};}
   finally{active--;}
  }
 }
 await Promise.all(Array.from({length:Math.min(maxParallel,tasks.length)},()=>worker()));
 return {schema:1,kind:'rx-turbine-execution',realExecution:true,startedAt:new Date(started).toISOString(),durationMs:Date.now()-started,planned:tasks.length,executed:results.filter(x=>x.status==='completed'||x.status==='failed').length,peakActive,results};
}
module.exports={createTurbine,executeApproved};
