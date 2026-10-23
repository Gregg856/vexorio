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
// Five regression guards for the production listing submission path.
const submissionStart=html.indexOf("$('addForm').onsubmit=async e=>");
assert.ok(submissionStart>=0,'Missing listing submit handler');
const submission=html.slice(submissionStart,submissionStart+9500);
const guards=[
 ['fresh authenticated user',/sb\.auth\.getUser\(\)/],
 ['zero-byte and oversized image rejection',/f\.size===0\|\|f\.size>5\*1024\*1024/],
 ['total image upload limit',/files\.reduce\(\(total,file\)=>total\+file\.size,0\)>20\*1024\*1024/],
 ['authentication recheck before saving',/authBeforeSave/],
 ['required country and city',/newCountry[\s\S]*newCity/],
];
for(const [name,pattern] of guards)assert.match(submission,pattern,'Missing protection: '+name);
console.log('PASS: five listing submission regression guards');

// Authenticated-feature regression checks: protect ownership and private messages.
const authenticatedChecks=[
 ['listing edit owner constraint',/\.from\('listings'\)\.update\(changes\)\.eq\('id',editingListingId\)\.eq\('owner_id',session\.user\.id\)/],
 ['listing delete owner constraint',/\.from\('listings'\)\.delete\(\)\.eq\('id',x\.id\)\.eq\('owner_id',session\.user\.id\)/],
 ['chat fresh user verification',/async function sendMessage\(listingId,sellerId,message\)[\s\S]{0,200}sb\.auth\.getUser\(\)/],
 ['chat prevents self-messaging',/if\(user\.id===sellerId\)throw/],
 ['inbox limits conversations to participant',/\.or\('buyer_id\.eq\.'\+session\.user\.id\+',seller_id\.eq\.'\+session\.user\.id\)/],
];
for(const [name,pattern] of authenticatedChecks)assert.match(html,pattern,'Missing authenticated guard: '+name);
console.log('PASS: five authenticated ownership and messaging guards');
console.log('PASS: production backend isolation, core UI and safety features');
