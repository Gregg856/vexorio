'use strict';
// RX Strażak orchestrator: chooses advisory modules, never executes writes.
(function(root){
 const MAX=2000;
 function route(value,capabilities={}){
  if(typeof value!=='string'||!value.trim()||value.length>MAX)return {kind:'invalid',module:null,requiresApproval:false};
  const command=value.trim();
  const lower=command.toLocaleLowerCase('pl');
  const routes=[
   {pattern:/^audyt\s*:/iu,module:'code-audit',kind:'legacy'},
   {pattern:/^kod\s*:/iu,module:'developer-inspector',kind:'legacy'},
   {pattern:/^diff\s*:/iu,module:'developer-diff',kind:'legacy'},
   {pattern:/^(github|zmiany|raport github)$/iu,module:'changes-report',kind:'legacy'},
   {pattern:/^plan\s*:/iu,module:'task-analyzer',kind:'legacy'},
   {pattern:/^(wtyczki|plugins|wtyczka\s*:)/iu,module:'plugin-registry',kind:'legacy'},
   {pattern:/^(historia|wyczyść historię)$/iu,module:'history',kind:'legacy'},
   {pattern:/^(meduza|rx meduza|sygnały meduzy)$/iu,module:'rx-medusa',kind:'module-status'},
   {pattern:/^(mrówki|mrowki|rx ant|zadania mrówek|zadania mrowek)$/iu,module:'rx-ant-task-board',kind:'module-status'},
   {pattern:/^(królowa|krolowa|rx queen)$/iu,module:'rx-queen',kind:'module-status'},
   {pattern:/^(bibi ai|rx bibi ai|rx ai)$/iu,module:'rx-bibi-ai',kind:'module-status'},
   {pattern:/^(komputer rx|rx mega cloud)$/iu,module:'rx-cloud-computer',kind:'module-status'}
  ];
  for(const entry of routes)if(entry.pattern.test(lower))return {kind:entry.kind,module:entry.module,requiresApproval:false};
  const natural=capabilities.conversation?.respondNatural?.(command,capabilities.analyzeTask);
  if(typeof natural==='string')return {kind:'advisory',module:'rx-conversation',message:natural,requiresApproval:false};
  return {kind:'legacy',module:'commands',requiresApproval:false};
 }
 function createSession(){
  let last=null;
  function isFollowUp(value){return /^(dalej|kontynuuj|rób|rob|sprawdź to|sprawdz to|popraw to|co dalej)[?!. ]*$/iu.test(value.trim());}
  return Object.freeze({
   remember(command){
    if(typeof command!=='string'||command.length>500)return false;
    const value=command.trim();
    if(!/^(sprawdź|sprawdz|przeanalizuj|oceń|ocen|napraw|popraw|dodaj|zbuduj|przetestuj|testuj|zoptymalizuj|przetłumacz|przetlumacz)(?:[ ]|$)/iu.test(value))return false;
    last=value;return true;
   },
   lastTask(){return last;},
   clear(){last=null;},
   followUp(value,context={}){
    if(typeof value!=='string'||!isFollowUp(value))return null;
    if(!last)return 'Nie mam jeszcze zadania w pamięci tej sesji. Napisz np. „sprawdź wyszukiwarkę VEXORIO”.';
    const task=last;
    const analysis=typeof context.analyzeTask==='function'?context.analyzeTask(task):null;
    const risk=analysis?.risk||'unknown';
    return 'Ostatnie zadanie: '+task+String.fromCharCode(10)+'Ocena ryzyka: '+risk+String.fromCharCode(10)+'Następny krok: sprawdź aktualny stan i przygotuj testy. Aby dodać je do kolejki, wpisz „plan: '+task+'”. Niczego nie uruchomiłem.';
   }
  });
 }
 function capabilities(){
  return Object.freeze([
   {id:'rx-conversation',role:'Rozmowa i analiza intencji',mode:'advisory'},
   {id:'task-analyzer',role:'Planowanie i ocena ryzyka',mode:'advisory'},
   {id:'code-audit',role:'Audyt kodu',mode:'read-only'},
   {id:'changes-report',role:'Raport GitHub',mode:'read-only'},
   {id:'developer-inspector',role:'Analiza kodu',mode:'read-only'},
   {id:'developer-diff',role:'Przegląd zmian',mode:'read-only'},
   {id:'task-queue',role:'Lokalna kolejka zadań',mode:'approval-required'},
   {id:'rx-medusa',role:'Analiza sygnałów w raportach CI',mode:'status-only'},
   {id:'rx-ant-task-board',role:'Kolejka mrówek w raportach CI',mode:'status-only'},
   {id:'rx-queen',role:'Nadzór nad raportami i zadaniami',mode:'status-only'},
   {id:'rx-bibi-ai',role:'Router i narzędzia BIBI AI',mode:'status-only'},
   {id:'rx-cloud-computer',role:'Ograniczone testy CI komputera RX',mode:'status-only'}
  ]);
 }
 const api={route,capabilities,createSession,version:'1.3.0'};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GuardRXOrchestrator=api;
})(typeof window!=='undefined'?window:null);
