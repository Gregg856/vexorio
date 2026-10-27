'use strict';
// RX program center: real Chromium DOM + mocked read-only status, no production writes.
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const checks=[];
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://rx-test.invalid/',route=>route.fulfill({status:200,contentType:'text/html',body:'<div id="rxProgramsList"></div>'}));
  await page.goto('https://rx-test.invalid/');
  await page.route('https://rx-test.invalid/api/rx/direct?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,runs:[{name:'RX BIBI Tester — mobile browser',number:42,status:'completed',result:'success',link:'https://github.com/Gregg856/vexorio/actions/runs/42'},{name:'VEXORIO checks',number:43,status:'completed',result:'failure'}]})}));
  await page.addScriptTag({path:'guard-rx-programs.js'});
  await page.locator('#rxProgramsLiveRuns p').first().waitFor();
  const links=await page.locator('#rxProgramsList a').count();
  if(links<15)throw Error('Expected program links');
  checks.push('program_cards');
  const text=await page.locator('#rxProgramsLiveRuns').innerText();
  if(!text.includes('Test OK')||!text.includes('Błąd'))throw Error('Missing live statuses: '+text);
  checks.push('live_status_labels');
  if(!await page.locator('#rxProgramsLiveRuns a[href="https://github.com/Gregg856/vexorio/actions/runs/42"]').count())throw Error('Missing report link');
  checks.push('report_link');
  await page.getByRole('button',{name:'↻ Odśwież statusy'}).click();
  await page.waitForFunction(()=>!document.querySelector('#rxProgramsList button').disabled);
  if(await page.locator('#rxProgramsLiveRuns p').count()!==2)throw Error('Refresh duplicated status rows');
  checks.push('manual_refresh_no_duplicates');
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  checks.push('no_page_errors');
 }finally{await browser.close();}
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-programs-browser.json',JSON.stringify({schema:1,kind:'rx-programs-browser',ok:true,checks,scope:'isolated-chromium-dom-mocked-status',productionTouched:false},null,2)+'\n');
 console.log('PASS RX PROGRAMS BROWSER:',checks.join(', '));
})().catch(e=>{console.error(e);process.exitCode=1;});
