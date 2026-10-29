'use strict';
const { chromium, devices } = require('playwright');
const fs = require('node:fs');
const base = process.env.RX_BIBI_URL || 'https://vexorio.grzegorzbub1985.workers.dev';
(async () => {
 const browser = await chromium.launch({headless:true});
 const results = [];
 try {
  const page = await browser.newPage({...devices['Pixel 7'], locale:'pl-PL'});
  const response = await page.goto(base, {waitUntil:'domcontentloaded',timeout:30000});
  if(!response || response.status()!==200) throw Error('Strona nie odpowiada HTTP 200');
  const picker=page.locator('#lang');
  await picker.waitFor({state:'visible',timeout:15000});
  const options=await picker.locator('option').evaluateAll(xs=>xs.map(x=>x.value));
  for(const lang of ['pl','de','en','uk']){
   if(!options.includes(lang))throw Error('Brak języka '+lang);
   await picker.selectOption(lang);
   await page.waitForTimeout(500);
   const selected=await picker.inputValue();
   const stored=await page.evaluate(()=>localStorage.getItem('vexorio-language'));
   const heading=await page.locator('h1').first().innerText();
   const account=await page.locator('#accountBtn').innerText();
   const ok=selected===lang && stored===lang && !!heading.trim() && !!account.trim();
   results.push({lang,ok,selected,stored,heading:heading.slice(0,120),account:account.slice(0,80)});
   if(!ok)throw Error('Niepoprawny wybór lub zapis języka '+lang);
   await page.reload({waitUntil:'domcontentloaded'});
   if(await picker.inputValue()!==lang)throw Error('Język nie przetrwał odświeżenia: '+lang);
  }
  const headings=results.map(x=>x.heading);
  if(new Set(headings).size<3)throw Error('Nagłówek nie zmienia się między językami');
  console.log('RX BIBI live language audit PASS',JSON.stringify(results));
 } catch(e){console.error('RX BIBI live language audit FAIL:',e.message);process.exitCode=1;}
 finally {fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-live-languages.json',JSON.stringify({base,results,passed:!process.exitCode,checkedAt:new Date().toISOString()},null,2)+'\n');await browser.close();}
})();