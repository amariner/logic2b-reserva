import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const root = resolve(here, '../..');
const out = resolve(root, 'apps/worker/dist/assets');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(resolve(root, 'apps/site/dist'), out, { recursive: true });
await cp(resolve(root, 'apps/web/dist'), out, { recursive: true, force: true });
console.log('[compose] site + demos → apps/worker/dist/assets');
