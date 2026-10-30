'use strict';
// Real customer chat smoke test. Uses only dedicated test-account secrets; no mock API.
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\/$/,'');
const email=process.env.RX_BIBI_TEST_EMAIL;
const password=process.env.RX_BIBI_TEST_PASSWORD;
(async()=>{
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 const report={kind:'rx-client-auth-e2e',mode:'REAL_AUTH_REAL_API',checks:[]};
 if(!email||!password){report.status='BLOCKED_MISSING_TEST_CREDENTIALS';report.clientChatVerified=false;report.reason='Dedicated test-account credentials required; mock and anonymous checks do not prove authenticated chat behavior.';fs.writeFileSync('rx-bibi-reports/rx-client-auth-e2e.json',JSON.stringify(report,null,2));console.log('BLOCKED RX client authenticated E2E: dedicated credentials unavailable; NOT VERIFIED');return;}
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
  // Real multi-turn regression: check the actual authenticated API, not just HTTP 200.
  const scenarios=[
   {input:'Porozmawiajmy o mrówkach',expected:/mrówk/i},
   {input:'Dalej',expected:/mrówk|mrów/i},
   {input:'Zmieńmy temat',forbidden:/kontynuujemy temat:.*mrów/i},
   {input:'Porozmawiajmy o pamięci',expected:/pamięc|pamięci/i},
   {input:'Dalej',expected:/pamięc|pamięci/i}
  ];
  report.turns=[];
  for(const [index,scenario] of scenarios.entries()){
   const started=Date.now();
   const api=page.waitForResponse(r=>r.url().includes('/api/rx/client/chat')&&r.request().method()==='POST',{timeout:30000});
   await page.locator('#message').fill(scenario.input);
   await page.locator('#send').click();
   const reply=await api;
   const data=await reply.json().catch(()=>({}));
   const answer=typeof data.answer==='string'?data.answer:'';
   const latencyMs=Date.now()-started;
   const generic=/Co dziś najbardziej chcesz ulepszyć w VEXORIO/i.test(answer);
   const passed=reply.status()===200&&!!answer.trim()&&!generic&&(!scenario.expected||scenario.expected.test(answer))&&(!scenario.forbidden||!scenario.forbidden.test(answer));
   report.turns.push({turn:index+1,input:scenario.input,answer,status:reply.status(),latencyMs,passed});
   if(!passed)throw Error('Real chat dialogue failed at turn '+(index+1)+': '+scenario.input+' (HTTP '+reply.status()+')');
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent==='Gotowe.',null,{timeout:10000});
  }
  report.checks.push('authenticated_customer_chat_real_api_multiturn');
  report.status='PASS';report.clientChatVerified=true;
  console.log('PASS RX client authenticated E2E: '+report.checks.join(', '));
 }catch(e){report.status='FAIL';report.clientChatVerified=false;report.error=e.message;console.error('FAIL RX client authenticated E2E: '+e.message);process.exitCode=1;}
 finally{fs.writeFileSync('rx-bibi-reports/rx-client-auth-e2e.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
