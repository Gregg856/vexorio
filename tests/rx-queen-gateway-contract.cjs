'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('rx/autopraca/edge-functions/rx-queen-private-queue/index.ts','utf8');
const checks=[
 ['read-only GET',/req\.method!=='GET'/],
 ['staging project lock',/STAGING='owkjdlpawczrnwyszduj'/],
 ['staging database lock',/staging_database_only/],
 ['exact staging direct database hostname',/database\.hostname===`db\.\$\{STAGING\}\.supabase\.co`/],
 ['staging pooler username',/database\.username===`postgres\.\$\{STAGING\}`/],
 ['built-in server-only DB secret',/required\('SUPABASE_DB_URL'\)/],
 ['read-only transaction',/sql\.begin\('read only'/],
 ['disable prepared statements for edge pool compatibility',/prepare:false/],
 ['JWT required',/authentication_required/],
 ['Supabase Auth verifies JWT',/\/auth\/v1\/user/],
 ['admin membership verified',/\/rest\/v1\/rpc\/is_vexorio_admin/],
 ['anonymous denied',/is_anonymous===true/],
 ['origin guard',/origin_not_allowed/],
 ['parameterized SQL client',/tx`select id, source/],
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

const worker=fs.readFileSync('worker.js','utf8');
const chatChecks=[
 ['Queen chat route',/url\.pathname==='\/api\/rx\/chat'/],
 ['Queue status chat command',/status mrówek\|status mrowek/],
 ['Queue status staging lock',/Podgląd kolejki działa wyłącznie na staging/],
 ['Queen private gateway called',/new URL\('\/functions\/v1\/rx-queen-private-queue',base\)/],
 ['Bearer session forwarded',/Authorization:auth/],
 ['Queen validates response origin',/data\.source!=='supabase-staging'/],
 ['Queen validates task array',/!Array\.isArray\(data\.tasks\)/],
 ['Queue results bounded',/data\.tasks\.slice\(0,20\)/],
 ['Queue status does not execute tasks',/engine:'rx-queen-queue'.*executed:0/]
];
for(const [label,re] of chatChecks)assert.match(worker,re,label);
console.log('Queen chat queue static checks passed:',chatChecks.length);

const gatewaySource=src.toLowerCase();
const workerQueueSection=worker.slice(worker.indexOf("if(url.pathname==='/api/rx/ants/tasks')"),worker.indexOf("if(url.pathname==='/api/rx/chat')"));
assert.ok(workerQueueSection.length>100,'queue endpoint exists');
assert.doesNotMatch(workerQueueSection,/method:\s*['"](?:post|put|patch|delete)['"]/i,'queue endpoint must not write');
assert.doesNotMatch(src,/\b(?:insert\s+into|update\s+rx_private|delete\s+from|truncate\s+table)\b/i,'gateway must not mutate queue');
assert.match(worker,/if\(!isAdmin\)return reply\(403/,'admin authorization required before queue route');
console.log('Queen read-only and admin-route invariants passed.');
