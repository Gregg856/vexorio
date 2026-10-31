'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {save}=require('../rx-bibi-training-store.cjs');
const {createLocalModelService}=require('../rx-cloud-server.cjs');
const {askClientModel}=require('../rx-bibi-model-bridge.mjs');
const script=path.resolve(__dirname,'../rx-bibi-own-inference.cjs');
async function freePort(){
 const net=require('node:net');
 const server=net.createServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 await new Promise(resolve=>server.close(resolve));
 return port;
}
async function launch(file,port){
 const child=spawn(process.execPath,[script],{env:{...process.env,RX_BIBI_TRAINING_FILE:file,RX_BIBI_MODEL_PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let output='';
 child.stdout.on('data',chunk=>{output+=chunk;});
 child.stderr.on('data',chunk=>{output+=chunk;});
 const deadline=Date.now()+5000;
 while(Date.now()<deadline){
  if(child.exitCode!==null)throw Error('Model exited: '+output);
  try{
   const res=await fetch('http://127.0.0.1:'+port+'/infer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'niedostępne'})});
   if(res.status===422)return child;
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,60));
 }
 child.kill();throw Error('Model did not start: '+output);
}
async function stop(child){
 if(child.exitCode!==null)return;
 child.kill('SIGTERM');
 await new Promise(resolve=>child.once('exit',resolve));
}
test('trained replies persist across real inference process restart',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-bibi-restart-'));
 const file=path.join(dir,'curriculum.json');
 const port=await freePort();
 let child;
 try{
  await save(file,{version:1,samples:[
   {input:'cześć królowo',answer:'Witaj, pierwsza wersja.'},
   {input:'witaj królowo',answer:'Witaj, pierwsza wersja.'}
  ]});
  child=await launch(file,port);
  const env={RX_BIBI_MODEL_ENABLED:'true',RX_BIBI_MODEL_SERVICE:createLocalModelService(port)};
  let result=await askClientModel('Zapytaj model: cześć',env);
  assert.equal(result.answer,'Witaj, pierwsza wersja.');
  await stop(child);child=null;
  child=await launch(file,port);
  result=await askClientModel('Zapytaj model: cześć',env);
  assert.equal(result.answer,'Witaj, pierwsza wersja.','Saved training must survive restart');
  await stop(child);child=null;
  await save(file,{version:1,samples:[
   {input:'cześć królowo',answer:'Witaj, druga wersja.'},
   {input:'witaj królowo',answer:'Witaj, druga wersja.'}
  ]});
  child=await launch(file,port);
  result=await askClientModel('Zapytaj model: cześć',env);
  assert.equal(result.answer,'Witaj, druga wersja.','Approved new curriculum must load after restart');
 }finally{
  if(child)await stop(child);
  await fs.rm(dir,{recursive:true,force:true});
 }
});
