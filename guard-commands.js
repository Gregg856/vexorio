'use strict';
// Deliberately limited offline command interpreter. Never executes code, shell, network or writes.
const HELP='Polecenia: pomoc, status, test, plan: [opis], możliwości. Wykonywanie zmian w GitHubie nie jest jeszcze podłączone.';
function respond(command){
 if(typeof command!=='string'||!command.trim()||command.length>2000)return {kind:'error',message:'Wpisz polecenie do 2000 znaków.'};
 const c=command.trim(),lower=c.toLocaleLowerCase('pl');
 if(/^(cześć|czesc|hej|hejka|witaj|siema|dzień dobry|dzien dobry|hello|hi|hallo)[!. ]*$/.test(lower))return {kind:'greeting',message:'Cześć! 🛡️ Jestem Strażak AI. Uczę się rozumieć Twoje polecenia. Mogę przygotować analizę zadania — wpisz np. „plan: sprawdź wyszukiwarkę VEXORIO”. Nie wykonuję jeszcze zmian samodzielnie.'};
 if(/^(dzięki|dzieki|dziękuję|dziekuje|super|ok|okej)[!. ]*$/.test(lower))return {kind:'conversation',message:'Jasne! 😊 Napisz, co chcesz zrobić. Jeśli mam przeanalizować zadanie, zacznij od „plan:”.'};
 if(/^(pomoc|help|co potrafisz|możliwości)\??$/.test(lower))return {kind:'help',message:HELP};
 if(/^(status|stan)\??$/.test(lower))return {kind:'status',message:'Strażak: czat lokalny działa. Repozytorium, testy i wdrożenia nie są połączone z czatem.'};
 if(/^(test|testy)\??$/.test(lower))return {kind:'test',message:'Tryb testowy czatu działa. To nie uruchamia testów GitHub.'};
 if(/^plan\s*:/i.test(c)){
  const task=c.slice(c.indexOf(':')+1).trim();
  if(!task)return {kind:'error',message:'Po „plan:” wpisz zadanie.'};
  return {kind:'plan',message:'Zapisano polecenie tylko w bieżącym widoku. Proponowany plan: 1. Sprawdź wymagania. 2. Przygotuj zmianę. 3. Przetestuj. 4. Zatwierdź przed wdrożeniem. Zadanie: '+task};
 }
 return {kind:'unsupported',message:'Nie umiem jeszcze wykonać tego polecenia. '+HELP};
}
if(typeof module!=='undefined')module.exports={respond};
if(typeof window!=='undefined')window.GuardCommands={respond};
