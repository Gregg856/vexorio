'use strict';
// RX BIBI Browser Agent 1.2 — read-only public-page exploration.
// No login, no cookies from user sessions, no form submission or production writes.
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\/$/,'');
const allowed=new Set(['/rx-admin-prototype','/rx-bibi-manager.html']);
const output='rx-bibi-reports/browser-agent';
fs.mkdirSync(output,{recursive:true});
const report={agent:'RX BIBI Browser Agent 1.2',mode:'PUBLIC_READ_ONLY',base,checks:[],limitations:['No authenticated Queen session','No autonomous code edits','Screenshots are evidence, not AI image understanding']};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [name,device] of [['android',devices['Pixel 7']],['desktop',{viewport:{width:1365,height:850}}]]){
   const context=await browser.newContext({...device,locale:'pl-PL',recordVideo:{dir:output,size:name==='android'?{width:412,height:839}:{width:1365,height:850}}});
   const page=await context.newPage();
   const issues=[];
   page.on('pageerror',e=>issues.push({type:'javascript',detail:e.message.slice(0,300)}));
   page.on('response',r=>{if(r.status()>=500)issues.push({type:'server',status:r.status(),path:new URL(r.url()).pathname});});
   for(const target of allowed){
    const url=base+target;
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(350);
    const metrics=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,title:document.title,buttons:document.querySelectorAll('button').length}));
    const ok=!!response?.ok()&&metrics.documentWidth<=metrics.viewport+4;
    const slug=target.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
    await page.screenshot({path:path.join(output,name+'-'+slug+'.png'),fullPage:true});
    report.checks.push({device:name,path:target,http:response?.status()??null,ok,metrics});
    if(!ok)issues.push({type:'layout_or_http',path:target,http:response?.status(),metrics});
   }
   // Isolated interactive scenario: no request is sent to the production server.
   // Playwright clicks, types and checks DOM reactions in a synthetic document.
   await page.route('http://rx-agent.test/**',route=>route.fulfill({status:200,contentType:'text/html',body:`<!doctype html><html lang="pl"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RX isolated test</title><main><h1>RX BIBI Test</h1><label for="task">Zadanie</label><input id="task" autocomplete="off"><button id="run" type="button">Sprawdź</button><output id="result" aria-live="polite"></output></main><script>document.querySelector('#run').addEventListener('click',()=>{document.querySelector('#result').textContent='RX OK: '+document.querySelector('#task').value})<\/script></html>`}));
   await page.goto('http://rx-agent.test/test',{waitUntil:'domcontentloaded'});
   await page.locator('#task').fill('Kontrola RX');
   await page.locator('#run').click();
   const answer=await page.locator('#result').innerText();
   const interactiveOk=answer==='RX OK: Kontrola RX';
   await page.screenshot({path:path.join(output,name+'-interactive-isolated.png'),fullPage:true});
   report.checks.push({device:name,kind:'isolated_click_type_verify',ok:interactiveOk,scope:'SYNTHETIC_DOCUMENT_NO_PRODUCTION_WRITES',result:answer});
   if(!interactiveOk)issues.push({type:'isolated_interaction',detail:answer});
   // Exercise actual RX Admin markup and styles, isolated from all production APIs.
   // No authenticated session is created; we reveal the UI only in a synthetic preview.
   const adminHtml=await (await fetch(base+'/rx-admin-prototype.html',{signal:AbortSignal.timeout(15000)})).text();
   await page.route('http://rx-preview.test/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>RX preview</title>'}));
   await page.route('**/*',route=>{
    if(route.request().url().startsWith('http://rx-preview.test/'))return route.continue();
    return route.abort();
   });
   await page.goto('http://rx-preview.test/');
   await page.setContent(adminHtml,{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{const gate=document.querySelector('#rxGate'),app=document.querySelector('#rxApp');if(gate)gate.hidden=true;if(app)app.hidden=false;});
   const input=page.locator('#input');
   const send=page.locator('#form button[type="submit"]');
   const menu=page.locator('#menu button');
   const chatVisible=await input.isVisible()&&await send.isVisible();
   if(chatVisible)await input.fill('RX test bez wysyłania');
   const typed=chatVisible&&(await input.inputValue())==='RX test bez wysyłania';
   const menuCount=await menu.count();
   const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,chat:!!document.querySelector('#rxChatCard'),navigation:!!document.querySelector('#menu')}));
   const realMarkupOk=chatVisible&&typed&&menuCount>=3&&layout.scrollWidth<=layout.width+4;
   report.checks.push({device:name,kind:'rx_admin_real_markup_preview',ok:realMarkupOk,scope:'ISOLATED_DOM_NO_LOGIN_NO_SEND',menuCount,layout});
   await page.screenshot({path:path.join(output,name+'-rx-admin-isolated-preview.png'),fullPage:true});
   if(!realMarkupOk)issues.push({type:'rx_admin_preview',layout,menuCount});
   report.checks.push({device:name,kind:'browser_diagnostics',ok:issues.length===0,issues});
   await context.close();
  }
  report.ok=report.checks.every(x=>x.ok);
  if(!report.ok)process.exitCode=1;
 }catch(e){report.ok=false;report.error=e.message;process.exitCode=1}
 finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();console.log((report.ok?'PASS':'FAIL')+' RX BIBI BROWSER AGENT',JSON.stringify({ok:report.ok,checks:report.checks.length,error:report.error}));}
})().catch(e=>{console.error(e);process.exitCode=1});
