# SIGUIENTE SESIÓN

**Fase actual:** F0–F26 completas ✅ · F27, auditoría diferencial y previews Camp enriquecidas cerradas localmente ✅ · F0–F19 publicadas en producción · F21–F27 pendientes de publicación autorizada · M1 presupuesto D1 cero publicado ✅ · producción Resend revalidada ✅ · correo en preview descartado por decisión de producto (2026-08-18)
**Siguiente hito:** revisión del propietario y publicación de los cambios locales solo tras autorización explícita

## Auditoría de temas del 05–06/09/2026 · cerrada localmente

Los pendientes de regresión y capturas de la sesión 59 y de la revisión comercial posterior quedan cubiertos por esta auditoría: doce webs y doce fichas en español/inglés, seis anchos de 320 a 1366 px, nueve fotos originales coherentes, menús móviles nativos, cartas sin superposición y previews de las portadas reales.

Gates: `pnpm check` 28/28 con 160 tests; 92 escenarios funcionales verificados por bloques contra Worker; 102 páginas y 3.774 referencias internas sin ausencias. Wrangler/ProxyWorker se cerraba durante pruebas largas: se utilizó el mismo bundle directamente en Miniflare/workerd, con `LEADS_TRANSPORT:disabled`.

Las 48 portadas coinciden byte a byte. Las 42 capturas contractuales pasan la comparación visual de Playwright: 40 hashes idénticos y dos diferencias minúsculas de antialiasing, registradas expresamente. Se fija Chromium Headless Shell 151.0.7922.34 y se incorpora `CAPTURE_BASELINE_DIR=/ruta/al/primer-pase pnpm fotos:comparar`; el criterio y el digest están en `docs/SALES-ASSETS.md`. El informe con las doce composiciones está en `docs/AUDITORIA-TEMAS.md`.

No se ha publicado ni enviado un lead real. Los apartados históricos siguientes describen sus ejecuciones originales; sus pendientes de auditoría quedan sustituidos por este cierre.

## Revisión UI/UX del 05/09/2026

La petición actual autoriza simplificar todas las páginas comerciales y definir precios. Sustituye la exclusión antigua de tarifas concretas: Básico 49 €/mes + 290 € de alta, Gestión 149 €/mes + 790 €, Inteligente 249 €/mes + 1.490 €, sin IVA. Justificación con fuentes primarias en `docs/COMPETENCIA.md`.

Home con los mismos 14 bloques de Camp; tipografía, composición, fotos de restaurante, jerarquía y espaciado revisados. `PricingCards.astro` es la única presentación de packs para home y Planes. `commercial.css` limita el nuevo diseño a las superficies comerciales. Se conservan todos los cambios que ya estaban en el worktree antes de esta sesión.

Auditoría de archivos compilados: 102 páginas HTML, 68 comerciales, 3.598 referencias internas, cero rutas o recursos ausentes. Navegador: home escritorio/móvil 390 px, pestañas, precios, catálogos, guías, fichas, soluciones y conservación de `plan=inteligente` en la solicitud. Los selectores y textos E2E se han alineado con el diseño; se conserva la cobertura y se añade la apertura de los detalles antes de comprobar su contenido. La paridad es estructural y visual, no un calco de píxeles al 100 %. Las 42 capturas contractuales no se han regenerado en esta revisión.

Validación final: `pnpm check` 28/28. 18 E2E contra Worker en verde antes de que Wrangler 4.123 / ProxyWorker se cerrase con `Network connection lost` (dos intentos de regresión integral interrumpidos por infraestructura local). 12/12 pruebas UI sobre el build estático en verde, incluidas las 68 páginas a 320/375/430/1366 px, filtros, fichas, planes y guías. No registrar esta combinación como 78/78. Vista estática de diseño retenida en `http://127.0.0.1:8791/`; no tiene endpoint de leads.

No se ha desplegado, enviado un lead ni cambiado servicios externos. Antes del release, conservar el gate de autorización explícita y completar la regresión visual contractual. Mapa de cambios en `docs/UI-PARIDAD-CAMP.md`.

## Siguiente paso concreto

1. Solicitar autorización antes de cualquier despliegue; el cierre local no autoriza mutar preview o producción.
2. La regresión local y la línea base visual están actualizadas; si se modifica código antes del release, repetir los checks afectados y el gate `pnpm check`.
3. Con autorización: desplegar preview, ejecutar `pnpm verify:public:preview` por GET/HEAD y revisar home, portfolio, paneles y cierre en los dos viewports contractuales.
4. Solo tras aceptar preview: publicar producción mediante el gate existente y ejecutar `pnpm verify:public:production`; cualquier prueba de lead queda fuera salvo orden expresa.

## Bloqueos / avisos

- Dirección de producto de 2026-09-02: Logic Reserva debe alcanzar paridad estructural y comercial con `camp.logic2b.com`. El contrato, el mapa de equivalencias y los criterios globales están en `docs/PARIDAD-CAMP.md`; las fases F21–F27 sustituyen la antigua situación de roadmap agotado.
- F27 queda cerrada localmente: navegación/footer comunes en las 68 páginas públicas, SEO completo, 21 escenas/42 PNG reproducibles, `pnpm check` 28/28, 160 tests, E2E 78/78 y dry-runs estrictos con 328 assets. Preview y producción siguen intactos.
- La reauditoría del Camp vivo del 2026-09-04 confirma 14/14 bloques y refuerza el cierre con tres pruebas comerciales y contacto directo en el footer compartido. Gates incrementales: E2E 4/4 y responsive 2/2 sobre las treinta rutas a 320/375 px. Precios concretos, toggle mensual/anual y capacidades no activas siguen fuera de alcance de forma deliberada.
- La paridad interactiva añade previews accesibles para 12 webs y 6 paneles, con evidencia, límite honesto, CTA de contacto y enlace profundo separados. El contacto conserva ahora el slug canónico mediante `?theme=` o `?panel=`, aterriza en `#contact-form`, muestra interés + plan derivado y lo entrega como contexto validado del mismo lead. Fallback sin JavaScript y rutas es/en permanecen íntegros.
- Las ofertas de home y `/planes/` conservan ahora el plan canónico hasta el formulario mediante `?plan=basico|gestion|inteligente`, separan contacto de evidencia y reutilizan el `level` existente sin ampliar backend. ES/EN y mobile están cubiertos; E2E integral 74/74. Dos pases de 42/42 capturas fijan el digest `8b10d47326d57f17422af0146f02d43e20b7f5013472f7b09720000ce483ac15`.
- El formulario de proyecto reduce fricción como el cierre de Camp: teléfono y mensaje opcionales, con nombre, restaurante, email, plan y privacidad aún obligatorios. Reutiliza el contrato y transporte existentes, documenta los datos en Privacidad es/en y conserva fail-closed local. Gates: 159 tests, E2E 74/74 y QA a 1366/375/320 px; no se envió ningún lead.
- Gates de sesión 53: `pnpm check` 28/28 con 159 tests; E2E 74/74 ejecutado por bloques tras una caída conocida del proxy local de Wrangler 4.123; QA del contexto a 1366/375 px; 42/42 capturas reproducibles con digest `8b10d47326d57f17422af0146f02d43e20b7f5013472f7b09720000ce483ac15`; dry-runs de preview/producción con 251 assets, 566,81 KiB y 84,85 KiB gzip. Nada desplegado y ningún lead enviado.
- La sesión 54 añade dirección ficticia y tres metadatos canónicos a cada preview, igualando la orientación comercial observada en Camp sin simular infraestructura. QA 1280×720/375×812, F26 5/5, táctiles 1/1, dos pases de 42/42 con el mismo digest y dry-runs de 251 assets; preview y producción permanecen intactos.
- La sesión 55 añade seis fichas de panel por idioma, elevando el sitio a 42 páginas públicas. Home y catálogo conducen a explicación → contacto contextual o demo reproducible; sitemap/SEO, teclado, targets y responsive quedan cubiertos. Dos pases visuales conservan el digest `8b10d47326d57f17422af0146f02d43e20b7f5013472f7b09720000ce483ac15`; los dry-runs quedan en 276 assets, 566,81 KiB y 84,85 KiB gzip, sin publicación.
- La sesión 56 añade doce fichas de web por idioma y eleva el sitio a 66 páginas públicas. Cada dirección pasa por una explicación indexable con captura, alcance, contacto contextual, demo y temas relacionados; se conserva `X-Frame-Options: DENY`. Gates: `pnpm check` 28/28 con 160 tests, E2E 76/76, dos pases visuales con el mismo digest y dry-runs de 325 assets, sin publicación.
- La sesión 57 añade `/empezar/` y `/en/empezar/`: plan, web o panel llegan a una página comercial enfocada con contexto visible, tres garantías, WhatsApp y el formulario compartido. El sitio alcanza 68 páginas; gates: `pnpm check` 28/28 con 160 tests, E2E 77/77, QA escritorio/375 px, dos pases visuales idénticos y dry-runs de 328 assets, sin publicación ni lead real.
- La sesión 58 convierte «Ver recorrido» en una guía bilingüe real de seis hitos entre home, temas, Vedra, paneles, Plano e inicio con Gestión. Persiste únicamente mediante `?recorrido=`, conserva otros parámetros al salir y no escribe ni amplía capacidades. Gates: `pnpm check` 28/28 con 160 tests, E2E 78/78, QA escritorio/375 px, dos pases visuales 42/42 y dry-runs de 328 assets; digest vigente `eee79bb14e6e568843d4e3e26a326c4938ca80ec20c6cd03e0e94fd58b8d9e5d`, sin publicación ni lead real.
- La sesión 59 sustituye el lead parcial del hero por una transición a `/empezar/`: el correo viaja en fragmento local, desaparece de la URL, prellena la solicitud es/en y nunca llega al servidor antes del consentimiento. `pnpm check` 28/28, E2E dirigido 1/1 y QA 1366/375 px; la regresión integral fue interrumpida a 20/78 en verde para atender la petición de integración inmediata. Repetir E2E completo y `pnpm fotos` antes de desplegar.
- La configuración de cookies es global en las 68 páginas comerciales: se reabre desde el footer, distingue estado necesario de permiso para analítica futura y conserva `logic-reserva-consent-v1`; no carga ninguna analítica. QA visual 1366×900/375×812. Tras el inicio comercial, los dry-runs quedan en 328 assets, 566,81 KiB y 84,85 KiB gzip.
- La paridad no incluye copiar el dashboard de Camp. Reserva conserva Servicio, Plano de sala, Reservas/Espera, Grupos/Eventos, Informes e Inteligente como puertas de entrada propias del sector.
- F23 ya fija el portfolio: doce direcciones web, tres recorridos profundos (Brasca/Vedra/Solane) y nueve webs compartidas sin backend. `packages/config/src/themes.ts` es la fuente única; no duplicar sus datos ni presentar las nueve direcciones como motores activos.
- F24 ya fija el catálogo de gestor: seis entradas comerciales, cinco de Gestión y una Inteligente. `packages/config/src/panels.ts` es la fuente única; reutiliza capturas F18 y enlaza estados reproducibles de Vedra/Solane sin crear otro dashboard.
- F25 fija la oferta y las guías: `packages/config/src/commercial.ts` conserva los tres planes de ADR-010 y `packages/config/src/guides.ts` las cinco guías por rol. El home debe reutilizarlos, no mantener una segunda lista ni publicar precios, SLA o integraciones no aprobadas.
- `pnpm fotos` genera ahora 21 escenas/42 PNG: ocho evidencias profundas, nueve heroes web y cuatro escenas comerciales. Mantener captura en serie, render software, decodificación completa, etiqueta ficticia/cabecera comercial, GET/HEAD local, reloj fijo y los dos viewports contractuales.
- El runner Playwright pasa `LEADS_TRANSPORT:disabled` solo al Worker local. No trasladar ese override a producción: evita un cierre de Wrangler 4.123 al registrar la configuración local incompleta y conserva la respuesta fail-closed sin llamadas externas.

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
- No queda un servidor dev retenido; `pnpm build` recompone las apps estáticas y `pnpm dev` inicia el Worker local cuando haga falta.
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
