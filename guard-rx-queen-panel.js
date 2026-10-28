'use strict';
(()=> {
 const button=document.getElementById('rxQueenCompare'),result=document.getElementById('rxQueenResult');
 if(!button||!result)return;
 const snapshotField=document.getElementById('rxQueenSnapshot');
 const save=document.getElementById('rxQueenSaveMemory');
 const clear=document.getElementById('rxQueenClearMemory');
 const key='rx_queen_verified_memory_v1';
 // Read-only task triage: ants propose checks, Queen explicitly approves a plan.
 const taskInput=document.getElementById('rxQueenTask');
 const analyzeTask=document.getElementById('rxQueenTaskAnalyze');
 const approveTask=document.getElementById('rxQueenTaskApprove');
 const taskResult=document.getElementById('rxQueenTaskResult');
 let proposedTask=null;
 // Session-only work overview. Never suggests that a plan was executed.
 let plannedInSession=0,approvedInSession=0;
 const workOverview=document.createElement('p');
 workOverview.id='rxQueenWorkOverview';
 workOverview.setAttribute('aria-live','polite');
 if(workOverview.style)workOverview.style.cssText='white-space:pre-wrap;padding:10px;border:1px solid #42798c;border-radius:10px';
 const refreshWorkOverview=()=>{
  workOverview.textContent='🐜 Raport pracy mrówek (ta sesja)\\nPlany przygotowane: '+plannedInSession+'\\nPlany zatwierdzone do ręcznej realizacji: '+approvedInSession+'\\nOczekuje na decyzję: '+(proposedTask?1:0)+'\\nAutomatycznie wykonane: 0\\nTo podgląd działań w panelu, nie raport serwera ani historia pracy w tle.';
 };
 if(taskResult?.parentNode){taskResult.parentNode.insertBefore(workOverview,taskResult);refreshWorkOverview();}


 if(typeof document.createElement==='function'){
 // Queen hub: honest inventory of modules; CI reports are evidence of tests, not uptime.
 const hub=document.createElement('section');
 if(hub.style)hub.style.cssText='margin:10px 0;padding:10px;border:1px solid #42798c;border-radius:12px';
 const hubTitle=document.createElement('strong');hubTitle.textContent='👑 Centrum RX: Chmura · Komputer · Skrzynka';
 const hubStatus=document.createElement('p');
 if(hubStatus.style)hubStatus.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5';
 hubStatus.textContent='☁️ Chmura: moduł kodu istnieje, stan pracy niepotwierdzony.\\n💻 Komputer: moduł kodu istnieje, stan pracy niepotwierdzony.\\n📬 Skrzynka RX: brak potwierdzonego połączenia.\\n🐜 Mrówki: status testów do sprawdzenia.';
 const hubRefresh=document.createElement('button');hubRefresh.type='button';hubRefresh.textContent='↻ Sprawdź raporty modułów';
 if(hubRefresh.style)hubRefresh.style.cssText='padding:9px;border-radius:9px;min-height:40px';
 if(typeof hub.append==='function')hub.append(hubTitle,hubStatus,hubRefresh);
 const queenPanel=document.getElementById('guardPanelQueen');
 if(queenPanel&&typeof queenPanel.insertBefore==='function')queenPanel.insertBefore(hub,queenPanel.firstChild?.nextSibling||queenPanel.firstChild);
 else if(taskResult?.parentNode&&typeof taskResult.parentNode.insertBefore==='function')taskResult.parentNode.insertBefore(hub,taskResult);
 hubRefresh.addEventListener('click',async()=>{
  hubRefresh.disabled=true;hubStatus.textContent='Sprawdzam raporty CI…';
  try{
   const response=await fetch('/api/rx/modules',{cache:'no-store'});
   if(!response.ok)throw Error('ci_unavailable');
   const data=await response.json();
   if(!Array.isArray(data.runs))throw Error('invalid_report');
   const format=(id,label)=>{
    const item=data.runs.find(x=>x.id===id);
    return label+': '+(!item?'⚪ brak raportu':item.conclusion==='success'?'🟢 test OK (nie potwierdza pracy ciągłej)':item.conclusion==='failure'?'🔴 test nieudany':item.status==='in_progress'?'🟡 test trwa':'⚪ wynik niepotwierdzony');
   };
   hubStatus.textContent='☁️ Chmura: kod RX Cloud / Mega Cloud; stan pracy niepotwierdzony.\\n💻 Komputer: kod RX Computer; stan pracy niepotwierdzony.\\n📬 Skrzynka RX: połączenie niepotwierdzone.\\n'+format('rx-queen','👑 Królowa')+'\\n'+format('rx-medusa','🐙 Meduza')+'\\n'+format('rx-ant-task-board','🐜 Mrówki');
  }catch(_){hubStatus.textContent='⚪ Raporty chwilowo niedostępne. Nie można potwierdzić stanu modułów.';}
  finally{hubRefresh.disabled=false;}
 });


 // RX DIRECT: read-only public GitHub inbox. Commands are never executed or approved automatically.
 const directButton=document.createElement('button');
 directButton.type='button';directButton.textContent='📬 Pobierz polecenia od ChatGPT';
 const directStatus=document.createElement('p');
 directStatus.style.whiteSpace='pre-wrap';
 directStatus.textContent='Skrzynka RX DIRECT: oczekuje na sprawdzenie.';
 hub.append(directButton,directStatus);
 directButton.addEventListener('click',async()=>{
  directButton.disabled=true;directStatus.textContent='Sprawdzam skrzynkę RX…';
  try{
   const response=await fetch('/rx-direct-inbox.json',{cache:'no-store'});
   if(!response.ok)throw Error('inbox_unavailable');
   const data=await response.json();
   if(data?.schema!==1||data.kind!=='rx-direct-inbox'||!Array.isArray(data.commands)||data.commands.length>20)throw Error('invalid_inbox');
   const seen=new Set();
   for(const item of data.commands){
    if(!item||typeof item.id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(item.id)||seen.has(item.id)||typeof item.description!=='string'||item.description.length<1||item.description.length>2000||item.status!=='needs_review')throw Error('invalid_command');
    seen.add(item.id);
   }
   directStatus.textContent=data.commands.length?'📬 Polecenia do przejrzenia: '+data.commands.length+'\\n'+data.commands.map(x=>'• '+x.id+': '+x.description).join('\\n'):'📭 Skrzynka RX jest pusta.';
   if(data.commands.length&&taskInput){taskInput.value=data.commands[0].description;resetTask();directStatus.textContent+='\\nPierwsze polecenie skopiowano do analizy. Kliknij Analizuj; niczego nie uruchomiono.';}
  }catch(_){directStatus.textContent='⚪ Nie można potwierdzić skrzynki RX. Niczego nie wykonano.';}
  finally{directButton.disabled=false;}
 });

 // Refresh once on opening Queen's tab; keep the manual refresh available.
 let hubLoaded=false;
 const queenTab=document.getElementById('guardTabQueen');
 queenTab?.addEventListener('click',()=>{if(!hubLoaded){hubLoaded=true;hubRefresh.click();}});
 if(queenTab?.getAttribute('aria-selected')==='true'){hubLoaded=true;hubRefresh.click();}

 // Queen CI triage: read-only evidence, never dispatches jobs or changes code.
 const ciButton=document.createElement('button');
 ciButton.type='button';
 ciButton.textContent='👑 Pobierz testy i przygotuj polecenie';
 if(ciButton.style)ciButton.style.cssText='margin:8px 0;padding:10px 12px;border-radius:10px;cursor:pointer';
 if(taskResult?.parentNode&&typeof taskResult.parentNode.insertBefore==='function')taskResult.parentNode.insertBefore(ciButton,taskResult);
 let ciBusy=false;
 ciButton.addEventListener('click',async()=>{
  if(ciBusy)return;
  ciBusy=true;ciButton.disabled=true;
  if(taskResult)taskResult.textContent='👑 Królowa: pobieram raporty testów RX…';
  try{
   const response=await fetch('/api/rx/modules',{cache:'no-store'});
   if(!response.ok)throw Error('ci_unavailable');
   const data=await response.json();
   if(!Array.isArray(data.runs))throw Error('invalid_ci_report');
   const failed=data.runs.filter(x=>x&&x.conclusion==='failure');
   const active=data.runs.filter(x=>x&&(x.status==='queued'||x.status==='in_progress'));
   const lines=['👑 Raport Królowej — odczyt CI','Sprawdzono modułów: '+data.runs.length,'Błędy: '+failed.length,'W trakcie / kolejka: '+active.length];
   if(failed.length){
    const first=failed[0];
    const id=String(first.id||'moduł RX').slice(0,80);
    const description='Sprawdź błąd CI modułu '+id+'; przeanalizuj log, przygotuj poprawkę i test regresji.';
    if(taskInput)taskInput.value=description;
    proposedTask=null;if(approveTask)approveTask.disabled=true;
    lines.push('🐜 Propozycja polecenia wpisana do pola zadania: '+description);
    if(typeof first.link==='string'&&/^https:\/\/github\.com\/Gregg856\/vexorio\/actions\/runs\/\d+$/.test(first.link))lines.push('Raport: '+first.link);
    lines.push('Naciśnij Analizuj, a następnie zatwierdź plan. Nie uruchomiono żadnej zmiany.');
   }else if(active.length){
    lines.push('⏳ Testy jeszcze trwają. Nie tworzę polecenia naprawy bez wyniku.');
   }else{
    lines.push('🟢 W raporcie brak nieudanych testów. Nie tworzę zbędnego zadania.');
   }
   if(taskResult)taskResult.textContent=lines.join('\\n');
  }catch(_){
   if(taskResult)taskResult.textContent='⚪ Raport CI niedostępny. Królowa nie tworzy zadania bez potwierdzonych danych.';
  }finally{ciBusy=false;ciButton.disabled=false;}
 });

 }
 const classifyTask=description=>{
  const text=description.toLocaleLowerCase('pl');
  const cells=[];
  if(/błąd|blad|test|awari|nie działa|nie dziala|fail/.test(text))cells.push('tests','diagnostics');
  if(/kod|javascript|css|html|funkcj|skrypt/.test(text))cells.push('code');
  if(/hasł|hasl|sekret|token|bezpiecz|uprawnien/.test(text))cells.push('security');
  if(/wydajno|wolno|szybko|opóźn|opozn/.test(text))cells.push('performance');
  if(!cells.length)cells.push('diagnostics');
  return [...new Set(cells)];
 };
 const resetTask=()=>{proposedTask=null;if(approveTask)approveTask.disabled=true;refreshWorkOverview();};
 taskInput?.addEventListener('input',resetTask);
 analyzeTask?.addEventListener('click',()=>{
  const description=taskInput?.value.trim()||'';
  if(!description||description.length>2000){if(taskResult)taskResult.textContent='Wpisz zadanie (maksymalnie 2000 znaków).';resetTask();return;}
  const cells=classifyTask(description);
  proposedTask={description,cells};plannedInSession++;refreshWorkOverview();
  if(approveTask)approveTask.disabled=false;
  if(taskResult)taskResult.textContent='🐜 Plan mrówek (reguły, bez modelu AI)\nZadanie: '+description+'\nKomórki: '+cells.join(', ')+'\nKroki: 1. Analiza 2. Testy 3. Raport dla Królowej 4. Ręczna decyzja\nStatus: OCZEKUJE NA ZATWIERDZENIE. Niczego nie wykonano.';
 });
 approveTask?.addEventListener('click',()=>{
  if(!proposedTask||taskInput?.value.trim()!==proposedTask.description)return;
  if(taskResult)taskResult.textContent='👑 PLAN ZATWIERDZONY DO RĘCZNEJ REALIZACJI\nZadanie: '+proposedTask.description+'\nKomórki: '+proposedTask.cells.join(', ')+'\nNie uruchomiono zadań, testów, zapisu ani wdrożenia. Wykonanie wymaga osobnego działania.';
  approvedInSession++;resetTask();refreshWorkOverview();
 });

 // RX NEURON 2.4: opt-in, local-only transfer of approved fixes.
 const exportButton=document.getElementById('rxQueenExportMemory');
 const importButton=document.getElementById('rxQueenImportPreview');
 const confirmButton=document.getElementById('rxQueenImportConfirm');
 let pendingImport=null;
 const resetPending=()=>{pendingImport=null;if(confirmButton)confirmButton.disabled=true;};
 const parsed=x=>JSON.parse(sanitize(x));
 const id=p=>p.cell+':'+p.code;
 exportButton?.addEventListener('click',()=>{
  try{
   const saved=localStorage.getItem(key);
   if(!saved)throw Error('No approved memory');
   const blob=new Blob([sanitize(saved)],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download='rx-approved-memory-v1.json';a.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   result.textContent='Eksport zatwierdzonej pamięci przygotowany. Plik pozostaje na Twoim urządzeniu.';
  }catch(_){result.textContent='Brak poprawnej zatwierdzonej pamięci do eksportu.';}
 });
 importButton?.addEventListener('click',()=>{
  resetPending();
  try{
   const incoming=parsed(snapshotField.value);
   const current=localStorage.getItem(key);
   const existing=current?parsed(current):{version:1,patterns:[]};
   const byId=new Map(existing.patterns.map(p=>[id(p),p]));
   let additions=0,agreements=0;const conflicts=[];
   for(const p of incoming.patterns){
    const old=byId.get(id(p));
    if(!old){byId.set(id(p),p);additions++;}
    else if(old.verifiedFix===p.verifiedFix)agreements++;
    else conflicts.push(id(p));
   }
   if(byId.size>200)throw Error('Too many patterns');
   if(conflicts.length){
    result.textContent='RX NEURON 2.4 — KONFLIKT. Brak zapisu. Konfliktujące wpisy: '+conflicts.slice(0,15).join(', ')+(conflicts.length>15?'…':'');
    return;
   }
   const merged=JSON.stringify({version:1,patterns:[...byId.values()]});
   pendingImport=merged;
   if(confirmButton)confirmButton.disabled=false;
   result.textContent='RX NEURON 2.4 — PODGLĄD: nowe '+additions+', zgodne '+agreements+', konflikty 0. Nic nie zapisano. Naciśnij Potwierdź import, aby zachować zatwierdzone wpisy lokalnie.';
  }catch(_){result.textContent='Import odrzucony. Sprawdź wersję, poprawność i limit pamięci JSON.';}
 });
 confirmButton?.addEventListener('click',()=>{
  if(!pendingImport)return;
  try{
   localStorage.setItem(key,pendingImport);
   snapshotField.value=pendingImport;
   result.textContent='RX NEURON 2.4 — zatwierdzona pamięć połączona i zapisana lokalnie.';
  }catch(_){result.textContent='Nie udało się zapisać pamięci lokalnie.';}
  resetPending();
 });
 snapshotField?.addEventListener('input',resetPending);

 const safe=x=>typeof x==='string'&&/^[a-z0-9_-]{1,64}$/i.test(x);
 function sanitize(raw){
  const data=JSON.parse(raw);
  if(data?.version!==1||!Array.isArray(data.patterns)||data.patterns.length>200)throw Error('Invalid memory');
  const keys=new Set(),patterns=[];
  for(const p of data.patterns){
   if(!p||!safe(p.cell)||!safe(p.code)||!Number.isSafeInteger(p.count)||p.count<1||
      (p.verifiedFix!==undefined&&!safe(p.verifiedFix)))throw Error('Invalid pattern');
   const id=p.cell+':'+p.code;
   if(keys.has(id))throw Error('Duplicate pattern');
   keys.add(id);
   if(p.verifiedFix)patterns.push({cell:p.cell,code:p.code,count:p.count,verifiedFix:p.verifiedFix});
  }
  return JSON.stringify({version:1,patterns});
 }
 try{
  const saved=localStorage.getItem(key);
  if(saved&&snapshotField){
   snapshotField.value=sanitize(saved);
   result.textContent='Wczytano zapisane lokalnie identyfikatory potwierdzonych napraw. Wybierz komórkę i kod błędu.';
  }
 }catch(_){result.textContent='Lokalna pamięć jest niedostępna lub niepoprawna. Możesz wkleić eksport ręcznie.';}
 save?.addEventListener('click',()=>{
  try{
   const cleaned=sanitize(snapshotField?.value||'');
   localStorage.setItem(key,cleaned);
   snapshotField.value=cleaned;
   result.textContent='Zapisano wyłącznie zatwierdzone identyfikatory napraw na tym urządzeniu. Przy następnym otwarciu panel wczyta je sam.';
  }catch(_){result.textContent='Nie udało się zapisać pamięci. Sprawdź eksport i dostępność pamięci przeglądarki.';}
 });
 clear?.addEventListener('click',()=>{
  try{localStorage.removeItem(key);if(snapshotField)snapshotField.value='';result.textContent='Lokalna pamięć królowej została wyczyszczona.';}
  catch(_){result.textContent='Nie udało się wyczyścić lokalnej pamięci.';}
 });
 button.addEventListener('click',()=>{
  const learnedField=document.getElementById('rxQueenLearned');
  const manualField=document.getElementById('rxQueenMemory');
  if(!learnedField||!manualField){result.textContent='Brakuje pól porównania RX. Zgłoś błąd panelu.';return;}
  const learned=learnedField.value.trim();
  const manual=manualField.value.trim();
  const snapshot=document.getElementById('rxQueenSnapshot')?.value.trim()||'';
  const cell=document.getElementById('rxQueenCell')?.value.trim()||'';
  const code=document.getElementById('rxQueenCode')?.value.trim()||'';
  const valid=x=>typeof x==='string'&&/^[a-z0-9_-]{1,64}$/i.test(x);
  if((manual&&!valid(manual))||(learned&&!valid(learned))){result.textContent='Nieprawidłowy identyfikator naprawy.';return;}
  let memory=manual,source='ręcznie';
  if(snapshot){
   try{
    const data=JSON.parse(snapshot);
    if(data?.version!==1||!Array.isArray(data.patterns)||data.patterns.length>1000||!valid(cell)||!valid(code))throw Error();
    const patterns=data.patterns;
    for(const p of patterns)if(!p||!valid(p.cell)||!valid(p.code)||!Number.isSafeInteger(p.count)||p.count<1||(p.verifiedFix!==undefined&&!valid(p.verifiedFix)))throw Error();
    const matches=patterns.filter(p=>p.cell===cell&&p.code===code);
    if(matches.length>1)throw Error();
    memory=matches[0]?.verifiedFix||'';
    source='eksport pamięci RX';
   }catch(_){result.textContent='Nieprawidłowy eksport pamięci RX lub kod błędu. Nie wykonano porównania.';return;}
  }
  const state=memory&&learned?(memory===learned?'ZGODNOŚĆ':'KONFLIKT'):memory?'TYLKO PAMIĘĆ':learned?'TYLKO MODEL':'NIEZNANY BŁĄD';
  result.textContent='RX NEURON 2.2 — '+state+'\nPamięć ('+source+'): '+(memory||'brak')+'\nModel (wpis ręczny): '+(learned||'brak')+'\n'+(state==='ZGODNOŚĆ'?'Propozycja do ręcznej oceny: '+memory:'Brak wspólnej, potwierdzonej propozycji.')+'\nBez wykonywania napraw. Dane nie są wysyłane do serwera.';
 });
})();
