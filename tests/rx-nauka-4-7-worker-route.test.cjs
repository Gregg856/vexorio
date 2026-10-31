// RX NAUKA 4.7 — existing Worker route security and Brain mapping contract.
// Run: node --test tests/rx-nauka-4-7-worker-route.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const worker=fs.readFileSync(path.join(__dirname,'..','worker.js'),'utf8');
const start=worker.indexOf("if(url.pathname==='/api/rx/admin/brain-memory')");
const end=worker.indexOf('// Admin-only read bridge',start);
assert.ok(start!==-1&&end>start,'Existing Worker route required');
const route=worker.slice(start,end);
test('Worker already implements the existing Brain memory route',()=>{
 assert.match(route,/request.method!=='GET'/);
 assert.match(route,/Cache-Control':'no-store'/);
 assert.match(route,/Origin rejected/);
 assert.match(route,/Site rejected/);
});
test('Worker checks Supabase identity and admin permission',()=>{
 assert.match(route,/\/auth\/v1\/user/);
 assert.match(route,/is_vexorio_admin/);
 assert.match(route,/Session expired/);
 assert.match(route,/Forbidden/);
});
test('private RX CLOUD access uses server-only configuration',()=>{
 assert.match(route,/env\.RX_QUEEN_LOCAL_TOKEN/);
 assert.match(route,/env\.RX_CLOUD_BRAIN_MEMORY_URL/);
 assert.match(route,/__rxcloud\/bibi\/brain-memory/);
 assert.match(route,/redirect:'error'/);
});
test('Worker maps persisted counters into BIBI contract without exposing evidence',()=>{
 assert.match(route,/samples:item\.successes\+item\.failures/);
 assert.match(route,/successRate:item\.successes\/\(item\.successes\+item\.failures\)/);
 assert.match(route,/requiresApproval:true/);
 assert.doesNotMatch(route,/lastEvidence\s*:/);
});
test('Worker rejects malformed records and oversized responses',()=>{
 assert.match(route,/raw\.length>100000/);
 assert.match(route,/data\.records\.length>200/);
 assert.match(route,/Number\.isSafeInteger\(item\.successes\)/);
 assert.match(route,/Number\.isSafeInteger\(item\.failures\)/);
});
