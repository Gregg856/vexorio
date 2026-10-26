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
 r=await worker.fetch(new Request(origin+'/api/rx/health'),env);
 assert.equal(r.status,200,'Health endpoint should respond');
 assert.equal((await r.json()).ready,false,'Health should show unconfigured state');
 r=await worker.fetch(new Request(origin+'/api/rx/health'),{...env,RX_GITHUB_DISPATCH_TOKEN:'fake',RX_ADMIN_USER_ID:'admin',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public'});
 assert.equal((await r.json()).ready,true,'Health should show configured state');
 r=await worker.fetch(new Request(origin+'/api/rx/health',{method:'POST'}),env);
 assert.equal(r.status,405,'Health endpoint must be read-only');
 const originalFetch=globalThis.fetch;
 const settings={RX_GITHUB_DISPATCH_TOKEN:'fake',RX_ADMIN_USER_ID:'admin',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public'};
 try{
  let githubCalls=0;
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'regular-user'});
   if(String(url).endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(false);
   githubCalls++;
   return new Response(null,{status:204});
  };
  r=await call('POST',{'Origin':origin,'Authorization':'Bearer valid-token'},settings);
  assert.equal(r.status,403,'Authenticated non-admin must be denied');
  assert.equal(githubCalls,0,'Non-admin must not dispatch GitHub workflow');
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'second-admin'});
   if(String(url).endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(true);
   githubCalls++;
   return new Response(null,{status:204});
  };
  r=await call('POST',{'Origin':origin,'Authorization':'Bearer valid-token'},settings);
  assert.equal(r.status,202,'Admin in admin_members may dispatch workflow');
  assert.equal(githubCalls,1,'Admin dispatch must call GitHub exactly once');
 }finally{globalThis.fetch=originalFetch;}
 // Admin-only failed-step diagnostics: enforce method, origin, auth and membership.
 const diagEnv={...env,RX_GITHUB_DISPATCH_TOKEN:'fake',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public'};
 const diag=(headers={},method='GET',id='123')=>worker.fetch(new Request(origin+'/api/rx/failed-steps?run_id='+id,{method,headers}),diagEnv);
 r=await diag({},'POST');assert.equal(r.status,405,'Diagnostics must be read-only');
 r=await diag({'Origin':'https://evil.example'});assert.equal(r.status,403,'Cross-origin diagnostics denied');
 r=await diag({'Sec-Fetch-Site':'cross-site'});assert.equal(r.status,403,'Cross-site diagnostics denied');
 r=await diag({},'GET','bad');assert.equal(r.status,400,'Invalid run id rejected');
 r=await diag();assert.equal(r.status,401,'Anonymous diagnostics denied');
 const originalDiagFetch=globalThis.fetch;
 try{
  let githubReads=0;
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'regular-user'});
   if(String(url).endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(false);
   githubReads++;return Response.json({jobs:[]});
  };
  r=await diag({'Authorization':'Bearer valid-token'});
  assert.equal(r.status,403,'Non-admin diagnostics denied');
  assert.equal(githubReads,0,'Non-admin must not access GitHub');
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'authorized-admin'});
   if(String(url).endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(true);
   githubReads++;
   return Response.json({jobs:[{id:456,name:'Testy',conclusion:'failure',steps:[{name:'Sprawdź',conclusion:'failure',started_at:'2026-10-26T01:00:00Z',completed_at:'2026-10-26T01:01:00Z'},{name:'OK',conclusion:'success'}]}]});
  };
  r=await diag({'Authorization':'Bearer valid-token'});
  assert.equal(r.status,200,'Authorized admin can read diagnostics without Origin header');
  const result=await r.json();
  assert.equal(result.failed.length,1);
  assert.equal(result.failed[0].steps.length,1,'Only failed steps are returned');
  assert.equal(githubReads,1,'Admin reads GitHub once');
  // An admin endpoint must not leak job data when session or permission checks fail.
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return new Response('expired',{status:401});
   throw Error('GitHub must not be called with an expired session');
  };
  r=await diag({'Authorization':'Bearer expired-token'});
  assert.equal(r.status,401,'Expired session must be rejected');
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'anonymous-user',is_anonymous:true});
   throw Error('No permission or GitHub call for anonymous identity');
  };
  r=await diag({'Authorization':'Bearer valid-token'});
  assert.equal(r.status,403,'Anonymous identity must be denied');
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'authorized-admin'});
   if(String(url).endsWith('/rest/v1/rpc/is_vexorio_admin'))return new Response('failure',{status:500});
   throw Error('GitHub must not be called if permission check fails');
  };
  r=await diag({'Authorization':'Bearer valid-token'});
  assert.equal(r.status,502,'Permission verification errors must fail closed');
  r=await diag({'Authorization':'Bearer valid-token','Sec-Fetch-Site':'same-site'});
  assert.equal(r.status,403,'Same-site but cross-origin diagnostic requests must be denied');
  // GitHub API failures must be handled without exposing response bodies or credentials.
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'authorized-admin'});
   if(String(url).endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(true);
   return new Response('private GitHub token=do-not-leak',{status:403});
  };
  r=await diag({'Authorization':'Bearer valid-token'});
  assert.equal(r.status,502,'GitHub API rate limit or permission error must be handled');
  assert.ok(!(await r.text()).includes('do-not-leak'),'GitHub response body must not leak');
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'authorized-admin'});
   if(String(url).endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(true);
   return new Response('not-json',{status:200});
  };
  r=await diag({'Authorization':'Bearer valid-token'});
  assert.equal(r.status,502,'Malformed GitHub JSON must fail gracefully');
  assert.ok(!(await r.text()).includes('not-json'),'Malformed response body must not leak');
  globalThis.fetch=async url=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'authorized-admin'});
   if(String(url).endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(true);
   throw Error('secret network failure');
  };
  r=await diag({'Authorization':'Bearer valid-token'});
  assert.equal(r.status,502,'Network failure must fail gracefully');
  assert.ok(!(await r.text()).includes('secret network failure'),'Network exception details must not leak');
  // Exercise filtered log extraction without exposing raw tokens or credentials.
  let logRequests=0;
  globalThis.fetch=async url=>{
   const target=String(url);
   if(target.endsWith('/auth/v1/user'))return Response.json({id:'authorized-admin'});
   if(target.endsWith('/rest/v1/rpc/is_vexorio_admin'))return Response.json(true);
   if(target.includes('/actions/runs/123/jobs'))return Response.json({jobs:[{id:456,name:'deploy',conclusion:'failure',steps:[{name:'Build',conclusion:'failure'}]}]});
   if(target.includes('/actions/jobs/456/logs')){logRequests++;return new Response(null,{status:302,headers:{Location:'https://example.blob.core.windows.net/logs/job.txt'}});}
   if(target.includes('example.blob.core.windows.net'))return new Response('ERROR: build failed\nERROR: token=very-secret\nERROR: see https://private.example/path\n',{status:200});
      throw Error('Unexpected network request: '+target);
  };
  r=await worker.fetch(new Request(origin+'/api/rx/failed-steps?run_id=123&include_logs=1',{headers:{Authorization:'Bearer valid-token'}}),diagEnv);
  assert.equal(r.status,200,'Admin may request filtered logs');
  const logged=await r.json();
  assert.equal(logRequests,1,'Fetch failed job log once');
  assert.ok(logged.failed[0].messages.some(x=>x.includes('build failed')),'Safe error extracted');
  assert.ok(!JSON.stringify(logged).includes('very-secret'),'Sensitive token must not reach response');
  assert.ok(!JSON.stringify(logged).includes('private.example'),'URLs must be removed');
 }finally{globalThis.fetch=originalDiagFetch;}
 console.log('PASS RX workflow dispatch: method, origin, missing configuration and authentication');
})().catch(e=>{console.error(e);process.exitCode=1});
