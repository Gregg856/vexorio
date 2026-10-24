const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;
const source=fs.readFileSync('worker.js','utf8').replace('export default','module.exports =');
const context={module:{exports:{}},URL,Response,Headers,TextEncoder,Uint8Array,crypto,fetch:async()=>{throw Error('Unexpected upstream request')}};
vm.runInNewContext(source,context,{filename:'worker.js'});
const worker=context.module.exports;
const url='https://vexorio.example/api/listing-view';
function req(method='POST',origin='https://vexorio.example',data='{"listing_id":7}',extra={}) {
  return {url,method,headers:new Headers({'Origin':origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.7',...extra}),text:async()=>data};
}
const assets={fetch:async()=>new Response('ok',{status:200})};
(async()=>{
  assert.equal((await worker.fetch(req('GET'),{ASSETS:assets})).status,405);
  assert.equal((await worker.fetch(req('POST','https://attacker.example'),{ASSETS:assets})).status,403);
  assert.equal((await worker.fetch(req(),{ASSETS:assets})).status,503,'endpoint must be off by default');
  const enabled={ASSETS:assets,VIEW_COUNT_ENABLED:'true',VIEW_COUNT_SECRET:'local-test-secret',SUPABASE_URL:'https://staging.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-key'};
  assert.equal((await worker.fetch(req('POST','https://vexorio.example','not json'),enabled)).status,400);
  assert.equal((await worker.fetch(req('POST','https://vexorio.example','{"listing_id":0}'),enabled)).status,400);
  assert.equal((await worker.fetch(req('POST','https://vexorio.example','{"listing_id":7}',{'Content-Type':'text/plain'}),enabled)).status,415);
  const original=context.fetch;
  let calls=0;
  context.fetch=async(endpoint,opts)=>{
    calls++;
    assert.equal(new URL(endpoint).pathname,'/rest/v1/rpc/vexorio_record_listing_view_server');
    const body=JSON.parse(opts.body);
    assert.equal(body.p_listing_id,7);
    assert.match(body.p_visitor_digest,/^[a-f0-9]{64}$/);
    assert.ok(!opts.body.includes('203.0.113.7'),'raw IP must not reach database');
    return new Response('7',{status:200});
  };
  assert.equal((await worker.fetch(req(),enabled)).status,204);
  assert.equal(calls,1);
  context.fetch=original;
  console.log('PASS: endpoint method, origin, disabled default, payload, HMAC and server RPC');
})().catch(e=>{console.error(e);process.exitCode=1});
