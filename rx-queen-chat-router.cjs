'use strict';
// Deterministic chat-style command router. No network, AI impersonation, or side effects.
const {RULES}=require('./rx-task-catalog.cjs');
const COMMANDS=Object.freeze([
 {id:'status',label:'Stan systemu',words:['status','stan','stan strony']},
 {id:'errors',label:'Błędy',words:['błędy','bledy','awarie','alarmy']},
 {id:'tests',label:'Testy',words:['testy','test','testowanie']},
 {id:'tasks',label:'Zadania mrówek',words:['mrówki','mrowki','zadania']},
 {id:'patches',label:'Propozycje napraw',words:['poprawki','naprawy','patche']},
 {id:'history',label:'Historia',words:['historia','raporty']}
]);
function handleQueenCommand(input,summary){
 if(typeof input!=='string'||input.length>500)throw Error('Invalid RX Queen command');
 if(!summary||summary.kind!=='rx-bibi-dashboard-summary')throw Error('Invalid RX Queen summary');
 const phrase=input.trim().toLocaleLowerCase('pl-PL');
 if(!phrase)return {type:'help',message:'Wpisz polecenie lub wybierz funkcję: status, błędy, testy, mrówki, poprawki, historia.'};
 const match=COMMANDS.find(c=>c.words.includes(phrase));
 if(!match){
  const research=RULES.find(rule=>rule.id==='research_info');
  if(research&&research.words.some(word=>phrase.startsWith(word+' '))){
   const topic=phrase.replace(new RegExp('^(?:'+research.words.join('|')+')\\s+','i'),'').trim();
   if(topic.length>=3)return {type:'proposal',command:research.id,topic,module:research.module,target:research.target,message:'Rozumiem prośbę o znalezienie informacji: '+topic+'. Wyszukiwanie nie zostało uruchomione; wymaga podłączenia wykonawcy RX Wiedza Świata.',readOnly:true,executed:0,requiresApproval:true};
  }
  return {type:'help',message:'Nie rozpoznaję tego polecenia. Dostępne: status, błędy, testy, mrówki, poprawki, historia. Nie wykonuję zmian automatycznie.'};
 }
 const n=k=>Number.isSafeInteger(summary[k])&&summary[k]>=0?summary[k]:null;
 const messages={
 status:'Przebieg '+String(summary.runId||'nieznany')+'. Sygnały: '+n('signals')+', zadania: '+n('tasks')+'.',
 errors:'Sygnały diagnostyczne: '+n('signals')+', powracające problemy: '+n('recurring')+'. To nie jest pełny skan produkcji.',
 tests:'Ten raport nie zawiera wyniku GitHub Actions. Otwórz osobny raport testów RX BIBI.',
 tasks:'Zadań w raporcie: '+n('tasks')+', oczekujących na zatwierdzenie: '+n('awaitingApproval')+'.',
 patches:'Propozycje napraw: '+n('proposedPatches')+'. Żadna poprawka nie jest wykonywana bez zatwierdzenia.',
 history:'Identyfikator dostępnego przebiegu: '+String(summary.runId||'nieznany')+'. Pełna historia nie jest podłączona.'
 };
 return {type:'answer',command:match.id,message:messages[match.id],readOnly:true};
}
module.exports={COMMANDS,handleQueenCommand};
