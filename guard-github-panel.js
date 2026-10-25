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
   const advice=latest.status!=='completed'?'Audyt trwa. Poczekaj na wynik.':latest.conclusion==='success'?'Testy przeszły. To nie gwarantuje braku innych błędów.':latest.conclusion==='failure'?'Audyt wykrył nieudany krok. Otwórz logi GitHub Actions, ustal przyczynę i przygotuj poprawkę do zatwierdzenia.':'Sprawdź szczegóły uruchomienia w GitHub Actions.';
   const runId=Number.isSafeInteger(latest.id)&&latest.id>0?latest.id:null;

   auditOutput.textContent='Ostatni audyt: '+state+'\nData UTC: '+safeDate+'\nTryb: '+String(latest.event||'nieznany')+(scheduled?'\nOstatni automatyczny: '+String(scheduled.conclusion||scheduled.status):'\nAutomatyczny audyt jeszcze się nie odbył.')+'\nRekomendacja: '+advice+'\n'+(runId?'Raport: https://github.com/Gregg856/vexorio/actions/runs/'+runId:'Raport: GitHub Actions')+'\nBez automatycznej naprawy.';
  }catch(_){auditOutput.textContent='Nie udało się odczytać audytu z GitHub. Sprawdź GitHub Actions lub limit publicznego API.';}
  finally{auditButton.disabled=false;}
 });
 const proposalsButton=document.getElementById('guardDailyProposalsButton');
 const proposalsOutput=document.getElementById('guardDailyProposalsResult');
 if(proposalsButton&&proposalsOutput)proposalsButton.addEventListener('click',async()=>{
  proposalsButton.disabled=true;proposalsOutput.textContent='Szukam ostatnich propozycji…';
  try{
   const url='https://api.github.com/repos/Gregg856/vexorio/actions/workflows/guard-worker.yml/runs?event=schedule&per_page=10';
   const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
   if(!response.ok)throw Error('Unavailable');
   const data=await response.json();
   const runs=Array.isArray(data.workflow_runs)?data.workflow_runs:[];
   const run=runs.find(r=>r.status==='completed'&&r.conclusion==='success');
   if(!run){proposalsOutput.textContent='Nie ma jeszcze zakończonego zielonego audytu automatycznego. Raporty pojawią się po pierwszym udanym uruchomieniu.';return;}
   if(!Number.isSafeInteger(run.id)||run.id<=0)throw Error('Invalid run');
   const artifacts=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/runs/'+run.id+'/artifacts',{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
   if(!artifacts.ok)throw Error('Artifacts unavailable');
   const info=await artifacts.json();
   const found=Array.isArray(info.artifacts)&&info.artifacts.some(a=>a.name==='strazak-daily-proposals'&&!a.expired);
   proposalsOutput.textContent=(found?'✓ Raport propozycji jest gotowy.':'Raport propozycji nie jest dostępny dla tego uruchomienia.')+'\nData UTC: '+String(run.created_at||'').slice(0,16).replace('T',' ')+'\nPliki: guard-chat.js, guard-github-panel.js, guard-code-ui.js, guard-code-fix.js\nOtwórz audyt w GitHub Actions i pobierz artefakt „strazak-daily-proposals”.\n'+ 'https://github.com/Gregg856/vexorio/actions/runs/'+run.id+'\nTylko propozycje — bez automatycznego zapisu zmian.';
  }catch(_){proposalsOutput.textContent='Nie udało się pobrać informacji o propozycjach. Sprawdź GitHub Actions.';}
  finally{proposalsButton.disabled=false;}
 });
 const previewButton=document.getElementById('guardInlineProposalsButton');
 const previewOutput=document.getElementById('guardInlineProposalsResult');
 if(previewButton&&previewOutput)previewButton.addEventListener('click',async()=>{
  previewButton.disabled=true;previewOutput.textContent='Analizuję aktualne pliki z GitHub…';
  const files=['guard-chat.js','guard-github-panel.js','guard-code-ui.js','guard-code-fix.js'];
  const results=[];
  try{
   if(!window.GuardPatchPreview||typeof window.GuardPatchPreview.preview!=='function')throw Error('Missing preview');
   for(const file of files){
    const url='https://raw.githubusercontent.com/Gregg856/vexorio/main/'+file;
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status+' '+file);
    const source=await response.text();
    const report=window.GuardPatchPreview.preview({path:file,source});
    results.push('PLIK: '+file+' | Propozycje: '+report.changes.length);
    for(const change of report.changes.slice(0,10))results.push('Linia '+change.line+'\n- '+change.before+'\n+ '+change.after);
    if(report.changes.length>10)results.push('Dodatkowe propozycje pominięte w podglądzie.');
   }
   previewOutput.textContent='Podgląd lokalny aktualnego kodu GitHub (to NIE jest zapisany raport z harmonogramu).\nReguła: weryfikacja TLS.\n\n'+results.join('\n\n')+'\n\nBez zmian w repozytorium. Wymagana ręczna kontrola i zatwierdzenie.';
  }catch(_){previewOutput.textContent='Nie udało się przeanalizować plików. Sprawdź połączenie, publiczny dostęp do repozytorium i limit rozmiaru plików.';}
  finally{previewButton.disabled=false;}
 });
 const findingsButton=document.getElementById('guardSecurityFindingsButton');
 const findingsOutput=document.getElementById('guardSecurityFindingsResult');
 if(findingsButton&&findingsOutput)findingsButton.addEventListener('click',async()=>{
  findingsButton.disabled=true;findingsOutput.textContent='Sprawdzanie reguł bezpieczeństwa…';
  try{
   if(!window.GuardDeveloperInspector||typeof window.GuardDeveloperInspector.inspectSource!=='function')throw Error('Missing inspector');
   const files=['guard-chat.js','guard-github-panel.js','guard-code-ui.js','guard-code-fix.js'];
   const totals={high:0,medium:0,low:0};
   const sections=[];
   for(const file of files){
    const response=await fetch('https://raw.githubusercontent.com/Gregg856/vexorio/main/'+file,{cache:'no-store'});
    if(!response.ok)throw Error('Fetch failed');
    const source=await response.text();
    const report=window.GuardDeveloperInspector.inspectSource({path:file,source});
    sections.push('PLIK: '+file+' — sygnały: '+report.findings.length+(report.limited?' (limit 50)':''));
    for(const finding of report.findings.slice(0,20)){
     totals[finding.severity]=(totals[finding.severity]||0)+1;
     sections.push('Linia '+finding.line+' ['+finding.severity+'] '+finding.message);
    }
    if(report.findings.length>20)sections.push('Pozostałe sygnały pominięte w podglądzie.');
    if(!report.findings.length)sections.push('Brak sygnałów w obecnych regułach.');
   }
   findingsOutput.textContent='BIEŻĄCA ANALIZA KODU GITHUB (nie zapisany raport Actions)\nWysokie: '+totals.high+' | Średnie: '+totals.medium+' | Niskie: '+totals.low+'\n\n'+sections.join('\n')+'\n\nSygnały wymagają weryfikacji. Nie wykonano żadnych zmian.';
  }catch(_){findingsOutput.textContent='Analiza jest niedostępna. Sprawdź dostęp do GitHub lub odśwież panel.';}
  finally{findingsButton.disabled=false;}
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
