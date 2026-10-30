'use strict';
// Run BIBI learning questions against an explicitly configured LOCAL chat adapter.
// POST {message,source:'rx-bibi-learning-test'} -> {reply:string}; never call production.
const fs=require('node:fs');
const path=require('node:path');
const {evaluate}=require('./rx-bibi-evaluator.cjs');
const suite=JSON.parse(fs.readFileSync(path.join(__dirname,'rx-bibi-learning-cases.json'),'utf8'));
async function run({endpoint=process.env.RX_BIBI_TEST_CHAT_URL,fetchImpl=fetch}={}){
  if(!endpoint)throw Error('Set RX_BIBI_TEST_CHAT_URL to a local test adapter');
  const url=new URL(endpoint);
  if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash)throw Error('Only a local HTTP test adapter is allowed');
  const responses={};
  for(const item of suite.cases){
    try{
      const response=await fetchImpl(url.toString(),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:item.input,source:'rx-bibi-learning-test'}),
        signal:AbortSignal.timeout(5000)
      });
      if(!response.ok)continue;
      const body=await response.text();
      if(body.length>8192)continue;
      const data=JSON.parse(body);
      if(typeof data.reply==='string')responses[item.id]=data.reply.slice(0,4000);
    }catch{} // Missing responses fail evaluation, never silently pass.
  }
  return evaluate(responses);
}
if(require.main===module){
  run().then(result=>{
    console.log(JSON.stringify(result,null,2));
    if(result.passed!==result.total)process.exitCode=1;
  }).catch(error=>{console.error(error.message);process.exitCode=2;});
}
module.exports={run};
