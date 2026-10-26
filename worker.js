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
            const response=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/'+file+'/runs?per_page=1',{
              headers:{Accept:'application/vnd.github+json','User-Agent':'RX-Direct-2076'},
              signal:AbortSignal.timeout(8000)
            });
            if(!response.ok)return {name,status:'unavailable',result:null};
            const data=await response.json();
            const run=data.workflow_runs?.[0];
            return run?{name,number:run.run_number,status:run.status,result:run.conclusion||null,link:run.html_url}:{name,status:'unknown',result:null};
          }catch{return {name,status:'unavailable',result:null};}
        }));
        if(runs.every(run=>run.status==='unavailable'))throw new Error('github_unavailable');
        return new Response(JSON.stringify({ok:true,command:'RX STATUS',source:'github-actions',runs}),{status:200,headers});
      }catch{
        return new Response(JSON.stringify({ok:false,command:'RX STATUS',error:'status_temporarily_unavailable'}),{status:502,headers});
      }
    }
    if (url.pathname === '/api/rx/health') {
      if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET','Cache-Control':'no-store'}});
      const ready=Boolean(env.RX_GITHUB_DISPATCH_TOKEN&&env.RX_ADMIN_USER_ID&&env.SUPABASE_URL&&env.SUPABASE_ANON_KEY);
      return new Response(JSON.stringify({ready,configured:ready,service:'RX Tester',missing:['RX_GITHUB_DISPATCH_TOKEN','RX_ADMIN_USER_ID','SUPABASE_URL','SUPABASE_ANON_KEY'].filter(name=>!env[name]),note:ready?'Serwer gotowy do sprawdzania uprawnień.':'Wymagana konfiguracja po stronie Cloudflare.'}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    if (url.pathname === '/api/rx/run-test') {
      const headers={'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff'};
      const reply=(status,message)=>new Response(JSON.stringify({ok:false,message}),{status,headers});
      if(request.method!=='POST')return reply(405,'Dozwolone tylko POST.');
      if(request.headers.get('Origin')!==url.origin)return reply(403,'Nieprawidłowe pochodzenie.');
      // Fail closed until the owner configures both secrets in Cloudflare.
      if(!env.RX_GITHUB_DISPATCH_TOKEN||!env.RX_ADMIN_USER_ID||!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY)return reply(503,'Uruchamianie testów wymaga konfiguracji administratora.');
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
      let github;
      try{
        github=await fetch('https://api.github.com/repos/Gregg856/vexorio/actions/workflows/rx-bibi-browser.yml/dispatches',{
          method:'POST',
          headers:{Authorization:'Bearer '+env.RX_GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RX-BIBI-Manager','Content-Type':'application/json'},
          body:JSON.stringify({ref:'main'}),signal:AbortSignal.timeout(12000)
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
