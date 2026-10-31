'use strict';
// Cross-platform, read-only readiness check. Does not contact public services or expose secrets.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const net=require('node:net');
const {read}=require('../rx-bibi-training-store.cjs');
async function portAvailable(port){
 return await new Promise(resolve=>{
  const server=net.createServer();
  server.once('error',()=>resolve(false));
  server.listen(port,'127.0.0.1',()=>server.close(()=>resolve(true)));
 });
}
async function inspect(env=process.env){
 const nodeMajor=Number(process.versions.node.split('.')[0]);
 const modelPort=Number(env.RX_BIBI_MODEL_PORT||0);
 const portValid=Number.isInteger(modelPort)&&modelPort>=1&&modelPort<=65535;
 const trainingPath=env.RX_BIBI_TRAINING_FILE||'';
 let curriculum='not-configured',sampleCount=null;
 if(trainingPath){
  try{
   const real=fs.realpathSync(trainingPath);
   if(!fs.statSync(real).isFile())throw Error('not file');
   const data=await read(real);
   curriculum='valid';sampleCount=data.samples.length;
  }catch{curriculum='missing-or-invalid';}
 }
 const available=portValid?await portAvailable(modelPort):null;
 return {platform:os.platform(),architecture:os.arch(),nodeMajor,nodeSupported:nodeMajor>=22,
  serviceManager:os.platform()==='linux'?'linux-check-systemd':os.platform()==='win32'?'windows-needs-service-setup':'manual-setup',
  modelPortConfigured:portValid,modelPortAvailable:available,curriculum,sampleCount,
  modelEnabled:env.RX_BIBI_MODEL_ENABLED==='true',modelFirstEnabled:env.RX_BIBI_CLIENT_MODEL_FIRST==='true',
  readyForManualStart:nodeMajor>=22&&portValid&&available===true&&curriculum==='valid',
  note:'Read-only snapshot of THIS machine; not proof of a running service or production host'};
}
if(require.main===module)inspect().then(x=>console.log(JSON.stringify(x,null,2))).catch(()=>{console.error('Preflight failed');process.exitCode=1;});
module.exports={inspect};
