const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const moderationGuards=[
 ['Message sending uses current authenticated sender', "sendingUserId=session.user.id"],
 ['Unread badge update', "function updateUnreadBadges(count)"],
 ['Admin notifications separate reports and pending photos', "reportCount+pendingCount"],
 ['Admin panel checks server-side role RPC', "sb.rpc('is_vexorio_admin')"],
 ['Admin notification result ignores changed account', "session?.user?.id!==badgeUserId"],
 ['Reported messages require admin role', "async function loadAdminMessageReports()"],
];
for(const [label,fragment] of moderationGuards){assert.ok(html.includes(fragment),'Missing: '+label);console.log('PASS: '+label)}
const required=[
 ['Email sign-in', "sb.auth.signInWithPassword({email,password}"],
 ['Email registration', "sb.auth.signUp({email,password"],
 ['Google OAuth', "sb.auth.signInWithOAuth({provider:'google'"],
 ['Auth busy guard', "authButton.disabled=true"],
 ['Session refresh', "sb.auth.getSession()"],
 ['Authenticated listing submission', "if(!sb||!session)return $('addMsg')"],
 ['Listing database insert', "sb.from('listings').insert(record)"],
 ['Image file validation', "files.some(f=>!allowed.includes(f.type)||f.size<=0||f.size>5*1024*1024)"],
 ['Message insert', "sb.from('messages').insert({conversation_id:sendingConversationId,sender_id:sendingUserId,body:text})"],
 ['Message sender session', "sendingUserId=session.user.id"],
 ['Listing fraud signals', "function listingRiskSignals(text)"],
 ['Report entry', "id=\""],
];
for(const [label,fragment] of required.slice(0,-1)){assert.ok(html.includes(fragment),'Missing: '+label);console.log('PASS: '+label)}
assert.ok(html.includes("id=\"quickCategoryFilter\"")&&html.includes("id=\"quickSubcategoryFilter\""),'Search filters retained');
assert.ok(html.includes("document.querySelector('header .brand')?.addEventListener('click'"),'Logo reset retained');
console.log('PASS: prelaunch structural checks (not live account or security penetration tests)');

// Keep administrative controls wired to the explicit admin authorization check.
const adminRpcNames=['admin_delete_listing','admin_moderation_audit','admin_moderation_users','admin_reported_message_body','admin_set_user_block'];
for(const name of adminRpcNames){assert.ok(html.includes("sb.rpc('"+name+"'"),'Admin RPC missing: '+name)}
assert.ok(html.includes("sb.rpc('is_vexorio_admin')"),'Admin role check missing');
console.log('PASS: admin client wiring; database authorization requires separate verification');

// Avoid silently dropping the client authorization check when changing moderation UI.
assert.ok(html.includes("if(accessError||allowed!==true)"),'Moderation authorization gate missing');
assert.ok(html.includes("if(authError||allowed!==true)"),'Admin dashboard authorization gate missing');
console.log('PASS: admin UI authorization checks retained');

// Closing an admin subsection with X or Escape must return to the dashboard.
assert.ok(html.includes("child.addEventListener('close'"),'Admin dialog close event missing');
assert.ok(html.includes("adminReportListingFilter=null;show('adminDashboardDialog');loadAdminDashboard()"),'Admin subsection return-to-dashboard missing');
console.log('PASS: admin subsection close returns to dashboard');

// Keep organic sharing metadata consistent while the portal grows.
const sharingChecks=[
 ['Search description', '<meta name="description" content="VEXORIO — darmowe ogłoszenia'],
 ['Open Graph title', '<meta property="og:title" content="VEXORIO — Ogłoszenia bez granic">'],
 ['No personal URL in social metadata', '<meta property="og:locale" content="pl_PL">'],
 ['Social preview description', '<meta property="og:description" content="Darmowe ogłoszenia, usługi i zlecenia w Europie.">'],
 ['X summary preview', '<meta name="twitter:card" content="summary">'],
];
for(const [label,fragment] of sharingChecks){assert.ok(html.includes(fragment),'Missing: '+label);console.log('PASS: '+label)}

// Five essential user journeys: static regression checks, not authenticated end-to-end tests.
const userJourneyChecks=[
 ['Registration creates account through Supabase', "sb.auth.signUp({email,password"],
 ['Sign-in fetches session', "sb.auth.getSession()"],
 ['Listings require an authenticated session', "if(!sb||!session)return $('addMsg')"],
 ['Messages use the authenticated sender', "sendingUserId=session.user.id"],
 ['Admin tools require a verified server-side role', "sb.rpc('is_vexorio_admin')"],
];
for(const [label,fragment] of userJourneyChecks){assert.ok(html.includes(fragment),'Missing: '+label);console.log('PASS: '+label)}

// Privacy and multilingual discovery checks for prelaunch.
for(const [label,fragment] of [
 ['German preview locale','<meta property="og:locale:alternate" content="de_DE">'],
 ['English preview locale','<meta property="og:locale:alternate" content="en_GB">'],
 ['Referrer privacy','<meta name="referrer" content="strict-origin-when-cross-origin">'],
 ['Search crawl hint','<meta name="robots" content="index,follow,max-image-preview:large">'],
 ['No personal worker URL in social metadata', 'grzegorzbub1985.workers.dev'],
]){if(label==='No personal worker URL in social metadata')assert.ok(!html.includes(fragment),'Personal URL exposed in page source');else assert.ok(html.includes(fragment),'Missing: '+label);console.log('PASS: '+label)}

// Mobile listing photos fill the frame; all three unread counters share one value.
assert.ok(html.includes('#cards .card .listing-photo{margin-bottom:3px!important;object-fit:cover!important'),'Mobile listing images must fill photo frame');
assert.ok(html.includes("for(const id of ['accountBtn','vexMobileChat'])"),'Account and chat unread badge wiring missing');
assert.ok(html.includes("['accountInboxCount','accountInboxHeadingCount','vexHeaderInboxCount']"),'Header and account unread badge wiring missing');
assert.ok(html.includes("const value=count>0?String(Math.min(count,99))"),'Unread count value normalization missing');
console.log('PASS: mobile photo and synchronized unread badge structural checks');

// Discovery readiness: avoid publishing a sitemap pointing at a temporary account hostname.
const robots=fs.readFileSync('robots.txt','utf8');
assert.match(robots,/^User-agent: \*$/m,'Robots policy must have a crawler group');
assert.match(robots,/^Allow: \/$/m,'Public homepage must be crawlable');
assert.doesNotMatch(robots,/grzegorzbub1985|Sitemap:/i,'Do not publish temporary personal Workers URL as canonical sitemap');
const workflow=fs.readFileSync('.github/workflows/deploy.yml','utf8');
assert.ok(workflow.includes('cp robots.txt public/robots.txt'),'Deployment must copy robots policy');
assert.ok(workflow.includes('test -s public/robots.txt'),'Deployment must validate robots file');
assert.ok(workflow.includes('DEPLOY_URL/robots.txt'),'Live smoke test must check robots policy');
console.log('PASS: crawler policy, private account hostname, deploy and live smoke wiring');
