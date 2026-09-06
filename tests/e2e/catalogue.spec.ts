import { test, expect } from '@playwright/test';

const slugs = ['brasca', 'vedra', 'solane', 'la-trece', 'salobre', 'trama', 'umbral', 'nacre', 'brisa-alta', 'nave-nueve', 'miga-club', 'mercat-33'];

for (const width of [320, 375, 430, 768, 1024, 1366]) {
  test(`catálogo: las 24 webs ES/EN no recortan texto ni imágenes a ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const locale of ['es', 'en']) for (const slug of slugs) {
      const route = `${locale === 'en' ? '/en' : ''}/demos/${slug}/`;
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.hero-art img, .brand-hero img')).toHaveJSProperty('complete', true);
      const problems = await page.evaluate(() => {
        const problems: string[] = [];
        if (document.documentElement.scrollWidth > innerWidth) problems.push('page overflow');
        for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main dd')) {
          if (!(el instanceof HTMLElement) || !el.checkVisibility()) continue;
          const range = document.createRange(); range.selectNodeContents(el);
          for (const r of range.getClientRects()) {
            if (r.left < -1 || r.right > innerWidth + 1) problems.push(`text outside viewport: ${el.textContent?.slice(0, 70)}`);
          }
          if (el.scrollWidth > el.clientWidth + 2) problems.push(`text exceeds container: ${el.textContent?.slice(0, 70)}`);
        }
        for (const img of document.querySelectorAll<HTMLImageElement>('main img')) {
          if (img.complete && !img.naturalWidth) problems.push(`broken image: ${img.src}`);
        }
        return problems;
      });
      expect(problems, route).toEqual([]);
      if (width <= 1080) {
        const menu = page.locator('.restaurant-mobile-menu');
        await menu.locator('summary').click();
        await expect(menu.locator('nav')).toBeVisible();
        await expect(menu.getByRole('link', { name: locale === 'en' ? 'Ver en español' : 'View in English' })).toBeVisible();
        const targets = await menu.locator('a').evaluateAll(links => links.map(link => {
          const r = link.getBoundingClientRect();
          return { text: link.textContent, width: r.width, height: r.height, left: r.left, right: r.right };
        }).filter(r => r.width < 44 || r.height < 44 || r.left < 0 || r.right > innerWidth));
        expect(targets, route).toEqual([]);
        await menu.locator('summary').focus();
        await page.keyboard.press('Escape');
        await expect(menu).not.toHaveAttribute('open', '');
        await expect(menu.locator('summary')).toBeFocused();
        await menu.locator('summary').click();
        const first = menu.locator('a').first();
        const href = await first.getAttribute('href');
        await first.click();
        await expect(menu).not.toHaveAttribute('open', '');
        if (href?.startsWith('#')) {
          const top = await page.locator(href).evaluate(el => el.getBoundingClientRect().top);
          expect(top, `${route} anchor behind header`).toBeGreaterThanOrEqual(63);
        }
      }
      if (!['brasca', 'vedra', 'solane'].includes(slug)) {
        await expect(page.locator('.booking-explainer a').first()).toHaveAttribute('href', `${locale === 'en' ? '/en' : ''}/empezar/?theme=${slug}`);
      }
    }
    expect(errors).toEqual([]);
  });

  test(`catálogo: las 24 fichas y filtros se adaptan a ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    for (const prefix of ['', '/en']) {
      for (const slug of slugs) {
        const route = `${prefix}/temas/${slug}/`;
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), route).toBeLessThanOrEqual(width);
        const clipped = await page.locator('h1, h2, .theme-detail__actions a, .theme-detail__facts dd').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth + 2).map(el => el.textContent));
        expect(clipped, route).toEqual([]);
      }
      await page.goto(`${prefix}/temas/`);
      await expect(page.locator('[data-theme-card]:visible')).toHaveCount(12);
      await page.locator('[data-theme-search]').fill('zz-no-restaurant');
      await expect(page.locator('[data-theme-card]:visible')).toHaveCount(0);
      await page.locator('[data-theme-reset]').click();
      await expect(page.locator('[data-theme-card]:visible')).toHaveCount(12);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
}

test('menús móviles sin JavaScript conservan destinos e idioma', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 812 } });
  const page = await context.newPage();
  for (const slug of slugs) {
    await page.goto(`/demos/${slug}/`);
    await page.locator('.restaurant-mobile-menu summary').click();
    await expect(page.locator('.restaurant-mobile-menu nav')).toBeVisible();
    await expect(page.locator('.restaurant-mobile-menu').getByRole('link', { name: 'View in English' })).toHaveAttribute('href', `/en/demos/${slug}/`);
  }
  await context.close();
});

test('móvil 320px: solicitudes, reservas y precios permanecen utilizables', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  const writes: string[] = [];
  page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
  await page.goto('/demos/brasca/');
  await page.locator('#brasca-request input[name="name"]').fill('Prueba móvil');
  await page.locator('#brasca-request input[name="email"]').fill('mobile@example.test');
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page.locator('[data-request-status]')).toContainText('no se ha enviado ni guardado ningún dato');
  for (const slug of ['vedra', 'solane']) {
    await page.goto(`/demos/${slug}/`);
    const overlaps = await page.locator(`.${slug}-menu-grid article`).evaluateAll(cards => cards.flatMap(card => {
      const text = card.querySelector('p')?.getBoundingClientRect();
      const price = card.querySelector('strong')?.getBoundingClientRect();
      return text && price && text.bottom > price.top ? [card.textContent] : [];
    }));
    expect(overlaps, slug).toEqual([]);
    const widget = page.locator('[data-booking-widget], [data-solane-booking-widget]');
    await widget.locator('select[name="partySize"]').selectOption('2');
    await widget.getByRole('button', { name: 'Continuar', exact: true }).click();
    await (slug === 'solane' ? widget.locator('[data-time="21:00"]') : widget.locator('.vw-times button').first()).click();
    await widget.getByRole('button', { name: 'Continuar', exact: true }).click();
    await widget.locator('input[name="menuId"]').first().check();
    await widget.getByRole('button', { name: 'Continuar', exact: true }).click();
    await widget.locator('input[name="name"]').fill('Prueba móvil');
    await widget.locator('input[name="email"]').fill('mobile@example.test');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    if (slug === 'vedra') {
      await widget.getByRole('button', { name: 'Confirmar reserva demo' }).click();
      await expect(page.locator('[data-booking-success]')).toBeVisible();
    } else {
      await widget.locator('input[name="depositTerms"]').check();
      await widget.getByRole('button', { name: 'Confirmar experiencia demo' }).click();
      await expect(page.locator('[data-deposit-gateway]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    }
  }
  expect(writes).toEqual([]);
});
