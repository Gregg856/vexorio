'use strict';
// Isolated UI integration: real rx-client.html, mocked auth and API. No production login.
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report={mode:'ISOLATED_UI_MOCK_NOT_AUTHENTICATED_PRODUCTION',checks:[],requests:[]};
 try{
  const page=await browser.newPage({...devices['Pixel 7'],locale:'pl-PL'});
  const origin='https://vexorio.grzegorzbub1985.workers.dev';
  const html=fs.readFileSync(path.join(__dirname,'../rx-client.html'),'utf8');
  await page.route(origin+'/rx-client',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:`
window.supabase={createClient:()=>({
 auth:{getSession:async()=>({data:{session:{user:{id:'rx-ui-test-user'},access_token:'test-token'}}}),onAuthStateChange:()=>{},signOut:async()=>{}},
 from:()=>({select:()=>({order:()=>({limit:async()=>({data:[],error:null})})})})
})};`}));
  await page.route(origin+'/api/rx/client/config',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({url:'https://mock.invalid',anonKey:'public-test'})}));
  let failNext=false;
  await page.route(origin+'/api/rx/client/chat',async route=>{
   const request=route.request();
   const data=request.postDataJSON();
   report.requests.push({message:data.message,history:data.history,authorized:request.headers().authorization==='Bearer test-token'});
   if(failNext){failNext=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Temporary test outage'})});return;}
   const answer=data.message==='Dalej'?'Kontynuujemy rozmowę o ogrodzie.':'Porozmawiajmy o ogrodzie.';
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({answer})});
  });
  // Check the public entry points without contacting Google or creating an account.
  if(!html.includes('id="google-signin"')||!html.includes('id="signup"'))throw Error('Missing registration or Google login control');
  if(!html.includes("signInWithOAuth({provider:'google'")||!html.includes('client.auth.signUp('))throw Error('Missing Supabase auth handlers');
  report.checks.push({name:'registration_and_google_handlers_present',passed:true});
  await page.goto(origin+'/rx-client',{waitUntil:'load'});
  await page.locator('#chat').waitFor({state:'visible',timeout:15000});
  report.checks.push({name:'chat_visible_after_mock_session',passed:true});
  for(const message of ['Chcę porozmawiać o ogrodzie','Dalej']){
   await page.locator('#message').fill(message);
   await page.locator('#send').click();
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent==='Gotowe.',{timeout:10000});
  }
  const bubbles=await page.locator('#messages .bubble').allTextContents();
  const expected=['Chcę porozmawiać o ogrodzie','Porozmawiajmy o ogrodzie.','Dalej','Kontynuujemy rozmowę o ogrodzie.'];
  if(JSON.stringify(bubbles)!==JSON.stringify(expected))throw Error('Unexpected chat bubbles: '+JSON.stringify(bubbles));
  report.checks.push({name:'user_and_assistant_bubbles',passed:true});
  if(report.requests.length!==2||!report.requests.every(x=>x.authorized))throw Error('Missing authenticated mock API calls');
  if(!Array.isArray(report.requests[1].history)||report.requests[1].history.length!==2)throw Error('Missing multi-turn history');
  report.checks.push({name:'api_request_and_multiturn_history',passed:true});
  failNext=true;
  const beforeFailure=await page.locator('#messages .bubble').count();
  await page.locator('#message').fill('Wiadomość po awarii');
  await page.locator('#send').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Wiadomość przywrócona'),{timeout:10000});
  if(await page.locator('#message').inputValue()!=='Wiadomość po awarii')throw Error('Message lost after server failure');
  if(await page.locator('#messages .bubble').count()!==beforeFailure+1)throw Error('Unexpected bubble count after failure');
  report.checks.push({name:'failed_send_restores_composer',passed:true});
  await page.locator('#send').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent==='Gotowe.',{timeout:10000});
  const afterRetry=await page.locator('#messages .bubble').allTextContents();
  if(afterRetry.filter(x=>x==='Wiadomość po awarii').length!==1)throw Error('Retry duplicated user bubble');
  if(report.requests.length!==4||report.requests[3].history.length!==4)throw Error('Retry history inconsistent');
  report.checks.push({name:'retry_no_duplicate_user_bubble',passed:true});
  // Refresh after a simulated server outage: the draft and retry marker must survive.
  failNext=true;
  await page.locator('#message').fill('Ponów po odświeżeniu');
  await page.locator('#send').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Wiadomość przywrócona'));
  await page.reload({waitUntil:'load'});
  await page.locator('#chat').waitFor({state:'visible'});
  if(await page.locator('#message').inputValue()!=='Ponów po odświeżeniu')throw Error('Draft missing after refresh');
  report.checks.push({name:'retry_draft_survives_refresh',passed:true});
  await page.locator('#send').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent==='Gotowe.');
  const refreshedBubbles=await page.locator('#messages .bubble').allTextContents();
  if(refreshedBubbles.filter(x=>x==='Ponów po odświeżeniu').length!==1)throw Error('Refresh retry duplicated user bubble');
  report.checks.push({name:'refresh_retry_no_duplicate',passed:true});
  // Changing a failed draft must discard its abandoned user bubble.
  failNext=true;
  await page.locator('#message').fill('Porzucona wiadomość');
  await page.locator('#send').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Wiadomość przywrócona'));
  await page.locator('#message').fill('Poprawiona wiadomość');
  await page.locator('#send').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent==='Gotowe.');
  const changedBubbles=await page.locator('#messages .bubble').allTextContents();
  if(changedBubbles.includes('Porzucona wiadomość')||changedBubbles.filter(x=>x==='Poprawiona wiadomość').length!==1)throw Error('Edited retry retained abandoned bubble');
  report.checks.push({name:'edited_retry_discards_abandoned_bubble',passed:true});
  report.passed=true;
  console.log('PASS RX BIBI CLIENT UI MOCK:',report.checks.map(x=>x.name).join(', '));
 }catch(e){report.passed=false;report.error=e.message;process.exitCode=1;console.error('FAIL RX BIBI CLIENT UI MOCK:',e.message);}
 finally{fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-client-ui-mock.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
