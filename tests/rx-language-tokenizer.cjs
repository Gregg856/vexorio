'use strict';
const assert=require('node:assert/strict');
const {BOS,EOS,tokenize,detokenize,toFrequencyVector}=require('../rx-language-tokenizer.cjs');
for(const value of ['','Zażółć gęślą jaźń! 👑','Cześć Królowo 🤠','Привіт!','Hallo RX','a\u0000b']){
 const tokens=tokenize(value);
 assert.equal(tokens.ids[0],BOS);
 assert.equal(tokens.ids.at(-1),EOS);
 assert.equal(detokenize(tokens.ids),value);
 assert.equal(tokens.byteLength,Buffer.byteLength(value,'utf8'));
}
assert.equal(toFrequencyVector('A').length,256);
assert.ok(Math.abs(toFrequencyVector('AB').reduce((a,b)=>a+b,0)-1)<1e-6);
assert.throws(()=>tokenize('a'.repeat(16385)),/too long/);
assert.throws(()=>detokenize([300]),/unknown token/i);
assert.throws(()=>detokenize([255]),/utf-8/i);
console.log('PASS RX LANGUAGE TOKENIZER');
