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
 const history=root.querySelector('[data-rx-history]');
 const recurring=root.querySelector('[data-rx-recurring]');
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
   if(recurring){
    const completed=runs.filter(item=>item.status==='completed');
    const failed=completed.filter(item=>item.conclusion==='failure');
    const recent=completed.slice(0,5);
    const consecutive=recent.findIndex(item=>item.conclusion!=='failure');
    const streak=consecutive===-1?recent.length:consecutive;
    if(failed.length>=2){
     recurring.textContent='⚠️ Powtarzające się nieudane kontrole: '+failed.length+' z '+completed.length+' zakończonych uruchomień (ostatnie 5).'+(streak>=2?' Seria kolejnych niepowodzeń: '+streak+'.':'')+' To powtórzenie wyniku, nie dowód tej samej przyczyny awarii.';
    }else if(failed.length===1){
     recurring.textContent='Jedna nieudana kontrola wśród '+completed.length+' zakończonych uruchomień. Za mało danych, aby uznać problem za powracający.';
    }else if(completed.length){
     recurring.textContent='Brak nieudanych kontroli wśród '+completed.length+' ostatnich zakończonych uruchomień.';
    }else recurring.textContent='Brak zakończonych kontroli do analizy.';
   }
   if(history){
    history.replaceChildren();
    const title=document.createElement('strong');title.textContent='Ostatnie kontrole';history.append(title);
    const list=document.createElement('ul');
    for(const item of runs.slice(0,5)){
     const li=document.createElement('li');
     const a=document.createElement('a');a.href=item.html_url||link;a.target='_blank';a.rel='noopener noreferrer';
     const result=item.status==='completed'?(item.conclusion||'nieznany'):'w toku';
     a.textContent='#'+item.run_number+' · '+(labels[result]||result)+' · '+new Date(item.created_at).toLocaleString('pl-PL');
     li.append(a);list.append(li);
    }
    history.append(list);
   }
   const done=run.status==='completed';
   const outcome=done?(run.conclusion||'unknown'):'in_progress';
   status.textContent=done?(labels[outcome]||'ZAKOŃCZONY — '+outcome):'TRWA — monitoring w toku';
   detail.textContent='Uruchomienie #'+run.run_number+' · '+new Date(run.created_at).toLocaleString('pl-PL')+' · commit '+String(run.head_sha||'').slice(0,7);
   latest.href=run.html_url||link;
   latest.textContent='Otwórz raport tego uruchomienia';
   if(outcome==='success')advice.textContent='Brak błędu w ostatnim przebiegu. To wynik monitoringu, nie pełny audyt zalogowanych funkcji.';
   else if(outcome==='failure')advice.textContent='Priorytet: WYSOKI — otwórz raport i sprawdź pierwszy niezaliczony krok oraz jego log. Jeśli padły testy Node, sprawdź wskazany plik i linię; jeśli kontrola produkcji, sprawdź dostępność zasobów i wdrożenie. Nie wdrażaj poprawek bez potwierdzenia przyczyny.';
   else advice.textContent='Poczekaj na zakończenie lub sprawdź szczegóły w GitHub Actions.';
  }catch(error){
   status.textContent='Nie udało się pobrać statusu';
   if(history)history.replaceChildren();
   if(recurring)recurring.textContent='Nie można przeanalizować powtarzających się awarii bez wyników GitHub.';
   detail.textContent='GitHub API może być chwilowo niedostępne lub ograniczać liczbę zapytań.';
   advice.textContent='Sprawdź monitoring bezpośrednio w GitHub Actions.';
   latest.href=link;latest.textContent='Otwórz monitoring GitHub';
  }finally{loading=false;button.disabled=false;}
 }
 button.addEventListener('click',refresh);
 refresh();
})();
