'use strict';
// RX BIBI own CPU inference prototype: trained token weights, not a generative LLM.
const http=require('node:http');
function tokens(value){
 return (String(value).toLocaleLowerCase('pl').match(/[\p{L}\p{N}]+/gu)||[]).slice(0,64);
}
function train(samples){
 if(!Array.isArray(samples)||samples.length<2||samples.length>1000)throw Error('Invalid training samples');
 const labels=new Map(),weights=new Map();
 for(const sample of samples){
  if(typeof sample?.input!=='string'||typeof sample?.answer!=='string'||!sample.input.trim()||!sample.answer.trim()||sample.input.length>1000||sample.answer.length>1000)throw Error('Invalid sample');
  const label=sample.answer;
  labels.set(label,(labels.get(label)||0)+1);
  const words=new Set(tokens(sample.input));
  for(const word of words){
   if(!weights.has(word))weights.set(word,new Map());
   const row=weights.get(word);row.set(label,(row.get(label)||0)+1);
  }
 }
 return Object.freeze({labels,weights});
}
function infer(model,input){
 if(typeof input!=='string'||!input.trim()||input.length>1000)return null;
 const words=new Set(tokens(input));const scores=new Map();
 for(const word of words)for(const [label,count] of model.weights.get(word)||[])scores.set(label,(scores.get(label)||0)+count);
 const sorted=[...scores].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'));
 return sorted.length?{answer:sorted[0][0],confidence:sorted[0][1]/Math.max(1,words.size),kind:'rx-own-token-classifier'}:null;
}
function start({samples,port=0,host='127.0.0.1'}={}){
 if(host!=='127.0.0.1')throw Error('Loopback only');
 if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
 const model=train(samples);
 const server=http.createServer((req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.url!=='/infer'||req.method!=='POST'){res.writeHead(404);res.end(JSON.stringify({error:'Not found'}));return;}
  if(Number(req.headers['content-length'])>2048){res.writeHead(413);res.end(JSON.stringify({error:'Too large'}));return;}
  let body='',rejected=false;
  req.on('data',chunk=>{body+=chunk;if(body.length>2048){rejected=true;res.writeHead(413);res.end(JSON.stringify({error:'Too large'}));req.destroy();}});
  req.on('end',()=>{
   if(rejected)return;
   try{
    const data=JSON.parse(body);
    if(typeof data?.message!=='string'||!data.message.trim()||data.message.length>1000)throw Error('Invalid input');
    const result=infer(model,data.message);
    if(!result){res.writeHead(422);res.end(JSON.stringify({error:'No trained answer'}));return;}
    res.writeHead(200);res.end(JSON.stringify(result));
   }catch{res.writeHead(400);res.end(JSON.stringify({error:'Invalid input'}));}
  });
 });
 server.requestTimeout=10000;
 server.headersTimeout=10000;
 return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>resolve(server));});
}
module.exports={tokens,train,infer,start};
