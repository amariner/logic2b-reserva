const baseUrl = new URL(process.argv[2] ?? 'https://reserva.logic2b.com');
const canonicalOrigin = 'https://reserva.logic2b.com';
const attempts = Number.parseInt(process.env.PUBLIC_VERIFY_ATTEMPTS ?? '5', 10);
const retryDelayMs = Number.parseInt(process.env.PUBLIC_VERIFY_RETRY_MS ?? '2000', 10);

if (baseUrl.protocol !== 'https:') throw new Error('[public-smoke] la URL pública debe usar HTTPS');
if (!Number.isInteger(attempts) || attempts < 1) throw new Error('[public-smoke] PUBLIC_VERIFY_ATTEMPTS debe ser un entero positivo');
if (!Number.isInteger(retryDelayMs) || retryDelayMs < 0) throw new Error('[public-smoke] PUBLIC_VERIFY_RETRY_MS debe ser un entero no negativo');

const securityHeaders = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};

const invariant = (condition, message) => {
  if (!condition) throw new Error(`[public-smoke] ${message}`);
};

const request = async (pathname) => {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, {
    headers: { accept: '*/*', 'cache-control': 'no-cache' },
    redirect: 'follow',
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.text();
  return { body, response, url };
};

const verifySecurityHeaders = ({ response, url }) => {
  for (const [name, expected] of Object.entries(securityHeaders)) {
    invariant(response.headers.get(name) === expected, `${url.pathname} debe responder ${name}: ${expected}`);
  }
};

const verifyPage = async (pathname, { contentType, noindex = false } = {}) => {
  const result = await request(pathname);
  invariant(result.response.status === 200, `${pathname} debe responder 200, recibido ${result.response.status}`);
  invariant(result.response.headers.get('content-type')?.includes(contentType), `${pathname} debe responder ${contentType}`);
  verifySecurityHeaders(result);
  if (noindex) {
    invariant(result.response.headers.get('x-robots-tag') === 'noindex, nofollow', `${pathname} debe enviar x-robots-tag`);
    invariant(/<meta[^>]+name=["']robots["'][^>]+content=["']noindex, nofollow["']/i.test(result.body), `${pathname} debe contener meta robots noindex`);
  } else {
    invariant(!result.response.headers.has('x-robots-tag'), `${pathname} indexable no debe enviar x-robots-tag`);
  }
  return result;
};

const verifyOnce = async () => {
  await verifyPage('/', { contentType: 'text/html' });
  await verifyPage('/en/', { contentType: 'text/html' });
  await verifyPage('/demos/solane/', { contentType: 'text/html', noindex: true });
  await verifyPage('/en/demos/solane/', { contentType: 'text/html', noindex: true });

  const robots = await verifyPage('/robots.txt', { contentType: 'text/plain' });
  invariant(/^Disallow: \/demos\/$/m.test(robots.body), 'robots.txt debe excluir /demos/');
  invariant(/^Disallow: \/en\/demos\/$/m.test(robots.body), 'robots.txt debe excluir /en/demos/');

  const sitemap = await verifyPage('/sitemap.xml', { contentType: 'application/xml' });
  invariant(!sitemap.body.includes('/demos/'), 'sitemap.xml no debe incluir demos');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/</loc>`), 'sitemap.xml debe usar la URL canónica de producción');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/en/</loc>`), 'sitemap.xml debe incluir la landing inglesa canónica');

  const leads = await request('/api/leads');
  invariant(leads.response.status === 405, `/api/leads por GET debe responder 405, recibido ${leads.response.status}`);
  invariant(leads.response.headers.get('allow') === 'POST', '/api/leads debe declarar Allow: POST');
  invariant(leads.response.headers.get('content-type')?.includes('application/json'), '/api/leads debe responder JSON');
  verifySecurityHeaders(leads);
  invariant(JSON.parse(leads.body).error === 'method_not_allowed', '/api/leads debe responder method_not_allowed');

  const unknownApi = await request('/api/public-smoke-not-found');
  invariant(unknownApi.response.status === 404, `una API desconocida debe responder 404, recibido ${unknownApi.response.status}`);
  invariant(unknownApi.response.headers.get('content-type')?.includes('application/json'), 'una API desconocida debe responder JSON');
  verifySecurityHeaders(unknownApi);
};

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifyOnce();
    console.log(`[public-smoke] ${baseUrl.origin} verificado con peticiones GET`);
    lastError = undefined;
    break;
  } catch (error) {
    lastError = error;
    if (attempt === attempts) break;
    console.warn(`[public-smoke] intento ${attempt}/${attempts} fallido; reintentando en ${retryDelayMs} ms`);
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
}

if (lastError) throw lastError;
