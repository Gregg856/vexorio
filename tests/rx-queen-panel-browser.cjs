'use strict';
// RX QUEEN BROWSER: actual DOM interactions in Chromium, no production writes.
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const checks=[];
 try{
  const page=await browser.newPage();
  await page.setContent('<input id="rxQueenLearned"><input id="rxQueenMemory"><textarea id="rxQueenSnapshot"></textarea><input id="rxQueenCell"><input id="rxQueenCode"><button id="rxQueenCompare">Porównaj</button><div id="rxQueenResult"></div><input id="rxQueenTask"><button id="rxQueenTaskAnalyze">Analizuj</button><button id="rxQueenTaskApprove" disabled>Zatwierdź</button><div id="rxQueenTaskResult"></div>');
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addScriptTag({path:'guard-rx-queen-panel.js'});
  await page.locator('#rxQueenCompare').click();
  if(!await page.locator('#rxQueenResult').textContent().then(x=>x.includes('NIEZNANY BŁĄD')))throw Error('Empty comparison not handled');
  checks.push('empty_comparison');
  await page.locator('#rxQueenLearned').fill('fix_1');
  await page.locator('#rxQueenMemory').fill('fix_1');
  await page.locator('#rxQueenCompare').click();
  if(!await page.locator('#rxQueenResult').textContent().then(x=>x.includes('ZGODNOŚĆ')))throw Error('Matching fixes not detected');
  checks.push('matching_fixes');
  await page.locator('#rxQueenTask').fill('Sprawdź błąd panelu');
  await page.locator('#rxQueenTaskAnalyze').click();
  if(await page.locator('#rxQueenTaskApprove').isDisabled())throw Error('Task approval not enabled');
  await page.locator('#rxQueenTask').fill('Zmienione zadanie');
  if(!await page.locator('#rxQueenTaskApprove').isDisabled())throw Error('Stale approval not revoked');
  checks.push('task_approval_reset');
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  checks.push('no_page_errors');
 }finally{await browser.close();}
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-queen-panel-browser.json',JSON.stringify({schema:1,kind:'rx-queen-panel-browser',ok:true,checks,scope:'isolated-chromium-dom',productionTouched:false},null,2)+'\n');
 fs.writeFileSync('rx-bibi-reports/rx-queen-panel-check.json',JSON.stringify({schema:1,kind:'rx-queen-panel-check',ok:true,checks,scope:'isolated-chromium-dom',productionTouched:false},null,2)+'\n');
 console.log('PASS RX QUEEN BROWSER:',checks.join(', '));
})().catch(e=>{console.error(e);process.exitCode=1;});
