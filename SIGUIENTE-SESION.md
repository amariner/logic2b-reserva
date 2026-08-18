# SIGUIENTE SESIÓN

**Fase actual:** heroes v2 + F13 + F14 publicados en GitHub y producción ✅ · F12 bloqueada por credencial insegura en preview (2026-08-18)
**Siguiente hito:** rotar y guardar correctamente el secret de preview, desplegar el mismo bundle y cerrar la verificación real de F12 — ver `docs/ROADMAP.md` §F12

## Siguiente paso concreto

1. Revocar en Resend la credencial que Wrangler expuso durante la comparación estricta de preview y crear una nueva; comprobar antes si producción comparte esa clave para actualizar ambos Workers de forma coordinada y evitar interrumpir la captación.
2. Guardar la nueva `LEADS_RESEND_API_KEY` como secret cifrado mediante entrada interactiva, nunca como variable de texto ni copiándola al repositorio, terminal grabada o chat.
3. Desplegar preview con `pnpm deploy:preview`, ejecutar `pnpm verify:public` y, con autorización explícita para un nuevo correo, completar entrega + replay idempotente y cerrar las dos casillas restantes de F12.

## Bloqueos / avisos

- La arquitectura comercial cerrada tiene exactamente tres planes: Básico → Gestión → Inteligente. Ver `docs/adr/ADR-010-tres-planes-y-backends-demostrativos.md`; no reintroducir Inicio ni Automatiza como planes.
- Los heroes v2 de Brasca, Vedra y Solane ya se generaron con OpenAI y se sirven como AVIF responsive. Para nuevas imágenes: OpenAI integrado, nunca Higgsfield, una generación cada vez y con pausa entre solicitudes.
- Brasca escenifica Básico (web + solicitud que en una implantación real llegaría por email), Vedra es el backend demo de Gestión y Solane es Gestión ampliado con IA, automatizaciones y operación avanzada.
- La IA y las automatizaciones de Solane son demostraciones deterministas en el navegador, sin modelo, agente, proveedor ni ejecución externa.
- La entrega real de producción ya fue autorizada y validada: devolvió `202 delivered` para la referencia `da2a827b-39f0-4e65-96cf-c4a894d4fcec`, `replayed: true` al repetir exactamente el mismo payload y el usuario confirmó visualmente la llegada única en Gmail. Para cerrar F12 falta repetir el protocolo en preview después de configurar su secret; no generar otro correo sin autorización explícita.
- `logic-reserva-preview` y `logic-reserva` existen. `reserva.logic2b.com` sirve la versión `238d0d16-f456-4831-a092-66c8f6f34f56`; producción declara `LEADS_RESEND_API_KEY` como secret y su transporte ya se validó mediante entrega real. Preview no declara ningún secret: la configuración remota contiene una credencial como variable ordinaria y debe rotarse antes del deploy.
- No volver a la antigua paleta burdeos: la referencia vigente es `docs/DESIGN.md` (papel cálido + azul único).
- El servidor dev actual queda disponible en `http://localhost:8787`; si la sesión se pierde, `pnpm dev` lo recompone después de `pnpm build` cuando cambie una app estática.
- Mantener un único punto de bifurcación demo/real y la etiqueta ficticia visible en web y gestor.
- El único formulario real es el comercial de la landing. Demos y dashboards son muestras locales sin backend, correo, pagos ni integraciones.
- Preservar F7–F11: demos y E2E no deben depender de Resend; solo `/api/leads` cambia de fail-closed a transporte real cuando la configuración lo habilita.
- No alterar los rótulos de estimación ni convertir CSV/localStorage en integraciones reales.
- Mantener la fecha operativa de Solane en el día fixture aunque el CRM contenga histórico anterior.
- El contrato local de F12, la arquitectura de tres planes y la auditoría visual/accesible (incluidos los heroes v2) están completos: 54 tests de dominio, 39 de dashboard, 10 de fixtures, 9 de Worker, `pnpm check` 28/28 y `pnpm e2e` 45/45. Los dry-runs de preview y producción aceptan 113 assets. No reimplementar el transporte; continuar desde la preview.
- `pnpm verify:public` revalida preview y producción sin enviar leads; los workflows lo ejecutan después del deploy.
- Las últimas ejecuciones de `pnpm verify:public:production` y `pnpm verify:public:preview` fueron verdes el 2026-08-18; producción sirve el bundle nuevo y preview conserva el anterior hasta corregir su credencial. Heroes v2, F13, accesibilidad y F14 ya no están pendientes en el worktree.
- F13 está publicado con el nuevo copy es/en, el rediseño de la landing, las páginas comerciales ampliadas, el SEO técnico y el endurecimiento de accesibilidad. El gate conjunto mantiene `pnpm check` 28/28 y 45 escenarios E2E.
- La sesión 26 revalidó desde cero el bundle pendiente: `git diff --check`, `pnpm check` 28/28, `pnpm e2e` 43/43 y los dos dry-runs estrictos con 113 assets. No se publicó ni se modificó ningún servicio externo.
- F14 añade `?vista=espera` en Vedra/Solane, persiste una cola compatible con v1 y convierte clientes sentados en reservas `walkin` mediante el inventario único. Gates de sesión 27: dominio 54, dashboard 39, `pnpm check` 28/28, E2E 45/45 y dos dry-runs con 113 assets; revisión visual a 1366/375 sin overflow.
- El commit funcional publicado es `e86435f`. GitHub CLI no es un requisito del proyecto: para una entrega directa autorizada sobre `main`, Git nativo basta; Wrangler gestiona Cloudflare.
- Mantener el selector de rol como demostrativo, local y sin autenticación; F10 no lo convierte en una frontera de seguridad.
- Mantener estado textual además de color, copy es/en, `noindex` triple y todos los E2E F7–F11 intactos.
