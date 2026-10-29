'use strict';
// Non-credentialed automated RX panel-to-chat contract smoke test.
// Does not impersonate an administrator or send a private token.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('rx-admin-prototype.html','utf8');
const worker=fs.readFileSync('worker.js','utf8');
assert.match(html,/fetch\('\/api\/rx\/chat',\{method:'POST'/);
assert.match(html,/Authorization:'Bearer '\+token/);
assert.match(html,/rxClient\.auth\.getSession\(\)/);
assert.match(html,/async function answerServerBrainChat\(question\)/);
assert.match(worker,/url\.pathname==='\/api\/rx\/chat'/);
assert.match(worker,/request\.method!=='POST'/);
assert.match(worker,/request\.headers\.get\('Origin'\)!==url\.origin/);
assert.match(worker,/rpc\/is_vexorio_admin/);
assert.match(worker,/planRXChat\(message,history,bibiLearning\)/);
assert.match(worker,/RX_BIBI_LEARNING_TOKEN/);
assert.match(worker,/RX_BIBI_LEARNING_URL/);
assert.match(worker,/engine:localEngine/);
assert.match(html,/data\.answer/);
console.log('RX chat panel/server contract OK (without authenticated session)');
