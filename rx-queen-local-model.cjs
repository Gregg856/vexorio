'use strict';
// RX #610: local-only Queen language model gateway; requires an installed local
// Ollama-compatible runtime and explicitly configured model. No remote URLs.
const http=require('node:http');
function start({port=Number(process.env.RX_QUEEN_MODEL_PORT||8798),host='127.0.0.1',
  runtimePort=Number(process.env.RX_QUEEN_RUNTIME_PORT||11434),
  model=process.env.RX_QUEEN_MODEL_NAME||''}={}){
 if(host!=='127.0.0.1'||!Number.isInteger(port)||port<0||port>65535||
    !Number.isInteger(runtimePort)||runtimePort<1||runtimePort>65535)
  throw Error('Queen gateway requires valid loopback ports');
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,100}$/.test(model))
  throw Error('RX_QUEEN_MODEL_NAME must identify a locally installed model');
 const server=http.createServer(async(req,res)=>{
  const respond=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  if(req.method!=='POST'||req.url!=='/infer')return respond(404,{error:'Not found'});
  if(Number(req.headers['content-length']||0)>4096)return respond(413,{error:'Too large'});
  let body='',tooLarge=false;
  try{
   for await(const chunk of req){body+=chunk.toString('utf8');if(Buffer.byteLength(body)>4096){tooLarge=true;break;}}
   if(tooLarge)return respond(413,{error:'Too large'});
   const input=JSON.parse(body);
   if(typeof input?.message!=='string'||!input.message.trim()||input.message.length>1000)return respond(400,{error:'Invalid message'});
   const response=await fetch('http://127.0.0.1:'+runtimePort+'/api/generate',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model,prompt:'Jesteś Królową RX, asystentką administracyjną VEXORIO. Odpowiadaj po polsku. Nie twierdź, że wykonałaś działania administracyjne. Nie ujawniaj sekretów.\nUżytkownik: '+input.message.trim()+'\nKrólowa RX:',stream:false,options:{num_predict:384}}),
    signal:AbortSignal.timeout(25000)
   });
   if(!response.ok)return respond(503,{error:'Local model unavailable'});
   const data=await response.json();
   if(typeof data?.response!=='string'||!data.response.trim())return respond(502,{error:'Invalid model response'});
   return respond(200,{answer:data.response.trim().slice(0,4000)});
  }catch{return respond(503,{error:'Local model unavailable'});}
 });
 return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>resolve(server));});
}
if(require.main===module)start().then(s=>console.log('Queen model gateway listening on',s.address().port)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={start};
