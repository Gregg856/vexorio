'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseIntent}=require('./rx-queen-intent-parser.cjs');
const {compose}=require('./rx-queen-writing-composer.cjs');
const cases=[
 ['message','Napisz bez powitania i z powitaniem: spotkanie jutro.','greeting'],
 ['reply','Odpowiedz bez pożegnania, dodaj pożegnanie: plik dotarł.','signoff'],
 ['message','Napisz krótko i szczegółowo: spotkanie jutro.','length'],
 ['reply','Odpowiedz zwięźle, obszernie: dokument gotowy.','length']
];
test('contradictory requirements are flagged rather than silently chosen',()=>{
 for(const [mode,prompt,kind] of cases){
  const intent=parseIntent({mode,prompt});
  assert.equal(intent.requiresClarification,true,prompt);
  assert.ok(intent.conflicts.includes(kind),prompt);
  const output=compose({mode,prompt});
  assert.equal(output.requiresClarification,true,prompt);
  assert.equal(output.matched,false,prompt);
  assert.equal(output.productionConnected,false);
  assert.ok(!output.text.includes('spotkanie jutro')&&!output.text.includes('plik dotarł'));
 }
});
test('compatible instructions still compose normally',()=>{
 const output=compose({mode:'message',prompt:'Napisz krótko bez powitania: potwierdzam termin.'});
 assert.equal(output.requiresClarification,undefined);
 assert.equal(output.text,'Potwierdzam termin.');
});
