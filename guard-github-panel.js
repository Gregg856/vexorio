'use strict';
(()=>{
 const button=document.getElementById('guardGithubReportButton');
 const output=document.getElementById('guardGithubReportResult');
 const liveButton=document.getElementById('guardLiveVersionButton');
 const liveOutput=document.getElementById('guardLiveVersionResult');
 if(liveButton&&liveOutput)liveButton.addEventListener('click',async()=>{
  liveButton.disabled=true;
  liveOutput.textContent='Sprawdzanie wersji na serwerze…';
  try{
   const response=await fetch('/?guard_version_check='+Date.now(),{cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const html=await response.text();
   const match=html.match(/<meta\s+name=["']vexorio-deploy-sha["']\s+content=["']([a-f0-9]{40})["']/i);
   if(!match)throw Error('No deploy marker');
   liveOutput.textContent='Wersja na serwerze: '+match[1].slice(0,10)+'. To potwierdza odczyt opublikowanej wersji, nie wynik wszystkich testów.';
  }catch(_){liveOutput.textContent='Nie udało się potwierdzić wersji na serwerze. Sprawdź GitHub Actions.';}
  finally{liveButton.disabled=false;}
 });
 if(!button||!output)return;
 button.addEventListener('click',async()=>{
  button.disabled=true;output.textContent='Pobieranie raportu…';
  try{
   const response=await fetch('/guard-changes-summary.json',{cache:'no-store'});
   if(!response.ok)throw Error('Unavailable');
   const r=await response.json();
   if(r.status!=='ok'||!Number.isInteger(r.changedFiles)||!r.summary)throw Error('Invalid report');
   const count=n=>Number.isInteger(n)&&n>=0?n:0;
   output.textContent='Ostatni raport GitHub Actions\nSprawdzone pliki: '+r.changedFiles+'\nWysokie: '+count(r.summary.high)+'\nŚrednie: '+count(r.summary.medium)+'\nNiskie: '+count(r.summary.low)+'\nRaport tylko do odczytu. Nie wprowadza zmian.';
  }catch(_){output.textContent='Raport jest chwilowo niedostępny. Sprawdź najnowszą publikację GitHub Actions.';}
  finally{button.disabled=false;}
 });
})();
