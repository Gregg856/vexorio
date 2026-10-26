'use strict';
const assert=require('node:assert/strict');
const {createStagingGateway}=require('../rx-dna-cloud-gateway.cjs');
const {createRXStagingRequest}=require('../rx-dna-cloud-transport.cjs');
(async()=>{
 const calls=[],snapshot={version:1,ants:[{head:'RX-000001',entries:[]}]};
 const transport=createRXStagingRequest({fetchImpl:async(url,opts)=>{
  calls.push({url:String(url),opts});
  const input=JSON.parse(opts.body);
  if(String(url).endsWith('rx_dna_staging_read'))return {ok:true,json:async()=>({revision:1,snapshot})};
  assert.equal(input.p_expected_revision,1);
  return {ok:true,json:async()=>2};
 }});
 const store=createStagingGateway({baseUrl:'https://owkjdlpawczrnwyszduj.supabase.co/',publicKey:'public-test-key',request:transport});
 const session={token:'testing-session-token-0123456789'};
 await assert.rejects(store.load({},'RX-000001'),/authorization/);
 assert.equal((await store.load(session,'RX-000001')).revision,1);
 assert.equal((await store.save(session,'RX-000001',snapshot,1)).revision,2);
 assert.equal(calls.length,2);
 assert(calls.every(x=>x.opts.headers.Authorization==='Bearer '+session.token));
 assert(calls.every(x=>x.url.startsWith('https://owkjdlpawczrnwyszduj.supabase.co/rest/v1/rpc/')));
 await assert.rejects(createRXStagingRequest({fetchImpl:async()=>({ok:false,status:403})})({baseUrl:'https://owkjdlpawczrnwyszduj.supabase.co/',publicKey:'key',token:session.token,procedure:'rx_dna_staging_read',params:{}}),/access denied/);
 console.log('PASS RX DNA HTTPS transport, JWT propagation and denied access');
})().catch(e=>{console.error(e);process.exitCode=1});
