'use strict';
(()=>{
 const root=document.getElementById('rxLiveCommandCenter');if(!root)return;
 const state=root.querySelector('[data-rx-live-state]');
 const grid=root.querySelector('[data-rx-live-grid]');
 const refresh=root.querySelector('[data-rx-live-refresh]');
 const stamp=root.querySelector('[data-rx-live-time]');
 const readiness=root.querySelector('[data-rx-readiness]');
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
   const failures=rows.filter(x=>x.kind==='failure').length,unknown=rows.filter(x=>x.kind==='unknown').length;
   state.textContent=failures?'Wykryto błędy: '+failures:unknown?'Niepełne dane — sprawdź raporty':'Raporty pobrane — wyniki widoczne poniżej';
   stamp.textContent='Odczyt: '+new Date().toLocaleString('pl-PL')+' · gałąź testowa, GitHub Actions (nie telemetria na żywo)';
  }finally{clearTimeout(timeout);refresh.disabled=false}
 }
 refresh.addEventListener('click',()=>{load();loadReadiness()});
 load();loadReadiness();
})();
