'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {PAIRS,answer,evaluate}=require('./rx-queen-response-practice.cjs');
test('Queen practices verified responses',()=>{for(const [prompt,expected] of PAIRS)assert.equal(answer(prompt).text,expected);});
test('Queen declines unknown questions rather than inventing answers',()=>{const result=answer('jak zbudować rakietę');assert.equal(result.matched,false);assert.equal(result.productionConnected,false);});
test('Queen rejects empty or oversized prompts',()=>{assert.throws(()=>answer(''));assert.throws(()=>answer('a'.repeat(501)));});
test('Queen training report passes',()=>{const result=evaluate();assert.equal(result.status,'PASS');assert.equal(result.unseenTopic,true);});

test('Queen does not reuse approved answers for unrelated partial keyword matches',()=>{
 for(const prompt of ['czy pamiętasz rakietę','sprawdź pogodę','napraw samochód']){
  const result=answer(prompt);
  assert.equal(result.matched,false,prompt);
  assert.equal(result.productionConnected,false,prompt);
 }
});
