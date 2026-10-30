'use strict';
// RX CLOUD 3.5: verify server runs from an isolated deployment directory.
const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://rxcloud-staging-test.supabase.co';
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
(async()=>{
 const source=path.resolve(__dirname,'..');
 const target=await fs.mkdtemp(path.join(os.tmpdir(),'rx-cloud-staged-'));
 try {
  const pub=path.join(target,'public');
  await fs.mkdir(pub);
  const runtime=new Set(['rx-cloud-server.cjs','worker.js','rx-persistent-memory.mjs','rx-knowledge-base.mjs','rx-world-knowledge.mjs','rx-chat-planner.mjs','rx-bibi-task-reasoner.mjs','rx-task-catalog.cjs','rx-math-core.cjs']);
  for(const file of await fs.readdir(source,{withFileTypes:true})){
   if(!file.isFile())continue;
   const name=file.name;
   if(runtime.has(name)){
    await fs.copyFile(path.join(source,name),path.join(target,name));
   }
   if(/\.(html|js|css|svg|png|jpg|jpeg|webp|ico|json|txt|webmanifest)$/.test(name)){
    await fs.copyFile(path.join(source,name),path.join(pub,name));
   }
  }
  assert.equal((await fs.stat(path.join(pub,'index.html'))).isFile(),true);
  assert.equal((await fs.stat(path.join(target,'rx-task-catalog.cjs'))).isFile(),true);
  await assert.rejects(fs.stat(path.join(target,'rx-cloud-health.cjs')),{code:'ENOENT'});
  assert.equal((await fs.readdir(target)).filter(n=>n.endsWith('.cjs')||n.endsWith('.mjs')).length,8);
  assert.equal((await fs.stat(path.join(pub,'manifest.webmanifest'))).isFile(),true);
  const {start}=require(path.join(target,'rx-cloud-server.cjs'));
  const server=await start({port:0,host:'127.0.0.1'});
  try {
   const base='http://127.0.0.1:'+server.address().port;
   const health=await fetch(base+'/__rxcloud/health');
   assert.equal(health.status,200);
   const home=await fetch(base+'/');
   assert.equal(home.status,200);
   assert.match(await home.text(),/<html/i);
   const manifest=await fetch(base+'/manifest.webmanifest');
   assert.equal(manifest.status,200);
   assert.notEqual((await fetch(base+'/rx-cloud-server.cjs')).status,200);
   console.log('RX CLOUD 3.5 isolated deployment smoke passed');
  } finally {await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
 } finally {await fs.rm(target,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
