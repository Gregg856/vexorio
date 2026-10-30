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
module.exports={readTasks,saveTasks};
