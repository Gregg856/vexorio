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
// BIBI verifies the actual owner-only Queen -> RX Developer dispatch contract.
assert.match(worker,/developerMatch/);
assert.match(worker,/rx-developer-bridge\.yml\/dispatches/);
assert.match(worker,/RX_GITHUB_DISPATCH_TOKEN/);
assert.match(worker,/identity\.id!==env\.RX_ADMIN_USER_ID/);
assert.match(worker,/inputs:\{target\}/);
assert.match(worker,/queued:true,executed:1/);
const workflow=fs.readFileSync('.github/workflows/rx-developer-bridge.yml','utf8');
const runner=fs.readFileSync('rx-developer-review-runner.cjs','utf8');
assert.match(workflow,/RX_TARGET/);
assert.match(workflow,/node rx-developer-review-runner\.cjs/);
assert.match(workflow,/node tests\/rx-developer-bridge-isolated\.cjs/);
assert.match(runner,/inspectAndPropose/);
assert.match(runner,/rx-developer-review\.json/);
assert.match(runner,/changesApplied:false/);
assert.match(worker,/engine:localEngine/);
assert.match(html,/data\.answer/);
console.log('RX chat panel/server contract OK (without authenticated session)');
