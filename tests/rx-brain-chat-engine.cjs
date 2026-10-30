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
