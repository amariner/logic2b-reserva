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
const panelSlugs = ['servicio', 'plano', 'reservas-espera', 'grupos-eventos', 'informes', 'inteligente'];
const themeSlugs = ['brasca', 'vedra', 'solane', 'la-trece', 'salobre', 'trama', 'umbral', 'nacre', 'brisa-alta', 'nave-nueve', 'miga-club', 'mercat-33'];

const invariant = (condition, message) => {
  if (!condition) throw new Error(`[public-smoke] ${message}`);
};

const request = async (pathname, method = 'GET') => {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, {
    method,
    headers: { accept: '*/*', 'cache-control': 'no-cache' },
    redirect: 'follow',
    signal: AbortSignal.timeout(10_000),
  });
  const body = method === 'HEAD' ? '' : await response.text();
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
  const head = await request(pathname, 'HEAD');
  invariant(head.response.status === 200, `HEAD ${pathname} debe responder 200, recibido ${head.response.status}`);
  invariant(head.response.headers.get('content-type')?.includes(contentType), `HEAD ${pathname} debe responder ${contentType}`);
  verifySecurityHeaders(head);
  if (noindex) {
    invariant(head.response.headers.get('x-robots-tag') === 'noindex, nofollow', `HEAD ${pathname} debe enviar x-robots-tag`);
  } else {
    invariant(!head.response.headers.has('x-robots-tag'), `HEAD ${pathname} indexable no debe enviar x-robots-tag`);
  }
  return result;
};

const verifyOnce = async () => {
  for (const pathname of [
    '/', '/empezar/', '/temas/', '/paneles/', '/planes/', '/docs/', '/docs/tecnica/',
    '/en/', '/en/empezar/', '/en/temas/', '/en/paneles/', '/en/planes/', '/en/docs/', '/en/docs/tecnica/',
    ...panelSlugs.map((slug) => `/paneles/${slug}/`),
    ...panelSlugs.map((slug) => `/en/paneles/${slug}/`),
    ...themeSlugs.map((slug) => `/temas/${slug}/`),
    ...themeSlugs.map((slug) => `/en/temas/${slug}/`),
  ]) {
    await verifyPage(pathname, { contentType: 'text/html' });
  }
  await verifyPage('/demos/solane/', { contentType: 'text/html', noindex: true });
  await verifyPage('/en/demos/solane/', { contentType: 'text/html', noindex: true });

  const robots = await verifyPage('/robots.txt', { contentType: 'text/plain' });
  invariant(/^Disallow: \/demos\/$/m.test(robots.body), 'robots.txt debe excluir /demos/');
  invariant(/^Disallow: \/en\/demos\/$/m.test(robots.body), 'robots.txt debe excluir /en/demos/');

  const sitemap = await verifyPage('/sitemap.xml', { contentType: 'application/xml' });
  invariant(!sitemap.body.includes('/demos/'), 'sitemap.xml no debe incluir demos');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/</loc>`), 'sitemap.xml debe usar la URL canónica de producción');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/en/</loc>`), 'sitemap.xml debe incluir la landing inglesa canónica');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/empezar/</loc>`), 'sitemap.xml debe incluir el inicio comercial');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/en/empezar/</loc>`), 'sitemap.xml debe incluir el inicio comercial inglés');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/paneles/servicio/</loc>`), 'sitemap.xml debe incluir las fichas de panel');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/en/paneles/inteligente/</loc>`), 'sitemap.xml debe incluir las fichas inglesas de panel');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/temas/brasca/</loc>`), 'sitemap.xml debe incluir las fichas de dirección web');
  invariant(sitemap.body.includes(`<loc>${canonicalOrigin}/en/temas/mercat-33/</loc>`), 'sitemap.xml debe incluir las fichas inglesas de dirección web');

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
    console.log(`[public-smoke] ${baseUrl.origin} verificado con peticiones GET/HEAD`);
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
