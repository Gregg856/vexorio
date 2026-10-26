'use strict';
const assert=require('node:assert/strict');
const {createStagingGateway}=require('../rx-dna-cloud-gateway.cjs');
(async()=>{
 const calls=[];
 const snapshot={version:1,ants:[{head:'RX-000001',entries:[]}]};
 const store=createStagingGateway({baseUrl:'staging',publicKey:'public',request:async call=>{
  calls.push(call);
  if(call.procedure==='rx_dna_staging_read')return {revision:1,snapshot};
  return 2;
 }});
 const session={token:'test-session-token-long-enough'};
 await assert.rejects(store.load({},'RX-000001'),/authorization/);
 const loaded=await store.load(session,'RX-000001');
 assert.equal(loaded.revision,1);
 assert.equal((await store.save(session,'RX-000001',snapshot,1)).revision,2);
 assert.deepEqual(calls.map(x=>x.procedure),['rx_dna_staging_read','rx_dna_staging_write']);
 assert.equal(calls[1].params.p_expected_revision,1);
 assert.equal(calls[1].token,session.token);
 console.log('PASS RX DNA staging gateway session propagation and RPC mapping');
})().catch(e=>{console.error(e);process.exitCode=1});
