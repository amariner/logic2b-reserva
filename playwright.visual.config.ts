import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

if (!process.env.CAPTURE_BASELINE_DIR) throw new Error('Define CAPTURE_BASELINE_DIR with the previous complete capture directory.');

export default defineConfig({
  testDir: './tests/visual',
  workers: 1,
  updateSnapshots: 'none',
  snapshotPathTemplate: `${resolve(process.env.CAPTURE_BASELINE_DIR)}/{arg}{ext}`,
  outputDir: 'test-results/visual',
  reporter: 'list',
});
