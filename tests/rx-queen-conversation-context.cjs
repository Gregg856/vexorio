'use strict';
const assert=require('node:assert/strict');
const {chatRX}=require('../rx-brain-chat-engine.cjs');
for(const text of ['Jak się masz?','Możemy porozmawiać?']){
 const answer=chatRX(text).answer;
 assert.match(answer,/możemy rozmawiać/i);
}
assert.match(chatRX('Chcę nauczyć Królową rozmawiać').answer,/nauczyć Królową rozmawiać/);
assert.match(chatRX('Niezrozumiała wiadomość bez rozpoznanego zadania').answer,/Nie rozpoznano zadania/);
assert.equal(chatRX('2 + 3').answer,'Wynik: 5');
assert.match(chatRX('Co dalej?',{history:['Sprawdź model']}).answer,/Kontynuuję temat/);
assert.match(chatRX('Co dalej?',{history:['Sprawdź model','Gotowe']}).answer,/Sprawdź model/);
assert.match(chatRX('Dalej',{history:['Napraw klawiaturę w czacie','ok','zielone']}).answer,/Napraw klawiaturę w czacie/);
assert.equal(chatRX('Dalej',{history:['ok','gotowe']}).contextUsed,false);
assert.match(chatRX('Dalej',{history:['ok','gotowe']}).answer,/Nie mam wcześniejszego kontekstu/);
console.log('PASS RX QUEEN CONVERSATIONAL RESPONSES');
