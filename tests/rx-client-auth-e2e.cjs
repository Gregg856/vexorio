'use strict';
// Real customer chat smoke test. Uses only dedicated test-account secrets; no mock API.
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\\/$/,'');
const email=process.env.RX_BIBI_TEST_EMAIL;
const password=process.env.RX_BIBI_TEST_PASSWORD;
(async()=>{
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 const report={kind:'rx-client-auth-e2e',mode:'REAL_AUTH_REAL_API',checks:[]};
 if(!email||!password){report.status='BLOCKED_MISSING_TEST_CREDENTIALS';report.clientChatVerified=false;fs.writeFileSync('rx-bibi-reports/rx-client-auth-e2e.json',JSON.stringify(report,null,2));console.log('BLOCKED RX client authenticated E2E: dedicated credentials unavailable; NOT VERIFIED');return;}
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({...devices['Pixel 7'],locale:'pl-PL'});
  const response=await page.goto(base+'/rx-client',{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw Error('Client panel HTTP '+response?.status());
  await page.locator('#login').waitFor({state:'visible',timeout:20000});
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#signin').click();
  await page.locator('#chat').waitFor({state:'visible',timeout:20000});
  report.checks.push('authenticated_customer_chat_visible');
  const text='Test połączenia RX BIBI — odpowiedz krótko.';
  const api=page.waitForResponse(r=>r.url().includes('/api/rx/client/chat')&&r.request().method()==='POST',{timeout:30000});
  await page.locator('#message').fill(text);
  await page.locator('#send').click();
  const reply=await api;
  if(reply.status()!==200)throw Error('Customer chat HTTP '+reply.status());
  const data=await reply.json();
  if(typeof data.answer!=='string'||!data.answer.trim())throw Error('Empty real chat answer');
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent==='Gotowe.',null,{timeout:10000});
  report.checks.push('authenticated_customer_chat_real_api_answer');
  report.status='PASS';report.clientChatVerified=true;
  console.log('PASS RX client authenticated E2E: '+report.checks.join(', '));
 }catch(e){report.status='FAIL';report.clientChatVerified=false;report.error=e.message;console.error('FAIL RX client authenticated E2E: '+e.message);process.exitCode=1;}
 finally{fs.writeFileSync('rx-bibi-reports/rx-client-auth-e2e.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
