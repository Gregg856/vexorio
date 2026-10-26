'use strict';
(()=>{
 const form=document.getElementById('guardCodeForm'),path=document.getElementById('guardCodePath'),source=document.getElementById('guardCodeSource'),out=document.getElementById('guardCodeResult');
 if(!form||!path||!source||!out)return;
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!window.GuardDeveloperInspector){out.textContent='Analizator jest niedostępny. Odśwież stronę.';return;}
  try{
   const report=window.GuardDeveloperInspector.inspectSource({path:path.value.trim(),source:source.value});
   const summary=report.summary||{high:0,medium:0,low:0,total:report.findings.length};
   const lines=['Plik: '+report.path,'Liczba linii: '+report.lines,'Wykryte sygnały: '+summary.total,'Podsumowanie zagrożeń: wysokie '+summary.high+' | średnie '+summary.medium+' | niskie '+summary.low];
   for(const item of report.findings)lines.push('Linia '+item.line+' ['+item.severity+']: '+item.message);
   if(!report.findings.length)lines.push('Nie znaleziono sygnałów objętych obecnymi regułami. To nie gwarantuje bezpieczeństwa.');
   if(report.limited)lines.push('Wynik ograniczony do 50 sygnałów.');
   lines.push('Analiza lokalna, bez uruchamiania kodu i bez wysyłania go na serwer.');
   if(window.GuardCodeFix){
    const fixes=window.GuardCodeFix.suggestFixes(report);
    if(fixes.suggestions.length){
     lines.push('\\nStrażak Code Fix — propozycje napraw:');
     for(const fix of fixes.suggestions)lines.push('Linia '+fix.line+' ['+fix.severity+'] '+fix.title+': '+fix.advice);
    }
    lines.push('Code Fix nie zmienił ani nie uruchomił kodu.');
   }
   if(window.GuardPatchPreview&&/\\.(?:js|cjs|mjs)$/.test(report.path)){
    const patch=window.GuardPatchPreview.preview({path:report.path,source:source.value});
    if(patch.changes.length){
     lines.push('\\nStrażak Patch Preview — propozycja zmian (niezastosowana):');
     for(const change of patch.changes.slice(0,10)){
      lines.push('Linia '+change.line+'\\n- '+change.before+'\\n+ '+change.after);
     }
     lines.push(patch.warning);
    }
   }
   out.textContent=lines.join('\n');
  }catch(_){out.textContent='Nieprawidłowa nazwa pliku lub zbyt długi kod (maks. 100 000 znaków).';}
 });
})();
