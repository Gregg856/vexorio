import {handleRXMemory} from './rx-persistent-memory.mjs';
import {findRXKnowledge} from './rx-knowledge-base.mjs';
import {searchWorldKnowledge,getRXKnowledgeFollowupPrior,formatRXKnowledgeFollowup} from './rx-world-knowledge.mjs';
import {planRXChat} from './rx-chat-planner.mjs';
import {answerRXTaskQuery} from './rx-bibi-task-reasoner.mjs';
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
    if(url.pathname==='/api/rx/client/config'){
      if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET'}});
      const base=String(env.SUPABASE_URL||'');
      const key=String(env.SUPABASE_ANON_KEY||'');
      if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(base)||!key)return new Response(JSON.stringify({ok:false}),{status:503,headers:{'Cache-Control':'no-store'}});
      return new Response(JSON.stringify({url:base,anonKey:key}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    // RX BIBI #717: public, stateless demonstration of the existing deterministic planner.
    // No identity, storage, private RX memory, AI inference, tasks, or admin capabilities.
    if(url.pathname==='/api/rx/client/demo/chat'){
      const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
      const fail=(status,message)=>new Response(JSON.stringify({ok:false,message}),{status,headers});
      if(request.method!=='POST')return fail(405,'Dozwolone tylko POST.');
      if(request.headers.get('Origin')!==url.origin)return fail(403,'Nieprawidłowe pochodzenie.');
      if(Number(request.headers.get('Content-Length')||0)>12000)return fail(413,'Za duża wiadomość.');
      let payload;try{payload=await request.json();}catch{return fail(400,'Nieprawidłowy JSON.');}
      const message=payload?.message,history=payload?.history??[];
      if(typeof message!=='string'||!message.trim()||message.length>1000)return fail(400,'Wiadomość: 1–1000 znaków.');
      if(!Array.isArray(history)||history.length>20||history.some(x=>typeof x!=='string'||x.length>1000))return fail(400,'Nieprawidłowa historia.');
      try{
        const {answerRXSession}=await import('./rx-bibi-session-reasoner.mjs');
        const session=answerRXSession(message,history);
        if(session)return new Response(JSON.stringify({ok:true,...session,engine:'rx-bibi-session-reasoner',demo:true,executed:0,adminToolsAvailable:false,modelInferenceUsed:false}),{status:200,headers});
        const planned=planRXChat(message,history,null);
        return new Response(JSON.stringify({ok:true,answer:String(planned.answer||'').slice(0,4000),contextUsed:planned.contextUsed===true,engine:'rx-bibi-demo-local-planner',demo:true,executed:0,adminToolsAvailable:false,modelInferenceUsed:false}),{status:200,headers});
      }catch{return fail(400,'Nie można przetworzyć wiadomości.');}
    }
    // RX BIBI client: authenticated, read-only planner; never enters admin dispatch routes.
    if(url.pathname==='/api/rx/client/chat'){
      const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
      const reply=(status,message)=>new Response(JSON.stringify({ok:false,message}),{status,headers});
      if(request.method!=='POST')return reply(405,'Dozwolone tylko POST.');
      if(request.headers.get('Origin')!==url.origin)return reply(403,'Nieprawidłowe pochodzenie.');
      if(!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY)return reply(503,'Logowanie jest niedostępne.');
      const auth=request.headers.get('Authorization')||'';
      if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth))return reply(401,'Zaloguj się.');
      let base;try{base=new URL(env.SUPABASE_URL);}catch{return reply(503,'Błędna konfiguracja.');}
      if(base.protocol!=='https:'||!/^[a-z0-9-]+[.]supabase[.]co$/.test(base.hostname)||base.pathname!=='/'||base.search||base.hash||base.port||base.username||base.password)return reply(503,'Błędna konfiguracja.');
      try{
        const userResponse=await fetch(new URL('/auth/v1/user',base),{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});
        if(!userResponse.ok)return reply(401,'Sesja wygasła.');
        const user=await userResponse.json();
        if(!user?.id||user.is_anonymous===true)return reply(403,'Wymagane konto użytkownika.');
      }catch{return reply(502,'Nie udało się sprawdzić sesji.');}
      let payload;try{payload=await request.json();}catch{return reply(400,'Nieprawidłowy JSON.');}
      const message=payload?.message;
      if(typeof message!=='string'||!message.trim()||message.length>2000)return reply(400,'Wiadomość musi mieć od 1 do 2000 znaków.');
      const history=payload?.history??[];
      if(!Array.isArray(history)||history.length>10||history.some(item=>typeof item!=='string'||item.length>2000))return reply(400,'Nieprawidłowa historia.');
      // Explicit opt-in model request, isolated behind an existing service binding.
      // Never send chat history, private RX memory, or administrator data.
      if(/^(?:zapytaj model|zapytaj ai):/iu.test(message.trim())){
        const {askClientModel}=await import('./rx-bibi-model-bridge.mjs');
        const model=await askClientModel(message,env);
        if(model)return new Response(JSON.stringify({ok:true,...model,executed:0,adminToolsAvailable:false}),{status:200,headers});
      }
      // Explicit user-supplied writing is handled locally, after session validation.
      // No private memory, model inference, task execution or external text generation.
      const {composeClientWriting}=await import('./rx-client-writing.mjs');
      const writing=composeClientWriting(message);
      if(writing)return new Response(JSON.stringify({ok:true,answer:writing.answer,writingMode:'deterministic',requiresClarification:writing.requiresClarification,engine:'rx-client-writing',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
      // RX client must not present a private RX CLOUD memory request as a task that was accepted.
      // Private verified learning is intentionally restricted to authenticated administrators.
      const normalizedIntent=message.trim().toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l');
      if(/(?:pamiec|rx cloud|potwierdzone naprawy|historia napraw)/.test(normalizedIntent)&&/(?:pokaz|odczytaj|sprawdz|wyswietl|jakie|co jest|dostep)/.test(normalizedIntent)){
        return new Response(JSON.stringify({ok:true,answer:'Pamięć RX CLOUD i potwierdzone naprawy są prywatnymi danymi administracyjnymi. Ten czat RX BIBI nie ma do nich dostępu. Nie pobrałam pamięci ani nie utworzyłam zadania. Weryfikację można wykonać wyłącznie w uprawnionym panelu administratora.',engine:'rx-bibi-client-access-boundary',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
      }
      // RX BIBI: keep explicit multi-turn educational requests in the same planner
      // used by regression tests, even when model-first flags are enabled.
      // This avoids losing numbered examples and contextual follow-ups.
      const rxAntContext=history.filter((_,index)=>index%2===0).slice(-4).some(turn=>/mr[oó]wk/iu.test(turn)&&/przyk[lł]ad|modu[lł]|wsp[oó]ln|zadani/iu.test(turn));
      const rxAntEducational=/mr[oó]wk/iu.test(message)&&/wyja[sś]nij|podaj|przyk[lł]ad/iu.test(message)&&/modu[lł]|wsp[oó]ln|zadani/iu.test(message);
      const rxAntFollowup=rxAntContext&&/^(?:(?:a|co z|podaj|wyja[sś]nij)\s+)?(?:pierwsz\w*|drugi\w*|trzeci\w*|[123])(?:\s+przyk[lł]ad\w*)?[?!. ]*$/iu.test(message.trim());
      const rxAntIntro=/mr[oó]wk/iu.test(message)&&/porozmawiajmy|pogadajmy/iu.test(message)&&/przyk[lł]ad/iu.test(message);
      if(rxAntEducational||rxAntIntro||rxAntFollowup){
        const planned=planRXChat(message,history,null);
        return new Response(JSON.stringify({ok:true,answer:planned.answer,engine:'rx-bibi-client-context-planner',contextUsed:planned.contextUsed===true,modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
      }
      // RX #639: optional internet-hosted BIBI replies using the ALREADY deployed Workers AI binding.
      // Authenticate and enforce the private-memory boundary above before invoking AI.
      // Opt-in only: no private RX Brain, chat history, admin tools or credentials sent.
      if(env.RX_BIBI_WORKERS_AI_ENABLED==='true'&&typeof env.AI?.run==='function'){
        try{
          const inference=await env.AI.run('@cf/meta/llama-3.1-8b-instruct',{
            messages:[
              {role:'system',content:'Jesteś BIBI, pomocnym asystentem VEXORIO. Odpowiadaj po polsku, rzeczowo i zgodnie z prawdą. Nie masz dostępu do prywatnej pamięci RX Brain, kont administracyjnych ani narzędzi wykonawczych. Nie twierdź, że wykonujesz zadania lub sterujesz Królową.'},
              {role:'user',content:message.trim().slice(0,1000)}
            ],max_tokens:384,temperature:0.3
          });
          const answer=typeof inference?.response==='string'?inference.response.trim():'';
          if(answer&&answer.length<=4000)return new Response(JSON.stringify({ok:true,answer,engine:'cloudflare-workers-ai-client',modelInferenceUsed:true,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }catch{/* Keep existing client planner available if Workers AI fails. */}
      }
      // Model-first mode is explicitly configured; preserve admin/private-data boundary.
      // A failed or unknown model answer falls through to the existing safe planner.
      if(env.RX_BIBI_CLIENT_MODEL_FIRST==='true'&&!/^(?:zapytaj model|zapytaj ai):/iu.test(message.trim())){
        const {askClientModel}=await import('./rx-bibi-model-bridge.mjs');
        const model=await askClientModel(message,env,{direct:true});
        if(model?.modelInferenceUsed)return new Response(JSON.stringify({ok:true,...model,executed:0,adminToolsAvailable:false}),{status:200,headers});
      }
      // Read-only RX module results from verified workflow names. Never infer live activity from CI.
      const moduleStatusMatch=/^(?:sprawdz|pokaz|podaj)\s+(?:aktualny\s+)?(?:status|wynik|wyniki)\s+(?:modulu\s+)?(rx\s+fast|rx\s+developer|rx\s+tester|rx\s+bibi|rx\s+queen)[?!. ]*$/i.exec(normalizedIntent);
      if(moduleStatusMatch){
        const modules={
          'rx fast':{name:'RX FAST',workflow:'rx-performance-benchmark.yml'},
          'rx developer':{name:'RX Developer',workflow:'rx-developer-bridge.yml'},
          'rx tester':{name:'RX Tester',workflow:'rx-client-dialogue-baseline.yml'},
          'rx bibi':{name:'RX BIBI',workflow:'rx-bibi-browser.yml'},
          'rx queen':{name:'RX Queen',workflow:'rx-queen-dashboard.yml'}
        };
        const module=modules[moduleStatusMatch[1].replace(/\s+/g,' ')];
        try{
          const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/'+module.workflow+'/runs?branch=main&per_page=1',{
            headers:{Accept:'application/vnd.github+json','User-Agent':'RX-BIBI-Module-ReadOnly'},signal:AbortSignal.timeout(7000)
          });
          if(!response.ok)throw new Error('github_unavailable');
          const data=await response.json();
          const run=data?.workflow_runs?.[0];
          const state=run?(run.status==='completed'?(run.conclusion||'brak wyniku'):run.status):'brak przebiegu na main';
          const answer='🔎 '+module.name+': ostatni powiązany przebieg CI na main — '+state+(run?'. Numer: '+String(run.run_number||'nieznany'):'')+'. To wynik workflow, nie potwierdzenie pracy modułu na żywo.';
          return new Response(JSON.stringify({ok:true,answer,engine:'rx-bibi-module-ci-readonly',source:'github-actions',live:false,modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }catch{
          return new Response(JSON.stringify({ok:true,answer:'🔎 Nie udało się odczytać wyników '+module.name+' z GitHub Actions. Nie potwierdzam pracy modułu na żywo.',engine:'rx-bibi-module-ci-readonly',live:false,modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }
      }
      // RX BIBI: authenticated read-only CI evidence for the ants. This is NOT live worker status.
      if(/^(?:sprawdz|pokaz|jaki jest|podaj)\s+(?:aktualny\s+)?(?:status|wyniki?)\s+(?:naszych\s+)?(?:mrowek|mrowki|mrowek rx|rx mrowek|rx mrowki)[?!. ]*$/i.test(normalizedIntent)){
        try{
          const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-medusa-ant.yml/runs?branch=main&per_page=1',{
            headers:{Accept:'application/vnd.github+json','User-Agent':'RX-BIBI-Ant-ReadOnly'},signal:AbortSignal.timeout(7000)
          });
          if(!response.ok)throw new Error('github_unavailable');
          const data=await response.json();
          const run=data?.workflow_runs?.[0];
          const allowed=['success','failure','cancelled','skipped','timed_out','action_required','neutral'];
          const result=run&&allowed.includes(run.conclusion)?run.conclusion:run?.status==='in_progress'?'in_progress':'brak potwierdzonego wyniku';
          const answer=run?'🐜 Ostatni przebieg powiązanego workflow RX MRÓWKI na main: '+result+'. Numer: '+String(run.run_number||'nieznany')+'. To wynik CI, a nie dowód, że mrówki pracują teraz.': '🐜 Nie znaleziono przebiegu workflow RX MRÓWKI na main. Nie mogę potwierdzić ich bieżącej pracy.';
          return new Response(JSON.stringify({ok:true,answer,engine:'rx-bibi-ants-ci-readonly',source:'github-actions',live:false,modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }catch{
          return new Response(JSON.stringify({ok:true,answer:'🐜 Nie udało się pobrać wyników RX MRÓWKI z GitHub Actions. Nie potwierdzam ich bieżącej pracy.',engine:'rx-bibi-ants-ci-readonly',live:false,modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }
      }
      // Public, read-only lookup of one GitHub Actions run; no tokens or dispatch.
      const runLookup=message.trim().match(/^(?:sprawdź|sprawdz|pokaż|pokaz)\s+(?:wynik\s+|status\s+)?(?:testu?\s+|github\s+actions\s+)?(?:run\s+|przebiegu\s+)?(\d{8,20})[?!.\s]*$/iu);
      if(runLookup){
        try{
          const runResponse=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/runs/'+runLookup[1],{headers:{Accept:'application/vnd.github+json','User-Agent':'RX-BIBI-readonly-run'},signal:AbortSignal.timeout(6000)});
          if(!runResponse.ok)throw Error('github_unavailable');
          const run=await runResponse.json();
          if(String(run.id)!==runLookup[1]||run.repository?.full_name!=='Gregg856/vexorio'||!['queued','in_progress','completed','waiting','requested','pending'].includes(run.status))throw Error('invalid_run');
          const outcome=run.status==='completed'?(run.conclusion||'wynik nieznany'):'w toku ('+run.status+')';
          const answer='Test GitHub Actions '+runLookup[1]+': '+outcome+'. Commit '+String(run.head_sha||'nieznany').slice(0,8)+'. To zweryfikowany odczyt publicznego API, bez uruchamiania testów.';
          return new Response(JSON.stringify({ok:true,answer,engine:'rx-bibi-readonly-github-run',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }catch{
          return new Response(JSON.stringify({ok:true,answer:'Nie mogę teraz potwierdzić wyniku testu '+runLookup[1]+'. Nie będę zgadywać.',engine:'rx-bibi-readonly-github-run',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }
      }
      // Public, read-only CI status. Fixed repository and endpoint; no user-provided URLs or tokens.
      if(/^(?:sprawdź|sprawdz|pokaż|pokaz) (?:ostatnie )?(?:testy github|wyniki testów github|wyniki testow github|status github actions)[?!.\s]*$/i.test(message.trim())){
        try{
          const ciResponse=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/runs?per_page=30',{headers:{Accept:'application/vnd.github+json','User-Agent':'RX-BIBI-readonly-status'},signal:AbortSignal.timeout(6000)});
          if(!ciResponse.ok)throw Error('github_unavailable');
          const ciData=await ciResponse.json();
          const runs=Array.isArray(ciData.workflow_runs)?ciData.workflow_runs.filter(run=>['VEXORIO checks','RX client security','Deploy VEXORIO'].includes(run.name)):[];
          const latest=[...new Set(runs.map(run=>run.name))].map(name=>runs.find(run=>run.name===name)).filter(Boolean);
          if(!latest.length)throw Error('no_runs');
          const summary=latest.map(run=>run.name+': '+(run.status==='completed'?(run.conclusion||'nieznany wynik'):'w toku')+' (commit '+String(run.head_sha||'').slice(0,8)+')').join('; ');
          return new Response(JSON.stringify({ok:true,answer:'Ostatnie odczytane wyniki GitHub Actions: '+summary+'. To odczyt publicznego API, nie uruchomiłam żadnych testów.',engine:'rx-bibi-readonly-github-status',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }catch{
          return new Response(JSON.stringify({ok:true,answer:'Nie mogę teraz potwierdzić wyników GitHub Actions. Sprawdź status ponownie później; nie będę zgadywać.',engine:'rx-bibi-readonly-github-status',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }
      }
      // Client-safe RX facts: curated, source-attributed entries already reviewed in Git.
      // Never read private RX CLOUD learning, tokens, or administrator-only memory here.
      const publicKnowledgeIntent=/^(?:co to jest|czym jest|opowiedz o|powiedz mi o|wyjasnij|wyjaśnij)\s+/i.test(message.trim());
      const publicKnowledge=publicKnowledgeIntent?findRXKnowledge(message):null;
      if(publicKnowledge){
        const answer='📘 '+publicKnowledge.title+'\n'+publicKnowledge.summary+'\nŹródło: '+publicKnowledge.source;
        return new Response(JSON.stringify({ok:true,answer,knowledge:publicKnowledge,engine:'rx-bibi-client-public-knowledge',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
      }
      // Public factual research uses the same sourced RX World Knowledge as the Queen.
      // Never grant client access to Queen commands, private learning or privileged actions.
      // RX BIBI: bounded, read-only sourced follow-up using the last client question.
      // Never use the assistant's answer as a new search query or access private RX data.
      const knowledgeFollowupPrior=getRXKnowledgeFollowupPrior(message,history);
      if(knowledgeFollowupPrior){
        try{
          const knowledge=await searchWorldKnowledge(knowledgeFollowupPrior);
          if(knowledge){
            const explanation=formatRXKnowledgeFollowup(knowledge,history.filter((_,i)=>i%2===1).slice(-4));
            if(!explanation)return new Response(JSON.stringify({ok:true,answer:'👑 To źródło nie zawiera dodatkowego wyjaśnienia, którego jeszcze nie podałam. Możesz zadać bardziej szczegółowe pytanie.',engine:'rx-bibi-client-world-knowledge-followup',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
            return new Response(JSON.stringify({ok:true,answer:'📚 Wracając do tematu „'+knowledge.title+'”:\n'+explanation+'\nŹródło: '+knowledge.url+'\nTo informacje ze źródła; jeśli pytasz o konkretną przyczynę, doprecyzuj ją.',knowledge,engine:'rx-bibi-client-world-knowledge-followup',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
          }
        }catch{/* External lookup failure falls back to planner. */}
      }
      const clientResearch=/^(?:znajdź informacje|znajdz informacje|wyszukaj informacje|poszukaj informacji|sprawdź w internecie|sprawdz w internecie|wyszukaj w internecie|poszukaj w internecie|szukaj w internecie|sprawdź w sieci|sprawdz w sieci)(?: o)?[,：:]?\s+/i.test(message.trim()) || /^(?:co to jest|kim jest|kto to|co oznacza|opowiedz o|powiedz mi o|gdzie leży|gdzie jest|czym jest|wyjaśnij mi|wyjasnij mi|wyjaśnij|wyjasnij|chciałbym się dowiedzieć(?: o)?|chcialbym sie dowiedziec(?: o)?|chciałabym się dowiedzieć(?: o)?|chcialabym sie dowiedziec(?: o)?)\s+.{3,160}[?!.]?$/i.test(message.trim());
      const rxInternalTopic=/\b(?:rx|bibi|mrówek|mrówki|wirnik|vexorio|królowa)\b/i.test(message);
      if(clientResearch&&!rxInternalTopic){
        try{
          const knowledge=await searchWorldKnowledge(message);
          if(knowledge)return new Response(JSON.stringify({ok:true,answer:'📚 '+knowledge.title+'\n'+(knowledge.summary.length<=360?knowledge.summary:(()=>{const excerpt=knowledge.summary.slice(0,360);const endings=[...excerpt.matchAll(/[.!?](?=\s|$)/g)];const last=endings.at(-1);return last&&last.index>=80?excerpt.slice(0,last.index+1):excerpt.slice(0,excerpt.lastIndexOf(' ')>80?excerpt.lastIndexOf(' '):360).trimEnd()+'…';})())+'\nŹródło: '+knowledge.url+' (Wikipedia; sprawdź aktualność informacji)',knowledge,engine:'rx-bibi-client-world-knowledge',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }catch{
          return new Response(JSON.stringify({ok:true,answer:'Nie udało się teraz pobrać informacji z internetu (Wikipedia). Spróbuj ponownie później.',engine:'rx-bibi-client-world-knowledge-error',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
        }
        return new Response(JSON.stringify({ok:true,answer:'Nie znalazłam potwierdzonej odpowiedzi w dostępnym źródle internetowym. Spróbuj doprecyzować pytanie.',engine:'rx-bibi-client-world-knowledge-no-result',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
      }
      // Client requests use only the shared deterministic planner; no GitHub dispatch,
      // administrator commands, persistent memory writes, or privileged RX tools.
      const planned=planRXChat(message,history,null);
      // RX BIBI: user-supplied, read-only task snapshot; never access server/admin tasks.
      const taskSnapshot=payload?.tasks;
      if(taskSnapshot!==undefined){
        if(!Array.isArray(taskSnapshot)||taskSnapshot.length>50||taskSnapshot.some(t=>!t||typeof t!=='object'||typeof t.title!=='string'||!t.title.trim()||t.title.length>160||!['pending','completed'].includes(t.status)||Object.keys(t).some(k=>!['title','status'].includes(k))))return reply(400,'Nieprawidłowy rejestr zadań.');
        const answer=answerRXTaskQuery(message,taskSnapshot);
        if(answer!==null)return new Response(JSON.stringify({ok:true,answer:answer.slice(0,4000),engine:'rx-bibi-shared-task-reasoner',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
      }
      // RX BIBI 6.5: public identity is distinct from the private RX Queen.
      const normalizedMessage=message.trim().toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l');
      // Answer common self-introduction requests before the task-planner fallback.
      // This is a truthful deterministic reply, not simulated model inference.
      const asksIntroduction=/(?:^|[.!? ]+)(?:napisz|powiedz|opowiedz|przedstaw)(?:\s+(?:mi|nam))?\s+(?:dwa\s+zdania|2\s+zdania|kilka\s+zdan|cos|więcej|wiecej)?\s*o\s+sobie[?!. ]*$/u.test(normalizedMessage);
      const publicGreeting=/^(czesc|hej|witaj|witam|dzien dobry)[!?. ]*$/.test(normalizedMessage);
      const publicIdentity=/^(kim jestes|jak sie nazywasz|przedstaw sie)[!?. ]*$/.test(normalizedMessage);
      const publicThanks=/^(dzieki|dziekuje|dziekuje bardzo|wielkie dzieki)[!?. ]*$/.test(normalizedMessage);
      let clientAnswer=String(planned.answer||'Nie mam jeszcze odpowiedzi.');
      // Public RX BIBI identity and task transparency: no access to the local task store.
      const asksPublicIdentity=/(?:kim jesteś|kim jestes|jak się nazywasz|jak sie nazywasz)/i.test(message);
      const asksPublicTasks=/^(?:co (?:jeszcze )?(?:zostało|zostalo)(?: do zrobienia)?|pokaż (?:oczekujące|oczekujace|nieukończone|nieukonczone) zadania)[?!.\s]*$/i.test(message.trim());
      if(asksIntroduction)clientAnswer='Jestem RX BIBI, asystentem VEXORIO, i pomagam w prostych rozmowach oraz planowaniu. Obecnie odpowiadam za pomocą lokalnego mechanizmu, a nie uruchomionego modelu generatywnego.';
      else if(asksPublicIdentity)clientAnswer='Jestem RX BIBI, asystentem VEXORIO. Pomagam w rozmowie i prostym planowaniu. Nie jestem Królową RX ani samodzielnym modelem generatywnym.';
      else if(asksPublicTasks)clientAnswer='Nie mam jeszcze dostępu do rejestru zadań w oficjalnym czacie. Nie mogę wiarygodnie podać listy oczekujących prac. Funkcja jest testowana w lokalnym silniku BIBI.';
      else if(publicGreeting)clientAnswer='Cześć! Jestem RX BIBI, asystentem do rozmowy i prostych wyjaśnień. W czym mogę Ci pomóc?';
      else if(publicIdentity)clientAnswer='Jestem RX BIBI — asystentem VEXORIO. Pomagam wyjaśniać zagadnienia i odpowiadać na pytania. Obecnie korzystam z lokalnego planera odpowiedzi, nie z generatywnego modelu AI.';
      else if(publicThanks)clientAnswer='Nie ma za co! Jeśli masz kolejne pytanie, chętnie pomogę.';
      else {
        clientAnswer=clientAnswer.replace(/^👑\s*/u,'');
        // Public client fallback: discuss the user's subject, not internal RX diagnostics.
        // This is a bounded conversational clarification, not generative AI.
        const unknownAnswer=/^Nie rozumiem jeszcze tego pytania wystarczająco dobrze/.test(clientAnswer);
        if(unknownAnswer){
          const userText=message.trim().replace(/[?!.\s]+$/g,'');
          const isQuestion=/^(?:co|czym|jak|dlaczego|czemu|kiedy|gdzie|czy|ile|ktory|ktora|ktore|kto)\b/i.test(normalizedMessage);
          const wantsWriting=/\b(?:napisz|stworz|przygotuj|uloz|wymysl)\b/i.test(normalizedMessage);
          const wantsExplanation=/\b(?:wyjasnij|wytlumacz|opowiedz|porozmawiajmy|pogadajmy)\b/i.test(normalizedMessage);
          if(wantsWriting)clientAnswer='Chętnie pomogę przygotować tekst. Jaki ma mieć styl i dla kogo będzie przeznaczony?';
          else if(wantsExplanation)clientAnswer='Możemy o tym porozmawiać. Która część tematu interesuje Cię najbardziej?';
          else if(isQuestion)clientAnswer='Chcę odpowiedzieć rzetelnie, ale nie mam jeszcze wystarczającej wiedzy o tym pytaniu. Możesz podać więcej szczegółów?';
          else if(userText.length>3)clientAnswer='Rozumiem, że chcesz porozmawiać o tym temacie. Co jest dla Ciebie najważniejsze?';
          else clientAnswer='O czym chciałbyś porozmawiać?';
        }
      }
      return new Response(JSON.stringify({ok:true,answer:clientAnswer.slice(0,4000),engine:'rx-client-local-planner',modelInferenceUsed:false,executed:0,adminToolsAvailable:false}),{status:200,headers});
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
        if(/^(wynik|status|raport) rx developer$/i.test(message.trim())){
          if(!env.RX_ADMIN_USER_ID||identity.id!==env.RX_ADMIN_USER_ID)return reply(403,'Tylko właściciel RX.');
          try{
            const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-developer-bridge.yml/runs?branch=main&event=workflow_dispatch&per_page=1',{headers:{Accept:'application/vnd.github+json','User-Agent':'RX-Queen-Developer-Status'},signal:AbortSignal.timeout(8000)});
            if(!response.ok)return reply(502,'GitHub HTTP '+response.status);
            const data=await response.json(),run=data.workflow_runs?.[0];
            let answer=run?'👑 RX Developer: '+(run.status==='completed'?run.conclusion:run.status)+' — '+run.html_url:'👑 Brak zleconej analizy RX Developer.';
            if(run&&run.status==='completed'&&run.conclusion==='success'){
              const artifactResponse=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/runs/'+run.id+'/artifacts?per_page=30',{headers:{Accept:'application/vnd.github+json','User-Agent':'RX-Queen-Developer-Status'},signal:AbortSignal.timeout(8000)});
              if(artifactResponse.ok){
                const artifacts=await artifactResponse.json();
                const review=artifacts.artifacts?.find(item=>item.name==='rx-developer-review'&&!item.expired);
                answer+=review?'\\n🐜 BIBI: raport analizy jest gotowy w artefakcie rx-developer-review.':'\\n⚠️ BIBI: brak dostępnego artefaktu raportu.';
              }else answer+='\\n⚠️ BIBI: nie udało się sprawdzić artefaktów.';
            }
            return new Response(JSON.stringify({ok:true,answer,engine:'rx-developer-status',readOnly:true}),{status:200,headers});
          }catch{return reply(502,'Nie można odczytać wyniku RX Developer.');}
        }
        // RX BIBI 7.2: turn a verified failing RX Tester run into a review proposal.
        // Read-only until the owner explicitly requests a bounded Developer review.
        if(/^(?:królowa[,! ]*|krolowa[,! ]*)?(?:przygotuj|pokaz|pokaż)\s+(?:zadanie|zgloszenie|zgłoszenie)\s+(?:dla\s+)?rx\s+developer\s+(?:z|na podstawie)\s+(?:wyniku\s+)?rx\s+tester[?!. ]*$/i.test(message.trim())){
          if(!env.RX_ADMIN_USER_ID||identity.id!==env.RX_ADMIN_USER_ID)return reply(403,'Propozycje RX Developer są dostępne tylko dla właściciela RX.');
          try{
            const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-client-dialogue-baseline.yml/runs?branch=main&per_page=1',{headers:{Accept:'application/vnd.github+json','User-Agent':'RX-Queen-Tester-Review'},signal:AbortSignal.timeout(8000)});
            if(!response.ok)throw Error('github_unavailable');
            const run=(await response.json()).workflow_runs?.[0];
            const state=run?.status==='completed'?run.conclusion:run?.status||'brak danych';
            const failed=state==='failure';
            let failureDetail='';
            const developerTickets=[];
            if(failed&&Number.isSafeInteger(run?.id)){
              try{
                const jobsResponse=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/runs/'+run.id+'/jobs?per_page=100',{headers:{Accept:'application/vnd.github+json','User-Agent':'RX-Queen-Tester-Review'},signal:AbortSignal.timeout(8000)});
                if(jobsResponse.ok){
                  const jobs=(await jobsResponse.json()).jobs;
                  if(Array.isArray(jobs)){
                    const failures=jobs.filter(job=>job.conclusion==='failure').slice(0,3).map(job=>{
                      const step=Array.isArray(job.steps)?job.steps.find(item=>item.conclusion==='failure'):null;
                      return String(job.name||'Nieznany test').slice(0,80)+(step?' / '+String(step.name||'Nieznany krok').slice(0,80):'');
                    });
                    if(failures.length)failureDetail=' Nieudane kroki: '+failures.join('; ')+'.';
                    for(const job of jobs.filter(job=>job.conclusion==='failure').slice(0,10)){
                      if(!Array.isArray(job.steps))continue;
                      for(const step of job.steps.filter(step=>step.conclusion==='failure').slice(0,10)){
                        developerTickets.push({source:'github-actions-rx-tester',runId:run.id,jobName:String(job.name||'Nieznany test').slice(0,200),stepName:String(step.name||'Nieznany krok').slice(0,200),diagnosis:'Failed CI step; root cause not yet verified',proposedAction:'Inspect failed step logs and reproduce with a focused regression before proposing code changes',status:'awaiting_review',approved:false,executed:false,requiresApproval:true});
                      }
                    }
                  }
                }
              }catch{/* A workflow failure remains verified even if job details are unavailable. */}
            }
            const answer=failed?'👑 RX Tester: ostatni przebieg zakończył się błędem.'+failureDetail+' Propozycja: zleć RX Developer przegląd kodu RX Developer poleceniem „Sprawdź RX Developer”. To analiza, nie automatyczna naprawa.':'👑 RX Tester: ostatni przebieg ma status '+state+'. Nie mam potwierdzonego błędu do przekazania RX Developer. Nie uruchomiłam analizy ani naprawy.';
            return new Response(JSON.stringify({ok:true,answer,engine:'rx-queen-tester-developer-proposal',source:'github-actions',runId:run?.id||null,runStatus:state,developerTickets,proposed:failed,queued:false,executed:0,modelInferenceUsed:false,requiresApproval:true,productionModified:false}),{status:200,headers});
          }catch{return reply(502,'Nie udało się pobrać wyniku RX Tester. Nie utworzyłam zadania.');}
        }
        // Owner-only Queen chat command -> existing RX BIBI live tester.
        // Dispatch only: no synthetic success claims, no production writes.
        if(/^(?:królowa|krolowa)[,! ]+bibi[,! ]+(?:testuj|sprawdź|sprawdz|uruchom testy)(?:[.!? ]*)$/i.test(message.trim())){
          if(!env.RX_ADMIN_USER_ID||identity.id!==env.RX_ADMIN_USER_ID)return reply(403,'Testy BIBI może zlecić tylko właściciel RX.');
          if(!env.RX_GITHUB_DISPATCH_TOKEN)return reply(503,'Brak konfiguracji uruchamiania BIBI.');
          let response;
          try{
            response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-bibi-live-watch.yml/dispatches',{
              method:'POST',headers:{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RX-Queen-BIBI-Chat','Content-Type':'application/json'},
              body:JSON.stringify({ref:'main'}),signal:AbortSignal.timeout(12000)
            });
          }catch{return reply(502,'Nie udało się zlecić testów BIBI.');}
          if(response.status!==204)return reply(502,'GitHub nie przyjął testów BIBI (HTTP '+response.status+').');
          return new Response(JSON.stringify({ok:true,answer:'👑🐜 Zleciłam RX BIBI test panelu i czatu. Wyniki będą dostępne w RX BIBI Live Watch. Test zalogowanego czatu produkcyjnego nie jest częścią tego przebiegu.',engine:'rx-queen-bibi-dispatch',queued:true,executed:1,workflow:'rx-bibi-live-watch.yml',requiresApproval:false,productionModified:false}),{status:200,headers});
        }
        // RX Queen -> RX Developer: bounded, owner-only source review; BIBI checks in CI.
        const developerMatch=/^(?:królowa[,! ]*|krolowa[,! ]*)?(?:sprawdź|sprawdz|przeanalizuj|zbadaj)\s+(?:kod\s+)?(rx coordinator|rx command bridge|rx developer)(?:[.!? ]*)$/i.exec(message.trim());
        if(developerMatch){
          if(!env.RX_ADMIN_USER_ID||identity.id!==env.RX_ADMIN_USER_ID)return reply(403,'RX Developer jest dostępny tylko dla właściciela RX.');
          if(!env.RX_GITHUB_DISPATCH_TOKEN)return reply(503,'Brak konfiguracji połączenia RX Developer.');
          const target={'rx coordinator':'rx-coordinator.cjs','rx command bridge':'rx-command-bridge.cjs','rx developer':'rx-developer-patch-bridge.cjs'}[developerMatch[1].toLowerCase()];
          let response;
          try{
            response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-developer-bridge.yml/dispatches',{
              method:'POST',headers:{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RX-Queen-Chat','Content-Type':'application/json'},
              body:JSON.stringify({ref:'main',inputs:{target}}),signal:AbortSignal.timeout(12000)
            });
          }catch{return reply(502,'Królowa nie mogła połączyć się z RX Developer.');}
          if(response.status!==204)return reply(502,'GitHub nie przyjął analizy RX Developer (HTTP '+response.status+').');
          return new Response(JSON.stringify({ok:true,answer:'👑🐜 RX Developer przyjął analizę pliku '+target+'. BIBI sprawdzi ją w istniejącym procesie CI. To potwierdzenie rozpoczęcia, nie wynik. Otwórz raport RX Developer Bridge po zakończeniu.',engine:'rx-queen-developer-dispatch',queued:true,executed:1,modelInferenceUsed:false,workflow:'rx-developer-bridge.yml',target,requiresApproval:false}),{status:200,headers});
        }
        // Owner-only explicit bridge: Queen chat -> existing bounded RX Coordinator workflow.
        // No arbitrary shell commands, code writes, deployment, or automatic scheduling.
        const runMatch=/^uruchom testy rx(?:\\s*:\\s*(.*))?$/i.exec(message.trim())
          ||/^(?:królowa[,! ]*|krolowa[,! ]*)?(?:uruchom|wykonaj|przetestuj)\\s+(?:testy|test|kontrole|kontrolę)\\s+(?:rx|królowej rx|krolowej rx)(?:\\s*[:,-]\\s*(.*))?$/i.exec(message.trim());
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
                if(latest&&latest.status==='completed')break;
              }catch{/* A status read failure never changes a successful dispatch. */}
            }
            const state=latest?(latest.status==='completed'?(latest.conclusion||'unknown'):latest.status):'queued';
            const answer=latest?'👑🐜 Testy Mrówek uruchomione. GitHub: '+state+'. '+(latest.html_url||''):'👑🐜 GitHub przyjął testy Mrówek. Nowy przebieg jeszcze nie jest widoczny; wynik nie jest znany.';
            return new Response(JSON.stringify({ok:true,answer,engine:'rx-queen-ant-test-dispatch',workflow:'rx-medusa-ant.yml',queued:state==='queued',runStatus:state,runId:latest?.id||null,runUrl:latest?.html_url||null,executed:1,modelInferenceUsed:false}),{status:200,headers});
          }catch{return reply(502,'Nie udało się zlecić testów Mrówek w GitHub.');}
        }
        // RX Ants: show persisted CI failure proposals from the existing GitHub report.
        if(/^(błędy mrówek|bledy mrowek|propozycje mrówek|propozycje mrowek|diagnostyka mrówek|diagnostyka mrowek)$/i.test(message.trim())){
          try{
            const ghHeaders={Accept:'application/vnd.github.raw+json','User-Agent':'RX-Queen-Ant-CI-Triage',...(env.RX_GITHUB_DISPATCH_TOKEN?{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN}:{})};
            const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/contents/rx-bibi-reports/rx-ant-ci-triage.json?ref=main',{headers:ghHeaders,signal:AbortSignal.timeout(8000)});
            if(response.status===404)return reply(404,'Raport diagnostyki Mrówek jeszcze nie został opublikowany.');
            if(!response.ok)return reply(502,'Nie udało się odczytać diagnostyki Mrówek (HTTP '+response.status+').');
            const report=await response.json();
            if(report.kind!=='rx-ant-ci-triage'||!Array.isArray(report.tasks)||report.tasks.length>20||report.autoFixesApplied!==0)return reply(502,'Raport Mrówek ma nieprawidłową strukturę.');
            const tasks=report.tasks.filter(t=>t&&t.requiresApproval===true&&t.status==='needs_review').slice(0,10);
            if(report.sourceAvailable===false)return reply(502,'Raport diagnostyki Mrówek nie ma aktualnych danych GitHub: '+String(report.error||'nieznany problem').slice(0,120));
            const hints={failure:['Test zakończył się błędem (dokładna przyczyna nieznana).','Otwórz logi przebiegu i znajdź pierwszy nieudany krok.'],timed_out:['Przekroczono limit czasu (przyczyna niepotwierdzona).','Sprawdź długość kroków i miejsce zatrzymania w logach.'],cancelled:['Przebieg został anulowany (powód niepotwierdzony).','Sprawdź kto lub co anulowało przebieg.'],action_required:['GitHub wymaga działania przed kontynuacją.','Otwórz przebieg i sprawdź wymagane zatwierdzenie lub konfigurację.']};
            const lines=tasks.map((t,i)=>{
              const id=Number.isSafeInteger(t.runId)&&t.runId>0?t.runId:null;
              const status=String(t.action||'').split(': ').pop();
              const hint=hints[status]||['Status wymaga ręcznej weryfikacji.','Sprawdź szczegóły przebiegu GitHub Actions.'];
              return (i+1)+'. '+String(t.target||'test').slice(0,100)+'\\nStan: '+hint[0]+'\\nNastępny krok: '+hint[1]+(id?'\\nLogi: https://github.com/Gregg856/vexorio/actions/runs/'+id:'');
            });
            const answer='👑🐜 Diagnostyka CI Mrówek: '+tasks.length+' propozycji do sprawdzenia.\\n'+(lines.join('\\n\\n')||'Brak wykrytych błędów w analizowanej próbce.')+'\\nŹródło: zapisany raport GitHub Actions. Bez analizy logów nie można ustalić przyczyny źródłowej. Nie wykonano napraw.';
            return new Response(JSON.stringify({ok:true,answer,engine:'rx-ant-ci-triage',tasks,executed:0,modelInferenceUsed:false}),{status:200,headers});
          }catch{return reply(502,'Nie udało się pobrać raportu diagnostyki Mrówek.');}
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
        // RX BIBI -> Queen: optional trusted server-to-server evidence, never browser-supplied.
        // Disabled unless the owner configures an HTTPS RX CLOUD endpoint and its token.
        let bibiLearning=null;
        if(typeof env.RX_BIBI_LEARNING_URL==='string'
          &&/^https:\/\/[a-z0-9.-]+\/__rxcloud\/bibi\/learning$/i.test(env.RX_BIBI_LEARNING_URL)
          &&typeof env.RX_BIBI_LEARNING_TOKEN==='string'&&env.RX_BIBI_LEARNING_TOKEN.length>=32){
          try{
            const response=await fetch(env.RX_BIBI_LEARNING_URL,{
              headers:{Authorization:'Bearer '+env.RX_BIBI_LEARNING_TOKEN,Accept:'application/json'},
              signal:AbortSignal.timeout(2500)
            });
            if(response.ok&&Number(response.headers.get('content-length')||0)<65536){
              const data=await response.json();
              if(data?.kind==='rx-queen-verified-learning'&&Array.isArray(data.lessons))
                bibiLearning={kind:data.kind,lessons:data.lessons.slice(0,3)};
            }
          }catch{/* Offline RX CLOUD must not block Queen chat. */}
        }
        const planned=planRXChat(message,history,bibiLearning);
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
        const factual=/^(co to jest|kim jest|kto to|co oznacza|opowiedz o|powiedz mi o|gdzie leży|gdzie jest|czym jest|znajdź informacje(?: o)?|znajdz informacje(?: o)?|wyszukaj informacje(?: o)?|poszukaj informacji(?: o)?)\s+/i.test(message.trim());
        const internal=/\b(rx|bibi|mrówek|mrówki|wirnik|vexorio|królowa)\b/i.test(message);
        if(factual&&!internal){
          try{
            const knowledge=await searchWorldKnowledge(message);
            if(knowledge)return new Response(JSON.stringify({...planned,answer:'📚 '+knowledge.title+'\n'+knowledge.summary+'\\nŹródło: '+knowledge.url+' (Wikipedia; sprawdź aktualność informacji)',knowledge,engine:'rx-world-knowledge',modelInferenceUsed:false}),{status:200,headers});
          }catch{/* Knowledge provider failure must never break the chat. */}
        }
        // Existing RX planner remains the safe fallback. No commands are executed.
        const rxAiEnabled=env.RX_AI_ENABLED==='true';
        const rxAiBound=!!(env.AI&&typeof env.AI.run==='function');
        let rxAiFailure=null;
        if(rxAiEnabled && rxAiBound){
          try{
            const messages=[
              {role:'system',content:'Jesteś RX Królową, polskojęzycznym asystentem administratora VEXORIO. Odpowiadaj jasno i zgodnie z prawdą. RX TURBINE, Mrówki i AI Core planują zadania; nie twierdź, że je wykonały, trenowały model lub zmieniły produkcję. Nie ujawniaj sekretów. Nie wykonuj poleceń; wymagają zgody właściciela.'},
              ...history.slice(-8).map(text=>({role:'user',content:text.slice(0,2000)})),
              {role:'user',content:message}
            ];
            const inference=await env.AI.run('@cf/meta/llama-3.1-8b-instruct',{messages,max_tokens:512,temperature:0.3});
            const answer=typeof inference?.response==='string'?inference.response.trim():'';
            if(answer)return new Response(JSON.stringify({...planned,answer:answer.slice(0,4000),modelInferenceUsed:true,engine:'cloudflare-workers-ai',turbine:{connectedToPlanner:true,executionConnected:false,trainingConnected:false,requiresApproval:true}}),{status:200,headers});
          }catch(error){rxAiFailure='provider_error';console.warn('RX AI provider unavailable:',String(error?.name||'provider_error'));}
          if(!rxAiFailure)rxAiFailure='empty_response';
        }
        const rxAiReason=!rxAiEnabled?'ai_disabled':!rxAiBound?'ai_binding_missing':rxAiFailure||'unknown';
        // Our existing RX planner is the primary free, deterministic brain when external AI is disabled.
        const localEngine=!rxAiEnabled?'rx-local-planner':'rule-based-fallback';
        return new Response(JSON.stringify({...planned,engine:localEngine,aiDiagnostic:{reason:rxAiReason,configured:rxAiEnabled,bindingAvailable:rxAiBound,modelInferenceUsed:false,localPlannerActive:true},turbine:{connectedToPlanner:true,executionConnected:false,trainingConnected:false,requiresApproval:true}}),{status:200,headers});
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
    // RX Brain memory is a separate source; no fallback to RX CLOUD.
    // RX #604: private Queen identity probe; no client-chat fallback or model claim.
    if(url.pathname==='/api/rx/admin/queen-chat'){
      const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
      const reply=(status,message)=>new Response(JSON.stringify({ok:false,message}),{status,headers});
      if(request.method!=='POST')return reply(405,'Dozwolone tylko POST.');
      const origin=request.headers.get('Origin');
      if(origin&&origin!==url.origin)return reply(403,'Nieprawidłowe pochodzenie.');
      const site=request.headers.get('Sec-Fetch-Site');
      if(site&&site!=='same-origin'&&site!=='none')return reply(403,'Żądanie spoza witryny.');
      const auth=request.headers.get('Authorization')||'';
      if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth))return reply(401,'Wymagane logowanie administratora.');
      if(!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY)return reply(503,'Logowanie jest niedostępne.');
      let base;try{base=new URL(env.SUPABASE_URL);}catch{return reply(503,'Błędna konfiguracja.');}
      if(base.protocol!=='https:'||!/^[a-z0-9-]+[.]supabase[.]co$/.test(base.hostname)||base.pathname!=='/'||base.search||base.hash||base.username||base.password||base.port)return reply(503,'Błędna konfiguracja.');
      try{
        const identity=await fetch(new URL('/auth/v1/user',base),{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});
        if(!identity.ok)return reply(401,'Sesja wygasła.');
        const user=await identity.json();
        if(!user?.id||user.is_anonymous===true)return reply(403,'Brak uprawnień.');
        const permission=await fetch(new URL('/rest/v1/rpc/is_vexorio_admin',base),{method:'POST',headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
        if(!permission.ok)return reply(502,'Nie można sprawdzić uprawnień.');
        if((await permission.json())!==true)return reply(403,'Brak uprawnień administratora.');
      }catch{return reply(502,'Weryfikacja administratora niedostępna.');}
      let payload;try{payload=await request.json();}catch{return reply(400,'Nieprawidłowy JSON.');}
      if(typeof payload?.message!=='string'||!payload.message.trim()||payload.message.length>2000)return reply(400,'Wiadomość musi mieć od 1 do 2000 znaków.');
      // RX #607: separate opt-in Queen inference binding; never reuse BIBI's model.
      // Only the authenticated admin's current message is sent; no private memory,
      // history, credentials or privileged tools are forwarded.
      if(/^zapytaj (?:model|ai):/iu.test(payload.message.trim())){
        const {askQueenModel}=await import('./rx-queen-model-bridge.mjs');
        const model=await askQueenModel(payload.message,env);
        return new Response(JSON.stringify({ok:true,...model,executed:0,adminToolsAvailable:false}),{status:200,headers});
      }
      // RX #615: natural Queen messages may use the private model when enabled.
      // Preserve basic admin identity/status replies and never execute tools.
      const queenPlain=payload.message.trim();
      const queenBasic=/^(?:kim jesteś|kim jestes|jak się nazywasz|jak sie nazywasz|przedstaw się|przedstaw sie|cześć|czesc|hej|witaj|witam|co potrafisz|co umiesz|pomoc|help|jak działasz|jak dzialasz|jaki jest status|status|status rx|czy działasz|czy dzialasz|czy jesteś online|czy jestes online|dziękuję|dziekuje|dzięki|dzieki|dobranoc|do widzenia|na razie)[?!. ]*$/iu.test(queenPlain);
      if(!queenBasic&&env.RX_QUEEN_MODEL_ENABLED==='true'&&typeof env.RX_QUEEN_MODEL_SERVICE?.fetch==='function'&&queenPlain.length<=1000){
        const {askQueenModel}=await import('./rx-queen-model-bridge.mjs');
        const model=await askQueenModel('Zapytaj model: '+queenPlain,env);
        if(model.modelInferenceUsed)return new Response(JSON.stringify({ok:true,...model,executed:0,adminToolsAvailable:false}),{status:200,headers});
      }
      const normalized=payload.message.trim().toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l');
      if(/^(kim jestes|jak sie nazywasz|przedstaw sie|czesc|hej|witaj|witam)[?!. ]*$/.test(normalized)){
        return new Response(JSON.stringify({ok:true,answer:'Jestem Królową RX, prywatnym panelem zarządzania VEXORIO. Ten punkt kontrolny potwierdza tożsamość i uprawnienia; pełny silnik rozmowy nie jest jeszcze podłączony.',engine:'rx-queen-identity',modelInferenceUsed:false,executed:0}),{status:200,headers});
      }
      const replyText=/^(?:co potrafisz|co umiesz|pomoc|help|jak dzialasz)[?!. ]*$/.test(normalized)
        ? 'Mogę potwierdzić dostęp administratora i wyjaśnić stan czatu RX. W panelu są osobne narzędzia do pamięci, testów i zadań. Nie wykonuję ich automatycznie z tej rozmowy.'
        : /^(?:jaki jest status|status|status rx|czy dzialasz|czy jestes online)[?!. ]*$/.test(normalized)
        ? 'Prywatny punkt rozmowy Królowej RX odpowiada i sesja administratora została zweryfikowana. Nie jest to potwierdzenie działania modelu generatywnego ani pozostałych usług.'
        : /^(?:dziekuje|dzieki|dobranoc|do widzenia|na razie)[?!. ]*$/.test(normalized)
        ? 'Do zobaczenia! Panel Królowej RX pozostaje dostępny po zalogowaniu.'
        : 'Rozumiem wiadomość, ale obecny czat Królowej RX obsługuje tylko podstawowe odpowiedzi. Nie mam jeszcze podłączonego pełnego silnika rozmowy i nie wykonałam polecenia.';
      return new Response(JSON.stringify({ok:true,answer:replyText,engine:'rx-queen-basic-chat',modelInferenceUsed:false,executed:0}),{status:200,headers});
    }
    if(url.pathname==='/api/rx/admin/brain-memory'){
      const headers={'Cache-Control':'no-store','Content-Type':'application/json'};
      const reply=(status,message)=>new Response(JSON.stringify({ok:false,message}),{status,headers});
      if(request.method!=='GET')return reply(405,'GET required');
      const origin=request.headers.get('Origin');
      if(origin&&origin!==url.origin)return reply(403,'Origin rejected');
      const site=request.headers.get('Sec-Fetch-Site');
      if(site&&site!=='same-origin'&&site!=='none')return reply(403,'Site rejected');
      const auth=request.headers.get('Authorization')||'';
      if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth))return reply(401,'Admin session required');
      if(!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY)return reply(503,'Auth unavailable');
      let base;try{base=new URL(env.SUPABASE_URL);}catch{return reply(503,'Auth unavailable');}
      if(base.protocol!=='https:'||!/^[a-z0-9-]+[.]supabase[.]co$/.test(base.hostname)||base.pathname!=='/'||base.search||base.hash||base.username||base.password||base.port)return reply(503,'Auth unavailable');
      try{
        const userResponse=await fetch(new URL('/auth/v1/user',base),{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});
        if(!userResponse.ok)return reply(401,'Session expired');
        const user=await userResponse.json();
        if(!user?.id||user.is_anonymous===true)return reply(403,'Forbidden');
        const permission=await fetch(new URL('/rest/v1/rpc/is_vexorio_admin',base),{method:'POST',headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
        if(!permission.ok)return reply(502,'Permission check failed');
        if((await permission.json())!==true)return reply(403,'Forbidden');
      }catch{return reply(502,'Auth check unavailable');}
      // Read the existing self-hosted RX CLOUD store, not a manually copied snapshot.
      const privateToken=env.RX_QUEEN_LOCAL_TOKEN||'';
      let endpoint;
      try{endpoint=new URL(env.RX_CLOUD_BRAIN_MEMORY_URL||'');}catch{return reply(503,'RX Brain memory unavailable');}
      if(privateToken.length<32||endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.port||endpoint.search||endpoint.hash||endpoint.pathname!=='/__rxcloud/bibi/brain-memory'||!endpoint.hostname||endpoint.hostname==='localhost'||endpoint.hostname.endsWith('.localhost'))return reply(503,'RX Brain memory unavailable');
      let data;
      try{
        const response=await fetch(endpoint.toString(),{headers:{Authorization:'Bearer '+privateToken,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(7000)});
        if(!response.ok)return reply(502,'RX CLOUD Brain memory unavailable');
        const raw=await response.text();
        if(raw.length>100000)return reply(502,'RX Brain snapshot too large');
        const payload=JSON.parse(raw);
        if(payload?.ok!==true||payload.kind!=='rx-brain-memory')return reply(502,'Invalid RX Brain response');
        data=payload.snapshot;
      }catch{return reply(502,'RX CLOUD Brain memory unavailable');}
      if(data?.schema!==1||data.kind!=='rx-brain-memory'||!Array.isArray(data.records)||data.records.length>200)return reply(503,'Invalid memory');
      const records=[];
      for(const item of data.records){
        if(!item||typeof item.key!=='string'||!/^[a-z0-9_-]{1,80}$/.test(item.key)||typeof item.action!=='string'||item.action.length<1||item.action.length>120||!Number.isSafeInteger(item.successes)||!Number.isSafeInteger(item.failures)||item.successes<0||item.failures<0||item.successes+item.failures<1||item.successes+item.failures>1000000)return reply(503,'Invalid memory');
        records.push({key:item.key,action:item.action,samples:item.successes+item.failures,successRate:item.successes/(item.successes+item.failures),requiresApproval:true});
      }
      return new Response(JSON.stringify({ok:true,kind:'rx-brain-memory',records}),{status:200,headers});
    }
    // Admin-only read bridge to the EXISTING private RX CLOUD learning feed.
    // Both the cloud URL and token are server-side secrets; never return either to browsers.
    if (url.pathname === '/api/rx/admin/learning') {
      const headers={'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff'};
      const reply=(status,message)=>new Response(JSON.stringify({ok:false,message}),{status,headers});
      if(request.method!=='GET')return reply(405,'Dozwolone tylko GET.');
      const origin=request.headers.get('Origin');
      if(origin&&origin!==url.origin)return reply(403,'Nieprawidłowe pochodzenie.');
      const site=request.headers.get('Sec-Fetch-Site');
      if(site&&site!=='same-origin'&&site!=='none')return reply(403,'Żądanie spoza witryny.');
      const auth=request.headers.get('Authorization')||'';
      if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth))return reply(401,'Wymagane logowanie administratora.');
      if(!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY)return reply(503,'Logowanie nie jest skonfigurowane.');
      let base;
      try{base=new URL(env.SUPABASE_URL);}catch{return reply(503,'Błędna konfiguracja logowania.');}
      if(base.protocol!=='https:'||!/^[a-z0-9-]+[.]supabase[.]co$/.test(base.hostname)||base.pathname!=='/'||base.search||base.hash||base.username||base.password||base.port)return reply(503,'Błędna konfiguracja logowania.');
      try{
        const identity=await fetch(new URL('/auth/v1/user',base),{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});
        if(!identity.ok)return reply(401,'Sesja jest nieważna.');
        const user=await identity.json();
        if(!user?.id||user.is_anonymous===true)return reply(403,'Brak uprawnień.');
        const check=await fetch(new URL('/rest/v1/rpc/is_vexorio_admin',base),{method:'POST',headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
        if(!check.ok)return reply(502,'Nie można sprawdzić uprawnień.');
        if((await check.json())!==true)return reply(403,'Brak uprawnień administratora.');
      }catch{return reply(502,'Weryfikacja administratora niedostępna.');}
      const privateToken=env.RX_QUEEN_LOCAL_TOKEN||'';
      const localLearning=env.RX_CLOUD_LOCAL_LEARNING_SERVICE;
      const useLocal=typeof localLearning?.fetch==='function';
      if(!useLocal&&!env.RX_CLOUD_LEARNING_URL)return reply(503,'Brak adresu HTTPS pamięci RX CLOUD (RX_CLOUD_LEARNING_URL).');
      if(privateToken.length<32)return reply(503,'Brak prywatnego tokenu RX CLOUD (RX_QUEEN_LOCAL_TOKEN).');
      let endpoint;
      if(!useLocal){
        try{endpoint=new URL(env.RX_CLOUD_LEARNING_URL);}catch{return reply(503,'Nieprawidłowy adres pamięci RX CLOUD.');}
        if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.port||endpoint.search||endpoint.hash||endpoint.pathname!=='/__rxcloud/bibi/learning'||!endpoint.hostname||endpoint.hostname==='localhost'||endpoint.hostname.endsWith('.localhost'))return reply(503,'Nieprawidłowy adres HTTPS pamięci RX CLOUD.');
      }
      try{
        const response=useLocal?await localLearning.fetch('http://rxcloud.internal/__rxcloud/bibi/learning',{signal:AbortSignal.timeout(7000)}):await fetch(endpoint.toString(),{headers:{Authorization:'Bearer '+privateToken,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(7000)});
        if(!response.ok)return reply(502,'Pamięć RX CLOUD jest niedostępna.');
        const raw=await response.text();
        if(raw.length>100000)return reply(502,'Odpowiedź pamięci jest zbyt duża.');
        const data=JSON.parse(raw);
        if(data?.kind!=='rx-queen-verified-learning'||!Array.isArray(data.lessons)||!Array.isArray(data.verified))return reply(502,'Nieprawidłowa odpowiedź pamięci.');
        return new Response(JSON.stringify({ok:true,kind:data.kind,lessons:data.lessons.slice(0,30),verified:data.verified.slice(0,30),suggestions:Array.isArray(data.suggestions)?data.suggestions.slice(0,20):[],source:data.source||'UNKNOWN'}),{status:200,headers});
      }catch{return reply(502,'Pamięć RX CLOUD jest niedostępna.');}
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
