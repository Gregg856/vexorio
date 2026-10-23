// Production release gate: never accidentally copy staging-only moderation into main.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/deploy.yml','utf8');
const required=[
 ['production Supabase backend','https://lfytoxcnutduahshbsko.supabase.co'],
 ['search','id="query"'],
 ['login','id="authDialog"'],
 ['listing form','id="addForm"'],
 ['chat','id="myConversations"'],
 ['fraud warning','function listingRiskSignals(text)'],
 ['fraud warning confirmation','Wysłać mimo ostrzeżenia'],
];
for(const [name,needle] of required)assert.ok(html.includes(needle),'Missing '+name);
assert.ok(!html.includes('https://owkjdlpawczrnwyszduj.supabase.co'),'Staging database leaked into production HTML');
assert.ok(!html.includes('vexorioStagingSupabase'),'Staging client leaked into production HTML');
assert.ok(!html.includes('stagingModerationQueue'),'Staging admin queue leaked into production HTML');
assert.ok(!/sb_secret_[A-Za-z0-9_-]+/.test(html),'Secret key exposed');
assert.ok(workflow.includes('node tests/production-release-gate.test.js'),'Production deploy must run release gate');
console.log('PASS: production backend isolation, core UI and safety features');
