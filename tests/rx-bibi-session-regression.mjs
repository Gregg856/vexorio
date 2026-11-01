import assert from 'node:assert/strict';
import {answerRXSession} from '../rx-bibi-session-reasoner.mjs';
const tasks='Mam trzy zadania: naprawić czat, sprawdzić pamięć i przetestować matematykę. Powtórz je.';
const list='👑 Twoje trzy zadania: 1) naprawić czat; 2) sprawdzić pamięć; 3) przetestować matematykę.';
const cases=[
 ['second task in Polish', 'Które z moich zadań jest drugie?', [tasks,list], /sprawdzić pamięć/],
 ['alternative second task', 'Drugie zadanie?', [tasks,list], /sprawdzić pamięć/],
 ['repeat three tasks', 'Wymień je', [tasks,list], /naprawić czat.*sprawdzić pamięć.*przetestować matematykę/],
 ['multiply and add', 'Oblicz 125 × 8 + 350.', [], /1350/],
 ['simple multiplication', 'Policz 12 * 9', [], /108/],
 ['follow-up subtraction', 'Jeśli od poprzedniego wyniku odejmę 250, ile zostanie?', ['Oblicz 125 × 8 + 350.','🧮 Wynik: 1350'], /1100/],
 ['division by zero is not invented', 'Policz 5 / 0', [], null],
 ['no invented second task', 'Które z moich zadań jest drugie?', [], null],
 ['no invented task list', 'Wymień je', [], null],
 ['no invented previous result', 'Jeśli od poprzedniego wyniku odejmę 250, ile zostanie?', [], null],
 ['zero divided by nonzero', 'Policz 0 / 5', [], /0/],
 ['simple subtraction', 'Policz 999 - 111', [], /888/],
 ['simple addition', 'Policz 17 + 25', [], /42/],
 ['simple division', 'Policz 81 / 9', [], /9/],
 ['math operator precedence', 'Oblicz 2 + 3 × 4', [], /14/],
 ['task memory from earlier context', 'Które z moich zadań jest drugie?', [tasks,list,'Dziękuję','Proszę'], /sprawdzić pamięć/],
 ['summary with no invented math', 'Podsumuj naszą rozmowę', [tasks,list], /nie ustalono/],
 ['unknown-answer policy', 'Co powinnaś zrobić, gdy nie znasz odpowiedzi na pytanie?', [], /nie wiem.*nie będę zgadywać/i],
 ['unknown-answer paraphrase', 'Co robisz gdy nie wiesz?', [], /nie wiem.*wiarygodnym źródle/i],
 ['remember given name', 'Jak mam na imię?', ['Mam na imię Marek.','Miło Cię poznać'], /Marek/],
 ['name unknown is not fabricated', 'Jak mam na imię?', [], null],
 ['first task', 'Które z moich zadań jest pierwsze?', [tasks,list], /naprawić czat/],
 ['third task', 'Które z moich zadań jest trzecie?', [tasks,list], /przetestować matematykę/],
 ['last task', 'Ostatnie zadanie?', [tasks,list], /przetestować matematykę/],
 ['count tasks', 'Ile mam zadań?', [tasks,list], /3 zadania/],
 ['recall last result', 'Jaki był poprzedni wynik?', ['Policz 5 + 7','🧮 Wynik: 12'], /12/],
 ['add to previous result', 'Jeśli do poprzedniego wyniku dodaj 5, ile wyjdzie?', ['Policz 5 + 7','🧮 Wynik: 12'], /17/],
 ['no fabricated last result', 'Jaki był poprzedni wynik?', [], null],
 ['no fabricated third task', 'Trzecie zadanie?', [], null],
 ['corrected name', 'Jak mam na imię?', ['Mam na imię Marek','OK','Jednak mam na imię Adam','Rozumiem'], /Adam/],
 ['corrected second task', 'Drugie zadanie?', [tasks,list,'Poprawka: drugie zadanie to sprawdzić serwer','Zapisane'], /sprawdzić serwer/],
 ['corrected list repeat', 'Wymień je', [tasks,list,'Poprawka: drugie zadanie to sprawdzić serwer','Zapisane'], /naprawić czat.*sprawdzić serwer.*przetestować matematykę/],
 ['no correction invented', 'Drugie zadanie?', [tasks,list], /sprawdzić pamięć/],
 ['four operation chain', 'Oblicz 10 + 2 × 3 - 4 + 8', [], /20/],
 ['five operation chain', 'Policz 100 / 5 + 3 × 4 - 2 + 1', [], /31/],
 ['mixed multiplication precedence', 'Oblicz 2 + 3 × 4 - 5 × 2', [], /4/],
 ['all additions', 'Policz 1 + 2 + 3 + 4', [], /10/],
 ['all subtractions', 'Policz 30 - 5 - 4 - 3', [], /18/],
 ['division precedence', 'Policz 20 + 18 / 3 - 2', [], /24/],
 ['multi division zero safe', 'Policz 10 + 20 / 0 - 3', [], null],
 ['multi negative safe', 'Policz -10 + 5 × 3 - 2', [], /3/],
 ['name correction explained', 'Czy podałem dwa różne imiona?', ['Mam na imię Marek','OK','Jednak mam na imię Adam','OK'], /Marek.*Adam/],
 ['same name not contradiction', 'Czy podałem dwa różne imiona?', ['Mam na imię Marek','OK','Mam na imię Marek','OK'], /Nie widzę/],
 ['unknown name contradiction', 'Czy podałem dwa różne imiona?', [], /Nie widzę/],
 ['combined name and tasks', 'Jak mam na imię i ile mam zadań?', ['Mam na imię Marek','OK',tasks,list], /Marek.*3/],
 ['combined reverse order', 'Ile mam zadań i jak mam na imię?', ['Mam na imię Marek','OK',tasks,list], /Marek.*3/],
 ['combined missing list', 'Jak mam na imię i ile mam zadań?', ['Mam na imię Marek','OK'], /Marek.*nie podano/],
 ['name correction query', 'Czy zmieniłem imię?', ['Mam na imię Marek','OK','Mam na imię Adam','OK'], /Marek.*Adam/]
];
for(const [label,message,history,expected] of cases){
 const result=answerRXSession(message,history);
 if(expected)assert.match(result?.answer||'',expected,label);
 else assert.equal(result,null,label);
 console.log('PASS '+label);
}
console.log('RESULT: '+cases.length+'/'+cases.length+' local regression cases');
