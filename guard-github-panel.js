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
   const deployed=match[1].toLowerCase();
   liveOutput.textContent='Cloudflare: '+deployed.slice(0,10)+' · Sprawdzanie GitHub…';
   try{
    const github=await fetch('https://api.github.com/repos/Gregg856/vexorio/commits/main',{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if(!github.ok)throw Error('GitHub unavailable');
    const data=await github.json();
    if(!data||typeof data.sha!=='string'||!/^[a-f0-9]{40}$/i.test(data.sha))throw Error('Invalid GitHub SHA');
    const latest=data.sha.toLowerCase();
    liveOutput.textContent='Cloudflare: '+deployed.slice(0,10)+'\\nGitHub main: '+latest.slice(0,10)+'\\n'+(deployed===latest?'✓ Wersje zgodne.':'⏳ Wersje różne — publikacja może być w toku albo wymagać sprawdzenia.')+'\\nPorównanie numerów wersji nie zastępuje testów.';
   }catch(_){
    liveOutput.textContent='Cloudflare: '+deployed.slice(0,10)+'\\nNie udało się odczytać aktualnej wersji GitHub. Sprawdź Actions.';
   }
  }catch(_){liveOutput.textContent='Nie udało się potwierdzić wersji na serwerze. Sprawdź GitHub Actions.';}
  finally{liveButton.disabled=false;}
 });
 const auditButton=document.getElementById('guardAutoAuditButton');
 const auditOutput=document.getElementById('guardAutoAuditResult');
 if(auditButton&&auditOutput)auditButton.addEventListener('click',async()=>{
  auditButton.disabled=true;auditOutput.textContent='Sprawdzanie ostatniego audytu…';
  try{
   const url='https://api.github.com/repos/Gregg856/vexorio/actions/workflows/guard-worker.yml/runs?per_page=15';
   const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
   if(!response.ok)throw Error('GitHub HTTP '+response.status);
   const data=await response.json();
   const runs=Array.isArray(data.workflow_runs)?data.workflow_runs:[];
   const latest=runs[0];
   if(!latest)throw Error('Brak audytów');
   const safeDate=typeof latest.created_at==='string'?latest.created_at.slice(0,16).replace('T',' '):'brak daty';
   const state=latest.status==='completed'?(latest.conclusion==='success'?'✓ Zielony':latest.conclusion==='failure'?'✗ Błędy':'Zakończony: '+String(latest.conclusion||'nieznany')):'⏳ '+String(latest.status||'w toku');
   const scheduled=runs.find(r=>r.event==='schedule');
   auditOutput.textContent='Ostatni audyt: '+state+'\nData UTC: '+safeDate+'\nTryb: '+String(latest.event||'nieznany')+(scheduled?'\nOstatni automatyczny: '+String(scheduled.conclusion||scheduled.status):'\nAutomatyczny audyt jeszcze się nie odbył.')+'\nSzczegóły: GitHub Actions. Wynik nie oznacza automatycznej naprawy.';
  }catch(_){auditOutput.textContent='Nie udało się odczytać audytu z GitHub. Sprawdź GitHub Actions lub limit publicznego API.';}
  finally{auditButton.disabled=false;}
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
