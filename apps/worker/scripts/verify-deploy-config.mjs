import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const preview = config.env?.preview;
const expectedVariables = ['LEADS_TRANSPORT', 'LEADS_FROM_EMAIL', 'LEADS_INTERNAL_RECIPIENT', 'LEADS_REPLY_TO'];
const expectedInternalRecipient = 'marinerandreu+logic@gmail.com';

const invariant = (condition, message) => {
  if (!condition) throw new Error(`[deploy-config] ${message}`);
};

invariant(config.name === 'logic-reserva', 'nombre de producción inesperado');
invariant(config.workers_dev === false, 'producción debe desactivar workers.dev');
invariant(config.preview_urls === false, 'producción debe desactivar preview URLs');
invariant(
  Array.isArray(config.routes)
    && config.routes.length === 1
    && config.routes[0]?.pattern === 'reserva.logic2b.com'
    && config.routes[0]?.custom_domain === true,
  'producción debe declarar únicamente reserva.logic2b.com como dominio personalizado',
);

invariant(preview && preview.name === 'logic-reserva-preview', 'preview debe usar un Worker independiente');
invariant(preview.name !== config.name, 'preview y producción no pueden compartir nombre');
invariant(preview.workers_dev === true && preview.preview_urls === true, 'preview debe publicarse solo mediante workers.dev');
invariant(Array.isArray(preview.routes) && preview.routes.length === 0, 'preview debe sobrescribir routes con []');
invariant(config.assets?.run_worker_first === true, 'todas las páginas deben pasar por el Worker para recibir cabeceras de seguridad');
invariant(config.vars?.LEADS_INTERNAL_RECIPIENT === expectedInternalRecipient, `producción debe enviar leads únicamente a ${expectedInternalRecipient}`);

for (const key of expectedVariables) {
  invariant(preview.vars?.[key] === config.vars?.[key], `preview debe repetir la variable no heredable ${key}`);
}
invariant(preview.vars?.LEADS_INTERNAL_RECIPIENT === expectedInternalRecipient, `preview debe enviar leads únicamente a ${expectedInternalRecipient}`);

const productionBinding = config.durable_objects?.bindings?.find((binding) => binding.name === 'LEAD_COORDINATOR');
const previewBinding = preview.durable_objects?.bindings?.find((binding) => binding.name === 'LEAD_COORDINATOR');
invariant(productionBinding?.class_name === 'LeadCoordinator', 'producción debe enlazar LeadCoordinator');
invariant(previewBinding?.class_name === 'LeadCoordinator', 'preview debe repetir el binding Durable Object');
invariant(config.migrations?.[0]?.new_sqlite_classes?.includes('LeadCoordinator'), 'producción debe declarar la migración v1');
invariant(preview.migrations?.[0]?.new_sqlite_classes?.includes('LeadCoordinator'), 'preview debe repetir la migración v1');

console.log('[deploy-config] preview aislada de producción');
