'use strict';
const fs=require('node:fs');
const path=require('node:path');
const MAX_TASKS=50;
function validate(tasks){
 if(!Array.isArray(tasks)||tasks.length>MAX_TASKS||tasks.some(t=>!t||typeof t!=='object'||typeof t.title!=='string'||!t.title.trim()||t.title.length>160||!['pending','completed'].includes(t.status)||Object.keys(t).some(k=>!['title','status'].includes(k))))throw Error('Invalid tasks');
 return tasks;
}
function readTasks(file){
 try{
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  return validate(data);
 }catch(error){
  if(error.code==='ENOENT')return [];
  throw error;
 }
}
function saveTasks(file,tasks){
 validate(tasks);
 const target=path.resolve(file);
 fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
 const temp=target+'.'+process.pid+'.tmp';
 try{
  fs.writeFileSync(temp,JSON.stringify(tasks,null,2)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
  fs.renameSync(temp,target);
 }finally{
  try{fs.unlinkSync(temp);}catch(error){if(error.code!=='ENOENT')throw error;}
 }
 return tasks.length;
}
function proposeStatusChange(tasks,title,status){
 validate(tasks);
 if(typeof title!=='string'||!title.trim()||title.length>160||!['pending','completed'].includes(status))throw Error('Invalid change');
 const matches=tasks.filter(t=>t.title===title);
 if(matches.length!==1)throw Error('Task must match exactly one entry');
 const index=tasks.findIndex(t=>t.title===title);
 if(tasks[index].status===status)throw Error('Task already has requested status');
 if(tasks[index].status==='completed'&&status==='pending')throw Error('Completed task cannot be reopened without separate review');
 return {title,status,previousStatus:tasks[index].status,index};
}
function applyApprovedChange(file,proposal,{approved=false}={}){
 if(approved!==true)throw Error('Explicit approval required');
 if(!proposal||typeof proposal!=='object'||typeof proposal.title!=='string'||!['pending','completed'].includes(proposal.status)||!['pending','completed'].includes(proposal.previousStatus)||!Number.isInteger(proposal.index))throw Error('Invalid proposal');
 const tasks=readTasks(file);
 const current=tasks[proposal.index];
 if(!current||current.title!==proposal.title||current.status!==proposal.previousStatus)throw Error('Stale proposal');
 if(current.status===proposal.status||current.status==='completed'&&proposal.status==='pending')throw Error('Unsafe status transition');
 const next=tasks.map((t,i)=>i===proposal.index?{title:t.title,status:proposal.status}:t);
 saveTasks(file,next);
 return next;
}
module.exports={readTasks,saveTasks,proposeStatusChange,applyApprovedChange};
