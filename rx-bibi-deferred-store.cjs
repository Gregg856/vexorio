'use strict';
// RX BIBI #708 — atomic disk persistence for the existing RX CLOUD host.
// Not an HTTP endpoint: authentication and user scoping must be enforced by caller.
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {createDeferredTasks}=require('./rx-bibi-deferred-tasks.cjs');
const MAX_BYTES=100000;
const queues=new Map();
async function loadDeferredTasks(file){
 let raw;
 try{
  const stat=await fs.lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX_BYTES)throw Error('Invalid deferred snapshot');
  raw=await fs.readFile(file,'utf8');
 }catch(e){if(e.code==='ENOENT')return createDeferredTasks();throw e;}
 if(Buffer.byteLength(raw)>MAX_BYTES)throw Error('Deferred snapshot too large');
 const data=JSON.parse(raw);
 if(!data||data.schema!==1||data.kind!=='rx-bibi-deferred-tasks'||!Array.isArray(data.tasks))throw Error('Invalid deferred snapshot');
 return createDeferredTasks(data.tasks);
}
async function saveDeferredTasks(file,memory){
 const raw=JSON.stringify(memory.snapshot());
 if(Buffer.byteLength(raw)>MAX_BYTES)throw Error('Deferred snapshot too large');
 await fs.mkdir(path.dirname(file),{recursive:true});
 const tmp=file+'.tmp-'+process.pid+'-'+crypto.randomBytes(8).toString('hex');
 try{await fs.writeFile(tmp,raw,{flag:'wx',mode:0o600});await fs.rename(tmp,file);}
 catch(e){await fs.rm(tmp,{force:true}).catch(()=>{});throw e;}
}
function updateDeferredTasks(file,change){
 if(typeof file!=='string'||!file.trim()||typeof change!=='function')return Promise.reject(Error('Invalid update'));
 const key=path.resolve(file),previous=queues.get(key)||Promise.resolve();
 const current=previous.catch(()=>{}).then(async()=>{
  const memory=await loadDeferredTasks(key);
  const result=await change(memory);
  await saveDeferredTasks(key,memory);
  return result;
 });
 const settled=current.then(()=>{},()=>{});
 queues.set(key,settled);
 void settled.then(()=>{if(queues.get(key)===settled)queues.delete(key);});
 return current;
}
module.exports={loadDeferredTasks,saveDeferredTasks,updateDeferredTasks};
