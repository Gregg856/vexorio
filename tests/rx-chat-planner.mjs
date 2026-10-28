import assert from 'node:assert/strict';
import {planRXChat} from '../rx-chat-planner.mjs';
const p=planRXChat('Sprawdź testy i chmurę');
assert.deepEqual(p.tasks.map(x=>x.action),['inspect_tests','plan_cloud_checks']);
assert.equal(p.executed,0);
assert.equal(p.plan.queen.requiresApproval,true);
assert.equal(planRXChat('A chmura?',['Sprawdź testy']).contextUsed,true);
assert.doesNotThrow(()=>planRXChat('x'.repeat(8000)));
assert.throws(()=>planRXChat('x'.repeat(8001)),TypeError);
assert.doesNotThrow(()=>planRXChat('test',Array(20).fill('poprzednia wiadomość')));
assert.throws(()=>planRXChat('test',Array(21).fill('poprzednia wiadomość')),TypeError);
assert.match(planRXChat('Opowiedz o RX Neural Core').answer,/RX Neural Core/);
assert.match(planRXChat('A jak działa?',['Opowiedz o RX Neural Core']).answer,/RX Neural Core/);
assert.match(planRXChat('Co robi RX Math Core?').answer,/RX Math Core/);
assert.match(planRXChat('Jak działa pamięć RX?').answer,/Zapamiętaj:|Przypomnij:/i);
assert.match(planRXChat('RX DOT: [1,2]; [3,4]').answer,/11/);
assert.match(planRXChat('RX DOT: [1,2]; [3]').answer,/Nieprawidłowe/);
assert.match(planRXChat('RX DOT: [1,2]; [abc,4]').answer,/Nieprawidłowe/);
assert.equal(planRXChat('RX DOT: [1,2]; [3,4]').executed,0);
assert.match(planRXChat('RX MADD: [[1,2],[3,4]]; [[5,6],[7,8]]').answer,/\[\[6,8\],\[10,12\]\]/);
assert.match(planRXChat('RX MMUL: [[1,2]]; [[3],[4]]').answer,/\[\[11\]\]/);
assert.match(planRXChat('RX MMUL: [[1,2]]; [[3,4]]').answer,/Nieprawidłowe/);
assert.match(planRXChat('RX MADD: [[1,2]]; [[3]]').answer,/Nieprawidłowe/);
assert.equal(planRXChat('RX MMUL: [[1,2]]; [[3],[4]]').executed,0);
console.log('RX chat planner OK');

import catalog from '../rx-task-catalog.cjs';
for(const rule of catalog.RULES){
 const result=planRXChat(rule.words[0]);
 assert.ok(result.tasks.some(task=>task.action===rule.id&&task.module===rule.module&&task.role===rule.role), 'Catalog parity: '+rule.id);
}

for(const [prompt,expected] of [
 ['Bibi','Cześć'],['Cześć','Cześć'],['Co robią mrówki?','Mrówki'],
 ['Jak działa wirnik?','Wirnik'],['Buduj dalej','Rozwijamy'],
 ['status RX','Czat RX'],['pomoc','Napisz']
]){
 const result=planRXChat(prompt);
 assert.ok(result.answer.includes(expected),prompt+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.plan.queen.requiresApproval,true);
}
console.log('RX natural dialogue intents OK');

for(const [question,history,expected] of [
 ['A jak działa?',['Opowiedz o wirniku'],'Wirnik'],
 ['A co z nimi?',['Co robią mrówki?'],'Mrówki'],
 ['Dalej',['Jak działa wirnik?'],'Wirnik']
]){
 const result=planRXChat(question,history);
 assert.equal(result.contextUsed,true);
 assert.ok(result.answer.includes(expected),question+' -> '+result.answer);
 assert.equal(result.executed,0);
}

for(const [prompt,expected] of [
 ['Jakie testy wykonać?','Mogę wskazać testy'],
 ['Mam błąd','Opisz błąd'],
 ['Pokaż kolejkę','Kolejka Warsztatu'],
 ['Czy to bezpieczne?','Wykonanie zatwierdzonych'],
 ['Czy to darmowe?','RX korzysta'],
 ['Jak działa Wikipedia?','Mogę szukać faktów'],
 ['Co z moimi danymi?','Dostęp do panelu'],
 ['Co dalej?','Najpierw sprawdź'],
 ['Co umiesz?','Mogę rozmawiać'],
 ['Jak działa Cloudflare?','Cloudflare udostępnia']
]){
 const result=planRXChat(prompt);
 assert.ok(result.answer.includes(expected),prompt+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.modelInferenceUsed,false);
}
console.log('RX Brain ten additional intents OK');

const focused=planRXChat('Dalej',['Opowiedz o mrówkach','Sprawdź testy','Jak działa wirnik?']);
assert.ok(focused.answer.includes('Wirnik'),focused.answer);
assert.ok(!focused.tasks.some(t=>t.action==='inspect_tests'),'Old test topic should not leak into follow-up');
assert.equal(focused.contextUsed,true);
console.log('RX focused conversation context OK');

const multi=planRXChat('Sprawdź mrówki, pokaż błędy i powiedz co dalej');
assert.equal(multi.multiIntent,true);
assert.deepEqual(multi.intents,['ants','errors','next']);
assert.ok(multi.answer.includes('1. 🐜 Mrówki'));
assert.ok(multi.answer.includes('2. 🔧 Błędy'));
assert.ok(multi.answer.includes('3. 👑 Kolejne kroki'));
assert.equal(multi.executed,0);
assert.equal(planRXChat('Cześć').multiIntent,false);
console.log('RX multi-intent conversation OK');

const planReply=planRXChat('Zrób drugi punkt',['1. Sprawdź Mrówki\n2. Odczytaj raport błędów\n3. Przygotuj testy']);
assert.ok(planReply.answer.includes('Punkt 2'),planReply.answer);
assert.ok(planReply.answer.includes('Odczytaj raport błędów'),planReply.answer);
assert.equal(planReply.executed,0);
assert.ok(planRXChat('Zrób drugi punkt').answer.includes('Nie widzę'));
assert.equal(planRXChat('Co z tym?',['Jak działa wirnik?']).contextUsed,true);
console.log('RX Brain 3.2 followups OK');
