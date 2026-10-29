'use strict';
(()=>{
 const form=document.getElementById('guardChatForm'),input=document.getElementById('guardChatInput'),messages=document.getElementById('guardChatMessages'),tasksBox=document.getElementById('guardTasks');
 if(!form||!input||!messages||!window.GuardCommands||!window.GuardTaskQueue)return;
 const rxSession=window.GuardRXOrchestrator?.createSession?.();
 const plugins=window.GuardPluginCore?.createRegistry();
 if(plugins&&window.GuardTaskAnalyzerPlugin&&window.GuardEngine2)window.GuardTaskAnalyzerPlugin.installTaskAnalyzer(plugins,window.GuardEngine2.analyzeTask);
 if(plugins&&window.GuardChangesReportPlugin){
  window.GuardChangesReportPlugin.installChangesReport(plugins,async()=>{
   const response=await fetch('/guard-changes-summary.json',{cache:'no-store'});
   if(!response.ok)throw Error('Report unavailable');
   return response.json();
  });
 }
 if(plugins && window.GuardCodeAuditPlugin && window.GuardDeveloperInspector) window.GuardCodeAuditPlugin.installCodeAudit(plugins, window.GuardDeveloperInspector.inspectSource);
 const healthBox=document.getElementById('guardRxHealth');
 let ciRefreshId=0;
 async function loadCIStatus(container,requestId){
  try{
   const response=await fetch('/api/rx/modules',{cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(!data||!Array.isArray(data.runs))throw Error('Invalid CI report');
   if(requestId!==ciRefreshId||!container.isConnected)return;
   container.replaceChildren();
   const heading=document.createElement('strong');heading.textContent='GitHub Actions — raporty 5 modułów RX';
   const list=document.createElement('ul');
   for(const item of data.runs){
    const li=document.createElement('li');
    const name=typeof item.name==='string'?item.name.slice(0,80):'Moduł RX';
    const state=item.conclusion==='success'?'OK (CI)':item.conclusion==='failure'?'BŁĄD (CI)':item.status==='in_progress'?'TRWA (CI)':item.status==='no_runs'?'BRAK TESTU':'NIEZWERYFIKOWANY';
    li.textContent=name+' — '+state;
    list.append(li);
   }
   const note=document.createElement('small');note.textContent='Wyniki powiązanych workflow na main; nie potwierdzają ciągłej pracy ani autonomii modułów.';
   container.append(heading,list,note);
  }catch(_){
   if(requestId!==ciRefreshId||!container.isConnected)return;
   container.textContent='GitHub Actions — brak aktualnego raportu CI. Nie można potwierdzić stanu modułów.';
  }
 }

 // Automatically exercise the three read-only plugins once per page load.
 async function autoCheckPlugins(){
  if(!plugins)return;
  const checks=[['task-analyzer','Sprawdź poprawność analizy'],['code-audit','const bezpiecznyTest = true;'],['changes-report','status']];
  const outcomes=[];
  for(const [id,task] of checks){
   try{
    const result=await plugins.execute(id,{task},true);
    const message=typeof result?.message==='string'?result.message:'';
    const missing=id==='changes-report'&&message.includes('nie jest jeszcze dostępny');
    outcomes.push({id,state:missing?'BRAK RAPORTU':!message?'BRAK WYNIKU':'OK'});
   }catch(_){outcomes.push({id,state:'BŁĄD'});}
  }
  renderHealth();
  const issues=outcomes.filter(x=>x.state!=='OK');
  append('RX Strażak',(issues.length?'Automatyczny test wtyczek: wymaga uwagi.':'Automatyczny test wtyczek: 3/3 OK.')+String.fromCharCode(10)+outcomes.map(x=>'• '+x.id+': '+x.state).join(String.fromCharCode(10))+String.fromCharCode(10)+'To lokalny test po otwarciu czatu. Nie oznacza sprawdzenia całej strony ani serwera.');
 }
 function renderHealth(){
  if(!healthBox)return;
  healthBox.replaceChildren();
  let reports=[];
  let diagnosticsUnavailable=!plugins?.diagnostics;
  try{
   const raw=plugins?.diagnostics?.()||[];
   if(!Array.isArray(raw))diagnosticsUnavailable=true;
   if(Array.isArray(raw))reports=raw.filter(r=>r&&typeof r.id==='string'&&['ok','error','not-tested'].includes(r.status)).map(r=>({
    id:r.id.slice(0,80),status:r.status,
    checks:Number.isSafeInteger(r.checks)&&r.checks>=0?r.checks:0,
    failures:Number.isSafeInteger(r.failures)&&r.failures>=0?r.failures:0
   }));
  }catch(_){reports=[];diagnosticsUnavailable=true;}

  const title=document.createElement('strong');title.textContent='Centrum błędów RX — lokalna sesja';
  const summary=document.createElement('p');
  summary.textContent='Moduły: '+reports.length+' · OK: '+reports.filter(r=>r.status==='ok').length+' · Aktualne błędy: '+reports.filter(r=>r.status==='error').length+' · Nietestowane: '+reports.filter(r=>r.status==='not-tested').length+' · Łącznie błędnych prób: '+reports.reduce((n,r)=>n+r.failures,0);
  if(diagnosticsUnavailable)summary.textContent='UWAGA: Diagnostyka RX jest niedostępna. Nie można potwierdzić stanu wtyczek.';
  const list=document.createElement('ul');
  for(const report of reports){
   const item=document.createElement('li');
   item.textContent=report.id+' — '+(report.status==='error'?'BŁĄD':report.status==='ok'?'OK':'nie testowano')+' ('+report.checks+' prób, '+report.failures+' błędów)';
   list.append(item);
  }
  const issues=reports.filter(r=>r.status==='error').map(r=>({id:r.id,priority:'WYSOKI',detail:'Błąd wykonania modułu — sprawdź wejście i logi testów.'}));
  for(const r of reports.filter(r=>r.status==='not-tested'))issues.push({id:r.id,priority:'DO SPRAWDZENIA',detail:'Uruchom test wtyczek, aby uzyskać wynik.'});
  const issueTitle=document.createElement('strong');issueTitle.textContent='Kolejka diagnostyczna ('+issues.length+')';
  const issueList=document.createElement('ol');
  if(!issues.length){const item=document.createElement('li');item.textContent=diagnosticsUnavailable?'Stan nieznany — nie udało się odczytać diagnostyki.':'Brak bieżących błędów i nieprzetestowanych modułów.';issueList.append(item);}
  for(const issue of issues){const item=document.createElement('li');item.textContent=issue.priority+' · '+issue.id+' — '+issue.detail;issueList.append(item);}
  const adviceTitle=document.createElement('strong');adviceTitle.textContent='Propozycje napraw RX (bez zmian w kodzie)';
  const adviceList=document.createElement('ul');
  const suggestions={
   'task-analyzer':'Sprawdź format zadania i działanie analizatora. Uruchom ponownie test z krótkim poleceniem.',
   'changes-report':'Sprawdź dostępność /guard-changes-summary.json oraz krok generowania raportu w GitHub Actions.',
   'code-audit':'Sprawdź format wejściowego kodu i reguły inspektora. Uruchom test na prostym fragmencie JavaScript.'
  };
  for(const issue of issues){
   const item=document.createElement('li');
   item.textContent=issue.id+': '+(issue.priority==='DO SPRAWDZENIA'?'Najpierw uruchom test modułu.':suggestions[issue.id]||'Sprawdź logi i testy modułu.');
   adviceList.append(item);
  }
  if(!issues.length){const item=document.createElement('li');item.textContent=diagnosticsUnavailable?'Najpierw przywróć odczyt diagnostyki RX. Nie można ocenić stanu modułów.':'Brak otwartych problemów do zaproponowania naprawy.';adviceList.append(item);}
  const note=document.createElement('small');note.textContent='Powyżej: lokalne wtyczki z tej karty. Poniżej: osobne wyniki GitHub Actions.';
  const ciPanel=document.createElement('section');ciPanel.textContent='GitHub Actions — pobieranie raportów CI…';
  const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Odśwież stan';refresh.addEventListener('click',renderHealth);
  const run=document.createElement('button');run.type='button';run.textContent='Przetestuj 3 wtyczki';
  run.disabled=!plugins||reports.length!==3;
  run.addEventListener('click',async()=>{
   run.disabled=true;run.textContent='Testowanie…';
   const checks=[
    ['task-analyzer','Sprawdź poprawność analizy'],
    ['code-audit','const bezpiecznyTest = true;'],
    ['changes-report','status']
   ];
   const outcomes=[];
   for(const [id,task] of checks){
    try{
     const result=await plugins.execute(id,{task},true);
     const message=typeof result?.message==='string'?result.message:'';
     const unavailable=id==='changes-report'&&message.includes('nie jest jeszcze dostępny');
     outcomes.push(id+': '+(unavailable?'BRAK RAPORTU':!message?'BRAK WYNIKU':'OK'));
    }catch(_){outcomes.push(id+': BŁĄD');}
   }
   renderHealth();
   const result=document.createElement('p');result.textContent='Wynik testu: '+outcomes.join(' · ');
   healthBox.append(result);
  });
  const copy=document.createElement('button');copy.type='button';copy.textContent='Kopiuj raport błędów';
  copy.addEventListener('click',async()=>{
   const lines=['RX Strażak — raport lokalny',summary.textContent,...reports.map(r=>r.id+': '+r.status+'; próby '+r.checks+'; błędne próby '+r.failures),...issues.map(i=>i.priority+' · '+i.id+': '+i.detail),...issues.map(i=>'Propozycja · '+i.id+': '+(i.priority==='DO SPRAWDZENIA'?'Najpierw uruchom test modułu.':suggestions[i.id]||'Sprawdź logi i testy modułu.')),'Uwaga: tylko bieżąca karta, bez monitoringu GitHub Actions.'];
   try{await navigator.clipboard.writeText(lines.join(String.fromCharCode(10)));copy.textContent='Skopiowano';}
   catch(_){copy.textContent='Nie udało się skopiować';}
  });
  healthBox.append(title,summary,list,issueTitle,issueList,adviceTitle,adviceList,note,ciPanel,refresh,run,copy);
  loadCIStatus(ciPanel,++ciRefreshId);
 }
 const pluginCards=document.getElementById('guardPluginCards'),pluginCount=document.getElementById('guardPluginCount');
 function renderPlugins(){
  if(!pluginCards)return;
  pluginCards.replaceChildren();
  const installed=plugins?.list()||[];
  if(pluginCount)pluginCount.textContent='('+installed.length+')';
  if(!installed.length){pluginCards.textContent='Brak dostępnych modułów.';return;}
  for(const plugin of installed){
   const card=document.createElement('div');card.className='guard-plugin-card';
   const title=document.createElement('strong');title.textContent=plugin.id+' · aktywna';
   const desc=document.createElement('div');desc.textContent=plugin.description;
   const permissions=document.createElement('small');permissions.textContent='Uprawnienia: '+plugin.permissions.join(', ')+' · tylko odczyt';
   const button=document.createElement('button');button.type='button';button.textContent='Szczegóły';
   button.addEventListener('click',()=>{
    append('Strażak','Moduł: '+plugin.id+'\\nOpis: '+plugin.description+'\\nUprawnienia: '+plugin.permissions.join(', ')+'\\nDziała lokalnie, bez zapisu do GitHuba.');
   });
   card.append(title,desc,permissions,button);pluginCards.append(card);
  }
 }
 // Persist only predefined, non-sensitive commands in this browser tab.
 const historyKey='vexorio-guard-safe-history-v2';
 const historyLimit=12;
 const safeCommands=new Set(['pomoc','status','test','github','zmiany','raport github','historia','wtyczki']);
 let history=[];
 try{
  const stored=JSON.parse(sessionStorage.getItem(historyKey)||'[]');
  if(Array.isArray(stored))history=stored.filter(c=>typeof c==='string'&&safeCommands.has(c)).slice(-historyLimit);
 }catch(_){}
 function saveHistory(){
  try{sessionStorage.setItem(historyKey,JSON.stringify(history));}catch(_){}
 }
 function remember(command){
  const normalized=command.trim().toLocaleLowerCase('pl');
  if(!safeCommands.has(normalized)||normalized==='historia')return;
  history.push(normalized);
  if(history.length>historyLimit)history.shift();
  saveHistory();
 }
 const storageKey='vexorio-guard-local-tasks-v1';
 let saved=[];
 try{const parsed=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(parsed))saved=parsed;}catch(_){}
 let queue;
 try{queue=window.GuardTaskQueue.createTaskQueue(saved);}catch(_){queue=window.GuardTaskQueue.createTaskQueue();}
 function persist(){try{localStorage.setItem(storageKey,JSON.stringify(queue.list()));}catch(_){}}

 // Optional tab-only transcript; no server upload or automatic storage of private messages.
 const transcriptKey='rx-chat-transcript-optin-v1';
 const transcriptEnabledKey='rx-chat-transcript-enabled-v1';
 let transcriptEnabled=false,restoringTranscript=false,transcript=[];
 try{
  transcriptEnabled=sessionStorage.getItem(transcriptEnabledKey)==='yes';
  if(transcriptEnabled){
   const saved=JSON.parse(sessionStorage.getItem(transcriptKey)||'[]');
   if(Array.isArray(saved))transcript=saved.filter(x=>x&&['Ty','Strażak','RX Strażak'].includes(x.role)&&typeof x.message==='string'&&x.message.length<=1500).slice(-30);
  }
 }catch(_){transcriptEnabled=false;transcript=[];}
 const memoryButton=document.createElement('button');
 memoryButton.type='button';
 memoryButton.setAttribute('aria-label','Pamięć rozmowy w tej karcie');
 const updateMemoryButton=()=>{memoryButton.textContent=transcriptEnabled?'🧠 Pamięć karty: WŁ. (wyłącz i wyczyść)':'🧠 Włącz pamięć rozmowy w tej karcie';};
 updateMemoryButton();
 memoryButton.addEventListener('click',()=>{
  transcriptEnabled=!transcriptEnabled;
  if(!transcriptEnabled){
   transcript=[];
   try{sessionStorage.removeItem(transcriptKey);sessionStorage.removeItem(transcriptEnabledKey);}catch(_){}
  }else{
   try{sessionStorage.setItem(transcriptEnabledKey,'yes');}catch(_){}
  }
  updateMemoryButton();
 });
 form.parentNode?.insertBefore(memoryButton,form);
 function append(role,message){
  const p=document.createElement('p');p.className='guard-chat-message';
  if(p.style)p.style.cssText='padding:11px 13px;border-radius:12px;line-height:1.55;overflow-wrap:anywhere;white-space:pre-wrap;max-width:100%;box-sizing:border-box';
  if(role==='RX Strażak'&&p.style)p.style.borderLeft='3px solid #51c6ce';
  const strong=document.createElement('strong');strong.textContent=role+': ';
  p.append(strong);
  const source=String(message);
  const linkPattern=/https:\/\/github\.com\/Gregg856\/vexorio\/actions\/runs\/\d+/g;
  let offset=0,match;
  while((match=linkPattern.exec(source))!==null){
   p.append(document.createTextNode(source.slice(offset,match.index)));
   const link=document.createElement('a');
   link.href=match[0];link.target='_blank';link.rel='noopener noreferrer';
   link.textContent='🔗 Otwórz raport GitHub';
   if(link.style)link.style.cssText='display:inline-block;max-width:100%;padding:4px 8px;border-radius:7px;background:#164454;color:#a7eff5;text-decoration:underline';
   p.append(link);
   offset=match.index+match[0].length;
  }
  p.append(document.createTextNode(source.slice(offset)));
  messages.append(p);messages.scrollTop=messages.scrollHeight;
  if(transcriptEnabled&&!restoringTranscript&&['Ty','Strażak','RX Strażak'].includes(role)){
   transcript.push({role,message:source.slice(0,1500)});
   if(transcript.length>30)transcript=transcript.slice(-30);
   try{sessionStorage.setItem(transcriptKey,JSON.stringify(transcript));}catch(_){}
  }
 }
 if(transcriptEnabled&&transcript.length){
  restoringTranscript=true;
  for(const entry of transcript)append(entry.role,entry.message);
  restoringTranscript=false;
 }
 // Mobile quick commands run only on explicit user click and use the normal safe chat handler.
 const quick=document.createElement('div');
 if(typeof quick.setAttribute==='function')quick.setAttribute('aria-label','Szybkie polecenia RX');
 if(quick.style)quick.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:4px 0;padding:0;width:100%;box-sizing:border-box';
 for(const [label,command] of [['👑 Raport Królowej','raport królowej'],['🐜 Status mrówek','status mrówek'],['🛡️ Diagnostyka RX','diagnostyka rx']]){
  const button=document.createElement('button');
  button.type='button';button.textContent=label;
  if(button.style)button.style.cssText='border:1px solid #42798c;border-radius:9px;background:#143648;color:#e3faff;padding:7px 4px;min-height:38px;cursor:pointer;font-size:clamp(10px,2.7vw,13px);line-height:1.25;white-space:normal;min-width:0';
  if(typeof button.addEventListener==='function')button.addEventListener('click',()=>{input.value=command;if(typeof form.requestSubmit==='function')form.requestSubmit();});
  if(typeof quick.append==='function')quick.append(button);
 }
 if(messages.parentNode&&typeof messages.parentNode.insertBefore==='function')messages.parentNode.insertBefore(quick,messages);

 // On small screens keep the composer above the scrollable conversation.
 // Move the existing form rather than cloning it, preserving submit listeners and accessibility.
 if(typeof window.matchMedia==='function'&&window.matchMedia('(max-width:700px)').matches&&
    messages.parentNode&&form.parentNode===messages.parentNode&&
    typeof messages.parentNode.insertBefore==='function'){
  messages.parentNode.insertBefore(form,messages);
  if(messages.style){
   messages.style.maxHeight='min(48dvh,420px)';
   messages.style.overflowY='auto';
   messages.style.minHeight='120px';
  }
  if(form.style)form.style.margin='6px 0 8px';
 }

 // RX alert watch runs only while this page is open; no hidden background monitoring.
 let lastAlertKey='';
 async function checkRXAlerts(){
  try{
   const response=await fetch('/api/rx/direct?command=RX%20STATUS',{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error('status_unavailable');
   const report=await response.json();
   if(!report.ok||!Array.isArray(report.runs))throw Error('invalid_status');
   const failed=report.runs.filter(run=>run.result==='failure');
   const key=failed.map(run=>run.name+':'+run.number).sort().join('|');
   if(key&&key!==lastAlertKey){
    lastAlertKey=key;
    append('⚠️ RX ALARM','Wykryto nieudane testy GitHub Actions:'+String.fromCharCode(10)+failed.map(run=>'• '+run.name+' #'+(run.number||'?')+' — BŁĄD').join(String.fromCharCode(10))+String.fromCharCode(10)+'Sprawdź szczegóły w GitHub Actions. RX nie wprowadza zmian automatycznie.');
   }else if(!key&&lastAlertKey){
    lastAlertKey='';
    append('RX ALARM','Ostatnie uruchomienia monitorowanych testów są bez błędów. Wcześniejsze nieudane uruchomienia pozostają w historii GitHub Actions.');
   }
  }catch(_){/* Temporary network failure is not proof of a failing workflow. */}
 }
 function renderTasks(){
  if(!tasksBox)return;
  tasksBox.replaceChildren();
  for(const task of queue.list()){
   const item=document.createElement('div');item.className='guard-task-item';
   const title=document.createElement('p');title.textContent='#'+task.id+' — '+task.title+' ('+task.status+')';item.append(title);
   for(const [label,action] of task.status==='pending'?[['Zatwierdź','approve'],['Anuluj','cancel']]:task.status==='approved'?[['Oznacz jako zakończone','complete'],['Anuluj','cancel']]:[]){
    const button=document.createElement('button');button.type='button';button.textContent=label;button.className='guard-task-button';
    button.addEventListener('click',()=>{
     const result=queue[action](task.id);
     if(result){persist();append('Strażak','Zadanie #'+task.id+': '+result.status+'. To wyłącznie zmiana statusu, bez wykonania kodu.');renderTasks();}
    });
    item.append(button);
   }
   tasksBox.append(item);
  }
 }
 // Android keyboard: resize the active chat to the visible viewport.
 const viewport=window.visualViewport;
 function resizeComposer(){
  if(!document.body.classList.contains('guard-rx-typing'))return;
  const height=viewport?.height||window.innerHeight;
  document.body.style.setProperty('--rx-viewport-height',Math.max(220,Math.round(height))+'px');
  if(viewport)document.getElementById('guardPanelChat').style.top=Math.max(0,Math.round(viewport.offsetTop))+'px';
 }
 function openComposer(){
  document.body.classList.add('guard-rx-typing');
  resizeComposer();
  messages.scrollTop=messages.scrollHeight;
 }
 function closeComposer(){
  document.body.classList.remove('guard-rx-typing');
  document.body.style.removeProperty('--rx-viewport-height');
  const panel=document.getElementById('guardPanelChat');
  if(panel)panel.style.top='';
 }
 input.addEventListener('focus',openComposer);
 document.getElementById('guardChatExitFullscreen')?.addEventListener('click',()=>{closeComposer();input.blur();});
 input.addEventListener('blur',()=>{
  // Avoid hiding the composer when tapping Send while keyboard is open.
  if(!document.getElementById('guardPanelChat')?.contains(document.activeElement))return;
 });
 viewport?.addEventListener('resize',resizeComposer);
 viewport?.addEventListener('scroll',resizeComposer);
 window.addEventListener?.('resize',resizeComposer);
 form.addEventListener('submit',async event=>{
  event.preventDefault();const command=input.value.trim();if(!command)return;
  // Keep conversation mode open after Send; the keyboard may close on Android.
  if(window.matchMedia?.('(max-width:700px)').matches)openComposer();
  append('Ty',command);input.value='';
  // Separate, evidence-based Queen and ant reports; never execute proposals.
  if(/^(?:raport królowej|raport krolowej|królowa raport|krolowa raport|status mrówek|status mrowek)$/iu.test(command)){
   const ants=/^status mr[oó]wek$/iu.test(command);
   const id=ants?'rx-ant-task-board':'rx-queen';
   const label=ants?'🐜 Mrówki — kolejka zadań':'👑 Królowa — nadzór';
   append('RX Strażak',label+': sprawdzam ostatni raport CI…');
   try{
    const response=await fetch('/api/rx/modules',{cache:'no-store'});
    if(!response.ok)throw Error('ci_unavailable');
    const data=await response.json();
    if(!Array.isArray(data.runs))throw Error('invalid_report');
    const item=data.runs.find(entry=>entry.id===id);
    const state=!item?'⚪ brak raportu':item.conclusion==='success'?'🟢 ostatni test OK':item.conclusion==='failure'?'🔴 ostatni test nieudany':item.status==='in_progress'?'🟡 test trwa':item.status==='queued'?'⏳ test w kolejce':'⚪ wynik niepotwierdzony';
    const lines=[label+': '+state];
    if(item&&Number.isSafeInteger(item.number))lines.push('Uruchomienie #'+item.number);
    if(item&&typeof item.link==='string'&&/^https:\/\/github\.com\/Gregg856\/vexorio\/actions\/runs\/\d+$/.test(item.link))lines.push('Raport CI: '+item.link);
    if(ants){
     lines.push('Zakres: test kolejki propozycji mrówek, nie liczba pracujących agentów.');
     lines.push('Priorytety zadań: brak zweryfikowanych danych o bieżącej kolejce w tym raporcie.');
     lines.push('Propozycja: przy błędzie testu utwórz zadanie do ręcznej oceny.');
    }else{
     lines.push('Zakres: test nadzoru Królowej, nie potwierdzenie pracy ciągłej.');
     lines.push('Propozycja: przy błędzie przeanalizuj raport i przekaż zadanie do zatwierdzenia.');
    }
    lines.push('Tryb odczytu — bez wykonywania zmian.');
    append('RX Strażak',lines.join(String.fromCharCode(10)));
   }catch(_){append('RX Strażak',label+': raport chwilowo niedostępny. Stan niezweryfikowany, bez wykonywania zmian.');}
   return;
  }
  // Read-only live monitoring: never claim a check was executed by this chat.
  if(/^(?:sprawdź|sprawdz|sprawdź błędy|sprawdz bledy|monitoring|status monitoringu|status)$/iu.test(command)){
   append('RX Strażak','Pobieram ostatni wynik monitoringu GitHub Actions…');
   try{
    const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/guard-monitor.yml/runs?per_page=1',{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if(!response.ok)throw Error('HTTP '+response.status);
    const data=await response.json();
    const run=Array.isArray(data.workflow_runs)?data.workflow_runs[0]:null;
    if(!run){append('RX Strażak','Brak dotychczasowych uruchomień monitoringu. Nie można potwierdzić stanu strony.');return;}
    const started=Date.parse(run.created_at||'');
    const ageMinutes=Number.isFinite(started)?Math.max(0,Math.floor((Date.now()-started)/60000)):null;
    const stale=ageMinutes===null||ageMinutes>90;
    const state=stale?'NIEAKTUALNY / STAN NIEZNANY':run.status!=='completed'?'TRWA / OCZEKUJE':run.conclusion==='success'?'OK — testy zakończone pomyślnie':run.conclusion==='failure'?'BŁĄD — sprawdź logi':'NIEPOTWIERDZONY ('+String(run.conclusion||'brak wyniku')+')';
    const lines=['Ostatni monitoring: '+state,'Czas: '+String(run.created_at||'brak'),ageMinutes===null?'Wiek raportu: nieznany':'Wiek raportu: '+ageMinutes+' min','Źródło: GitHub Actions, uruchomienie #'+String(run.run_number||'?'),String(run.html_url||''),'To odczyt ostatniego raportu, nie nowy test na żądanie.'];
    if(stale)lines.push('UWAGA: wynik starszy niż 90 minut. Nie potwierdza bieżącego działania strony.');
    append('RX Strażak',lines.join(String.fromCharCode(10)));
   }catch(_){append('RX Strażak','Nie udało się odczytać wyniku monitoringu. Stan NIEZNANY — nie oznacza to, że strona działa poprawnie.');}
   return;
  }
  if(/^historia$/i.test(command)){
   append('Strażak',history.length?'Ostatnie bezpieczne polecenia (także po odświeżeniu):\\n'+history.map((c,i)=>(i+1)+'. '+c).join('\\n'):'Nie ma jeszcze zapisanych poleceń. Pamięć działa w tej karcie i po odświeżeniu.');
   return;
  }
  if(/^wyczyść historię$/i.test(command)){
   history.length=0;try{sessionStorage.removeItem(historyKey);}catch(_){}append('Strażak','Historia poleceń w tej karcie została wyczyszczona.');return;
  }
  remember(command);
  if(/^(?:rx pamięć|rx pamiec|ostatnie zadanie)$/iu.test(command)){
   append('RX Strażak',rxSession?.lastTask()?'Ostatnie zadanie w tej sesji: '+rxSession.lastTask():'Brak zapamiętanego zadania w tej sesji.');
   return;
  }
  if(/^(?:rx zapomnij|wyczyść pamięć rx|wyczysc pamiec rx)$/iu.test(command)){
   rxSession?.clear();append('RX Strażak','Wyczyszczono pamięć ostatniego zadania w tej sesji.');return;
  }
  const followUp=rxSession?.followUp(command,{analyzeTask:window.GuardEngine2?.analyzeTask});
  if(followUp){append('RX Strażak',followUp);return;}
  if(/^(?:test wtyczek|testuj wtyczki|przetestuj wtyczki|sprawdź wtyczki|sprawdz wtyczki)$/iu.test(command)){
   if(!plugins){append('RX Strażak','Rejestr wtyczek jest niedostępny.');return;}
   const checks=[['task-analyzer','Sprawdź poprawność analizy'],['code-audit','const bezpiecznyTest = true;'],['changes-report','status']];
   const outcomes=[];
   for(const [id,task] of checks){
    try{
     const result=await plugins.execute(id,{task},true);
     const message=typeof result?.message==='string'?result.message:'';
     const unavailable=id==='changes-report'&&message.includes('nie jest jeszcze dostępny');
     outcomes.push('• '+id+': '+(unavailable?'BRAK RAPORTU':!message?'BRAK WYNIKU':'OK'));
    }catch(_){outcomes.push('• '+id+': BŁĄD');}
   }
   renderHealth();
   append('RX Strażak','Wynik rzeczywistego lokalnego testu wtyczek:'+String.fromCharCode(10)+outcomes.join(String.fromCharCode(10))+String.fromCharCode(10)+'Testy wykonano tylko w tej karcie. Nie zmieniono strony ani GitHuba.');
   return;
  }
  if(/^(?:błędy wtyczek|bledy wtyczek|diagnostyka wtyczek|rx błędy|rx bledy)$/iu.test(command)){
   const reports=plugins?.diagnostics?.();
   append('RX Strażak',reports?.length
    ?'Diagnostyka wtyczek (od uruchomienia panelu):'+String.fromCharCode(10)+reports.map(p=>'• '+p.id+': '+(p.status==='error'?'BŁĄD':p.status==='ok'?'OK':'nie testowano')+'; uruchomienia '+p.checks+', błędy '+p.failures).join(String.fromCharCode(10))+String.fromCharCode(10)+'To wyniki lokalne, bez automatycznego monitoringu serwera.'
    :'Brak danych diagnostycznych wtyczek.');
   return;
  }
  if(/^(wtyczki|plugins)$/i.test(command)){
   if(!plugins){append('Strażak','Rejestr wtyczek jest niedostępny.');return;}
   const installed=plugins.list();
   append('Strażak',installed.length?'Nasze aktywne moduły ('+installed.length+'):\n'+installed.map(p=>'• '+p.id+' — '+p.description+' ['+p.permissions.join(', ')+']').join('\n')+'\nWtyczki działają lokalnie, tylko w zakresie przyznanych uprawnień.':'Nie znaleziono aktywnych modułów.');
   return;
  }
  if(/^wtyczka\s*:/i.test(command) || command.toLocaleLowerCase('pl').startsWith('wtyczka:')){
   if(!plugins){append('Strażak','Rejestr wtyczek jest niedostępny.');return;}
   const id=command.slice(command.indexOf(':')+1).trim().toLowerCase();
   const plugin=plugins.list().find(p=>p.id===id);
   append('Strażak',plugin?'Moduł: '+plugin.id+'\\nOpis: '+plugin.description+'\\nUprawnienia: '+plugin.permissions.join(', ')+'\\nDostęp: tylko lokalnie, bez zapisu do GitHuba.':'Nie znaleziono modułu. Wpisz „wtyczki”, aby zobaczyć dostępne nazwy.');
   return;
  }
  if(/^(github|zmiany|raport github)$/i.test(command)){
   if(!plugins){append('Strażak','Wtyczki są chwilowo niedostępne.');return;}
   try{const result=await plugins.execute('changes-report',{task:command},true);append('Strażak GitHub',result.message);}
   catch(_){append('Strażak','Raport GitHub jest chwilowo niedostępny.');}
   return;
  }
  if(/^audyt\s*:/i.test(command)){
   const code=command.slice(command.indexOf(':')+1).trim();
   if(!code){append('Strażak','Po „audyt:” wklej kod JavaScript.');return;}
   if(!plugins){append('Strażak','Moduły są niedostępne.');return;}
   try{const result=await plugins.execute('code-audit',{task:code},true);append('Strażak Code Audit',result.message);}
   catch(_){append('Strażak','Nie udało się przeprowadzić audytu. Maksymalnie 2000 znaków kodu.');}
   return;
  }
  if(/^diff\s*:/i.test(command)){
   const patch=command.slice(command.indexOf(':')+1).trim();
   if(!window.GuardDeveloperDiff){append('Strażak','Analiza zmian jest chwilowo niedostępna.');return;}
   try{
    const report=window.GuardDeveloperDiff.reviewDiff(patch);
    const summary='Sprawdzono '+report.changedFiles+' plik(ów). Sygnały: wysokie '+report.summary.high+', średnie '+report.summary.medium+', niskie '+report.summary.low+'.';
    append('Strażak Developer 2.0',summary+(report.findings.length?'\n'+report.findings.slice(0,15).map(f=>f.file+':'+f.line+' ['+f.severity+'] '+f.rule+' — '+f.advice).join('\n'):'\nBrak sygnałów według dostępnych reguł. To nie gwarantuje bezpieczeństwa.'));
   }catch(_){append('Strażak','Nie udało się odczytać diff. Wklej tekst w formacie Git unified diff, maksymalnie 200 KB.');}
   return;
  }
  if(/^kod\s*:/i.test(command)){
   const code=command.slice(command.indexOf(':')+1).trim();
   if(!code){append('Strażak','Po „kod:” wklej fragment kodu. Dłuższy kod możesz wkleić w formularzu poniżej.');return;}
   if(!window.GuardDeveloperInspector){append('Strażak','Analizator kodu jest chwilowo niedostępny.');return;}
   try{const result=window.GuardDeveloperInspector.inspectSource({path:'fragment.js',source:code});append('Strażak Developer',result.findings.length?result.findings.map(f=>'Linia '+f.line+' ['+f.severity+']: '+f.message).join('\n'):'Nie znaleziono sygnałów objętych regułami. To nie gwarantuje bezpieczeństwa.');}
   catch(_){append('Strażak','Nie udało się przeanalizować kodu.');}
   return;
  }
  if(/^rx status$/iu.test(command)){
   append('RX DIRECT','Pobieram rzeczywisty stan testów z serwera…');
   try{
    const response=await fetch('/api/rx/direct?command=RX%20STATUS',{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('Status HTTP '+response.status);
    const report=await response.json();
    if(!report.ok||!Array.isArray(report.runs))throw new Error('Nieprawidłowy raport');
    append('RX NEURON',report.runs.map(run=>'• '+run.name+': '+(run.result==='success'?'ZIELONY':run.result==='failure'?'BŁĄD':run.status==='completed'?'ZAKOŃCZONY ('+(run.result||'brak wyniku')+')':run.status==='unknown'?'BRAK DANYCH':'W TOKU')+(run.number?' #'+run.number:'')).join(String.fromCharCode(10))+String.fromCharCode(10)+'Źródło: GitHub Actions. Tylko odczyt.');
   }catch(_){append('RX DIRECT','Nie udało się pobrać statusu. Spróbuj ponownie za chwilę.');}
   return;
  }
  if(/^(?:status rx|moduły rx|moduly rx)$/iu.test(command)){
   const registry=window.GuardRXOrchestrator?.capabilities?.();
   append('RX Strażak',registry
    ?'RX — centrum koordynacji ('+registry.length+' funkcji):'+String.fromCharCode(10)+registry.map(item=>'• '+item.role+' ['+item.mode+']').join(String.fromCharCode(10))+String.fromCharCode(10)+'Wszystkie operacje mają ograniczone uprawnienia. RX nie publikuje samodzielnie.'
    :'Koordynator RX jest niedostępny. Odśwież panel.');
   return;
  }
  if(/^(diagnostyka rx|rx diagnostyka|status modułów|status modulow)$/i.test(command.trim())){
   try{
    const response=await fetch('/api/rx/modules',{cache:'no-store'});
    if(!response.ok)throw Error('ci_unavailable');
    const data=await response.json();
    if(!Array.isArray(data.runs))throw Error('invalid_report');
    const lines=data.runs.map(item=>{
     const state=item.conclusion==='success'?'OK (CI)':item.conclusion==='failure'?'BŁĄD (CI)':item.status==='in_progress'?'TRWA (CI)':item.status==='no_runs'?'BRAK TESTU': 'NIEZWERYFIKOWANY';
     return '• '+item.name+': '+state;
    });
    const failures=data.runs.filter(item=>item.conclusion==='failure');
    append('RX Strażak','Diagnostyka RX — powiązane raporty GitHub Actions:'+String.fromCharCode(10)+lines.join(String.fromCharCode(10))+(failures.length?String.fromCharCode(10)+'UWAGA: '+failures.length+' workflow z błędem. Sprawdź raporty CI przed kolejnym wdrożeniem.':'')+String.fromCharCode(10)+'To wyniki CI, nie dowód autonomicznej pracy modułów.');
   }catch(_){append('RX Strażak','Diagnostyka CI jest chwilowo niedostępna. Nie można potwierdzić stanu modułów.');}
   return;
  }
  if(window.GuardRXOrchestrator){
   const routing=window.GuardRXOrchestrator.route(command,{
    conversation:window.GuardRXConversation,
    analyzeTask:window.GuardEngine2?.analyzeTask
   });
   if(routing.kind==='advisory'){rxSession?.remember(command);append('RX Strażak',routing.message);return;}
   if(routing.kind==='module-status'){
    const moduleInfo={
     'rx-medusa':['RX Meduza','rx-medusa-engine.cjs','Grupowanie sygnałów z raportów CI'],
     'rx-ant-task-board':['RX Mrówki','rx-ant-task-board.cjs','Kolejka propozycji zadań'],
     'rx-queen':['RX Queen','rx-queen-ant-supervisor.cjs','Nadzór nad zadaniami i raportami'],
     'rx-bibi-ai':['RX BIBI AI','rx-ai-router.cjs','Router i narzędzia AI'],
     'rx-cloud-computer':['RX Mega Cloud','rx-mega-cloud-computer.cjs','Ograniczone testy GitHub Actions']
    }[routing.module];
    if(moduleInfo){
     append('RX Strażak',moduleInfo[0]+' — '+moduleInfo[2]+'.'+String.fromCharCode(10)+'Kod: '+moduleInfo[1]+String.fromCharCode(10)+'Sprawdzam powiązany raport GitHub Actions…');
     try{
      const response=await fetch('/api/rx/modules',{cache:'no-store'});
      if(!response.ok)throw Error('status_unavailable');
      const data=await response.json();
      const report=Array.isArray(data.runs)?data.runs.find(item=>item.id===routing.module):null;
      if(!report)throw Error('missing_report');
      const state=report.conclusion==='success'?'ostatni powiązany workflow zakończony sukcesem':report.conclusion==='failure'?'ostatni powiązany workflow zakończony błędem':report.status==='in_progress'?'powiązany workflow w trakcie':report.status==='no_runs'?'brak uruchomień':'brak potwierdzonego wyniku';
      append('RX Strażak',moduleInfo[0]+' — '+state+'.'+String.fromCharCode(10)+'Źródło: GitHub Actions, workflow '+report.file+'.'+String.fromCharCode(10)+'Nie potwierdza to wykonania samego modułu ani jego ciągłej pracy.'+(typeof report.link==='string'?String.fromCharCode(10)+report.link:''));
     }catch(_){append('RX Strażak','Nie udało się odczytać raportu CI. Stan '+moduleInfo[0]+' pozostaje niezweryfikowany.');}
     return;
    }
   }
  }
  const answer=window.GuardCommands.respond(command);
  if(answer.kind==='plan'){
   const task=queue.add(command.slice(command.indexOf(':')+1).trim());
   append('Strażak','Zadanie #'+task.id+' dodane do lokalnej kolejki. Zatwierdzenie nie uruchamia zmian w GitHubie.');
   persist();renderTasks();
   if(plugins){try{const report=await plugins.execute('task-analyzer',{task:task.title},true);append('Analiza Strażaka',report.message);}catch(_){append('Strażak','Analiza jest chwilowo niedostępna.');}finally{renderHealth();}}
  }else append('Strażak',answer.message);
 });
 renderTasks();
 renderPlugins();
 renderHealth();
 void autoCheckPlugins();
 void checkRXAlerts();
 if(typeof setInterval==='function'){
  const rxAlertTimer=setInterval(()=>{if(!document.hidden)void checkRXAlerts();},120000);
  window.addEventListener('pagehide',()=>clearInterval(rxAlertTimer),{once:true});
 }
})();
