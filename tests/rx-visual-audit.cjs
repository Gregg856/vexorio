'use strict';
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\/$/,'');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={kind:'rx-bibi-visual-fixture',base,mode:'ISOLATED_VISUAL_ONLY_NO_ADMIN_SESSION',checks:[]};
 try{
  const page=await browser.newPage({...devices['Pixel 7'],locale:'pl-PL'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+'/rx-admin-prototype',{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw Error('RX admin page HTTP '+response?.status());
  fs.mkdirSync('rx-bibi-reports/visual',{recursive:true});
  await page.screenshot({path:'rx-bibi-reports/visual/rx-access-gate.png',fullPage:true});
  // Visual-only DOM fixture. Never simulate or claim real authentication.
  await page.evaluate(()=>{document.getElementById('rxGate').hidden=true;document.getElementById('rxApp').hidden=false;});
  const labels=['Czat RX','Królowa','Mrówki','RX AI','Komputer i chmura','COSMOS','MEDUSA','Raporty','Ustawienia'];
  for(let i=0;i<labels.length;i++){
   const btn=page.locator('#menu button').nth(i);
   await btn.click();
   const actual=await page.locator('#heading').innerText();
   if(!actual.includes(labels[i]))throw Error('Wrong tab '+labels[i]+': '+actual);
   const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
   if(width.scroll>width.viewport+3)throw Error('Horizontal overflow in '+labels[i]+': '+JSON.stringify(width));
   const slug=['chat','queen','ants','ai','computer','cosmos','medusa','reports','settings'][i];
   await page.screenshot({path:'rx-bibi-reports/visual/rx-'+slug+'.png',fullPage:true});
   report.checks.push({tab:labels[i],ok:true,viewport:width});
  }
  await page.locator('#menu button').first().click();
  const input=page.locator('#input');
  if(await input.getAttribute('maxlength')!=='8000')throw Error('Chat input limit mismatch');
  await input.fill('Sprawdź testy RX i pokaż raport');
  if(!await page.getByRole('button',{name:'Wyślij'}).isVisible())throw Error('Send button hidden');
  await page.screenshot({path:'rx-bibi-reports/visual/rx-chat-typed.png',fullPage:true});
  report.checks.push({name:'chat_composer_visual',ok:true});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS RX BIBI VISUAL',JSON.stringify(report));
 }catch(e){report.error=e.message;throw e}
 finally{fs.writeFileSync('rx-bibi-reports/rx-visual-audit.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
