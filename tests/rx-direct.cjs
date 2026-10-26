'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('worker.js','utf8');
 const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
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
  assert.equal(report.ok,true);
  assert.equal(report.runs.length,3);
  assert.equal(report.runs.find(x=>x.name==='VEXORIO checks').result,'success');
  assert.equal(report.runs.find(x=>x.name==='Deploy VEXORIO').status,'unknown');
  assert.equal(calls,3);
  global.fetch=async()=>new Response('',{status:503});
  result=await worker.fetch(request(base+'?command=RX%20STATUS'),{});
  assert.equal(result.status,502);
  assert.equal((await result.json()).ok,false);
 }finally{global.fetch=originalFetch;}
 console.log('RX DIRECT endpoint: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
