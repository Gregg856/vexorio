'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseIntent}=require('./rx-queen-intent-parser.cjs');
const {compose}=require('./rx-queen-writing-composer.cjs');
const cases=[
 ['message','Napisz krótko, bez powitania i bez pożegnania: spotkanie jutro o 15:00.',['short','noGreeting','noSignoff']],
 ['reply','Odpowiedz bez pożegnania i bez przywitania: plik dotarł.',['noGreeting','noSignoff']],
 ['message','Napisz zwięźle bez przywitania: potwierdzam termin.',['short','noGreeting']],
 ['reply','Bez pożegnania odpowiedz krótko: wszystko gotowe.',['short','noSignoff']]
];
test('multiple explicit constraints are independently detected',()=>{
 for(const [mode,prompt,expected] of cases){
  const parsed=parseIntent({mode,prompt});
  assert.equal(parsed.recognized,true,prompt);
  assert.deepEqual([...parsed.constraints].sort(),[...expected].sort(),prompt);
 }
});
test('combined constraints are applied to offline outputs',()=>{
 for(const [mode,prompt] of cases){
  const output=compose({mode,prompt});
  assert.equal(output.productionConnected,false);
  assert.ok(!output.text.includes('Cześć!'),prompt);
  assert.ok(!output.text.includes('Pozdrawiam!'),prompt);
  assert.ok(!output.text.includes('Napisz krótko'),prompt);
  assert.ok(!output.text.includes('Odpowiedz bez'),prompt);
 }
});
test('without a supported command the user text remains unchanged',()=>{
 const prompt='Bez powitania i bez pożegnania: spotkanie jutro.';
 assert.equal(parseIntent({mode:'message',prompt}).recognized,false);
 assert.equal(parseIntent({mode:'message',prompt}).content,prompt);
});
