'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseIntent}=require('./rx-queen-intent-parser.cjs');
const {compose}=require('./rx-queen-writing-composer.cjs');
const cases=[
 ['message','Bez powitania napisz wiadomość: zebranie jutro.','noGreeting'],
 ['message','Napisz bez przywitania wiadomość: zebranie jutro.','noGreeting'],
 ['reply','Bez pożegnania odpowiedz: otrzymałem plik.','noSignoff'],
 ['reply','Odpowiedz proszę bez zakończenia: otrzymałem plik.','noSignoff'],
 ['summary','Podsumuj proszę w jednym zdaniu: Najpierw A. Potem B.','oneSentence'],
 ['summary','Streszcz tekst jednym zdaniem: Najpierw A. Potem B.','oneSentence'],
 ['message','Napisz wiadomość własnymi słowami: jutro spotkanie.','paraphrase'],
 ['message','Przepisz tekst bez cytowania: jutro spotkanie.','paraphrase']
];
test('parser recognizes constraints in different word orders',()=>{
 for(const [mode,prompt,expected] of cases){
  const parsed=parseIntent({mode,prompt});
  assert.equal(parsed.recognized,true,prompt);
  assert.ok(parsed.constraints.includes(expected),prompt);
  assert.ok(!parsed.content.includes(':'),prompt);
 }
});
test('composer follows surface constraints for shuffled instructions',()=>{
 for(const [mode,prompt,kind] of cases){
  const out=compose({mode,prompt});
  if(kind==='noGreeting')assert.ok(!out.text.includes('Cześć!'),prompt);
  if(kind==='noSignoff')assert.ok(!out.text.includes('Pozdrawiam!'),prompt);
  if(kind==='oneSentence')assert.ok((out.text.match(/[^.!?]+[.!?]+/gu)||[]).length<=1,prompt);
  if(kind==='paraphrase'){
   assert.equal(out.matched,false,prompt);
   assert.equal(out.source,'local-semantic-limit',prompt);
   assert.equal(out.requiresClarification,true,prompt);
   assert.equal(out.productionConnected,false,prompt);
  }
 }
});
test('unrecognized content and mismatched modes are not stripped',()=>{
 for(const prompt of ['Uwaga: spotkanie jutro.','Napisz bez powitania wiadomość: spotkanie jutro.']){
  const mode=prompt.startsWith('Uwaga')?'message':'summary';
  assert.equal(parseIntent({prompt,mode}).content,prompt);
 }
});
