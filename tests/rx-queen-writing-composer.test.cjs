'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {compose}=require('./rx-queen-writing-composer.cjs');
test('answers use approved response examples',()=>assert.match(compose({prompt:'cześć królowo'}).text,/Cześć/));
test('unknown answers do not invent facts',()=>assert.equal(compose({prompt:'jak zbudować rakietę'}).matched,false));
test('writes a friendly message',()=>assert.equal(compose({prompt:'miłego dnia',mode:'message'}).text,'Cześć! Miłego dnia. Pozdrawiam!'));
test('writes a formal reply',()=>assert.match(compose({prompt:'dziękuję za wiadomość',mode:'reply',tone:'formal'}).text,/Dzień dobry,/));
test('summarizes supplied text without adding facts',()=>assert.equal(compose({prompt:'Pierwsze. Drugie. Trzecie.',mode:'summary'}).text,'Pierwsze. Drugie.'));
test('rejects invalid input',()=>{assert.throws(()=>compose({prompt:''}));assert.throws(()=>compose({prompt:'test',mode:'code'}));});
