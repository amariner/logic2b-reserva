import { expect, test } from '@playwright/test';

for (const locale of ['es', 'en']) {
  test(`platform artwork: readable zoom and opt-in films (${locale})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(locale === 'en' ? '/en/' : '/');
    const video = page.locator('[data-platform-video]');
    await expect(video).not.toHaveAttribute('src');
    const play = page.locator('[data-platform-play]');
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.2);
    await expect.poll(() => video.getAttribute('src'), { timeout: 15000 }).toContain('brasca-cuisine.mp4');
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.2);
    await page.locator('[data-platform-target="floor"]').click();
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
    for (const width of [1366, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const kind of ['web', 'bookings', 'floor', 'groups', 'operations']) {
        await page.locator(`[data-platform-target="${kind}"]`).click();
        const panel = page.locator(`[data-platform-id="${kind}"]`);
        const zoom = panel.locator('[data-platform-zoom]');
        await zoom.click();
        await expect(zoom).toHaveAttribute('aria-pressed', 'true');
        const scene = await panel.locator('.interface-scene').boundingBox();
        const detail = await panel.locator('.zoom-card').boundingBox();
        expect(scene).not.toBeNull();
        expect(detail).not.toBeNull();
        expect(detail!.x).toBeGreaterThanOrEqual(scene!.x);
        expect(detail!.x + detail!.width).toBeLessThanOrEqual(scene!.x + scene!.width + 1);
        expect(detail!.y).toBeGreaterThanOrEqual(scene!.y);
        expect(detail!.y + detail!.height).toBeLessThanOrEqual(scene!.y + scene!.height + 1);
        await zoom.click();
        await expect(zoom).toHaveAttribute('aria-pressed', 'false');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
  });
}
