import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const pages = [
  '/',
  '/planes/',
  '/soluciones/restaurantes/',
  '/soluciones/grupos-y-eventos/',
  '/legal/',
  '/privacidad/',
  '/cookies/',
  '/en/',
  '/en/planes/',
  '/en/soluciones/restaurantes/',
  '/en/soluciones/grupos-y-eventos/',
  '/en/legal/',
  '/en/privacidad/',
  '/en/cookies/',
] as const;

test.describe('landing comercial Logic Reserva', () => {
  test('todas las rutas públicas y recursos SEO responden', async ({ request }) => {
    for (const path of [...pages, '/robots.txt', '/sitemap.xml']) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
    }

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('https://reserva.logic2b.com/planes/');
    expect(sitemap).not.toContain('/demos/');

    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /demos/');
    expect(robots).toContain('Disallow: /en/demos/');
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

  test('configurador, calculadora y madurez comparten las reglas del dominio', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-recommendation-name]')).toHaveText('Gestión');
    await page.locator('input[name="eventsPerMonth"]').fill('2');
    await expect(page.locator('[data-recommendation-name]')).toHaveText('Inteligente');
    await page.locator('input[name="eventsPerMonth"]').fill('0');
    await page.locator('input[name="wantsOnlineBooking"]').uncheck();
    await page.locator('input[name="hasGroupsOrMenus"]').uncheck();
    await expect(page.locator('[data-recommendation-name]')).toHaveText('Básico');
    await page.locator('input[name="noShowPain"]').check();
    await expect(page.locator('[data-recommendation-name]')).toHaveText('Inteligente');

    await page.locator('#covers-input').fill('1000');
    await expect(page.locator('[data-monthly-saving]')).toContainText(/3[.\s]?000/);
    await expect(page.getByText(/Estimación basada en tarifas publicadas por terceros/)).toBeVisible();

    await page.getByRole('button', { name: 'Usar esta recomendación' }).click();
    await expect(page.locator('[data-lead-level]')).toHaveValue('inteligente');
  });

  test('el consentimiento no tapa las acciones principales del hero', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const banner = await page.locator('[data-cookie-banner]').boundingBox();
    const secondaryAction = await page.getByRole('link', { name: 'Explorar las demos' }).boundingBox();
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
    await expect(page.locator('[data-lead-status]')).toContainText('No se ha enviado ni guardado ningún dato');
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

test.describe('demo Brasca · plan Básico', () => {
  test('los tres heroes sirven AVIF responsive y respetan movimiento reducido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const slug of ['brasca', 'vedra', 'solane']) {
      await page.goto(`/demos/${slug}/`, { waitUntil: 'networkidle' });
      const source = page.locator('.brand-hero picture source[type="image/avif"]');
      await expect(source).toHaveCount(1);
      await expect(source).toHaveAttribute('srcset', /-640\.avif 640w, .*?-960\.avif 960w, .*?-1600\.avif 1600w/);
      await expect(page.locator('.brand-hero img')).toHaveAttribute('loading', 'eager');
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
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('logic-reserva-demo-vedra-v1') ?? '{}') as { version?: number; bookings?: { guest?: { name?: string }; source?: string; menuId?: string }[] });
    expect(stored.version).toBe(1);
    expect(stored.bookings).toEqual(expect.arrayContaining([
      expect.objectContaining({ guest: expect.objectContaining({ name: 'Marina Widget' }), source: 'widget', menuId: 'vedra-mediodia' }),
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
    '/demos/solane/gestion/',
    '/en/demos/solane/',
    '/en/demos/solane/eventos/',
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
        '/demos/solane/gestion/?vista=servicio',
        '/demos/solane/gestion/?vista=plano',
        '/demos/solane/gestion/?vista=reservas',
        '/demos/solane/gestion/?vista=eventos',
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

  test('depósito informado: no-show aplica el máximo proporcional y sentar lo libera', async ({ page }) => {
    const storageKey = 'logic-reserva-demo-solane-v1';
    await page.setViewportSize({ width: 375, height: 900 });

    const bookWithDeposit = async (guestName: string) => {
      await page.goto('/demos/solane/', { waitUntil: 'networkidle' });
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
      await expect(gateway).toContainText('125,00');
      await expect(gateway.locator('input')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
      await gateway.locator('[data-confirm-deposit]').click();
      await expect(page.locator('[data-solane-booking-success]')).toContainText('Depósito retenido solo en esta demo');

      const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as { bookings?: { guest?: { name?: string }; deposit?: { termsAcceptedAt?: string; status?: string; breakdown?: { percentageBps?: number; amountCents?: number } } }[] }, storageKey);
      expect(stored.bookings).toEqual(expect.arrayContaining([expect.objectContaining({
        guest: expect.objectContaining({ name: guestName }),
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
    await expect(page.getByRole('status')).toContainText('únicamente el depósito proporcional mostrado');
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

    await page.getByRole('button', { name: 'Informes', exact: true }).click();
    await expect(page).toHaveURL(/vista=informes/);
    await expect(page.locator('[data-report-occupancy]')).toContainText('Ocupación por servicio');
    await expect(page.locator('[data-report-sources]')).toContainText('Web directa');
    await expect(page.locator('[data-report-no-shows]')).toContainText('Estimación');
    await expect(page.locator('[data-report-marketplace] [data-estimate-label]')).toHaveText('estimación basada en tarifas publicadas por terceros');
    await expect(page.locator('[data-ai-decision-support]')).toContainText('IA demostrativa · cálculo local, sin modelo conectado');
    await expect(page.locator('[data-ai-decision-support] [data-decision]')).toHaveCount(3);
    await expect(page.locator('[data-automation-center]')).toContainText('Evento publicado → mesas fuera del widget');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

    await page.goto('/demos/vedra/gestion/?vista=informes', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-report-mode="management"]')).toContainText('Ocupación por servicio');
    await expect(page.locator('[data-report-mode="management"] [data-report-marketplace]')).toHaveCount(0);
    await expect(page.locator('[data-report-mode="management"] [data-ai-decision-support]')).toHaveCount(0);
    await expect(page.locator('[data-report-mode="management"] [data-automation-center]')).toHaveCount(0);
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

    // 4 · Dirección registra el no-show con el límite proporcional mostrado.
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
    await expect(page.locator('[data-report-marketplace] [data-estimate-label]')).toHaveText('estimación basada en tarifas publicadas por terceros');
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
});
