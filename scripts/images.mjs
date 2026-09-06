import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(projectRoot, 'apps/web/assets/heroes');
const outputDirectory = path.join(projectRoot, 'apps/web/public/images/heroes');
const heroes = [
  { source: 'generated/brasca-v2.png', output: 'brasca-v2' },
  { source: 'generated/vedra-v2.png', output: 'vedra-v2' },
  { source: 'generated/solane-v2.png', output: 'solane-v2' },
];
const catalogue = JSON.parse(await readFile(path.join(sourceDirectory, 'generated/catalogue-v1/prompts.json'), 'utf8'));
heroes.push(...catalogue.map(({ slug }) => ({ source: `generated/catalogue-v1/${slug}.png`, output: `${slug}-v1`, catalogue: true })));
const widths = [640, 960, 1600];

await mkdir(outputDirectory, { recursive: true });

for (const hero of heroes) {
  const source = path.join(sourceDirectory, hero.source);
  for (const width of widths) {
    const output = path.join(outputDirectory, `${hero.output}-${width}.avif`);
    await sharp(source)
      .resize(width, hero.catalogue ? undefined : Math.round(width * 0.75), { fit: 'cover' })
      .avif({ quality: hero.catalogue ? 58 : 72, effort: 6 })
      .toFile(output);
    console.log(`[images] ${path.relative(projectRoot, output)}`);
  }
}
