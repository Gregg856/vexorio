'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('worker.js','utf8');
 const {pathToFileURL}=require('node:url');
 const plannerUrl=pathToFileURL(require('node:path').resolve('rx-chat-planner.mjs')).href;
 const knowledgeUrl=pathToFileURL(require('node:path').resolve('rx-world-knowledge.mjs')).href;
 const testSource=source.replace("'./rx-chat-planner.mjs'",JSON.stringify(plannerUrl)).replace("'./rx-world-knowledge.mjs'",JSON.stringify(knowledgeUrl)).replace("'./rx-knowledge-base.mjs'",JSON.stringify(pathToFileURL(require('node:path').resolve('rx-knowledge-base.mjs')).href)).replace("'./rx-persistent-memory.mjs'",JSON.stringify(pathToFileURL(require('node:path').resolve('rx-persistent-memory.mjs')).href));
 const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(testSource).toString('base64'));
 const base='https://example.test/api/rx/direct';
 const request=(url,method='GET')=>new Request(url,{method});
 let result=await worker.fetch(request(base+'?command=RX%20UNKNOWN'),{});
 assert.equal(result.status,400);
 result=await worker.fetch(request(base+'?command=RX%20STATUS','POST'),{});
 assert.equal(result.status,405);
 const originalFetch=global.fetch;
 let calls=0;
 try{
  global.fetch=async url=>{
   calls++;
   assert.match(String(url),/^https:\/\/api\.github\.com\/repos\/Gregg856\/vexorio\/actions\/workflows\/[^/]+\/runs/);
   return new Response(JSON.stringify({workflow_runs:String(url).includes('checks.yml')?[
    {name:'VEXORIO checks',run_number:10,status:'completed',conclusion:'success',html_url:'https://github.com/test'}
   ]:[]}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  result=await worker.fetch(request(base+'?command=RX%20STATUS'),{});
  assert.equal(result.status,200);
  const report=await result.json();
  assert.equal(report.ok,false);
  assert.equal(report.runs.length,3);
  assert.equal(report.runs.find(x=>x.name==='VEXORIO checks').result,'success');
  assert.equal(report.runs.find(x=>x.name==='Deploy VEXORIO').status,'unknown');
  assert.equal(report.degraded,true);
  assert.equal(report.ok,false);
  assert.equal(calls,3);
  assert.ok(report.runs.every(x=>x.status!=='unavailable'));
  global.fetch=async url=>new Response(JSON.stringify({workflow_runs:[{run_number:11,status:'completed',conclusion:'success',html_url:'https://github.com/Gregg856/vexorio/actions/runs/11'}]}),{status:200});
  result=await worker.fetch(request(base+'?command=RX%20STATUS'),{RX_GITHUB_DISPATCH_TOKEN:'test-token'});
  const complete=await result.json();
  assert.equal(complete.ok,true);
  assert.equal(complete.degraded,false);
  global.fetch=async()=>new Response('',{status:503});
  result=await worker.fetch(request(base+'?command=RX%20STATUS'),{});
  assert.equal(result.status,200);
  const degradedReport=await result.json();
  assert.equal(degradedReport.ok,false);
  assert.equal(degradedReport.degraded,true);
  assert.equal(degradedReport.runs.length,3);
  assert.ok(degradedReport.runs.every(run=>run.status==='unavailable'));
 }finally{global.fetch=originalFetch;}
 console.log('RX DIRECT endpoint: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
