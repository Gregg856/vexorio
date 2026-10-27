'use strict';
(()=>{
 const root=document.getElementById('rxLiveCommandCenter');if(!root)return;
 const state=root.querySelector('[data-rx-live-state]');
 const grid=root.querySelector('[data-rx-live-grid]');
 const refresh=root.querySelector('[data-rx-live-refresh]');
 const stamp=root.querySelector('[data-rx-live-time]');
 const readiness=root.querySelector('[data-rx-readiness]');
 const queenAlerts=root.querySelector('[data-rx-queen-alerts]');
 const queenQueue=root.querySelector('[data-rx-queen-queue]');
 async function loadQueenQueue(){
  if(!queenQueue)return;
  queenQueue.replaceChildren(text('p','Sprawdzam dostępność raportu kolejki…'));
  try{
   const response=await fetch('/rx-bibi-reports/rx-ant-review-queue.json',{cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(data.kind!=='rx-ant-review-queue'||data.schema!==1||!Array.isArray(data.tasks)||data.tasks.length>100||data.executions!==0||data.productionModified!==false)throw Error('Nieprawidłowy raport');
   const header=text('p','Raport kolejki RX · przebieg: '+String(data.runId||'nieznany').slice(0,80)+' · Zadań: '+data.tasks.length+' · Bez automatycznych wdrożeń');
   const list=document.createElement('div');list.className='rx-live-grid';
   for(const task of data.tasks){
    if(!task||task.requiresApproval!==true||task.approved!==false||task.executed!==false)throw Error('Niezgodny stan zatwierdzenia');
    const card=document.createElement('article');card.className='rx-live-card';
    card.append(text('strong',String(task.target||'Nieznany cel').slice(0,120)),text('small','Do przeglądu · '+String(task.action||'').slice(0,80)+' · Wystąpienia: '+Number(task.occurrences||0)));
    list.append(card);
   }
   if(!data.tasks.length)list.append(text('p','Raport nie zawiera oczekujących zadań.'));
   queenQueue.replaceChildren(header,list);
  }catch(_){
   const message=text('p','Raport kolejki jest archiwizowany w GitHub Actions, ale nie został opublikowany jako plik strony. Nie można potwierdzić bieżących zadań.');
   const link=document.createElement('a');link.href='https://github.com/'+repo+'/actions/workflows/rx-bibi-browser.yml';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Otwórz raporty BIBI w GitHub Actions';
   queenQueue.replaceChildren(message,link);
  }
 }

 const workflowModules={'rx-bibi-browser.yml':['bibi-adapter'],'guard-monitor.yml':['queen'],'rx-ant-builder-check.yml':['ant-builder','ant-board'],'rx-patch-drafter-check.yml':['developer','unified','source-reader']};
 async function loadReadiness(){
  if(!readiness)return;
  readiness.replaceChildren(text('p','Pobieram rejestr modułów RX…'));
  try{
   const response=await fetch('/rx-capability-public.json',{cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(data.schema!==1||data.kind!=='rx-capability-public-snapshot'||!Array.isArray(data.components)||data.components.length>100)throw Error('Nieprawidłowy rejestr');
   const components=data.components;
   const statuses={'tested':'Przetestowany','adapter-only':'Adapter','prototype':'Prototyp','not-identified':'Brakujący'};
   const counts={tested:0,'adapter-only':0,prototype:0,'not-identified':0};
   const list=document.createElement('div');list.className='rx-live-grid';
   for(const item of components){
    if(!item||typeof item.id!=='string'||!Object.hasOwn(statuses,item.status))throw Error('Nieprawidłowy moduł');
    counts[item.status]++;
    const card=document.createElement('article');card.className='rx-live-card';
    const label=text('strong',item.id),badge=text('span',statuses[item.status]);
    badge.className='rx-live-badge rx-live-'+(item.status==='tested'?'success':'unknown');
    card.append(label,badge);list.append(card);
   }
   const note=text('p','Rejestr z pliku projektu (nie telemetria na żywo). Przetestowane: '+counts.tested+' · Adaptery: '+counts['adapter-only']+' · Prototypy: '+counts.prototype+' · Brakujące: '+counts['not-identified']);
   note.className='note';readiness.replaceChildren(note,list);
  }catch(_){readiness.replaceChildren(text('p','Brak aktualnego rejestru RX. Status modułów niepotwierdzony.'))}
 }
 const names=[['RX BIBI','rx-bibi-browser.yml'],['RX Monitor','guard-monitor.yml'],['RX Builder','rx-ant-builder-check.yml'],['RX Patch','rx-patch-drafter-check.yml']];
 const repo='Gregg856/vexorio';
 const reviewBranch='rx/ant-builder-1-3-prototype';
 const url=name=>'https://api.github.com/repos/'+repo+'/actions/workflows/'+name+'/runs?per_page=5&branch='+encodeURIComponent(reviewBranch);
 const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el};
 function classify(run){
  if(!run)return ['Brak danych','unknown'];
  if(run.status!=='completed')return ['W toku','pending'];
  if(run.conclusion==='success')return ['Zaliczony','success'];
  if(run.conclusion==='failure')return ['Błąd','failure'];
  return ['Niepotwierdzony','unknown'];
 }
 async function load(){
  refresh.disabled=true;state.textContent='Pobieranie raportów…';
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
  try{
   const rows=await Promise.all(names.map(async ([name,workflow])=>{
    try{
     const response=await fetch(url(workflow),{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal:controller.signal});
     if(!response.ok)throw Error('HTTP '+response.status);
     const data=await response.json();const run=Array.isArray(data.workflow_runs)?data.workflow_runs[0]:null;
     const [label,kind]=classify(run);
     return {name,workflow,label,kind,sha:run&&typeof run.head_sha==='string'?run.head_sha.slice(0,8):'—',updated:run?.updated_at||null};
    }catch(_){return {name,workflow,label:'Brak odczytu',kind:'unknown',sha:'—',updated:null}}
   }));
   grid.replaceChildren();
   for(const item of rows){
    const card=document.createElement('article');card.className='rx-live-card';
    const heading=text('strong',item.name),badge=text('span',item.label);
    badge.className='rx-live-badge rx-live-'+item.kind;
    const meta=text('small','Gałąź testowa · Commit: '+item.sha+(item.updated?' · '+new Date(item.updated).toLocaleString('pl-PL'):''));
    const link=document.createElement('a');link.href='https://github.com/'+repo+'/actions/workflows/'+encodeURIComponent(item.workflow);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Raport GitHub';
    card.append(heading,badge,meta,link);grid.append(card);
   }
   if(queenAlerts){
    const title=text('strong','Królowa RX — moduły do kontroli');
    const items=document.createElement('div');items.className='rx-live-grid';
    for(const item of rows){
     if(item.kind==='success')continue;
     const card=document.createElement('article');card.className='rx-live-card';
     const label=text('strong',item.name);
     const related=(workflowModules[item.workflow]||[]).join(', ');
     const reason=item.kind==='failure'?'Test zakończony błędem':item.kind==='pending'?'Test w toku':'Wynik niepotwierdzony';
     const detail=text('small',reason+' · Do sprawdzenia: '+related+' · To powiązanie diagnostyczne, nie dowód awarii modułu.');
     card.append(label,detail);items.append(card);
    }
    if(!items.childElementCount)items.append(text('p','Wszystkie odczytane testy zaliczone. Nie potwierdza to pracy modułów na żywo.'));
    queenAlerts.replaceChildren(title,items);
   }
   const failures=rows.filter(x=>x.kind==='failure').length,unknown=rows.filter(x=>x.kind==='unknown').length;
   state.textContent=failures?'Wykryto błędy: '+failures:unknown?'Niepełne dane — sprawdź raporty':'Raporty pobrane — wyniki widoczne poniżej';
   stamp.textContent='Odczyt: '+new Date().toLocaleString('pl-PL')+' · gałąź testowa, GitHub Actions (nie telemetria na żywo)';
  }finally{clearTimeout(timeout);refresh.disabled=false}
 }
 refresh.addEventListener('click',()=>{load();loadReadiness();loadQueenQueue()});
 load();loadReadiness();loadQueenQueue();
})();
