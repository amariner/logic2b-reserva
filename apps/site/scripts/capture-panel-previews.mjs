#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdir, writeFile, rename, rm, mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const origin = new URL(process.env.CAPTURE_ORIGIN ?? 'http://127.0.0.1:8791').origin;
assert(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Use a local built site');
const parent = join(repo, 'apps/site/public/images');
const output = join(parent, 'panel-previews');
const fixedNow = '2026-09-18T10:00:00+02:00';
const viewports = [{ id: 'desktop', width: 1366, height: 900 }, { id: 'mobile', width: 375, height: 812 }];
await mkdir(parent, { recursive: true });
const temporary = await mkdtemp(join(parent, '.panel-previews-next-'));
const backup = join(parent, '.panel-previews-previous');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--disable-gpu'] });
const captures = [];

try {
  for (const locale of ['es', 'en']) {
    await mkdir(join(temporary, locale), { recursive: true });
    // The rendered catalogue owns both the public slug and the exact demo URL.
    const catalogue = await browser.newPage();
    await catalogue.route('**/*', route => new URL(route.request().url()).origin === origin && ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
    assert.equal((await catalogue.goto(`${origin}${locale === 'en' ? '/en' : ''}/paneles/`)).status(), 200);
    const panels = await catalogue.locator('[data-panel-card]').evaluateAll(cards => cards.map(card => ({ slug: card.id, href: card.querySelector('.panel-demo')?.getAttribute('href') })));
    assert.equal(panels.length, 6);
    assert.equal(new Set(panels.map(panel => panel.slug)).size, 6);
    await catalogue.close();

    for (const panel of panels) for (const viewport of viewports) {
      assert(/^[a-z0-9-]+$/.test(panel.slug));
      assert.match(panel.href, locale === 'en' ? /^\/en\/demos\/(vedra|solane)\/gestion\/\?vista=[a-z]+$/ : /^\/demos\/(vedra|solane)\/gestion\/\?vista=[a-z]+$/);
      const view = new URL(panel.href, origin).searchParams.get('vista');
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, locale: locale === 'en' ? 'en-GB' : 'es-ES', timezoneId: 'Europe/Madrid', reducedMotion: 'reduce', deviceScaleFactor: 1, serviceWorkers: 'block' });
      try {
        const page = await context.newPage();
        const violations = [];
        page.on('pageerror', error => violations.push(error.message));
        await page.clock.install({ time: new Date(fixedNow) });
        await page.route('**/*', route => {
          const request = route.request();
          if (new URL(request.url()).origin !== origin || !['GET', 'HEAD'].includes(request.method())) {
            violations.push(`${request.method()} ${request.url()}`);
            return route.abort();
          }
          return route.continue();
        });
        assert.equal((await page.goto(`${origin}${panel.href}`, { waitUntil: 'networkidle' })).status(), 200);
        await page.locator(`[data-dashboard-view="${view}"]`).waitFor({ state: 'visible' });
        // Open the existing view; do not advance a proposal or mutate business data.
        if (panel.slug === 'grupos-eventos') {
          await page.locator('[data-private-tour-mode="free"]').click();
          await page.locator('[data-private-proposal]').waitFor({ state: 'visible' });
          assert.equal(await page.locator('[data-private-hire-id]').getAttribute('data-private-hire-status'), 'requested');
        }
        assert.equal(await page.locator('html').getAttribute('lang'), locale);
        const notice = await page.locator('.demo-notice').textContent();
        assert.match(notice, locale === 'en' ? /Fictional demonstration/ : /Demostración ficticia/);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].filter(image => image.src).map(image => image.decode()));
          window.scrollTo(0, 0);
        });
        assert(await page.locator('.demo-notice').isVisible());
        assert(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth <= 1), `${panel.slug}: horizontal overflow`);
        let bytes = await page.screenshot({ animations: 'disabled' });
        let stable = false;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const next = await page.screenshot({ animations: 'disabled' });
          stable = bytes.equals(next);
          bytes = next;
          if (stable) break;
        }
        assert(stable, `${panel.slug}: capture did not stabilise`);
        assert.deepEqual(violations, []);
        const webp = await sharp(bytes).webp({ quality: 90 }).toBuffer();
        assert(webp.length > 10_000, `${panel.slug}: capture appears empty`);
        const file = `${locale}/${panel.slug}-${viewport.id}.webp`;
        await writeFile(join(temporary, file), webp);
        captures.push({ file, route: panel.href, view, prepare: panel.slug === 'grupos-eventos' ? ['private-tour-mode:free'] : [], width: viewport.width, height: viewport.height, sha256: createHash('sha256').update(webp).digest('hex') });
        console.log(file);
      } finally {
        await context.close();
      }
    }
  }
  assert.equal(captures.length, 24);
  await writeFile(join(temporary, 'manifest.json'), JSON.stringify({ version: 1, fixedNow, captures }, null, 2) + '\n');
  if (existsSync(output)) await rename(output, backup);
  try { await rename(temporary, output); } catch (error) { if (existsSync(backup)) await rename(backup, output); throw error; }
  await rm(backup, { recursive: true, force: true });
  console.log(`24 previews: ${createHash('sha256').update(JSON.stringify(captures)).digest('hex')}`);
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
