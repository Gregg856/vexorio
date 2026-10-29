'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
process.env.SUPABASE_URL='https://rxcloud-staging-test.supabase.co';
const {start,staticFetch}=require('../rx-cloud-server.cjs');
(async()=>{
 const traversal=await staticFetch(new Request('http://localhost/%2e%2e/%2e%2e/etc/passwd'));
 assert.notEqual(traversal.status,200);
 for(const blocked of ['/config.env','/.git/config','/backup.json','/admin-token.txt','/rx-cloud-server.cjs','/secret-data.json','/nested/.hidden.js']){
   const response=await staticFetch(new Request('http://localhost'+blocked));
   assert.equal(response.status,403,'Static asset must be denied: '+blocked);
 }
 for(const blocked of ['/data%00.json','/nested/%2ehidden.js','/config%5csecret.json','/private-backup.json','/file.pem','/file.key','/module.mjs']){
   const response=await staticFetch(new Request('http://localhost'+blocked));
   assert.notEqual(response.status,200,'Unsafe static asset must not be served: '+blocked);
 }
 const symlink=path.resolve(__dirname,'../public/rxcloud-link-test.txt');
 try{
   await fs.symlink(path.resolve(__dirname,'../rx-cloud-server.cjs'),symlink);
   const linked=await staticFetch(new Request('http://localhost/rxcloud-link-test.txt'));
   assert.equal(linked.status,403,'Public symlink to server source must be denied');
 }finally{await fs.rm(symlink,{force:true});}
 const configured=process.env.SUPABASE_URL;
 delete process.env.SUPABASE_URL;
 await assert.rejects(start({port:0,host:'127.0.0.1'}),/explicit SUPABASE_URL/);
 process.env.SUPABASE_URL=configured;
 const server=await start({port:0,host:'127.0.0.1'});
 try{
  assert.equal(server.headersTimeout,15000,'Header timeout must be bounded');
  assert.equal(server.requestTimeout,30000,'Request timeout must be bounded');
  assert.equal(server.keepAliveTimeout,5000,'Keep-alive timeout must be bounded');
  assert.equal(server.maxRequestsPerSocket,100,'Requests per socket must be bounded');
  assert.equal(server.maxHeadersCount,100,'Header count must be bounded');
  assert.equal(server.maxConnections,128,'Concurrent connection count must be bounded');
  const {port}=server.address();
  const base='http://127.0.0.1:'+port;
  const health=await fetch(base+'/__rxcloud/health');
  assert.equal(health.status,200);
  const healthData=await health.json();
  assert.equal(healthData.service,'rx-cloud-2');
  assert.equal(healthData.connectionsLimit,128);
  assert.equal(healthData.load.activeRequests,1,'Health request should count itself');
  assert.equal(healthData.load.peakActiveRequests,1,'First request should establish peak');
  assert.equal(healthData.load.completedRequests,0,'First request should not yet be completed when snapshot is taken');
  for(const key of ['rssBytes','heapUsedBytes','heapTotalBytes']){
    assert(Number.isSafeInteger(healthData.memory[key])&&healthData.memory[key]>0,'Invalid memory metric: '+key);
  }
  assert(healthData.memory.heapUsedBytes<=healthData.memory.heapTotalBytes,'Heap usage cannot exceed heap total');
  assert.equal(health.headers.get('cache-control'),'no-store');
  assert.equal(health.headers.get('x-content-type-options'),'nosniff');
  const healthHead=await fetch(base+'/__rxcloud/health',{method:'HEAD'});
  assert.equal(healthHead.status,200);
  assert.equal(await healthHead.text(),'');
  const healthPost=await fetch(base+'/__rxcloud/health',{method:'POST',body:'test'});
  assert.equal(healthPost.status,405);
  assert.equal(healthPost.headers.get('allow'),'GET, HEAD');
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
  assert.equal(missing.status,403,'Extensionless public paths are denied by the static asset allowlist');
  const notFound=await fetch(base+'/nonexistent-rx-cloud-file-2026.json');
  assert.equal(notFound.status,404,'Missing permitted-extension assets should return 404');
  const head=await fetch(base+'/manifest.webmanifest',{method:'HEAD'});
  assert.equal(head.status,200);
  assert.equal(await head.text(),'');
  const oversized=await fetch(base+'/nonexistent-rx-cloud-file-2026',{method:'POST',body:'x'.repeat(2*1024*1024+1)});
  assert.equal(oversized.status,413);
  const declaredOversized=await fetch(base+'/nonexistent-rx-cloud-file-2026',{method:'POST',headers:{'Content-Length':String(2*1024*1024+1)},body:'x'.repeat(2*1024*1024+1)});
  assert.equal(declaredOversized.status,413,'Oversized declared Content-Length must be rejected');
  const hostileHost=await fetch(base+'/__rxcloud/health',{headers:{Host:'invalid-host:bad-port'}});
  assert.equal(hostileHost.status,200,'Malformed Host must not break local request parsing');
  const stillHealthy=await fetch(base+'/__rxcloud/health');
  assert.equal(stillHealthy.status,200,'Server must remain healthy after oversized request');
  const finalLoad=(await stillHealthy.json()).load;
  assert.equal(finalLoad.activeRequests,1,'Only health request should remain active');
  assert(finalLoad.completedRequests>=8,'Request completion counter should advance');
  assert(finalLoad.peakActiveRequests>=1,'Peak request counter should be populated');
  // RX CLOUD 5.7: bounded, localhost-only burst; never targets a public endpoint.
  const sampleCount=24;
  const concurrency=4;
  const latencies=[];
  for(let offset=0;offset<sampleCount;offset+=concurrency){
    const batch=Array.from({length:Math.min(concurrency,sampleCount-offset)},async()=>{
      const started=performance.now();
      const response=await fetch(base+'/__rxcloud/health',{signal:AbortSignal.timeout(5000)});
      assert.equal(response.status,200,'Local burst request failed');
      await response.json();
      latencies.push(performance.now()-started);
    });
    await Promise.all(batch);
  }
  latencies.sort((a,b)=>a-b);
  const p95=latencies[Math.ceil(latencies.length*.95)-1];
  const mean=latencies.reduce((sum,n)=>sum+n,0)/latencies.length;
  const loadResponse=await fetch(base+'/__rxcloud/health');
  const load=(await loadResponse.json()).load;
  assert.equal(latencies.length,sampleCount,'All local burst samples must complete');
  assert(load.completedRequests>=sampleCount,'Completed request count must include burst');
  assert(Number.isFinite(p95)&&p95>=0,'Invalid p95 latency');
  console.log('RX CLOUD 5.7 localhost-only burst: '+JSON.stringify({requests:sampleCount,concurrency,meanMs:Number(mean.toFixed(2)),p95Ms:Number(p95.toFixed(2)),peakActiveRequests:load.peakActiveRequests}));
  console.log('RX CLOUD 5.7 request load counters, memory and local burst passed');
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
})().catch(e=>{console.error(e);process.exitCode=1;});
