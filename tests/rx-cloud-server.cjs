'use strict';
const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://rxcloud-staging-test.supabase.co';
const {start,staticFetch}=require('../rx-cloud-server.cjs');
(async()=>{
 const traversal=await staticFetch(new Request('http://localhost/%2e%2e/%2e%2e/etc/passwd'));
 assert.notEqual(traversal.status,200);
 for(const blocked of ['/config.env','/.git/config','/backup.json','/admin-token.txt','/rx-cloud-server.cjs','/secret-data.json','/nested/.hidden.js']){
   const response=await staticFetch(new Request('http://localhost'+blocked));
   assert.equal(response.status,403,'Static asset must be denied: '+blocked);
 }
 const configured=process.env.SUPABASE_URL;
 delete process.env.SUPABASE_URL;
 await assert.rejects(start({port:0,host:'127.0.0.1'}),/explicit SUPABASE_URL/);
 process.env.SUPABASE_URL=configured;
 const server=await start({port:0,host:'127.0.0.1'});
 try{
  const {port}=server.address();
  const base='http://127.0.0.1:'+port;
  const health=await fetch(base+'/__rxcloud/health');
  assert.equal(health.status,200);
  assert.equal((await health.json()).service,'rx-cloud-2');
  const home=await fetch(base+'/');
  assert.equal(home.status,200,'VEXORIO home must load on RX CLOUD');
  assert.match(home.headers.get('content-type')||'',/text\/html/);
  const html=await home.text();
  assert.match(html,/<html/i);
  const manifest=await fetch(base+'/manifest.webmanifest');
  assert.equal(manifest.status,200,'VEXORIO manifest must load');
  const sensitive=await fetch(base+'/rx-cloud-server.cjs');
  assert.notEqual(sensitive.status,200,'Server source must not be publicly served');
  const missing=await fetch(base+'/nonexistent-rx-cloud-file-2026');
  assert.equal(missing.status,404);
  const oversized=await fetch(base+'/nonexistent-rx-cloud-file-2026',{method:'POST',body:'x'.repeat(2*1024*1024+1)});
  assert.equal(oversized.status,413);
  console.log('RX CLOUD 2.0 self-host smoke checks passed');
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
})().catch(e=>{console.error(e);process.exitCode=1;});
