'use strict';
// Read-only real mobile Chromium navigation checks for RX and VEXORIO.
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\/$/,'');
const dir='rx-bibi-reports';
fs.mkdirSync(dir,{recursive:true});
const checks=[];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({...devices['Pixel 7'],locale:'pl-PL'});
  page.setDefaultTimeout(15000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const go=async pathname=>{
   const response=await page.goto(base+pathname,{waitUntil:'domcontentloaded',timeout:30000});
   if(!response||!response.ok())throw Error('HTTP error at '+pathname+': '+response?.status());
  };
  const expectPath=async expected=>{
   const canonical=p=>p.replace(/\.html$/,'').replace(/\/$/,'')||'/';
   await page.waitForURL(url=>canonical(url.pathname)===canonical(expected),{timeout:15000,waitUntil:'commit'});
   checks.push({path:expected,actual:new URL(page.url()).pathname,ok:true});
  };
  await go('/rx-center.html');
  await page.getByRole('link',{name:/Otwórz Strażaka/i}).click();
  await expectPath('/guard-lab.html');
  await page.getByRole('link',{name:/← VEXORIO/i}).first().click();
  await expectPath('/');
  if(!/VEXORIO/i.test(await page.title()))throw Error('Portal home title missing');
  await go('/rx-center.html');
  await page.getByRole('link',{name:/← VEXORIO/i}).click();
  await expectPath('/');
  await go('/rx-center.html');
  await page.getByRole('link',{name:/Otwórz Strażaka/i}).click();
  await expectPath('/guard-lab.html');
  await page.goBack({waitUntil:'domcontentloaded'});
  await expectPath('/rx-center');
  await page.goBack({waitUntil:'domcontentloaded'});
  await expectPath('/');
  if(errors.length)throw Error('Browser JS errors: '+errors.join('; '));
  console.log('PASS RX MOBILE NAVIGATION',checks);
 }catch(error){
  fs.writeFileSync(path.join(dir,'rx-navigation.json'),JSON.stringify({ok:false,checks,error:error.message,base},null,2));
  throw error;
 }finally{await browser.close();}
 fs.writeFileSync(path.join(dir,'rx-navigation.json'),JSON.stringify({ok:true,checks,base},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
