'use strict';
const assert=require('node:assert/strict');
const {chatRX}=require('../rx-brain-chat-engine.cjs');
assert.equal(chatRX('Sprawdź testy').executed,0);
assert.ok(chatRX('Sprawdź testy').plan.steps.length>0);
assert.equal(chatRX('Witaj Królowo').plan.steps.length,0);
console.log('RX brain chat adapter OK');
