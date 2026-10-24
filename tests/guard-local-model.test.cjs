'use strict';
const assert=require('node:assert/strict');
const {train,tokens}=require('../guard/local-model.cjs');
const examples=[
 {label:'safe',text:'Sprzedam rower miejski odbiór osobisty'},
 {label:'safe',text:'Fahrrad gebraucht Abholung möglich'},
 {label:'safe',text:'Used bicycle good condition local pickup'},
 {label:'safe',text:'Продам велосипед самовивіз хороший стан'},
 {label:'suspicious',text:'Wyślij hasło kod SMS płatność western union'},
 {label:'suspicious',text:'Guaranteed profit pay immediately gift card'},
 {label:'suspicious',text:'Gwarantowany zysk wpłać natychmiast inwestycja'},
 {label:'suspicious',text:'Send password verification code pay outside'}
];
const model=train(examples);
assert.equal(model.predict('Sprzedam rower odbiór osobisty').label,'safe');
assert.equal(model.predict('Wyślij hasło kod SMS western union').label,'suspicious');
assert.equal(model.predict('Gwarantowany zysk wpłać natychmiast').label,'suspicious');
for(const row of examples){
 const prediction=model.predict(row.text);
 assert.ok(prediction.confidence>=0.5&&prediction.confidence<=1);
 assert.equal(prediction.mode,'advisory');
}
const unfamiliar=model.predict('quasar nebula xenolith');
assert.equal(unfamiliar.label,'unknown');
assert.equal(unfamiliar.confidence,0);
assert.equal(unfamiliar.coverage,0);
assert.equal(unfamiliar.recognizedTokens,0);
assert.ok(model.predict('Sprzedam xenolith').coverage>0);
assert.ok(tokens('Zażółć gęślą jaźń').includes('zażółć'));
assert.throws(()=>train([{text:'test',label:'safe'}]));
console.log('PASS: VEXORIO own local text model trains and predicts without external services');
