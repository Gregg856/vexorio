'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const {start}=require('../rx-queen-local-model.cjs');
async function run(){
 const mock=http.createServer(async(req,res)=>{
  assert.equal(req.url,'/api/generate');
  let raw='';for await(const c of req)raw+=c;
  const data=JSON.parse(raw);
  assert.equal(data.model,'rx-test-local');
  assert.equal(data.stream,false);
  assert.match(data.prompt,/Czy umiesz rozmawiać/);
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({response:'Tak, odpowiadam z lokalnego modelu.'}));
 });
 await new Promise(resolve=>mock.listen(0,'127.0.0.1',resolve));
 let gateway;
 try{
  gateway=await start({port:0,host:'127.0.0.1',runtimePort:mock.address().port,model:'rx-test-local'});
  const service={fetch:async(_url,init)=>fetch('http://127.0.0.1:'+gateway.address().port+'/infer',init)};
  const {askQueenModel}=await import('../rx-queen-model-bridge.mjs');
  const ok=await askQueenModel('Zapytaj model: Czy umiesz rozmawiać?',{
   RX_QUEEN_MODEL_ENABLED:'true',RX_QUEEN_MODEL_SERVICE:service
  });
  assert.equal(ok.modelInferenceUsed,true);
  assert.equal(ok.answer,'Tak, odpowiadam z lokalnego modelu.');
  assert.equal(ok.engine,'rx-queen-model-service');
  const disabled=await askQueenModel('Zapytaj model: Test',{
   RX_QUEEN_MODEL_ENABLED:'false',RX_QUEEN_MODEL_SERVICE:service
  });
  assert.equal(disabled.modelInferenceUsed,false);
  const missing=await askQueenModel('Zapytaj model: Test',{RX_QUEEN_MODEL_ENABLED:'true'});
  assert.equal(missing.modelInferenceUsed,false);
  const malformed=await askQueenModel('Zapytaj model: ',{RX_QUEEN_MODEL_ENABLED:'true',RX_QUEEN_MODEL_SERVICE:service});
  assert.equal(malformed.modelInferenceUsed,false);
  console.log('RX #614 Queen bridge -> gateway -> mock local runtime: PASS');
 }finally{
  if(gateway)await new Promise(resolve=>gateway.close(resolve));
  await new Promise(resolve=>mock.close(resolve));
 }
}
run().catch(err=>{console.error(err);process.exitCode=1;});
