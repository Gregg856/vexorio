'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {checkRxPublicConnection}=require('../rx-private-connect.cjs');
test('RX private connect checks only the existing public HTTPS endpoint',async()=>{
 let url,options;
 const result=await checkRxPublicConnection({fetchImpl:async(u,o)=>{url=u;options=o;return {ok:true,status:200};}});
 assert.deepEqual(result,{ok:true,status:'PUBLIC_HTTPS_OK',httpStatus:200});
 assert.equal(url,'https://vexorio.grzegorzbub1985.workers.dev/');
 assert.equal(options.method,'GET');
 assert.equal(options.redirect,'error');
});
test('refuses alternate endpoints, credentials and private API',async()=>{
 let calls=0;
 for(const url of ['http://vexorio.grzegorzbub1985.workers.dev/','https://evil.example/','https://vexorio.grzegorzbub1985.workers.dev/api/rx/admin/brain-memory','https://vexorio.grzegorzbub1985.workers.dev/?token=secret']){
  const result=await checkRxPublicConnection({url,fetchImpl:async()=>{calls++;}});
  assert.equal(result.status,'INVALID_TARGET');
 }
 assert.equal(calls,0);
});
test('network failure is a safe status, not a VPN claim',async()=>{
 const result=await checkRxPublicConnection({fetchImpl:async()=>{throw Error('offline');}});
 assert.equal(result.status,'UNREACHABLE');
 assert.equal(result.ok,false);
});
