import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const current = resolve('apps/site/public/images/screens');
const baseline = resolve(process.env.CAPTURE_BASELINE_DIR!);
type Capture = { file: string; width: number; height: number; id: string };
const captures = JSON.parse(readFileSync(join(current, 'manifest.json'), 'utf8')).captures as Capture[];
const previous = JSON.parse(readFileSync(join(baseline, 'manifest.json'), 'utf8')).captures as Capture[];
if (captures.length !== 42 || previous.length !== 42) throw new Error('Both capture packages must contain 42 scenes/viewports.');
if (JSON.stringify(captures.map(({ file, width, height, id }) => ({ file, width, height, id }))) !== JSON.stringify(previous.map(({ file, width, height, id }) => ({ file, width, height, id })))) throw new Error('Capture inventories do not match.');

for (const capture of captures) {
  test(capture.file, () => {
    // Zero perceptual differences; the strict threshold tolerates raster noise.
    expect(readFileSync(join(current, capture.file))).toMatchSnapshot(capture.file, { threshold: 0.1, maxDiffPixels: 0 });
  });
}
