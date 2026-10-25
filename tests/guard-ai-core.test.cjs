'use strict';
const assert=require('node:assert/strict');
const {train,predict}=require('../guard/ai-core.cjs');
const examples=[
 {text:'moderuj podejrzane ogłoszenie',label:'guardian'},
 {text:'sprawdź oszustwo w ogłoszeniu',label:'guardian'},
 {text:'popraw kod strony',label:'developer'},
 {text:'napraw funkcję wyszukiwania',label:'developer'},
 {text:'stwórz grafikę na tiktok',label:'studio'},
 {text:'wygeneruj okładkę filmu',label:'studio'},
 {text:'dzień dobry',label:'general'},
 {text:'jak się masz',label:'general'}
];
const model=train(examples);
for(const item of examples)assert.equal(predict(model,item.text).label,item.label,item.text);
const unknown=predict(model,'kwazar nebulosa galaktyka');
assert.equal(unknown.unknownInput,true);
assert.equal(unknown.coverage,0);
assert.equal(unknown.needsReview,true);
const familiar=predict(model,'popraw kod strony');
assert.equal(familiar.unknownInput,false);
assert.equal(familiar.coverage,1);
assert.equal(model.weights.length,4);
assert.ok(model.vocab.length>0);
assert.deepEqual(train(examples),model);
assert.equal(typeof JSON.parse(JSON.stringify(model)).version,'string');
assert.throws(()=>train([]),/Invalid training input/);
assert.throws(()=>predict(model,null),/Invalid prediction input/);
console.log('PASS: Strażak AI Core 0.1 trained from scratch, deterministic and serializable');
