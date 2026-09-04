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
const workerSource = readFileSync(resolve(repositoryRoot, 'apps/worker/src/index.ts'), 'utf8');
const demoModeSource = readFileSync(resolve(repositoryRoot, 'apps/worker/src/demo-mode.ts'), 'utf8');

const leadEndpointUsages = landingSources.filter(({ source }) => source.includes("fetch('/api/leads'"));
invariant(leadEndpointUsages.length === 1, 'debe existir una única llamada real a /api/leads en la superficie comercial');
invariant(leadEndpointUsages[0]?.path.endsWith('/apps/site/src/components/CommercialLeadForm.astro'), 'la única llamada a /api/leads debe vivir en el formulario comercial compartido');

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

invariant(workerSource.indexOf('commercialLeadsEnabled(env)') < workerSource.indexOf('handleLead(request, env)'), 'la allowlist comercial debe comprobarse antes del handler transaccional');
invariant(demoModeSource.includes("return env.DEMO_MODE !== 'false'"), 'DEMO_MODE debe fallar cerrado salvo false explícito');
invariant(demoModeSource.includes('sideEffects: false'), 'el manifest debe desactivar efectos');
invariant(demoModeSource.includes('jobs: false'), 'el manifest debe desactivar jobs');
for (const provider of ['email', 'payments', 'webhooks', 'externalStorage']) {
  invariant(new RegExp(`${provider}: 'disabled'`).test(demoModeSource), `el manifest debe desactivar ${provider}`);
}
invariant(demoModeSource.includes("leadCapture: 'explicitly_configured'"), 'el manifest debe aislar la excepción comercial de leads');
invariant(demoModeSource.includes("return env.COMMERCIAL_LEADS_ENABLED === 'true'"), 'los leads deben requerir habilitación exacta');

console.log('[demo-boundaries] guardas fail-closed y superficies locales verificadas');
