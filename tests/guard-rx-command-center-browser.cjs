'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');
const html=fs.readFileSync('guard-lab.html','utf8');
const script=fs.readFileSync('guard-rx-live-command-center.js','utf8');
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/guard-rx-live-command-center.js')){res.writeHead(200,{'content-type':'application/javascript'});return res.end(script)}
 if(req.url==='/guard-lab.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});return res.end(html)}
 res.writeHead(404);res.end();
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://api.github.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({workflow_runs:[],artifacts:[]})}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/guard-lab.html',{waitUntil:'load'});
  const panel=page.locator('#rxLiveCommandCenter');
  assert.equal(await panel.count(),1,'Panel mount missing');
  assert.equal(await panel.locator('[data-rx-live-refresh]').count(),1,'Refresh missing');
  await panel.locator('[data-rx-live-refresh]').click();
  await page.waitForTimeout(700);
  assert.deepEqual(errors,[],'Browser page errors');
  console.log('PASS RX Command Center Chromium mount, refresh, no page errors');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
