'use strict';
(()=>{
 const root=document.getElementById('rxProgramsList');
 if(!root)return;
 const programs=[
 ['🎥 RX Screen Recorder','Nagrywanie udostępnionego ekranu za zgodą','panel','/rx-screen-recorder.html'],
 ['🛡️ RX Strażak','Panel i kontrola treści','panel','#guardPanelModeration'],
 ['💬 RX Czat','Rozmowy i polecenia','panel','#guardPanelChat'],
 ['💻 RX Developer','Kod, analiza i propozycje napraw','panel','#guardPanelDeveloper'],
 ['📊 RX BIBI Manager','Raporty i monitoring','panel','/rx-bibi-manager.html'],
 ['🎬 RX BIBI AI Studio','Narzędzia studia','panel','/rx-bibi-studio.html'],
 ['👑 RX QUEEN','Nadzór i pamięć','panel','#rxQueenCompare'],
 ['☁️ RX Cloud','Moduły chmury — status w Centrum Królowej','panel','#rxQueenTaskResult'],
 ['💻 RX Computer','Moduły komputera — status w Centrum Królowej','panel','#rxQueenTaskResult'],
 ['📬 RX Skrzynka','Integracja oczekuje na potwierdzenie','panel','#rxQueenTaskResult'],
 ['🐜 RX ANT TASK BOARD','Kolejka priorytetów w CI','ci','https://github.com/Gregg856/vexorio/actions'],
 ['🧠 RX ANT AI Trainer','Mały model na danych syntetycznych','experiment','https://github.com/Gregg856/vexorio/actions'],
 ['☁️ RX MEGA CLOUD','Testy wykonywane w GitHub Actions','ci','https://github.com/Gregg856/vexorio/actions'],
 ['🧬 RX DNA','Eksperymentalne moduły pamięci','experiment','https://github.com/Gregg856/vexorio'],
 ['🔬 RX Higgs Lab','Eksperyment na danych syntetycznych','experiment','https://github.com/Gregg856/vexorio'],
 ['🌌 RX Cosmic Collider','Symulacja koncepcyjna','experiment','https://github.com/Gregg856/vexorio'],
 ['☀️ RX Energy Lab','Szacowanie zapotrzebowania na energię','experiment','https://github.com/Gregg856/vexorio'],
 ['✨ RX Stellar Lab','Eksperymenty z sygnałami','experiment','https://github.com/Gregg856/vexorio'],
 ['🐜 RX Ant Academy','Testy i szkolenie reguł mrówek','ci','https://github.com/Gregg856/vexorio/actions']
 ];
 const names={panel:'Panel / narzędzie',ci:'Testy CI',experiment:'Eksperyment'};
 const list=document.createElement('div');
 list.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:10px';
 for(const [name,description,status,url] of programs){
  const a=document.createElement('a');
  a.href=url;
  if(url.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}
  a.style.cssText='display:block;padding:13px;border:1px solid #35546a;border-radius:14px;background:#102a3b;color:#e6f8ff;text-decoration:none';
  const title=document.createElement('strong');title.textContent=name;
  const desc=document.createElement('div');desc.textContent=description;desc.style.cssText='font-size:13px;margin:5px 0;color:#c0d5df';
  const state=document.createElement('small');state.textContent=names[status];state.style.color='#84dce6';
  a.append(title,desc,state);list.append(a);
 }
 root.replaceChildren(catalog);
 // Mobile-first dashboard: keep monitoring accessible, collapse the long catalog.
 const catalog=document.createElement('details');
 const catalogTitle=document.createElement('summary');
 catalogTitle.textContent='🧩 Pokaż wszystkie programy RX ('+programs.length+')';
 if(catalogTitle.style)catalogTitle.style.cssText='cursor:pointer;padding:10px 4px;font-weight:700';
 if(typeof catalog.append==='function')catalog.append(catalogTitle,list);
 if(root.style)root.style.cssText='display:flex;flex-direction:column;gap:8px';
 const catalogSection=document.getElementById('rxProgramsCatalog');
 const hero=document.querySelector?.('.rx-bibi-hero');
 if(catalogSection&&hero&&hero.parentNode===catalogSection.parentNode&&
    typeof hero.parentNode.insertBefore==='function'){
  hero.parentNode.insertBefore(catalogSection,hero.nextSibling);
 }

 const status=document.createElement('p');
 status.id='rxProgramsLiveStatus';
 status.setAttribute('role','status');
 status.textContent='⏳ Odczyt ostatnich testów RX…';
 root.prepend(status);
 const summary=document.createElement('div');
 summary.id='rxProgramsLiveRuns';
 root.insertBefore(summary,catalog);
 const refresh=document.createElement('button');
 refresh.type='button';
 refresh.textContent='↻ Odśwież statusy';
 refresh.style.cssText='margin:0 0 12px;padding:8px 12px;border:1px solid #478295;border-radius:9px;background:#123448;color:#b2edf1;cursor:pointer';
 root.insertBefore(refresh,summary);
 let loading=false;
 async function loadStatuses(){
  if(loading||document.visibilityState==='hidden')return;
  loading=true;
  refresh.disabled=true;
  status.textContent='⏳ Sprawdzanie aktualnych testów RX…';
  try{
   const response=await fetch('/api/rx/direct?command=RX%20STATUS',{cache:'no-store'});
   if(!response.ok)throw Error('http_status');
   const data=await response.json();
   if(!Array.isArray(data.runs))throw Error('invalid_response');
   const unavailable=data.runs.some(run=>run.status==='unavailable'||run.status==='unknown'||run.result===null&&run.status!=='queued'&&run.status!=='in_progress');
   status.textContent=data.degraded||unavailable?'⚠️ Raport częściowy: nie wszystkie statusy są dostępne':'📡 Ostatnie uruchomienia GitHub Actions (nie status pracy ciągłej)';
   const lines=document.createDocumentFragment();
   for(const run of data.runs){
    const line=document.createElement('p');
    const state=run.result==='success'?'🟢 Test OK':run.result==='failure'?'🔴 Błąd':run.status==='in_progress'?'🟡 W trakcie':run.status==='queued'?'⏳ W kolejce':run.status==='unavailable'?'⚪ Status niedostępny':'⚪ Brak danych';
    line.textContent=state+' — '+String(run.name||'RX')+' #'+String(run.number||'—');
    if(typeof run.link==='string'&&/^https:\/\/github\.com\/Gregg856\/vexorio\/actions\/runs\/\d+$/.test(run.link)){
     const a=document.createElement('a');a.href=run.link;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' · raport';line.append(a);
    }
    lines.append(line);
   }
   summary.replaceChildren(lines);
  }catch(_){status.textContent='⚠️ Nie udało się odświeżyć testów. Ostatnie wyniki pozostają widoczne.';}
  finally{loading=false;refresh.disabled=false;}
 }
 refresh.addEventListener('click',loadStatuses);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadStatuses();});
 setInterval(()=>{if(document.visibilityState==='visible')loadStatuses();},60000);
 loadStatuses();
})();
