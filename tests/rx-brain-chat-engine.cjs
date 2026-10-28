'use strict';
const assert=require('node:assert/strict');
const {chatRX}=require('../rx-brain-chat-engine.cjs');
assert.equal(chatRX('Sprawdź testy').executed,0);
assert.ok(chatRX('Sprawdź testy').plan.steps.length>0);
assert.equal(chatRX('Witaj Królowo').plan.steps.length,0);
console.log('RX brain chat adapter OK');

assert.equal(chatRX('A chmura?',{history:['Sprawdź testy']}).contextUsed,true);
assert.equal(chatRX('A chmura?',{history:['Sprawdź testy']}).plan.steps.some(x=>x.intent==='inspect_tests'),true);
assert.throws(()=>chatRX('Dalej',{history:Array(7).fill('testy')}),/Invalid history/);
