'use strict';
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const DEFAULT_TESTS=['tests/rx-ant-academy.cjs','tests/rx-ant-academy-proof.cjs','tests/rx-ant-academy-ci.cjs','tests/rx-bibi-budget.cjs','tests/rx-ant-task-board.cjs'];
async function runFastTests({tests=DEFAULT_TESTS,parallel=3,timeoutMs=20000}={}){
 if(!Array.isArray(tests)||tests.length>50||!Number.isSafeInteger(parallel)||parallel<1||parallel>6||!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>120000)throw Error('Invalid test limits');
 if(tests.some(t=>typeof t!=='string'||!/^tests\/[a-z0-9-]+\.cjs$/.test(t)||!fs.existsSync(path.resolve(t))))throw Error('Invalid test path');
 let cursor=0;const results=new Array(tests.length);
 async function worker(){while(cursor<tests.length){const i=cursor++,file=tests[i],started=Date.now();results[i]=await new Promise(resolve=>{
  const child=spawn(process.execPath,[file],{stdio:['ignore','pipe','pipe'],env:{...process.env,RX_FAST_TEST:'1'}});
  let output='',done=false,timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;child.kill('SIGKILL')},timeoutMs);
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output=(output+String(chunk)).slice(-2500)});
  child.on('error',e=>{if(done)return;done=true;clearTimeout(timer);resolve({file,ok:false,ms:Date.now()-started,error:String(e.message)})});
  child.on('close',(code,signal)=>{if(done)return;done=true;clearTimeout(timer);resolve({file,ok:code===0&&!timedOut,ms:Date.now()-started,exitCode:code,signal,timedOut,output})});
 });}}
 await Promise.all(Array.from({length:Math.min(parallel,tests.length)},worker));
 return {schema:1,kind:'rx-fast-test-engine',passed:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,total:results.length,results};
}
if(require.main===module)runFastTests().then(report=>{fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/rx-fast-tests.json',JSON.stringify(report,null,2)+'\n');for(const r of report.results)console.log((r.ok?'PASS ':'FAIL ')+r.file+' '+r.ms+'ms'+(r.ok?'':' '+(r.output||r.error||'')));console.log('RX FAST:',report.passed+'/'+report.total);if(report.failed)process.exitCode=1}).catch(e=>{console.error(e);process.exitCode=1});
module.exports={runFastTests};
