# ROADMAP — Logic Reserva

Cada fase cabe en una sesión de trabajo y tiene criterio de hecho **verificable**. El estado vivo (fase actual + siguiente paso) está en `../SIGUIENTE-SESION.md`; este documento es el mapa completo. Al terminar una fase: marcar sus checkboxes aquí, entrada en `PROGRESS.md`, actualizar `SIGUIENTE-SESION.md`.

Arquitectura comercial vigente: **Básico → Gestión → Inteligente**. Brasca demuestra la web Básica; Vedra, el backend de Gestión; Solane, ese backend ampliado con IA y automatizaciones demostrativas. Decisión completa en `adr/ADR-010-tres-planes-y-backends-demostrativos.md`.

Guion comercial que todo esto construye (el "demo de 5 pasos" de Solane, validado contra la competencia en `COMPETENCIA.md`):

1. Vista de servicio del día con plano de sala vivo →
2. Crear evento "Cena maridaje, 24 plazas" seleccionando mesas reales → el widget deja de ofrecerlas (**inventario compartido como diferencial central demostrado**) →
3. Un comensal reserva: mesa + menú degustación + regla ficticia de depósito informada y aceptada con timestamp →
4. Marcar no-show y simular la aplicación del depósito / sentar y liberarlo automáticamente →
5. CRM + export + escenario de exposición a no-show y coste comparativo hipotético.

---

## F0 · Scaffold del monorepo ✅

**Objetivo:** esqueleto completo que compila, con toda la documentación de proceso.
**Dependencias:** ninguna.

- [x] Raíz: `package.json` (logic-reserva), `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.js` (`any` = error), `playwright.config.ts` (puerto 8791), `.gitignore`
- [x] `packages/config` — `PRODUCT` (demoSlugs brasca/vedra/solane), `contact.ts`
- [x] `packages/domain` — núcleo temporal (slots 15', overlap semiabierto, `estimateDurationMin`, `seatingTimes`), escalera (`LEVELS`, `hasLevel`, `recommendLevel`), calculadoras (`marketplaceSavings`, `noShowLoss`) + tests
- [x] `packages/ui` — `theme.css` con tokens base (acento burdeos `--bordeaux`) y primitivas
- [x] `apps/site` — layout Base + index es/en placeholder
- [x] `apps/web` — DemoLayout (noindex + franja "Demostración ficticia") + stub por marca + `demos.css` con los 3 temas
- [x] `apps/dashboard` — `DashboardDemo.tsx` stub + `dashboard.css`
- [x] `apps/worker` — `index.ts` (assets + security headers + x-robots-tag en demos + `/api/leads` 503 fail-closed), `compose.mjs`, `wrangler.jsonc`
- [x] Proceso: `CLAUDE.md`, `docs/ROADMAP.md`, `docs/COMPETENCIA.md`, `docs/DESIGN.md`, `docs/adr/ADR-001`, `PROGRESS.md`, `BACKLOG.md`, `SIGUIENTE-SESION.md`, `README.md`

**Hecho cuando:** `pnpm install && pnpm check` verde; `pnpm dev` sirve site y demos compuestos.

---

## F1 · Dominio completo de restauración ✅

**Objetivo:** todo el modelo y las reglas de negocio, puros y testeados. Es el cimiento de TODAS las fases siguientes.
**Dependencias:** F0.

- [x] Entidades en `packages/domain/src/index.ts`: `RestaurantOrganization → Restaurant → Space (privatizable) → Table (minSeats/maxSeats, combinableWith)`, `Menu (pricePerPersonCents, courses, bookableOnline)`, `Shift` por restaurante
- [x] `TableBooking`: `tableIds[]`, `slot`, `partySize`, `status: pending|confirmed|seated|finished|no_show|cancelled`, `guest`, `menuId?`, `deposit?`, `source: widget|phone|walkin|fixture`
- [x] `RestaurantEvent`: `capacity`, `priceCents`, `soldSeats`, `consumesTableIds[]`, `status: draft|published|soldout|done`
- [x] `PrivateHire`: `spaceId`, `slot`, `status: requested|proposed|deposit_paid|blocked`, propuesta con menú y mínimo de comensales
- [x] **`tableAvailability(restaurant, bookings, events, hires, slot, partySize)`** — pura; excluye mesas por reserva activa, evento publicado o privatización bloqueada. `assertNoDoubleBooking`
- [x] Depósitos: `RiskTier`, `riskTier({partySize, isPeakSlot, hasHistory, leadDays})`, `DepositPolicy` (none|card_hold|prepay, % sobre menú), `depositFor` con breakdown, `DepositRecord` (`termsAcceptedAt` obligatorio, `held→released|charged`), `noShowCharge` (nunca > depósito; `seated ⇒ released`)
- [x] `validateRestaurant` / `validateEvent` con invariantes: `sum(maxSeats de consumesTableIds) >= capacity`; `soldSeats <= capacity`; mesas de un booking del mismo Space y combinables; `partySize` dentro de `[sum(min), sum(max)]`
- [x] `CAPABILITIES` con `evidence: brasca|vedra|solane` y `maturity: available|functional-demo|next-to-validate|future`
- [x] ≥30 tests, incluido el del invariante estrella: **publicar un evento retira sus mesas de `tableAvailability`**
- [x] `docs/adr/ADR-002-slots-15min.md` y `ADR-003-inventario-unico.md`

**Hecho cuando:** `pnpm --filter @logic-reserva/domain test` verde; cero `any`; cero imports de I/O o framework.

---

## F2 · Tokens de tema + fixtures completos ✅

**Objetivo:** identidad visual de las 3 marcas y los datos ficticios que alimentan todo.
**Dependencias:** F1.

- [x] `packages/ui/src/theme.css` ampliado: tokens de estado de mesa (libre/ocupada/bloqueada-evento/privatizada), badges, tablas del gestor
- [x] `apps/web/src/styles/demos.css`: temas completos por marca (tipografía display, superficies, hero)
- [x] `apps/web/src/data.ts`: los 3 restaurantes completos validando `validateRestaurant` — Brasca (8 mesas, 1 sala, carta), Vedra (2 salas + terraza, ~18 mesas combinables, 3 menús incl. grupo), Solane (sala + privado, 12 mesas, menú degustación, 1 evento en borrador "Cena maridaje", 1 solicitud de privatización, reservas fixture del día con variedad de estados)
- [x] `scripts/images.mjs` (sharp → AVIF 640/960/1600) + imágenes hero por marca en `apps/web/public/`
- [x] Copy bilingüe de marcas en `apps/web/src/data.ts` (nav, hero, textos de formulario)

**Hecho cuando:** `pnpm check` verde; un test valida que TODOS los fixtures pasan `validateRestaurant`.

---

## F3 · Landing comercial ✅

**Objetivo:** el funnel de venta y captación de leads (la razón de ser de la demo).
**Dependencias:** F2.

- [x] `apps/site/src/content.ts` — copy completo es/en, tipado `as const`
- [x] Escalera consolidada en tres planes: Básico, Gestión e Inteligente; las páginas comerciales, demos y payload de leads comparten el mismo contrato
- [x] `Landing.astro`: hero centrado en producto → prueba visual del inventario → recorridos de restaurante y eventos → tres demos → implantación → FAQ → formulario de leads
- [x] La landing evita calculadoras y cifras sectoriales no verificables; el escenario comparativo permanece dentro de Informes, rotulado como hipótesis editable
- [x] Form de leads → `POST /api/leads`, única excepción comercial real y separada del modo demo; falla de forma cerrada si la configuración no está habilitada
- [x] Páginas: `/planes/`, `/soluciones/restaurantes/`, `/soluciones/grupos-y-eventos/`, `/legal/`, `/privacidad/`, `/cookies/` + espejos completos `/en/`
- [x] `sitemap.xml.ts` (excluye /demos/), `robots.txt` (Disallow /demos/), consentimiento antes de cualquier analítica

**Hecho cuando:** E2E site en `tests/e2e/reserva.spec.ts`: 200 en todas las rutas, sin overflow horizontal a 320/375/430/1366px, cero errores de consola.

---

## F4 · Demo Brasca (plan Básico) ✅

**Objetivo:** la marca que vende el peldaño básico: "la web que ya vende".
**Dependencias:** F2.

- [x] `/demos/brasca/` one-page: hero, carta con precios (desde fixtures), horarios, ubicación ficticia, formulario de solicitud de mesa
- [x] Formulario MUERTO con mensaje honesto: "Tu solicitud llegaría por email al restaurante — sin gestor en este nivel"
- [x] Espejo `/en/demos/brasca/`
- [x] Noindex triple verificado (meta + header worker + robots.txt)

**Hecho cuando:** E2E brasca: 200, noindex, el submit muestra el mensaje, sin overflow, consola limpia.

---

## F5 · Vedra: widget de reserva + gestor básico

**Objetivo:** el corazón del producto — reservar mesa con menú desde la web y verlo en el gestor.
**Dependencias:** F2.

- [x] `apps/web/src/islands/BookingWidget.tsx`: fecha → servicio (comida/cena) → personas → hora (franjas de 15' de `seatingTimes` filtradas por `tableAvailability` sobre fixtures) → **menú opcional con precio/persona** → datos → confirmación
- [x] `saveJourney()`: escribe la reserva en `logic-reserva-demo-vedra-v1` y ofrece "Abrir el gestor"
- [x] `apps/dashboard/src/state.ts`: `DemoState` versionado + `parseStored` defensivo (con `state.test.ts`: corrupción, versión futura, merge)
- [x] `DashboardDemo.tsx` real con vistas `?vista=servicio` (timeline mesas × franjas del día, la reserva del widget aparece con badge "Desde la web demo") y `?vista=reservas` (lista + transiciones de estado)
- [x] `apps/web/src/pages/demos/vedra/gestion/index.astro` monta la isla
- [x] Botón "Restablecer demo"

**Hecho cuando:** E2E: reservar en la web → abrir gestor → la reserva está; `state.test.ts` verde.

---

## F6 · Vedra: plano de sala + grupos

**Objetivo:** el recorrido dramatizado de Vedra — grupo de 8, combinar mesas, menú de grupo.
**Dependencias:** F5.

- [x] Vista `?vista=plano`: plano por Space (SVG o grid), color por estado de mesa, click → detalle
- [x] Combinar mesas: para partySize > maxSeats de una mesa, proponer combinaciones válidas (`combinableWith`)
- [x] Recorrido guiado: solicitud de grupo de 8 (fixture) → combinar T4+T5 → asignar menú de grupo → confirmar
- [x] Vistas `?vista=clientes` (ficha básica) y `?vista=ajustes` (turnos, mesas, menús — lectura con etiqueta de madurez)
- [x] Tour guiado de 3 pasos de Vedra

**Hecho cuando:** E2E del recorrido de grupo completo.

---

## F7 · Solane: web + eventos + INVENTARIO ÚNICO

**Objetivo:** el diferencial estrella en pantalla (pasos 1–2 del guion).
**Dependencias:** F6.

- [x] `/demos/solane/` con `BookingWidget` completo y `/demos/solane/eventos/` con `EventTickets.tsx`: lista de eventos, aforo restante, compra simulada de plazas
- [x] Gestor Solane: vistas `servicio`, `plano`, `reservas`, `eventos`
- [x] **Crear evento desde el gestor**: nombre, fecha, precio, aforo, selección de mesas del plano → al publicar, las mesas quedan bloqueadas (estado visual propio) y `tableAvailability` deja de ofrecerlas en el widget para slots solapados
- [x] Vender plazas desde `/eventos/` descuenta aforo en tiempo real (localStorage compartido)

**Hecho cuando:** E2E del invariante estrella: crear evento en gestor → recargar web → la franja del evento no ofrece esas mesas; comprar plazas → aforo baja.

---

## F8 · Depósitos anti no-show (regla demostrativa)

**Objetivo:** pasos 3–4 del guion; un recorrido ficticio, informado y auditable.
**Dependencias:** F7.

- [x] En el widget Solane: `riskTier` (grupo grande / viernes noche / sin historial) → regla ficticia 0/25/50 % sobre el menú con desglose visible, checkbox de condiciones + `termsAcceptedAt` mostrado, pasarela simulada en `<dialog>` etiquetada "Pasarela neutra · demo — no se realizará ningún cobro"
- [x] En el gestor: marcar no-show → aplicación local de la regla demo con breakdown y referencia a las condiciones aceptadas; sentar la reserva → "Depósito liberado automáticamente"
- [x] Panel lateral explicativo: regla ficticia informada antes de reservar; condiciones, importe y validez sujetos a revisión por proyecto

**Hecho cuando:** E2E pasos 3–4 completos con aserciones sobre el desglose y la liberación.

---

## F9 · Privatizaciones + roles

**Objetivo:** el módulo que más impresiona a un propietario (diferencial E).
**Dependencias:** F7.

- [x] Vista `?vista=privatizaciones`: solicitud fixture (`requested`) → "Preparar propuesta" (menú + precio/persona + mínimo) → "Registrar señal" (simulada) → `blocked`: el Privado se pinta bloqueado en plano y desaparece del widget
- [x] Selector de rol Dirección/Sala/Cocina con `canOperate`; acciones fuera de rol deshabilitadas con aviso explícito
- [x] Tour guiado de 3 pasos de Solane

**Hecho cuando:** E2E: flujo privatización completo + cocina no puede sentar mesas ni cobrar no-shows.

---

## F10 · CRM + informes + calculadora

**Objetivo:** paso 5 del guion; cerrar el argumento comercial.
**Dependencias:** F8.

- [x] Vista `?vista=clientes` Solane: ficha con histórico, gasto, alergias, notas de sala, export CSV simulado (descarga real de los fixtures)
- [x] Vista `?vista=informes`: ocupación por servicio, exposición estimada a no-show, origen de reservas y **coste comparativo hipotético** con un supuesto editable de 3 €/cubierto, sin tarifa atribuida ni periodo mensual real
- [x] Informes de organización en Vedra (subset de Gestión, sin IA ni automatizaciones)
- [x] Solane amplía Gestión con un asistente de decisiones y un centro de automatizaciones, ambos rotulados como simulación local sin IA conectada

**Hecho cuando:** E2E paso 5; el rótulo de estimación tiene aserción propia en la spec.

---

## F11 · i18n en + E2E integral + pulido

**Objetivo:** producto enseñable de punta a punta en dos idiomas.
**Dependencias:** F3–F10.

- [x] Espejo `/en/` completo de site y demos; copy centralizado (cero ternarios de locale en JSX)
- [x] `tests/e2e/reserva.spec.ts` consolidado: todas las rutas 200, noindex de demos, sin overflow a 320/375/430/1366, cero errores de consola, los 3 recorridos dramatizados y el test **"guion de demo comercial"** (5 pasos Solane de una tirada)
- [x] Imágenes AVIF con `<picture>` + srcset; accesibilidad: foco visible, aria en el plano, reduced-motion
- [x] Revisión visual a 375px y 1366px de cada pantalla

**Hecho cuando:** `pnpm check && pnpm e2e` verde íntegro.

---

## F12 · Worker real + deploy ✅

**Objetivo:** reserva.logic2b.com en producción con leads reales.
**Dependencias:** F11.

- [x] `apps/worker/src/leads.ts`: Zod + honeypot + rate-limit 5/min + Resend con idempotency-key → marinerandreu+logic@gmail.com; estados delivered(202)/invalid(400)/limited(429)/failed(502)/disabled(503) — **nunca finge entrega** (copiar patrón de `../estancia.logic2b.com/apps/worker/src/leads.ts`)
- [x] Frontera técnica verificada: solo el formulario comercial de la landing usa `/api/leads`; marcas y dashboards son simulaciones locales sin llamadas de escritura a red
- [x] Contrato local: `LEADS_TRANSPORT: 'resend'`, binding Durable Object y nombre del secret `LEADS_RESEND_API_KEY`, sin guardar su valor en el repositorio
- [x] Preview aislada: Worker `logic-reserva-preview`, `routes: []`, workers.dev, workflow con gate `PREVIEW` y verificador automático contra herencia de producción
- [x] Configurar el valor cifrado de `LEADS_RESEND_API_KEY` en preview
- [x] Configurar y validar el valor cifrado de `LEADS_RESEND_API_KEY` en producción mediante una entrega real autorizada
- [x] Workflow de deploy con gate doble: `workflow_dispatch` que exige teclear `DEPLOY` + variable `RESERVA_DEPLOY_ENABLED == 'true'`
- [x] Preview pública verificada: rutas/SEO 200, cabeceras de seguridad en todas las páginas, `x-robots-tag` en demos y API fail-closed(503) sin secret
- [x] La entrega de correo en preview deja de ser requisito por decisión de producto del 2026-08-18; preview conserva verificación GET, aislamiento y fail-closed honesto ante una clave no válida
- [x] Deploy manual de `logic-reserva` con dominio personalizado `reserva.logic2b.com`, DNS/TLS administrados por Cloudflare y verificación externa
- [x] Verificación real en producción: `202 delivered`, llegada confirmada en `marinerandreu+logic@gmail.com` y repetición con la misma referencia + `replayed: true` sin segundo correo
- [x] Producción revalidada después de la rotación: `202 delivered` y replay con la misma referencia; el usuario mantiene producción como único entorno requerido para Resend

**Hecho cuando:** demo pública en reserva.logic2b.com y un lead de prueba en la bandeja de entrada.

---

## F13 · Web comercial, narrativa y SEO

**Objetivo:** convertir la landing y las páginas de intención en un recorrido comercial coherente, específico para restauración y preparado para buscadores.
**Dependencias:** F3, F11.

- [x] Hero orientado al resultado operativo, con la sala como protagonista, acceso directo a Solane y una captura real del inventario compartido
- [x] Hilo comercial completo: inventario compartido → recorridos de restaurante y eventos → casos navegables → alcance de implantación → conversación
- [x] Solane se presenta primero con capturas guiadas del producto; Vedra y Brasca conservan sus imágenes editoriales AVIF responsive
- [x] Páginas de planes, restaurantes y grupos/eventos ampliadas con contenido específico por intención, preguntas frecuentes y enlaces internos contextuales
- [x] SEO técnico bilingüe: títulos y descripciones únicos, canonical, hreflang + x-default, Open Graph, Twitter Card, robots por tipo de página y sitemap enriquecido
- [x] Datos estructurados JSON-LD: Organization, WebSite, BreadcrumbList, WebPage y FAQPage según la ruta, sin presentar la demo como un servicio ya activo
- [x] Accesibilidad común es/en: salto al contenido, contraste AA en texto pequeño y objetivos táctiles efectivos de al menos 44 px en site, demos y gestores
- [x] Pruebas E2E de metadatos, schema, rastreabilidad, longitud de snippets, imágenes y responsive sin romper los recorridos F7–F12

**Hecho cuando:** `pnpm check` verde, E2E integral verde y revisión visual local a 1366px y 375px sin overflow.

---

## F14 · Lista de espera y clientes sin reserva

**Objetivo:** incorporar la demanda espontánea al mismo inventario de mesas, sin crear una agenda paralela ni fingir integraciones externas.
**Dependencias:** F7, F8, F11.

- [x] Modelo puro de lista de espera: espera → avisado → sentado/cancelado, con fecha de llegada, franja solicitada y tiempo de espera comunicado
- [x] Conversión a `TableBooking` con origen `walkin`, estado `seated` y la opción mínima disponible calculada por `tableAvailability`
- [x] Estado local versionado y parser defensivo compatible con payloads anteriores en Vedra y Solane
- [x] Vista bilingüe `?vista=espera` compartida por Gestión e Inteligente: alta, aviso, disponibilidad, asignación de mesa y cancelación
- [x] Solane aplica permisos en dos capas: Dirección y Sala operan la cola; Cocina solo consulta
- [x] La cola y sus reservas sentadas permanecen totalmente locales, aparecen en Servicio/Reservas/Informes y respetan eventos y privatizaciones
- [x] Cobertura unitaria y E2E de alta → aviso → asiento, ausencia de mesa, permisos, persistencia y responsive

**Hecho cuando:** un cliente sin reserva puede entrar en la cola, recibir aviso y sentarse sin solapar inventario; `pnpm check && pnpm e2e` verdes.

---

## F15 · Bonos de experiencia y caja anticipada ✅

**Objetivo:** demostrar la venta directa de experiencias antes de elegir fecha y su canje operativo, sin convertir la demo en una pasarela ni fingir facturación.
**Dependencias:** F8, F10, F11.

- [x] Modelo puro de bono: experiencia, cantidad, valor auditable en céntimos, código, emisión, caducidad y estado `issued|redeemed|voided`
- [x] Invariantes de emisión y canje: total recalculado, caducidad posterior a emisión, transiciones terminales y canje único
- [x] Persistencia aditiva y parser defensivo compatible con el estado local v1 de Solane
- [x] Página bilingüe `/demos/solane/bonos/`: selección de experiencia, destinatario, resumen y emisión simulada sin tarjeta, cobro, correo ni red
- [x] Vista `?vista=bonos` en el gestor Inteligente: caja anticipada visible, código y canje local; Dirección y Sala pueden canjear, Cocina solo consulta
- [x] Frontera honesta: valor comercial rotulado como ficticio, sin factura ni validez económica, y todas las mutaciones confinadas a `localStorage`
- [x] Cobertura unitaria y E2E de emisión → aparición en gestor → canje → persistencia, permisos y responsive es/en

**Hecho cuando:** un bono emitido en la web aparece en el gestor y solo puede canjearse una vez; `pnpm check && pnpm e2e` verdes.

---

## F16 · Gestor móvil para Sala ✅

**Objetivo:** permitir que el equipo de sala consulte el servicio y ejecute las acciones urgentes con una mano, sin crear otra aplicación ni duplicar estado o dominio.
**Dependencias:** F7, F10, F14.

- [x] Navegación móvil fija con acceso directo a Servicio, Reservas, Espera y Plano, más un menú accesible para todas las vistas secundarias
- [x] Servicio de Vedra representado como agenda vertical accionable en móvil, sin depender de la cronología horizontal de escritorio
- [x] Reservas y lista de espera convertidas en tarjetas legibles a 320–430 px, con estado textual y acciones críticas de al menos 44 px
- [x] Cabecera, selector de rol y aviso ficticio compactos sin ocultar la frontera demostrativa ni los permisos de Solane
- [x] El mismo `?vista=`, estado local v1, dominio y permisos funcionan en escritorio y móvil; sin nuevas llamadas de red
- [x] Cobertura E2E bilingüe de navegación primaria/secundaria, acción de servicio, espera y ausencia de overflow en Vedra y Solane

**Hecho cuando:** Sala puede abrir Reservas o Espera, actuar sobre una comanda y volver a Servicio desde 320–430 px sin desplazamiento horizontal de página; `pnpm check && pnpm e2e` verdes.

---

## F17 · Riesgo de no-show explicable ✅

**Objetivo:** demostrar cómo Solane prioriza revisiones operativas mediante señales auditables, sin presentar reglas como probabilidad estadística ni alterar automáticamente depósitos ya acordados.
**Dependencias:** F8, F10, F11.

- [x] `TableBooking.bookedAt?` conserva la antelación cuando existe, con persistencia aditiva compatible con el estado local v1 y ausencia explícita cuando el dato no está disponible
- [x] Motor puro de puntuación operativa 0–100: canal, historial, tamaño de grupo, antelación y franja aportan contribuciones visibles y acotadas
- [x] Resultado `low|medium|high` con acción sugerida `standard_confirmation|confirm_24h|manual_review`; no es una probabilidad ni una decisión automática
- [x] Informes de Solane muestran reservas activas priorizadas, desglose de señales y límites bilingües; Dirección, Sala y Cocina solo consultan
- [x] La recomendación no recalcula `riskTier`, no cambia el depósito aceptado y no ejecuta correo, WhatsApp, cobro, modelo, agente ni proveedor externo
- [x] Cobertura de dominio, derivación desde fixtures/persistencia y E2E es/en sin escrituras de red, con responsive a 320/375/430/1366 px

**Hecho cuando:** Marc y Lucía reciben recomendaciones distintas y reproducibles con evidencia visible, sin que ningún depósito o estado cambie; `pnpm check && pnpm e2e` verdes.

---

## F18 · Capturas guiadas de venta ✅

**Objetivo:** convertir las superficies ya terminadas de Brasca, Vedra y Solane en un paquete comercial reproducible, versionable y honesto, sin duplicar los recorridos operativos ni introducir datos o integraciones reales.
**Dependencias:** F4–F17.

- [x] Contrato y catálogo canónico en `docs/SALES-ASSETS.md`: escenas, estados, encuadres, nombres y fronteras de seguridad
- [x] `apps/site/scripts/capture-screens.mjs` automatiza el catálogo con Playwright sobre el bundle local y reutiliza los fixtures, resets y reglas existentes
- [x] `pnpm fotos` construye, levanta el Worker local, captura y verifica el paquete sin depender de preview, producción ni servicios externos
- [x] Cada escena tiene variantes desktop 1366×900 y móvil 375×812, en español, con reloj, locale, zona horaria, movimiento reducido y escala de píxel fijados
- [x] Antes de cada escena se limpian cookies, `sessionStorage` y los estados locales de Vedra/Solane; cualquier estado avanzado se alcanza desde fixtures conocidos sin reimplementar reglas de dominio
- [x] La ejecución falla ante datos fuera de la allowlist ficticia, errores de consola, recursos incompletos, overflow horizontal o cualquier petición distinta de GET/HEAD; `POST /api/leads` queda expresamente prohibido
- [x] Los PNG y su manifiesto estable se escriben en `apps/site/public/images/screens/` con nombres deterministas y sin timestamps, credenciales ni datos personales reales
- [x] Una segunda ejecución produce el mismo inventario de archivos y dimensiones; `pnpm check && pnpm e2e` permanecen verdes

**Hecho cuando:** `pnpm fotos` regenera desde cero todas las escenas desktop/móvil de `docs/SALES-ASSETS.md`, valida la frontera local y deja un paquete comercial completo y versionable sin efectuar ninguna escritura de red; `pnpm check && pnpm e2e` verdes.

---

## F19 · Confirmación de asistencia con enlace local

**Objetivo:** convertir las sugerencias consultivas de F17 en un recorrido humano verificable de confirmación en un clic, sin fingir WhatsApp, correo, automatización ni envío externo.
**Dependencias:** F7, F10, F17.

- [x] Modelo puro `AttendanceConfirmation` con referencia opaca, caducidad y transición idempotente `prepared → attendance_confirmed | change_requested | expired`
- [x] Estado Solane v1 ampliado de forma aditiva y defensiva; solo reservas activas pueden preparar una confirmación y ninguna respuesta altera inventario, score o depósito
- [x] Dirección y Sala pueden preparar el enlace desde el gestor; Cocina solo consulta y la mutación aplica el mismo permiso aunque se invoque fuera de la interfaz
- [x] Ruta bilingüe `/demos/solane/confirmacion/?ref=...` muestra únicamente restaurante, fecha, hora y grupo, sin correo ni teléfono, y declara que el enlace se generó pero no se envió
- [x] El comensal puede confirmar asistencia o solicitar un cambio; solicitarlo crea seguimiento manual y no cancela ni libera mesas
- [x] Referencias desconocidas, caducadas o ya respondidas fallan de forma segura, no revelan datos y conservan estados terminales
- [x] E2E es/en cubre preparación, respuesta, retorno al gestor, persistencia, idempotencia, permisos, frontera sin escrituras y responsive 320/375/430/1366 px

**Hecho cuando:** Marc puede recibir un enlace ficticio preparado por Sala, confirmar o solicitar un cambio y ver la respuesta persistida en el gestor, sin transporte ni mutaciones colaterales; `pnpm check && pnpm e2e && pnpm fotos` verdes.

---

## M1 · Presupuesto D1 cero ✅

**Objetivo:** mantener Logic Reserva fuera de la cuota D1 y detectar antes del despliegue cualquier persistencia o tarea programada accidental.

- [x] Inventario local y remoto de bases, bindings, endpoints, crons, jobs, alarmas, seeds y resets
- [x] Separación explícita de reservas reales, contactos, reservas ficticias y contenido estático
- [x] Medición agregada de las últimas 24 h y perfil de consultas de siete días sin leer filas ni datos personales
- [x] Fusible versionado de 0 consultas, 0 filas leídas/escritas y 0 Cron Triggers
- [x] Gate de CI que falla ante bindings D1, SQL de runtime, handlers `scheduled` o crons no presupuestados
- [x] Tabla antes/después, porcentaje de límites y contrato de preservación en `docs/D1-BUDGET.md`

**Hecho cuando:** `pnpm check` demuestra que producción y preview conservan presupuesto D1 cero y la documentación identifica qué puede publicarse sin mutar datos remotos.

---

## Después (backlog, no fases)

Ver `../BACKLOG.md`: WhatsApp de confirmaciones, ca/fr, Google Reserve, propuesta nominal para prospecto real y vídeos de venta.
