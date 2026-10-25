'use strict';
// Read-only local Strażak plugin: explain the last GitHub Actions code review.
// Receives sanitized report data, never a token or GitHub credential.
(function(root){
 function installChangesReport(registry,getReport){
  if(!registry||typeof registry.register!=='function'||typeof getReport!=='function')throw Error('Changes report unavailable');
  return registry.register({
   id:'changes-report',description:'Ostatni raport zmian GitHub Actions (tylko odczyt)',permissions:['read:status'],
   async run(){
    const report=await getReport();
    if(!report||report.status!=='ok'||!report.summary||!Number.isInteger(report.changedFiles))return {message:'Raport zmian nie jest jeszcze dostępny.'};
    const s=report.summary;
    const count=n=>Number.isInteger(n)&&n>=0?n:0;
    return {message:'Ostatnia analiza GitHub: '+report.changedFiles+' plików. Wysokie: '+count(s.high)+', średnie: '+count(s.medium)+', niskie: '+count(s.low)+'.\nRaport jest informacyjny, nie uruchamia poprawek.'};
   }
  });
 }
 const api={installChangesReport};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GuardChangesReportPlugin=api;
})(typeof window!=='undefined'?window:null);
