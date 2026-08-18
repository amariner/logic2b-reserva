# PROGRESS — Logic Reserva

Una entrada por sesión, la más reciente arriba. Formato: fecha · fase · qué se hizo · estado del check.

---

## 2026-08-18 · Sesión 28 · GitHub y producción actualizados; preview requiere rotación ⚠️

- El bundle conjunto de heroes v2, F13, accesibilidad y F14 se revalidó desde el worktree: `git diff --check`, `pnpm check` 28/28, `pnpm e2e` 45/45 y dry-runs estrictos de preview y producción con 113 assets.
- Los 52 archivos del paquete se consolidaron directamente sobre `main` en `e86435f` (`Completa web comercial y lista de espera`) y se publicaron en `origin/main` mediante Git nativo; GitHub CLI no era necesario para este flujo autorizado.
- Producción se desplegó correctamente en Cloudflare con 54 assets nuevos o modificados, versión `238d0d16-f456-4831-a092-66c8f6f34f56`; `pnpm verify:public:production` validó por GET las rutas, SEO, API y cabeceras públicas.
- Preview abortó antes de subir ningún archivo porque `--strict` detectó deriva remota: `LEADS_RESEND_API_KEY` estaba configurada como variable de texto ordinaria y el destinatario no coincidía con el contrato versionado. Wrangler expuso el valor durante el diagnóstico, por lo que esa credencial debe revocarse y sustituirse por un secret cifrado antes de desplegar preview.
- No se forzó la configuración, no se reutilizó la credencial expuesta y no se envió ningún lead. Producción conserva su secret cifrado independiente y el destinatario `marinerandreu+logic@gmail.com`.

## 2026-08-18 · Sesión 27 · Lista de espera y walk-ins completados ✅

- F14 promueve la lista de espera desde backlog: Vedra y Solane incorporan una vista bilingüe compartida para alta, espera comunicada, aviso local, cancelación y asiento; no existen SMS, mensajes ni escrituras de red.
- El dominio convierte una entrada activa en `TableBooking` con origen `walkin`, estado `seated` y la opción mínima devuelta por `tableAvailability`; reservas, eventos publicados y privatizaciones bloqueadas participan en el mismo cálculo.
- Los payloads locales v1 aceptan el campo aditivo `waitlist` con parser defensivo. Los estados terminales no se reabren y una entrada sin mesa permanece en cola.
- Solane aplica permisos en interfaz y mutación: Dirección y Sala operan; Cocina solo consulta. La decisión está registrada en `docs/adr/ADR-011-lista-espera-inventario-unico.md`.
- Gates: 54 tests de dominio, 39 tests de dashboard, `pnpm check` 28/28 y `pnpm e2e` 45/45. Revisión renderizada a 1366×900 y 375×812 sin overflow; a 375 px las tres acciones ocupan 277 px y se apilan correctamente. Dry-runs estrictos de preview y producción aceptan 113 assets y todos los bindings esperados.
- El usuario autorizó consolidar, subir y desplegar el worktree. La publicación sigue sin iniciarse porque la skill `github:yeet` exige GitHub CLI y `gh` no está instalado; el secret y el correo real de preview permanecen fuera de esta autorización.

## 2026-08-18 · Sesión 26 · Bundle pendiente revalidado ✅

- Revisión del worktree acumulado F13 + heroes v2 + accesibilidad sin introducir cambios funcionales adicionales: `git diff --check` limpio y `pnpm check` 28/28.
- Regresión integral de navegador repetida sobre el bundle compuesto: `pnpm e2e` 43/43, incluidos SEO bilingüe, responsive, accesibilidad y los recorridos completos de Brasca, Vedra y Solane.
- Dry-runs estrictos ejecutados secuencialmente para preview y producción: ambos aceptan 113 assets, 563,03 KiB y los bindings esperados. No se desplegó, no se configuraron secrets y no se generó ningún lead.
- El siguiente paso continúa requiriendo autorización para modificar servicios externos: consolidar/publicar el worktree, desplegar el bundle y completar el secret + protocolo de entrega real en preview. GitHub CLI sigue ausente.

## 2026-08-18 · Sesión 25 · Estado público y secrets auditados ✅

- `pnpm verify:public` vuelve a validar por GET todas las rutas, SEO, API y cabeceras de preview y producción; no se enviaron leads ni se modificó ningún recurso remoto.
- Wrangler continúa autenticado en la cuenta esperada. La lectura de nombres de secrets confirma el estado exacto de F12: preview no declara ninguno y producción declara únicamente `LEADS_RESEND_API_KEY`; no se expuso ningún valor.
- El bundle local F13 + heroes v2 + accesibilidad sigue pendiente de publicación. GitHub CLI continúa ausente y el secret de preview requiere una sesión autenticada en Resend; ambos pasos necesitan intervención del usuario.

## 2026-08-18 · Sesión 24 · Accesibilidad comercial y gates revalidados ✅

- Auditoría renderizada en el navegador sobre landing, páginas de intención, las tres demos y ambos gestores: se incorporó navegación de salto al contenido en es/en, se corrigió el contraste AA de texto pequeño y se normalizaron a 44 px los objetivos táctiles efectivos.
- La regresión E2E cubre ahora teclado, contraste y tamaño de controles en todas las rutas públicas y demostrativas. Gates finales: `pnpm check` 28/28 y `pnpm e2e` 43/43.
- Dry-runs estrictos de preview y producción correctos con 113 assets, 563,03 KiB y todos los bindings esperados; no se desplegó ni se envió ningún lead.
- `pnpm verify:public` confirmó por GET que la preview y producción actualmente publicadas siguen sanas antes de recibir el nuevo bundle.
- La publicación en GitHub sigue pendiente porque `gh` no está instalado; el worktree permanece sobre `main` sin commit nuevo y `origin/main` está sincronizado.

## 2026-08-18 · Sesión 23 · Web comercial y SEO orientados a conversión ✅

- Landing reconstruida alrededor de un hilo cliente: el coste de conciliar canales, la respuesta del inventario único, la prueba en tres restaurantes, el alcance adecuado, el coste de intermediación y una conversación centrada en el servicio.
- Hero asimétrico y responsive con copy vendedor específico para restauración, demostración operativa visible y acciones diferenciadas; se eliminó la entrada decorativa genérica.
- Brasca, Vedra y Solane usan en la landing los heroes editoriales AVIF existentes con `picture`, `srcset`, `sizes`, dimensiones y alt bilingüe. No se generaron activos nuevos ni se alteraron las fuentes ya presentes.
- Planes, restaurantes y grupos/eventos pasan de páginas resumen a páginas de intención completas: tres capítulos operativos, resultados para el equipo, FAQ e interlinking contextual en es/en.
- SEO reforzado en todas las rutas públicas con títulos/descripciones únicos, canonical, hreflang/x-default, Open Graph, Twitter Card, directivas robots, sitemap con alternates/lastmod/prioridad y JSON-LD por entidad, servicio, breadcrumb y FAQ.
- Nueva cobertura E2E para schema, social cards, snippets de 100–160 caracteres, títulos ≤60, canonicals, alternates, H1 único e imágenes de las demos.
- QA final: `pnpm check` 28/28 y `pnpm e2e` 36/36; revisión visual local a 1366×900 y 375×812 sin overflow. No se desplegó ni se envió ningún lead.

## 2026-08-18 · Sesión 22 · Transporte real e idempotencia validados ✅

- Con autorización explícita se envió a producción un único lead controlado, rotulado `Logic Reserva · PRUEBA INTERNA - NO CONTACTAR`, sin datos personales reales.
- Primera respuesta de `https://reserva.logic2b.com/api/leads`: `202 delivered`, referencia `da2a827b-39f0-4e65-96cf-c4a894d4fcec`.
- La repetición byte a byte del mismo JSON devolvió `202`, la misma referencia y `replayed: true`; el Durable Object evitó una segunda llamada de entrega.
- Llegada confirmada por el usuario mediante captura de Gmail: asunto correcto, remitente `Logic Reserva <hola@logic2b.com>`, destinatario esperado y referencia exacta `da2a827b-39f0-4e65-96cf-c4a894d4fcec`. Junto con `replayed: true`, la evidencia confirma una única entrega real.
- GitHub CLI (`gh`) continúa sin estar instalado, por lo que los heroes v2 permanecen en el worktree y no se ha ejecutado el flujo de publicación `github:yeet`.

## 2026-08-18 · Sesión 21 · Heroes editoriales generados con OpenAI ✅

- Nuevos heroes 4:3 para Brasca, Vedra y Solane creados con la herramienta integrada de OpenAI, mediante tres solicitudes independientes y pausas entre ellas; no se utilizó Higgsfield.
- Fuentes PNG conservadas como `apps/web/assets/heroes/generated/*-v2.png`; los SVG y AVIF anteriores permanecen intactos para una reversión sencilla.
- Procedencia, ejecución secuencial y prompts normalizados documentados junto a las fuentes; tests unitarios y E2E fijan explícitamente las rutas `v2` y comprueban que los nueve AVIF existen y se sirven como `image/avif`.
- `scripts/images.mjs` actualizado para generar de forma reproducible nueve AVIF `*-v2-{640,960,1600}.avif`, y los fixtures de las tres marcas apuntan a las nuevas bases de imagen.
- QA visual local en navegador a 1366 y 375 px: identidad diferenciada de las tres marcas, `srcset` correcto (1600/640), carga completa y cero overflow horizontal.
- Gates finales: `pnpm check` 28/28 (incluidos 10 tests de fixtures) y `pnpm e2e` 34/34. Los dry-runs de preview y producción aceptan 112 assets y todos los bindings esperados sin publicar nada. F12 sigue pendiente exclusivamente de una entrega real de correo autorizada y de configurar el secret de preview.
- `pnpm verify:public` vuelve a validar preview y producción mediante peticiones GET; no se publicaron los heroes v2 ni se generaron leads durante esta comprobación.

## 2026-08-17 · Sesión 20 · GitHub y producción actualizados ✅

- Todo el desarrollo F1–F12 consolidado sobre `main` y publicado en GitHub en el commit `76f2a09` después de comprobar que `origin/main` no contenía cambios adicionales.
- Gate previo a la publicación: `pnpm check` 28/28; se mantienen los 34/34 E2E de la sesión anterior sobre el mismo bundle.
- Producción actualizada en Cloudflare Workers. Se sustituyó la configuración remota duplicada (ruta wildcard + dominio personalizado) por el único dominio personalizado declarado en el repositorio: `reserva.logic2b.com`.
- El Worker publicado conserva `LEADS_RESEND_API_KEY` y aplica `LEADS_INTERNAL_RECIPIENT="marinerandreu+logic@gmail.com"`. No se envió ningún lead ni correo de prueba.
- `pnpm verify:public:production` verde mediante peticiones GET; landing, demos, SEO, API y cabeceras responden correctamente. El dry-run estricto posterior vuelve a pasar sin divergencias de configuración.

## 2026-08-17 · Sesión 19 · Tres planes y dos backends demostrativos ✅

- Arquitectura comercial consolidada en tres planes: Básico, Gestión e Inteligente. El antiguo Automatiza desaparece y sus capacidades pasan a Inteligente.
- Brasca queda como evidencia del plan Básico (web y solicitud por email en una implantación real), Vedra como backend demostrativo de Gestión y Solane como el mismo sistema ampliado con operación avanzada.
- Solane incorpora en Informes un asistente de decisiones y un centro de automatizaciones calculados localmente sobre fixtures; ambos declaran que son una demostración sin modelo ni servicio externo conectado. Vedra conserva exclusivamente la capa de organización.
- Dominio, configurador, formulario comercial, copy es/en y pruebas usan el contrato `basico | gestion | inteligente`. Los formularios de las marcas y todas las acciones de dashboards siguen sin red; solo la landing comercial llama a `/api/leads`.
- Decisión registrada en `docs/adr/ADR-010-tres-planes-y-backends-demostrativos.md`. Gates finales: `pnpm check` 28/28, `pnpm e2e` 34/34 y dry-runs de preview/producción correctos con 103 assets y el destinatario esperado; no se publicó nada.

## 2026-08-17 · Sesión 18 · Destinatario comercial y frontera demo ✅

- Destinatario único de la captación cambiado a `marinerandreu+logic@gmail.com` en producción y preview, pruebas del transporte, runbook y contrato de proyecto.
- Nuevo `verify-demo-boundaries.mjs`: exige que la única llamada a `/api/leads` viva en `Landing.astro` y prohíbe `fetch`, XHR, WebSocket, EventSource, `sendBeacon` y acciones de formulario en fuentes de demos/dashboard.
- E2E de los recorridos completos Vedra y Solane reforzados: cualquier petición distinta de GET hace fallar la prueba. La interacción continúa únicamente en `localStorage`, sin backend, correo, pagos ni integraciones.
- `verify-deploy-config.mjs` fija el destinatario exacto en ambos entornos para impedir regresiones de configuración. Los Workers públicos todavía necesitan un deploy autorizado para aplicar esta variable.
- Gates finales: `pnpm check` 28/28, `pnpm e2e` 34/34 y dry-runs de preview/producción correctos; ambos muestran `LEADS_INTERNAL_RECIPIENT="marinerandreu+logic@gmail.com"` sin publicar cambios.

## 2026-08-17 · Sesión 17 · Gate integral y estado real de secrets ✅

- Revalidación completa del repositorio sin alterar el trabajo acumulado: `pnpm check` termina 28/28 y `pnpm e2e` 34/34, incluidos los flujos responsive, inventario único, depósitos, privatizaciones, roles, CRM y guion Solane.
- Dry-runs de preview y producción correctos: 103 assets, 563,04 KiB, Durable Object, assets y variables públicas esperadas; ninguna publicación realizada.
- Auditoría externa de solo lectura: landing, demo Solane, `robots.txt` y `sitemap.xml` siguen en 200 con cabeceras de seguridad; las demos conservan `x-robots-tag: noindex, nofollow` en preview y producción.
- La auditoría pública ya es reproducible mediante `pnpm verify:public`: solo usa GET, valida ES/EN, canonical de sitemap, exclusiones de robots, noindex doble, respuestas 405/404 de API y cabeceras. Los workflows la ejecutan automáticamente después de cada deploy y reintentan durante la propagación.
- Estado de secrets corregido respecto a la sesión anterior: preview no declara ninguno; producción sí declara `LEADS_RESEND_API_KEY`. Wrangler no expone ni valida su valor.
- No había sesión iniciada en Resend, por lo que no se pudo confirmar la autorización de `hola@logic2b.com`. No se introdujeron credenciales, no se enviaron leads y no se modificó Cloudflare.

## 2026-08-17 · Sesión 16 · Preview Cloudflare publicada ✅

- Workers renombrados definitivamente: preview `logic-reserva-preview` y producción `logic-reserva`. Las claves `logic-reserva-demo-*-v1` se conservan porque son contratos locales versionados de las experiencias, no nombres de infraestructura.
- Preview creada y actualizada en `https://logic-reserva-preview.marinerandreu.workers.dev`, con assets, versión y Durable Object propios. `routes: []` mantiene el dominio de producción fuera de alcance.
- Validación externa: landing ES/EN, demos representativas, `robots.txt` y `sitemap.xml` responden 200; todas las páginas pasan por el Worker y reciben `nosniff`, `DENY`, referrer/permissions policy; demos añaden `x-robots-tag: noindex, nofollow`.
- `LEADS_RESEND_API_KEY` no existe aún en preview. Una solicitud con datos ficticios devolvió `disabled(503)` y no pudo enviar correo; no se realizó ninguna entrega real.
- Corregida una carrera de hidratación en los gestores: la carga inicial de localStorage es idempotente y el selector de rol permanece deshabilitado hasta completarla. El escenario Cocina pasó 10/10 repeticiones; `pnpm check`: ✅ 28/28; `pnpm e2e`: ✅ 34/34.
- Producción creada como Worker independiente `logic-reserva` y conectada a `reserva.logic2b.com` mediante Custom Domain. Cloudflare creó el DNS y TLS; la comprobación externa obtuvo certificado válido, 200 en rutas/SEO, cabeceras de seguridad y `x-robots-tag` en demos.
- Producción tampoco tiene `LEADS_RESEND_API_KEY`: una solicitud ficticia devolvió `disabled(503)` sin enviar correo. Preview permanece aislada y operativa con 200.

## 2026-08-17 · Sesión 15 · Preview aislada y runbook F12 ✅

- Configuración Wrangler separada en dos recursos: producción `logic-reserva` con `workers_dev=false` y dominio personalizado `reserva.logic2b.com`; preview `logic-reserva-preview` con `routes: []`, workers.dev y sus propios vars, Durable Object y migración.
- Scripts explícitos para deploy/dry-run de ambos entornos. Producción selecciona el nivel raíz con `--env=""`; preview usa `--env preview`. Los dos dry-runs compilan 103 assets/563 KiB, declaran todos los bindings y terminan sin subir nada ni emitir advertencias.
- `verify-deploy-config.mjs` forma parte del test del Worker y falla ante nombre compartido, ruta heredada, workers.dev en producción o bindings/migraciones ausentes en preview.
- Workflow manual de preview con doble gate (`PREVIEW` + `RESERVA_PREVIEW_ENABLED=true`) y workflow de producción reforzado con dry-run previo. Runbook completo en `docs/DEPLOY.md`, incluida configuración interactiva del secret, prueba idempotente y límites de autorización.
- Auditoría Cloudflare solo lectura: no existían todavía ni `logic-reserva` ni `logic-reserva-preview`; no se había creado ningún recurso. `pnpm check`: ✅ 28/28; `pnpm e2e`: ✅ 34/34.

## 2026-08-17 · Sesión 14 · Auditoría visual contra DESIGN ✅

- Landing, landing en inglés, Brasca, Vedra y Solane revisadas sobre el bundle local en navegador. Se confirmó el canvas `#f6f5f4`, CTA azul único, acentos planos, tarjetas a 12 px, serif solo editorial, mockup como única superficie elevada y separación de identidad entre las tres marcas.
- El aviso de consentimiento se redujo de 520 a 400 px: a 1280 × 720 comienza en x=860 y la CTA secundaria termina en x=810, por lo que conserva 50 px de separación. Una nueva E2E fija este invariante de conversión.
- Gestores Vedra/Solane alineados con la regla «sin sombras ni gradientes»: navegación activa mediante borde, tarjetas mediante hairline, marcas de inventario mediante `outline` y guía de media franja mediante una línea plana. QA renderizado confirma `box-shadow: none`, `background-image: none` y cero overflow.
- La recomendación inicial y el nivel del formulario siguen sincronizados en Gestión. `pnpm check`: ✅ 28/28; `pnpm e2e`: ✅ 34/34. El entorno recompuesto continúa en `http://localhost:8788`.
- Auditoría externa solo lectura: Wrangler está autenticado, pero el Worker `logic-reserva` todavía no existe en la cuenta; por tanto tampoco hay secrets ni deployments que validar. No se creó ni modificó ningún recurso.

## 2026-08-17 · Sesión 13 · F12 infraestructura local de leads ✅

- `/api/leads` ya valida con Zod y consentimiento explícito, usa honeypot, limita a 5 solicitudes/minuto por IP y coordina idempotencia de 24 h mediante Durable Objects. Las entregas válidas usan Resend con `idempotency-key` y destinatario interno `marinerandreu+logic@gmail.com`; una entrega fallida no se cachea ni se presenta como éxito.
- Contrato HTTP probado para `delivered(202)`, `invalid(400)`, `limited(429)`, `failed(502)` y `disabled(503)`. La configuración se valida sin registrar valores sensibles y el entorno local falla cerrado porque `LEADS_RESEND_API_KEY` no está configurado.
- Landing es/en conectada al payload explícito, con consentimiento, estados de éxito/límite/fallo y copy de privacidad coherente. La FAQ distingue los datos ficticios de las demos de los datos que el usuario decide enviar por el formulario comercial.
- Workflow manual preparado con doble gate (`DEPLOY` escrito + `RESERVA_DEPLOY_ENABLED == 'true'`), gates de calidad y Chromium instalado explícitamente. El secreto, la prueba de email real y el despliegue permanecen fuera del repositorio y no se han ejecutado.
- Prueba de humo local: método no permitido 405, payload inválido 400, configuración sin secret 503 y cabeceras de seguridad presentes. `pnpm check`: ✅ 28/28 (50 dominio, 32 dashboard, 8 fixtures, 9 worker); `pnpm e2e`: ✅ 33/33.

## 2026-08-17 · Sesión 12 · F11 i18n + E2E integral + pulido ✅

- Espejo es/en auditado en site, páginas auxiliares y tres demos. El copy de apoyo condicionado se resuelve antes del marcado; no quedan ternarios de locale dentro de JSX/Astro renderizado.
- Nuevo E2E «guion de demo comercial» ejecuta los cinco pasos Solane en un único contexto: plano libre → evento publicado y mesas bloqueadas → reserva directa con menú y depósito → no-show proporcional → CRM, CSV e informe estimado.
- Accesibilidad reforzada: las mesas Vedra y Solane exponen nombre, estado y capacidad/detalle en su nombre accesible; foco visible y `prefers-reduced-motion` se conservan en los tres sistemas visuales.
- Los tres heroes prueban `<picture>`, AVIF 640/960/1600 con `srcset`, carga prioritaria y movimiento reducido. Las rutas representativas mantienen cero overflow/errores a 320/375/430/1366 px, cubriendo la revisión requerida a 375/1366.
- `pnpm check`: ✅ 28/28 (50 tests dominio, 32 dashboard, 8 fixtures); `pnpm e2e`: ✅ 33/33. F0–F11 quedan implementadas sin deploy ni integraciones externas.

## 2026-08-17 · Sesión 11 · F10 CRM + informes + calculadora ✅

- Fixture CRM explícito para Solane con perfiles ficticios, alergias y notas de sala; histórico añadido en fechas anteriores sin desplazar la fecha operativa de eventos. La ficha agrupa por contacto, muestra reservas/cubiertos y calcula gasto solo sobre visitas finalizadas con menú conocido.
- Exportación CSV real desde el navegador, sin red: nombre fechado, cabeceras, histórico, gasto, alergias y notas. El serializador escapa comillas, saltos y posibles fórmulas; test unitario y E2E descargan y leen el archivo.
- Capa analítica compartida para Solane y Vedra: ocupación por servicio, fuentes, cubiertos directos, estimación sectorial de no-shows y `marketplaceSavings`. Solane muestra el conjunto Inteligente y Vedra el subset básico.
- Todas las cifras declaran que proceden de la muestra ficticia. La calculadora conserva el rótulo exacto «estimación basada en tarifas publicadas por terceros» y el E2E lo comprueba de forma independiente; criterios registrados en ADR-008.
- QA visual/DOM de CRM e informes y responsive de las nuevas rutas a 320/375/430/1366 px. `pnpm check`: ✅ 28/28 (50 tests dominio, 32 dashboard); `pnpm e2e`: ✅ 31/31.

## 2026-08-17 · Sesión 10 · F9 Privatizaciones + roles ✅

- Estado Solane v1 ampliado de forma aditiva con privatizaciones, rol activo y progreso del tour; acepta payloads F7–F8 y valida propuesta, señal, transición de estados e inventario antes de restaurar datos locales.
- Nueva vista `?vista=privatizaciones` con recorrido guiado de tres pasos y modo libre: preparar menú/precio/mínimo, registrar señal ficticia y bloquear el espacio Privado. El plano marca SP1–SP4 como privatizadas y el widget las retira mediante `tableAvailability`.
- Selector demostrativo Dirección/Sala/Cocina persistente. `canOperate` se aplica tanto al estado como a la interfaz: Cocina conserva contexto de consulta pero no puede sentar, cobrar no-shows, publicar eventos ni operar privatizaciones; Sala solo puede sentar.
- Tests de dominio ampliados a 50 y dashboard a 29. E2E nuevos cubren el flujo `requested → proposed → deposit_paid → blocked`, la desaparición del Privado y los permisos negativos de Cocina.
- QA visual y de DOM del tour en navegador. `pnpm check`: ✅ 28/28 tareas; `pnpm e2e`: ✅ 30/30. Alcance y límite de seguridad del selector registrados en ADR-007.

## 2026-08-17 · Sesión 9 · F8 Depósitos anti no-show ✅

- Widget Solane conectado a `riskTier` y `depositFor`: señales visibles de grupo, viernes noche y primera visita; política demo explícita bajo/medio/alto = 0/25/50 % sobre el menú completo, siempre en céntimos.
- Desglose previo a reservar con subtotal, porcentaje e importe; consentimiento obligatorio con `termsAcceptedAt` visible. La pasarela usa `<dialog>`, no contiene campos de tarjeta y declara «Pasarela neutra · demo — no se realizará ningún cobro».
- El contrato Solane v1 conserva depósitos de forma aditiva; el parser recalcula y compara el desglose para rechazar importes manipulados. `resolveSolaneBookingDeposit` delega en `noShowCharge`; 13 tests Solane cubren parseo, corrupción, cargo, liberación y roundtrip (26 tests de dashboard).
- Reservas del gestor muestra un panel legal lateral, desglose y aceptación fechada. No-show aplica como máximo el importe proporcional y sentado libera automáticamente la retención; ambos desenlaces persisten tras recarga y siguen rotulados como demo.
- QA del desglose, consentimiento y pasarela en navegador; E2E F8 completo a 375 px sin overflow: 125 € sobre 250 € (50 %), falta de consentimiento bloqueada, cero inputs de pago, cargo ficticio y segundo recorrido de liberación.
- `pnpm check`: ✅ 28/28 tareas; `pnpm e2e`: ✅ 28/28. Política demo y límites registrados en ADR-006.

## 2026-08-17 · Sesión 8 · F7 Solane eventos e inventario único ✅

- Solane convertida en experiencia completa es/en: web gastronómica, widget de cuatro pasos conectado al dominio y agenda pública de eventos con aforo restante y venta local simulada, sin pedir pago ni fingir cobros.
- Nuevo contrato `logic-reserva-demo-solane-v1` independiente de Vedra y versionado: reservas, eventos y ventas con parser defensivo, fusión de fixtures, reset y serialización; 10 tests nuevos cubren corrupción, publicación, conflictos, sobreventa y roundtrip.
- `DashboardDemo` generalizado por marca sin alterar el flujo Vedra. Gestor Solane con Servicio, Plano, Reservas y Eventos; el formulario crea borradores con nombre, fecha, hora, duración, precio, aforo y mesas, y la publicación comprueba doble ocupación.
- Inventario único visible: los eventos `published|soldout` aparecen con estado textual+color propio en el plano y retiran sus mesas de `tableAvailability`; la compra de plazas actualiza `soldSeats`, registra la venta y cambia a completo al agotar aforo.
- Rutas web, agenda y gestor ES/EN aisladas de SEO; responsive validado a 320/375/430/1366 px y navegación móvil corregida. Decisión de estado por marca registrada en ADR-005.
- `pnpm check`: ✅ 28/28 tareas; `pnpm e2e`: ✅ 27/27. El E2E estrella crea y publica un evento sobre SS7+SS8, comprueba que desaparecen del widget tras recarga y vende 2 plazas (8 → 6).

## 2026-08-17 · Sesión 7 · F6 Vedra plano y grupos ✅

- Gestor Vedra ampliado a cinco vistas definidas en un único catálogo: Servicio, Plano, Reservas, Clientes y Ajustes; todas usan `?vista=` con `history.replaceState` y copy es/en centralizado.
- Plano operativo por los tres espacios y las 18 mesas, con estado textual+color, capacidad, conexiones, ocupación y panel de detalle al seleccionar una mesa.
- Fixture «Familia Ortega» y tour guiado de tres pasos: solicitud de 8 → combinaciones mínimas calculadas por `tableAvailability` → VS4+VS5 → menú `vedra-grupos` → confirmación. La reserva resultante ocupa ambas mesas y aparece en Servicio, Reservas y Clientes.
- Modo libre y reinicio específico del recorrido añadidos. Ajustes muestra turnos, espacios y menús solo en lectura con madurez explícita.
- Estado `logic-reserva-demo-vedra-v1` evolucionado de forma aditiva y retrocompatible con F5; 13 tests cubren payload legado, corrupción, futuro, combinación, confirmación y reset. Decisión registrada en ADR-004.
- QA visual en navegador del plano, combinaciones, clientes y ajustes a 1366 px. `pnpm check`: ✅ 28/28 tareas; `pnpm e2e`: ✅ 21/21, con las cinco vistas a 320/375/430/1366 px y recorrido de grupo completo.

## 2026-08-17 · Sesión 6 · F5 Vedra Gestión ✅

- Vedra convertida en experiencia completa es/en con widget React de cuatro pasos: fecha/grupo, disponibilidad real por franjas de 15 minutos, menú opcional con precio/persona y datos del cliente.
- El viaje web → gestor persiste reservas confirmadas en `logic-reserva-demo-vedra-v1`; el parser versionado clona fixtures, tolera corrupción, rechaza versiones futuras y fusiona reservas válidas. Ocho tests unitarios cubren el contrato.
- Gestor operativo es/en con navegación centralizada por `?vista=servicio|reservas` y `history.replaceState`: timeline de 18 mesas, turnos comida/cena, badge «Desde la web demo», filtros y transiciones válidas de estado.
- Botón «Restablecer demo» recupera fixtures y elimina el viaje creado; web y gestor mantienen la etiqueta ficticia y el aislamiento SEO triple.
- QA visual en navegador sobre timeline y libro de reservas a 1366 px. `pnpm check`: ✅ 28/28 tareas; `pnpm e2e`: ✅ 20/20, incluido reservar → abrir gestor → sentar → recargar → restablecer y es/en a 320/375/430/1366 px sin overflow ni consola.

## 2026-08-17 · Sesión 5 · F4 Brasca Inicio ✅

- Brasca convertida en one-page es/en completa: navegación, hero, carta, relato del bistró, horarios, ubicación ficticia con mapa ilustrado, solicitud y footer.
- Seis platos bilingües con precios en céntimos añadidos al fixture; la página no duplica precios, horarios, dirección ni copy.
- Solicitud de mesa deliberadamente muerta: valida campos, explica que llegaría por email y confirma que no se envió ni guardó nada; cero red y cero `localStorage`.
- Aislamiento SEO triple probado en ambas rutas: meta `noindex`, `x-robots-tag` del Worker y `Disallow` en robots; sitemap continúa sin demos.
- QA visual manual a 375/1366 px. `pnpm check`: ✅ 28/28; `pnpm e2e`: ✅ 14/14, incluyendo es/en a 320/375/430/1366 px sin overflow ni consola.

## 2026-08-17 · Sesión 4 · F3 Landing comercial ✅

- Landing es/en completa según el contrato visual: nav fija, hero con píldora, mockup de servicio, cifras sectoriales, cuatro diferenciales, demos, escalera con madurez, FAQ y captación.
- Configurador conectado a `recommendLevel`: siete señales recomiendan y preseleccionan el nivel del formulario. Calculadora conectada a `marketplaceSavings`, siempre rotulada como estimación de terceros.
- Formulario conectado a `/api/leads`; el 503 esperado se traduce en "no enviado ni guardado" y ofrece WhatsApp, sin fingir éxito.
- 12 páginas auxiliares es/en (planes, dos soluciones y tres legales), más sitemap sin demos y robots con exclusión doble. Banner de consentimiento sin cargar analítica.
- `tests/e2e/reserva.spec.ts`: 8 tests verdes; 14 rutas a 320/375/430/1366 px sin overflow ni errores de consola, interacción de configurador/calculadora, 503 y persistencia de consentimiento.
- QA visual manual de la landing a 375 y 1366 px. `pnpm check`: ✅ 28/28 tareas; `pnpm e2e`: ✅ 8/8.

## 2026-08-17 · Sesión 3 · F2 Temas y fixtures ✅

- Sistema UI ampliado con estados de mesa libre/ocupada/evento/privatizada, badges y tablas operativas; todos conservan texto o icono además del color.
- Temas completos y realmente importados para Brasca (terracota), Vedra (oliva) y Solane (noche+dorado), con hero responsive compartido y motion reducido.
- `apps/web/src/data.ts`: copy es/en y fixtures completos — Brasca 8 mesas; Vedra 18 mesas en 3 espacios y 3 menús; Solane 12 mesas, seis estados de reserva, evento "Cena maridaje" y solicitud de privatización.
- 8 tests nuevos verifican todos los restaurantes, eventos, reservas, ausencia de doble ocupación, cantidades esperadas y copy bilingüe.
- Pipeline Sharp reproducible y 9 AVIF (640/960/1600) desde tres ilustraciones SVG propias, planas y sin fotografía de stock. Favicon propio añadido.
- QA visual con Chrome a 375/1366 px: las 3 demos sin overflow y con cero errores de consola. `pnpm check`: ✅ 28/28 tareas; 55 tests totales (47 dominio + 8 fixtures).

## 2026-08-17 · Sesión 2 · F1 Dominio completo ✅

- Modelo puro completo: organización, restaurantes, espacios, mesas combinables, menús, turnos, reservas, eventos, privatizaciones y depósitos.
- `tableAvailability` comparte un único inventario entre reservas activas, eventos publicados y privatizaciones bloqueadas; devuelve mesas y combinaciones mínimas válidas. `assertNoDoubleBooking` protege fixtures/estado restaurado.
- Validaciones de restaurante, evento y reserva; motor de riesgo, depósito auditable en céntimos y resolución no-show/sentado; catálogo `CAPABILITIES` con evidencia y madurez.
- 47 tests de dominio verdes, incluido el invariante publicar evento → retirar mesas. ADR-002 (slots de 15 minutos) y ADR-003 (inventario único) aceptadas.
- El `DESIGN (1).md` recibido se incorporó como nuevo contrato visual: papel cálido `#f6f5f4`, CTA azul único, acentos planos, tarjetas a 12 px con borde y sin sombra. Tokens compartidos actualizados sin mezclar las identidades de las tres demos.
- `pnpm check`: ✅ 28/28 tareas; 47 tests de dominio.

## 2026-08-17 · Sesión 1 · F0 Scaffold ✅

- Sesión de grilling completa: decisiones de producto cerradas (demo comercial patrón estancia, 3 marcas Brasca/Vedra/Solane, escalera de la familia, es/en, los 5 diferenciales con el inventario único como protagonista).
- Exploración de los proyectos hermanos (camp = proceso, estancia = arquitectura; gestor-reservas descartado como base, es Svelte) e investigación profunda de competencia → `docs/COMPETENCIA.md`.
- Scaffold completo del monorepo: raíz + packages (config, domain con núcleo temporal/escalera/calculadoras + 12 tests, ui con tokens) + apps (site con index es/en, web con DemoLayout y stubs de las 3 marcas, dashboard stub, worker con compose + security headers + x-robots-tag + /api/leads fail-closed 503).
- Documentación de proceso: CLAUDE.md, docs/ROADMAP.md (F0–F12 con criterios de hecho), docs/COMPETENCIA.md, docs/DESIGN.md, ADR-001, BACKLOG.md, SIGUIENTE-SESION.md.
- `pnpm check`: ✅ verde (28/28 tareas; 10 tests de dominio). Prueba de humo del worker local: landing, demos y espejo /en/ en 200, `/api/leads` responde 503 fail-closed, headers de seguridad + `x-robots-tag: noindex` en `/demos/*`.
- Ajustes sobre el molde estancia: `turbo.json` build depende de typecheck (evita carrera de `astro check` y `astro build` sobre `.astro/`); `run_worker_first` incluye `/demos/*` y `/en/demos/*` para que el worker inyecte de verdad el `x-robots-tag` (en estancia solo cubre `/api/*`, así que allí ese header nunca se aplica — apuntado como posible fix en aquel proyecto).
