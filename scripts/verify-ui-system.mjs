import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const uiRoot = resolve(root, 'packages/ui');
const config = JSON.parse(readFileSync(resolve(uiRoot, 'components.json'), 'utf8'));
const fail = (message) => {
  throw new Error(`Logic2B UI contract: ${message}`);
};

if (config.$schema !== 'https://ui.logic2b.com/schema.json') fail('schema must come from ui.logic2b.com');
if (config.logic2b?.registry !== 'https://ui.logic2b.com') fail('registry must be https://ui.logic2b.com');
if (typeof config.logic2b?.version !== 'string' || config.logic2b.version.length === 0) fail('registry version must be pinned');
if (config.tailwind?.css !== 'src/theme.css') fail('the registry must target packages/ui/src/theme.css');

const registryFiles = ['button.tsx', 'badge.tsx'];
for (const file of registryFiles) {
  const source = resolve(uiRoot, 'src/components/ui', file);
  const snapshot = resolve(uiRoot, '.logic2b/base/ui', file);
  if (!existsSync(source)) fail(`missing owned component ${file}`);
  if (!existsSync(snapshot)) fail(`missing registry base snapshot for ${file}`);
  if (!readFileSync(source, 'utf8').includes('data-slot=')) fail(`${file} must preserve the registry data-slot contract`);
}

const theme = readFileSync(resolve(uiRoot, 'src/theme.css'), 'utf8');
const semanticTokens = [
  '--background:', '--foreground:', '--card:', '--card-foreground:', '--primary:',
  '--primary-foreground:', '--secondary:', '--secondary-foreground:', '--muted:',
  '--muted-foreground:', '--accent:', '--accent-foreground:', '--destructive:',
  '--destructive-foreground:', '--border:', '--input:', '--ring:', '--radius:',
];
for (const token of semanticTokens) {
  if (!theme.includes(token)) fail(`missing semantic token ${token.slice(0, -1)}`);
}

const dashboardSources = [
  readFileSync(resolve(root, 'apps/dashboard/src/DashboardDemo.tsx'), 'utf8'),
  readFileSync(resolve(root, 'apps/dashboard/src/views/WaitlistView.tsx'), 'utf8'),
].join('\n');
if (!dashboardSources.includes("from '@logic-reserva/ui/button'")) fail('dashboard must consume the owned Button primitive');
if (!dashboardSources.includes("from '@logic-reserva/ui/badge'")) fail('dashboard must consume the owned Badge primitive');

console.log(`Logic2B UI ${config.logic2b.version}: registry, snapshots, tokens and dashboard usage verified.`);
