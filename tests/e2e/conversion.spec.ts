import { expect, test } from '@playwright/test';

for (const locale of ['es', 'en'] as const) {
  const prefix = locale === 'en' ? '/en' : '';
  test(`conversion ${locale}: permite empezar sin entregar el correo`, async ({ page }) => {
    const writes: string[] = [];
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
    });
    await page.goto(`${prefix}/`);
    await page.locator('#brief-lead-form button').click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/empezar/$`));
    await expect(page.locator('#lead-form input[name="email"]')).toHaveValue('');
    await expect(page.locator('[data-lead-optional]')).not.toHaveAttribute('open');
    await page.locator('[data-lead-optional] summary').click();
    await expect(page.locator('#lead-form input[name="phone"]')).toBeVisible();
    await page.locator('#lead-form input[name="phone"]').fill('+34 600 000 000');
    await page.locator('[data-lead-optional] summary').click();
    await expect(page.locator('#lead-form input[name="phone"]')).toHaveValue('+34 600 000 000');
    expect(writes).toEqual([]);
  });

  test(`conversion ${locale}: sin JavaScript ofrece contacto directo y no expone campos en una URL`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL });
    const page = await context.newPage();
    await page.goto(`${prefix}/empezar/?theme=nacre`);
    const form = page.locator('#lead-form');
    await expect(form).toHaveAttribute('method', 'post');
    await expect(form.locator('[data-lead-fields]')).toBeHidden();
    await expect(form.locator('input[name="name"]')).toBeDisabled();
    await expect(form.locator('button[type="submit"]')).toBeDisabled();
    await expect(form.locator('[data-lead-fallback]')).toBeVisible();
    await expect(form.locator('[data-lead-fallback] a[href^="https://wa.me/"]')).toBeVisible();
    await expect(form.locator('[data-lead-fallback] a[href^="mailto:"]')).toBeVisible();
    const fields = await form.evaluate((element) => [...new FormData(element as HTMLFormElement).keys()]);
    expect(fields).toEqual([]);
    await context.close();
  });

  test(`conversion ${locale}: vuelve a la elección válida y mantiene el contacto a mano en móvil`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const cases = [
      { query: '?theme=nacre&plan=inteligente', href: `${prefix}/temas/nacre/?plan=inteligente`, label: 'Nacre' },
      { query: '?panel=servicio', href: `${prefix}/paneles/servicio/`, label: locale === 'en' ? 'Today’s service' : 'Servicio del día' },
      { query: '?plan=gestion', href: `${prefix}/planes/`, label: locale === 'en' ? 'Back to plans' : 'Volver a los planes' },
      { query: '?theme=invalid&plan=invalid', href: `${prefix}/`, label: locale === 'en' ? 'Back to home' : 'Volver al inicio' },
      { query: '?theme=nacre&panel=servicio', href: `${prefix}/`, label: locale === 'en' ? 'Back to home' : 'Volver al inicio' },
    ];
    for (const entry of cases) {
      await page.goto(`${prefix}/empezar/${entry.query}`);
      await expect(page.locator('[data-start-back]')).toHaveAttribute('href', entry.href);
      await expect(page.locator('[data-start-back]')).toContainText(entry.label);
      await expect(page.locator('#lead-form [data-lead-fields]')).toBeVisible();
      await expect(page.locator('#lead-form input[name="email"]')).toBeEnabled();
      await expect(page.locator('#lead-form [data-lead-fallback]')).toBeHidden();
      await page.locator('.start-direct a').scrollIntoViewIfNeeded();
      await expect(page.locator('.start-direct a')).toBeInViewport();
      await expect(page.locator('.start-direct a')).toHaveAttribute('href', /^https:\/\/wa\.me\//);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    }
  });

  test(`conversion ${locale}: preferencias a demanda sin tapar el formulario ni asumir consentimiento`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${prefix}/empezar/`);
    await expect(page.locator('#lead-form input[name="email"]')).toBeEnabled();
    await expect(page.locator('[data-cookie-banner]')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('logic-reserva-consent-v1'))).toBeNull();
    const opener = page.locator('[data-cookie-preferences]');
    await opener.click();
    const dialog = page.locator('[data-cookie-dialog]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-cookie-analytics]')).not.toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem('logic-reserva-consent-v1'))).toBeNull();
    await dialog.locator('[data-cookie-necessary]').click();
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem('logic-reserva-consent-v1'))).toBe('necessary');
    await expect(page.locator('script[src*="google-analytics"], script[src*="googletagmanager"]')).toHaveCount(0);
  });

  test(`conversion ${locale}: ida y vuelta conserva el plan actualizado en ficha y popup del mismo interés`, async ({ page }) => {
    const writes: string[] = [];
    page.on('request', (request) => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
    const cases = [
      { kind: 'theme', slug: 'nacre', route: 'temas', name: 'Nacre', plan: 'inteligente', related: '.related-grid a' },
      { kind: 'panel', slug: 'servicio', route: 'paneles', name: locale === 'en' ? 'Today’s service' : 'Servicio del día', plan: 'basico', related: '.panel-detail__next > a' },
    ];
    for (const entry of cases) {
      await page.goto(`${prefix}/empezar/?${entry.kind}=${entry.slug}&plan=gestion`);
      await page.locator('#lead-form select[name="level"]').selectOption(entry.plan);
      const detailPath = `${prefix}/${entry.route}/${entry.slug}/?plan=${entry.plan}`;
      const contactPath = `${prefix}/empezar/?${entry.kind}=${entry.slug}&plan=${entry.plan}`;
      await expect(page.locator('[data-start-back]')).toHaveAttribute('href', detailPath);
      await page.locator('[data-start-back]').click();
      await expect(page).toHaveURL(new URL(detailPath, page.url()).href);
      await expect(page.locator('.language-link')).toHaveAttribute('href', `${locale === 'en' ? '' : '/en'}/${entry.route}/${entry.slug}/?plan=${entry.plan}`);
      const contactLinks = page.locator(`main a[href^="${prefix}/empezar/?${entry.kind}=${entry.slug}"]`);
      await expect(contactLinks).toHaveCount(2);
      for (const link of await contactLinks.all()) await expect(link).toHaveAttribute('href', contactPath);

      const cookieBanner = page.locator('[data-cookie-banner]');
      if (await cookieBanner.isVisible()) await cookieBanner.locator('[data-cookie-choice="necessary"]').click();
      const popupTriggers = page.locator('[data-project-request-open]');
      await expect(popupTriggers).toHaveCount(2);
      for (const trigger of await popupTriggers.all()) await expect(trigger).toHaveAttribute('href', contactPath);
      await page.locator('.commercial-closing__primary[data-project-request-open]').click();
      const popup = page.locator('[data-project-request-dialog]');
      await expect(popup).toBeVisible();
      await expect(popup.locator('select[name="level"]')).toHaveValue(entry.plan);
      await expect(popup.locator('[data-interest-selection]')).toContainText(entry.name);
      await popup.locator('[data-project-request-close]').click();
      await contactLinks.first().click();
      await expect(page).toHaveURL(new URL(contactPath, page.url()).href);
      await expect(page.locator('#lead-form select[name="level"]')).toHaveValue(entry.plan);
      await expect(page.locator('[data-interest-selection]')).toContainText(entry.name);

      await page.locator('[data-start-back]').click();
      await page.locator(entry.related).first().click();
      expect(new URL(page.url()).searchParams.has('plan')).toBe(false);
      for (const link of await page.locator(`main a[href^="${prefix}/empezar/"]`).all()) {
        expect(new URL(await link.getAttribute('href') ?? '/', page.url()).searchParams.has('plan')).toBe(false);
      }
    }
    expect(writes).toEqual([]);
  });

  test(`conversion ${locale}: una ficha ignora planes desconocidos y mantiene su propio interés`, async ({ page }) => {
    for (const entry of [
      { kind: 'theme', slug: 'nacre', route: 'temas', contradictory: 'theme=brasca', name: 'Nacre' },
      { kind: 'panel', slug: 'servicio', route: 'paneles', contradictory: 'panel=inteligente', name: locale === 'en' ? 'Today’s service' : 'Servicio del día' },
    ]) {
      await page.goto(`${prefix}/${entry.route}/${entry.slug}/?plan=unknown&${entry.contradictory}`);
      const contactLinks = page.locator(`main a[href^="${prefix}/empezar/?${entry.kind}=${entry.slug}"]`);
      await expect(contactLinks).toHaveCount(2);
      for (const link of await contactLinks.all()) await expect(link).toHaveAttribute('href', `${prefix}/empezar/?${entry.kind}=${entry.slug}`);
      await expect(page.locator('.language-link')).toHaveAttribute('href', `${locale === 'en' ? '' : '/en'}/${entry.route}/${entry.slug}/`);
      await expect(page.locator('#project-request-form select[name="level"]')).not.toHaveValue('unknown');
      await expect(page.locator('#project-request-form [data-interest-selection]')).toContainText(entry.name);
    }
  });
}

test('las galerías se recorren con controles y teclado sin salir del home', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  for (const id of ['theme-rail', 'panel-rail']) {
    const rail = page.locator(`#${id}`);
    const controls = page.locator(`[data-catalogue-controls="${id}"]`);
    await expect(controls.locator('[data-catalogue-previous]')).toBeDisabled();
    await controls.locator('[data-catalogue-next]').click();
    await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(20);
    await expect(controls.locator('[data-catalogue-previous]')).toBeEnabled();
    await rail.press('ArrowLeft');
    await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeLessThan(2);
    await expect(controls.locator('[data-catalogue-previous]')).toBeDisabled();
  }
  await expect(page).toHaveURL('http://127.0.0.1:8791/');
});

test('cambiar de idioma conserva elección y correo sin exponerlo en la consulta HTTP', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/empezar/?theme=nacre&plan=inteligente');
  await page.locator('#lead-form input[name="email"]').fill('language@example.test');
  await page.locator('.language-link').click();
  await expect(page).toHaveURL(/\/en\/empezar\/\?theme=nacre&plan=inteligente$/);
  await expect(page.locator('#lead-form input[name="email"]')).toHaveValue('language@example.test');
  await expect(page.locator('#lead-form select[name="level"]')).toHaveValue('inteligente');
  await expect(page.locator('[data-interest-selection]')).toContainText('Nacre');
  expect(requests.some((url) => url.includes('language@') || url.includes('language%40'))).toBe(false);
});
