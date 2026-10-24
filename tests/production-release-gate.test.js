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

// Moderation regression gate: prevent accidental removal of admin safety controls.
const moderationChecks=[
 ['report administration verifies access',/async function loadAdminReports\(\)[\s\S]{0,450}is_vexorio_admin/],
 ['user administration verifies access',/async function loadAdminUsers\(\)[\s\S]{0,450}is_vexorio_admin/],
 ['reported message body requires explicit reveal',/reveal\.textContent=(?:language==='uk'\?'[^']+':)?'Pokaż zgłoszoną wiadomość'/],
 ['message report decisions use optimistic concurrency',/from\('message_reports'\)\.update\(\{status:nextStatus\}\)\.eq\('id',item\.id\)\.eq\('status',item\.status\)/],
 ['destructive listing moderation requires typed confirmation',/typed!==String\(id\)/],
];
for(const [name,pattern] of moderationChecks)assert.match(html,pattern,'Missing moderation protection: '+name);
console.log('PASS: five moderation regression guards');

// Listing visibility and reporting safety regression checks.
const visibilityChecks=[
 ['closed listings excluded from public results',/allListings=rows\.filter\(x=>x\.status!=='closed'\)/],
 ['admin deletion delegated to protected RPC',/sb\.rpc\('admin_delete_listing',\{p_listing_id:id\}\)/],
 ['admin rights rechecked before deleting',/stillAdmin,error:verifyError[\s\S]{0,120}is_vexorio_admin/],
 ['report category constrained to allowed reasons',/\['fraud','illegal','spam','privacy','other'\]\.includes\(category\)/],
 ['report ownership verified against authenticated user',/reportedListing\?\.owner_id===reportAuth\.user\.id/],
];
for(const [name,pattern] of visibilityChecks)assert.match(html,pattern,'Missing listing moderation protection: '+name);
console.log('PASS: five listing visibility and reporting guards');

// Pending photo previews remain inside the administrator-only moderation dialog.
assert.match(html,/id="adminPendingList"/,'Pending queue missing');
assert.match(html,/async function loadAdminPendingListings\(\)/,'Pending queue loader missing');
assert.match(html,/await sb\.rpc\('is_vexorio_admin'\)/,'Admin authorization missing');
assert.match(html,/Array\.isArray\(item\.listing_images\)/,'Pending photo list missing');
assert.match(html,/photo\.loading='lazy'/,'Pending photo lazy loading missing');
console.log('PASS: five pending listing photo moderation guards');

assert.match(html,/if\(!await validListingImageSignature\(f\)\)/,'New listing photo signatures must be verified');
assert.match(html,/f\.size<=0\|\|f\.size>5\*1024\*1024/,'New listing must reject empty and oversized images');
assert.match(html,/files\.some\(f=>!allowed\.includes\(f\.type\)\|\|f\.size<=0/,'Edited listing must reject empty images');
console.log('PASS: image upload signature and zero-length guards');

// Private moderation image lifecycle must remain wired end-to-end.
assert.match(html,/storage\.from\('listing-images-review'\)\.upload\(path,f,/,'New photos must upload privately');
assert.match(html,/storage\.from\('listing-images-review'\)\.upload\(path,file,/,'Edited photos must upload privately');
assert.match(html,/vexorio_admin_publish_reviewed_listing/,'Approval must publish private photos atomically');
assert.match(html,/storage\.from\('listing-images-review'\)\.download\(path\)/,'Admin must read private photos before publication');
assert.match(html,/storage\.from\('listing-images-review'\)\.createSignedUrl/,'Private photo previews must be signed');
console.log('PASS: private listing photo lifecycle regression checks');

// Static security headers must be deployed with the site and retain five safeguards.
const headers=fs.readFileSync('_headers','utf8');
for(const fragment of [
 'X-Content-Type-Options: nosniff',
 'Referrer-Policy: strict-origin-when-cross-origin',
 'X-Frame-Options: DENY',
 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
 'X-Permitted-Cross-Domain-Policies: none',
])assert.ok(headers.includes(fragment),'Missing browser security header: '+fragment);
assert.ok(workflow.includes('cp _headers public/_headers'),'Cloudflare deploy must ship static security headers');
assert.ok(workflow.includes('test -s public/_headers'),'Deployment must check security header file');
console.log('PASS: five browser protections included in deploy assets');

const worker=fs.readFileSync('worker.js','utf8');
const workerGuards=[
 ['HTTPS transport hardening', "headers.set('Strict-Transport-Security', 'max-age=31536000')"],
 ['safe download behavior', "headers.set('X-Download-Options', 'noopen')"],
 ['missing and error pages excluded from search', "headers.set('X-Robots-Tag', 'noindex, nofollow')"],
 ['missing pages never cached', "response.status === 404"],
 ['server errors never cached', "response.status >= 500"],
];
for(const [name,needle] of workerGuards)assert.ok(worker.includes(needle),'Missing Worker hardening: '+name);
assert.ok(worker.includes("headers.set('Cache-Control', 'no-store')"),'Missing error no-store header');
console.log('PASS: five Worker security and SEO guards');

// A second submit while session or image validation is pending must be ignored.
assert.ok(html.includes("if(submit.disabled||submit.dataset.verifying==='1')return;submit.dataset.verifying='1';try{"),'Missing early listing submission lock');
assert.ok(html.includes("}finally{delete submit.dataset.verifying}"),'Missing listing submission lock release');
console.log('PASS: duplicate listing submissions blocked during async validation');

// Damaged or unreadable files must be rejected without an unhandled File.arrayBuffer rejection.
assert.ok(html.includes('let bytes;try{bytes=new Uint8Array(await file.slice(0,12).arrayBuffer())}catch{return false}'),'Unreadable photo signature must fail closed');
console.log('PASS: unreadable photo files rejected gracefully');

// New listings must be owned by the identity returned from the fresh Supabase getUser check.
assert.ok(html.includes("const record={owner_id:authBeforeSave.user.id,title:"),'Listing owner must use freshly verified auth identity');
console.log('PASS: listing owner bound to freshly verified user');
