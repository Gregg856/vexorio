'use strict';
// RX BIBI LIVE: public, read-only checks against the deployed RX ADMIN page.
// Does not bypass auth, send chat messages, or change production data.
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\/$/,'');
(async()=>{
 const report={kind:'rx-bibi-live-panel',base,scope:'DEPLOYED_PUBLIC_GATE_ONLY',authenticatedChat:'NOT_TESTED',checks:[]};
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [name,contextOptions] of [['mobile',{...devices['Pixel 7'],locale:'pl-PL'}],['mobile-narrow',{viewport:{width:360,height:740},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'pl-PL'}],['desktop',{viewport:{width:1365,height:850},locale:'pl-PL'}]]){
   const page=await browser.newPage(contextOptions);
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const response=await page.goto(base+'/rx-admin-prototype',{waitUntil:'domcontentloaded',timeout:30000});
   if(!response?.ok())throw Error(name+': HTTP '+response?.status());
   await page.waitForTimeout(1500);
   if(!await page.locator('#rxGate').isVisible())throw Error(name+': access gate missing');
   if(await page.locator('#rxApp').isVisible())throw Error(name+': anonymous admin app visible');
   if(await page.locator('#input').count()!==1)throw Error(name+': chat input missing in deployed DOM');
   const reportsEntry=await page.evaluate(()=>({menu:document.querySelector('#menu')?.textContent||'',source:[...document.scripts].filter(x=>!x.src).map(x=>x.textContent).join('\n')}));
   if(!reportsEntry.source.includes('🐜 RX BIBI — raport Królowej')||!reportsEntry.source.includes('async function loadBibiQueenWatch'))throw Error(name+': RX BIBI reports entry not deployed');
   const viewport=await page.evaluate(()=>({documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth}));
   if(viewport.documentWidth>viewport.viewportWidth+4)throw Error(name+': horizontal overflow '+JSON.stringify(viewport));
   if(errors.length)throw Error(name+': JS errors: '+errors.join('; '));
   fs.mkdirSync('rx-bibi-reports/live',{recursive:true});
   await page.screenshot({path:'rx-bibi-reports/live/rx-admin-'+name+'.png',fullPage:true});
   report.checks.push({name,ok:true,http:response.status(),gate:true,anonymousAppHidden:true,noPageErrors:true,viewport});
   await page.close();
  }
  // Visual preview is isolated: render the real HTML/CSS with a mocked client-side
  // authorization adapter. Never authenticate against production or write data.
  const html=await (await fetch(base+'/rx-admin-prototype.html',{signal:AbortSignal.timeout(15000)})).text();
  if(!html.includes('id="rxApp"'))throw Error('Visual preview: RX Admin markup missing');
  const previewHtml=html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/dist\/umd\/supabase\.min\.js"><\/script>/,
   '<script>window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:{id:"rx-visual-preview",is_anonymous:false}},error:null}),getSession:async()=>({data:{session:{access_token:"rx-isolated-preview-token"}},error:null})},rpc:async()=>({data:true,error:null})})};<\/script>');
  if(previewHtml===html)throw Error('Visual preview: Supabase dependency not isolated');
  for(const [name,options] of [['android',{...devices['Pixel 7'],locale:'pl-PL'}],['desktop',{viewport:{width:1365,height:850},locale:'pl-PL'}]]){
   const context=await browser.newContext({...options,recordVideo:{dir:'rx-bibi-reports/video',size:{width:name==='android'?412:1365,height:name==='android'?839:850}}});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   // Give the isolated document a synthetic HTTP origin so relative /api/rx/chat
   // resolves normally; block every network request except our local document.
   await page.route('**/*',route=>route.request().url()==='http://rx.test/'?route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>RX isolated</title>'}):route.abort());
   await page.goto('http://rx.test/');
   await page.setContent(previewHtml,{waitUntil:'domcontentloaded'});
   await page.locator('#rxApp').waitFor({state:'visible',timeout:10000});
   const chat=page.locator('#rxChatCard');
   if(!await chat.isVisible())throw Error(name+': chat not visible in isolated preview');
   const layout=await page.evaluate(()=>{
    const box=id=>{const r=document.getElementById(id)?.getBoundingClientRect();return r?{top:Math.round(r.top),bottom:Math.round(r.bottom),width:Math.round(r.width)}:null};
    return {viewport:{width:innerWidth,height:innerHeight},chat:box('rxChatCard'),input:box('input'),send:document.querySelector('#form button[type="submit"]')?.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth+4};
   });
   if(layout.overflow||!layout.input||!layout.send)throw Error(name+': invalid chat layout '+JSON.stringify(layout));
   const chatFirst=await page.evaluate(()=>{
    const chat=document.getElementById('rxChatCard')?.getBoundingClientRect();
    const secondary=document.querySelector('.section>.card:has(#sub)')?.getBoundingClientRect();
    return {chatTop:chat?.top,secondaryTop:secondary?.top,secondaryHidden:!!secondary&&(secondary.width===0||secondary.height===0),ok:!!chat&&!!secondary&&(secondary.width===0||secondary.height===0||chat.top<secondary.top)};
   });
   report.checks.push({name:'chat-first-'+name,ok:chatFirst.ok,layout:chatFirst});
   if(!chatFirst.ok)throw Error(name+': secondary tools appear above RX chat '+JSON.stringify(chatFirst));

   // Guard the actual rendered action buttons against clipping and overlap.
   const actions=await page.evaluate(()=>{
    const container=document.querySelector('#rxChatCard .rx-actions');
    const parent=container?.getBoundingClientRect();
    const buttons=[...document.querySelectorAll('#rxChatCard .rx-actions button')];
    const rects=buttons.map(b=>{const r=b.getBoundingClientRect();return {id:b.id,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}});
    const hidden=getComputedStyle(container).display==='none';
    const within=!!parent&&rects.length>=4&&(hidden||rects.every(r=>r.width>=44&&r.height>=36&&r.left>=parent.left-2&&r.right<=parent.right+2));
    const overlap=rects.some((a,i)=>rects.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2));
    return {within,overlap:hidden?false:overlap,hidden,buttons:rects};
   });
   report.checks.push({name:'chat-actions-'+name,ok:actions.within&&!actions.overlap,scope:'ISOLATED_MOCK_AUTH_PREVIEW',actions});
   if(!actions.within||actions.overlap)throw Error(name+': chat actions clipped or overlapping '+JSON.stringify(actions));

   fs.mkdirSync('rx-bibi-reports/visual',{recursive:true});
   if(name==='android'){
    // Approximate the reduced viewport when the Android software keyboard opens.
    // This is a layout regression test, not a claim to emulate Samsung's keyboard.
    await page.setViewportSize({width:412,height:520});
    await page.locator('#input').focus();
    await page.locator('#input').scrollIntoViewIfNeeded();
    const keyboardLayout=await page.evaluate(()=>{
     const input=document.getElementById('input').getBoundingClientRect();
     const send=document.querySelector('#form button[type="submit"]').getBoundingClientRect();
     return {height:innerHeight,inputTop:input.top,inputBottom:input.bottom,sendBottom:send.bottom,sendWidth:send.width,documentWidth:document.documentElement.scrollWidth};
    });
    const keyboardActions=await page.evaluate(()=>({
      hidden: [...document.querySelectorAll('#rxChatCard .rx-actions button')].every(b=>{const r=b.getBoundingClientRect();return r.width===0&&r.height===0;}),
      composerVisible: (()=>{const r=document.querySelector('#rxChatCard .composer').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+2;})(),
      keyboardClass:document.body.classList.contains('rx-keyboard-open')
    }));
    const compactOk=keyboardActions.keyboardClass&&keyboardActions.hidden&&keyboardActions.composerVisible;
    report.checks.push({name:'android-keyboard-compact-chat',ok:compactOk,scope:'SIMULATED_RESIZE_NOT_REAL_KEYBOARD',layout:keyboardActions});
    if(!compactOk)throw Error('Android keyboard compact mode regression: '+JSON.stringify(keyboardActions));
    const keyboardOk=keyboardLayout.inputTop>=0&&keyboardLayout.inputBottom<=keyboardLayout.height+2&&keyboardLayout.sendBottom<=keyboardLayout.height+2&&keyboardLayout.sendWidth>=44&&keyboardLayout.documentWidth<=412+4;
    report.checks.push({name:'android-keyboard-reduced-viewport',ok:keyboardOk,scope:'SIMULATED_RESIZE_NOT_REAL_KEYBOARD',layout:keyboardLayout});
    await page.screenshot({path:'rx-bibi-reports/visual/rx-admin-android-keyboard-preview.png',fullPage:true});
    if(!keyboardOk)throw Error('Android reduced viewport hides chat composer: '+JSON.stringify(keyboardLayout));
    await page.setViewportSize({width:412,height:839});
   }
   // Isolated interactive smoke test: type into the real composer without submitting to production.
   const sample='RX BIBI TEST — wiadomość próbna (bez wysyłania)';
   await page.locator('#input').fill(sample);
   const typed=await page.locator('#input').inputValue();
   const sendVisible=await page.locator('#form button[type="submit"]').isVisible();
   const writingOk=typed===sample&&sendVisible;
   report.checks.push({name:'chat-typing-'+name,ok:writingOk,scope:'ISOLATED_NO_PRODUCTION_SUBMIT',sendVisible});
   if(!writingOk)throw Error(name+': chat typing failed');
   await page.locator('#input').fill('');
   // Exercise the real form submit handler with a harmless greeting. Stub only the
   // chat endpoint in the isolated preview; never send requests to production.
   const turns=[
    {question:'Cześć RX',answer:'RX BIBI: odpowiedź testowa 1'},
    {question:'Jak działa nasz tester?',answer:'RX BIBI: odpowiedź testowa 2'},
    {question:'Podsumuj rozmowę',answer:'RX BIBI: odpowiedź testowa 3'},
    {question:'Dlaczego niebo jest niebieskie?',answer:'RX BIBI: odpowiedź testowa 4'},
    {question:'Co mozesz zrobic z moim projketem?',answer:'RX BIBI: odpowiedź testowa 5'},
    {question:'Hej Królowo, jak działają testy i co z Mrówkami?',answer:'RX BIBI: odpowiedź testowa 6'}
   ];
   const received=[];
   await page.route('**/api/rx/chat',async route=>{
    const body=route.request().postDataJSON();
    const turn=turns[received.length];
    if(!turn||body?.message!==turn.question)throw Error('Unexpected synthetic chat turn: '+JSON.stringify(body));
    received.push({message:body.message,history:Array.isArray(body.history)?body.history:[]});
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({engine:'rx-bibi-synthetic',answer:turn.answer})});
   });
   const chatLatenciesMs=[];
   for(const [index,turn] of turns.entries()){
    const started=Date.now();
    await page.locator('#input').fill(turn.question);
    await page.locator('#form button[type="submit"]').click();
    await page.locator('#messages').getByText(turn.answer,{exact:false}).waitFor({timeout:8000});
    chatLatenciesMs.push(Date.now()-started);
    if(await page.locator('#input').inputValue()!=='')throw Error(name+': input not cleared at turn '+index);
   }
   const historyOk=received.length===turns.length&&received.every((turn,index)=>index===0||turn.history.some(h=>String(h).includes(turns[index-1].answer)));
   const messagesOk=await page.locator('#messages').getByText('RX BIBI: odpowiedź testowa').count()>=turns.length;
   const conversationOk=historyOk&&messagesOk;
   report.checks.push({name:'chat-multiturn-'+name,ok:conversationOk,scope:'ISOLATED_STUBBED_API_NO_PRODUCTION_REQUEST',turns:received.length,historyOk,messagesOk});
   if(!conversationOk)throw Error(name+': synthetic multi-turn history or messages failed');
   const maxChatLatencyMs=Math.max(...chatLatenciesMs);
   const latencyOk=chatLatenciesMs.length===turns.length&&maxChatLatencyMs<8000;
   report.checks.push({name:'chat-response-latency-'+name,ok:latencyOk,scope:'ISOLATED_STUBBED_API_NOT_REAL_SERVER_LATENCY',latenciesMs:chatLatenciesMs,maxMs:maxChatLatencyMs});
   if(!latencyOk)throw Error(name+': chat response too slow '+JSON.stringify(chatLatenciesMs));


   // Fault-injection checks: verify the real UI reports server errors and timeouts.
   // No production endpoint is contacted; requests stay in the isolated preview.
   await page.unroute('**/api/rx/chat');
   await page.route('**/api/rx/chat',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'RX BIBI test 503'})}));
   await page.locator('#input').fill('Cześć, sprawdź błąd serwera');
   await page.locator('#form button[type="submit"]').click();
   await page.locator('#messages').getByText('RX BIBI test 503',{exact:false}).waitFor({timeout:8000});
   const serverErrorVisible=await page.locator('#messages').getByText('RX BIBI test 503',{exact:false}).count()>0;
   report.checks.push({name:'chat-server-error-'+name,ok:serverErrorVisible,scope:'ISOLATED_FAULT_INJECTION_503'});
   if(!serverErrorVisible)throw Error(name+': server error was not shown');
   await page.unroute('**/api/rx/chat');
   await page.route('**/api/rx/chat',route=>route.abort('timedout'));
   await page.locator('#input').fill('Cześć, sprawdź niedostępny serwer');
   await page.locator('#form button[type="submit"]').click();
   await page.locator('#messages').getByText('Czat serwerowy jest niedostępny',{exact:false}).last().waitFor({timeout:8000});
   const unavailableVisible=await page.locator('#messages').getByText('Czat serwerowy jest niedostępny',{exact:false}).count()>0;
   report.checks.push({name:'chat-network-timeout-'+name,ok:unavailableVisible,scope:'ISOLATED_FAULT_INJECTION_NETWORK_TIMEOUT'});
   if(!unavailableVisible)throw Error(name+': network timeout was not shown');

   // Recovery: after an error the composer and action buttons must remain usable.
   await page.unroute('**/api/rx/chat');
   await page.route('**/api/rx/chat',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({engine:'rx-bibi-recovery',answer:'RX BIBI: połączenie przywrócone'})}));
   await page.locator('#input').fill('Cześć RX, sprawdź powrót po awarii');
   await page.locator('#form button[type="submit"]').click();
   await page.locator('#messages').getByText('RX BIBI: połączenie przywrócone',{exact:false}).last().waitFor({timeout:8000});
   const recovery=await page.evaluate(()=>{
    const input=document.querySelector('#input');
    const send=document.querySelector('#form button[type="submit"]');
    const buttons=[...document.querySelectorAll('#rxChatCard .rx-actions button')];
    const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>=40&&r.height>=30&&r.left>=0&&r.right<=innerWidth+2&&r.bottom<=document.documentElement.scrollHeight+2};
    return {inputVisible:visible(input),sendVisible:visible(send),actionsVisible:buttons.length>=4&&(getComputedStyle(document.querySelector('#rxChatCard .rx-actions')).display==='none'||buttons.every(visible)),inputCleared:input?.value===''};
   });
   const recoveryOk=Object.values(recovery).every(Boolean);
   report.checks.push({name:'chat-recovery-after-error-'+name,ok:recoveryOk,scope:'ISOLATED_STUBBED_API',recovery});
   if(!recoveryOk)throw Error(name+': chat composer/actions did not recover '+JSON.stringify(recovery));



   // The composer is a textarea: Enter inserts a newline, while the Send
   // button submits. Do not assume input-style Enter submission.
   const multiline='RX BIBI: pierwsza linia';
   await page.locator('#input').fill(multiline);
   await page.locator('#input').press('Enter');
   const newlineValue=await page.locator('#input').inputValue();
   const multilineOk=newlineValue.startsWith(multiline)&&newlineValue.includes('\n');
   report.checks.push({name:'chat-textarea-enter-newline-'+name,ok:multilineOk,scope:'ISOLATED_NO_PRODUCTION_SUBMIT'});
   if(!multilineOk)throw Error(name+': Enter did not insert newline into chat textarea');
   await page.locator('#input').fill('');

   await page.screenshot({path:'rx-bibi-reports/visual/rx-admin-'+name+'-preview.png',fullPage:true});
   report.checks.push({name:'visual-'+name,ok:errors.length===0,scope:'ISOLATED_MOCK_AUTH_PREVIEW',layout,errors});
   if(errors.length)throw Error(name+': visual preview JS: '+errors.join('; '));
   await page.close();
   await context.close(); // flush Playwright video into the existing report artifact
  }
  report.ok=true;
  console.log('PASS RX BIBI LIVE PANEL',JSON.stringify(report));
 }catch(error){report.ok=false;report.error=error.message;console.error('FAIL RX BIBI LIVE PANEL',error.message);process.exitCode=1}
 finally{fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-live-panel.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
})();
