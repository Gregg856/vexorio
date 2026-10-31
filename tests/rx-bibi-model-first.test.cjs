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
