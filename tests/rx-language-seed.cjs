'use strict';
const assert=require('node:assert/strict');
const {LANGUAGES,ENTRIES,lookup}=require('../rx-language-seed.cjs');
assert.deepEqual(LANGUAGES,['pl','de','en','uk']);
assert.equal(ENTRIES.length,7);
assert.equal(new Set(ENTRIES.map(entry=>entry.id)).size,ENTRIES.length);
for(const entry of ENTRIES){
 for(const lang of LANGUAGES){
  assert.equal(typeof entry[lang],'string');
  assert.ok(entry[lang].trim());
  const found=lookup(entry[lang],lang);
  assert.equal(found?.id,entry.id);
  assert.equal(found?.translations[lang],entry[lang]);
 }
}
assert.equal(lookup('','pl'),null);
assert.equal(lookup('Szukaj','fr'),null);
assert.equal(lookup('losowe zdanie','pl'),null);
console.log('PASS RX LANGUAGE SEED (4 languages, 7 public UI labels)');
