import { expect, test } from '@playwright/test';

test('recorrido breve voluntario: web, reserva, sala y conversación sin escrituras', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', (request) => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`); });
  await page.goto('/', { waitUntil: 'networkidle' });
  const intro = page.locator('[data-commercial-tour-intro]');
  const dock = page.locator('[data-tour-dock]');
  await expect(intro).not.toBeVisible();
  await expect(dock).toBeHidden();
  await page.locator('[data-tour-trigger]').first().click();
  await expect(intro.getByRole('heading', { name: 'De tu web a la mesa.' })).toBeVisible();
  await expect(intro).toContainText('4 pasos · 2 minutos');
  await page.setViewportSize({ width: 375, height: 812 });
  await intro.locator('[data-tour-start]').click();

  const milestones = [
    { url: /\/demos\/vedra\/$/, title: 'Un lugar que habla de ti.' },
    { url: /\/demos\/vedra\/#reserva$/, title: 'Una mesa en pocos pasos.' },
    { url: /\/demos\/vedra\/gestion\/\?vista=servicio$/, title: 'Saber quién viene.' },
    { url: /\/planes\/$/, title: 'Empieza por lo que necesitas.' },
  ];
  for (const [index, milestone] of milestones.entries()) {
    await expect(page).toHaveURL(milestone.url);
    await expect(dock.getByRole('heading', { name: milestone.title })).toBeVisible();
    await expect(dock.locator('[data-tour-jump][aria-current="step"]')).toHaveAttribute('data-tour-jump', String(index));
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    const box = await dock.boundingBox();
    expect(box!.height).toBeLessThan(812 * .55 + 1);
    if (index === 2) {
      const navigation = await page.locator('.rd-mobile-nav').boundingBox();
      expect(navigation).not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(navigation!.y);
      await dock.locator('[data-tour-back]').click();
      await expect(page).toHaveURL(milestones[1].url);
      await expect(dock.locator('[data-tour-jump][aria-current="step"]')).toHaveAttribute('data-tour-jump', '1');
      await page.goBack();
      await expect(page).toHaveURL(milestones[2].url);
      await expect(dock.locator('[data-tour-jump][aria-current="step"]')).toHaveAttribute('data-tour-jump', '2');
    }
    await dock.locator('[data-tour-next]').click();
  }
  await expect(page).toHaveURL(/\/empezar\/\?theme=vedra$/);
  await expect(dock).toBeHidden();
  await expect(page.locator('[data-interest-selection]')).toContainText('Vedra');
  expect(writes).toEqual([]);
});

test('el recorrido mantiene el idioma, el panel elegido, el plan explícito y el punto de partida', async ({ page }) => {
  await page.goto('/en/paneles/inteligente/?plan=gestion&recorrido=intro');
  await page.locator('[data-tour-start]').click();
  const dock = page.locator('[data-tour-dock]');
  await expect(page).toHaveURL(/\/en\/demos\/vedra\/$/);
  await dock.locator('[data-tour-jump="3"]').click();
  await expect(page).toHaveURL(/\/en\/planes\/$/);
  await expect(dock.locator('[data-tour-return]')).toHaveAttribute('href', '/en/paneles/inteligente/?plan=gestion');
  await expect(dock.locator('[data-tour-next]')).toHaveAttribute('href', '/en/empezar/?panel=inteligente&plan=gestion');
  await dock.locator('[data-tour-next]').click();
  await expect(page.locator('[data-interest-selection]')).toContainText('Intelligent');
  await expect(page.locator('#lead-form select[name="level"]')).toHaveValue('gestion');
});

test('se puede cerrar con teclado, minimizar, continuar y salir sin perder la página', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  const opener = page.locator('[data-tour-trigger]').first();
  await opener.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-commercial-tour-intro]')).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.locator('[data-tour-start]').click();
  const dock = page.locator('[data-tour-dock]');
  await dock.getByRole('button', { name: 'Minimizar recorrido' }).click();
  await expect(dock.locator('[data-tour-content]')).toBeHidden();
  await page.reload();
  await expect(dock.getByRole('button', { name: 'Ampliar recorrido' })).toHaveAttribute('aria-expanded', 'false');
  await dock.getByRole('button', { name: 'Ampliar recorrido' }).click();
  await expect(dock.getByRole('heading', { name: 'Un lugar que habla de ti.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dock).toBeHidden();
  await expect(page).toHaveURL(/\/demos\/vedra\/$/);
  await page.reload();
  await expect(dock).toBeHidden();
});

test('los enlaces compartidos del antiguo recorrido resuelven a los pasos actuales', async ({ page }) => {
  const dock = page.locator('[data-tour-dock]');
  await page.goto('/temas/?recorrido=2');
  await expect(page).toHaveURL(/\/demos\/vedra\/$/);
  await expect(dock.locator('[data-tour-jump][aria-current="step"]')).toHaveAttribute('data-tour-jump', '0');
  await page.goto('/en/demos/vedra/?recorrido=4#reserva');
  await expect(page).toHaveURL(/\/en\/demos\/vedra\/#reserva$/);
  await expect(dock.locator('[data-tour-jump][aria-current="step"]')).toHaveAttribute('data-tour-jump', '1');
  await page.goto('/demos/vedra/gestion/?vista=ajustes&recorrido=9');
  await expect(page).toHaveURL(/\/planes\/$/);
  await expect(dock.locator('[data-tour-jump][aria-current="step"]')).toHaveAttribute('data-tour-jump', '3');
});

test('un enlace directo al recorrido conserva el tema al cambiar a su primera pantalla', async ({ page }) => {
  await page.goto('/temas/solane/?recorrido=web&plan=gestion');
  const dock = page.locator('[data-tour-dock]');
  await expect(page).toHaveURL(/\/demos\/vedra\/$/);
  await dock.locator('[data-tour-jump="3"]').click();
  await expect(dock.locator('[data-tour-next]')).toHaveAttribute('href', '/empezar/?theme=solane&plan=gestion');
});

test('permite contactar desde el primer paso y conserva el tema al elegir otro plan', async ({ page }) => {
  await page.goto('/temas/solane/?recorrido=intro');
  await page.locator('[data-tour-start]').click();
  const dock = page.locator('[data-tour-dock]');
  await expect(dock.locator('[data-tour-contact]')).toHaveAttribute('href', '/empezar/?theme=solane');
  await dock.locator('[data-tour-contact]').click();
  await expect(page.locator('[data-interest-selection]')).toContainText('Solane');
  await expect(dock).toBeHidden();

  await page.goto('/temas/nacre/?recorrido=intro');
  await page.locator('[data-tour-start]').click();
  await dock.locator('[data-tour-jump="3"]').click();
  const plan = page.locator('.pricing-card[data-plan="gestion"] .pricing-cta');
  await expect(plan).toHaveAttribute('href', '/empezar/?theme=nacre&plan=gestion');
  await plan.click();
  await expect(page.locator('[data-interest-selection]')).toContainText('Nacre');
  await expect(page.locator('select[name="level"]')).toHaveValue('gestion');
  await expect(dock).toBeHidden();
});

test('mantiene el interés entre pantallas aunque sessionStorage esté bloqueado', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto('/en/paneles/inteligente/?plan=gestion&recorrido=intro');
  await page.locator('[data-tour-start]').click();
  const dock = page.locator('[data-tour-dock]');
  await expect(dock.locator('[data-tour-contact]')).toHaveAttribute('href', '/en/empezar/?panel=inteligente&plan=gestion');
  await page.reload();
  await expect(dock).toBeVisible();
  await dock.locator('[data-tour-next]').click();
  await expect(dock.locator('[data-tour-jump="1"]')).toHaveAttribute('aria-current', 'step');
  await expect(dock.locator('[data-tour-contact]')).toHaveAttribute('href', '/en/empezar/?panel=inteligente&plan=gestion');
  await page.goBack();
  await expect(dock.locator('[data-tour-jump="0"]')).toHaveAttribute('aria-current', 'step');
  await expect(dock.locator('[data-tour-contact]')).toHaveAttribute('href', '/en/empezar/?panel=inteligente&plan=gestion');
  await dock.locator('[data-tour-jump="3"]').click();
  await expect(dock.locator('[data-tour-next]')).toHaveAttribute('href', '/en/empezar/?panel=inteligente&plan=gestion');
});


test('un enlace con otra elección prevalece sobre un recorrido anterior activo', async ({ page }) => {
  await page.goto('/temas/brasca/?recorrido=intro');
  await page.locator('[data-tour-start]').click();
  const dock = page.locator('[data-tour-dock]');
  await expect(dock.locator('[data-tour-contact]')).toHaveAttribute('href', '/empezar/?theme=brasca');
  await page.goto('/temas/solane/?recorrido=web&plan=inteligente');
  await expect(dock.locator('[data-tour-contact]')).toHaveAttribute('href', '/empezar/?theme=solane&plan=inteligente');
  await dock.locator('[data-tour-jump="3"]').click();
  await expect(dock.locator('[data-tour-return]')).toHaveAttribute('href', '/temas/solane/?plan=inteligente');
  await page.goto('/paneles/plano/?recorrido=intro&plan=gestion');
  await page.locator('[data-tour-start]').click();
  await expect(dock.locator('[data-tour-contact]')).toHaveAttribute('href', '/empezar/?panel=plano&plan=gestion');
});
