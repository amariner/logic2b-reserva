# ADR-001 · Demo-first con el patrón de logic-estancia

**Fecha:** 2026-08-17 · **Estado:** aceptada

## Contexto

Logic Reserva nace como tercer producto de la familia logic2b para el vertical restauración+eventos. Existían dos moldes: camp.logic2b.com (SaaS real: D1 por tenant, Hono, Better Auth, pagos) y estancia.logic2b.com (demo comercial: sin DB, localStorage, un worker, un endpoint real de leads).

## Decisión

Replicar el **patrón estancia** al completo: monorepo pnpm+Turborepo, Astro 5 + islas React 19, dominio puro en `packages/domain`, estado de demo en localStorage versionado, worker compositor único, leads como único endpoint real (fail-closed), demos noindex con marcas ficticias que escenifican la escalera comercial, E2E Playwright como especificación de producto.

De camp se hereda el **proceso** (CLAUDE.md, PROGRESS.md, ADRs, `pnpm check` como gate) y las convenciones duras (céntimos enteros, rangos semiabiertos, dominio sin I/O), no la infraestructura.

## Consecuencias

- Cualquier restaurador puede tocar la demo sin cuentas ni datos reales; nadie puede confundirla con producción (etiquetado honesto en cada capa).
- El coste de operar es un único Worker de Cloudflare.
- Si algún día se convierte en SaaS, `packages/domain` ya contiene las reglas de negocio testeadas y el camino es añadir persistencia y auth (el mapa es camp), no reescribir.
