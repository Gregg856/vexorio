'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {start,train,infer}=require('../rx-bibi-own-inference.cjs');
const {createLocalModelService}=require('../rx-cloud-server.cjs');
const samples=[
 {input:'cześć królowo',answer:'Witaj w RX BIBI.'},
 {input:'witaj królowo',answer:'Witaj w RX BIBI.'},
 {input:'status serwera',answer:'Sprawdź lokalny endpoint stanu RX CLOUD.'},
 {input:'stan serwera',answer:'Sprawdź lokalny endpoint stanu RX CLOUD.'}
];
test('own CPU inference learns token weights and rejects unseen queries',()=>{
 const model=train(samples);
 assert.equal(infer(model,'cześć').answer,'Witaj w RX BIBI.');
 assert.equal(infer(model,'status').answer,'Sprawdź lokalny endpoint stanu RX CLOUD.');
 assert.equal(infer(model,'nieznane zagadnienie'),null);
 assert.throws(()=>train([{input:'x',answer:'y'}]),/Invalid training samples/);
});
test('actual trained local CPU inference over RX CLOUD bridge',async()=>{
 const server=await start({samples});
 try{
  const {askClientModel}=await import('../rx-bibi-model-bridge.mjs');
  const env={RX_BIBI_MODEL_ENABLED:'true',RX_BIBI_MODEL_SERVICE:createLocalModelService(server.address().port)};
  const reply=await askClientModel('Zapytaj model: cześć',env);
  assert.equal(reply.answer,'Witaj w RX BIBI.');
  assert.equal(reply.modelInferenceUsed,true);
  const missing=await askClientModel('Zapytaj model: kosmos rakieta',env);
  assert.equal(missing.modelInferenceUsed,false,'No training evidence must not invent an answer');
  const direct=await fetch('http://127.0.0.1:'+server.address().port+'/infer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'status'})});
  assert.equal(direct.status,200);
  assert.equal((await direct.json()).kind,'rx-own-token-classifier');
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});

test('exact training examples win; ambiguous partial evidence abstains safely',()=>{
 const model=train([{input:'status sieci',answer:'Sieć działa.'},{input:'status pamieci',answer:'Pamięć działa.'}]);
 assert.equal(infer(model,'status sieci').answer,'Sieć działa.');
 assert.equal(infer(model,'STATUS PAMIĘCI').answer,'Pamięć działa.');
 assert.equal(infer(model,'status'),null,'Ambiguous intent must not guess');
 assert.throws(()=>train([{input:'status sieci',answer:'A'},{input:'STATUS SIECI',answer:'B'}]),/Conflicting training examples/);
});
