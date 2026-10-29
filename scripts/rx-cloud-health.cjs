'use strict';
// RX CLOUD 6.0 — final read-only readiness snapshot; no secrets or request payloads.
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
      report.capacity={connectionsLimit:Number.isSafeInteger(data.connectionsLimit)?data.connectionsLimit:null,activeRequests:Number.isSafeInteger(data.load?.activeRequests)?data.load.activeRequests:null,peakActiveRequests:Number.isSafeInteger(data.load?.peakActiveRequests)?data.load.peakActiveRequests:null,completedRequests:Number.isSafeInteger(data.load?.completedRequests)?data.load.completedRequests:null};
      report.memory={rssBytes:Number.isSafeInteger(data.memory?.rssBytes)?data.memory.rssBytes:null,heapUsedBytes:Number.isSafeInteger(data.memory?.heapUsedBytes)?data.memory.heapUsedBytes:null};
    }else report.reason='invalid_health_response';
  }catch(e){report.reason=e?.name==='TimeoutError'?'timeout':'unreachable_or_invalid';}
  report.latencyMs=Date.now()-started;
  await fs.writeFile(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('RX CLOUD health:',report.status,'latency:',report.latencyMs,'ms');
  if(report.status!=='ok')process.exitCode=1;
})().catch(()=>{console.error('RX CLOUD health report failed');process.exitCode=1;});
