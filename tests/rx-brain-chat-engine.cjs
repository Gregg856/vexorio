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

// Regression: assistant replies must never replace the last user topic.
const mixedTopics=[
 'Napraw czat Android','Mogę zaproponować diagnostykę.',
 'Sprawdź RX MRÓWKI','Ostatni przebieg CI nie potwierdza pracy na żywo.',
 'Dalej','Kontynuuję temat: Sprawdź RX MRÓWKI.'
];
const mixedFollowup=chatRX('Kontynuuj',{history:mixedTopics});
assert.equal(mixedFollowup.contextUsed,true);
assert.match(mixedFollowup.answer,/Sprawdź RX MRÓWKI/);
assert.doesNotMatch(mixedFollowup.answer,/Ostatni przebieg CI/);
const mixedReturn=chatRX('Wróć do poprzedniego tematu',{history:mixedTopics});
assert.match(mixedReturn.answer,/Napraw czat Android/);
console.log('RX Brain: multi-topic user-turn regression OK');


for(const question of ['Czy testy są zielone?','Jaki wynik testów?','Czy to już naprawione?']){
 const result=chatRX(question,{history:['Błąd czatu Android','Zielone']});
 assert.match(result.answer,/Nie mam potwierdzonego wyniku GitHub Actions/,question);
 assert.equal(result.executed,0,question);
}
assert.match(chatRX('Czy testy są zielone?').answer,/Nie mam potwierdzonego wyniku/);
console.log('RX BIBI level 5: unverified status claims are not treated as evidence');

const taskRegister=[
 {title:'Naprawa klawiatury Android',status:'completed'},
 {title:'Weryfikacja czatu',status:'pending'}
];
const completedReport=chatRX('Co już zrobione?',{tasks:taskRegister});
assert.match(completedReport.answer,/Naprawa klawiatury Android/);
assert.doesNotMatch(completedReport.answer,/Weryfikacja czatu/);
assert.match(completedReport.answer,/Nie potwierdzam ich testów/);
assert.equal(completedReport.completedCount,1);
assert.equal(completedReport.executed,0);
assert.match(chatRX('Co już zrobione?').answer,/Brak zadań oznaczonych/);
assert.throws(()=>chatRX('Hej',{tasks:[{title:'Zadanie',status:'verified'}]}),/Invalid tasks/);
assert.throws(()=>chatRX('Hej',{tasks:[{title:'',status:'completed'}]}),/Invalid tasks/);
console.log('RX BIBI level 6: explicit task register and safe completion reporting checked');
for(const [question,expected] of [['Co z zadaniem Naprawa klawiatury Android?',/Naprawa klawiatury Android.*ukończone/],['Czy zakończono zadanie Weryfikacja czatu?',/Weryfikacja czatu.*oczekujące/],['Co z zadaniem nieznane?',/Nie znalazłam dokładnego zadania/]]){
 const result=chatRX(question,{tasks:taskRegister});
 assert.match(result.answer,expected,question);
 assert.equal(result.executed,0,question);
}
console.log('RX Brain: natural task lookup uses supplied registry');
const shortStatus=chatRX('A jaki status?',{history:['Naprawa klawiatury Android','Weryfikuję wpis.'],tasks:taskRegister});
assert.match(shortStatus.answer,/Naprawa klawiatury Android.*ukończone/);
assert.equal(shortStatus.executed,0);
assert.match(chatRX('A to zadanie?',{tasks:taskRegister}).answer,/Podaj dokładną nazwę/);
assert.match(chatRX('Czy to już gotowe?',{history:['Nieznane zadanie'],tasks:taskRegister}).answer,/Podaj dokładną nazwę/);
console.log('RX Brain: short task follow-up and missing context checked');

for(const [prompt,expected] of [['2 + 3','Wynik: 5'],['Oblicz 7 * 8','Wynik: 56'],['Policz 10 / 4','Wynik: 2.5'],['Ile to 9 - 12?','Wynik: -3'],['2,5 + 1,5','Wynik: 4'],['5 / 0','Nie można dzielić przez zero.']]){
 const result=chatRX(prompt);
 assert.equal(result.answer,expected,prompt);
 assert.equal(result.executed,0,prompt);
}
console.log('RX existing brain: bounded arithmetic verified');

for(const followup of ['Kontynuuj','Wróć do tego','Wroc do tego']){
 const result=chatRX(followup,{history:['Błąd czatu Android','Dzięki','Super']});
 assert.equal(result.contextUsed,true,followup);
 assert.match(result.answer,/Błąd czatu Android/,followup);
 assert.equal(result.executed,0,followup);
}
assert.match(chatRX('Kontynuuj').answer,/Nie mam wcześniejszego kontekstu/);
console.log('RX Polish follow-up and acknowledgement memory tests OK');

for(const [prompt,expected] of [['translate pl to de: Szukaj','Suchen'],['translate de to en: Suchen','Search'],['translate en to uk: Search','Пошук'],['przetlumacz uk to pl: Пошук','Szukaj']]){
 const result=chatRX(prompt);
 assert.ok(result.answer.includes(expected),prompt);
 assert.equal(result.executed,0,prompt);
}
assert.match(chatRX('translate pl to de: nieznane slowo').answer,/Nie znam/);
console.log('RX brain reuses existing 4-language VEXORIO vocabulary');

const conversationCases=[
 ['Cześć BIBI',/Cześć/],
 ['Oblicz 7 * 8',/Wynik: 56/],
 ['translate pl to de: Szukaj',/Suchen/],
 ['Kontynuuj',/Nie mam wcześniejszego kontekstu/],
 ['Czy testy są zielone?',/Nie mam potwierdzonego wyniku/],
 ['Usuń wszystkie dane produkcyjne',/Nie wykonam/],
 ['Jak ugotować ryż?',/Nie rozpoznano zadania|Rozpoznano zadania/],
 ['What is the weather?',/Nie rozpoznano zadania|Rozpoznano zadania/]
];
for(const [question,expected] of conversationCases){
 const result=chatRX(question);
 assert.match(result.answer,expected,question);
 assert.equal(result.executed,0,question);
}
console.log('RX conversation audit: 8 known capabilities and gaps recorded');
for(const question of ['Jak mogę ulepszyć RX Brain?','W jaki sposób poprawić pamięć Królowej?']){
 const result=chatRX(question);
 assert.match(result.answer,/Pytasz o sposób działania/);
 assert.match(result.answer,/Nie uruchomiłam żadnej operacji/);
 assert.equal(result.executed,0);
}
console.log('RX Brain: open-ended how-to intent checked');

const {chatRXWithKnowledge}=require('../rx-brain-chat-engine.cjs');
(async()=>{
 const lookup=async()=>({summary:'Ryż to produkt spożywczy.',url:'https://pl.wikipedia.org/wiki/Ry%C5%BC'});
 const result=await chatRXWithKnowledge('Co to jest ryż?',{knowledgeLookup:lookup});
 assert.match(result.answer,/Ryż to produkt spożywczy/);
 assert.match(result.answer,/Źródło: https:\/\/pl.wikipedia.org/);
 assert.equal(result.executed,0);
 const unknown=await chatRXWithKnowledge('Co to jest ryż?',{knowledgeLookup:async()=>null});
 assert.equal(unknown.answer,chatRX('Co to jest ryż?').answer);
 const unsafe=await chatRXWithKnowledge('Co to jest ryż?',{knowledgeLookup:async()=>({summary:'fake',url:'https://example.com'})});
 assert.equal(unsafe.answer,chatRX('Co to jest ryż?').answer);
 const noFetch=await chatRXWithKnowledge('Usuń wszystkie dane produkcyjne',{knowledgeLookup:()=>{throw Error('should not call');}});
 assert.match(noFetch.answer,/Nie wykonam/);
 console.log('RX sourced everyday knowledge: verified and safe fallback');
})().catch(e=>{console.error(e);process.exitCode=1;});
