'use strict';
(async function rxBibiTesterStatus(){
 const panel=document.getElementById('browserTester');if(!panel)return;
 const url='https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-bibi-browser.yml/runs?per_page=1';
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 const line=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=value;return e;};
 try{
  const response=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('GitHub API HTTP '+response.status);
  const data=await response.json();const run=Array.isArray(data.workflow_runs)?data.workflow_runs[0]:null;
  panel.replaceChildren(line('strong','','🧪 RX BIBI Tester 1.0'));
  if(!run){panel.append(line('p','wait','Nie uruchomiono jeszcze testów przeglądarkowych.'));return;}
  const success=run.status==='completed'&&run.conclusion==='success';
  const failed=run.status==='completed'&&run.conclusion==='failure';
  const label=success?'Ostatni test: udany':failed?'Ostatni test: nieudany':run.status!=='completed'?'Test w toku':'Test zakończony: '+String(run.conclusion||'brak wyniku');
  panel.append(line('p',success?'ok':failed?'bad':'wait',label));
  const date=Date.parse(run.updated_at||run.created_at||'');
  panel.append(line('p','meta','Odczyt GitHub Actions · '+(Number.isFinite(date)?new Date(date).toLocaleString('pl-PL'):'brak daty')+' · commit '+String(run.head_sha||'').slice(0,8)));
  if(typeof run.html_url==='string'&&/^https:\/\/github\.com\/Gregg856\/vexorio\/actions\/runs\/\d+$/.test(run.html_url)){
   const a=line('a','','Otwórz test i raporty');a.href=run.html_url;a.target='_blank';a.rel='noopener noreferrer';panel.append(a);
  }
  panel.append(line('p','meta','Wynik dotyczy testów Playwright, a nie pełnego audytu całego serwisu. Raporty dostępne w artefaktach GitHub.'));
 }catch(error){panel.replaceChildren(line('strong','','🧪 RX BIBI Tester 1.0'),line('p','wait','Nie można pobrać wyniku: '+String(error.message||'błąd połączenia')));}
 finally{clearTimeout(timer);}
})();
