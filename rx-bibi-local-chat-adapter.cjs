'use strict';
// Explicit local adapter to the EXISTING RX brain. No production deployment or actions.
const http=require('node:http');
const {chatRX}=require('./rx-brain-chat-engine.cjs');
function start({port=0,host='127.0.0.1'}={}){
 if(!['127.0.0.1','::1'].includes(host))throw Error('Local host only');
 const server=http.createServer((req,res)=>{
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'||req.url!=='/chat'){res.writeHead(404);res.end(JSON.stringify({error:'Not found'}));return;}
  let body='';
  req.on('data',chunk=>{body+=chunk;if(body.length>4096)req.destroy();});
  req.on('end',()=>{
   try{
    const data=JSON.parse(body);
    if(data.source!=='rx-bibi-learning-test'||typeof data.message!=='string')throw Error('Invalid request');
    const result=chatRX(data.message);
    res.writeHead(200);res.end(JSON.stringify({reply:result.answer,executed:result.executed}));
   }catch{res.writeHead(400);res.end(JSON.stringify({error:'Invalid request'}));}
  });
 });
 return new Promise(resolve=>server.listen(port,host,()=>resolve(server)));
}
if(require.main===module){
 start({port:Number(process.env.RX_BIBI_LOCAL_PORT||8799)}).then(s=>console.log('RX BIBI local brain adapter on '+s.address().port));
}
module.exports={start};
