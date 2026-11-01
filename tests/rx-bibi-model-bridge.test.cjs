'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
test('model adapter requires explicit prompt and opt-in binding',async()=>{
 const {askClientModel}=await import(pathToFileURL(path.join(__dirname,'..','rx-bibi-model-bridge.mjs')));
 assert.equal(await askClientModel('Cześć',{}),null);
 const unavailable=await askClientModel('Zapytaj model: cześć',{});
 assert.equal(unavailable.modelInferenceUsed,false);
 assert.match(unavailable.answer,/nie jest jeszcze podłączony/);
 let calls=0;
 const env={RX_BIBI_MODEL_ENABLED:'true',RX_BIBI_MODEL_SERVICE:{fetch:async(url,init)=>{
  calls++;
  assert.equal(url,'https://rx-bibi-model.internal/infer');
  assert.equal(JSON.parse(init.body).message,'cześć');
  return {ok:true,json:async()=>({answer:'Witaj!'})};
 }}};
 const answer=await askClientModel('Zapytaj model: cześć',env);
 assert.equal(answer.answer,'Witaj!');
 assert.equal(answer.modelInferenceUsed,true);
 assert.equal(calls,1);
 const invalid=await askClientModel('Zapytaj model: cześć',{RX_BIBI_MODEL_ENABLED:'true',RX_BIBI_MODEL_SERVICE:{fetch:async()=>({ok:true,json:async()=>({answer:''})})}});
 assert.equal(invalid.modelInferenceUsed,false);
});
test('model path remains behind client authentication',()=>{
 const fs=require('node:fs');
 const worker=fs.readFileSync(path.join(__dirname,'..','worker.js'),'utf8');
 const start=worker.indexOf("if(url.pathname==='/api/rx/client/chat')");
 const auth=worker.indexOf('if(!user?.id||user.is_anonymous===true)',start);
 const model=worker.indexOf('const model=await askClientModel(message,env)',start);
 assert.ok(start>=0&&auth>start&&model>auth);
});

test('model bridge package 2: five input and output safeguards',async()=>{
 const {askClientModel:ask}=await import(pathToFileURL(path.join(__dirname,'..','rx-bibi-model-bridge.mjs')));
 assert.equal(await ask(null,{}),null);
 assert.equal(await ask('  ',{}),null);
 let sent='';
 const env={RX_BIBI_MODEL_ENABLED:'true',RX_BIBI_MODEL_SERVICE:{fetch:async(_url,init)=>{sent=JSON.parse(init.body).message;return {ok:true,json:async()=>({answer:'  Gotowe!  '})};}}};
 const valid=await ask('Zapytaj model:   test   ',env);
 assert.equal(sent,'test');
 assert.equal(valid.answer,'Gotowe!');
 const bad={...env,RX_BIBI_MODEL_SERVICE:{fetch:async()=>({ok:true,json:async()=>({answer:'niebezpieczny\u0000tekst'})})}};
 assert.equal((await ask('Zapytaj model: test',bad)).modelInferenceUsed,false);
});
