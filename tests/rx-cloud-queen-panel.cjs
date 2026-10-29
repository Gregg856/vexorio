'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('rx-admin-prototype.html','utf8');
const start=html.indexOf('async function loadCloudWatch()');
const end=html.indexOf('async function loadBibiQueenWatch()',start);
assert(start>=0&&end>start,'RX CLOUD handler must exist in Queen panel');
const source=html.slice(start,end);
assert(html.includes("else if(label==='☁️ RX CLOUD — monitoring')loadCloudWatch();"),'Menu must call handler');
async function scenario(run,expected,now=Date.parse('2026-10-29T12:00:00Z')){
 const messages=[];
 const sandbox={
  add:(_type,msg)=>messages.push(msg),
  fetch:async()=>({ok:true,json:async()=>({workflow_runs:run?[run]:[]})}),
  AbortSignal:{timeout:()=>({})},
  Date:class extends Date{static now(){return now}},
 };
 vm.createContext(sandbox);
 vm.runInContext(source+'\nthis.invoke=loadCloudWatch;',sandbox);
 await sandbox.invoke();
 assert(messages.some(x=>x.includes(expected)),JSON.stringify(messages));
}
(async()=>{
 const fresh='2026-10-29T11:00:00Z',old='2026-10-27T11:00:00Z';
 await scenario({status:'completed',conclusion:'success',updated_at:fresh},'ZIELONY');
 await scenario({status:'completed',conclusion:'success',updated_at:old},'NIEAKTUALNE');
 await scenario({status:'completed',conclusion:'failure',updated_at:fresh},'failure');
 await scenario({status:'in_progress',updated_at:fresh},'w toku');
 await scenario(null,'Brak przebiegów');
 console.log('RX CLOUD Queen status scenarios: 5 passed');
})().catch(e=>{console.error(e);process.exitCode=1});
