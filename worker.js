export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/rx/health') {
      if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET','Cache-Control':'no-store'}});
      const ready=Boolean(env.RX_GITHUB_DISPATCH_TOKEN&&env.RX_ADMIN_USER_ID&&env.SUPABASE_URL&&env.SUPABASE_ANON_KEY);
      return new Response(JSON.stringify({ready,configured:ready,service:'RX Tester',note:ready?'Serwer gotowy do sprawdzania uprawnień.':'Wymagana konfiguracja po stronie Cloudflare.'}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
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
      if(!identity?.id||identity.id!==env.RX_ADMIN_USER_ID||identity.is_anonymous===true)return reply(403,'Brak uprawnień administratora.');
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
