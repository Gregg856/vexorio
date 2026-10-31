'use strict';
// RX BIBI secure metrics-only sync with existing self-hosted RX CLOUD.
const fs=require('node:fs/promises'),path=require('node:path');
const {validate}=require('../rx-learning-cloud-store.cjs');
const endpoint=()=>{
 const raw=process.env.RX_LEARNING_CLOUD_URL||'';
 const url=new URL(raw);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||
   url.pathname!=='/__rxcloud/bibi/learning-history')throw Error('Invalid RX learning cloud endpoint');
 if(url.protocol==='http:'&&!['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname))throw Error('HTTPS required for remote cloud');
 return url.href;
};
const token=()=>{
 const v=process.env.RX_QUEEN_LOCAL_TOKEN||'';
 if(v.length<32)throw Error('Missing RX cloud authentication');
 return v;
};
async function request(method,body){
 const url=endpoint(),secret=token();
 const response=await fetch(url,{method,headers:{Authorization:'Bearer '+secret,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('RX CLOUD sync failed: HTTP '+response.status);
 return response.json();
}
async function pull(){
 const data=validate(await request('GET'));
 const file=path.resolve('rx-bibi-reports/rx-learning-history.json');
 await fs.mkdir(path.dirname(file),{recursive:true});
 await fs.writeFile(file,JSON.stringify(data,null,2)+'\n');
 return data.runs.length;
}
async function push(){
 const file=path.resolve('rx-bibi-reports/rx-learning-history.json');
 const data=validate(JSON.parse(await fs.readFile(file,'utf8')));
 return request('PUT',data);
}
if(require.main===module){
 const command=process.argv[2];
 if(!['pull','push'].includes(command))throw Error('Expected pull or push');
 (command==='pull'?pull():push()).then(x=>console.log('RX CLOUD learning sync',command,typeof x==='number'?x:'OK')).catch(e=>{console.error(e.message);process.exitCode=1;});
}
module.exports={endpoint,pull,push};
