'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {loadDeferredTasks,updateDeferredTasks}=require('./rx-bibi-deferred-store.cjs');
test('RX CLOUD disk snapshot survives reload and resumes task',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-deferred-'));
 const file=path.join(dir,'tasks.json');
 try{
  await updateDeferredTasks(file,m=>m.put({id:'sync',topic:'Dwa konta',nextStep:'Test synchronizacji',status:'deferred'}));
  const reloaded=await loadDeferredTasks(file);
  assert.equal(reloaded.get('sync').status,'deferred');
  await updateDeferredTasks(file,m=>m.resume('sync'));
  assert.equal((await loadDeferredTasks(file)).get('sync').status,'active');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('concurrent updates to one file are serialized',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-deferred-'));
 const file=path.join(dir,'tasks.json');
 try{
  await Promise.all(Array.from({length:10},(_,i)=>updateDeferredTasks(file,m=>m.put({id:'task-'+i,topic:'Topic '+i,nextStep:'Next '+i,status:'deferred'}))));
  assert.equal((await loadDeferredTasks(file)).list().length,10);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
