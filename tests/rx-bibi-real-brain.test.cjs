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
  assert(result.passed<6,'Existing brain must not be misrepresented as fully trained');
  assert(result.results.some(x=>!x.passed));
  console.log('RX BIBI existing brain baseline:',JSON.stringify(result));
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
