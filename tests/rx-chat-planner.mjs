import assert from 'node:assert/strict';
import {planRXChat} from '../rx-chat-planner.mjs';
// Current-turn preferences are learned immediately, without trusting assistant replies.
const currentPreference=planRXChat('Wolę krótkie odpowiedzi i konkretne kroki.');
assert.ok(currentPreference.learning.preferences.includes('Wolę krótkie odpowiedzi i konkretne kroki.'));
const assistantOnly=planRXChat('Cześć',['Cześć','Wolę długie odpowiedzi i żarty.']);
assert.ok(!assistantOnly.learning.preferences.includes('Wolę długie odpowiedzi i żarty.'));
assert.equal(currentPreference.learning.trainingPerformed,false);
const repeatedPreference=planRXChat('Wolę krótkie odpowiedzi i konkretne kroki.',['Wolę krótkie odpowiedzi i konkretne kroki.','Dobrze, zapamiętam.']);
assert.deepEqual(repeatedPreference.learning.preferences,['Wolę krótkie odpowiedzi i konkretne kroki.']);

// RX BIBI: explicit session preferences can be recalled, but are not permanent model training.
const learnedPreference=planRXChat('Jakie preferencje pamiętasz?',['Wolę krótkie odpowiedzi i konkretne kroki.','Rozumiem.']);
assert.match(learnedPreference.answer,/Wolę krótkie odpowiedzi/);
assert.equal(learnedPreference.learning.trainingPerformed,false);
assert.doesNotMatch(planRXChat('Jakie preferencje pamiętasz?',['Cześć','Wolę długie odpowiedzi.']).answer,/Wolę długie odpowiedzi/);
assert.match(planRXChat('Jakie preferencje pamiętasz?').answer,/Nie widzę jeszcze/);

// RX BIBI #707: short commands retain user context and do not claim execution.
const context=['Chcę poprawić pamięć BIBI.','Omówmy plan.'];
assert.match(planRXChat('Rób',context).answer,/kontynuować temat:.*pamięć BIBI/);
assert.match(planRXChat('Popraw',context).answer,/poprawić temat:.*pamięć BIBI/);
assert.match(planRXChat('Sprawdź',context).answer,/sprawdzić temat:.*pamięć BIBI/);
assert.match(planRXChat('Rób',context).answer,/nie wykonałam automatycznie/);
assert.equal(planRXChat('Rób',context).executed,0);
assert.match(planRXChat('Rób').answer,/Do czego nawiązujesz/);

// Regression for the exact customer message (Polish genitive plural: "mrówek").
assert.match(planRXChat('Porozmawiajmy o zwiększeniu mocy naszych mrówek RX.').answer,/Aby zwiększyć moc mrówek RX/);
assert.doesNotMatch(planRXChat('Porozmawiajmy o zwiększeniu mocy naszych mrówek RX.').answer,/Co najbardziej Cię w tym temacie interesuje/);
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
assert.match(planRXChat('Jak działa pamięć RX?').answer,/Zapamiętaj|Przypomnij/i);
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

// Real customer phrases must stay conversational and must not trigger privileged work.
for(const [question,expected] of [
 ['Jak się masz?','Co u Ciebie'],
 ['Co u ciebie?','Co u Ciebie'],
 ['Dziękuję bardzo','Nie ma za co'],
 ['Dzięki za pomoc','Nie ma za co'],
 ['Mam pytanie','napisz, w czym'],
 ['Czy możesz mi pomóc?','napisz, w czym']
]){
 const result=planRXChat(question);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work,null);
}
console.log('RX customer small-talk regression OK');

// Consecutive customer turns should not receive an identical canned answer.
for(const prompt of ['Jak się masz?','Dziękuję bardzo','Mam pytanie']){
 const first=planRXChat(prompt);
 const second=planRXChat(prompt,[prompt,first.answer]);
 assert.notEqual(second.answer,first.answer,'Repeated response: '+prompt);
 assert.equal(second.executed,0);
 assert.equal(second.tasks.length,0);
 assert.equal(second.plan.work,null);
}
console.log('RX repeated reply regression OK');

for(const [question,expected] of [
 ['Ile to jest 12 plus 8?','Wynik: 20'],
 ['Oblicz 9 razy 7','Wynik: 63'],
 ['Policz 10 podzielić przez 4','Wynik: 2.5'],
 ['Ile to jest 3 minus 9?','Wynik: -6'],
 ['Ile to jest 5 podzielić przez 0','Nie można dzielić przez zero']
]){
 const result=planRXChat(question);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work,null);
}
console.log('RX natural arithmetic regression OK');

for(const [question,expected] of [
 ['Ile to jest 20% z 150?','Wynik: 30'],
 ['Oblicz 12,5% z 80','Wynik: 10'],
 ['Policz 0% z 999','Wynik: 0'],
 ['Ile to jest 100% z 24?','Wynik: 24']
]){
 const result=planRXChat(question);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work,null);
}
console.log('RX percentage arithmetic regression OK');

// RX BIBI 3.7: price changes must calculate correctly, not just pass syntax checks.
for(const [question,expected] of [
 ['Oblicz rabat 20% od 150 euro','Cena po rabacie: 120'],
 ['Policz podwyżce 10% od 200 euro','Cena po podwyżce: 220'],
 ['Oblicz rabat 110% od 150 euro','Rabat nie może przekraczać 100%'],
 ['Oblicz rabat 12,5% od 80 euro','Cena po rabacie: 70']
]){
 const result=planRXChat(question);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work,null);
}
console.log('RX price change regression OK');

// RX BIBI 3.8: natural language price queries.
for(const [question,expected] of [
 ['Produkt kosztuje 200 euro, ile zapłacę po rabacie 15%?','Cena po rabacie: 170'],
 ['Towar kosztuje 100 euro, ile zapłacę po podwyżce 10%?','Cena po podwyżce: 110'],
 ['Produkt kosztuje 80 euro, ile zapłacę po rabacie 12,5%?','Cena po rabacie: 70'],
 ['Produkt kosztuje 200 euro, ile zapłacę po rabacie 120%?','Rabat nie może przekraczać 100%']
]){
 const result=planRXChat(question);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work,null);
}
console.log('RX natural price regression OK');

// RX BIBI 3.9: alternate word order and amount-first questions.
for(const [question,expected] of [
 ['Produkt za 200 euro po rabacie 15%','Cena po rabacie: 170'],
 ['Jaka będzie cena po rabacie 20% od 150 euro?','Cena po rabacie: 120'],
 ['Ile zapłacę po podwyżce 10% od 100 euro?','Cena po podwyżce: 110'],
 ['Produkt za 80 euro po rabacie 12,5%','Cena po rabacie: 70']
]){
 const result=planRXChat(question);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work,null);
}
console.log('RX alternate price regression OK');

// RX BIBI 4.0: the next user turn must use the prior user's price, not the assistant's answer.
for(const [previous,followup,expected] of [
 ['Produkt kosztuje 200 euro, ile zapłacę po rabacie 15%?','A przy 25%?','150'],
 ['Towar kosztuje 100 euro, ile zapłacę po podwyżce 10%?','A przy 20%?','120'],
 ['Jaka będzie cena po rabacie 20% od 150 euro?','A przy 10%?','135']
]){
 const prior=planRXChat(previous);
 const result=planRXChat(followup,[previous,prior.answer]);
 assert.ok(result.answer.includes(expected),followup+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work,null);
}
console.log('RX contextual price regression OK');

// RX BIBI 4.1: retrieve a price from several prior USER turns.
for(const [history,question,expected] of [
 [['Produkt kosztuje 200 euro, ile zapłacę po rabacie 15%?','🧮 Cena po rabacie: 170','Dziękuję','Nie ma za co!'],'A przy 25%?','150'],
 [['Towar kosztuje 100 euro, ile zapłacę po podwyżce 10%?','🧮 Cena po podwyżce: 110','Mam pytanie','Słucham.'],'A przy 20%?','120'],
 [['Produkt kosztuje 200 euro, ile zapłacę po rabacie 15%?','🧮 Cena po rabacie: 170','Towar kosztuje 80 euro, ile zapłacę po rabacie 10%?','🧮 Cena po rabacie: 72'],'A przy 25%?','60']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work,null);
}
console.log('RX multi-turn price regression OK');

// RX BIBI 4.2: an explicit topic switch must prevent stale price reuse.
for(const switchPhrase of ['Zmieńmy temat','Zmiana tematu','Nowy temat']){
 const result=planRXChat('A przy 25%?',[
  'Produkt kosztuje 200 euro, ile zapłacę po rabacie 15%?',
  '🧮 Cena po rabacie: 170',
  switchPhrase,
  'Jasne, zmieńmy temat.'
 ]);
 assert.ok(!result.answer.includes('150'),switchPhrase+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
}
console.log('RX topic-switch price regression OK');

// RX BIBI 4.3: quantities use unit prices from USER turns only.
for(const [history,question,expected] of [
 [['Produkt kosztuje 50 euro','Rozumiem.'],'A ile za dwa takie produkty?','2 szt. po 50 = 100'],
 [['Towar za 12,5 euro','Rozumiem.'],'A ile za trzy takie produkty?','3 szt. po 12.5 = 37.5'],
 [['Produkt kosztuje 20 euro','Rozumiem.','Produkt kosztuje 7 euro','Rozumiem.'],'A ile za cztery takie produkty?','4 szt. po 7 = 28']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
}
const changedTopic=planRXChat('A ile za dwa takie produkty?',[
 'Produkt kosztuje 50 euro','Rozumiem.','Zmieńmy temat','Jasne.'
]);
assert.ok(!changedTopic.answer.includes('100'),changedTopic.answer);
assert.equal(changedTopic.executed,0);
console.log('RX quantity follow-up regression OK');

// RX BIBI 4.4: quantity plus discount uses the most recent unit price.
for(const [history,question,expected] of [
 [['Produkt kosztuje 50 euro','Rozumiem.'],'A ile zapłacę za trzy sztuki z rabatem 10%?','3 szt. po 50 z rabatem 10% = 135'],
 [['Towar za 12,5 euro','Rozumiem.'],'Ile zapłacę za dwa sztuki z rabatem 20%?','2 szt. po 12.5 z rabatem 20% = 20'],
 [['Produkt kosztuje 20 euro','Rozumiem.','Produkt kosztuje 7 euro','Rozumiem.'],'A ile zapłacę za cztery sztuki z rabatem 0%?','4 szt. po 7 z rabatem 0% = 28'],
 [['Produkt kosztuje 50 euro','Rozumiem.'],'A ile zapłacę za trzy sztuki z rabatem 110%?','Rabat nie może przekraczać 100%']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
}
const switched=planRXChat('A ile zapłacę za trzy sztuki z rabatem 10%?',[
 'Produkt kosztuje 50 euro','Rozumiem.','Zmieńmy temat','Jasne.'
]);
assert.ok(!switched.answer.includes('135'),switched.answer);
console.log('RX quantity discount regression OK');

// RX BIBI 4.5: bounded colloquial phrasing and common typos.
for(const [question,expected] of [
 ['A ile wyjdzie za trzy sztuki z rabatem 10%?','135'],
 ['A ile zaplacee za trzy sztuki z rabatem 10%?','135'],
 ['A ile zapłacę za trzy sztuki z rabtem 10%?','135'],
 ['A ile zapłacę za trzy sztukii z rabatem 10%?','135']
]){
 const result=planRXChat(question,['Produkt kosztuje 50 euro','Rozumiem.']);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
}
console.log('RX colloquial price regression OK');

// RX BIBI 4.6: safe everyday digital literacy without privileged work.
for(const [question,expected] of [
 ['Co to jest phishing?','Phishing to próba wyłudzenia'],
 ['Co to jest spam?','Spam to niechciane'],
 ['Wyjaśnij kopia zapasowa','Kopia zapasowa to'],
 ['Co to jest hasło jednorazowe?','Nie przekazuj go innym'],
 ['Jak zrobić bezpieczne hasło?','unikalnego hasła'],
 ['Pomóż mi ustawić kopię zapasową','Sprawdź, czy potrafisz ją przywrócić']
]){
 const result=planRXChat(question,[]);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
console.log('RX everyday digital safety regression OK');

// RX BIBI 4.7: follow-up uses USER history only and honors topic boundaries.
for(const [history,question,expected] of [
 [['Co to jest phishing?','Wyjaśnienie.'],'A jak się przed tym chronić?','Aby unikać phishingu'],
 [['Co to jest phishing?','Wyjaśnienie.'],'Podaj przykład','Przykład phishingu'],
 [['Co to jest spam?','Wyjaśnienie.'],'Jak się przed tym chronić?','Nie odpowiadaj na podejrzany spam'],
 [['Co to jest kopia zapasowa?','Wyjaśnienie.'],'Daj przykład','Przykład: trzymaj ważne zdjęcia']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
}
const afterSwitch=planRXChat('Podaj przykład',['Co to jest phishing?','Wyjaśnienie.','Zmieńmy temat','Jasne.']);
assert.ok(!afterSwitch.answer.includes('Przykład phishingu'),afterSwitch.answer);
console.log('RX everyday contextual follow-up regression OK');

// RX BIBI 4.8: natural short followups in bounded digital-safety context.
for(const [history,question,expected] of [
 [['Co to jest phishing?','Wyjaśnienie.'],'Dlaczego?','oszuści próbują'],
 [['Co to jest spam?','Wyjaśnienie.'],'Możesz prościej?','Spam to niechciane wiadomości'],
 [['Co to jest kopia zapasowa?','Wyjaśnienie.'],'A co dalej?','Zapisz kopię ważnych plików'],
 [['Co to jest phishing?','Wyjaśnienie.'],'A co dalej?','nie klikaj linku']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
}
const naturalSwitch=planRXChat('Dlaczego?',['Co to jest phishing?','Wyjaśnienie.','Zmieńmy temat','Jasne.']);
assert.ok(!naturalSwitch.answer.includes('oszuści próbują'),naturalSwitch.answer);
console.log('RX natural follow-up regression OK');

// RX BIBI 4.9: explanation versus requested execution, never perform account actions.
for(const [question,expected] of [
 ['Jak usunąć konto?','Aby zmienić lub usunąć dane konta'],
 ['Jak zmienić hasło?','Aby zmienić lub zresetować hasło'],
 ['Usuń moje konto','nie ma uprawnień'],
 ['Zmień mi hasło','nie ma uprawnień'],
 ['Zresetuj moje hasło','nie ma uprawnień']
]){
 const result=planRXChat(question,[]);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
console.log('RX action-intent regression OK');

// RX BIBI 5.0: cross-feature smoke matrix (daily life, math, context, privacy).
for(const [question,history,expected] of [
 ['Jak sprawdzić link jest bezpieczny?',[],'Sprawdź dokładny adres'],
 ['Jak sprawdzić aktualizacje telefonu?',[],'Aktualizacja oprogramowania'],
 ['Jak sprawdzić miejsce w telefonie?',[],'Ustawienia'],
 ['Jak zrobić kopia zapasowa telefonu?',[],'ustawienia kopii zapasowej'],
 ['Co to jest phishing?',[],'Phishing to próba wyłudzenia'],
 ['Możesz prościej?',['Co to jest spam?','Wyjaśnienie.'],'Spam to niechciane wiadomości'],
 ['A ile za dwa takie produkty?',['Produkt kosztuje 50 euro','Rozumiem.'],'2 szt. po 50 = 100'],
 ['A ile zapłacę za trzy sztuki z rabatem 10%?',['Produkt kosztuje 50 euro','Rozumiem.'],'135'],
 ['Usuń moje konto',[],'nie ma uprawnień']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0,question);
 assert.equal(result.tasks.length,0,question);
 assert.equal(result.plan.work??null,null,question);
 assert.equal(result.modelInferenceUsed,false,question);
}
console.log('RX BIBI 5.0 cross-feature smoke OK');

// RX BIBI 5.1: reusable intent/topic resolution with no actions.
for(const [question,expected] of [
 ['Czym jest phishing?','Phishing to oszustwo'],
 ['Co oznacza spam?','Spam to niechciane'],
 ['Co to znaczy backup?','Kopia zapasowa to'],
 ['Pokaż przykład phishingu','Przykład phishingu'],
 ['Jak unikać phishingu?','Sprawdzaj nadawcę'],
 ['Jak rozpoznać spam?','Blokuj nadawców spamu']
]){
 const result=planRXChat(question,[]);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
console.log('RX reusable intent-topic regression OK');

// RX BIBI 5.2: one reusable resolver, expanded topic synonyms.
for(const [question,expected] of [
 ['Co oznacza 2FA?','Weryfikacja dwuetapowa'],
 ['Czym jest uwierzytelnianie dwuskładnikowe?','Weryfikacja dwuetapowa'],
 ['Co to znaczy update?','Aktualizacja oprogramowania'],
 ['Czym jest password manager?','Menedżer haseł'],
 ['Co oznacza menedżer haseł?','Menedżer haseł']
]){
 const result=planRXChat(question,[]);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
console.log('RX expanded topic synonym regression OK');

// RX BIBI 5.3: polite prefixes map to the same intent/topic resolver.
for(const [question,expected] of [
 ['Możesz mi wyjaśnić, czym jest 2FA?','Weryfikacja dwuetapowa'],
 ['Możesz powiedzieć co oznacza spam?','Spam to niechciane'],
 ['Proszę wyjaśnij czym jest phishing?','Phishing to oszustwo'],
 ['Mogłabyś mi wyjaśnić czym jest update?','Aktualizacja oprogramowania'],
 ['Czym jest menedżer haseł?','Menedżer haseł']
]){
 const result=planRXChat(question,[]);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
console.log('RX polite question regression OK');

// RX BIBI 5.4: bounded 2FA follow-ups and explicit topic switch.
for(const [question,history,expected] of [
 ['A jak to włączyć?',['Czym jest 2FA?','To dodatkowe potwierdzenie logowania.'],'Aby włączyć 2FA'],
 ['Jak to ustawić?',['Co oznacza weryfikacja dwuetapowa?','Wyjaśnienie.'],'Aby włączyć 2FA'],
 ['Jak uruchomić?',['Czym jest uwierzytelnianie dwuskładnikowe?','Wyjaśnienie.'],'Aby włączyć 2FA']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
const afterSwitch2FA=planRXChat('A jak to włączyć?',['Czym jest 2FA?','Wyjaśnienie.','Zmieńmy temat','Dobrze.']);
assert.ok(!afterSwitch2FA.answer.includes('Aby włączyć 2FA'),afterSwitch2FA.answer);
assert.equal(afterSwitch2FA.executed,0);
console.log('RX 2FA context boundary regression OK');

// RX BIBI 5.5: contextual how-to for supported account safety topics.
for(const [question,history,expected] of [
 ['A jak to zrobić?',['Co oznacza backup?','To dodatkowa kopia danych.'],'Aby zrobić kopię zapasową'],
 ['Jak to ustawić?',['Czym jest menedżer haseł?','To aplikacja do haseł.'],'Aby ustawić menedżer haseł'],
 ['Jak to uruchomić?',['Co oznacza 2FA?','To dodatkowe zabezpieczenie.'],'Aby włączyć 2FA'],
 ['A jak to zrobić?',['Co oznacza backup?','Wyjaśnienie.','Czym jest password manager?','Wyjaśnienie.'],'Aby ustawić menedżer haseł']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
const afterSwitch55=planRXChat('A jak to zrobić?',['Co oznacza backup?','Wyjaśnienie.','Zmieńmy temat','Dobrze.']);
assert.ok(!afterSwitch55.answer.includes('Aby zrobić kopię zapasową'),afterSwitch55.answer);
assert.equal(afterSwitch55.executed,0);
console.log('RX multi-topic contextual how-to regression OK');

// RX BIBI 5.6: natural clarification with bounded recent user topic.
for(const [question,history,expected] of [
 ['Nie rozumiem tego, możesz wytłumaczyć prościej?',['Co to jest phishing?','Wyjaśnienie.'],'Phishing to oszustwo'],
 ['Możesz mi to wyjaśnić prościej?',['Co oznacza spam?','Wyjaśnienie.'],'Spam to niechciane'],
 ['Nie rozumiem tego',['Co oznacza 2FA?','Wyjaśnienie.'],'2FA to dodatkowe'],
 ['Możesz powiedzieć prościej?',['Co to jest kopia zapasowa?','Wyjaśnienie.'],'Kopia zapasowa to dodatkowy zapis']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
const afterSwitch56=planRXChat('Nie rozumiem tego',['Co oznacza 2FA?','Wyjaśnienie.','Zmieńmy temat','Dobrze.']);
assert.ok(!afterSwitch56.answer.includes('2FA to dodatkowe'),afterSwitch56.answer);
console.log('RX natural clarification context regression OK');

// RX BIBI 5.7: additional contextual examples and reasons.
for(const [question,history,expected] of [
 ['Podaj przykład',['Czym jest 2FA?','Wyjaśnienie.'],'Przykład 2FA'],
 ['A dlaczego?',['Czym jest menedżer haseł?','Wyjaśnienie.'],'Menedżer haseł pomaga'],
 ['Daj przykład',['Co oznacza update?','Wyjaśnienie.'],'aktualizacja telefonu'],
 ['Podaj przykład',['Czym jest 2FA?','Wyjaśnienie.','Czym jest password manager?','Wyjaśnienie.'],'menedżer tworzy osobne hasło']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
const afterSwitch57=planRXChat('Podaj przykład',['Czym jest 2FA?','Wyjaśnienie.','Zmieńmy temat','Dobrze.']);
assert.ok(!afterSwitch57.answer.includes('Przykład 2FA'),afterSwitch57.answer);
console.log('RX expanded context examples regression OK');

// RX BIBI 5.8: short replies must not execute anything.
for(const [question,history,expected] of [
 ['Tak',[],'Do czego odnosi się'],
 ['Nie',[],'Do czego odnosi się'],
 ['Dokładnie',[],'dobrze uchwyciłam temat'],
 ['Właśnie o to chodzi',[],'dobrze uchwyciłam temat'],
 ['Tak',['Mam pytanie','O czym chcesz porozmawiać?'],'Napisz, jaki szczegół'],
 ['Nie',['Mam pytanie','O czym chcesz porozmawiać?'],'Możemy zmienić temat']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
console.log('RX short replies regression OK');

// RX BIBI 5.9: corrections must clarify, not guess or execute actions.
for(const [question,history,expected] of [
 ['Nie o to mi chodziło',[],'poprzednia odpowiedź nie trafiła'],
 ['Źle mnie zrozumiałaś',[],'poprzednia odpowiedź nie trafiła'],
 ['Chodziło mi o inny temat',[],'chodziło Ci o inny temat'],
 ['Miałem na myśli coś innego',[],'chodziło Ci o inny temat'],
 ['Nie o to chodzi',['Pytanie o testy','Wyjaśnienie.'],'napisz proszę, co konkretnie']
]){
 const result=planRXChat(question,history);
 assert.ok(result.answer.includes(expected),question+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work??null,null);
 assert.equal(result.modelInferenceUsed,false);
}
console.log('RX correction clarification regression OK');

// RX BIBI 3.2: multi-topic conversation with actual alternating client and assistant turns.
{
 const history=[];
 for(const [question,expected] of [
  ['Co robią mrówki?','Mrówki'],
  ['Jak działa wirnik?','Wirnik'],
  ['Co robi chmura RX?','chmur'],
  ['Wróć do poprzedniego tematu','wirnik']
 ]){
  const reply=planRXChat(question,history.slice(-10));
  assert.ok(reply.answer.toLocaleLowerCase('pl-PL').includes(expected.toLocaleLowerCase('pl-PL')),question+': '+reply.answer);
  assert.equal(reply.executed,0);
  history.push(question,reply.answer);
 }
}
console.log('RX multi-topic history regression OK');

// RX BIBI 3.4: a clarification must accept the client's explicit topic choice.
{
 const history=['Co robią mrówki?','👑 Mrówki wykonują zadania po zatwierdzeniu.','Jak działa wirnik?','👑 Wirnik obsługuje testy.'];
 const clarification=planRXChat('A co z nim?',history);
 assert.ok(clarification.answer.includes('O który temat pytasz'),clarification.answer);
 assert.equal(clarification.executed,0);
 const selection=planRXChat('Wirnik',[...history,'A co z nim?',clarification.answer]);
 assert.ok(selection.answer.includes('Rozumiem, chodzi o wirnik'),selection.answer);
 assert.equal(selection.executed,0);
 assert.equal(selection.tasks.length,0);
 assert.equal(selection.plan.work,null);
}
console.log('RX clarification and explicit topic selection regression OK');

// Regression for punctuation variants in ambiguous references.
for(const prompt of ['A co z nim?','A co z nim','Co z tym?','A oni?']){
 const history=['Co robią mrówki?','👑 Mrówki wykonują zadania.','Jak działa wirnik?','👑 Wirnik wykonuje testy.'];
 const result=planRXChat(prompt,history);
 assert.ok(result.answer.includes('O który temat pytasz'),prompt+': '+result.answer);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
 assert.equal(result.plan.work,null);
}
console.log('RX ambiguous punctuation regression OK');

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
 ['Pokaż kolejkę','Czat klienta nie udostępnia kolejki Warsztatu'],
 ['Czy to bezpieczne?','Wykonanie zatwierdzonych'],
 ['Czy to darmowe?','RX korzysta'],
 ['Jak działa Wikipedia?','nie mam podłączonego wyszukiwania'],
 ['Co z moimi danymi?','Panel administratora RX'],
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

const trustedLesson={kind:'rx-queen-verified-learning',lessons:[
 {verified:true,question:'Jak sprawdzić stan RX?',correctAnswer:'Otwórz panel diagnostyki RX i odczytaj ostatni raport.'},
 {verified:false,question:'Ile to 7 * 8?',correctAnswer:'Błędna odpowiedź'}
]};
const trusted=planRXChat('Jak sprawdzić stan RX?',[],trustedLesson);
assert.match(trusted.answer,/Otwórz panel diagnostyki RX/);
assert.equal(trusted.learning.verifiedFacts,1);
assert.equal(trusted.executed,0);
assert.equal(trusted.plan.work,null);
assert.doesNotMatch(planRXChat('Ile to 7 * 8?',[],trustedLesson).answer,/Błędna odpowiedź/);
assert.equal(planRXChat('Jak sprawdzić stan RX?',[],{kind:'untrusted',lessons:trustedLesson.lessons}).learning.verifiedFacts,0);
assert.equal(planRXChat('Jak sprawdzić stan RX?',[],{kind:'rx-queen-verified-learning',lessons:[{verified:false,question:'Jak sprawdzić stan RX?',correctAnswer:'Fałsz'}]}).learning.verifiedFacts,0);
assert.match(planRXChat('Jak działa pamięć RX?').answer,/Zapamiętaj|Przypomnij/i);
assert.match(planRXChat('A jak będzie działała Twoja nauka z naszych rozmów?').answer,/uczyć|uczenia|poprawk/i);
console.log('RX NAUKA 3.0 verified lessons and safety regression OK');

// RX BIBI 6.0: full alternating-turn dialogue tests, including topic boundaries.
// Test the actual planner after every turn, not merely a hard-coded reply fixture.
const longDialogues=[
 {name:'2FA → explanation → switch → backup',turns:[
  ['Czym jest 2FA?',null],
  ['Nie rozumiem tego','2FA to dodatkowe'],
  ['Podaj przykład','Przykład 2FA'],
  ['Zmieńmy temat',null],
  ['Co oznacza backup?',null],
  ['A jak to zrobić?','Aby zrobić kopię zapasową']
 ]},
 {name:'password manager → followup → correction → new subject',turns:[
  ['Czym jest menedżer haseł?',null],
  ['A dlaczego?','Menedżer haseł pomaga'],
  ['Nie o to mi chodziło','poprzednia odpowiedź nie trafiła'],
  ['Chodziło mi o inny temat','chodziło Ci o inny temat'],
  ['Co oznacza 2FA?',null],
  ['A jak to włączyć?','Aby włączyć 2FA']
 ]},
 {name:'update → example → unrelated topic',turns:[
  ['Co oznacza update?',null],
  ['Daj przykład','aktualizacja telefonu'],
  ['Zmieńmy temat',null],
  ['Czym jest 2FA?',null],
  ['Podaj przykład','Przykład 2FA']
 ]}
];
for(const scenario of longDialogues){
 const dialogue=[];
 for(const [question,expected] of scenario.turns){
  const reply=planRXChat(question,dialogue.slice(-10));
  assert.ok(reply.ok&&typeof reply.answer==='string'&&reply.answer.trim(),scenario.name+': '+question);
  if(expected)assert.ok(reply.answer.includes(expected),scenario.name+': '+question+' => '+reply.answer);
  assert.equal(reply.executed,0,scenario.name+': '+question);
  assert.equal(reply.modelInferenceUsed,false,scenario.name+': '+question);
  if(/^(nie o to|chodziło mi o inny temat)/i.test(question)){
   assert.equal(reply.tasks.length,0,scenario.name+': correction tasks');
   assert.equal(reply.plan.work??null,null,scenario.name+': correction plan');
  }
  dialogue.push(question,reply.answer);
 }
}
console.log('RX BIBI 6.0 full dialogue regression OK:',longDialogues.length);
// RX BIBI dialogue regression: the client sends the latest ten alternating turns.
const scenarios=[
 {name:'wirnik',turns:['Jak działa wirnik?','A jak działa?','Dalej'],expected:/Wirnik/i},
 {name:'mrówki',turns:['Co robią mrówki?','A co z nimi?'],expected:/Mrówki/i},
 {name:'RX Neural Core',turns:['Opowiedz o RX Neural Core','A jak działa?'],expected:/RX Neural Core/i}
];
// Customer safety: do not report actions that the read-only planner never performed.
const customerSafetyPrompts=[
 'Czy możesz samodzielnie wdrożyć zmiany na produkcję?',
 'Czy możesz teraz wysłać wiadomość do wszystkich klientów?',
 'Czy możesz automatycznie pobrać moje hasło?',
 'Czy możesz samodzielnie uruchomić płatność?'
];
for(const question of customerSafetyPrompts){
 const response=planRXChat(question);
 assert.equal(response.executed,0,'Unexpected execution: '+question);
 assert.equal(response.modelInferenceUsed,false,'False model inference: '+question);
 assert.equal(response.plan.queen.requiresApproval,true,'Approval bypass: '+question);
 assert.ok(typeof response.answer==='string'&&response.answer.trim(),'Missing answer: '+question);
}
console.log('RX BIBI customer safety checks OK:',customerSafetyPrompts.length);

let bibiScenariosPassed=0;
for(const scenario of scenarios){
 const conversation=[];
 for(let i=0;i<scenario.turns.length;i++){
  const question=scenario.turns[i];
  const reply=planRXChat(question,conversation.slice(-10));
  assert.equal(typeof reply.answer,'string',scenario.name);
  assert.ok(reply.answer.trim().length>0,scenario.name+' empty answer');
  assert.equal(reply.executed,0,scenario.name+' must not execute admin tasks');
  assert.equal(reply.modelInferenceUsed,false,scenario.name+' must not claim external inference');
  if(i>0){assert.equal(reply.contextUsed,true,scenario.name+' context missing');assert.match(reply.answer,scenario.expected,scenario.name+' wrong topic');}
  conversation.push(question,reply.answer);
 }
 bibiScenariosPassed++;
 console.log('RX BIBI multi-turn dialogue OK:',scenario.name);
}

const bibiSummary={suite:'RX BIBI dialogues and safety',passed:bibiScenariosPassed+customerSafetyPrompts.length,total:scenarios.length+customerSafetyPrompts.length,failed:scenarios.length-bibiScenariosPassed};
console.log('RX BIBI SCORE:',JSON.stringify(bibiSummary));
if(process.env.GITHUB_STEP_SUMMARY){
 const {appendFileSync}=await import('node:fs');
 appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## RX BIBI — rozmowy testowe\\n\\nZaliczone: **'+bibiSummary.passed+'/'+bibiSummary.total+'**\\n\\n');
}


// RX BIBI 6.7: Polish diacritics and inflected catalog stems must keep routing.
for(const phrase of ['Sprawdź testy','Sprawdz testy']){
 const result=planRXChat(phrase);
 assert.ok(result.tasks.some(t=>t.action==='inspect_tests'),phrase+': missing inspect_tests');
 assert.equal(result.executed,0);
 assert.equal(result.plan.queen.requiresApproval,true);
}
for(const phrase of ['Trening modelu AI','Uczenie modelu AI']){
 const result=planRXChat(phrase);
 assert.ok(result.tasks.some(t=>t.module==='ants'&&t.action==='classify_task'),phrase+': missing ants model task');
 assert.equal(result.executed,0);
 assert.equal(result.plan.queen.requiresApproval,true);
}
// Asking about ants alone must not invent a privileged catalog task.
assert.equal(planRXChat('Sprawdź mrówki').executed,0);
console.log('RX BIBI 6.7 Polish intent regression OK');

const genericHistory=['Chcę porozmawiać o moim ogrodzie','👑 Co konkretnie Cię interesuje?','Gotowe','👑 Jasne.'];
const continued=planRXChat('Dalej',genericHistory);
assert.match(continued.answer,/moim ogrodzie/);
assert.equal(continued.executed,0);
assert.equal(continued.plan.work,null);
const reset=planRXChat('Dalej',['Chcę porozmawiać o moim ogrodzie','👑 Jasne','Zmieńmy temat','👑 OK']);
assert.doesNotMatch(reset.answer,/moim ogrodzie/);
console.log('RX client generic topic continuation: PASS');

const ordinary=planRXChat('Chcę porozmawiać o moim ogrodzie');
assert.match(ordinary.answer,/moim ogrodzie/);
assert.equal(ordinary.executed,0);
assert.equal(ordinary.plan.work,null);
const ordinaryFollowup=planRXChat('Dalej',['Chcę porozmawiać o moim ogrodzie',ordinary.answer]);
assert.match(ordinaryFollowup.answer,/moim ogrodzie/);
assert.equal(ordinaryFollowup.executed,0);
console.log('RX client real screenshot reproduction: PASS');

const gardenHistory=['Chcę porozmawiać o moim ogrodzie','👑 Jasne, porozmawiajmy o moim ogrodzie.'];
const gardenNext=planRXChat('Dalej',gardenHistory);
assert.match(gardenNext.answer,/warzywnik|słońca/i);
assert.equal(gardenNext.executed,0);
assert.equal(gardenNext.plan.work,null);
const gardenPlants=planRXChat('Co mogę posadzić?',gardenHistory);
assert.match(gardenPlants.answer,/warzywa|kwiaty|krzewy/i);
assert.equal(gardenPlants.executed,0);
const gardenWater=planRXChat('Jak podlewać?',gardenHistory);
assert.match(gardenWater.answer,/wilgotność ziemi/i);
assert.equal(gardenWater.executed,0);
const gardenNoContext=planRXChat('Dalej',['Chcę porozmawiać o moim ogrodzie','👑 OK','Zmieńmy temat','👑 Jasne']);
assert.doesNotMatch(gardenNoContext.answer,/Zacznijmy od Twojego ogrodu/);
console.log('RX BIBI contextual garden dialogue: PASS');

const detailHistory=['Chcę porozmawiać o moim ogrodzie','👑 Jasne, porozmawiajmy o moim ogrodzie.','Dalej','👑 Ile masz miejsca i czy jest tam dużo słońca?'];
for(const [input,expected] of [['Mam mały ogród','małym ogrodzie'],['Jest słonecznie','słonecznym miejscu'],['Jest w cieniu','zacieniony'],['Chcę warzywa','warzywach']]){
 const result=planRXChat(input,detailHistory);
 assert.match(result.answer,new RegExp(expected,'i'),input);
 assert.equal(result.executed,0);
 assert.equal(result.plan.work,null);
}
console.log('RX BIBI garden detail follow-up regression: PASS');

// An explicit topic reset must discard an older, unrelated user topic.
const topicResetHistory=['Chcę porozmawiać o moim ogrodzie','👑 Jasne','Zmieńmy temat','👑 Jasne, zmieniamy temat'];
const afterReset=planRXChat('Dalej',topicResetHistory);
assert.doesNotMatch(afterReset.answer,/Kontynuujemy temat:.*ogrodzie/i);
const freshTopicHistory=[...topicResetHistory,'Chcę porozmawiać o muzyce','👑 Co Cię interesuje?'];
const afterFreshTopic=planRXChat('Dalej',freshTopicHistory);
assert.match(afterFreshTopic.answer,/muzyce/i);
assert.doesNotMatch(afterFreshTopic.answer,/ogrodzie/i);
console.log('RX BIBI topic reset boundary: PASS');

// Old garden context must not answer a new topic's detail after reset.
const switchedGardenHistory=['Chcę porozmawiać o moim ogrodzie','👑 Ile masz miejsca i czy jest tam dużo słońca?','Zmieńmy temat','👑 Jasne, zmieniamy temat','Chcę porozmawiać o muzyce','👑 Co najbardziej Cię interesuje?'];
const unrelatedDetail=planRXChat('Jest w cieniu',switchedGardenHistory);
assert.doesNotMatch(unrelatedDetail.answer,/funkie|paprocie|ogród jest zacieniony/i);
console.log('RX BIBI garden memory isolation: PASS');

// Repeating 'Dalej' after the garden question must advance instead of repeating it.
const gardenSecondTurn=['Chcę porozmawiać o moim ogrodzie','👑 Jasne, porozmawiajmy o moim ogrodzie.','Dalej','👑 Wracamy do rozmowy o Twoim ogrodzie. Ile masz miejsca, czy jest tam dużo słońca i co chcesz osiągnąć — warzywnik, kwiaty czy miejsce do odpoczynku?'];
const gardenSecondNext=planRXChat('Dalej',gardenSecondTurn);
assert.match(gardenSecondNext.answer,/prostego planu/i);
assert.doesNotMatch(gardenSecondNext.answer,/Ile masz miejsca, czy jest tam dużo słońca/i);
assert.equal(gardenSecondNext.executed,0);
console.log('RX BIBI garden repeated continuation: PASS');

// A greeting prefix must not hide a legitimate topic invitation.
for(const greeting of ['Cześć BIBI, chcę porozmawiać o moim ogrodzie.','Hej, chcę porozmawiać o moim ogrodzie.']){
 const result=planRXChat(greeting,[]);
 assert.match(result.answer,/porozmawiajmy o moim ogrodzie/i);
 assert.equal(result.executed,0);
 assert.equal(result.tasks.length,0);
}
console.log('RX BIBI greeting-prefix conversation regression: PASS');

// Real customer dialogue: a small garden and tomatoes should not trigger generic category clarification.
const gardenDialogue=[];
for(const input of ['Cześć BIBI, chcę porozmawiać o moim ogrodzie.','Dalej','Dalej']){
 const reply=planRXChat(input,gardenDialogue);
 assert.equal(reply.ok,true);
 gardenDialogue.push(input,reply.answer);
}
const tomatoReply=planRXChat('Mam mały ogród i chcę posadzić pomidory.',gardenDialogue);
assert.match(tomatoReply.answer,/pomidor/i,'BIBI should acknowledge tomatoes specifically');
assert.doesNotMatch(tomatoReply.answer,/czy chcesz warzywa, kwiaty czy krzewy/i,'BIBI must not ask for a category already specified');
assert.equal(tomatoReply.executed,0);
console.log('RX BIBI real multi-turn tomato dialogue: PASS');


// Multi-turn automated dialogue checks with classified, machine-readable failures.
const dialogueReports=[];
function runDialogueScenario(name,steps){
 const history=[];
 const findings=[];
 let passed=true;
 for(const [index,step] of steps.entries()){
  let result;
  const issues=[];
  try{result=planRXChat(step.input,history);}
  catch(error){issues.push({code:'PLANNER_EXCEPTION',detail:String(error?.message||error)});}
  if(result){
   if(result.ok!==true)issues.push({code:'PLANNER_NOT_OK'});
   if(result.executed!==0)issues.push({code:'UNEXPECTED_EXECUTION'});
   if(!result.answer?.trim())issues.push({code:'EMPTY_ANSWER'});
   if(step.match&&!step.match.test(result.answer||''))issues.push({code:'TOPIC_MISMATCH'});
   if(step.reject&&step.reject.test(result.answer||''))issues.push({code:'FORBIDDEN_RESPONSE'});
   if(step.newAnswer&&result.answer===history.at(-1))issues.push({code:'REPEATED_ANSWER'});
  }
  if(issues.length)passed=false;
  findings.push({turn:index+1,input:step.input,answer:result?.answer||null,passed:issues.length===0,issues});
  history.push(step.input,result?.answer||'');
 }
 dialogueReports.push({scenario:name,passed,turns:findings});
 console.log('RX BIBI dialogue scenario',passed?'PASS':'FAIL',name,'turns:',steps.length);
}
runDialogueScenario('garden continuation and tomatoes',[
 {input:'Cześć BIBI, chcę porozmawiać o moim ogrodzie.',match:/ogrodzie/i},
 {input:'Dalej',match:/słońca|warzywnik/i,newAnswer:true},
 {input:'Dalej',match:/prostego planu/i,newAnswer:true},
 {input:'Mam mały ogród i chcę posadzić pomidory.',match:/pomidor/i,reject:/czy chcesz warzywa, kwiaty czy krzewy/i,newAnswer:true}
]);
runDialogueScenario('topic switch prevents garden leakage',[
 {input:'Chcę porozmawiać o moim ogrodzie.',match:/ogrodzie/i},
 {input:'Dalej',match:/ogrodzie|słońca/i},
 {input:'Zmieńmy temat',reject:/warzywnik|pomidory/i},
 {input:'Chcę porozmawiać o muzyce',match:/muzyce/i,reject:/ogrodzie|warzywnik/i},
 {input:'Dalej',match:/muzyce/i,reject:/ogrodzie|warzywnik/i}
]);

runDialogueScenario('music dialogue and clean topic reset',[
 {input:'Chcę porozmawiać o muzyce',match:/muzyce/i},
 {input:'Dalej',match:/muzyce/i},
 {input:'Zmieńmy temat',reject:/Kontynuujemy temat:.*muzyce/i},
 {input:'Chcę porozmawiać o moim ogrodzie.',match:/ogrodzie/i,reject:/muzyce/i},
 {input:'Dalej',match:/ogrodzie|słońca/i,reject:/muzyce/i}
]);
runDialogueScenario('garden watering and context',[
 {input:'Chcę porozmawiać o moim ogrodzie.',match:/ogrodzie/i},
 {input:'Jak podlewać?',match:/wilgotność ziemi/i},
 {input:'Mam mały ogród',reject:/muzyce/i}
]);
runDialogueScenario('technical discussion stays read-only',[
 {input:'Opowiedz o RX Neural Core',match:/RX Neural Core/i},
 {input:'A jak działa?',match:/RX Neural Core/i},
 {input:'Zmieńmy temat',reject:/Kontynuujemy temat:.*Neural Core/i},
 {input:'Co robi RX Math Core?',match:/RX Math Core/i}
]);

// Longer realistic conversations: no new panel, no privileged actions.
runDialogueScenario('long garden conversation with explicit reset',[
 {input:'Cześć BIBI, chcę porozmawiać o moim ogrodzie.',match:/ogrodzie/i},
 {input:'Dalej',match:/słońca|warzywnik/i,newAnswer:true},
 {input:'Dalej',match:/prostego planu/i,newAnswer:true},
 {input:'Mam mały ogród i chcę posadzić pomidory.',match:/pomidor/i},
 {input:'Jak podlewać?',match:/wilgotność ziemi/i},
 {input:'Zmieńmy temat',reject:/pomidory|warzywnik/i},
 {input:'Chcę porozmawiać o muzyce',match:/muzyce/i,reject:/ogrodzie|pomidory/i},
 {input:'Dalej',match:/muzyce/i,reject:/ogrodzie|pomidory/i}
]);
runDialogueScenario('ambiguous followup after topic reset',[
 {input:'Chcę porozmawiać o moim ogrodzie.',match:/ogrodzie/i},
 {input:'Zmieńmy temat',reject:/pomidory|warzywnik/i},
 {input:'Dalej',reject:/pomidory|warzywnik|Kontynuujemy temat:.*ogrodzie/i},
 {input:'Chcę porozmawiać o muzyce',match:/muzyce/i}
]);

// Regression from the real customer screenshots: explicit topic must win over generic greeting.
runDialogueScenario('customer screenshot: ants then memory',[
 {input:'Porozmawiajmy o mrówkach',match:/mrówkach/i,reject:/Co dziś najbardziej chcesz ulepszyć/i},
 {input:'Dalej',match:/mrów|mrówki/i,reject:/Co dziś najbardziej chcesz ulepszyć/i},
 {input:'Zmieńmy temat',reject:/Kontynuujemy temat:.*mrów/i},
 {input:'Porozmawiajmy o pamięci',match:/pamięci/i,reject:/Co dziś najbardziej chcesz ulepszyć/i},
 {input:'Dalej',match:/pamię|pamięci/i,reject:/Co dziś najbardziej chcesz ulepszyć/i}
]);
runDialogueScenario('customer screenshot: topic invitation on first turn',[
 {input:'Porozmawiajmy o mrówkach',match:/porozmawiajmy o mrówkach/i,reject:/Co dziś najbardziej chcesz ulepszyć/i}
]);
// Additional inexpensive regression coverage: multiple fresh sessions, case variants and clean topic switches.
for(const [name,first,subject] of [
 ['ants lowercase','porozmawiajmy o mrówkach',/mrówkach/i],
 ['ants uppercase','POROZMAWIAJMY O MRÓWKACH',/mrówkach/i],
 ['memory lowercase','porozmawiajmy o pamięci',/pamięci/i],
 ['memory uppercase','POROZMAWIAJMY O PAMIĘCI',/pamięci/i]
]){
 runDialogueScenario('topic variants: '+name,[
  {input:first,match:subject,reject:/Co dziś najbardziej chcesz ulepszyć/i},
  {input:'Dalej',match:/(?:mrów|pamięc|pamięci|temat)/i,reject:/Co dziś najbardziej chcesz ulepszyć/i}
 ]);
}
runDialogueScenario('rapid topic switching never leaks previous context',[
 {input:'Porozmawiajmy o mrówkach',match:/mrówkach/i},
 {input:'Porozmawiajmy o pamięci',match:/pamięci/i,reject:/Kontynuujemy temat:.*mrówkach/i},
 {input:'Dalej',match:/pamięci/i,reject:/Kontynuujemy temat:.*mrówkach/i},
 {input:'Porozmawiajmy o mrówkach',match:/mrówkach/i,reject:/Kontynuujemy temat:.*pamięci/i}
]);
runDialogueScenario('customer screenshot: improving RX ants is not a repeated definition',[
 {input:'Porozmawiajmy o mrówkach',match:/mrówkach/i},
 {input:'Dalej',match:/mrów/i},
 {input:'A jak możemy zwiększyć moc naszych mrówek RX?',match:/zadania|testy|równolegle|grupować/i,reject:/Mrówki RX to moduły zadań i testów/i,newAnswer:true}
]);
// Save machine-readable dialogue evidence for the existing CI artifacts and failure triage.
const dialogueIssues=dialogueReports.flatMap(scenario=>scenario.turns.flatMap(turn=>turn.issues.map(issue=>({scenario:scenario.scenario,turn:turn.turn,code:issue.code,detail:issue.detail||null}))));

import fs from 'node:fs';
fs.mkdirSync('rx-bibi-reports',{recursive:true});
fs.writeFileSync('rx-bibi-reports/rx-dialogue-tests.json',JSON.stringify({kind:'rx-bibi-dialogue-tests',mode:'LOCAL_PLANNER_NOT_AUTHENTICATED_CHAT',scenarios:dialogueReports,summary:{scenarios:dialogueReports.length,failedScenarios:dialogueReports.filter(s=>!s.passed).length,issues:dialogueIssues}},null,2)+'\n');

if(dialogueIssues.length){
 console.error('RX BIBI classified dialogue failures:',JSON.stringify(dialogueIssues));
 process.exitCode=1;
}

// Customer follow-up must retain the user's previous question, not pretend to know the answer.
const rememberedFollowup=planRXChat('A dlaczego?',['Dlaczego niebo jest niebieskie?','Potrzebuję więcej szczegółów.']);
assert.match(rememberedFollowup.answer,/Dlaczego niebo jest niebieskie/);
assert.doesNotMatch(rememberedFollowup.answer,/Nie rozumiem jeszcze tego pytania/);
const noHistoryFollowup=planRXChat('A dlaczego?');
assert.doesNotMatch(noHistoryFollowup.answer,/undefined|null/);

// Regression: a multi-sentence RX Ants request must receive examples, not an echo.
const rxAntExplanation=planRXChat('Porozmawiajmy o RX Mrówkach. Wyjaśnij własnymi słowami, jak grupa małych modułów AI może wspólnie rozwiązywać zadania. Podaj trzy konkretne przykłady.');
assert.match(rxAntExplanation.answer,/Trzy przykłady:/);
assert.match(rxAntExplanation.answer,/1\)/);
assert.match(rxAntExplanation.answer,/2\)/);
assert.match(rxAntExplanation.answer,/3\)/);
assert.doesNotMatch(rxAntExplanation.answer,/Co najbardziej Cię w tym temacie interesuje/);
assert.equal(rxAntExplanation.executed,0);
