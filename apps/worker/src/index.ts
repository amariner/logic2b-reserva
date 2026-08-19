import { handleLead, type LeadEnv } from './leads';
import { commercialLeadsEnabled, demoBlockedResponse } from './demo-mode';

export { LeadCoordinator } from './lead-coordinator';

export interface Env extends LeadEnv { ASSETS: Fetcher; }

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
      if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { 'content-type': 'application/json', allow: 'POST', ...securityHeaders } });
      // Commercial lead capture is the sole explicit side-effect exception.
      // This guard runs before request.json(), Durable Objects or providers.
      if (!commercialLeadsEnabled(env)) {
        const response = demoBlockedResponse('lead_delivery');
        const headers = new Headers(response.headers);
        Object.entries(securityHeaders).forEach(([key, value]) => headers.set(key, value));
        return new Response(response.body, { status: response.status, headers });
      }
      const response = await handleLead(request, env);
      const headers = new Headers(response.headers);
      Object.entries(securityHeaders).forEach(([key, value]) => headers.set(key, value));
      return new Response(response.body, { status: response.status, headers });
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
