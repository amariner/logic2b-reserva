import { readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workerRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const repositoryRoot = resolve(workerRoot, '../..');
const config = JSON.parse(readFileSync(resolve(workerRoot, 'wrangler.jsonc'), 'utf8'));
const policy = JSON.parse(readFileSync(resolve(workerRoot, 'd1-budget.json'), 'utf8'));

const invariant = (condition, message) => {
  if (!condition) throw new Error(`[d1-budget] ${message}`);
};

const sourceExtensions = new Set(['.js', '.mjs', '.ts', '.tsx']);
const runtimeFilesWithin = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = resolve(directory, entry.name);
  if (entry.isDirectory()) return runtimeFilesWithin(path);
  if (!sourceExtensions.has(extname(entry.name)) || /\.test\.[cm]?[jt]sx?$/.test(entry.name)) return [];
  return [path];
});

const environments = [
  ['production', config],
  ...Object.entries(config.env ?? {}).map(([name, value]) => [name, value]),
];
const declaredCrons = environments.flatMap(([name, environment]) =>
  (environment.triggers?.crons ?? []).map((cron) => ({ name, cron })),
);
const d1Bindings = environments.flatMap(([name, environment]) =>
  (environment.d1_databases ?? []).map((binding) => ({ name, binding })),
);

invariant(policy.version === 1, 'versión de política desconocida');
invariant(policy.mode === 'disabled', 'Logic Reserva debe mantener D1 desactivado');
invariant(policy.freeDailyLimits?.rowsRead === 5_000_000, 'el límite diario de lectura debe permanecer explícito');
invariant(policy.freeDailyLimits?.rowsWritten === 100_000, 'el límite diario de escritura debe permanecer explícito');

for (const metric of ['queries', 'rowsRead', 'rowsWritten']) {
  invariant(policy.projectDailyBudget?.[metric] === 0, `el presupuesto del proyecto para ${metric} debe ser cero`);
}
for (const limit of [
  'maxCronTriggers', 'maxScheduledJobs', 'maxQueriesPerExecution',
  'maxRowsReadPerExecution', 'maxRowsWrittenPerExecution', 'maxBatchRows',
]) {
  invariant(policy.fuse?.[limit] === 0, `el fusible ${limit} debe bloquear consumo D1`);
}
invariant(policy.fuse?.minimumIntervalHoursIfEnabled >= 168, 'un eventual refresco demo no puede ser más frecuente que semanal');
invariant(Array.isArray(policy.scheduledJobs) && policy.scheduledJobs.length === 0, 'no puede haber jobs D1 presupuestados');
invariant(new Set(policy.protectedTables).size === policy.protectedTables.length, 'las tablas protegidas no pueden duplicarse');
invariant(policy.protectedTables.includes('real_reservations'), 'las reservas reales deben estar protegidas');
invariant(policy.protectedTables.includes('real_contacts'), 'los contactos reales deben estar protegidos');
invariant(policy.scheduledJobs.length <= policy.fuse.maxScheduledJobs, 'demasiados jobs programados para el fusible');

for (const job of policy.scheduledJobs) {
  invariant(job.intervalHours >= policy.fuse.minimumIntervalHoursIfEnabled, `${job.id} se ejecuta con demasiada frecuencia`);
  invariant(job.maxQueriesPerExecution <= policy.fuse.maxQueriesPerExecution, `${job.id} supera el presupuesto de consultas`);
  invariant(job.maxRowsReadPerExecution <= policy.fuse.maxRowsReadPerExecution, `${job.id} supera el presupuesto de filas leídas`);
  invariant(job.maxRowsWrittenPerExecution <= policy.fuse.maxRowsWrittenPerExecution, `${job.id} supera el presupuesto de filas escritas`);
  invariant(job.maxBatchRows <= policy.fuse.maxBatchRows, `${job.id} supera el tamaño máximo de lote`);
  const protectedWrites = job.writesTo.filter((table) => policy.protectedTables.includes(table));
  invariant(protectedWrites.length === 0, `${job.id} intenta modificar tablas protegidas: ${protectedWrites.join(', ')}`);
}

invariant(d1Bindings.length === 0, `bindings D1 no presupuestados: ${d1Bindings.map(({ name }) => name).join(', ')}`);
invariant(declaredCrons.length === 0, `Cron Triggers no presupuestados: ${declaredCrons.map(({ name, cron }) => `${name}:${cron}`).join(', ')}`);

const forbiddenRuntimePatterns = [
  ['tipo D1Database', /\bD1Database\b/],
  ['binding d1_databases', /\bd1_databases\b/],
  ['handler scheduled', /\bscheduled\s*(?:\(|:)/],
  ['SQL de lectura o escritura', /\b(?:SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+[A-Za-z_]|DELETE\s+FROM|DROP\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX)\b/is],
];

// Site, web y dashboard se compilan como assets estáticos; solo el Worker tiene
// runtime servidor capaz de recibir un binding de Cloudflare.
for (const path of runtimeFilesWithin(resolve(workerRoot, 'src'))) {
  const source = readFileSync(path, 'utf8');
  for (const [label, pattern] of forbiddenRuntimePatterns) {
    invariant(!pattern.test(source), `${path.replace(`${repositoryRoot}/`, '')} introduce ${label} sin presupuesto`);
  }
}

console.log('[d1-budget] 0 queries, 0 filas leídas, 0 filas escritas y 0 crons permitidos');
