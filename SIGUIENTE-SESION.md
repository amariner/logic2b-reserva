# SIGUIENTE SESIÓN

**Fase actual:** F0–F16 completas en local ✅ · producción Resend revalidada ✅ · correo en preview descartado por decisión de producto (2026-08-18)
**Siguiente hito:** promover la predicción explicable de no-show del plan Inteligente a F17

## Siguiente paso concreto

1. Convertir «Predicción de no-show con IA» en una fase formal y acotarla como recomendación determinista, explicable y completamente local.
2. Derivar señales auditables de canal, histórico, tamaño de grupo, antelación y franja; no cambiar el depósito ya aceptado ni inventar precisión estadística.
3. Mostrar evidencia y límites en Solane, con copy es/en, permisos actuales y cobertura de dominio/E2E sin modelos, agentes, proveedores ni nuevas escrituras de red.

## Bloqueos / avisos

- La arquitectura comercial cerrada tiene exactamente tres planes: Básico → Gestión → Inteligente. Ver `docs/adr/ADR-010-tres-planes-y-backends-demostrativos.md`; no reintroducir Inicio ni Automatiza como planes.
- Los heroes v2 de Brasca, Vedra y Solane ya se generaron con OpenAI y se sirven como AVIF responsive. Para nuevas imágenes: OpenAI integrado, nunca Higgsfield, una generación cada vez y con pausa entre solicitudes.
- Brasca escenifica Básico (web + solicitud que en una implantación real llegaría por email), Vedra es el backend demo de Gestión y Solane es Gestión ampliado con IA, automatizaciones y operación avanzada.
- La IA y las automatizaciones de Solane son demostraciones deterministas en el navegador, sin modelo, agente, proveedor ni ejecución externa.
- Producción quedó revalidada después de la rotación: `202 delivered` para `4e13fdc8-d6fa-4125-b336-e7720b64e3d8` y replay idempotente con la misma referencia. El usuario mantiene producción como único entorno requerido para Resend.
- No volver a probar, rotar ni diagnosticar Resend en preview salvo nueva orden explícita. Preview conserva su función de rutas/SEO/cabeceras por GET; su respuesta de correo no forma parte del gate.
- `logic-reserva` conserva la versión `238d0d16-f456-4831-a092-66c8f6f34f56`, el transporte funcional y `marinerandreu+logic@gmail.com`; producción no fue modificada durante el diagnóstico.
- No volver a la antigua paleta burdeos: la referencia vigente es `docs/DESIGN.md` (papel cálido + azul único).
- El servidor dev actual queda disponible en `http://localhost:8787`; si la sesión se pierde, `pnpm dev` lo recompone después de `pnpm build` cuando cambie una app estática.
- Mantener un único punto de bifurcación demo/real y la etiqueta ficticia visible en web y gestor.
- El único formulario real es el comercial de la landing. Demos y dashboards son muestras locales sin backend, correo, pagos ni integraciones.
- Preservar F7–F11: demos y E2E no deben depender de Resend; solo `/api/leads` cambia de fail-closed a transporte real cuando la configuración lo habilita.
- No alterar los rótulos de estimación ni convertir CSV/localStorage en integraciones reales.
- Mantener la fecha operativa de Solane en el día fixture aunque el CRM contenga histórico anterior.
- El contrato local de F12, la arquitectura de tres planes, F14 y F15 están completos: 57 tests de dominio, 41 de dashboard, 10 de fixtures, 10 de Worker, `pnpm check` 28/28 y `pnpm e2e` 46/46. Los dry-runs de preview y producción aceptan 121 assets. No reimplementar el transporte ni probar Resend en preview.
- F15 añade rutas bilingües de bonos y `?vista=bonos`: emisión y canje exclusivamente locales, valor ficticio auditable, Dirección/Sala operan y Cocina consulta. ADR-012 contiene los límites.
- F16 añade navegación inferior compartida y agenda vertical de Vedra en móvil; las vistas secundarias siguen disponibles en «Más» y el escritorio conserva su barra lateral y cronología. Gates: `pnpm check` 28/28 y `pnpm e2e` 48/48.
- `pnpm verify:public` revalida preview y producción sin enviar leads; los workflows lo ejecutan después del deploy.
- Las últimas ejecuciones de `pnpm verify:public:production` y `pnpm verify:public:preview` fueron verdes el 2026-08-18; ambos entornos sirven el bundle nuevo. Heroes v2, F13, accesibilidad y F14 ya no están pendientes en el worktree.
- F13 está publicado con el nuevo copy es/en, el rediseño de la landing, las páginas comerciales ampliadas, el SEO técnico y el endurecimiento de accesibilidad. El gate conjunto mantiene `pnpm check` 28/28 y 45 escenarios E2E.
- La sesión 26 revalidó desde cero el bundle pendiente: `git diff --check`, `pnpm check` 28/28, `pnpm e2e` 43/43 y los dos dry-runs estrictos con 113 assets. No se publicó ni se modificó ningún servicio externo.
- F14 añade `?vista=espera` en Vedra/Solane, persiste una cola compatible con v1 y convierte clientes sentados en reservas `walkin` mediante el inventario único. Gates de sesión 27: dominio 54, dashboard 39, `pnpm check` 28/28, E2E 45/45 y dos dry-runs con 113 assets; revisión visual a 1366/375 sin overflow.
- El commit funcional publicado es `e86435f`. GitHub CLI no es un requisito del proyecto: para una entrega directa autorizada sobre `main`, Git nativo basta; Wrangler gestiona Cloudflare.
- Mantener el selector de rol como demostrativo, local y sin autenticación; F10 no lo convierte en una frontera de seguridad.
- Mantener estado textual además de color, copy es/en, `noindex` triple y todos los E2E F7–F11 intactos.
