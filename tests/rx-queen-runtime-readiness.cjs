'use strict';
// Read-only runtime readiness report; never reports deployed just because CI passed.
const fs=require('node:fs/promises'),path=require('node:path');
const {load}=require('../rx-queen-approved-memory.cjs');
async function check({baseUrl=process.env.RX_CLOUD_BASE_URL||'',file=process.env.RX_QUEEN_APPROVED_FILE||path.join(__dirname,'..','rx-cloud-private-inbox','rx-queen-approved-responses.json'),timeoutMs=5000}={}){
 const result={schema:1,service:'rx-cloud-2',checkedAt:new Date().toISOString(),server:{reachable:false,healthy:false},approvedMemory:{enabled:process.env.RX_BIBI_APPROVED_MEMORY_ENABLED==='true',entries:0,valid:false},ready:false,liveChatVerified:false,errors:[]};
 try{const data=await load(file);result.approvedMemory.entries=data.entries.length;result.approvedMemory.valid=true;}catch{result.errors.push('approved-memory-invalid');}
 if(!result.approvedMemory.enabled)result.errors.push('approved-memory-disabled');
 if(result.approvedMemory.entries===0)result.errors.push('no-approved-responses');
 if(!baseUrl){result.errors.push('rx-cloud-base-url-not-configured');return result;}
 try{
  const u=new URL(baseUrl);
  if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error('invalid');
  const r=await fetch(new URL('/__rxcloud/health',u),{method:'GET',signal:AbortSignal.timeout(timeoutMs),headers:{accept:'application/json'}});
  result.server.reachable=true;
  const body=await r.json();
  result.server.healthy=r.status===200&&body?.ok===true&&body?.service==='rx-cloud-2'&&body?.runtime==='node';
  if(!result.server.healthy)result.errors.push('health-check-failed');
 }catch{result.errors.push('rx-cloud-unreachable-or-invalid-url');}
 result.ready=result.server.healthy&&result.approvedMemory.enabled&&result.approvedMemory.valid&&result.approvedMemory.entries>0;
 // Health checks cannot prove that authenticated chat uses approved memory.
 return result;
}
if(require.main===module)check().then(x=>{console.log(JSON.stringify(x,null,2));if(!x.ready)process.exitCode=1;}).catch(()=>{process.exitCode=1;});
module.exports={check};
