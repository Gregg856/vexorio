'use strict';
// Read-only production probe: no credentials, no POST, no state mutation.
const test=require('node:test'),assert=require('node:assert/strict');
const base=process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev';
test('public BIBI panel and protected client route respond safely',async t=>{
 const origin=new URL(base);
 if(origin.protocol!=='https:')throw Error('HTTPS required');
 const get=async(path)=>fetch(new URL(path,origin),{method:'GET',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'text/html,application/json'}});
 await t.test('existing panel is reachable',async()=>{
  let r=await get('/rx-bibi-manager.html');
  if([301,302,303,307,308].includes(r.status)){
   const location=r.headers.get('location');
   assert.ok(location,'panel redirect must include Location');
   const target=new URL(location,new URL('/rx-bibi-manager.html',origin));
   assert.equal(target.origin,origin.origin,'panel redirect must stay on the same origin');
   assert.ok(['/rx-bibi-manager.html','/rx-bibi-manager','/rx-bibi'].includes(target.pathname),'panel redirect must target the existing BIBI panel');
   r=await fetch(target,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'text/html'}});
  }
  assert.equal(r.status,200,'panel HTTP status after safe redirect');
  const body=await r.text();
  assert.match(body,/RX BIBI Manager/);
 });
 await t.test('deployed client offers Google login and signup',async()=>{
  const r=await get('/rx-client');
  assert.equal(r.status,200,'client panel must be publicly reachable for sign-in');
  const body=await r.text();
  assert.match(body,/id="google-signin"/,'Google login button missing from deployed client');
  assert.match(body,/id="signup"/,'registration button missing from deployed client');
  assert.match(body,/signInWithOAuth/,'Google login handler missing');
  assert.match(body,/signUp\s*\(/,'registration handler missing');
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
