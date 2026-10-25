'use strict';
const {chromium,devices}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-features=MediaRecorder']});
 const page=await browser.newPage({...devices['Pixel 7'],locale:'pl-PL'});
 const base=process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev';
 const results=[];
 const check=(name,ok,detail='')=>{results.push({name,ok,detail});console.log((ok?'PASS ':'FAIL ')+name+' '+detail)};
 try{
  const response=await page.goto(base+'/rx-bibi-studio.html',{waitUntil:'load',timeout:30000});
  check('Studio HTTP 200',response?.status()===200,String(response?.status()));
  const engines=await page.evaluate(()=>({director:typeof window.RXDirector?.plan==='function',motion:typeof window.RXPhotoMotion?.render==='function',formats:window.RXPhotoMotion?.supportedTypes?.()||[]}));
  check('RX AI Director',engines.director);check('RX PhotoMotion',engines.motion);
  check('Sterowanie kamera',await page.locator('#motion option').count()===3);
  check('Przejscia',await page.locator('#transition option').count()===2);
  await page.locator('#kind').selectOption('image-video');
  await page.locator('#prompt').fill('Test RX BIBI PhotoMotion');
  await page.locator('#prepare').click();
  check('Walidacja bez zdjecia',(await page.locator('#status').innerText()).includes('Dodaj'));
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=320;c.height=320;const x=c.getContext('2d');x.fillStyle='#286ab5';x.fillRect(0,0,320,320);return c.toDataURL('image/png').split(',')[1]});
  await page.locator('#photos').setInputFiles({name:'rx-test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.locator('#duration').selectOption('5');
  await page.locator('#prepare').click();
  check('Storyboard',await page.locator('#storyboard').isVisible());
  check('Eksport projektu',await page.locator('#export').isEnabled());
  if(engines.formats.length){
   check('Render button enabled',await page.locator('#render').isEnabled());
   await page.locator('#render').click();
   await page.locator('#videoResult').waitFor({state:'visible',timeout:45000});
   const details=await page.locator('#videoPreview').evaluate(async v=>{await new Promise((resolve,reject)=>{if(v.readyState>=1)return resolve();v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',()=>reject(Error('Video decode error')),{once:true});setTimeout(()=>reject(Error('Video metadata timeout')),15000)});return {duration:v.duration,src:!!v.currentSrc}});
   check('Playable recording',details.src&&Number.isFinite(details.duration)&&details.duration>0,JSON.stringify(details));
   check('Download link',Boolean(await page.locator('#videoDownload').getAttribute('href')));
  }else{check('Graceful unsupported-browser state',await page.locator('#render').isDisabled(),'No MediaRecorder MIME types supported')}
 }catch(error){check('Test execution',false,error.message)}
 finally{require('node:fs').mkdirSync('rx-bibi-reports',{recursive:true});require('node:fs').writeFileSync('rx-bibi-reports/studio-report.json',JSON.stringify(results,null,2));await browser.close()}
 if(results.some(x=>!x.ok))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
