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
  report.ok=true;
  console.log('PASS RX BIBI LIVE PANEL',JSON.stringify(report));
 }catch(error){report.ok=false;report.error=error.message;console.error('FAIL RX BIBI LIVE PANEL',error.message);process.exitCode=1}
 finally{fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-live-panel.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
})();
