'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
test('model-first bridge works without special prefix only when service is configured',async()=>{
 const {askClientModel}=await import('../rx-bibi-model-bridge.mjs');
 let sent=null;
 const env={RX_BIBI_MODEL_ENABLED:'true',RX_BIBI_MODEL_SERVICE:{fetch:async(url,options)=>{sent=JSON.parse(options.body);return new Response(JSON.stringify({answer:'Odpowiedź RX'}),{status:200});}}};
 assert.equal(await askClientModel('Cześć',env),null);
 const direct=await askClientModel('Cześć',env,{direct:true});
 assert.equal(direct.modelInferenceUsed,true);
 assert.deepEqual(sent,{message:'Cześć'});
 const missing=await askClientModel('Cześć',{}, {direct:true});
 assert.equal(missing.modelInferenceUsed,false);
 assert.equal(await askClientModel(' '.repeat(4),env,{direct:true}),null);
});

test('model-first safely handles model errors and never sends private history',async()=>{
 const {askClientModel}=await import('../rx-bibi-model-bridge.mjs');
 let calls=0;
 const env={RX_BIBI_MODEL_ENABLED:'true',RX_BIBI_MODEL_SERVICE:{fetch:async(url,options)=>{
  calls++;
  assert.equal(url,'https://rx-bibi-model.internal/infer');
  assert.deepEqual(JSON.parse(options.body),{message:'Dzień dobry'});
  return new Response(JSON.stringify({answer:'Witaj w BIBI!'}),{status:200});
 }}};
 const answer=await askClientModel('Dzień dobry',env,{direct:true});
 assert.equal(answer.answer,'Witaj w BIBI!');
 assert.equal(answer.modelInferenceUsed,true);
 assert.equal(calls,1);
 const unavailable=await askClientModel('Dzień dobry',{RX_BIBI_MODEL_ENABLED:'false',RX_BIBI_MODEL_SERVICE:env.RX_BIBI_MODEL_SERVICE},{direct:true});
 assert.equal(unavailable.modelInferenceUsed,false);
 assert.equal(calls,1);
 const broken=await askClientModel('Dzień dobry',{RX_BIBI_MODEL_ENABLED:'true',RX_BIBI_MODEL_SERVICE:{fetch:async()=>{throw Error('offline');}}},{direct:true});
 assert.equal(broken.modelInferenceUsed,false);
 assert.match(broken.answer,/niedostępny/);
});

test('existing public chat model-first is gated behind authentication and private-memory guard',()=>{
 const fs=require('node:fs');
 const path=require('node:path');
 const worker=fs.readFileSync(path.join(__dirname,'..','worker.js'),'utf8');
 const route=worker.indexOf("if(url.pathname==='/api/rx/client/chat')");
 const auth=worker.indexOf('if(!user?.id||user.is_anonymous===true)',route);
 const privacy=worker.indexOf("const normalizedIntent=message.trim()",auth);
 const first=worker.indexOf("if(env.RX_BIBI_CLIENT_MODEL_FIRST==='true'",privacy);
 const fallback=worker.indexOf('const moduleStatusMatch=',first);
 assert.ok(route>=0&&auth>route&&privacy>auth&&first>privacy&&fallback>first);
 assert.ok(worker.slice(first,fallback).includes('model?.modelInferenceUsed'));
});
