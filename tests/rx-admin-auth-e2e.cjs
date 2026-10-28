'use strict';
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\/$/,'');
const email=process.env.RX_BIBI_TEST_EMAIL;
const password=process.env.RX_BIBI_TEST_PASSWORD;
(async()=>{
 const report={kind:'rx-bibi-authenticated-e2e',mode:'DEDICATED_TEST_ADMIN',checks:[]};
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 if(!email||!password){report.status='SKIPPED_MISSING_TEST_CREDENTIALS';fs.writeFileSync('rx-bibi-reports/rx-auth-e2e.json',JSON.stringify(report,null,2));console.log('SKIP RX BIBI authenticated E2E: dedicated test account not configured');return;}
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({...devices['Pixel 7'],locale:'pl-PL'});
  const response=await page.goto(base+'/rx-admin-prototype',{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw Error('RX admin HTTP '+response?.status());
  await page.waitForFunction(()=>!!window.supabase?.createClient,{timeout:15000});
  const auth=await page.evaluate(async({email,password})=>{
   const client=window.supabase.createClient('https://lfytoxcnutduahshbsko.supabase.co','sb_publishable_S58StH3HgvtjT1pRw2X3Ug_HiLNwpDz');
   const {data,error}=await client.auth.signInWithPassword({email,password});
   if(error)return {ok:false,error:error.message};
   const {data:allowed,error:rpcError}=await client.rpc('is_vexorio_admin');
   return {ok:!!data?.user&&allowed===true,error:rpcError?.message||null};
  },{email,password});
  if(!auth.ok)throw Error('Dedicated BIBI admin login/permission failed: '+(auth.error||'not authorized'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#rxApp').waitFor({state:'visible',timeout:20000});
  report.checks.push({name:'real_admin_login_and_panel',ok:true});
  const labels=['Czat RX','Królowa','Mrówki','RX AI','Komputer i chmura','COSMOS','MEDUSA','Raporty','Ustawienia'];
  for(let i=0;i<labels.length;i++){
   await page.locator('#menu button').nth(i).click();
   if(!((await page.locator('#heading').innerText()).includes(labels[i])))throw Error('Wrong category '+labels[i]);
   report.checks.push({name:'category_'+i,ok:true});
  }
  await page.locator('#menu button').first().click();
  await page.locator('#input').fill('Co robimy dalej?');
  await page.getByRole('button',{name:'Wyślij'}).click();
  await page.waitForTimeout(1500);
  const messages=await page.locator('#messages .msg').count();
  if(messages<3)throw Error('Chat did not show user and server response');
  report.checks.push({name:'authenticated_chat_submission',ok:true});
  // RX Queen: real owner-authorized chat diagnostic, never bypass the gate.
  const diagnostic='Diagnostyka Mrówek';
  const apiResponses=[];
  const onResponse=async response=>{
   if(!response.url().includes('/api/rx/chat')||response.request().method()!=='POST')return;
   try{
    const body=await response.json();
    apiResponses.push({httpStatus:response.status(),engine:body?.engine||null,answer:typeof body?.answer==='string'?body.answer:'',error:body?.error||null});
   }catch{apiResponses.push({httpStatus:response.status(),parseError:true});}
  };
  page.on('response',onResponse);
  await page.locator('#input').fill(diagnostic);
  await page.getByRole('button',{name:'Wyślij'}).click();
  await page.waitForTimeout(2500);
  page.off('response',onResponse);
  const diagnosticResponse=apiResponses.find(x=>x.engine==='rx-queen-ant-ci-triage'||x.engine==='rx-queen-ant-job-report'||x.answer.includes('Mrów'))||apiResponses.at(-1);
  if(!diagnosticResponse)throw Error('Queen diagnostic: no /api/rx/chat response');
  report.queenDiagnostic={httpStatus:diagnosticResponse.httpStatus,engine:diagnosticResponse.engine,answerReceived:!!diagnosticResponse.answer,authorizationDenied:[401,403].includes(diagnosticResponse.httpStatus)};
  if(diagnosticResponse.httpStatus!==200||!diagnosticResponse.answer)throw Error('Queen diagnostic not available: HTTP '+diagnosticResponse.httpStatus+'; engine '+diagnosticResponse.engine);
  report.checks.push({name:'authenticated_queen_ant_diagnostic',ok:true});
  report.status='PASS';
  // Screenshots are deliberately omitted in authenticated mode to avoid exposing private admin data.
  console.log('PASS RX BIBI authenticated admin E2E',report.checks.length);
 }catch(e){report.status='FAIL';report.error=e.message;throw e}
 finally{fs.writeFileSync('rx-bibi-reports/rx-auth-e2e.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
