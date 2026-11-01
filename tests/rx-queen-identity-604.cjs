'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const worker=fs.readFileSync('worker.js','utf8');
const panel=fs.readFileSync('rx-bibi-manager.html','utf8');
const start=worker.indexOf("if(url.pathname==='/api/rx/admin/queen-chat')");
const end=worker.indexOf("if(url.pathname==='/api/rx/admin/brain-memory')",start);
assert(start>=0&&end>start,'Queen endpoint must precede private memory route');
const route=worker.slice(start,end);
for(const check of [
  /request\.method!=='POST'/,
  /request\.headers\.get\('Origin'\)/,
  /request\.headers\.get\('Sec-Fetch-Site'\)/,
  /\/auth\/v1\/user/,
  /is_vexorio_admin/,
  /permission\.json\(\)\)!==true/,
  /message\.length>2000/,
  /Jestem Królową RX/,
  /modelInferenceUsed:false/,
  /executed:0/
])assert.match(route,check,'Missing Queen security/identity contract: '+check);
assert.doesNotMatch(route,/\/api\/rx\/client\/chat|askClientModel|RX_QUEEN_LOCAL_TOKEN/,'Queen identity probe must not call client or privileged model');
assert.match(panel,/fetch\('\/api\/rx\/admin\/queen-chat'/,'Manager must call private Queen route');
assert.match(panel,/Authorization:'Bearer '\+data\.session\.access_token/,'Manager must forward session');
assert.match(panel,/Panel Królowej RX — zarządzanie BIBI/);
assert.match(worker,/if\(url\.pathname==='\/api\/rx\/client\/chat'\)/,'BIBI route remains intact');
assert.match(route,/co potrafisz\\|co umiesz/,'Queen should handle capability questions');
assert.match(route,/status rx/,'Queen should handle status questions');
assert.match(route,/rx-queen-basic-chat/,'Queen should label basic dialogue truthfully');
assert.match(panel,/co potrafisz\\|co umiesz/,'Manager should route basic dialogue privately');
console.log('RX #604 Queen security and identity contract: PASS');
