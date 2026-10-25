'use strict';
// Strażak Developer 3.0: bounded local source scan plugin; read-only.
(function(root){
 function installCodeAudit(registry,inspect){
  if(!registry||typeof registry.register!=='function'||typeof inspect!=='function')throw Error('Code audit unavailable');
  return registry.register({
   id:'code-audit',description:'Lokalny audyt fragmentu JavaScript bez uruchamiania kodu',permissions:['read:task'],
   run:({task})=>{
    const report=inspect({path:'fragment.js',source:task});
    const findings=report.findings.slice(0,12);
    return {message:'Audyt kodu: '+report.lines+' linii; sygnały: '+report.findings.length+'.'+(findings.length?'\n'+findings.map(f=>'Linia '+f.line+' ['+f.severity+'] '+f.message).join('\n'):'\nNie znaleziono sygnałów w dostępnych regułach.')+'\nAnaliza lokalna, bez zmian w plikach. Brak sygnałów nie gwarantuje bezpieczeństwa.'};
   }
  });
 }
 const api=Object.freeze({installCodeAudit});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GuardCodeAuditPlugin=api;
})(typeof window!=='undefined'?window:null);
