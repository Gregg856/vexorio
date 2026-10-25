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
  check('Pole napisu w edytorze',await page.locator('#caption').count()===1);
  check('Pozycje napisu',JSON.stringify(await page.locator('#captionPosition option').evaluateAll(els=>els.map(x=>x.value)))===JSON.stringify(['bottom','center','top']));
  check('Pozycja domyslna',await page.locator('#captionPosition').inputValue()==='bottom');
  await page.locator('#captionPosition').selectOption('top');
  check('Wybor gory',await page.locator('#captionPosition').inputValue()==='top');
  await page.locator('#captionPosition').selectOption('center');
  check('Wybor srodka',await page.locator('#captionPosition').inputValue()==='center');
  await page.locator('#captionPosition').selectOption('bottom');
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
   // Render a captioned clip and verify that the caption pixels are part of the video frame.
   await page.locator('#caption').fill('RX NAPIS TEST');
   const beforeCaption=await page.locator('#videoDownload').getAttribute('href');
   await page.locator('#render').click();
   await page.waitForFunction(old=>{const a=document.getElementById('videoDownload');return !!a?.getAttribute('href')&&a.getAttribute('href')!==old},beforeCaption,{timeout:45000});
   const captionPixels=await page.locator('#videoPreview').evaluate(async v=>{
     v.load();await new Promise((resolve,reject)=>{v.addEventListener('loadeddata',resolve,{once:true});v.addEventListener('error',()=>reject(Error('caption video decode failed')),{once:true});setTimeout(()=>reject(Error('caption decode timeout')),15000)});
     v.currentTime=Math.min(1,Math.max(0,v.duration/2));
     await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});setTimeout(resolve,3000)});
     const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d');x.drawImage(v,0,0);
     const y=Math.round(c.height*.88),data=x.getImageData(0,y,c.width,Math.max(1,Math.round(c.height*.08))).data;
     let bright=0;for(let i=0;i<data.length;i+=4)if(data[i]>190&&data[i+1]>190&&data[i+2]>190)bright++;
     return {bright,width:c.width,height:c.height};
   });
   check('Napis wypalony w filmie',captionPixels.bright>40,JSON.stringify(captionPixels));
   await page.locator('#caption').fill('');
   // A second, shorter transition test with two different frames.
   const green=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=320;c.height=320;const x=c.getContext('2d');x.fillStyle='#29b46c';x.fillRect(0,0,320,320);return c.toDataURL('image/png').split(',')[1]});
   await page.locator('#photos').setInputFiles([
    {name:'rx-blue.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},
    {name:'rx-green.png',mimeType:'image/png',buffer:Buffer.from(green,'base64')}
   ]);
   await page.locator('#motion').selectOption('pan');
   await page.locator('#transition').selectOption('fade');
   await page.locator('#duration').selectOption('5');
   await page.locator('#prepare').click();
   const beforeFade=await page.locator('#videoDownload').getAttribute('href');
   await page.locator('#render').click();
   await page.waitForFunction(old=>{const a=document.getElementById('videoDownload');return !!a?.href&&a.getAttribute('href')!==old},beforeFade,{timeout:45000});
   await page.locator('#render').waitFor({state:'visible'});
   await page.waitForFunction(()=>!document.getElementById('render').disabled);
   check('Dwa zdjecia i fade',await page.locator('#videoDownload').getAttribute('href')!==beforeFade);
   // Verify 30-second storyboard, but do not encode 30 seconds on every daily run.
   await page.locator('#duration').selectOption('30');
   await page.locator('#prepare').click();
   const plan=await page.evaluate(()=>window.RXDirector.plan({prompt:'Test 30 sekund',type:'image-video',aspect_ratio:'9:16',duration_seconds:30,input_files:[{name:'a.png'},{name:'b.png'}]}));
   check('Plan 30 sekund',plan&&Array.isArray(plan.scenes)&&Math.abs(plan.scenes.reduce((a,x)=>a+x.duration_seconds,0)-30)<0.01);
   const previousHref=await page.locator('#videoDownload').getAttribute('href');
   await page.locator('#render').click();
   await page.waitForFunction(oldHref=>{const el=document.getElementById('videoDownload');const href=el?.getAttribute('href');return !!href&&href!==oldHref},previousHref,{timeout:75000});
   const full=await page.locator('#videoPreview').evaluate(async v=>{
     // A new blob URL may be assigned while readyState still reflects the old 5s clip.
     // Explicitly reload the new source before reading its metadata.
     v.load();
     await new Promise((resolve,reject)=>{
       if(v.readyState>=1&&v.currentSrc===v.src)return resolve();
       v.addEventListener('loadedmetadata',resolve,{once:true});
       v.addEventListener('error',()=>reject(Error('30s video decode error')),{once:true});
       setTimeout(()=>reject(Error('30s metadata timeout')),15000);
     });
     return {duration:v.duration,src:!!v.currentSrc};
   });
   check('Film 30 sekund — odtwarzalny',full.src&&Number.isFinite(full.duration)&&full.duration>=28&&full.duration<=32,JSON.stringify(full));

  }else{check('Graceful unsupported-browser state',await page.locator('#render').isDisabled(),'No MediaRecorder MIME types supported')}
 }catch(error){check('Test execution',false,error.message)}
 finally{require('node:fs').mkdirSync('rx-bibi-reports',{recursive:true});require('node:fs').writeFileSync('rx-bibi-reports/studio-report.json',JSON.stringify(results,null,2));await browser.close()}
 if(results.some(x=>!x.ok))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
