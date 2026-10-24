export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/listing-view') {
      if (request.method !== 'POST') return new Response(null, {status: 405, headers: {'Allow': 'POST', 'Cache-Control': 'no-store'}});
      if (request.headers.get('Origin') !== url.origin) return new Response(null, {status: 403, headers: {'Cache-Control': 'no-store'}});
      const contentType = request.headers.get('Content-Type') || '';
      if (!/^application\\/json(?:\\s*;|$)/i.test(contentType)) return new Response(null, {status: 415, headers: {'Cache-Control': 'no-store'}});
      if (Number(request.headers.get('Content-Length') || 0) > 512) return new Response(null, {status: 413, headers: {'Cache-Control': 'no-store'}});
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
      const endpoint = new URL('/rest/v1/rpc/vexorio_record_listing_view_server', env.SUPABASE_URL);
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY},
        body: JSON.stringify({p_listing_id: listingId, p_visitor_digest: digest})
      });
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
