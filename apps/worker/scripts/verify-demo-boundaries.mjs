import { readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const sourceExtensions = new Set(['.astro', '.js', '.mjs', '.ts', '.tsx']);

const filesWithin = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = resolve(directory, entry.name);
  if (entry.isDirectory()) return filesWithin(path);
  return sourceExtensions.has(extname(entry.name)) ? [path] : [];
});

const invariant = (condition, message) => {
  if (!condition) throw new Error(`[demo-boundaries] ${message}`);
};

const landingDirectory = resolve(repositoryRoot, 'apps/site/src');
const demoDirectories = [resolve(repositoryRoot, 'apps/web/src'), resolve(repositoryRoot, 'apps/dashboard/src')];
const landingSources = filesWithin(landingDirectory).map((path) => ({ path, source: readFileSync(path, 'utf8') }));
const demoSources = demoDirectories.flatMap(filesWithin).map((path) => ({ path, source: readFileSync(path, 'utf8') }));

const leadEndpointUsages = landingSources.filter(({ source }) => source.includes("fetch('/api/leads'"));
invariant(leadEndpointUsages.length === 1, 'debe existir una única llamada real a /api/leads en la landing');
invariant(leadEndpointUsages[0]?.path.endsWith('/apps/site/src/components/Landing.astro'), 'la única llamada a /api/leads debe vivir en Landing.astro');

const forbiddenNetworkPatterns = [
  ['fetch', /\bfetch\s*\(/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['WebSocket', /\bWebSocket\s*\(/],
  ['EventSource', /\bEventSource\s*\(/],
  ['sendBeacon', /\bsendBeacon\s*\(/],
  ['form action', /<form\b[^>]*\baction\s*=/i],
];

for (const { path, source } of demoSources) {
  for (const [label, pattern] of forbiddenNetworkPatterns) {
    invariant(!pattern.test(source), `${path.replace(`${repositoryRoot}/`, '')} no puede usar ${label}`);
  }
}

console.log('[demo-boundaries] solo la landing comercial usa /api/leads; demos y dashboards permanecen locales');
