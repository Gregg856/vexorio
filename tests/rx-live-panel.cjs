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
  for(const [name,contextOptions] of [['mobile',{...devices['Pixel 7'],locale:'pl-PL'}],['desktop',{viewport:{width:1365,height:850},locale:'pl-PL'}]]){
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
   '<script>window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:{id:"rx-visual-preview",is_anonymous:false}},error:null})},rpc:async()=>({data:true,error:null})})};<\/script>');
  if(previewHtml===html)throw Error('Visual preview: Supabase dependency not isolated');
  for(const [name,options] of [['android',{...devices['Pixel 7'],locale:'pl-PL'}],['desktop',{viewport:{width:1365,height:850},locale:'pl-PL'}]]){
   const page=await browser.newPage(options);
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>route.abort());
   await page.goto('about:blank');
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
    return {chatTop:chat?.top,secondaryTop:secondary?.top,ok:!!chat&&!!secondary&&chat.top<secondary.top};
   });
   report.checks.push({name:'chat-first-'+name,ok:chatFirst.ok,layout:chatFirst});
   if(!chatFirst.ok)throw Error(name+': secondary tools appear above RX chat '+JSON.stringify(chatFirst));

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
    const keyboardOk=keyboardLayout.inputTop>=0&&keyboardLayout.inputBottom<=keyboardLayout.height+2&&keyboardLayout.sendBottom<=keyboardLayout.height+2&&keyboardLayout.sendWidth>=44&&keyboardLayout.documentWidth<=412+4;
    report.checks.push({name:'android-keyboard-reduced-viewport',ok:keyboardOk,scope:'SIMULATED_RESIZE_NOT_REAL_KEYBOARD',layout:keyboardLayout});
    await page.screenshot({path:'rx-bibi-reports/visual/rx-admin-android-keyboard-preview.png',fullPage:true});
    if(!keyboardOk)throw Error('Android reduced viewport hides chat composer: '+JSON.stringify(keyboardLayout));
    await page.setViewportSize({width:412,height:839});
   }
   await page.screenshot({path:'rx-bibi-reports/visual/rx-admin-'+name+'-preview.png',fullPage:true});
   report.checks.push({name:'visual-'+name,ok:errors.length===0,scope:'ISOLATED_MOCK_AUTH_PREVIEW',layout,errors});
   if(errors.length)throw Error(name+': visual preview JS: '+errors.join('; '));
   await page.close();
  }
  report.ok=true;
  console.log('PASS RX BIBI LIVE PANEL',JSON.stringify(report));
 }catch(error){report.ok=false;report.error=error.message;console.error('FAIL RX BIBI LIVE PANEL',error.message);process.exitCode=1}
 finally{fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-live-panel.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
})();
