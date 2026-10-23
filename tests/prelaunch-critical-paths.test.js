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
 ['Message sender session', "const sendingUserId=session.user.id"],
 ['Listing fraud signals', "function listingRiskSignals(text)"],
 ['Report entry', "id=\""],
];
for(const [label,fragment] of required.slice(0,-1)){assert.ok(html.includes(fragment),'Missing: '+label);console.log('PASS: '+label)}
assert.ok(html.includes("id=\"quickCategoryFilter\"")&&html.includes("id=\"quickSubcategoryFilter\""),'Search filters retained');
assert.ok(html.includes("document.querySelector('header .brand')?.addEventListener('click'"),'Logo reset retained');
console.log('PASS: prelaunch structural checks (not live account or security penetration tests)');
