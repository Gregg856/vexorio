'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('rx/autopraca/edge-functions/rx-queen-private-queue/index.ts','utf8');
const checks=[
 ['read-only GET',/req\.method!=='GET'/],
 ['staging project lock',/STAGING='owkjdlpawczrnwyszduj'/],
 ['staging database lock',/staging_database_only/],
 ['JWT required',/authentication_required/],
 ['Supabase Auth verifies JWT',/\/auth\/v1\/user/],
 ['admin membership verified',/\/rest\/v1\/rpc\/is_vexorio_admin/],
 ['anonymous denied',/is_anonymous===true/],
 ['origin guard',/origin_not_allowed/],
 ['parameterized SQL client',/sql`select id, source/],
 ['private table read',/rx_private\.ant_task_queue/],
 ['bounded results',/limit 20/],
 ['connection cleanup',/await sql\.end/],
 ['fail closed',/gateway_unavailable/]
];
for(const [label,re] of checks)assert.match(src,re,label);
assert.doesNotMatch(src,/grant\s+.+\s+to\s+(anon|authenticated)/i);
assert.doesNotMatch(src,/create\s+function.+security\s+definer/is);
console.log('Gateway static security checks passed:',checks.length);
// Static contract only: does not prove deployment, database connectivity or runtime auth.
