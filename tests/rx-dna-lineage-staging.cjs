'use strict';
const assert=require('node:assert/strict');
const {createStagingLineage}=require('../rx-dna-lineage-staging.cjs');
(async()=>{
 const calls=[];let saved=null;
 const cloud=createStagingLineage({baseUrl:'https://owkjdlpawczrnwyszduj.supabase.co/',publicKey:'public-test-key',fetchImpl:async(url,opts)=>{
  calls.push({url:String(url),opts});
  const params=JSON.parse(opts.body);
  if(String(url).endsWith('_read'))return {ok:true,json:async()=>saved};
  if(String(url).endsWith('_write')){saved={revision:1,snapshot:params.p_snapshot};return {ok:true,json:async()=>1};}
  throw Error('Unexpected RPC');
 }});
 const session={token:'test-user-jwt-long-enough'};
 const {store}=await cloud.load(session,'RXDNA-CLOUD-queen');
 store.register({id:'RXDNA-root',approved:true,testsPassed:true});
 await cloud.save(session,'RXDNA-CLOUD-queen',store,0);
 assert.equal((await cloud.load(session,'RXDNA-CLOUD-queen')).revision,1);
 assert.equal(calls.length,3);
 await assert.rejects(()=>cloud.load({},'RXDNA-CLOUD-queen'),/access denied/);
 console.log('PASS RX staging lineage RPC adapter mock; live admin JWT not tested');
})().catch(e=>{console.error(e);process.exitCode=1});
