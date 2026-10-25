'use strict';
// Guard Engine 2.0: deterministic local task analysis. No network, code execution or credentials.
const RULES=[
 {intent:'security',risk:'high',terms:/\b(usuń|usun|kasuj|wyczyść|wyczysc|delete|drop|truncate|hasło|haslo|token|sekret|secret|production database|baza danych)\b/i},
 {intent:'deployment',risk:'high',terms:/\b(wdr[oó]ż|publikuj|deploy|release|produkcj[aeę]|cloudflare)\b/i},
 {intent:'testing',risk:'low',terms:/\b(test|testy|sprawdź|sprawdz|audyt|audit|verify)\b/i},
 {intent:'translation',risk:'low',terms:/\b(tłumacz|tlumacz|przetłumacz|przetlumacz|translation|język|jezyk|ukraiński|ukrainski)\b/i},
 {intent:'development',risk:'medium',terms:/\b(popraw|napraw|dodaj|zbuduj|kod|github|funkcj|stron|aplikacj)\w*/i}
];
function analyzeTask(value){
 if(typeof value!=='string'||!value.trim()||value.length>2000)return {ok:false,error:'Nieprawidłowe polecenie (maks. 2000 znaków).'};
 const task=value.trim(),hits=RULES.filter(r=>r.terms.test(task));
 const intent=hits[0]?.intent||'general';
 const risk=hits.some(r=>r.risk==='high')?'high':hits.some(r=>r.risk==='medium')?'medium':'low';
 const steps=[
 'Ustal zakres zadania i sprawdź obecny stan.',
 'Przygotuj propozycję zmiany bez ingerencji w produkcję.',
 'Uruchom odpowiednie testy w izolowanym środowisku.',
 'Przed jakąkolwiek publikacją uzyskaj osobne zatwierdzenie.'
 ];
 return {ok:true,version:'2.0',intent,risk,task,steps,requiresApproval:true,execution:'not_connected'};
}
if(typeof module!=='undefined')module.exports={analyzeTask};
if(typeof window!=='undefined')window.GuardEngine2={analyzeTask};
