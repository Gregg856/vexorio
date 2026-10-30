'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const {start}=require('../rx-bibi-local-chat-adapter.cjs');
const runId='41061620804';
const mockFetch=async(url)=>({
 ok:true,
 json:async()=>({id:Number(runId),repository:{full_name:'Gregg856/vexorio'},status:'completed',conclusion:'success',head_sha:'1688256c2721a60bea98281034c70c36a861dc2c'})
});
function ask(port,message){return new Promise((resolve,reject)=>{
 const req=http.request({hostname:'127.0.0.1',port,path:'/chat',method:'POST',headers:{'Content-Type':'application/json'}},res=>{
 let data='';res.on('data',c=>data+=c);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(data)}));
 });req.on('error',reject);req.end(JSON.stringify({source:'rx-bibi-learning-test',message}));
});}
(async()=>{
 const server=await start({githubFetch:mockFetch});
 try{
  const result=await ask(server.address().port,'Sprawdź testu '+runId);
  assert.equal(result.status,200);
  assert.match(result.reply,/success/);
  assert.match(result.reply,/1688256c/);
  assert.equal(result.executed,0);
  const normal=await ask(server.address().port,'Cześć');
  assert.equal(normal.status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
 console.log('RX BIBI verified GitHub evidence chat: OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
