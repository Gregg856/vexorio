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

assert.match(chatRX('Cześć BIBI').answer,/Cześć/);
assert.match(chatRX('Czat zasłania klawiatura Android').answer,/kroki odtworzenia/i);
assert.match(chatRX('Czy RX działa 24 godziny na dobę?').answer,/nie mogę potwierdzić/i);
assert.match(chatRX('Usuń wszystkie dane produkcyjne').answer,/nie wykonam/i);
assert.match(chatRX('Pokaż sprawdzone naprawy czatu').answer,/GitHub/i);
assert.match(chatRX('Błąd faktury w płatnościach').answer,/faktury/i);
for(const prompt of ['Cześć BIBI','Czat zasłania klawiatura Android','Czy RX działa 24 godziny na dobę?','Usuń wszystkie dane produkcyjne','Pokaż sprawdzone naprawy czatu','Błąd faktury w płatnościach'])assert.equal(chatRX(prompt).executed,0);

const variants=[
 ['  Cześć   BIBI  ',/Cześć/],
 ['Na Androidzie chat przykrywa klawiaturę',/kroki odtworzenia/i],
 ['Telefon Android: ekran nachodzi na klawiaturę',/kroki odtworzenia/i],
 ['Problem z przelewem bankowym',/faktury lub płatności/i],
 ['Błąd transakcji',/faktury lub płatności/i],
 ['Kasuj wszystkie dane produkcyjne',/Nie wykonam/i],
 ['Wymaż bazę danych produkcyjnych',/Nie wykonam/i],
 ['A co z chmurą?',/Rozpoznano|Nie rozpoznano/]
];
for(const [prompt,expected] of variants){
 const response=chatRX(prompt);
 assert.match(response.answer,expected,prompt);
 assert.equal(response.executed,0,prompt);
}
console.log('RX BIBI level 2: '+variants.length+' variant cases checked');

const topic='Czat zasłania klawiatura Android';
for(const followup of ['Dalej','Sprawdź to','A co z tym?','Co dalej?']){
 const result=chatRX(followup,{history:[topic]});
 assert.equal(result.contextUsed,true,followup);
 assert.match(result.answer,/klawiatura Android/i,followup);
 assert.match(result.answer,/nie potwierdzam wyniku testu/i,followup);
 assert.equal(result.executed,0,followup);
}
assert.match(chatRX('Dalej').answer,/Nie mam wcześniejszego kontekstu/);
assert.equal(chatRX('Dalej').contextUsed,false);
assert.equal(chatRX('Dalej').executed,0);
console.log('RX BIBI level 3: context follow-ups and missing context checked');

const multiTurn=chatRX('Dalej',{history:['Czat zasłania klawiatura Android','Gotowe','Sprawdź to','Zielone']});
assert.equal(multiTurn.contextUsed,true);
assert.match(multiTurn.answer,/Czat zasłania klawiatura Android/);
assert.doesNotMatch(multiTurn.answer,/Kontynuuję temat: Zielone/);
assert.equal(multiTurn.executed,0);
const missingTopic=chatRX('Dalej',{history:['Gotowe','Zielone','Ok']});
assert.equal(missingTopic.contextUsed,false);
assert.match(missingTopic.answer,/Nie mam wcześniejszego kontekstu/);
const recentTopic=chatRX('Sprawdź to',{history:['Błąd faktury','Gotowe','Klawiatura Android zasłania czat','Zielone']});
assert.match(recentTopic.answer,/Klawiatura Android zasłania czat/);
console.log('RX BIBI level 4: multi-turn topic retrieval checked');
