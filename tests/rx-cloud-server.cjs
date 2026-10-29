'use strict';
const assert=require('node:assert/strict');
const {start,staticFetch}=require('../rx-cloud-server.cjs');
(async()=>{
 const traversal=await staticFetch(new Request('http://localhost/%2e%2e/%2e%2e/etc/passwd'));
 assert.notEqual(traversal.status,200);
 const server=await start({port:0,host:'127.0.0.1'});
 try{
  const {port}=server.address();
  const base='http://127.0.0.1:'+port;
  const health=await fetch(base+'/__rxcloud/health');
  assert.equal(health.status,200);
  assert.equal((await health.json()).service,'rx-cloud-2');
  const missing=await fetch(base+'/nonexistent-rx-cloud-file-2026');
  assert.equal(missing.status,404);
  const oversized=await fetch(base+'/nonexistent-rx-cloud-file-2026',{method:'POST',body:'x'.repeat(2*1024*1024+1)});
  assert.equal(oversized.status,413);
  console.log('RX CLOUD 2.0 self-host smoke checks passed');
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
})().catch(e=>{console.error(e);process.exitCode=1;});
