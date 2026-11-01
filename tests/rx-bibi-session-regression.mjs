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
 ['unknown-answer paraphrase', 'Co robisz gdy nie wiesz?', [], /nie wiem.*wiarygodnym źródle/i]
];
for(const [label,message,history,expected] of cases){
 const result=answerRXSession(message,history);
 if(expected)assert.match(result?.answer||'',expected,label);
 else assert.equal(result,null,label);
 console.log('PASS '+label);
}
console.log('RESULT: '+cases.length+'/'+cases.length+' local regression cases');
