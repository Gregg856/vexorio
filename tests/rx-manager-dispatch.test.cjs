'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('worker.js','utf8');
 const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const origin='https://vexorio.example';
 const env={ASSETS:{fetch:async()=>new Response('asset')}};
 const call=(method,headers={},extras={})=>worker.fetch(new Request(origin+'/api/rx/run-test',{method,headers}),{...env,...extras});
 let r=await call('GET');
 assert.equal(r.status,405,'GET must not trigger workflow');
 r=await call('POST',{'Origin':'https://evil.example'});
 assert.equal(r.status,403,'Cross-origin request must be rejected');
 r=await call('POST',{'Origin':origin});
 assert.equal(r.status,503,'Missing secrets must fail closed');
 r=await call('POST',{'Origin':origin},{RX_GITHUB_DISPATCH_TOKEN:'fake',RX_ADMIN_USER_ID:'admin',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public'});
 assert.equal(r.status,401,'Missing bearer token must be rejected');
 const originalFetch=globalThis.fetch;
 const settings={RX_GITHUB_DISPATCH_TOKEN:'fake',RX_ADMIN_USER_ID:'admin',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public'};
 try{
  let githubCalls=0;
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'not-admin'});
   githubCalls++;
   return new Response(null,{status:204});
  };
  r=await call('POST',{'Origin':origin,'Authorization':'Bearer valid-token'},settings);
  assert.equal(r.status,403,'Authenticated non-admin must be denied');
  assert.equal(githubCalls,0,'Non-admin must not dispatch GitHub workflow');
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'admin'});
   githubCalls++;
   return new Response(null,{status:204});
  };
  r=await call('POST',{'Origin':origin,'Authorization':'Bearer valid-token'},settings);
  assert.equal(r.status,202,'Authenticated admin may dispatch workflow');
  assert.equal(githubCalls,1,'Admin dispatch must call GitHub exactly once');
 }finally{globalThis.fetch=originalFetch;}
 console.log('PASS RX workflow dispatch: method, origin, missing configuration and authentication');
})().catch(e=>{console.error(e);process.exitCode=1});
