'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('worker.js','utf8');
const line=source.split('\n').find(x=>x.includes('const asksIntroduction='));
assert(line,'Self-introduction matcher missing');
const expression=line.trim().replace(/^const asksIntroduction=/,'').replace(/;$/,'');
function matches(message){
  const normalizedMessage=message.trim().toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l');
  return vm.runInNewContext(expression,{normalizedMessage});
}
for(const message of ['Cześć BIBI, napisz dwa zdania o sobie.','Napisz dwa zdania o sobie.','Powiedz mi coś o sobie.']){
  assert.equal(matches(message),true,'Must recognize: '+message);
}
for(const message of ['Napisz kod dla RX Developera','Sprawdź status GitHub Actions']){
  assert.equal(matches(message),false,'Must not divert tasks: '+message);
}
assert.match(source,/if\(asksIntroduction\)clientAnswer=/);
console.log('RX BIBI introduction regression scenarios: PASS');
