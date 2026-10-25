'use strict';
(()=>{
 const form=document.getElementById('guardCodeForm'),path=document.getElementById('guardCodePath'),source=document.getElementById('guardCodeSource'),out=document.getElementById('guardCodeResult');
 if(!form||!path||!source||!out)return;
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!window.GuardDeveloperInspector){out.textContent='Analizator jest niedostępny. Odśwież stronę.';return;}
  try{
   const report=window.GuardDeveloperInspector.inspectSource({path:path.value.trim(),source:source.value});
   const lines=['Plik: '+report.path,'Liczba linii: '+report.lines,'Wykryte sygnały: '+report.findings.length];
   for(const item of report.findings)lines.push('Linia '+item.line+' ['+item.severity+']: '+item.message);
   if(!report.findings.length)lines.push('Nie znaleziono sygnałów objętych obecnymi regułami. To nie gwarantuje bezpieczeństwa.');
   if(report.limited)lines.push('Wynik ograniczony do 50 sygnałów.');
   lines.push('Analiza lokalna, bez uruchamiania kodu i bez wysyłania go na serwer.');
   out.textContent=lines.join('\n');
  }catch(_){out.textContent='Nieprawidłowa nazwa pliku lub zbyt długi kod (maks. 100 000 znaków).';}
 });
})();
