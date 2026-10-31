'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chatRX,chatRXWithWriting}=require('../rx-brain-chat-engine.cjs');
test('existing chat remains the default',()=>assert.deepEqual(chatRXWithWriting('cześć'),chatRX('cześć')));
test('writing message in existing chat engine',()=>{const r=chatRXWithWriting('napisz wiadomość: miłego dnia');assert.match(r.answer,/Miłego dnia/);assert.equal(r.writingMode,'message');assert.equal(r.executed,0);});
test('writing summary in existing chat engine',()=>{const r=chatRXWithWriting('przygotuj streszczenie: Pierwsze. Drugie. Trzecie.');assert.equal(r.answer,'Pierwsze. Drugie.');});
test('writing reply without executing tasks',()=>{const r=chatRXWithWriting('napisz odpowiedź: dziękuję za wiadomość');assert.equal(r.writingMode,'reply');assert.equal(r.executed,0);});
