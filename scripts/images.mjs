import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(projectRoot, 'apps/web/assets/heroes');
const outputDirectory = path.join(projectRoot, 'apps/web/public/images/heroes');
const brands = ['brasca', 'vedra', 'solane'];
const widths = [640, 960, 1600];

await mkdir(outputDirectory, { recursive: true });

for (const brand of brands) {
  const source = path.join(sourceDirectory, `${brand}.svg`);
  for (const width of widths) {
    const output = path.join(outputDirectory, `${brand}-${width}.avif`);
    await sharp(source)
      .resize(width, Math.round(width * 0.75), { fit: 'cover' })
      .avif({ quality: 72, effort: 6 })
      .toFile(output);
    console.log(`[images] ${path.relative(projectRoot, output)}`);
  }
}
