import { test, expect } from '@playwright/test';

const themeTrigger = '[data-commercial-preview-trigger][data-preview-title="Brasca"]';
const panelTrigger = '[data-commercial-preview-trigger][data-preview-contact-url*="panel=servicio"]';
const dialogSelector = '[data-commercial-preview]';

test.describe('Vista previa comercial centrada', () => {
  test('permite comparar escritorio y móvil sin perder la elección ni el contexto', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/');
    await page.locator(themeTrigger).first().click();
    const dialog = page.locator(dialogSelector);
    const screen = dialog.locator('[data-commercial-preview-screen]');
    const image = dialog.locator('[data-commercial-preview-image]');
    const mobile = dialog.getByRole('button', { name: 'Móvil', exact: true });
    const desktop = dialog.getByRole('button', { name: 'Escritorio', exact: true });
    await expect(desktop).toHaveAttribute('aria-pressed', 'true');
    await mobile.click();
    await expect(mobile).toHaveAttribute('aria-pressed', 'true');
    await expect(desktop).toHaveAttribute('aria-pressed', 'false');
    await expect(screen).toHaveAttribute('data-state', 'ready');
    await expect(screen).toHaveAttribute('data-viewport', 'mobile');
    await expect(image).toHaveAttribute('src', '/images/theme-previews/es/brasca-mobile.webp');
    expect((await image.boundingBox())?.width).toBeLessThanOrEqual(375);
    await screen.focus();
    await page.keyboard.press('End');
    await expect.poll(() => screen.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await expect(dialog.locator('[data-commercial-preview-contact]')).toHaveAttribute('href', '/empezar/?theme=brasca');
    await expect(dialog.locator('[data-commercial-preview-contact]')).toBeInViewport({ ratio: 1 });

    await desktop.click();
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(screen).toHaveAttribute('data-viewport', 'desktop');
    await expect(image).toHaveAttribute('src', '/images/theme-previews/es/brasca-desktop.webp');
    await page.keyboard.press('Escape');
    await page.locator(panelTrigger).first().click();
    await expect(screen).toHaveAttribute('data-viewport', 'mobile');
    await expect(image).toHaveAttribute('src', '/images/panel-previews/es/servicio-mobile.webp');
    await expect(dialog.locator('[data-commercial-preview-contact]')).toHaveAttribute('href', '/empezar/?panel=servicio');
  });

  test('mantiene el contexto, el foco y una salida útil si falla la imagen', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator(themeTrigger).first();
    const dialog = page.locator(dialogSelector);
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/commercial-preview-open/);
    await expect(dialog.locator('[data-commercial-preview-close]')).toBeFocused();
    await expect(dialog.locator('[data-commercial-preview-screen]')).toHaveAttribute('data-state', 'ready');
    await dialog.locator('[data-commercial-preview-more] summary').click();
    await expect(dialog.locator('[data-commercial-preview-limit]')).toBeVisible();
    await expect(dialog.locator('[data-commercial-preview-contact]')).toHaveAttribute('href', '/empezar/?theme=brasca');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.locator('html')).not.toHaveClass(/commercial-preview-open/);

    const panelImage = await page.locator(panelTrigger).first().getAttribute('data-preview-image');
    await page.route(`**${panelImage}`, (route) => route.abort());
    await page.locator(panelTrigger).first().click();
    await expect(dialog.locator('[data-commercial-preview-more]')).not.toHaveAttribute('open');
    await expect(dialog.locator('[data-commercial-preview-unavailable]')).toBeVisible();
    await expect(dialog.locator('[data-commercial-preview-link]')).toHaveAttribute('href', '/demos/vedra/gestion/?vista=servicio');
    await expect(dialog.locator('[data-commercial-preview-contact]')).toHaveAttribute('href', '/empezar/?panel=servicio');
    await page.mouse.click(3, 3);
    await expect(dialog).not.toBeVisible();
    await expect(page.locator(panelTrigger).first()).toBeFocused();
  });

  test('mantiene las acciones visibles con detalles abiertos en móvil y poca altura', async ({ page }) => {
    for (const viewport of [{ width: 375, height: 812 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/en/');
      await page.locator(panelTrigger).first().click();
      const dialog = page.locator(dialogSelector);
      const contact = dialog.locator('[data-commercial-preview-contact]');
      const previewImage = dialog.locator('[data-commercial-preview-image]');
      const viewportImage = viewport.width <= 600 ? 'mobile' : 'desktop';
      await expect(dialog.locator('[data-commercial-preview-screen]')).toHaveAttribute('data-state', 'ready');
      await expect.poll(() => previewImage.evaluate((image: HTMLImageElement) => new URL(image.currentSrc).pathname)).toBe(`/images/panel-previews/en/servicio-${viewportImage}.webp`);
      await expect(contact).toBeInViewport({ ratio: 1 });
      const summary = dialog.locator('[data-commercial-preview-more] summary');
      await expect(summary).toContainText('What is included');
      await summary.click();
      await expect(contact).toBeInViewport({ ratio: 1 });
      await expect(dialog.locator('[data-commercial-preview-close]')).toBeInViewport({ ratio: 1 });
      await expect(dialog.locator('[data-commercial-preview-detail-link]')).toBeInViewport({ ratio: 1 });
      await expect(contact).toHaveAttribute('href', '/en/empezar/?panel=servicio');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await page.keyboard.press('Escape');
      await page.locator('[data-commercial-preview-trigger][data-preview-title="Nacre"]').first().click();
      await expect(dialog.locator('[data-commercial-preview-screen]')).toHaveAttribute('data-state', 'ready');
      await expect.poll(() => previewImage.evaluate((image: HTMLImageElement) => new URL(image.currentSrc).pathname)).toBe(`/images/theme-previews/en/nacre-${viewportImage}.webp`);
      if (viewport.width <= 600) {
        await page.setViewportSize({ width: 1280, height: 800 });
        await expect.poll(() => previewImage.evaluate((image: HTMLImageElement) => new URL(image.currentSrc).pathname)).toBe('/images/theme-previews/en/nacre-desktop.webp');
        await expect(dialog.locator('[data-commercial-preview-screen]')).toHaveAttribute('data-state', 'ready');
      }
      await page.keyboard.press('Escape');
    }
  });
});
