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
const origin = process.env.CAPTURE_ORIGIN ?? 'http://127.0.0.1:8791';
assert(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Use a local built site');
const parent = join(repo, 'apps/site/public/images');
const output = join(parent, 'theme-previews');
await mkdir(parent, { recursive: true });
const temporary = await mkdtemp(join(parent, '.theme-previews-next-'));
const backup = join(parent, '.theme-previews-previous');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--disable-gpu'] });
const captures = [];
try {
  // Read the served catalogue so Node 22 does not need a TypeScript loader.
  const catalogue = await browser.newPage();
  await catalogue.goto(`${origin}/temas/`);
  const slugs = await catalogue.locator('[data-theme-card] .theme-open').evaluateAll(links => links.map(link => new URL(link.href).pathname.split('/').filter(Boolean).at(-1)));
  assert.equal(slugs.length, 12);
  assert.equal(new Set(slugs).size, 12);
  assert(slugs.every(slug => /^[a-z0-9-]+$/.test(slug)));
  await catalogue.close();
  for (const locale of ['es', 'en']) {
    await mkdir(join(temporary, locale), { recursive: true });
    for (const slug of slugs) for (const viewport of [{ id: 'desktop', width: 1366, height: 900 }, { id: 'mobile', width: 375, height: 812 }]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, locale: locale === 'en' ? 'en-GB' : 'es-ES', timezoneId: 'Europe/Madrid', reducedMotion: 'reduce', deviceScaleFactor: 1, serviceWorkers: 'block' });
      const page = await context.newPage();
      await page.clock.install({ time: new Date('2026-08-18T10:00:00+02:00') });
      await page.route('**/*', route => new URL(route.request().url()).origin === new URL(origin).origin && ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
      const path = `${locale === 'en' ? '/en' : ''}/demos/${slug}/`;
      assert.equal((await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' })).status(), 200);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
      const file = `${locale}/${slug}-${viewport.id}.webp`;
      const bytes = await sharp(await page.screenshot()).webp({ quality: 86 }).toBuffer();
      await writeFile(join(temporary, file), bytes);
      captures.push({ file, route: path, width: viewport.width, height: viewport.height, sha256: createHash('sha256').update(bytes).digest('hex') });
      await context.close();
    }
  }
  assert.equal(captures.length, 48);
  await writeFile(join(temporary, 'manifest.json'), JSON.stringify({ version: 1, fixedNow: '2026-08-18T10:00:00+02:00', captures }, null, 2) + '\n');
  if (existsSync(output)) await rename(output, backup);
  try { await rename(temporary, output); } catch (error) { if (existsSync(backup)) await rename(backup, output); throw error; }
  await rm(backup, { recursive: true, force: true });
  console.log(`48 previews: ${createHash('sha256').update(JSON.stringify(captures)).digest('hex')}`);
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
