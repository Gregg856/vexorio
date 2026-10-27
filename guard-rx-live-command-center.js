'use strict';
(()=>{
 const root=document.getElementById('rxLiveCommandCenter');if(!root)return;
 const state=root.querySelector('[data-rx-live-state]');
 const grid=root.querySelector('[data-rx-live-grid]');
 const refresh=root.querySelector('[data-rx-live-refresh]');
 const stamp=root.querySelector('[data-rx-live-time]');
 const capabilities=[
  ['Królowa','tested'],['Komputer RX','tested'],['Planer chmury','tested'],['RX Mega Computer','tested'],
  ['Cloud Gateway','adapter'],['Cloud Transport','adapter'],['Cloud Memory','adapter'],
  ['Pamięć sygnałów','tested'],['Medusa','tested'],['Tablica mrówek','tested'],
  ['Ant Builder','tested'],['Developer','tested'],['RX Unified','prototype'],
  ['Adapter BIBI','prototype'],['Odczyt kodu','prototype'],['Skrzynka RX','missing']
 ];
 const readiness=root.querySelector('[data-rx-readiness]');
 if(readiness){
  const legend=text('p','Rejestr możliwości RX — stan zadeklarowany w kodzie, nie odczyt działania na żywo.');
  legend.className='note';
  const summary=text('p','Przetestowane: '+capabilities.filter(x=>x[1]==='tested').length+' · Adaptery: '+capabilities.filter(x=>x[1]==='adapter').length+' · Prototypy: '+capabilities.filter(x=>x[1]==='prototype').length+' · Brakujące: '+capabilities.filter(x=>x[1]==='missing').length);
  summary.className='note';
  const list=document.createElement('div');list.className='rx-live-grid';
  for(const [name,status] of capabilities){
   const item=document.createElement('article');item.className='rx-live-card';
   const label=text('strong',name);
   const badge=text('span',({tested:'Testowany',adapter:'Adapter',prototype:'Prototyp',missing:'Nie znaleziono'})[status]);
   badge.className='rx-live-badge rx-live-'+(status==='tested'?'success':'unknown');
   item.append(label,badge);list.append(item);
  }
  readiness.replaceChildren(legend,summary,list);
 }
 const names=[['RX BIBI','rx-bibi-browser.yml'],['RX Monitor','guard-monitor.yml'],['RX Builder','rx-ant-builder-check.yml'],['RX Patch','rx-patch-drafter-check.yml']];
 const repo='Gregg856/vexorio';
 const url=name=>'https://api.github.com/repos/'+repo+'/actions/workflows/'+name+'/runs?per_page=5';
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
    const meta=text('small','Commit: '+item.sha+(item.updated?' · '+new Date(item.updated).toLocaleString('pl-PL'):''));
    const link=document.createElement('a');link.href='https://github.com/'+repo+'/actions/workflows/'+encodeURIComponent(item.workflow);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Raport GitHub';
    card.append(heading,badge,meta,link);grid.append(card);
   }
   const failures=rows.filter(x=>x.kind==='failure').length,unknown=rows.filter(x=>x.kind==='unknown').length;
   state.textContent=failures?'Wykryto błędy: '+failures:unknown?'Niepełne dane — sprawdź raporty':'Raporty pobrane — wyniki widoczne poniżej';
   stamp.textContent='Odczyt: '+new Date().toLocaleString('pl-PL')+' · GitHub Actions, nie transmisja na żywo';
  }finally{clearTimeout(timeout);refresh.disabled=false}
 }
 refresh.addEventListener('click',load);
 load();
})();
