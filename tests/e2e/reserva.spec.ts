import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const pages = [
  '/',
  '/temas/',
  '/planes/',
  '/soluciones/restaurantes/',
  '/soluciones/grupos-y-eventos/',
  '/legal/',
  '/privacidad/',
  '/cookies/',
  '/en/',
  '/en/temas/',
  '/en/planes/',
  '/en/soluciones/restaurantes/',
  '/en/soluciones/grupos-y-eventos/',
  '/en/legal/',
  '/en/privacidad/',
  '/en/cookies/',
] as const;

const textContrastRatio = (locator: Locator) => locator.evaluate((element) => {
  type Rgb = { r: number; g: number; b: number; a: number };
  const parse = (value: string): Rgb => {
    const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
    return { r: channels[0] ?? 0, g: channels[1] ?? 0, b: channels[2] ?? 0, a: channels[3] ?? 1 };
  };
  const background = (() => {
    for (let current: Element | null = element; current; current = current.parentElement) {
      const color = parse(getComputedStyle(current).backgroundColor);
      if (color.a === 1) return color;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  })();
  const foreground = parse(getComputedStyle(element).color);
  const composited = {
    r: foreground.r * foreground.a + background.r * (1 - foreground.a),
    g: foreground.g * foreground.a + background.g * (1 - foreground.a),
    b: foreground.b * foreground.a + background.b * (1 - foreground.a),
    a: 1,
  };
  const luminance = (color: Rgb): number => {
    const channel = (value: number): number => {
      const normalized = value / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  };
  const light = Math.max(luminance(composited), luminance(background));
  const dark = Math.min(luminance(composited), luminance(background));
  return (light + 0.05) / (dark + 0.05);
});

const undersizedTargets = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('a, button, input, select, textarea, summary')].flatMap((element) => {
  const styles = getComputedStyle(element);
  const ownBox = element.getBoundingClientRect();
  if (
    styles.display === 'none'
    || styles.visibility === 'hidden'
    || ownBox.width === 0
    || ownBox.height === 0
    || element.matches(':disabled, option, [aria-hidden="true"], [tabindex="-1"], .honeypot, .skip-link')
  ) return [];

  const effectiveTarget = element.matches('input[type="checkbox"], input[type="radio"]')
    ? element.closest<HTMLElement>('label') ?? element
    : element;
  const box = effectiveTarget.getBoundingClientRect();
  if (box.width + 0.01 >= 44 && box.height + 0.01 >= 44) return [];
  return [{
    target: `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().replaceAll(' ', '.')}` : ''}`,
    text: (element.textContent || element.getAttribute('aria-label') || element.getAttribute('name') || '').trim().slice(0, 60),
    width: Number(box.width.toFixed(1)),
    height: Number(box.height.toFixed(1)),
  }];
}));

test.describe('landing comercial Logic Reserva', () => {
  test('todas las rutas públicas y recursos SEO responden', async ({ request }) => {
    for (const path of [...pages, '/robots.txt', '/sitemap.xml']) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
    }

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('https://reserva.logic2b.com/planes/');
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(sitemap).toContain('hreflang="x-default"');
    expect(sitemap).toContain('<lastmod>2026-08-18</lastmod>');
    expect(sitemap).not.toContain('/demos/');

    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /demos/');
    expect(robots).toContain('Disallow: /en/demos/');
  });

  test('SEO bilingüe, datos estructurados y contenido social describen el negocio', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Reservas para restaurantes y eventos | Logic Reserva');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://reserva.logic2b.com/');
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://reserva.logic2b.com/en/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /05-solane-inventario-desktop\.png$/);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1366');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '900');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('.demo-card__preview img')).toHaveCount(3);
    await expect(page.locator('.demo-card__preview img').first()).toHaveAttribute('alt', /Solane/);
    await expect(page.locator('.product-proof__screen img')).toHaveAttribute('src', '/images/screens/05-solane-inventario-desktop.png');
    await expect(page.getByRole('heading', { level: 2, name: 'Tu operativa marca las reglas. Logic2B diseña el encaje.' })).toBeVisible();
    await expect(page.getByText('La implantación se define con Logic2B a partir de tu operativa real.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir la demo · 2 min' })).toHaveAttribute('href', '/demos/solane/gestion/?vista=plano');

    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Logic2B — ir a logic2b.com' })).toHaveAttribute('href', 'https://logic2b.com');
    await expect(header.getByRole('link', { name: 'Logic2B Reservas — ir al inicio' })).toHaveAttribute('href', '/');

    const homeSchemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const homeTypes = homeSchemas.map((schema) => (JSON.parse(schema) as { '@type'?: string })['@type']);
    expect(homeTypes).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'FAQPage']));

    await page.goto('/soluciones/grupos-y-eventos/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Gestión de grupos y eventos | Logic Reserva');
    await expect(page.getByRole('heading', { level: 1, name: 'El evento deja de competir con la sala.' })).toBeVisible();
    const solutionSchemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const solutionTypes = solutionSchemas.map((schema) => (JSON.parse(schema) as { '@type'?: string })['@type']);
    expect(solutionTypes).toEqual(expect.arrayContaining(['BreadcrumbList', 'WebPage', 'FAQPage']));

    await page.goto('/en/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Restaurant and event bookings | Logic Reserva');
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', 'https://reserva.logic2b.com/');
    await expect(page.getByRole('heading', { level: 2, name: 'Your operation sets the rules. Logic2B designs the fit.' })).toBeVisible();
  });

  test('F21: shell, hero, captación breve y ecosistema orientan hacia el producto', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const header = page.getByRole('banner');
    const mainNav = header.locator('.main-nav');
    await expect(mainNav.getByRole('link', { name: 'Webs' })).toHaveAttribute('href', '/temas/');
    await expect(mainNav.getByRole('link', { name: 'Gestor' })).toHaveAttribute('href', '/demos/solane/gestion/?vista=plano');
    await expect(mainNav.getByRole('link', { name: 'Planes' })).toHaveAttribute('href', '/planes/');
    await expect(header.locator('.nav-cta')).toHaveAttribute('href', '#contacto');
    await expect(page.getByRole('link', { name: 'Abrir la demo · 2 min' })).toHaveAttribute('href', '/demos/solane/gestion/?vista=plano');
    await expect(page.getByRole('link', { name: 'Ver web demo' })).toHaveAttribute('href', '/demos/brasca/');
    await expect(page.getByRole('link', { name: 'Ver recorrido guiado' })).toHaveAttribute('href', '/demos/vedra/gestion/?vista=plano');
    await expect(page.locator('[data-lead-form]')).toHaveCount(2);
    await expect(page.locator('#portfolio .portfolio-card')).toHaveCount(3);
    await expect(page.locator('#ecosistema .ecosystem-card')).toHaveCount(3);
    await page.locator('#hero-lead-form button[type="submit"]').click();
    await expect(page.locator('#hero-lead-form [data-lead-status]')).toContainText('Revisa los campos obligatorios');

    await page.goto('/en/', { waitUntil: 'networkidle' });
    const englishNav = page.getByRole('banner').locator('.main-nav');
    await expect(englishNav.getByRole('link', { name: 'Websites' })).toBeVisible();
    await expect(englishNav.getByRole('link', { name: 'Manager' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View web demo' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'See guided journey' })).toBeVisible();
    await expect(page.locator('#ecosistema .ecosystem-card')).toHaveCount(3);
  });

  test('F22: el flujo, los cinco momentos y las conexiones tienen evidencia y límites', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('.journey-step')).toHaveCount(7);
    await expect(page.getByRole('heading', { level: 2, name: 'Siete momentos, una misma disponibilidad.' })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(5);
    await expect(page.getByRole('tab', { name: 'Web' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-web')).toBeVisible();
    await page.getByRole('tab', { name: 'Grupos y eventos' }).click();
    await expect(page.getByRole('tab', { name: 'Grupos y eventos' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-grupos')).toBeVisible();
    await expect(page.locator('#panel-web')).toBeHidden();
    await expect(page.locator('#panel-grupos .moment-panel__limit')).toContainText('Las señales y depósitos se simulan');
    await page.getByRole('tab', { name: 'Grupos y eventos' }).press('End');
    await expect(page.getByRole('tab', { name: 'Operativa' })).toBeFocused();
    await expect(page.getByRole('tab', { name: 'Operativa' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#conexiones .connection-card')).toHaveCount(3);
    await expect(page.getByRole('heading', { level: 2, name: 'La plataforma no promete lo que aún no está conectado.' })).toBeVisible();

    await page.goto('/en/', { waitUntil: 'networkidle' });
    await expect(page.locator('.journey-step')).toHaveCount(7);
    await expect(page.getByRole('tab', { name: 'Website' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Groups and events' })).toBeVisible();
    await expect(page.locator('#conexiones .connection-card')).toHaveCount(3);
  });

  test('F23: el catálogo ofrece doce direcciones y nueve previews web reutilizables', async ({ page, request }) => {
    await page.goto('/temas/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1, name: 'Doce identidades de restaurante. Una misma forma de operar.' })).toBeVisible();
    await expect(page.locator('[data-theme-card]')).toHaveCount(12);
    await expect(page.locator('[data-theme-card] a[aria-label*="Brasca"]')).toHaveAttribute('href', '/demos/brasca/');
    await expect(page.locator('[data-theme-card] a[aria-label*="L\'Olivar"]')).toHaveAttribute('href', '/demos/temas/olivar/');
    await page.locator('[data-theme-search]').fill("L'Olivar");
    await expect(page.locator('[data-theme-card]:not([hidden])')).toHaveCount(1);
    await page.locator('[data-theme-search]').fill('');
    await page.locator('[data-theme-filter]').selectOption('basico');
    await expect(page.locator('[data-theme-card]:not([hidden])')).toHaveCount(4);

    await page.goto('/en/temas/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1, name: 'Twelve restaurant identities. One operating idea.' })).toBeVisible();
    await expect(page.locator('[data-theme-card]')).toHaveCount(12);

    const newThemeSlugs = ['olivar', 'mar-de-fondo', 'riu-clar', 'la-duna', 'el-delta', 'serralta', 'entre-vinyes', 'la-ballena', 'sol-hivern'];
    for (const slug of newThemeSlugs) {
      for (const path of [`/demos/temas/${slug}/`, `/en/demos/temas/${slug}/`]) {
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
      }
    }
    await page.goto('/demos/temas/olivar/', { waitUntil: 'networkidle' });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.getByRole('heading', { level: 1, name: 'Una dirección web con un punto de vista claro.' })).toBeVisible();
    await expect(page.getByText("L'Olivar", { exact: true }).first()).toBeVisible();
    await page.goto('/en/demos/temas/olivar/', { waitUntil: 'networkidle' });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.getByText("L'Olivar", { exact: true }).first()).toBeVisible();
  });

  test('el teclado puede saltar la navegación en las páginas públicas es/en', async ({ page }) => {
    for (const path of ['/', '/planes/', '/en/', '/en/planes/']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.keyboard.press('Tab');
      const label = path.startsWith('/en/') ? 'Skip to main content' : 'Saltar al contenido principal';
      const skipLink = page.getByRole('link', { name: label });
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toHaveAttribute('href', '#contenido');
      await skipLink.press('Enter');
      await expect(page.locator('#contenido')).toBeFocused();
    }
  });

  test('la navegación móvil mantiene producto, idioma y contacto disponibles', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.mobile-menu > summary').click();
    const menu = page.locator('.mobile-menu nav');
    await expect(menu.getByRole('link', { name: 'Webs' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Gestor' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Planes' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Solicitar demo' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'EN', exact: true })).toBeVisible();
    await menu.getByRole('link', { name: 'Webs' }).click();
    await expect(page).toHaveURL('/temas/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  });

  test('el texto pequeño conserva contraste AA sobre los acentos de la landing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const selectors = [
      '.eyebrow', '.brand-wordmark__product', '.product-proof__bar', '.product-proof figcaption div span',
      '.demo-note', '.hero-flow i', '.path-card--restaurant .path-card__body',
      '.path-card--events .path-card__body', '.path-card--events li', '.demo-card__evidence',
      '.pill.ghost', '.human-intro > p', '.privacy-check', '.footer-bottom',
    ];
    const ratios = await page.evaluate((targets) => {
      type Rgb = { r: number; g: number; b: number; a: number };
      const parse = (value: string): Rgb => {
        const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
        return { r: channels[0] ?? 0, g: channels[1] ?? 0, b: channels[2] ?? 0, a: channels[3] ?? 1 };
      };
      const composite = (foreground: Rgb, backdrop: Rgb): Rgb => ({
        r: foreground.r * foreground.a + backdrop.r * (1 - foreground.a),
        g: foreground.g * foreground.a + backdrop.g * (1 - foreground.a),
        b: foreground.b * foreground.a + backdrop.b * (1 - foreground.a),
        a: 1,
      });
      const background = (element: Element): Rgb => {
        const layers: Rgb[] = [];
        for (let current: Element | null = element; current; current = current.parentElement) {
          layers.push(parse(getComputedStyle(current).backgroundColor));
        }
        return layers.reduceRight(
          (backdrop, layer) => composite(layer, backdrop),
          { r: 255, g: 255, b: 255, a: 1 },
        );
      };
      const luminance = (color: Rgb): number => {
        const channel = (value: number): number => {
          const normalized = value / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
      };
      return targets.map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return { selector, ratio: 0 };
        const backdrop = background(element);
        const foreground = composite(parse(getComputedStyle(element).color), backdrop);
        const light = Math.max(luminance(foreground), luminance(backdrop));
        const dark = Math.min(luminance(foreground), luminance(backdrop));
        return { selector, ratio: (light + 0.05) / (dark + 0.05) };
      });
    }, selectors);
    for (const { selector, ratio } of ratios) expect(ratio, selector).toBeGreaterThanOrEqual(4.5);

    await page.goto('/planes/', { waitUntil: 'networkidle' });
    expect(await textContrastRatio(page.locator('.info-cta .eyebrow')), 'CTA de página comercial').toBeGreaterThanOrEqual(4.5);
  });

  test('los objetivos táctiles públicos conservan un área mínima de 44 px', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1366, height: 900 });
    for (const path of pages) {
      await page.goto(path, { waitUntil: 'networkidle' });
      expect(await undersizedTargets(page), path).toEqual([]);
    }
  });

  test('todas las páginas públicas tienen metadatos únicos y rastreables', async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const path of pages) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const title = await page.title();
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(title.length, `${path} title length`).toBeLessThanOrEqual(60);
      expect(description?.length, `${path} description minimum`).toBeGreaterThanOrEqual(100);
      expect(description?.length, `${path} description maximum`).toBeLessThanOrEqual(160);
      expect(titles.has(title), `${path} duplicated title`).toBe(false);
      expect(descriptions.has(description ?? ''), `${path} duplicated description`).toBe(false);
      titles.add(title);
      descriptions.add(description ?? '');

      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://reserva.logic2b.com${path}`);
      await expect(page.locator('link[rel="alternate"]')).toHaveCount(3);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description ?? '');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, (follow|max-image-preview|nofollow)/);
    }
  });

  for (const width of [320, 375, 430, 1366]) {
    test(`sin overflow ni errores de consola a ${width}px`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));

      for (const path of pages) {
        const response = await page.goto(path, { waitUntil: 'networkidle' });
        expect(response?.status(), path).toBe(200);
        const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflows, `${path} at ${width}px`).toBe(false);
      }
      expect(errors).toEqual([]);
    });
  }

  test('el formulario convierte la prioridad operativa en un alcance comercial legible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const priority = page.getByLabel('Qué quieres ordenar primero');
    await expect(priority).toHaveValue('gestion');
    await expect(priority.locator('option')).toHaveCount(3);
    await priority.selectOption('inteligente');
    await expect(priority).toHaveValue('inteligente');
  });

  test('el consentimiento no tapa las acciones principales del hero', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const banner = await page.locator('[data-cookie-banner]').boundingBox();
    const secondaryAction = await page.getByRole('link', { name: 'Hablar de mi operativa' }).boundingBox();
    expect(banner).not.toBeNull();
    expect(secondaryAction).not.toBeNull();
    expect(banner!.x).toBeGreaterThanOrEqual(secondaryAction!.x + secondaryAction!.width);
  });

  test('el formulario falla en cerrado y no finge un envío', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#lead-form input[name="name"]').fill('Ada Lovelace');
    await page.locator('#lead-form input[name="restaurant"]').fill('Mesa de prueba');
    await page.locator('#lead-form input[name="email"]').fill('ada@example.test');
    await page.locator('#lead-form textarea[name="message"]').fill('Quiero validar el inventario único.');
    await page.locator('#lead-form input[name="privacyAccepted"]').check();
    const responsePromise = page.waitForResponse((response) => response.url().endsWith('/api/leads'));
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(503);
    expect(response.headers()).toMatchObject({
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
    });
    expect(response.request().postDataJSON()).toMatchObject({
      name: 'Ada Lovelace',
      restaurant: 'Mesa de prueba',
      email: 'ada@example.test',
      level: 'gestion',
      accept: true,
      website: '',
      lang: 'es',
    });
    await expect(page.locator('#lead-form [data-lead-status]')).toContainText('No se ha enviado ni guardado ningún dato');
  });

  test('el consentimiento no activa analítica y se recuerda localmente', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const banner = page.locator('[data-cookie-banner]');
    await expect(banner).toBeVisible();
    await page.getByRole('button', { name: 'Solo necesarias' }).click();
    await expect(banner).toBeHidden();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(banner).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('logic-reserva-consent-v1'))).toBe('necessary');
  });
});

test.describe('accesibilidad común de las demostraciones', () => {
  const routes = [
    '/demos/brasca/', '/demos/vedra/', '/demos/vedra/gestion/', '/demos/vedra/gestion/?vista=espera', '/demos/solane/', '/demos/solane/eventos/', '/demos/solane/bonos/', '/demos/solane/gestion/', '/demos/solane/gestion/?vista=espera', '/demos/solane/gestion/?vista=bonos',
    '/en/demos/brasca/', '/en/demos/vedra/', '/en/demos/vedra/gestion/', '/en/demos/vedra/gestion/?vista=espera', '/en/demos/solane/', '/en/demos/solane/eventos/', '/en/demos/solane/bonos/', '/en/demos/solane/gestion/', '/en/demos/solane/gestion/?vista=espera', '/en/demos/solane/gestion/?vista=bonos',
  ] as const;

  test('el teclado puede saltar la cabecera en todas las rutas es/en', async ({ page }) => {
    for (const path of routes) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.keyboard.press('Tab');
      const label = path.startsWith('/en/') ? 'Skip to main content' : 'Saltar al contenido principal';
      const skipLink = page.getByRole('link', { name: label });
      await expect(skipLink).toBeFocused();
      await skipLink.press('Enter');
      await expect(page.locator('#contenido')).toBeFocused();
    }
  });

  test('las etiquetas de Vedra y los acentos de Solane conservan contraste AA', async ({ page }) => {
    const targets = [
      { path: '/demos/vedra/', selector: '.vw-demo-label' },
      { path: '/demos/solane/', selector: '.solane-lockup span' },
      { path: '/demos/solane/', selector: '.solane-menu-grid article:first-child > span' },
      { path: '/demos/solane/', selector: '.sw-gateway > div > p:first-child' },
      { path: '/demos/solane/eventos/', selector: '.events-lockup span' },
      { path: '/demos/solane/eventos/', selector: '.et-card[data-event-status="draft"] > header p' },
    ];
    for (const { path, selector } of targets) {
      await page.goto(path, { waitUntil: 'networkidle' });
      expect(await textContrastRatio(page.locator(selector).first()), `${path} ${selector}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('los objetivos táctiles de todas las demos conservan un área mínima de 44 px', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1366, height: 900 });
    for (const path of routes) {
      await page.goto(path, { waitUntil: 'networkidle' });
      expect(await undersizedTargets(page), path).toEqual([]);
    }
  });
});

test.describe('demo Brasca · plan Básico', () => {
  test('los tres heroes v2 de OpenAI sirven AVIF responsive y respetan movimiento reducido', async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const slug of ['brasca', 'vedra', 'solane']) {
      await page.goto(`/demos/${slug}/`, { waitUntil: 'networkidle' });
      const source = page.locator('.brand-hero picture source[type="image/avif"]');
      await expect(source).toHaveCount(1);
      await expect(source).toHaveAttribute(
        'srcset',
        `/images/heroes/${slug}-v2-640.avif 640w, /images/heroes/${slug}-v2-960.avif 960w, /images/heroes/${slug}-v2-1600.avif 1600w`,
      );
      const image = page.locator('.brand-hero img');
      await expect(image).toHaveAttribute('src', `/images/heroes/${slug}-v2-960.avif`);
      await expect(image).toHaveAttribute('loading', 'eager');

      for (const width of [640, 960, 1600]) {
        const response = await request.get(`/images/heroes/${slug}-v2-${width}.avif`);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('image/avif');
        expect((await response.body()).byteLength).toBeGreaterThan(10_000);
      }
    }
  });

  test('los pasos inactivos del widget mantienen contraste AA en Vedra y Solane', async ({ page }) => {
    for (const slug of ['vedra', 'solane']) {
      await page.goto(`/demos/${slug}/`, { waitUntil: 'networkidle' });
      const step = page.locator('.vw-steps li').last();
      await expect(step).toBeVisible();
      const ratio = await textContrastRatio(step);
      expect(ratio, slug).toBeGreaterThanOrEqual(4.5);
    }
  });

  const brascaPages = ['/demos/brasca/', '/en/demos/brasca/'] as const;

  test('las dos rutas sirven carta de fixture y noindex triple', async ({ page, request }) => {
    for (const path of brascaPages) {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      await expect(page.locator('.menu-item')).toHaveCount(6);
    }

    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /demos/');
    expect(robots).toContain('Disallow: /en/demos/');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain('/demos/brasca/');
  });

  for (const width of [320, 375, 430, 1366]) {
    test(`Brasca es/en sin overflow ni consola a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      for (const path of brascaPages) {
        const response = await page.goto(path, { waitUntil: 'networkidle' });
        expect(response?.status()).toBe(200);
        expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${path} at ${width}px`).toBe(false);
      }
      expect(errors).toEqual([]);
    });
  }

  test('la solicitud explica el email y no envía ni persiste datos', async ({ page }) => {
    const outgoing: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') outgoing.push(`${request.method()} ${request.url()}`);
    });
    await page.goto('/demos/brasca/', { waitUntil: 'networkidle' });
    const storageBefore = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    await page.locator('#brasca-request input[name="name"]').fill('Marina Sala');
    await page.locator('#brasca-request input[name="email"]').fill('marina@example.test');
    await page.locator('#brasca-request select[name="partySize"]').selectOption('4');
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(page.locator('[data-request-status]')).toContainText('Tu solicitud llegaría por email al restaurante — sin gestor en este nivel');
    await expect(page.locator('[data-request-status]')).toContainText('no se ha enviado ni guardado ningún dato');
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(storageBefore);
    expect(outgoing).toEqual([]);
  });
});

test.describe('demo Vedra · nivel Gestión', () => {
  const vedraPages = [
    '/demos/vedra/',
    '/en/demos/vedra/',
    '/demos/vedra/gestion/',
    '/en/demos/vedra/gestion/',
  ] as const;

  test('web y gestor bilingües responden aislados de SEO', async ({ page, request }) => {
    for (const path of vedraPages) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow');
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    }

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain('/demos/vedra/');
  });

  for (const width of [320, 375, 430, 1366]) {
    test(`Vedra web y gestor sin overflow ni consola a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));

      for (const path of [
        '/demos/vedra/',
        '/demos/vedra/gestion/?vista=servicio',
        '/demos/vedra/gestion/?vista=plano',
        '/demos/vedra/gestion/?vista=espera',
        '/demos/vedra/gestion/?vista=clientes',
        '/demos/vedra/gestion/?vista=informes',
        '/demos/vedra/gestion/?vista=ajustes',
      ]) {
        const response = await page.goto(path, { waitUntil: 'networkidle' });
        expect(response?.status(), path).toBe(200);
        expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${path} at ${width}px`).toBe(false);
      }
      expect(errors).toEqual([]);
    });
  }

  test('el gestor móvil prioriza Sala y permite actuar sin la cronología horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/demos/vedra/gestion/?vista=servicio', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('logic-reserva-demo-vedra-v1'));
    await page.reload({ waitUntil: 'networkidle' });

    const mobileNav = page.locator('[data-mobile-dashboard-nav]');
    await expect(mobileNav).toBeVisible();
    await expect(page.locator('[data-service-timeline]')).toBeHidden();
    const serviceBooking = page.locator('[data-mobile-service-booking="vedra-fixture-1"]');
    await expect(serviceBooking).toContainText('Clara Montes');
    await serviceBooking.locator('[data-mobile-service-action="seated"]').click();
    await expect(serviceBooking).toContainText('Sentada');

    await mobileNav.getByRole('button', { name: 'Espera', exact: true }).click();
    await expect(page).toHaveURL(/vista=espera/);
    await expect(page.locator('[data-dashboard-view="espera"]')).toBeVisible();
    await mobileNav.locator('summary').click();
    const settings = mobileNav.getByRole('button', { name: 'Ajustes', exact: true });
    await expect(settings).toBeVisible();
    await settings.click();
    await expect(page).toHaveURL(/vista=ajustes/);

    await mobileNav.locator('summary').click();
    const targetSizes = await mobileNav.locator('button:visible, summary:visible').evaluateAll((targets) => targets.map((target) => {
      const box = target.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));
    for (const target of targetSizes) {
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  });

  test('reserva en la web, aparece en el gestor, transiciona y se restablece', async ({ page }) => {
    const networkWrites: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') networkWrites.push(`${request.method()} ${request.url()}`);
    });
    await page.goto('/demos/vedra/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('logic-reserva-demo-vedra-v1'));
    await page.reload({ waitUntil: 'networkidle' });

    await page.locator('select[name="partySize"]').selectOption('3');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.locator('.vw-times button').first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.locator('input[name="menuId"][value="vedra-mediodia"]').check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.locator('input[name="name"]').fill('Marina Widget');
    await page.locator('input[name="email"]').fill('marina.widget@example.test');
    await page.locator('input[name="phone"]').fill('+34 600 123 456');
    await page.getByRole('button', { name: 'Confirmar reserva demo' }).click();

    await expect(page.locator('[data-booking-success]')).toContainText('Mesa confirmada en esta demo.');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('logic-reserva-demo-vedra-v1') ?? '{}') as { version?: number; bookings?: { guest?: { name?: string }; source?: string; menuId?: string; bookedAt?: string }[] });
    expect(stored.version).toBe(1);
    expect(stored.bookings).toEqual(expect.arrayContaining([
      expect.objectContaining({ guest: expect.objectContaining({ name: 'Marina Widget' }), source: 'widget', menuId: 'vedra-mediodia', bookedAt: expect.any(String) }),
    ]));

    await page.getByRole('link', { name: 'Abrir la reserva en el gestor' }).click();
    await expect(page).toHaveURL(/\/demos\/vedra\/gestion\/\?vista=servicio/);
    await expect(page.locator('[data-service-timeline]')).toContainText('Marina Widget');
    await expect(page.locator('[data-service-timeline]')).toContainText('Desde la web demo');

    await page.getByRole('button', { name: 'Reservas', exact: true }).click();
    await expect(page).toHaveURL(/vista=reservas/);
    const booking = page.locator('.rd-booking').filter({ hasText: 'Marina Widget' });
    await expect(booking).toContainText('Desde la web demo');
    await expect(booking.locator('[data-booking-status]')).toHaveText('Confirmada');
    await booking.locator('[data-booking-action="seated"]').click();
    await expect(booking.locator('[data-booking-status]')).toHaveText('Sentada');

    await page.reload({ waitUntil: 'networkidle' });
    const persisted = page.locator('.rd-booking').filter({ hasText: 'Marina Widget' });
    await expect(persisted.locator('[data-booking-status]')).toHaveText('Sentada');

    await page.getByRole('button', { name: 'Restablecer demo' }).last().click();
    await expect(page.locator('.rd-booking').filter({ hasText: 'Marina Widget' })).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Demo restablecida con los datos iniciales.');
    expect(networkWrites).toEqual([]);
  });

  test('lista de espera: alta, aviso y asiento crean un walk-in sin red', async ({ page }) => {
    const networkWrites: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') networkWrites.push(`${request.method()} ${request.url()}`);
    });
    await page.goto('/demos/vedra/gestion/?vista=espera', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('logic-reserva-demo-vedra-v1'));
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.getByRole('button', { name: 'Añadir a espera' })).toHaveAttribute('data-slot', 'button');
    await expect(page.locator('[data-dashboard-view="espera"] [data-slot="badge"]').first()).toContainText('Aviso local');

    await page.getByLabel('Nombre', { exact: true }).fill('Clara Sin Reserva');
    await page.getByLabel('Teléfono (opcional)').fill('+34 600 222 333');
    await page.getByRole('button', { name: 'Añadir a espera' }).click();
    const entry = page.locator('[data-waitlist-entry]').filter({ hasText: 'Clara Sin Reserva' });
    await expect(entry).toHaveAttribute('data-waitlist-status', 'waiting');
    await expect(entry).toContainText('Mesa disponible');
    await entry.locator('[data-waitlist-action="notified"]').click();
    await expect(entry).toHaveAttribute('data-waitlist-status', 'notified');

    await page.reload({ waitUntil: 'networkidle' });
    const persisted = page.locator('[data-waitlist-entry]').filter({ hasText: 'Clara Sin Reserva' });
    await expect(persisted).toHaveAttribute('data-waitlist-status', 'notified');
    await persisted.locator('[data-waitlist-action="seated"]').click();
    await expect(page.locator('[data-waitlist-history="seated"]')).toContainText('Clara Sin Reserva');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('logic-reserva-demo-vedra-v1') ?? '{}') as { waitlist?: { status?: string; seatedBookingId?: string }[]; bookings?: { guest?: { name?: string }; source?: string; status?: string }[] });
    expect(stored.waitlist).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'seated', seatedBookingId: expect.stringContaining('walkin-') })]));
    expect(stored.bookings).toEqual(expect.arrayContaining([expect.objectContaining({ guest: expect.objectContaining({ name: 'Clara Sin Reserva' }), source: 'walkin', status: 'seated' })]));

    await page.getByRole('button', { name: 'Reservas', exact: true }).click();
    const booking = page.locator('.rd-booking').filter({ hasText: 'Clara Sin Reserva' });
    await expect(booking).toContainText('Sin reserva');
    await expect(booking.locator('[data-booking-status]')).toHaveText('Sentada');
    expect(networkWrites).toEqual([]);
  });

  test('recorrido guiado: grupo de 8 combina VS4+VS5, asigna menú y confirma', async ({ page }) => {
    await page.goto('/demos/vedra/gestion/?vista=plano', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-table-id="vs1"]')).toHaveAccessibleName(/Mesa 1 · .* · 1–4 plazas/);
    await page.evaluate(() => localStorage.removeItem('logic-reserva-demo-vedra-v1'));
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.locator('[data-group-tour]')).toContainText('Familia Ortega');
    await expect(page.locator('[data-table-combination]')).toHaveCount(0);
    await page.locator('[data-tour-mode="guided"]').click();
    await expect(page.locator('[data-tour-step="1"]')).toBeVisible();
    await page.getByRole('button', { name: 'Proponer combinaciones' }).click();
    await expect(page.locator('[data-tour-step="2"]')).toBeVisible();
    expect(await page.locator('[data-table-combination]').count()).toBeGreaterThan(1);

    await page.locator('[data-table-combination="vs4+vs5"]').click();
    await expect(page.locator('[data-tour-step="3"]')).toBeVisible();
    await expect(page.locator('[data-table-id="vs4"]')).toHaveAttribute('data-state', 'selected');
    await expect(page.locator('[data-table-id="vs5"]')).toHaveAttribute('data-state', 'selected');
    await page.locator('.rd-menu-select select').selectOption('vedra-grupos');
    await page.locator('[data-confirm-group]').click();

    await expect(page.locator('[data-tour-complete]')).toContainText('Grupo confirmado y mesas bloqueadas.');
    await expect(page.locator('[data-table-id="vs4"]')).toHaveAttribute('data-state', 'group');
    await expect(page.locator('[data-table-id="vs5"]')).toHaveAttribute('data-state', 'group');
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('logic-reserva-demo-vedra-v1') ?? '{}') as { group?: { status?: string; tableIds?: string[]; menuId?: string }; bookings?: { id?: string; partySize?: number; tableIds?: string[] }[] });
    expect(state.group).toMatchObject({ status: 'confirmed', tableIds: ['vs4', 'vs5'], menuId: 'vedra-grupos' });
    expect(state.bookings).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'vedra-group-booking-8', partySize: 8, tableIds: ['vs4', 'vs5'] })]));

    await page.getByRole('button', { name: 'Ver en Servicio' }).click();
    await expect(page).toHaveURL(/vista=servicio/);
    await expect(page.locator('[data-service-timeline]')).toContainText('Familia Ortega');
    await page.getByRole('button', { name: 'Reservas', exact: true }).click();
    const groupBooking = page.locator('.rd-booking').filter({ hasText: 'Familia Ortega' });
    await expect(groupBooking).toContainText('Mesa 4 + Mesa 5');
    await expect(groupBooking).toContainText('Menú grupos');

    await page.getByRole('button', { name: 'Clientes', exact: true }).click();
    await expect(page.locator('.rd-customer-card').filter({ hasText: 'Familia Ortega' })).toBeVisible();
    await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
    await expect(page.locator('[data-dashboard-view="ajustes"]')).toContainText('Lectura · Demo funcional');

    await page.goto('/demos/vedra/gestion/?vista=plano', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-tour-complete]')).toBeVisible();
    await page.getByRole('button', { name: 'Reiniciar recorrido' }).click();
    await expect(page.locator('[data-tour-mode="guided"]')).toBeVisible();
    await page.locator('[data-tour-mode="free"]').click();
    await expect(page.locator('[data-tour-step="1"]')).toBeVisible();
    expect(await page.locator('[data-table-combination]').count()).toBeGreaterThan(1);
  });
});

test.describe('demo Solane · nivel Inteligente', () => {
  const solanePages = [
    '/demos/solane/',
    '/demos/solane/eventos/',
    '/demos/solane/bonos/',
    '/demos/solane/confirmacion/',
    '/demos/solane/gestion/',
    '/en/demos/solane/',
    '/en/demos/solane/eventos/',
    '/en/demos/solane/bonos/',
    '/en/demos/solane/confirmacion/',
    '/en/demos/solane/gestion/',
  ] as const;

  test('web, agenda y gestor bilingües responden aislados de SEO', async ({ page, request }) => {
    for (const path of solanePages) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow');
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    }

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain('/demos/solane/');
  });

  for (const width of [320, 375, 430, 1366]) {
    test(`Solane web, agenda y gestor sin overflow ni consola a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));

      for (const path of [
        '/demos/solane/',
        '/demos/solane/eventos/',
        '/demos/solane/bonos/',
        '/demos/solane/confirmacion/',
        '/demos/solane/gestion/?vista=servicio',
        '/demos/solane/gestion/?vista=plano',
        '/demos/solane/gestion/?vista=reservas',
        '/demos/solane/gestion/?vista=espera',
        '/demos/solane/gestion/?vista=eventos',
        '/demos/solane/gestion/?vista=bonos',
        '/demos/solane/gestion/?vista=privatizaciones',
        '/demos/solane/gestion/?vista=clientes',
        '/demos/solane/gestion/?vista=informes',
      ]) {
        const response = await page.goto(path, { waitUntil: 'networkidle' });
        expect(response?.status(), path).toBe(200);
        expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${path} at ${width}px`).toBe(false);
      }
      expect(errors).toEqual([]);
    });
  }

  test('la navegación móvil de Solane conserva rol, vistas avanzadas e inglés', async ({ page }) => {
    const networkWrites: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') networkWrites.push(`${request.method()} ${request.url()}`);
    });
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto('/en/demos/solane/gestion/?vista=servicio', { waitUntil: 'networkidle' });

    const mobileNav = page.locator('[data-mobile-dashboard-nav]');
    await expect(mobileNav).toBeVisible();
    await expect(page.locator('[data-role-selector]')).toBeVisible();
    await page.locator('[data-role-selector]').selectOption('floor');
    await mobileNav.getByRole('button', { name: 'Bookings', exact: true }).click();
    await expect(page).toHaveURL(/vista=reservas/);
    await mobileNav.getByRole('button', { name: 'Waitlist', exact: true }).click();
    await expect(page.locator('[data-dashboard-view="espera"]')).toBeVisible();

    await mobileNav.getByText('More', { exact: true }).click();
    const events = mobileNav.getByRole('button', { name: 'Events', exact: true });
    await expect(events).toBeVisible();
    await events.click();
    await expect(page).toHaveURL(/vista=eventos/);
    await expect(page.locator('[data-role-selector]')).toHaveValue('floor');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(networkWrites).toEqual([]);
  });

  test('regla ficticia informada: no-show aplica como máximo el depósito demo y sentar lo libera', async ({ page }) => {
    const storageKey = 'logic-reserva-demo-solane-v1';
    await page.setViewportSize({ width: 375, height: 900 });

    const bookWithDeposit = async (guestName: string) => {
      await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
      await page.locator('select[name="partySize"]').selectOption('2');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.locator('[data-time="21:00"]').click();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.locator('input[name="menuId"][value="solane-degustacion"]').check();
      const breakdown = page.locator('[data-deposit-breakdown]');
      await expect(breakdown).toHaveAttribute('data-risk-tier', 'high');
      await expect(breakdown).toContainText('Viernes noche');
      await expect(breakdown.locator('[data-deposit-amount]')).toContainText('125,00');
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.locator('input[name="name"]').fill(guestName);
      await page.locator('input[name="email"]').fill(`${guestName.toLowerCase().replaceAll(' ', '.')}@example.test`);

      await page.getByRole('button', { name: 'Confirmar experiencia demo' }).click();
      await expect(page.getByRole('status')).toContainText('Acepta las condiciones informadas');
      await expect(page.locator('[data-deposit-gateway]')).not.toBeVisible();

      await page.locator('input[name="depositTerms"]').check();
      await expect(page.locator('[data-terms-accepted-at]')).toBeVisible();
      await page.getByRole('button', { name: 'Confirmar experiencia demo' }).click();
      const gateway = page.locator('[data-deposit-gateway]');
      await expect(gateway).toBeVisible();
      await expect(gateway).toContainText('Pasarela neutra · demo — no se realizará ningún cobro');
      await expect(gateway).toContainText('Menú Solane');
      await expect(gateway).toContainText('Regla ficticia aplicada');
      await expect(gateway).toContainText('50% · 2');
      await expect(gateway).toContainText('125,00');
      await expect(gateway).toContainText('Condiciones aceptadas antes de continuar');
      await expect(gateway.locator('input')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
      await gateway.locator('[data-confirm-deposit]').click();
      await expect(page.locator('[data-solane-booking-success]')).toContainText('Depósito retenido solo en esta demo');

      const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as { bookings?: { guest?: { name?: string }; bookedAt?: string; deposit?: { termsAcceptedAt?: string; status?: string; breakdown?: { percentageBps?: number; amountCents?: number } } }[] }, storageKey);
      expect(stored.bookings).toEqual(expect.arrayContaining([expect.objectContaining({
        guest: expect.objectContaining({ name: guestName }),
        bookedAt: expect.any(String),
        deposit: expect.objectContaining({ status: 'held', termsAcceptedAt: expect.any(String), breakdown: expect.objectContaining({ percentageBps: 5000, amountCents: 12500 }) }),
      })]));
    };

    await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
    await page.evaluate((key) => localStorage.removeItem(key), storageKey);
    await bookWithDeposit('Nora Depósito');
    await page.getByRole('link', { name: 'Abrir en el gestor' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    const noShowBooking = page.locator('[data-booking-id]').filter({ hasText: 'Nora Depósito' });
    await expect(noShowBooking.locator('[data-deposit-record]')).toHaveAttribute('data-deposit-status', 'held');
    await noShowBooking.locator('[data-deposit-action="no_show"]').click();
    await expect(noShowBooking.locator('[data-booking-status]')).toHaveText('No presentado');
    await expect(noShowBooking.locator('[data-deposit-record]')).toHaveAttribute('data-deposit-status', 'charged');
    await expect(noShowBooking.locator('[data-deposit-resolution-amount]')).toContainText('125,00');
    await expect(page.getByRole('status')).toContainText('depósito ficticio mostrado pasa a aplicado en el estado local');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('[data-booking-id]').filter({ hasText: 'Nora Depósito' }).locator('[data-deposit-record]')).toHaveAttribute('data-deposit-status', 'charged');

    await page.getByRole('button', { name: 'Restablecer demo' }).last().click();
    await bookWithDeposit('Leo Liberación');
    await page.getByRole('link', { name: 'Abrir en el gestor' }).click();
    const seatedBooking = page.locator('[data-booking-id]').filter({ hasText: 'Leo Liberación' });
    await seatedBooking.locator('[data-deposit-action="seated"]').click();
    await expect(seatedBooking.locator('[data-booking-status]')).toHaveText('Sentada');
    await expect(seatedBooking.locator('[data-deposit-record]')).toHaveAttribute('data-deposit-status', 'released');
    await expect(seatedBooking).toContainText('Depósito liberado automáticamente');
    await expect(page.getByRole('status')).toContainText('Depósito liberado automáticamente');
  });

  test('bono demo: emisión local, permisos y canje único persisten sin red', async ({ page }) => {
    const storageKey = 'logic-reserva-demo-solane-v1';
    const networkWrites: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') networkWrites.push(`${request.method()} ${request.url()}`);
    });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/demos/solane/bonos/', { waitUntil: 'networkidle' });
    await page.evaluate((key) => localStorage.removeItem(key), storageKey);
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Regala la experiencia');
    await expect(page.locator('[data-voucher-form] input[type="email"], [data-voucher-form] input[type="password"]')).toHaveCount(0);
    await page.locator('[data-voucher-form] select').selectOption('2');
    await page.getByPlaceholder('Nombre de demostración').fill('Ada Regalo');
    await expect(page.locator('[data-voucher-total]')).not.toHaveText('0,00 €');
    await page.getByRole('button', { name: 'Preparar bono demo' }).click();

    const dialog = page.locator('.gv-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('no se realizará ningún cobro');
    await expect(dialog.locator('input')).toHaveCount(0);
    await dialog.locator('[data-issue-voucher]').click();
    const success = page.locator('[data-voucher-success]');
    await expect(success).toContainText('Bono emitido en esta demo');
    const code = await success.locator('[data-voucher-code]').innerText();
    expect(code).toMatch(/^SOLANE-[A-Z0-9]+$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

    const storedIssued = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as { vouchers?: { code?: string; status?: string; value?: { totalValueCents?: number } }[] }, storageKey);
    expect(storedIssued.vouchers).toEqual(expect.arrayContaining([expect.objectContaining({ code, status: 'issued', value: expect.objectContaining({ totalValueCents: expect.any(Number) }) })]));

    await success.getByRole('link', { name: 'Abrir bonos en el gestor' }).click();
    await expect(page).toHaveURL(/vista=bonos/);
    const managerVoucher = page.locator('[data-manager-voucher-id]').filter({ hasText: code });
    await expect(managerVoucher).toHaveAttribute('data-voucher-status', 'issued');
    await expect(managerVoucher.locator('[data-manager-voucher-code]')).toHaveText(code);

    await page.locator('[data-role-selector]').selectOption('kitchen');
    await expect(managerVoucher.locator('[data-redeem-voucher]')).toBeDisabled();
    await expect(page.locator('[data-dashboard-view="bonos"] [data-role-warning]')).toContainText('Cocina puede consultar');
    await page.locator('[data-role-selector]').selectOption('floor');
    await expect(managerVoucher.locator('[data-redeem-voucher]')).toBeEnabled();
    await managerVoucher.locator('[data-redeem-voucher]').click();
    await expect(managerVoucher).toHaveAttribute('data-voucher-status', 'redeemed');
    await expect(managerVoucher.locator('[data-redeem-voucher]')).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('no puede utilizarse de nuevo');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('[data-manager-voucher-id]').filter({ hasText: code })).toHaveAttribute('data-voucher-status', 'redeemed');
    expect(networkWrites).toEqual([]);
  });

  test('privatización guiada: propuesta, señal y bloqueo retiran el Privado del widget', async ({ page }) => {
    const storageKey = 'logic-reserva-demo-solane-v1';
    await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
    await page.evaluate((key) => localStorage.removeItem(key), storageKey);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Continuar' }).click();
    const timeBefore = page.locator('[data-time="21:00"]');
    await expect(timeBefore).toHaveAttribute('data-available-tables', /sp1/);
    await expect(timeBefore).toHaveAttribute('data-available-tables', /sp4/);

    await page.goto('/demos/solane/gestion/?vista=privatizaciones', { waitUntil: 'networkidle' });
    await page.locator('[data-private-tour-mode="guided"]').click();
    const hire = page.locator('[data-private-hire-id="solane-hire-1"]');
    await expect(hire).toHaveAttribute('data-private-hire-status', 'requested');
    await page.locator('[data-prepare-private-hire]').click();
    await expect(hire).toHaveAttribute('data-private-hire-status', 'proposed');
    await expect(page.locator('[data-private-offer]')).toContainText('500,00');
    await page.locator('[data-register-private-deposit]').click();
    await expect(hire).toHaveAttribute('data-private-hire-status', 'deposit_paid');
    await page.locator('[data-block-private-hire]').click();
    await expect(hire).toHaveAttribute('data-private-hire-status', 'blocked');
    await expect(page.locator('[data-private-tour-complete]')).toContainText('Privado confirmado y fuera del widget');

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as { privateHires?: { status?: string; proposal?: { menuId?: string; depositCents?: number } }[]; privateHireTour?: { completed?: boolean } }, storageKey);
    expect(stored.privateHires).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'blocked', proposal: expect.objectContaining({ menuId: 'solane-degustacion', depositCents: 50000 }) })]));
    expect(stored.privateHireTour?.completed).toBe(true);

    await page.getByRole('button', { name: 'Ver bloqueo en el plano' }).click();
    for (const tableId of ['sp1', 'sp2', 'sp3', 'sp4']) await expect(page.locator(`[data-table-id="${tableId}"]`)).toHaveAttribute('data-state', 'private');

    await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Continuar' }).click();
    const timeAfter = page.locator('[data-time="21:00"]');
    await expect(timeAfter).not.toHaveAttribute('data-available-tables', /sp1/);
    await expect(timeAfter).not.toHaveAttribute('data-available-tables', /sp4/);
  });

  test('Cocina puede consultar pero no sentar, cobrar ni gestionar módulos', async ({ page }) => {
    await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('logic-reserva-demo-solane-v1'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.locator('[data-time="21:00"]').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.locator('input[name="menuId"][value="solane-degustacion"]').check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.locator('input[name="name"]').fill('Equipo Cocina');
    await page.locator('input[name="email"]').fill('cocina@example.test');
    await page.locator('input[name="depositTerms"]').check();
    await page.getByRole('button', { name: 'Confirmar experiencia demo' }).click();
    await page.locator('[data-confirm-deposit]').click();
    await page.getByRole('link', { name: 'Abrir en el gestor' }).click();

    const roleSelector = page.locator('[data-role-selector]');
    await expect(roleSelector).toBeEnabled();
    await roleSelector.selectOption('kitchen');
    const booking = page.locator('[data-booking-id]').filter({ hasText: 'Equipo Cocina' });
    await expect(booking.locator('[data-deposit-action="no_show"]')).toBeDisabled();
    await expect(booking.locator('[data-deposit-action="seated"]')).toBeDisabled();
    await expect(booking.locator('[data-role-warning]')).toContainText('Cocina está en modo lectura');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('[data-role-selector]')).toHaveValue('kitchen');

    await page.getByRole('button', { name: 'Eventos', exact: true }).click();
    await expect(page.locator('[data-create-event]')).toBeDisabled();
    await expect(page.locator('[data-event-form] [data-role-warning]')).toBeVisible();
    await page.getByRole('button', { name: 'Privatizaciones', exact: true }).click();
    await page.locator('[data-private-tour-mode="guided"]').click();
    await expect(page.locator('[data-prepare-private-hire]')).toBeDisabled();
    await expect(page.locator('[data-private-proposal] [data-role-warning]')).toBeVisible();
    await page.getByRole('button', { name: 'Espera', exact: true }).click();
    await expect(page.locator('[data-dashboard-view="espera"] .rd-role-warning')).toContainText('consultar la cola');
    await expect(page.getByRole('button', { name: 'Añadir a espera' })).toBeDisabled();
  });

  test('la espera no ofrece asiento cuando el grupo no cabe', async ({ page }) => {
    await page.goto('/demos/solane/gestion/?vista=espera', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('logic-reserva-demo-solane-v1'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByLabel('Nombre').fill('Grupo imposible');
    await page.getByLabel('Personas').fill('40');
    await page.getByRole('button', { name: 'Añadir a espera' }).click();
    const entry = page.locator('[data-waitlist-entry]').filter({ hasText: 'Grupo imposible' });
    await expect(entry).toContainText('Sin mesa disponible');
    await expect(entry.locator('[data-waitlist-action="seated"]')).toBeDisabled();
    await expect(entry.locator('[data-waitlist-action="cancelled"]')).toBeEnabled();
  });

  test('CRM exporta la muestra real y los informes etiquetan sus estimaciones', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/demos/solane/gestion/?vista=clientes', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('logic-reserva-demo-solane-v1'));
    await page.reload({ waitUntil: 'networkidle' });

    const lucia = page.locator('[data-customer-key="lucia@example.test"]');
    await expect(lucia).toContainText('Lucía Serra');
    await expect(lucia.locator('[data-customer-history] li')).toHaveCount(3);
    await expect(lucia).toContainText('595,00');
    await expect(lucia.locator('[data-customer-allergies]')).toContainText('Avellana');
    await expect(lucia.locator('[data-customer-notes]')).toContainText('Prefiere mesa tranquila');

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-export-customers]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^solane-clientes-demo-\d{4}-\d{2}-\d{2}\.csv$/);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const csv = await readFile(downloadPath!, 'utf8');
    expect(csv).toContain('"name","email","phone"');
    expect(csv).toContain('"Lucía Serra","lucia@example.test"');
    expect(csv).toContain('"Avellana"');
    expect(csv).toContain('"595.00"');

    await page.locator('[data-mobile-dashboard-nav] summary').click();
    await page.locator('[data-mobile-dashboard-nav]').getByRole('button', { name: 'Informes', exact: true }).click();
    await expect(page).toHaveURL(/vista=informes/);
    await expect(page.locator('[data-report-occupancy]')).toContainText('Ocupación por servicio');
    await expect(page.locator('[data-report-sources]')).toContainText('Web directa');
    await expect(page.locator('[data-report-no-shows]')).toContainText('Exposición estimada a no-show');
    await expect(page.locator('[data-report-no-shows]')).toContainText('no son no-shows observados ni evitados');
    await expect(page.locator('[data-report-marketplace]')).toContainText('Coste comparativo hipotético');
    await expect(page.locator('[data-report-marketplace] [data-estimate-label]')).toHaveText('Supuesto editable: 3,00 €/cubierto; no es una tarifa atribuida ni un periodo mensual real.');
    await expect(page.locator('[data-ai-decision-support]')).toContainText('IA demostrativa · cálculo local, sin modelo conectado');
    await expect(page.locator('[data-ai-decision-support] [data-decision]')).toHaveCount(3);
    await expect(page.locator('[data-automation-center]')).toContainText('Evento publicado → mesas fuera del widget');
    const reportDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-export-report]').click();
    const reportDownload = await reportDownloadPromise;
    expect(reportDownload.suggestedFilename()).toBe('solane-informe-demo.csv');
    const reportPath = await reportDownload.path();
    expect(reportPath).not.toBeNull();
    const reportCsv = await readFile(reportPath!, 'utf8');
    expect(reportCsv).toContain('"section","metric","value","detail"');
    expect(reportCsv).toContain('"scenario","hypothetical_marketplace_monthly_eur"');
    expect(reportCsv).toContain('Same fictional sample multiplied by 12');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

    await page.goto('/demos/vedra/gestion/?vista=informes', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-report-mode="management"]')).toContainText('Ocupación por servicio');
    await expect(page.locator('[data-report-mode="management"] [data-report-marketplace]')).toHaveCount(0);
    await expect(page.locator('[data-report-mode="management"] [data-ai-decision-support]')).toHaveCount(0);
    await expect(page.locator('[data-report-mode="management"] [data-automation-center]')).toHaveCount(0);
  });

  test('riesgo de no-show: orden explicable, bilingüe y consultivo sin tocar depósitos', async ({ page }) => {
    const networkWrites: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') networkWrites.push(`${request.method()} ${request.url()}`);
    });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/demos/solane/gestion/?vista=informes', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('logic-reserva-demo-solane-v1'));
    await page.reload({ waitUntil: 'networkidle' });

    const board = page.locator('[data-no-show-risk-board]');
    await expect(board).toHaveAttribute('data-risk-basis', 'deterministic-demo');
    await expect(board).toContainText('no es una probabilidad');
    const marc = board.locator('[data-risk-booking="sol-r2"]');
    const lucia = board.locator('[data-risk-booking="sol-r1"]');
    await expect(marc).toHaveAttribute('data-risk-tier', 'high');
    await expect(marc.locator('[data-risk-score]')).toHaveText('80/100');
    await expect(marc.locator('[data-risk-signal="channel_phone"]')).toContainText('+10');
    await expect(marc.locator('[data-risk-signal="history_first_visit"]')).toContainText('+15');
    await expect(marc.locator('[data-risk-signal="lead_short"]')).toContainText('+10');
    await expect(marc.locator('[data-risk-action="manual_review"]')).toHaveText('Revisión manual prioritaria');
    await expect(lucia).toHaveAttribute('data-risk-tier', 'low');
    await expect(lucia.locator('[data-risk-score]')).toHaveText('30/100');
    await expect(lucia.locator('[data-risk-signal="history_repeat_attendance"]')).toContainText('-25');
    await expect(board.locator('[data-prepare-attendance]')).toHaveCount(2);

    const depositsBefore = await page.evaluate(() => JSON.stringify((JSON.parse(localStorage.getItem('logic-reserva-demo-solane-v1') ?? '{}') as { bookings?: { deposit?: unknown }[] }).bookings?.map((booking) => booking.deposit) ?? []));
    await page.locator('[data-role-selector]').selectOption('kitchen');
    await expect(board).toBeVisible();
    const depositsAfter = await page.evaluate(() => JSON.stringify((JSON.parse(localStorage.getItem('logic-reserva-demo-solane-v1') ?? '{}') as { bookings?: { deposit?: unknown }[] }).bookings?.map((booking) => booking.deposit) ?? []));
    expect(depositsAfter).toBe(depositsBefore);

    await page.goto('/en/demos/solane/gestion/?vista=informes', { waitUntil: 'networkidle' });
    const englishBoard = page.locator('[data-no-show-risk-board]');
    await expect(englishBoard).toContainText('is not a probability');
    await expect(englishBoard.locator('[data-risk-booking="sol-r2"] [data-risk-action="manual_review"]')).toHaveText('Priority manual review');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(networkWrites).toEqual([]);
  });

  test('confirmación local: permisos, respuesta, persistencia y reutilización segura es/en', async ({ page }) => {
    const storageKey = 'logic-reserva-demo-solane-v1';
    const networkWrites: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') networkWrites.push(`${request.method()} ${request.url()}`);
    });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/demos/solane/gestion/?vista=informes', { waitUntil: 'networkidle' });
    await page.evaluate((key) => localStorage.removeItem(key), storageKey);
    await page.reload({ waitUntil: 'networkidle' });

    const marc = page.locator('[data-risk-booking="sol-r2"]');
    await page.locator('[data-role-selector]').selectOption('kitchen');
    await expect(marc.locator('[data-prepare-attendance]')).toBeDisabled();
    await page.locator('[data-role-selector]').selectOption('floor');
    await marc.locator('[data-prepare-attendance]').click();
    await expect(marc.locator('[data-attendance-status="prepared"]')).toContainText('no enviado');
    const confirmationHref = await marc.locator('[data-attendance-link]').getAttribute('href');
    expect(confirmationHref).toMatch(/^\/demos\/solane\/confirmacion\/\?ref=/);

    const bookingsBefore = await page.evaluate((key) => JSON.stringify((JSON.parse(localStorage.getItem(key) ?? '{}') as { bookings?: unknown }).bookings), storageKey);
    await page.goto(confirmationHref!, { waitUntil: 'networkidle' });
    const confirmation = page.locator('[data-attendance-ready]');
    await expect(confirmation).toContainText('Solane');
    await expect(confirmation).toContainText('4 personas');
    await expect(confirmation).not.toContainText('Marc');
    await expect(confirmation).not.toContainText('@');
    await confirmation.locator('[data-attendance-response="attendance_confirmed"]').click();
    await expect(page.locator('[data-attendance-ack="attendance_confirmed"]')).toContainText('Asistencia confirmada');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('[data-attendance-invalid]')).toContainText('ya no está disponible');

    await page.goto('/demos/solane/gestion/?vista=informes', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-risk-booking="sol-r2"] [data-attendance-status="attendance_confirmed"]')).toContainText('Asistencia confirmada');
    const bookingsAfter = await page.evaluate((key) => JSON.stringify((JSON.parse(localStorage.getItem(key) ?? '{}') as { bookings?: unknown }).bookings), storageKey);
    expect(bookingsAfter).toBe(bookingsBefore);

    await page.goto('/en/demos/solane/gestion/?vista=informes', { waitUntil: 'networkidle' });
    await page.locator('[data-role-selector]').selectOption('floor');
    const lucia = page.locator('[data-risk-booking="sol-r1"]');
    await lucia.locator('[data-prepare-attendance]').click();
    const englishHref = await lucia.locator('[data-attendance-link]').getAttribute('href');
    expect(englishHref).toMatch(/^\/en\/demos\/solane\/confirmacion\/\?ref=/);
    await page.goto(englishHref!, { waitUntil: 'networkidle' });
    await expect(page.locator('[data-attendance-ready]')).toContainText('Will you be joining us?');
    await page.locator('[data-attendance-response="change_requested"]').click();
    await expect(page.locator('[data-attendance-ack="change_requested"]')).toContainText('Change requested');
    await page.goto('/en/demos/solane/gestion/?vista=informes', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-risk-booking="sol-r1"] [data-attendance-status="change_requested"]')).toContainText('manual follow-up');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(networkWrites).toEqual([]);
  });

  test('guion de demo comercial: cinco pasos Solane de una tirada', async ({ page }) => {
    const storageKey = 'logic-reserva-demo-solane-v1';
    const networkWrites: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') networkWrites.push(`${request.method()} ${request.url()}`);
    });
    await page.goto('/demos/solane/gestion/?vista=plano', { waitUntil: 'networkidle' });
    await page.evaluate((key) => localStorage.removeItem(key), storageKey);
    await page.reload({ waitUntil: 'networkidle' });

    // 1 · La sala parte de un inventario único y accesible.
    await expect(page.locator('[data-table-id="ss7"]')).toHaveAttribute('data-state', 'free');
    await expect(page.locator('[data-table-id="ss7"]')).toHaveAccessibleName(/Mesa 7 · Libre/);

    // 2 · Un evento publicado bloquea mesas reales.
    await page.getByRole('button', { name: 'Eventos', exact: true }).click();
    await page.locator('input[name="event-name"]').fill('Guion cinco pasos');
    await page.locator('[data-event-table-id="ss7"]').check();
    await page.locator('[data-event-table-id="ss8"]').check();
    await page.locator('[data-create-event]').click();
    const event = page.locator('[data-manager-event-id]').filter({ hasText: 'Guion cinco pasos' });
    await event.locator('[data-publish-event]').click();
    await expect(event).toHaveAttribute('data-manager-event-status', 'published');

    // 3 · La web ve el bloqueo y crea una reserva con menú y depósito informado.
    await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Continuar' }).click();
    const slot = page.locator('[data-time="21:00"]');
    await expect(slot).not.toHaveAttribute('data-available-tables', /ss7|ss8/);
    await slot.click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.locator('input[name="menuId"][value="solane-degustacion"]').check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.locator('input[name="name"]').fill('Guion Comercial');
    await page.locator('input[name="email"]').fill('guion@example.test');
    await page.locator('input[name="depositTerms"]').check();
    await page.getByRole('button', { name: 'Confirmar experiencia demo' }).click();
    await page.locator('[data-confirm-deposit]').click();

    // 4 · Dirección registra el no-show con el límite de la regla ficticia mostrada.
    await page.getByRole('link', { name: 'Abrir en el gestor' }).click();
    const booking = page.locator('[data-booking-id]').filter({ hasText: 'Guion Comercial' });
    await booking.locator('[data-deposit-action="no_show"]').click();
    await expect(booking.locator('[data-deposit-record]')).toHaveAttribute('data-deposit-status', 'charged');

    // 5 · CRM, exportación e informe cierran el argumento con base y estimación visibles.
    await page.getByRole('button', { name: 'Clientes', exact: true }).click();
    await expect(page.locator('[data-customer-key="guion@example.test"]')).toContainText('Guion Comercial');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-export-customers]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('solane-clientes-demo');
    await page.getByRole('button', { name: 'Informes', exact: true }).click();
    await expect(page.locator('[data-report-marketplace] [data-estimate-label]')).toHaveText('Supuesto editable: 3,00 €/cubierto; no es una tarifa atribuida ni un periodo mensual real.');
    expect(networkWrites).toEqual([]);
  });

  test('publicar un evento retira sus mesas del widget y vender plazas reduce el aforo', async ({ page }) => {
    const storageKey = 'logic-reserva-demo-solane-v1';
    const eventName = 'Mesa del equinoccio';

    await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
    await page.evaluate((key) => localStorage.removeItem(key), storageKey);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Continuar' }).click();
    const timeBefore = page.locator('[data-time="21:00"]');
    await expect(timeBefore).toBeVisible();
    await expect(timeBefore).toHaveAttribute('data-available-tables', /ss7/);
    await expect(timeBefore).toHaveAttribute('data-available-tables', /ss8/);

    await page.goto('/demos/solane/gestion/?vista=eventos', { waitUntil: 'networkidle' });
    await page.locator('input[name="event-name"]').fill(eventName);
    await page.locator('[data-event-table-id="ss7"]').check();
    await page.locator('[data-event-table-id="ss8"]').check();
    await page.locator('[data-create-event]').click();

    const managerEvent = page.locator('[data-manager-event-id]').filter({ hasText: eventName });
    await expect(managerEvent).toHaveAttribute('data-manager-event-status', 'draft');
    await managerEvent.locator('[data-publish-event]').click();
    await expect(managerEvent).toHaveAttribute('data-manager-event-status', 'published');
    await expect(page.getByRole('status')).toContainText('Sus mesas ya no están disponibles en la web');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('[data-manager-event-id]').filter({ hasText: eventName })).toHaveAttribute('data-manager-event-status', 'published');

    await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Continuar' }).click();
    const timeAfter = page.locator('[data-time="21:00"]');
    await expect(timeAfter).toBeVisible();
    await expect(timeAfter).not.toHaveAttribute('data-available-tables', /ss7/);
    await expect(timeAfter).not.toHaveAttribute('data-available-tables', /ss8/);

    await page.goto('/demos/solane/eventos/', { waitUntil: 'networkidle' });
    const publicEvent = page.locator('[data-event-id]').filter({ hasText: eventName });
    await expect(publicEvent).toHaveAttribute('data-event-status', 'published');
    await expect(publicEvent.locator('[data-event-remaining]')).toHaveText('8');
    await publicEvent.locator('select').selectOption('2');
    await publicEvent.getByRole('button', { name: 'Confirmar plazas demo' }).click();
    await expect(publicEvent.locator('[data-event-remaining]')).toHaveText('6');

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as { events?: { name?: string; soldSeats?: number; status?: string }[]; sales?: { seats?: number }[] }, storageKey);
    expect(stored.events).toEqual(expect.arrayContaining([expect.objectContaining({ name: eventName, soldSeats: 2, status: 'published' })]));
    expect(stored.sales).toEqual(expect.arrayContaining([expect.objectContaining({ seats: 2 })]));
  });

  test('el inventario local sincroniza gestor y web abiertas en pestañas distintas', async ({ page, context }) => {
    const storageKey = 'logic-reserva-demo-solane-v1';
    const eventName = 'Sincronización entre pestañas';
    const observer = await context.newPage();
    try {
      await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
      await page.evaluate((key) => localStorage.removeItem(key), storageKey);
      await page.reload({ waitUntil: 'networkidle' });
      await observer.goto('/demos/solane/gestion/?vista=servicio', { waitUntil: 'networkidle' });
      const manager = await context.newPage();
      try {
        await manager.goto('/demos/solane/gestion/?vista=eventos', { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: 'Continuar' }).click();
        const slot = page.locator('[data-time="21:00"]');
        await expect(slot).toHaveAttribute('data-available-tables', /ss7/);
        await expect(slot).toHaveAttribute('data-available-tables', /ss8/);

        await manager.locator('input[name="event-name"]').fill(eventName);
        await manager.locator('[data-event-table-id="ss7"]').check();
        await manager.locator('[data-event-table-id="ss8"]').check();
        await manager.locator('[data-create-event]').click();
        const created = manager.locator('[data-manager-event-id]').filter({ hasText: eventName });
        await created.locator('[data-publish-event]').click();
        await expect(created).toHaveAttribute('data-manager-event-status', 'published');

        await expect.poll(async () => slot.getAttribute('data-available-tables')).not.toMatch(/ss7|ss8/);
        await expect.poll(async () => observer.locator('[data-inventory-kind="event"]').filter({ hasText: eventName }).count()).toBe(1);
      } finally {
        await manager.close();
      }
    } finally {
      await observer.close();
    }
  });
});
