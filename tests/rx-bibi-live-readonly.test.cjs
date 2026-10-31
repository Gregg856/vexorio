'use strict';
// Read-only production probe: no credentials, no POST, no state mutation.
const test=require('node:test'),assert=require('node:assert/strict');
const base=process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev';
test('public BIBI panel and protected client route respond safely',async t=>{
 const origin=new URL(base);
 if(origin.protocol!=='https:')throw Error('HTTPS required');
 const get=async(path)=>fetch(new URL(path,origin),{method:'GET',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'text/html,application/json'}});
 await t.test('existing panel is reachable',async()=>{
  const r=await get('/rx-bibi-manager.html');
  assert.equal(r.status,200,'panel HTTP status');
  const body=await r.text();
  assert.match(body,/RX BIBI Manager/);
 });
 await t.test('client chat refuses unauthenticated POST before any message processing',async()=>{
  const r=await fetch(new URL('/api/rx/client/chat',origin),{
   method:'POST',redirect:'manual',signal:AbortSignal.timeout(12000),
   headers:{Origin:origin.origin,'Content-Type':'application/json'},
   body:JSON.stringify({message:'Napisz wiadomość: test bezpieczeństwa.'})
  });
  assert.equal(r.status,401,'missing authorization must be rejected');
  const body=await r.text();
  assert.doesNotMatch(body,/Cześć!|Pozdrawiam!/);
 });
 await t.test('client chat refuses unauthenticated GET',async()=>{
  const r=await get('/api/rx/client/chat');
  assert.equal(r.status,405,'GET must not invoke authenticated chat');
  const body=await r.text();
  assert.doesNotMatch(body,/access_token|Bearer\s+[A-Za-z0-9]/);
 });
});
