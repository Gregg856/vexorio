'use strict';
// RX TURBINE: bounded, deduplicated cloud-work scheduling plan. No actual execution.
const ALLOWED=Object.freeze(['check_syntax','run_unit_tests','run_browser_tests','inspect_ci']);
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
module.exports={createTurbine};
