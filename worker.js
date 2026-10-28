import {handleRXMemory} from './rx-persistent-memory.mjs';
import {findRXKnowledge} from './rx-knowledge-base.mjs';
import {searchWorldKnowledge} from './rx-world-knowledge.mjs';
import {planRXChat} from './rx-chat-planner.mjs';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Backward-compatible alias: the existing Strażak lives at /guard-lab.html.
    if(url.pathname==='/rx-strazak.html')return Response.redirect(url.origin+'/guard-lab.html',302);
    // RX DIRECT 2076: safe, read-only live status; no deploy or code mutation.
    if(url.pathname==='/api/rx/direct'){
      const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
      if(request.method!=='GET')return new Response(JSON.stringify({ok:false,error:'method_not_allowed'}),{status:405,headers:{...headers,Allow:'GET'}});
      const command=url.searchParams.get('command');
      if(command!=='RX STATUS')return new Response(JSON.stringify({ok:false,error:'unknown_command'}),{status:400,headers});
      try{
        const workflows=[
          {name:'RX BIBI Tester — mobile browser',file:'rx-bibi-browser.yml'},
          {name:'VEXORIO checks',file:'checks.yml'},
          {name:'Deploy VEXORIO',file:'deploy.yml'}
        ];
        const runs=await Promise.all(workflows.map(async ({name,file})=>{
          try{
            const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/'+file+'/runs?branch=main&per_page=1',{
              headers:{Accept:'application/vnd.github+json','User-Agent':'RX-Direct-2076',...(env.RX_GITHUB_DISPATCH_TOKEN?{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN}:{})},
              signal:AbortSignal.timeout(8000)
            });
            if(!response.ok)return {name,status:'unavailable',result:null};
            const data=await response.json();
            const run=data.workflow_runs?.[0];
            return run?{name,number:run.run_number,status:run.status,result:run.conclusion||null,link:run.html_url}:{name,status:'unknown',result:null};
          }catch{return {name,status:'unavailable',result:null};}
        }));
        // A temporary GitHub API outage must not make the RX status endpoint fail with 502.
        // Report degraded availability explicitly so the UI can show a warning.
        const degraded=runs.some(run=>run.status==='unavailable'||run.status==='unknown');
        return new Response(JSON.stringify({ok:!degraded,command:'RX STATUS',source:'github-actions',degraded,runs}),{status:200,headers});
      }catch{
        return new Response(JSON.stringify({ok:false,command:'RX STATUS',error:'status_temporarily_unavailable'}),{status:502,headers});
      }
    }
    // Read-only Queen queue endpoint. Source is a committed report, not a running ant worker.
    if(url.pathname==='/api/rx/queen/queue'){
      const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
      const reply=(status,payload)=>new Response(JSON.stringify(payload),{status,headers});
      if(request.method!=='GET')return reply(405,{ok:false,error:'method_not_allowed'});
      try{
        const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/contents/rx-bibi-reports/rx-ant-task-board.json?ref=main',{
          headers:{Accept:'application/vnd.github.raw+json','User-Agent':'RX-Queen-Queue-Reader',...(env.RX_GITHUB_DISPATCH_TOKEN?{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN}:{})},
          signal:AbortSignal.timeout(7000)
        });
        if(!response.ok)return reply(503,{ok:false,error:'queue_report_unavailable',note:'No verified committed queue report; ants are not confirmed running.'});
        const body=await response.text();
        if(body.length>100000)return reply(502,{ok:false,error:'queue_report_too_large'});
        const board=JSON.parse(body);
        if(board?.schema!==1||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks)||board.tasks.length>100||!Number.isSafeInteger(board.totalUnique)||board.totalUnique<board.tasks.length||!Number.isSafeInteger(board.overflow)||board.overflow<0||board.autoFixesApplied!==0)return reply(502,{ok:false,error:'invalid_queue_report'});
        for(const task of board.tasks){
          if(!task||typeof task.source!=='string'||task.source.length>40||typeof task.action!=='string'||task.action.length>80||typeof task.target!=='string'||task.target.length>120||!['critical','high','medium','low'].includes(task.priority)||task.status!=='needs_review'||task.requiresApproval!==true)return reply(502,{ok:false,error:'invalid_queue_task'});
        }
        return reply(200,{ok:true,source:'github-committed-report',live:false,generatedAt:null,note:'Read-only snapshot; no autonomous activity verified.',board});
      }catch{return reply(503,{ok:false,error:'queue_report_unavailable'});}
    }
    // Read-only CI evidence for existing RX modules. This does not run the modules.
    if(url.pathname==='/api/rx/modules'){
      const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
      if(request.method!=='GET')return new Response(JSON.stringify({ok:false,error:'method_not_allowed'}),{status:405,headers:{...headers,Allow:'GET'}});
      const modules=[
        {id:'rx-medusa',name:'RX Meduza',file:'rx-medusa-ant.yml'},
        {id:'rx-ant-task-board',name:'RX Mrówki',file:'rx-medusa-ant.yml'},
        {id:'rx-queen',name:'RX Queen',file:'rx-queen-dashboard.yml'},
        {id:'rx-bibi-ai',name:'RX BIBI AI',file:'rx-bibi-dashboard-summary.yml'},
        {id:'rx-cloud-computer',name:'RX Mega Cloud',file:'checks.yml'}
      ];
      const runs=await Promise.all(modules.map(async module=>{
        try{
          const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/'+module.file+'/runs?branch=main&per_page=1',{
            headers:{Accept:'application/vnd.github+json','User-Agent':'RX-Strazak-Module-Reports',...(env.RX_GITHUB_DISPATCH_TOKEN?{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN}:{})},signal:AbortSignal.timeout(7000)
          });
          if(!response.ok)return {...module,status:'unavailable',conclusion:null,reason:response.status===404?'workflow_not_found':response.status===403?'github_access_denied':'github_api_unavailable'};
          const data=await response.json();const run=data.workflow_runs?.[0];
          return run?{...module,status:run.status,conclusion:run.conclusion||null,number:run.run_number,link:run.html_url,updated_at:run.updated_at}:{...module,status:'no_runs',conclusion:null,reason:'no_matching_main_run',note:'Related workflow uses manual dispatch or path-filtered pull requests; no matching main-branch run found. This is not a module failure.'};
        }catch{return {...module,status:'unavailable',conclusion:null,reason:'github_api_unavailable'};}
      }));
      return new Response(JSON.stringify({ok:true,source:'github-actions',scope:'latest-main-run-per-related-workflow',note:'Related workflow CI evidence only; shared workflows do not prove that each module ran. No continuous runtime or autonomy is confirmed.',runs}),{status:200,headers});
    }
    if (url.pathname === '/api/rx/health') {
      if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET','Cache-Control':'no-store'}});
      const ready=Boolean(env.RX_GITHUB_DISPATCH_TOKEN&&env.RX_ADMIN_USER_ID&&env.SUPABASE_URL&&env.SUPABASE_ANON_KEY);
      return new Response(JSON.stringify({ready,configured:ready,service:'RX Tester',missing:['RX_GITHUB_DISPATCH_TOKEN','RX_ADMIN_USER_ID','SUPABASE_URL','SUPABASE_ANON_KEY'].filter(name=>!env[name]),note:ready?'Serwer gotowy do sprawdzania uprawnień.':'Wymagana konfiguracja po stronie Cloudflare.'}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    if (url.pathname === '/api/rx/run-test' || url.pathname === '/api/rx/coordinator/run' || url.pathname === '/api/rx/chat') {
      const headers={'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff'};
      const reply=(status,message)=>new Response(JSON.stringify({ok:false,message}),{status,headers});
      if(request.method!=='POST')return reply(405,'Dozwolone tylko POST.');
      if(request.headers.get('Origin')!==url.origin)return reply(403,'Nieprawidłowe pochodzenie.');
      // Fail closed until the owner configures both secrets in Cloudflare.
      if(!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY)return reply(503,'Brak konfiguracji logowania RX.');
      if(url.pathname!=='/api/rx/chat'&&(!env.RX_GITHUB_DISPATCH_TOKEN||!env.RX_ADMIN_USER_ID))return reply(503,'Uruchamianie testów wymaga konfiguracji administratora.');
      const auth=request.headers.get('Authorization')||'';
      if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth))return reply(401,'Zaloguj się jako administrator.');
      const base=new URL(env.SUPABASE_URL);
      if(base.protocol!=='https:'||!/^[a-z0-9-]+[.]supabase[.]co$/.test(base.hostname)||base.pathname!=='/'||base.search||base.hash)return reply(503,'Nieprawidłowa konfiguracja Supabase.');
      let identity;
      try{
        const response=await fetch(new URL('/auth/v1/user',base),{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});
        if(!response.ok)return reply(401,'Sesja administratora jest nieważna.');
        identity=await response.json();
      }catch{return reply(502,'Nie udało się sprawdzić sesji.');}
      if(!identity?.id||identity.is_anonymous===true)return reply(403,'Brak uprawnień administratora.');
      // Check the authoritative admin_members list via a server-verified Supabase session.
      // Never trust a client-supplied user id or editable user metadata.
      let isAdmin=false;
      try{
        const adminResponse=await fetch(new URL('/rest/v1/rpc/is_vexorio_admin',base),{
          method:'POST',
          headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth,'Content-Type':'application/json'},
          body:'{}',signal:AbortSignal.timeout(8000)
        });
        if(!adminResponse.ok)return reply(502,'Nie udało się sprawdzić uprawnień administratora.');
        isAdmin=(await adminResponse.json())===true;
      }catch{return reply(502,'Nie udało się sprawdzić uprawnień administratora.');}
      if(!isAdmin)return reply(403,'Brak uprawnień administratora.');
      if(url.pathname==='/api/rx/chat'){
        let payload;
        try{payload=await request.json();}catch{return reply(400,'Nieprawidłowe dane wiadomości.');}
        const message=payload?.message;
        if(typeof message!=='string'||!message.trim()||message.length>8000)return reply(400,'Wiadomość musi mieć od 1 do 8000 znaków.');
        const history=payload?.history??[];
        if(!Array.isArray(history)||history.length>20||history.some(item=>typeof item!=='string'||item.length>8000))return reply(400,'Nieprawidłowa historia rozmowy.');
        // Owner-only explicit bridge: Queen chat -> existing bounded RX Coordinator workflow.
        // No arbitrary shell commands, code writes, deployment, or automatic scheduling.
        const runMatch=/^uruchom testy rx(?:\\s*:\\s*(.*))?$/i.exec(message.trim());
        if(runMatch){
          if(!env.RX_ADMIN_USER_ID||identity.id!==env.RX_ADMIN_USER_ID)return reply(403,'Uruchamianie testów jest dostępne tylko dla właściciela RX.');
          if(!env.RX_GITHUB_DISPATCH_TOKEN)return reply(503,'Brak konfiguracji uruchamiania testów RX.');
          const command=(runMatch[1]||'Sprawdź testy w chmurze i model AI').trim();
          if(command.length<3||command.length>1000)return reply(400,'Polecenie testowe musi mieć od 3 do 1000 znaków.');
          let response;
          try{
            response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-coordinator-cloud.yml/dispatches',{
              method:'POST',headers:{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RX-Queen-Chat','Content-Type':'application/json'},
              body:JSON.stringify({ref:'main',inputs:{command}}),signal:AbortSignal.timeout(12000)
            });
          }catch{return reply(502,'Królowa nie mogła połączyć się z GitHub.');}
          if(response.status!==204)return reply(502,'GitHub nie przyjął testu (HTTP '+response.status+').');
          return new Response(JSON.stringify({ok:true,answer:'👑🐜 Zleciłam test do istniejącego RX Coordinator w GitHub Actions. To potwierdzenie przyjęcia zadania, nie wyniku. Sprawdź raport po zakończeniu.',engine:'rx-queen-coordinator-dispatch',executed:1,modelInferenceUsed:false,workflow:'rx-coordinator-cloud.yml',queued:true,requiresApproval:false}),{status:200,headers});
        }
        // Read-only live result lookup: no dispatch, no extra permissions or AI inference.
        if(/^(wynik testów rx|wyniki testów rx|status testów rx|sprawdź błędy rx|sprawdz bledy rx)$/i.test(message.trim())){
          const workflows=[
            {label:'RX Coordinator',file:'rx-coordinator-cloud.yml'},
            {label:'VEXORIO checks',file:'vexorio-checks.yml'},
            {label:'RX BIBI Tester',file:'rx-bibi-browser.yml'}
          ];
          const results=await Promise.all(workflows.map(async item=>{
            try{
              const endpoint='https://api.github.com/repos/Gregg856/vexorio/actions/workflows/'+item.file+'/runs?branch=main&per_page=1';
              const response=await fetch(endpoint,{headers:{Accept:'application/vnd.github+json','User-Agent':'RX-Queen-Live-Status'},signal:AbortSignal.timeout(6500)});
              if(!response.ok)return {...item,state:'unavailable',reason:'HTTP '+response.status};
              const data=await response.json(),run=data.workflow_runs?.[0];
              if(!run)return {...item,state:'missing'};
              return {label:item.label,state:run.status==='completed'?(run.conclusion||'unknown'):run.status,url:run.html_url||null,createdAt:run.created_at||null,event:run.event||null};
            }catch{return {...item,state:'unavailable',reason:'GitHub timeout or network error'};}
          }));
          const lines=results.map(x=>x.label+': '+(x.state==='success'?'🟢 sukces':x.state==='failure'?'🔴 błąd':x.state==='in_progress'?'🟡 trwa':x.state==='queued'?'🟡 kolejka':'⚪ '+x.state)+(x.url?'\\n'+x.url:''));
          const failed=results.filter(x=>x.state==='failure'||x.state==='timed_out'||x.state==='cancelled');
          const answer='👑 Aktualne wyniki GitHub Actions:\\n'+lines.join('\\n')+'\\n'+(failed.length?'⚠️ Wykryto nieudany przebieg. Otwórz jego link, aby sprawdzić szczegóły.':'Brak potwierdzonej awarii w odczytanych przebiegach. To nie jest pełny audyt.');
          return new Response(JSON.stringify({ok:true,answer,engine:'rx-queen-live-github-status',results,executed:0,modelInferenceUsed:false}),{status:200,headers});
        }
        // Explicit owner-only ant test dispatch to an existing read-only workflow.
        if(/^uruchom testy mrówek$/i.test(message.trim())||/^uruchom testy mrowek$/i.test(message.trim())){
          if(!env.RX_ADMIN_USER_ID)return reply(503,'Brak konfiguracji właściciela RX w Cloudflare.');
          if(identity.id!==env.RX_ADMIN_USER_ID)return reply(403,'Konto administratora jest zalogowane, ale nie zgadza się z konfiguracją właściciela RX w Cloudflare. Nie uruchomiono testów.');
          if(!env.RX_GITHUB_DISPATCH_TOKEN)return reply(503,'Brak konfiguracji uruchamiania testów RX.');
          try{
            const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-medusa-ant.yml/dispatches',{
              method:'POST',headers:{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RX-Queen-Ant-Dispatch','Content-Type':'application/json'},
              body:JSON.stringify({ref:'main'}),signal:AbortSignal.timeout(12000)
            });
            if(response.status!==204)return reply(502,'GitHub nie przyjął testów Mrówek (HTTP '+response.status+').');
            // Bounded status lookup: never confuse an earlier green run with this dispatch.
            const dispatchedAt=Date.now();
            let latest=null;
            for(let attempt=0;attempt<3;attempt++){
              if(attempt)await new Promise(resolve=>setTimeout(resolve,1500));
              try{
                const statusResponse=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-medusa-ant.yml/runs?event=workflow_dispatch&branch=main&per_page=5',{
                  headers:{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','User-Agent':'RX-Queen-Ant-Dispatch-Status'},signal:AbortSignal.timeout(5000)
                });
                if(!statusResponse.ok)continue;
                const data=await statusResponse.json();
                latest=(data.workflow_runs||[]).find(run=>Date.parse(run.created_at)>=dispatchedAt-5000)||null;
                if(latest)break;
              }catch{/* A status read failure never changes a successful dispatch. */}
            }
            const state=latest?(latest.status==='completed'?(latest.conclusion||'unknown'):latest.status):'queued';
            const answer=latest?'👑🐜 Testy Mrówek uruchomione. GitHub: '+state+'. '+(latest.html_url||''):'👑🐜 GitHub przyjął testy Mrówek. Nowy przebieg jeszcze nie jest widoczny; wynik nie jest znany.';
            return new Response(JSON.stringify({ok:true,answer,engine:'rx-queen-ant-test-dispatch',workflow:'rx-medusa-ant.yml',queued:state==='queued',runStatus:state,runId:latest?.id||null,runUrl:latest?.html_url||null,executed:1,modelInferenceUsed:false}),{status:200,headers});
          }catch{return reply(502,'Nie udało się zlecić testów Mrówek w GitHub.');}
        }
        // RX Queen ant report: read-only GitHub Actions evidence, no dispatch or code changes.
        if(/^(raport mrówek|raport mrowek|status mrówek|status mrowek|wyniki testów mrówek|wyniki testow mrowek|sprawdź testy mrówek|sprawdz testy mrowek)$/i.test(message.trim())){
          const ghHeaders={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RX-Queen-Ant-Report',...(env.RX_GITHUB_DISPATCH_TOKEN?{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN}:{})};
          const api='https://api.github.com/repos/Gregg856/vexorio';
          try{
            const runsResponse=await fetch(api+'/actions/workflows/rx-medusa-ant.yml/runs?branch=main&per_page=1',{headers:ghHeaders,signal:AbortSignal.timeout(8000)});
            if(!runsResponse.ok)return reply(502,'Nie udało się pobrać raportu Mrówek (GitHub HTTP '+runsResponse.status+').');
            const runsData=await runsResponse.json();
            const run=runsData.workflow_runs?.[0];
            if(!run)return new Response(JSON.stringify({ok:true,answer:'🐜 Brak przebiegów RX Meduza i Mrówki na gałęzi main.',engine:'rx-queen-ant-job-report',executed:0,modelInferenceUsed:false}),{status:200,headers});
            const jobsResponse=await fetch(api+'/actions/runs/'+run.id+'/jobs?per_page=100',{headers:ghHeaders,signal:AbortSignal.timeout(8000)});
            if(!jobsResponse.ok)return reply(502,'Nie udało się pobrać zadań Mrówek (GitHub HTTP '+jobsResponse.status+').');
            const jobsData=await jobsResponse.json();
            const jobs=Array.isArray(jobsData.jobs)?jobsData.jobs:[];
            const state=x=>x.status==='completed'?(x.conclusion||'unknown'):x.status;
            const lines=jobs.slice(0,30).map(j=>'• '+j.name+': '+state(j)+(j.html_url?'\\n'+j.html_url:''));
            const answer='👑🐜 Raport Mrówek — ostatni przebieg RX Meduza\\nStatus: '+state(run)+'\\nZadania ('+jobs.length+'):\\n'+(lines.join('\\n')||'Brak zadań w przebiegu.')+(jobs.length>30?'\\nPokazano pierwsze 30 zadań.':'')+'\\nPrzebieg: '+run.html_url+'\\nTo status GitHub Actions, nie dowód samodzielnego programowania. Nie uruchomiono nowych zadań.';
            return new Response(JSON.stringify({ok:true,answer,engine:'rx-queen-ant-job-report',workflow:'rx-medusa-ant.yml',runId:run.id,runStatus:state(run),jobs:jobs.map(j=>({name:j.name,status:state(j),url:j.html_url||null})),executed:0,modelInferenceUsed:false}),{status:200,headers});
          }catch{return reply(502,'GitHub nie odpowiedział podczas odczytu raportu Mrówek.');}
        }
        const planned=planRXChat(message,history);
        if(/^(zapamiętaj|przypomnij):/i.test(message.trim())){
          try{
            const memory=await handleRXMemory(message,{base,apikey:env.SUPABASE_ANON_KEY,auth,userId:identity.id});
            if(memory)return new Response(JSON.stringify({...planned,...memory,engine:'rx-persistent-memory',executed:0,modelInferenceUsed:false}),{status:memory.ok?200:400,headers});
          }catch{return reply(502,'Pamięć RX jest chwilowo niedostępna. Nie potwierdzam zapisu.');}
        }

        // RX QUEEN: compare latest and previous CI evidence from existing modules.
        // This is a read-only trend, not a learned model or persistent memory.
        if(/^(raport rx|raport królowej|raport krolowej|status modułów rx|status modulow rx|rozwój królowej|rozwoj krolowej|zapisz raport rx)$/i.test(message.trim())){
          const modules=[
            {name:'🪼 Meduza i Mrówki',file:'rx-medusa-ant.yml'},
            {name:'👑 Królowa',file:'rx-queen-dashboard.yml'},
            {name:'🐜 Trening Mrówek / BIBI',file:'rx-bibi-browser.yml'}
          ];
          const results=await Promise.all(modules.map(async module=>{
            try{
              const endpoint='https://api.github.com/repos/Gregg856/vexorio/actions/workflows/'+module.file+'/runs?branch=main&per_page=2';
              const response=await fetch(endpoint,{headers:{Accept:'application/vnd.github+json','User-Agent':'RX-Queen-Report',...(env.RX_GITHUB_DISPATCH_TOKEN?{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN}:{})},signal:AbortSignal.timeout(6500)});
              if(!response.ok)return {name:module.name,state:'unavailable',detail:'HTTP '+response.status};
              const data=await response.json(),runs=Array.isArray(data.workflow_runs)?data.workflow_runs:[];
              const current=runs[0],previous=runs[1];
              if(!current)return {name:module.name,state:'missing',detail:'Brak przebiegu na main'};
              const status=run=>run.status==='completed'?(run.conclusion||'completed'):run.status;
              const state=status(current),prior=previous?status(previous):null;
              const trend=prior===null?'brak porównania':state==='success'&&prior!=='success'?'poprawa statusu':state!=='success'&&prior==='success'?'pogorszenie statusu':state===prior?'bez zmiany statusu':'zmiana statusu';
              return {name:module.name,state,previous:prior,trend,updatedAt:current.updated_at||null,url:current.html_url||null};
            }catch{return {name:module.name,state:'unavailable',detail:'Brak dostępu do GitHub'};}
          }));
          // Owner-requested snapshot only: save verified CI metadata, never assumptions about AI growth.
          if(/^zapisz raport rx$/i.test(message.trim())){
            const verified=results.filter(item=>item.url&&item.updatedAt&&item.state!=='unavailable');
            if(verified.length!==modules.length)return new Response(JSON.stringify({...planned,answer:'⚠️ Nie zapisano raportu: nie udało się potwierdzić wszystkich trzech źródeł GitHub.',engine:'rx-workflow-report',executed:0,modelInferenceUsed:false}),{status:200,headers});
            const snapshot=JSON.stringify({kind:'rx-ci-snapshot',capturedAt:new Date().toISOString(),scope:'latest-main-runs',results:verified.map(({name,state,previous,trend,updatedAt,url})=>({name,state,previous,trend,updatedAt,url})),note:'CI statuses only; not model quality or autonomous work'});
            try{
              const saved=await handleRXMemory('Zapamiętaj: ostatni raport rx | '+snapshot,{base,apikey:env.SUPABASE_ANON_KEY,auth,userId:identity.id});
              if(!saved?.ok)throw Error('save_not_confirmed');
              return new Response(JSON.stringify({...planned,answer:'🧠 Zapisałam potwierdzony raport CI w pamięci RX. Odczytasz go poleceniem „Przypomnij: ostatni raport rx”. To migawka statusów, nie dowód rozwoju inteligencji.',engine:'rx-persistent-memory',memoryAction:'saved',evidence:verified,executed:0,modelInferenceUsed:false}),{status:200,headers});
            }catch{return reply(502,'Nie udało się zapisać raportu do pamięci RX. Nie potwierdzam zapisu.');}
          }
          const lines=results.map(item=>item.name+': '+item.state+(item.previous?' (poprzednio: '+item.previous+'; '+item.trend+')':'')+(item.updatedAt?'; '+item.updatedAt.slice(0,16).replace('T',' ')+' UTC':'')+(item.url?'\n'+item.url:'')+(item.detail?'; '+item.detail:''));
          return new Response(JSON.stringify({...planned,answer:'👑 Raport RX i porównanie dwóch ostatnich przebiegów:\n'+lines.join('\n')+'\nPorównuję wyłącznie statusy CI. Sukces testów nie mierzy jakości odpowiedzi ani wzrostu inteligencji. Raport nie jest automatycznie zapisywany do pamięci. Nie uruchomiono zadań.',engine:'rx-workflow-report',evidence:results,executed:0,modelInferenceUsed:false}),{status:200,headers});
        }

        // RX TECH HELP 1.0: bounded, read-only public issue search; never executes external instructions.
        const techMatch=message.trim().match(/^(?:szukaj pomocy|znajdź rozwiązanie|znajdz rozwiazanie|szukaj błędu|szukaj bledu):\s*(.{3,160})$/i);
        if(techMatch){
          const query=techMatch[1].trim().replace(/[\r\n]/g,' ');
          try{
            const endpoint=new URL('https://api.github.com/search/issues');
            endpoint.searchParams.set('q',query+' is:issue');
            endpoint.searchParams.set('per_page','3');
            const upstream=await fetch(endpoint.toString(),{headers:{Accept:'application/vnd.github+json','User-Agent':'VEXORIO-RX-Tech-Help'},signal:AbortSignal.timeout(6500)});
            if(!upstream.ok)throw Error('provider_unavailable');
            const data=await upstream.json();
            const matches=(Array.isArray(data.items)?data.items:[]).slice(0,3).filter(item=>typeof item.title==='string'&&typeof item.html_url==='string'&&/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(item.html_url)).map(item=>({title:item.title.slice(0,180),url:item.html_url}));
            const answer=matches.length?'🔎 Znalazłam publiczne zgłoszenia dotyczące: '+query+'\n'+matches.map((item,i)=>(i+1)+'. '+item.title+'\n'+item.url).join('\n')+'\nTo materiały do sprawdzenia, nie potwierdzone rozwiązania. Nie uruchomiłam żadnego kodu.':'🔎 Nie znalazłam pasujących publicznych zgłoszeń. Spróbuj podać dokładny komunikat błędu.';
            return new Response(JSON.stringify({...planned,answer,engine:'rx-tech-help',sources:matches,executed:0,modelInferenceUsed:false}),{status:200,headers});
          }catch{return new Response(JSON.stringify({...planned,answer:'⚠️ Wyszukiwanie pomocy jest chwilowo niedostępne. Nie potwierdzam znalezienia rozwiązania.',engine:'rx-tech-help-unavailable',executed:0,modelInferenceUsed:false}),{status:200,headers});}
        }

        // Locally maintained RX facts take priority over external encyclopedia searches.
        const localKnowledge=/^(co to jest|czym jest|opowiedz o|powiedz mi o|wyjasnij|wyjaśnij)\s+/i.test(message.trim())?findRXKnowledge(message):null;
        if(localKnowledge)return new Response(JSON.stringify({...planned,answer:'📘 '+localKnowledge.title+'\n'+localKnowledge.summary+'\nŹródło: '+localKnowledge.source,knowledge:localKnowledge,engine:'rx-local-knowledge',modelInferenceUsed:false}),{status:200,headers});

        // External encyclopedia answers only factual questions outside RX's own operational domain.
        const factual=/^(co to jest|kim jest|kto to|co oznacza|opowiedz o|powiedz mi o|gdzie leży|gdzie jest|czym jest)\s+/i.test(message.trim());
        const internal=/\b(rx|bibi|mrówek|mrówki|wirnik|vexorio|królowa)\b/i.test(message);
        if(factual&&!internal){
          try{
            const knowledge=await searchWorldKnowledge(message);
            if(knowledge)return new Response(JSON.stringify({...planned,answer:'📚 '+knowledge.title+'\n'+knowledge.summary+'\\nŹródło: '+knowledge.url+' (Wikipedia; sprawdź aktualność informacji)',knowledge,engine:'rx-world-knowledge',modelInferenceUsed:false}),{status:200,headers});
          }catch{/* Knowledge provider failure must never break the chat. */}
        }
        // Existing RX planner remains the safe fallback. No commands are executed.
        if(env.RX_AI_ENABLED==='true' && env.AI && typeof env.AI.run==='function'){
          try{
            const messages=[
              {role:'system',content:'Jesteś RX Królową, polskojęzycznym asystentem administratora VEXORIO. Odpowiadaj jasno i zgodnie z prawdą. RX TURBINE, Mrówki i AI Core planują zadania; nie twierdź, że je wykonały, trenowały model lub zmieniły produkcję. Nie ujawniaj sekretów. Nie wykonuj poleceń; wymagają zgody właściciela.'},
              ...history.slice(-8).map(text=>({role:'user',content:text.slice(0,2000)})),
              {role:'user',content:message}
            ];
            const inference=await env.AI.run('@cf/meta/llama-3.1-8b-instruct',{messages,max_tokens:512,temperature:0.3});
            const answer=typeof inference?.response==='string'?inference.response.trim():'';
            if(answer)return new Response(JSON.stringify({...planned,answer:answer.slice(0,4000),modelInferenceUsed:true,engine:'cloudflare-workers-ai',turbine:{connectedToPlanner:true,executionConnected:false,trainingConnected:false,requiresApproval:true}}),{status:200,headers});
          }catch(error){console.warn('RX AI provider unavailable:',String(error?.name||'provider_error'));}
        }
        return new Response(JSON.stringify({...planned,engine:'rule-based-fallback',turbine:{connectedToPlanner:true,executionConnected:false,trainingConnected:false,requiresApproval:true}}),{status:200,headers});
      }
      let coordinatorCommand='Sprawdź testy w chmurze i model AI';
      if(url.pathname==='/api/rx/coordinator/run'){
        let payload;try{payload=await request.json();}catch{return reply(400,'Wymagane polecenie w JSON.');}
        if(typeof payload?.command!=='string'||payload.command.trim().length<3||payload.command.length>1000)return reply(400,'Polecenie musi mieć od 3 do 1000 znaków.');
        coordinatorCommand=payload.command.trim();
      }
      let github;
      try{
        const coordinator=url.pathname==='/api/rx/coordinator/run';
        github=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/'+(coordinator?'rx-coordinator-cloud.yml':'rx-bibi-browser.yml')+'/dispatches',{
          method:'POST',
          headers:{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RX-BIBI-Manager','Content-Type':'application/json'},
          body:JSON.stringify(coordinator?{ref:'main',inputs:{command:coordinatorCommand}}:{ref:'main'}),signal:AbortSignal.timeout(12000)
        });
      }catch{return reply(502,'Nie udało się połączyć z GitHub.');}
      if(github.status!==204)return reply(502,'GitHub odrzucił uruchomienie (HTTP '+github.status+').');
      return new Response(JSON.stringify({ok:true,message:'Test zlecony. Odśwież wyniki za chwilę.'}),{status:202,headers});
    }
    if (url.pathname === '/api/rx/failed-steps') {
      const headers={'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff'};
      const reply=(status,message)=>new Response(JSON.stringify({ok:false,message}),{status,headers});
      if(request.method!=='GET')return reply(405,'Dozwolone tylko GET.');
      const origin=request.headers.get('Origin');
      if(origin&&origin!==url.origin)return reply(403,'Nieprawidłowe pochodzenie.');
      const fetchSite=request.headers.get('Sec-Fetch-Site');
      if(fetchSite&&fetchSite!=='same-origin'&&fetchSite!=='none')return reply(403,'Żądanie spoza witryny.');
      const runId=url.searchParams.get('run_id');
      if(!/^[1-9][0-9]{0,15}$/.test(runId||''))return reply(400,'Nieprawidłowy identyfikator testu.');
      if(!env.RX_GITHUB_DISPATCH_TOKEN||!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY)return reply(503,'Diagnostyka nie jest skonfigurowana.');
      const auth=request.headers.get('Authorization')||'';
      if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth))return reply(401,'Zaloguj się jako administrator.');
      let base;
      try{base=new URL(env.SUPABASE_URL);}catch{return reply(503,'Nieprawidłowa konfiguracja Supabase.');}
      if(base.protocol!=='https:'||!/^[a-z0-9-]+[.]supabase[.]co$/.test(base.hostname)||base.pathname!=='/'||base.search||base.hash||base.username||base.password||base.port)return reply(503,'Nieprawidłowa konfiguracja Supabase.');
      try{
        const identity=await fetch(new URL('/auth/v1/user',base),{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});
        if(!identity.ok)return reply(401,'Sesja administratora jest nieważna.');
        const user=await identity.json();
        if(!user?.id||user.is_anonymous===true)return reply(403,'Brak uprawnień administratora.');
        const check=await fetch(new URL('/rest/v1/rpc/is_vexorio_admin',base),{method:'POST',headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
        if(!check.ok)return reply(502,'Nie można zweryfikować uprawnień.');
        if((await check.json())!==true)return reply(403,'Brak uprawnień administratora.');
      }catch{return reply(502,'Nie można zweryfikować sesji administratora.');}
      try{
        const github=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/runs/'+runId+'/jobs?per_page=100',{headers:{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RX-BIBI-Manager'},signal:AbortSignal.timeout(12000)});
        if(!github.ok)return reply(502,'GitHub nie udostępnił danych (HTTP '+github.status+').');
        const data=await github.json();
        const failed=(Array.isArray(data.jobs)?data.jobs:[]).filter(job=>job.conclusion==='failure').slice(0,10).map(job=>({name:String(job.name||'Zadanie').slice(0,180),id:job.id,steps:(Array.isArray(job.steps)?job.steps:[]).filter(step=>step.conclusion==='failure').map(step=>({name:String(step.name||'Etap').slice(0,180),started_at:step.started_at,completed_at:step.completed_at}))}));
        // The log download is opt-in and admin-only. Do not proxy raw logs to the browser.
        let notice='Nazwy i czasy etapów; komunikaty z logów nie zostały pobrane.';
        if(url.searchParams.get('include_logs')==='1'){
          notice='Wybrane komunikaty błędów z logów (automatycznie filtrowane; możliwe pominięcia).';
          for(const job of failed.slice(0,2)){
            if(!Number.isSafeInteger(job.id)||job.id<=0)continue;
            try{
              const logResponse=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/jobs/'+job.id+'/logs',{
                redirect:'manual',headers:{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RX-BIBI-Manager'},signal:AbortSignal.timeout(8000)
              });
              let download=logResponse;
              if(logResponse.status===302||logResponse.status===301){
                const destination=new URL(logResponse.headers.get('Location')||'');
                if(destination.protocol!=='https:'||!(/(^|\.)blob\.core\.windows\.net$|(^|\.)actions\.githubusercontent\.com$|(^|\.)githubusercontent\.com$/.test(destination.hostname)))throw Error('Niedozwolony host logów');
                download=await fetch(destination.toString(),{redirect:'error',signal:AbortSignal.timeout(8000)});
              }
              if(!download.ok)throw Error('HTTP '+download.status);
              const contentLength=Number(download.headers.get('content-length')||0);
              if(contentLength>1024*1024)throw Error('Log za duży');
              const raw=await download.text();
              if(raw.length>1024*1024)throw Error('Log za duży');
              const messages=raw.split(/\r?\n/).filter(line=>/\b(error|failed|exception|fatal|timed out|timeout)\b/i.test(line)).slice(-8).map(line=>{
                let safe=line.replace(/\x1b\[[0-9;]*m/g,'').replace(/https?:\/\/\S+/gi,'[URL]').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[email]').replace(/(?:gh[pousr]_|github_pat_|sb_secret_|eyJ)[A-Za-z0-9_.-]+/gi,'[sekret]').replace(/(authorization|token|password|secret|apikey|api_key|cookie|bearer)\s*[:=]\s*\S+/gi,'$1=[ukryte]');
                return safe.slice(0,240);
              }).filter(line=>!/(?:authorization|token|password|secret|apikey|api_key|cookie|bearer)/i.test(line));
              job.messages=messages.slice(0,5);
            }catch{job.messages=[];job.log_notice='Nie udało się bezpiecznie odczytać logu. Otwórz zadanie w GitHub.';}
          }
        }
        return new Response(JSON.stringify({ok:true,run_id:runId,failed,notice}),{status:200,headers});
      }catch{return reply(502,'Nie udało się pobrać diagnostyki GitHub.');}
    }
    if (url.pathname === '/api/listing-view') {
      if (request.method !== 'POST') return new Response(null, {status: 405, headers: {'Allow': 'POST', 'Cache-Control': 'no-store'}});
      if (request.headers.get('Origin') !== url.origin) return new Response(null, {status: 403, headers: {'Cache-Control': 'no-store'}});
      const contentType = request.headers.get('Content-Type') || '';
      if (contentType.split(';',1)[0].trim().toLowerCase() !== 'application/json') return new Response(null, {status: 415, headers: {'Cache-Control': 'no-store'}});
      if (Number(request.headers.get('Content-Length') || 0) > 512) return new Response(null, {status: 413, headers: {'Cache-Control': 'no-store'}});
      // Disabled until the server-side secrets and staging RPC are verified.
      if (env.VIEW_COUNT_ENABLED !== 'true') return new Response(null, {status: 503, headers: {'Cache-Control': 'no-store'}});
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip || !env.VIEW_COUNT_SECRET || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_URL) {
        return new Response(null, {status: 503, headers: {'Cache-Control': 'no-store'}});
      }
      let body;
      try { body = await request.text(); if (body.length > 512) throw Error('oversize'); body = JSON.parse(body); }
      catch { return new Response(null, {status: 400, headers: {'Cache-Control': 'no-store'}}); }
      const listingId = body?.listing_id;
      if (!Number.isSafeInteger(listingId) || listingId < 1) return new Response(null, {status: 400, headers: {'Cache-Control': 'no-store'}});
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.VIEW_COUNT_SECRET), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
      const digestBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
      const digest = [...new Uint8Array(digestBytes)].map(b => b.toString(16).padStart(2, '0')).join('');
      let baseUrl;
      try { baseUrl = new URL(env.SUPABASE_URL); }
      catch { return new Response(null, {status: 503, headers: {'Cache-Control': 'no-store'}}); }
      if (baseUrl.protocol !== 'https:' || !/^[a-z0-9-]+[.]supabase[.]co$/.test(baseUrl.hostname) || baseUrl.username || baseUrl.password || baseUrl.port || baseUrl.pathname !== '/' || baseUrl.search || baseUrl.hash) return new Response(null, {status: 503, headers: {'Cache-Control': 'no-store'}});
      const endpoint = new URL('/rest/v1/rpc/vexorio_record_listing_view_server', baseUrl);
      let upstream;
      try { upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY},
        body: JSON.stringify({p_listing_id: listingId, p_visitor_digest: digest})
      }); }
      catch { return new Response(null, {status: 502, headers: {'Cache-Control': 'no-store'}}); }
      if (!upstream.ok) return new Response(null, {status: 502, headers: {'Cache-Control': 'no-store'}});
      return new Response(null, {status: 204, headers: {'Cache-Control': 'no-store'}});
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    // Allow browser push updates to be checked promptly without stale worker code.
    const pathname = new URL(request.url).pathname;
    if (pathname === '/push-sw.js') {
      headers.set('Cache-Control', 'no-cache, must-revalidate');
    }
    // Robots directives must refresh when the permanent domain is connected.
    if (pathname === '/robots.txt') {
      headers.set('Cache-Control', 'no-cache, must-revalidate');
    }
    // Enforce HTTPS on subsequent visits; Workers public address is HTTPS-only.
    headers.set('Strict-Transport-Security', 'max-age=31536000');
    // Prevent legacy browsers from opening downloaded files in the site context.
    headers.set('X-Download-Options', 'noopen');
    // Error pages must never become indexed search results.
    if (response.status === 404 || response.status >= 500) {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    // Avoid caching missing pages after a listing or route is later created.
    if (response.status === 404) {
      headers.set('Cache-Control', 'no-store');
    }
    // Avoid caching server error responses during transient outages.
    if (response.status >= 500) {
      headers.set('Cache-Control', 'no-store');
    }
    return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
  }
};
