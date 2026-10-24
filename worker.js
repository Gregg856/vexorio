export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('X-Permitted-Cross-Domain-Policies', 'none');
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
