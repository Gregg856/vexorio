'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {check}=require('./rx-queen-runtime-readiness.cjs');
const {approve,save}=require('../rx-queen-approved-memory.cjs');
test('no server address is not deployment proof',async()=>{
 const old=process.env.RX_BIBI_APPROVED_MEMORY_ENABLED;process.env.RX_BIBI_APPROVED_MEMORY_ENABLED='false';
 try{const r=await check({baseUrl:'',file:path.join(os.tmpdir(),'rx-queen-not-found-'+process.pid)});assert.equal(r.ready,false);assert.equal(r.liveChatVerified,false);assert.ok(r.errors.includes('rx-cloud-base-url-not-configured'));}
 finally{if(old===undefined)delete process.env.RX_BIBI_APPROVED_MEMORY_ENABLED;else process.env.RX_BIBI_APPROVED_MEMORY_ENABLED=old;}
});
test('health and reviewed memory yield readiness but not chat verification',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-queen-readiness-'));const file=path.join(dir,'approved.json');
 const server=http.createServer((req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,service:'rx-cloud-2',runtime:'node'}));});
 const old=process.env.RX_BIBI_APPROVED_MEMORY_ENABLED;
 try{
  await save(file,approve({schema:1,kind:'rx-queen-approved-responses',entries:[]},{prompt:'cześć',answer:'Witaj',reviewId:'review-1',approved:true}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));process.env.RX_BIBI_APPROVED_MEMORY_ENABLED='true';
  const r=await check({baseUrl:'http://127.0.0.1:'+server.address().port+'/',file});
  assert.equal(r.ready,true);assert.equal(r.diagnosis,'ready-for-authenticated-chat-test');assert.equal(r.liveChatVerified,false);assert.equal(r.approvedMemory.entries,1);
 }finally{await new Promise(resolve=>server.close(resolve));await fs.rm(dir,{recursive:true,force:true});if(old===undefined)delete process.env.RX_BIBI_APPROVED_MEMORY_ENABLED;else process.env.RX_BIBI_APPROVED_MEMORY_ENABLED=old;}
});

test('unreachable RX CLOUD never claims live memory works',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-queen-offline-'));const file=path.join(dir,'approved.json');
 const old=process.env.RX_BIBI_APPROVED_MEMORY_ENABLED;
 try{
  await save(file,approve({schema:1,kind:'rx-queen-approved-responses',entries:[]},{prompt:'cześć',answer:'Witaj',reviewId:'review-665',approved:true}));
  process.env.RX_BIBI_APPROVED_MEMORY_ENABLED='true';
  const r=await check({baseUrl:'http://127.0.0.1:1/',file,timeoutMs:500});
  assert.equal(r.server.healthy,false);
  assert.equal(r.ready,false);
  assert.equal(r.liveChatVerified,false);
  assert.equal(r.diagnosis,'server-not-confirmed');
  assert.ok(r.errors.includes('rx-cloud-unreachable-or-invalid-url'));
 }finally{await fs.rm(dir,{recursive:true,force:true});if(old===undefined)delete process.env.RX_BIBI_APPROVED_MEMORY_ENABLED;else process.env.RX_BIBI_APPROVED_MEMORY_ENABLED=old;}
});
