'use strict';
const assert=require('node:assert/strict');
const {start}=require('../rx-bibi-local-chat-adapter.cjs');
const {run}=require('./rx-bibi-live-evaluation.cjs');
(async()=>{
 const server=await start();
 try{
  const endpoint='http://127.0.0.1:'+server.address().port+'/chat';
  const result=await run({endpoint});
  assert.equal(result.total,6);
  console.log('RX BIBI existing brain baseline:',JSON.stringify(result));
  assert.equal(result.passed,6,'All six currently taught intents must pass; this is not model-weight training');
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
