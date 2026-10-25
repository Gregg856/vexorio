'use strict';
(()=>{
 const root=document.getElementById('guardRxLiveReport');
 if(!root)return;
 const api='https://api.github.com/repos/Gregg856/vexorio/actions/workflows/guard-monitor.yml/runs?per_page=5';
 const link='https://github.com/Gregg856/vexorio/actions/workflows/guard-monitor.yml';
 const status=root.querySelector('[data-rx-status]');
 const detail=root.querySelector('[data-rx-detail]');
 const advice=root.querySelector('[data-rx-advice]');
 const latest=root.querySelector('[data-rx-latest]');
 const button=root.querySelector('[data-rx-refresh]');
 const labels={success:'ZIELONY — kontrole zaliczone',failure:'CZERWONY — wymaga sprawdzenia',cancelled:'ANULOWANY',timed_out:'PRZEKROCZONY CZAS',action_required:'WYMAGA DZIAŁANIA'};
 let loading=false;
 async function refresh(){
  if(loading)return;
  loading=true;button.disabled=true;
  status.textContent='Sprawdzam monitoring…';
  detail.textContent='Pobieranie ostatniego wyniku GitHub Actions.';
  advice.textContent='';
  try{
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),10000);
   let response;
   try{response=await fetch(api,{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal:controller.signal});}
   finally{clearTimeout(timer);}
   if(!response.ok)throw Error('HTTP '+response.status);
   const payload=await response.json();
   const runs=Array.isArray(payload.workflow_runs)?payload.workflow_runs:[];
   const run=runs[0];
   if(!run)throw Error('Brak uruchomień');
   const done=run.status==='completed';
   const outcome=done?(run.conclusion||'unknown'):'in_progress';
   status.textContent=done?(labels[outcome]||'ZAKOŃCZONY — '+outcome):'TRWA — monitoring w toku';
   detail.textContent='Uruchomienie #'+run.run_number+' · '+new Date(run.created_at).toLocaleString('pl-PL')+' · commit '+String(run.head_sha||'').slice(0,7);
   latest.href=run.html_url||link;
   latest.textContent='Otwórz raport tego uruchomienia';
   if(outcome==='success')advice.textContent='Brak błędu w ostatnim przebiegu. To wynik monitoringu, nie pełny audyt zalogowanych funkcji.';
   else if(outcome==='failure')advice.textContent='Otwórz raport i sprawdź pierwszy niezaliczony krok oraz jego log. Nie wdrażaj poprawek bez potwierdzenia przyczyny.';
   else advice.textContent='Poczekaj na zakończenie lub sprawdź szczegóły w GitHub Actions.';
  }catch(error){
   status.textContent='Nie udało się pobrać statusu';
   detail.textContent='GitHub API może być chwilowo niedostępne lub ograniczać liczbę zapytań.';
   advice.textContent='Sprawdź monitoring bezpośrednio w GitHub Actions.';
   latest.href=link;latest.textContent='Otwórz monitoring GitHub';
  }finally{loading=false;button.disabled=false;}
 }
 button.addEventListener('click',refresh);
 refresh();
})();
