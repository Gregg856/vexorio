const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const required=[
 ['Email sign-in', "sb.auth.signInWithPassword({email,password}"],
 ['Email registration', "sb.auth.signUp({email,password"],
 ['Google OAuth', "sb.auth.signInWithOAuth({provider:'google'"],
 ['Auth busy guard', "authButton.disabled=true"],
 ['Session refresh', "sb.auth.getSession()"],
 ['Authenticated listing submission', "if(!sb||!session)return $('addMsg')"],
 ['Listing database insert', "sb.from('listings').insert(record)"],
 ['Image file validation', "files.some(f=>!allowed.includes(f.type)||f.size>5*1024*1024)"],
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
