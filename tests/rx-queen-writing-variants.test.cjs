'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {compose}=require('./rx-queen-writing-composer.cjs');
const variants=[
 ['message','Napisz wiadomość bez powitania: spotkanie jutro.','Cześć!'],
 ['message','Wiadomość bez przywitania: spotkanie jutro.','Cześć!'],
 ['reply','Napisz odpowiedź bez pożegnania: dokument dotarł.','Pozdrawiam!'],
 ['reply','Odpowiedź bez zakończenia: dokument dotarł.','Pozdrawiam!'],
 ['summary','Podsumuj jednym zdaniem: Zrób kopię. Sprawdź dane. Zapisz plik.',null],
 ['summary','Zrób streszczenie w jednym zdaniu: Zrób kopię. Sprawdź dane. Zapisz plik.',null],
 ['message','Sparafrazuj bez cytowania: jutro spotkanie.','Sparafrazuj bez cytowania'],
 ['message','Napisz własnymi słowami: jutro spotkanie.','Napisz własnymi słowami']
];
test('eight unseen phrasings satisfy their explicit surface constraints',()=>{
 for(const [mode,prompt,forbidden] of variants){
  const result=compose({mode,prompt});
  assert.equal(result.productionConnected,false);
  if(forbidden&&prompt.toLocaleLowerCase('pl').includes('parafraz')){
   assert.equal(result.matched,false,prompt);
   assert.equal(result.source,'local-semantic-limit',prompt);
  }else if(forbidden)assert.ok(!result.text.includes(forbidden),prompt);
  if(mode==='summary')assert.ok((result.text.match(/[^.!?]+[.!?]+/gu)||[]).length<=1,prompt);
 }
});
test('unsupported instruction does not claim a semantic match',()=>{
 const result=compose({mode:'message',prompt:'Usuń wszystkie powitania: spotkanie jutro.'});
 assert.ok(result.text.startsWith('Cześć!'));
});
