'use strict';
// RX BIBI Browser Agent 1.0 — read-only public-page exploration.
// No login, no cookies from user sessions, no form submission or production writes.
const {chromium,devices}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const base=(process.env.RX_BIBI_URL||'https://vexorio.grzegorzbub1985.workers.dev').replace(/\/$/,'');
const allowed=new Set(['/rx-admin-prototype','/rx-bibi-manager.html']);
const output='rx-bibi-reports/browser-agent';
fs.mkdirSync(output,{recursive:true});
const report={agent:'RX BIBI Browser Agent 1.0',mode:'PUBLIC_READ_ONLY',base,checks:[],limitations:['No authenticated Queen session','No autonomous code edits','Screenshots are evidence, not AI image understanding']};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [name,device] of [['android',devices['Pixel 7']],['desktop',{viewport:{width:1365,height:850}}]]){
   const context=await browser.newContext({...device,locale:'pl-PL',recordVideo:{dir:output,size:name==='android'?{width:412,height:839}:{width:1365,height:850}}});
   const page=await context.newPage();
   const issues=[];
   page.on('pageerror',e=>issues.push({type:'javascript',detail:e.message.slice(0,300)}));
   page.on('response',r=>{if(r.status()>=500)issues.push({type:'server',status:r.status(),path:new URL(r.url()).pathname});});
   for(const target of allowed){
    const url=base+target;
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(350);
    const metrics=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,title:document.title,buttons:document.querySelectorAll('button').length}));
    const ok=!!response?.ok()&&metrics.documentWidth<=metrics.viewport+4;
    const slug=target.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
    await page.screenshot({path:path.join(output,name+'-'+slug+'.png'),fullPage:true});
    report.checks.push({device:name,path:target,http:response?.status()??null,ok,metrics});
    if(!ok)issues.push({type:'layout_or_http',path:target,http:response?.status(),metrics});
   }
   report.checks.push({device:name,kind:'browser_diagnostics',ok:issues.length===0,issues});
   await context.close();
  }
  report.ok=report.checks.every(x=>x.ok);
  if(!report.ok)process.exitCode=1;
 }catch(e){report.ok=false;report.error=e.message;process.exitCode=1}
 finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();console.log((report.ok?'PASS':'FAIL')+' RX BIBI BROWSER AGENT',JSON.stringify({ok:report.ok,checks:report.checks.length,error:report.error}));}
})().catch(e=>{console.error(e);process.exitCode=1});
