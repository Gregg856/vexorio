'use strict';
// RX #612 — read-only LOCAL Queen model readiness check.
// No credentials, remote URLs, installations, or model downloads.
const http=require('node:http');
function validPort(value){const n=Number(value);return Number.isInteger(n)&&n>0&&n<=65535?n:null;}
function request(port,path,method='GET',payload,timeoutMs=3500){
 return new Promise((resolve,reject)=>{
  const req=http.request({hostname:'127.0.0.1',port,path,method,timeout:timeoutMs,
   headers:payload?{'Content-Type':'application/json'}:{}},res=>{
    let body='';res.setEncoding('utf8');
    res.on('data',chunk=>{body+=chunk;if(body.length>65536)req.destroy(Error('Response too large'));});
    res.on('end',()=>{try{resolve({status:res.statusCode,data:JSON.parse(body)});}catch{reject(Error('Invalid JSON'));}});
   });
  req.on('timeout',()=>req.destroy(Error('Timeout')));
  req.on('error',reject);
  if(payload)req.write(JSON.stringify(payload));
  req.end();
 });
}
async function probe(env=process.env,output=console.log){
 const runtimePort=validPort(env.RX_QUEEN_RUNTIME_PORT||11434);
 const gatewayPort=validPort(env.RX_QUEEN_MODEL_PORT||8798);
 const model=env.RX_QUEEN_MODEL_NAME||'';
 const report={runtime:'unverified',model:'unverified',gateway:'unverified',ready:false};
 if(!runtimePort||!gatewayPort||runtimePort===gatewayPort){output('NOT READY: invalid or conflicting local ports');return report;}
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,100}$/.test(model)){
  output('NOT READY: set RX_QUEEN_MODEL_NAME to a locally installed model');return report;
 }
 try{
  const tags=await request(runtimePort,'/api/tags');
  if(tags.status!==200||!Array.isArray(tags.data?.models))throw Error('No model listing');
  report.runtime='ok';
  if(!tags.data.models.some(x=>x.name===model||x.model===model)){
   output('NOT READY: requested model is not installed locally');return report;
  }
  report.model='installed';
 }catch{output('NOT READY: local runtime unreachable or invalid');return report;}
 try{
  const answer=await request(gatewayPort,'/infer','POST',{message:'Odpowiedz jednym słowem: gotowe'},30000);
  if(answer.status!==200||typeof answer.data?.answer!=='string'||!answer.data.answer.trim())
   throw Error('No answer');
  report.gateway='responding';
  report.ready=true;
  output('READY: local runtime, selected model and Queen gateway responded. RX CLOUD auth/chat not verified.');
 }catch{output('NOT READY: Queen gateway did not produce a valid response');}
 return report;
}
if(require.main===module)probe().then(r=>{if(!r.ready)process.exitCode=1;}).catch(()=>{console.error('NOT READY: probe failed');process.exitCode=1;});
module.exports={probe,validPort};
