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
 root.replaceChildren(list);
 const status=document.createElement('p');
 status.id='rxProgramsLiveStatus';
 status.setAttribute('role','status');
 status.textContent='⏳ Odczyt ostatnich testów RX…';
 root.prepend(status);
 const summary=document.createElement('div');
 summary.id='rxProgramsLiveRuns';
 root.insertBefore(summary,list);
 fetch('/api/rx/direct?command=RX%20STATUS',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw Error('http_status');return r.json();})
  .then(data=>{
   if(!Array.isArray(data.runs))throw Error('invalid_response');
   const unavailable=data.runs.some(run=>run.status==='unavailable'||run.result===null);
   status.textContent=data.degraded?'⚠️ Raport GitHub częściowo niedostępny':unavailable?'⚠️ Raport częściowy: nie wszystkie statusy są dostępne':'📡 Ostatnie uruchomienia GitHub Actions (nie status pracy ciągłej)';
   for(const run of data.runs){
    const line=document.createElement('p');
    const state=run.result==='success'?'🟢 Test OK':run.result==='failure'?'🔴 Błąd':run.status==='in_progress'?'🟡 W trakcie':run.status==='queued'?'⏳ W kolejce':run.status==='unavailable'?'⚪ Status niedostępny':'⚪ Brak danych';
    line.textContent=state+' — '+String(run.name||'RX')+' #'+String(run.number||'—');
    if(typeof run.link==='string'&&/^https:\/\/github\.com\/Gregg856\/vexorio\/actions\/runs\/\d+$/.test(run.link)){
     const a=document.createElement('a');a.href=run.link;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' · raport';line.append(a);
    }
    summary.append(line);
   }
  }).catch(()=>{status.textContent='⚠️ Nie udało się pobrać statusu testów. Katalog programów pozostaje dostępny.';});

})();
