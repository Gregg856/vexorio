// RX NAUKA 4.5 — existing BIBI panel / Brain API contract tests.
// Run: node --test tests/rx-nauka-4-5-api-contract.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const panel=fs.readFileSync(path.join(__dirname,'..','rx-bibi-manager.html'),'utf8');
const start=panel.indexOf("  const brainMatch=");
const end=panel.indexOf("  // Read-only admin memory lookup",start);
assert.ok(start!==-1&&end>start,'Existing BIBI Brain API branch is required');
const branch=panel.slice(start,end);
test('existing chat recognizes the precise Brain memory command',()=>{
 assert.match(branch,/co \(\?:pamiętasz\|pamietasz\) o zadaniu/);
 assert.match(branch,/\[a-z0-9_-\]\{1,80\}/);
});
test('Brain API requires authenticated admin session and bearer token',()=>{
 assert.match(branch,/auth\.getSession\(\)/);
 assert.match(branch,/session\?\.access_token/);
 assert.match(branch,/Authorization:'Bearer '/);
});
test('API uses existing same-origin read-only endpoint and disables caching',()=>{
 assert.match(branch,/fetch\('\/api\/rx\/admin\/brain-memory'/);
 assert.match(branch,/cache:'no-store'/);
 assert.match(branch,/Accept:'application\/json'/);
});
test('API response must have explicit success and expected kind',()=>{
 assert.match(branch,/!response\.ok\|\|!payload\.ok\|\|payload\.kind!=='rx-brain-memory'/);
 assert.match(branch,/Array\.isArray\(payload\.records\)/);
});
test('untrusted API fields are checked and display remains advisory',()=>{
 assert.match(branch,/Number\.isSafeInteger\(entry\.samples\)/);
 assert.match(branch,/Number\.isFinite\(entry\.successRate\)/);
 assert.match(branch,/entry\.action\.slice\(0,120\)/);
 assert.match(branch,/Niczego nie wykonałam/);
});
test('request failure restores send control and reports failure',()=>{
 assert.match(branch,/catch\(error\)/);
 assert.match(branch,/finally\{send\.disabled=false;\}/);
});
