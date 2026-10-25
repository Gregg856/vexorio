'use strict';
(async function rxBibiTesterStatus(){
 const panel=document.getElementById('browserTester');if(!panel)return;
 const url='https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-bibi-browser.yml/runs?per_page=20';
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 const line=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=value;return e;};
 try{
  const response=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('GitHub API HTTP '+response.status);
  const data=await response.json();const runs=Array.isArray(data.workflow_runs)?data.workflow_runs:[];const run=runs[0]||null;
  panel.replaceChildren(line('strong','','🧪 RX BIBI Tester 1.0'));
  if(!run){panel.append(line('p','wait','Nie uruchomiono jeszcze testów przeglądarkowych.'));return;}
  const finished=runs.filter(item=>item.status==='completed');
  const passed=finished.filter(item=>item.conclusion==='success').length;
  const failedCount=finished.filter(item=>item.conclusion==='failure').length;
  const other=finished.length-passed-failedCount;
  panel.append(line('p','meta','Ostatnie '+runs.length+' uruchomień: '+passed+' udanych · '+failedCount+' nieudanych · '+(runs.length-finished.length)+' w toku'+(other?' · '+other+' innych':'')+'.'));
  const success=run.status==='completed'&&run.conclusion==='success';
  const failed=run.status==='completed'&&run.conclusion==='failure';
  const label=success?'Ostatni test: udany':failed?'Ostatni test: nieudany':run.status!=='completed'?'Test w toku':'Test zakończony: '+String(run.conclusion||'brak wyniku');
  panel.append(line('p',success?'ok':failed?'bad':'wait',label));
  const date=Date.parse(run.updated_at||run.created_at||'');
  panel.append(line('p','meta','Odczyt GitHub Actions · '+(Number.isFinite(date)?new Date(date).toLocaleString('pl-PL'):'brak daty')+' · commit '+String(run.head_sha||'').slice(0,8)));
  if(typeof run.html_url==='string'&&/^https:\/\/github\.com\/Gregg856\/vexorio\/actions\/runs\/\d+$/.test(run.html_url)){
   const a=line('a','','Otwórz test i raporty');a.href=run.html_url;a.target='_blank';a.rel='noopener noreferrer';panel.append(a);
  }
  if(Number.isSafeInteger(run.id)&&run.id>0&&run.status==='completed'){
   const details=line('div','meta','Pobieram szczegóły przebiegu…');panel.append(details);
   try{
    const jobResponse=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/runs/'+run.id+'/jobs?per_page=30',{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal:controller.signal});
    if(!jobResponse.ok)throw Error('HTTP '+jobResponse.status);
    const jobData=await jobResponse.json();const jobs=Array.isArray(jobData.jobs)?jobData.jobs:[];
    const steps=jobs.flatMap(job=>Array.isArray(job.steps)?job.steps:[]);
    const failedSteps=steps.filter(step=>step.conclusion==='failure');
    const passedSteps=steps.filter(step=>step.conclusion==='success');
    details.replaceChildren(line('p','meta','Etapy GitHub Actions: '+passedSteps.length+' udanych · '+failedSteps.length+' nieudanych.'));
    const testStep=steps.find(step=>step.name==='Uruchom testy RX BIBI');
    if(testStep)details.append(line('p',testStep.conclusion==='success'?'ok':testStep.conclusion==='failure'?'bad':'wait','Testy przeglądarkowe: '+(testStep.conclusion==='success'?'zaliczone':testStep.conclusion==='failure'?'wykryto problem':'brak rozstrzygnięcia')+'.'));
    if(failedSteps.length){
     const list=document.createElement('ul');
     for(const step of failedSteps.slice(0,5))list.append(line('li','bad',String(step.name||'Nieznany etap')));
     details.append(list,line('p','meta','Dalszy krok: otwórz log nieudanego etapu i raport z testów. Nie ponawiaj wdrożenia bez ustalenia przyczyny.'));
    }else if(success)details.append(line('p','ok','Wszystkie etapy workflow zakończyły się pomyślnie.'));
    const artifactResponse=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/runs/'+run.id+'/artifacts?per_page=20',{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal:controller.signal});
    if(artifactResponse.ok){
     const artifactData=await artifactResponse.json();
     const artifact=(Array.isArray(artifactData.artifacts)?artifactData.artifacts:[]).find(item=>item.name==='rx-bibi-mobile-report'&&!item.expired);
     if(artifact){const report=line('a','','Pobierz raport JSON/HTML, incydenty i zrzuty ekranu');report.href='https://github.com/Gregg856/vexorio/actions/runs/'+run.id+'/artifacts/'+artifact.id;report.target='_blank';report.rel='noopener noreferrer';details.append(report);}
     else details.append(line('p','meta','Raport nie jest dostępny lub wygasł.'));
    }
   }catch(error){details.textContent='Szczegóły etapów niedostępne ('+String(error.message||'błąd')+'). Otwórz raport GitHub.';}
  }
  panel.append(line('p','meta','Wynik dotyczy testów Playwright, a nie pełnego audytu całego serwisu. Raporty dostępne w artefaktach GitHub.'));
 }catch(error){panel.replaceChildren(line('strong','','🧪 RX BIBI Tester 1.0'),line('p','wait','Nie można pobrać wyniku: '+String(error.message||'błąd połączenia')));}
 finally{clearTimeout(timer);}
})();
