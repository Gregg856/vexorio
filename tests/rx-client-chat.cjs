'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const worker=fs.readFileSync(require('node:path').join(__dirname,'..','worker.js'),'utf8');
const client=fs.readFileSync(require('node:path').join(__dirname,'..','rx-client.html'),'utf8');
const start=worker.indexOf("if(url.pathname==='/api/rx/client/chat')");
const end=worker.indexOf("if (url.pathname === '/api/rx/run-test'",start);
assert(start>0&&end>start,'Dedicated client route must precede admin route');
const route=worker.slice(start,end);
assert.match(route,/request\.method!=='POST'/,'POST-only');
assert.match(route,/request\.headers\.get\('Origin'\)!==url\.origin/,'Same-origin check');
assert.match(route,/\/auth\/v1\/user/,'Supabase token verification');
assert.match(route,/is_anonymous===true/,'Anonymous users rejected');
assert.match(route,/planRXChat\(message,history,null\)/,'Shared local planner used');
assert.doesNotMatch(route,/RX_GITHUB_DISPATCH_TOKEN|workflow_dispatch|handleRXMemory|service_role/i,'No privileged dispatch or memory writes');
assert.match(route,/adminToolsAvailable:false/,'Explicit client restrictions');
// Public sourced RX knowledge must stay on the client-safe path, never private RX CLOUD memory.
assert.match(route,/publicKnowledgeIntent\?findRXKnowledge\(message\):null/,'Client queries curated public knowledge');
assert.match(route,/engine:'rx-bibi-client-public-knowledge'/,'Client identifies sourced knowledge response');
assert.match(route,/publicKnowledge\.source/,'Client includes the source in knowledge answers');
assert.match(route,/if\(publicKnowledge\)[\s\S]*?adminToolsAvailable:false/,'Knowledge response has no admin tools');
assert.match(route,/private RX CLOUD learning/,'Private learning remains excluded');
assert.match(client,/\/api\/rx\/client\/chat/,'Client uses isolated route');
assert.doesNotMatch(client,/\/api\/rx\/chat['"`]/,'Client must not use admin route');
assert.match(client,/textContent=text/,'Chat messages rendered as text');
assert.doesNotMatch(client,/innerHTML\s*=/,'No HTML injection in chat');
// RX BIBI 6.4: guard double submit even while async session lookup is pending.
assert.match(client,/if\(!message\|\|!client\|\|sendInFlight\)return;sendInFlight=true;/,'Submit guard must engage before first await');
assert.match(client,/catch\{sendInFlight=false;status\('Nie można sprawdzić sesji/,'Session lookup failure must release guard');
assert.match(client,/if\(!data\?\.session\)\{sendInFlight=false;/,'Missing session must release guard');
assert.match(client,/finally\{sendInFlight=false;\$\('send'\)\.disabled=false;/,'Network failure must release guard');
assert.match(client,/response\.status===401\|\|response\.status===403/,'Expired session handled');
console.log('RX BIBI 6.4 client submission lifecycle source checks passed');
// Simulate the actual form handler with minimal DOM and deferred auth/network promises.
const vm=require('node:vm');
const pageScript=client.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(pageScript,'Client module must exist');
const moduleSource=pageScript[1];
const submitStart=moduleSource.indexOf("$('form').onsubmit=async e=>");
const submitStop=moduleSource.indexOf("$('message').addEventListener('keydown'",submitStart);
assert.ok(submitStart>=0&&submitStop>submitStart,'Client submit handler found');
const submitSource=moduleSource.slice(submitStart,submitStop);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
async function simulateSubmit({networkFailure=false,authFailure=false}={}){
 const auth=deferred(),network=deferred(),nodes={
  message:{value:'Czym jest 2FA?'},send:{disabled:false},form:{},messages:{children:[],replaceChildren(){}}
 };
 const messages=[],statusMessages=[],requests=[];
 const context={
  $:id=>nodes[id]||(nodes[id]={}),
  client:{auth:{getSession:()=>auth.promise,signOut:async()=>{}}},
  history:[],tasks:[],sendInFlight:false,
  bubble:(value,me)=>messages.push({value,me:!!me}),
  saveConversation:()=>{},status:value=>statusMessages.push(value),
  scrollLatest:()=>{},syncSession:()=>{},
  fetch:async(url,opts)=>{requests.push({url,opts});return network.promise;}
 };
 vm.createContext(context);
 vm.runInContext(submitSource,context);
 const submit=()=>nodes.form.onsubmit({preventDefault(){}});
 const first=submit(),second=submit();
 assert.equal(context.sendInFlight,true,'Guard engaged before auth resolves');
 assert.equal(messages.length,0,'No duplicate user bubble during auth');
 auth.resolve(authFailure?Promise.reject(Error('Auth offline')):{data:{session:{access_token:'valid-user'}}});
 await tick();
 if(authFailure){
  await Promise.all([first,second]);
  assert.equal(context.sendInFlight,false,'Guard released on auth error');
  assert.equal(requests.length,0,'No request after auth error');
  assert.ok(statusMessages.some(x=>x.includes('Nie można sprawdzić sesji')),'Auth error visible');
  return;
 }
 assert.equal(requests.length,1,'Exactly one API call after double click');
 assert.equal(messages.filter(x=>x.me).length,1,'Exactly one user bubble');
 if(networkFailure)network.reject(Error('Network disconnected'));
 else network.resolve({ok:true,status:200,json:async()=>({answer:'2FA to dodatkowe zabezpieczenie.'})});
 await Promise.all([first,second]);
 assert.equal(context.sendInFlight,false,'Guard released after request');
 assert.equal(nodes.send.disabled,false,'Send button restored');
 assert.equal(requests.length,1,'No duplicate API call');
 assert.ok(statusMessages.includes(networkFailure?'Błąd sieci lub serwera. Wiadomość przywrócona — możesz wysłać ją ponownie.':'Gotowe.'),'Appropriate result status');
 if(networkFailure){assert.equal(context.history.length,0,'Failed request must not pollute conversation context');assert.equal(nodes.message.value,'Czym jest 2FA?','Failed message must be restored for retry');}
 else assert.equal(context.history.length,2,'Successful request recorded once');
}
(async()=>{
 await simulateSubmit();
 await simulateSubmit({networkFailure:true});
 await simulateSubmit({authFailure:true});
 console.log('RX BIBI 6.4 simulated double-submit, network and auth failures passed');
})().catch(error=>{console.error(error);process.exitCode=1;});

console.log('RX client route isolation: source checks passed');
