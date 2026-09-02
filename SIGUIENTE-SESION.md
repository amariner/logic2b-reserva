# SIGUIENTE SESIÓN

**Fase actual:** F0–F20 completas ✅ · F0–F19 publicadas en producción · M1 presupuesto D1 cero publicado ✅ · producción Resend revalidada ✅ · correo en preview descartado por decisión de producto (2026-08-18)
**Siguiente hito:** F21 · shell comercial y hero con prueba múltiple, dentro de la paridad estructural con Logic2B Campings

## Siguiente paso concreto

1. Implementar F21 sobre el contrato de `docs/PARIDAD-CAMP.md`: cabecera, hero con prueba múltiple, captación breve y rail de ecosistema.
2. Mantener la estética aprobada de Reserva; la referencia de Camp fija estructura y profundidad, no una copia visual.
3. No alterar todavía el dashboard ni la arquitectura de tres planes. F25 empaqueta los paneles existentes y cualquier cambio de planes exige una decisión separada.
4. Mantener WhatsApp/correo transaccional en backlog hasta definir proveedor, consentimiento, permisos y observabilidad reales.
5. Preservar los gates de F19: referencia opaca, fallo seguro, cero datos de contacto y cero mutaciones colaterales.

## Bloqueos / avisos

- Dirección de producto de 2026-09-02: Logic Reserva debe alcanzar paridad estructural y comercial con `camp.logic2b.com`. El contrato, el mapa de equivalencias y los criterios globales están en `docs/PARIDAD-CAMP.md`; las fases F21–F27 sustituyen la antigua situación de roadmap agotado.
- La paridad no incluye copiar el dashboard de Camp. Reserva conserva Servicio, Plano de sala, Reservas/Espera, Grupos/Eventos, Informes e Inteligente como puertas de entrada propias del sector.
- Objetivo de portfolio: doce direcciones web, tres recorridos profundos (Brasca/Vedra/Solane) y dos niveles de gestor. No construir doce backends ni presentar integraciones previstas como activas.

- Auditoría D1 de 2026-08-25: `logic-reserva` consume 0 filas D1, no declara base ni crons y ahora tiene un fusible local a cero en `apps/worker/d1-budget.json`. Publicar el código no migra ni reemplaza datos; no relajar el gate sin ADR, presupuesto medido y autorización explícita.
- Release comercial de 2026-08-24: landing es/en, marca Logic2B, copy prudente, informes demo y capturas actualizados en `main` (`1a3a94c`) y producción (`417bcaac-0308-4a5d-a01d-e070e9bc88ee`). Gates: `pnpm check` 28/28, 132 tests, `pnpm e2e` 50/50, `pnpm fotos` reproducible 16/16 y dry-run con 143 assets; smoke público por GET verde sin enviar leads.
- `pnpm fotos` se ejecuta deliberadamente en serie: paralelizar viewports puede variar el rasterizado AVIF de Chrome y rompe el contrato de hashes reproducibles.
- El contrato vigente de seguridad está en `docs/DEMO-MODE.md` y ADR-014: los despliegues públicos usan `DEMO_MODE=true`; Brasca, Vedra y Solane no tienen efectos externos.
- La landing comercial es la única excepción real y separada: `COMMERCIAL_LEADS_ENABLED=true` permite exclusivamente `POST /api/leads`. No reutilizar ese flag para correo de restaurante, pagos, webhooks, jobs o integraciones.
- Gates de sesión 35: `pnpm check` 28/28, Worker 15/15, E2E 49/49 y dry-runs de preview/producción con 139 assets. El cambio está en `main` (`9df0ea7`) y en producción (`d7b6ca68-d0ae-44bb-ab6a-2eb75164435e`), con smoke por GET verde y sin enviar leads.
- La arquitectura comercial cerrada tiene exactamente tres planes: Básico → Gestión → Inteligente. Ver `docs/adr/ADR-010-tres-planes-y-backends-demostrativos.md`; no reintroducir Inicio ni Automatiza como planes.
- Los heroes v2 de Brasca, Vedra y Solane ya se generaron con OpenAI y se sirven como AVIF responsive. Para nuevas imágenes: OpenAI integrado, nunca Higgsfield, una generación cada vez y con pausa entre solicitudes.
- Brasca escenifica Básico (web + solicitud que en una implantación real llegaría por email), Vedra es el backend demo de Gestión y Solane es Gestión ampliado con IA, automatizaciones y operación avanzada.
- La IA y las automatizaciones de Solane son demostraciones deterministas en el navegador, sin modelo, agente, proveedor ni ejecución externa.
- Producción quedó revalidada después de la rotación: `202 delivered` para `4e13fdc8-d6fa-4125-b336-e7720b64e3d8` y replay idempotente con la misma referencia. El usuario mantiene producción como único entorno requerido para Resend.
- No volver a probar, rotar ni diagnosticar Resend en preview salvo nueva orden explícita. Preview conserva su función de rutas/SEO/cabeceras por GET; su respuesta de correo no forma parte del gate.
- `logic-reserva` sirve la versión `5027ddab-56ee-4e94-9c7f-3baef8c84365`, conserva el transporte funcional y `marinerandreu+logic@gmail.com`; la verificación pública por GET quedó verde tras desplegar F18.
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
- F17 añade `bookedAt?` compatible con localStorage v1 y un score operativo local, determinista y explicable en Informes de Solane. No es probabilidad, no recalcula depósitos y no ejecuta acciones; ADR-013 fija la frontera. Gates: 62 dominio, 45 dashboard, 10 fixtures, 10 Worker, `pnpm check` 28/28 y `pnpm e2e` 49/49.
- F18 añade `pnpm fotos`, `docs/SALES-ASSETS.md` y 16 capturas deterministas con frontera GET/HEAD local. Dos ejecuciones coincidieron 17/17 byte a byte; gates: `pnpm check` 28/28, 127 tests, `pnpm e2e` 49/49 y dry-run de producción con 139 assets.
- F18 está en `origin/main` (`1d91d63`) y producción `5027ddab-56ee-4e94-9c7f-3baef8c84365`; el manifiesto público y una captura se verificaron con GET/HEAD sin enviar leads.
- F19 debe demostrar confirmación en un clic únicamente en localStorage. El enlace se prepara pero no se envía; solicitar cambio no cancela, no libera mesa y no altera el depósito o la recomendación de F17. El transporte WhatsApp permanece en backlog.
- F15–F17 están en `origin/main` (`5514c83`, `83eb0bd`) y producción `39d8ec05-ad46-4d99-85b3-875fc16cb632`; el dry-run estricto aceptó 121 assets y el smoke público por GET quedó verde sin enviar leads.
- `pnpm verify:public` revalida preview y producción sin enviar leads; los workflows lo ejecutan después del deploy.
- Las últimas ejecuciones de `pnpm verify:public:production` y `pnpm verify:public:preview` fueron verdes el 2026-08-18; ambos entornos sirven el bundle nuevo. Heroes v2, F13, accesibilidad y F14 ya no están pendientes en el worktree.
- F13 está publicado con el nuevo copy es/en, el rediseño de la landing, las páginas comerciales ampliadas, el SEO técnico y el endurecimiento de accesibilidad. El gate conjunto mantiene `pnpm check` 28/28 y 45 escenarios E2E.
- La sesión 26 revalidó desde cero el bundle pendiente: `git diff --check`, `pnpm check` 28/28, `pnpm e2e` 43/43 y los dos dry-runs estrictos con 113 assets. No se publicó ni se modificó ningún servicio externo.
- F14 añade `?vista=espera` en Vedra/Solane, persiste una cola compatible con v1 y convierte clientes sentados en reservas `walkin` mediante el inventario único. Gates de sesión 27: dominio 54, dashboard 39, `pnpm check` 28/28, E2E 45/45 y dos dry-runs con 113 assets; revisión visual a 1366/375 sin overflow.
- El commit funcional publicado es `e86435f`. GitHub CLI no es un requisito del proyecto: para una entrega directa autorizada sobre `main`, Git nativo basta; Wrangler gestiona Cloudflare.
- Mantener el selector de rol como demostrativo, local y sin autenticación; F10 no lo convierte en una frontera de seguridad.
- Mantener estado textual además de color, copy es/en, `noindex` triple y todos los E2E F7–F11 intactos.
