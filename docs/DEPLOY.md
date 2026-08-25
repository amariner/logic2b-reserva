# Runbook de preview y producción

Este documento separa deliberadamente la verificación externa de la publicación en `reserva.logic2b.com`. Ningún comando de esta página debe ejecutarse sin autorización explícita para modificar Cloudflare.

## Fronteras de seguridad

- Tanto preview como producción pública declaran `DEMO_MODE=true`. Este flag mantiene Brasca, Vedra y Solane como producto simulado sin efectos externos.
- `COMMERCIAL_LEADS_ENABLED=true` es una allowlist distinta y exclusiva para la captación de la landing. No habilita reservas, pagos, notificaciones de restaurante, webhooks, jobs ni otras APIs.
- Producción usa el Worker `logic-reserva`, `workers_dev: false` y un único dominio personalizado: `reserva.logic2b.com`. Cloudflare gestiona su DNS y certificado.
- Preview usa otro Worker, `logic-reserva-preview`, con `routes: []`. Solo publica en `workers.dev`; no puede heredar ni reasignar el dominio de producción.
- Cada Worker tiene su propio Durable Object y su propio secret `LEADS_RESEND_API_KEY`. El único destinatario interno es `marinerandreu+logic@gmail.com`.
- Solo el formulario comercial de la landing llama a `/api/leads`; los formularios de las demos y los dashboards no usan red ni integraciones reales.
- Sin el flag comercial exacto, la petición se bloquea con `403` antes de leer el body. Sin el secret o una configuración válida, responde `disabled(503)` y nunca finge una entrega.
- Los workflows exigen confirmación textual y una variable de entorno habilitadora. Preview pide `PREVIEW` + `RESERVA_PREVIEW_ENABLED=true`; producción pide `DEPLOY` + `RESERVA_DEPLOY_ENABLED=true`.

## Comprobaciones locales, sin mutación externa

```bash
pnpm check
pnpm e2e
pnpm deploy:preview:dry-run
pnpm deploy:dry-run
pnpm verify:public
```

Los dos dry-runs deben terminar sin advertencias de entorno y mostrar los bindings esperados. `pnpm check` ejecuta además `verify-deploy-config.mjs`, que fija `DEMO_MODE=true`, la única excepción comercial, la ausencia de triggers/colas/D1, los nombres aislados, `routes: []`/`workers.dev` en preview y exclusivamente `reserva.logic2b.com` en producción. `verify-d1-budget.mjs` añade un fusible de 0 consultas, 0 filas y 0 crons; cualquier cambio requiere actualizar primero la decisión y el presupuesto de `docs/D1-BUDGET.md`. `pnpm verify:public` solo usa peticiones GET y comprueba rutas ES/EN, aislamiento SEO, sitemap, robots, contrato de método de `/api/leads` y cabeceras de seguridad; no crea leads ni modifica estado.

## Estado actual

- Preview activa: `https://logic-reserva-preview.marinerandreu.workers.dev`.
- Rutas públicas, SEO, cabeceras de seguridad y `x-robots-tag` verificados el 2026-08-18.
- Producción activa: `https://reserva.logic2b.com`, enlazada a `logic-reserva` como dominio personalizado con DNS y TLS administrados por Cloudflare.
- Producción sirve el commit `1a3a94c`, versión Cloudflare `417bcaac-0308-4a5d-a01d-e070e9bc88ee`, desplegada el 2026-08-24. El dry-run aceptó 143 assets y el smoke posterior quedó verde exclusivamente con GET, sin enviar leads.
- Producción declara el secret cifrado `LEADS_RESEND_API_KEY` y quedó revalidada después de la rotación: `202 delivered` y replay idempotente para la referencia `4e13fdc8-d6fa-4125-b336-e7720b64e3d8`. Falta confirmar visualmente la llegada única en la bandeja.
- Preview también declara `LEADS_RESEND_API_KEY` como secret cifrado, pero su entrega de correo no se valida ni forma parte del gate por decisión de producto del 2026-08-18. No probar ni rotar este transporte salvo nueva orden explícita.
- Preview sirve la instrumentación sanitizada de diagnóstico: ante rechazo del proveedor registra solo estado HTTP y tipo de error, nunca el valor del secret ni datos del lead.
- La cuenta de Resend no está autenticada en el navegador disponible, por lo que crear una nueva clave requiere iniciar sesión.

## Primera preview autorizada

1. Confirmar en Resend que `hola@logic2b.com` pertenece a un dominio verificado.
2. Crear el Worker aislado con `pnpm deploy:preview`. La primera ejecución seguirá fallando cerrada porque el secret aún no existe.
3. Configurar el secreto de preview de forma interactiva, sin copiar su valor a archivos ni al historial:

   ```bash
   pnpm --filter @logic-reserva/worker exec wrangler secret put LEADS_RESEND_API_KEY --config wrangler.jsonc --env preview
   ```

4. Volver a ejecutar `pnpm deploy:preview` y conservar la URL `logic-reserva-preview.<subdomain>.workers.dev` devuelta por Wrangler.
5. Ejecutar `pnpm verify:public:preview` para verificar landing, demos, `robots.txt`, `sitemap.xml`, API, cabeceras de seguridad y `x-robots-tag`.
6. Solo con autorización explícita para enviar correo, realizar una solicitud controlada y comprobar `delivered(202)`, referencia y llegada a `marinerandreu+logic@gmail.com`. Repetir el mismo payload debe devolver la misma referencia con `replayed: true` y no crear otro correo.

## Producción autorizada

La producción no debe usarse para descubrir problemas de configuración. Antes de activar su workflow:

1. Haber completado toda la checklist de preview.
2. Confirmar que `LEADS_RESEND_API_KEY` sigue presente en producción. Si fuera necesario rotarlo, configurarlo de forma interactiva:

   ```bash
   pnpm --filter @logic-reserva/worker exec wrangler secret put LEADS_RESEND_API_KEY --config wrangler.jsonc --env=""
   ```
3. Configurar los secrets de GitHub `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en el entorno `production`.
4. Definir `RESERVA_DEPLOY_ENABLED=true` únicamente durante la ventana de publicación.
5. Ejecutar `Deploy production`, escribir `DEPLOY` y revisar que check, E2E y dry-run hayan pasado antes del último paso. Este deploy activa también el destinatario `marinerandreu+logic@gmail.com` configurado en el repositorio.
6. Comprobar `https://reserva.logic2b.com` con `pnpm verify:public:production`, enviar un único lead autorizado y volver a poner `RESERVA_DEPLOY_ENABLED=false`.

## Reversión

No borrar Worker, Durable Objects ni secrets. Ante una regresión, desactivar temporalmente el formulario mediante `COMMERCIAL_LEADS_ENABLED=false` (barrera más temprana), `LEADS_TRANSPORT=disabled` o volver a una versión anterior desde Cloudflare; después verificar de nuevo las cabeceras y el estado HTTP. Cualquier reversión es también una mutación externa y requiere autorización.
