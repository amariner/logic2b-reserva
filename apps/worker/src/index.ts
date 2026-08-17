interface Env {
  ASSETS: Fetcher;
  LEADS_TRANSPORT?: string;
}

const securityHeaders = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/leads') {
      // F12 implementa el endpoint real (Zod + honeypot + rate-limit + Resend).
      // Hasta entonces falla en cerrado: nunca finge una entrega.
      return new Response(JSON.stringify({ error: 'leads_disabled' }), {
        status: 503,
        headers: { 'content-type': 'application/json', ...securityHeaders },
      });
    }
    if (url.pathname.startsWith('/api/'))
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { 'content-type': 'application/json', ...securityHeaders },
      });
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    Object.entries(securityHeaders).forEach(([key, value]) => headers.set(key, value));
    if (url.pathname.startsWith('/demos/') || url.pathname.startsWith('/en/demos/'))
      headers.set('x-robots-tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, headers });
  },
};
