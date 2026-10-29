'use strict';
// RX CLOUD 2.3 — read-only health probe; no secrets or request payloads in reports.
const fs=require('node:fs/promises');
const endpoint=process.env.RX_CLOUD_HEALTH_URL||'http://127.0.0.1:8787/__rxcloud/health';
const output=process.env.RX_CLOUD_REPORT_PATH||'rx-cloud-health-report.json';
(async()=>{
  const started=Date.now();
  const report={schema:1,kind:'rx-cloud-health',checkedAt:new Date().toISOString(),endpoint:new URL(endpoint).origin,status:'error',httpStatus:null,latencyMs:null};
  try{
    const response=await fetch(endpoint,{signal:AbortSignal.timeout(5000),redirect:'error'});
    report.httpStatus=response.status;
    const data=await response.json();
    if(response.ok&&data?.ok===true&&data?.service==='rx-cloud-2'){
      report.status='ok';report.uptimeSeconds=Number.isFinite(data.uptimeSeconds)?data.uptimeSeconds:null;
    }else report.reason='invalid_health_response';
  }catch(e){report.reason=e?.name==='TimeoutError'?'timeout':'unreachable_or_invalid';}
  report.latencyMs=Date.now()-started;
  await fs.writeFile(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('RX CLOUD health:',report.status,'latency:',report.latencyMs,'ms');
  if(report.status!=='ok')process.exitCode=1;
})().catch(()=>{console.error('RX CLOUD health report failed');process.exitCode=1;});
