'use strict';
// Deliberately limited offline command interpreter. Never executes code, shell, network or writes.
const HELP='Polecenia: pomoc, status, test, plan: [opis]. Wykonywanie zmian w GitHubie nie jest jeszcze podłączone.';
function respond(command){
 if(typeof command!=='string'||!command.trim()||command.length>2000)return {kind:'error',message:'Wpisz polecenie do 2000 znaków.'};
 const c=command.trim(),lower=c.toLocaleLowerCase('pl');
 if(/^(pomoc|help|co potrafisz)\??$/.test(lower))return {kind:'help',message:HELP};
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
