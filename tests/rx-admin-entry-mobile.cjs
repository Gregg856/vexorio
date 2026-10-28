'use strict';
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\/$/,'');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const result={base,checks:[],authenticatedAdminFlow:'NOT_TESTED_NO_ADMIN_SESSION'};
 try{
  const page=await browser.newPage({...devices['Pixel 7'],locale:'pl-PL'});
  const response=await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw Error('Portal home HTTP '+response?.status());
  const info=await page.evaluate(()=>{
   const btn=document.getElementById('accountAdminLaunch');
   const panel=document.getElementById('adminDashboardDialog');
   return {button:!!btn,panel:!!panel,buttonText:btn?.textContent||'',buttonHidden:btn?.classList.contains('hide')||false,href:btn?.getAttribute('href')||null};
  });
  if(!info.button||!info.panel)throw Error('Missing VEXORIO admin button/dashboard');
  if(!/Panel administratora/.test(info.buttonText))throw Error('Wrong admin button label');
  if(!info.buttonHidden)throw Error('Admin button visible without verified session');
  if(info.href)throw Error('Admin button unexpectedly navigates to '+info.href);
  result.checks.push({name:'anonymous_admin_entry',ok:true,info});
  const source=await page.locator('script:not([src])').allTextContents();
  const handler=source.find(s=>s.includes("$('accountAdminLaunch').onclick"));
  if(!handler||!handler.includes("sb.rpc('is_vexorio_admin')")||!handler.includes("show('adminDashboardDialog')"))throw Error('Admin authorization/target handler not found');
  result.checks.push({name:'admin_handler_source',ok:true});
  const html=await page.content();
  if(!html.includes('adminDashboardDialog'))throw Error('Admin dashboard missing in rendered HTML');
  result.checks.push({name:'admin_dashboard_present',ok:true});
  console.log('PASS RX ADMIN ENTRY',JSON.stringify(result));
 }catch(e){result.error=e.message;throw e}
 finally{fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-admin-entry.json',JSON.stringify(result,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
