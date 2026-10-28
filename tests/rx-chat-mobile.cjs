'use strict';
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\/$/,'');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const result={base,checks:[],authenticatedChat:'NOT_TESTED_NO_ADMIN_SESSION'};
 try{
  const page=await browser.newPage({...devices['Pixel 7'],locale:'pl-PL'});
  const response=await page.goto(base+'/rx-admin-prototype',{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw Error('RX admin page HTTP '+response?.status());
  const html=await page.content();
  if(!html.includes('id="input"')||!html.includes('maxlength="8000"'))throw Error('RX chat composer not deployed');
  result.checks.push({name:'mobile_composer_8000',ok:true});
  if(!html.includes("rxServerChatHistory.slice(-20)")||!html.includes("rxServerChatHistory.length>20"))throw Error('RX history limit not deployed');
  result.checks.push({name:'history_20',ok:true});
  if(!html.includes("else answerServerBrainChat(q)")||!html.includes("fetch('/api/rx/chat'"))throw Error('RX chat planner routing not deployed');
  result.checks.push({name:'freeform_routes_to_server',ok:true});
  const locked=await page.locator('#rxGate').isVisible();
  if(!locked)throw Error('Anonymous user bypassed RX access gate');
  result.checks.push({name:'anonymous_access_gate',ok:true});
  console.log('PASS RX BIBI CHAT MOBILE',JSON.stringify(result));
 }catch(e){result.error=e.message;throw e}
 finally{fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-chat-mobile.json',JSON.stringify(result,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
