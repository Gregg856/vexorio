'use strict';
// RX CLOUD COMPUTER 1.0 — bounded local task planner, not a virtual machine.
// It does not execute shell commands, access secrets, deploy or spend money.
const ALLOWED=Object.freeze(['check_syntax','run_unit_tests','run_browser_tests','inspect_ci']);
function createRXCloudComputer({maxTasks=50}={}){
 if(!Number.isSafeInteger(maxTasks)||maxTasks<1||maxTasks>500)throw Error('Invalid capacity');
 const tasks=new Map();
 function enqueue({id,kind,target}){
  if(typeof id!=='string'||!/^RXJOB-[A-Za-z0-9_-]{1,40}$/.test(id)||!ALLOWED.includes(kind)||typeof target!=='string'||!/^[-A-Za-z0-9_./]{1,120}$/.test(target)||target.includes('..')||target.startsWith('/')||tasks.has(id)||tasks.size>=maxTasks)throw Error('Invalid task');
  const task=Object.freeze({id,kind,target,status:'pending',requiresApproval:true});
  tasks.set(id,task);return {...task};
 }
 function list(){return [...tasks.values()].map(x=>({...x}));}
 function report(){return {schema:1,kind:'rx-cloud-computer-plan',tasks:list(),executed:0,serverProvisioned:false,quantumHardware:false,note:'Task queue only. GitHub Actions runs CI separately; no remote command execution or automatic deployment.'};}
 return Object.freeze({enqueue,list,report});
}
module.exports={createRXCloudComputer};
