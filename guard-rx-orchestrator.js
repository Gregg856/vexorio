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
   {pattern:/^(historia|wyczyść historię)$/iu,module:'history',kind:'legacy'}
  ];
  for(const entry of routes)if(entry.pattern.test(lower))return {kind:entry.kind,module:entry.module,requiresApproval:false};
  const natural=capabilities.conversation?.respondNatural?.(command,capabilities.analyzeTask);
  if(typeof natural==='string')return {kind:'advisory',module:'rx-conversation',message:natural,requiresApproval:false};
  return {kind:'legacy',module:'commands',requiresApproval:false};
 }
 function capabilities(){
  return Object.freeze([
   {id:'rx-conversation',role:'Rozmowa i analiza intencji',mode:'advisory'},
   {id:'task-analyzer',role:'Planowanie i ocena ryzyka',mode:'advisory'},
   {id:'code-audit',role:'Audyt kodu',mode:'read-only'},
   {id:'changes-report',role:'Raport GitHub',mode:'read-only'},
   {id:'developer-inspector',role:'Analiza kodu',mode:'read-only'},
   {id:'developer-diff',role:'Przegląd zmian',mode:'read-only'},
   {id:'task-queue',role:'Lokalna kolejka zadań',mode:'approval-required'}
  ]);
 }
 const api={route,capabilities,version:'1.1.0'};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GuardRXOrchestrator=api;
})(typeof window!=='undefined'?window:null);
