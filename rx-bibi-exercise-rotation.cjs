'use strict';
// Deterministic exercise queue from holdout errors. Persistent history is local.
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {evaluate}=require('./rx-bibi-training-store.cjs');
function key(c){return crypto.createHash('sha256').update(JSON.stringify([c.input,c.answer])).digest('hex');}
function select(samples,cases,history={completed:[]}){
 if(!Array.isArray(history.completed)||!history.completed.every(x=>typeof x==='string'))throw Error('Invalid exercise history');
 const report=evaluate(samples,cases);
 const done=new Set(history.completed);
 const queue=report.results.filter(r=>!r.correct).map(r=>({...r,id:key({input:r.input,answer:r.expected})}));
 const pending=queue.filter(r=>!done.has(r.id));
 return {report,queue,pending,next:pending[0]||null,exhausted:pending.length===0};
}
async function readHistory(file){
 try{
  const data=JSON.parse(await fs.readFile(file,'utf8'));
  if(data.version!==1||!Array.isArray(data.completed)||!data.completed.every(x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x)))throw Error('Invalid exercise history');
  return data;
 }catch(error){if(error.code==='ENOENT')return {version:1,completed:[]};throw error;}
}
async function markCompleted(file,id){
 if(!/^[a-f0-9]{64}$/.test(id))throw Error('Invalid exercise id');
 const current=await readHistory(file);
 if(current.completed.includes(id))return current;
 const next={version:1,completed:[...current.completed,id]};
 const target=path.resolve(file),tmp=target+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
 try{await fs.writeFile(tmp,JSON.stringify(next,null,2)+'\n',{flag:'wx',mode:0o600});await fs.rename(tmp,target);}
 finally{await fs.rm(tmp,{force:true});}
 return next;
}
module.exports={select,readHistory,markCompleted,key};
