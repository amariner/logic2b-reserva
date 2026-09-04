# ROADMAP — Logic Reserva

Cada fase cabe en una sesión de trabajo y tiene criterio de hecho **verificable**. El estado vivo (fase actual + siguiente paso) está en `../SIGUIENTE-SESION.md`; este documento es el mapa completo. Al terminar una fase: marcar sus checkboxes aquí, entrada en `PROGRESS.md`, actualizar `SIGUIENTE-SESION.md`.

## Norte de producto desde F20

Logic Reserva debe alcanzar paridad estructural y comercial con `camp.logic2b.com`: misma profundidad pública, tipos de bloques, rutas de producto y relación entre web, reserva, operativa, integraciones, planes, portfolio, guías y captación, traducidos al sector de restauración.

No se copiará la estética de Camp ni su dashboard. Reserva conserva el contrato visual de `DESIGN.md` y sus gestores específicos de sala, grupos y eventos. La auditoría, el mapa de equivalencias y el contrato de 14 bloques del home viven en [`PARIDAD-CAMP.md`](PARIDAD-CAMP.md).

Entrega local del 2026-09-04: el contrato está aplicado sobre un home bilingüe de catorce bloques y una envolvente compartida con cabecera pill, hero, rails, formularios, sliders, previews, prefooter y footer. Los catálogos y fichas conservan doce temas y seis paneles; el recorrido guiado tiene nueve hitos entre site y demos. Todo el contenido y los recursos visuales proceden de Logic Reserva. Los builds generan 68 páginas de site y 52 de web; `pnpm check` pasa 28/28 con 161 tests y la regresión E2E integral pasa 85/85. El despliegue permanece pendiente de autorización explícita.

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

## F20 · Contrato de paridad Camp → Reserva ✅

**Objetivo:** convertir la referencia de Camp en una arquitectura explícita para restauración antes de tocar el home.
**Dependencias:** F13, F18, F19.

- [x] Auditoría del home de Camp: hero, ecosistema, flujo, módulos, integraciones, planes, portfolio, paneles, implantación, guías, FAQ, cierre y footer
- [x] Auditoría de las superficies `/precios/`, `/temas/`, `/paneles/` y `/docs/`
- [x] Comparativa contra el home, rutas, demos y gestores actuales de Reserva
- [x] Contrato de paridad estructural y traducción sectorial documentado en `PARIDAD-CAMP.md`
- [x] Excepción explícita del dashboard: se conserva el dominio y el diseño propio de restauración
- [x] Separación objetivo entre doce direcciones web, tres recorridos profundos y dos niveles de gestor

**Hecho cuando:** el equipo puede decidir si un bloque o ruta pertenece al modelo común de la familia Logic2B o al dominio específico de Reserva sin reinterpretar la referencia.

---

## F21 · Shell comercial + hero con prueba múltiple ✅

**Objetivo:** dar a Reserva una primera pantalla con la misma capacidad de orientar, captar y demostrar variedad que Camp, conservando su estética actual.
**Dependencias:** F20.

- [x] Cabecera compacta con cuatro accesos primarios: Webs, Gestor, Precios y Contactar/recorrido; navegación móvil equivalente
- [x] Hero editorial de Reserva con promesa sectorial, captación breve y tres accesos verificables: web demo, recorrido guiado y gestor
- [x] Portfolio visual vivo en el hero con varias identidades de restaurante, sin sustituir la evidencia real de Solane
- [x] Rail de ecosistema previsto inmediatamente después del hero, con estado de madurez accesible para cada marca
- [x] Captación breve y formulario completo comparten validación, consentimiento, idempotencia y el único endpoint real ya autorizado
- [x] Copy es/en, foco, movimiento reducido, cookie banner sin tapar acciones y responsive 320/375/430/1366 px

**Hecho cuando:** en una sola pantalla se entiende qué es Reserva, se puede ver una web, recorrer el producto, abrir el gestor o iniciar contacto, sin perder la identidad visual vigente. Cumplido con 53/53 E2E, `pnpm fotos` reproducible y `pnpm check` verde.

---

## F22 · Flujo de producto + cinco momentos + conexiones ✅

**Objetivo:** explicar la plataforma completa antes de presentar planes o demos aisladas.
**Dependencias:** F21.

- [x] Flujo de siete pasos: web → disponibilidad → reserva → servicio → garantía/cobro → comunicación → decisión
- [x] Carrusel accesible en móvil y secuencia completa legible sin interacción obligatoria en escritorio
- [x] Cinco momentos en pestañas: Web, Reservas, Sala, Grupos y eventos, Operativa
- [x] Cada momento incluye un resultado, tres capacidades, un límite honesto y una captura o mockup derivado del producto real
- [x] Bloque de conexiones en tres familias: herramientas, pagos y asistentes con contexto
- [x] Estado visible `demostrativo|previsto|por proyecto|conectado`; ninguna marca externa amplía por sí sola la promesa funcional
- [x] E2E de pestañas, carrusel, teclado, reduced-motion y ausencia de contenido inaccesible sin JavaScript

**Hecho cuando:** una persona ajena al proyecto puede narrar el recorrido entero y distinguir qué está demostrado de qué requeriría una implantación. Cumplido con cobertura F22 en la suite E2E, 55/55 total y `pnpm check` verde.

---

## F23 · Doce direcciones web para restauración ✅

**Objetivo:** demostrar que la web y el motor pueden adoptar identidades de restaurante muy distintas sobre una misma base de producto.
**Dependencias:** F20, F21.

- [x] Catálogo cerrado de doce marcas ficticias, incluyendo Brasca, Vedra y Solane, con formato, tono, promesa y nivel funcional propios
- [x] Nueve nuevas direcciones cubren bar de barrio, arrocería, grupo pequeño, hotel, alta cocina, terraza estacional, eventos, cadena casual y espacio gastronómico
- [x] `/temas/` es/en con búsqueda/filtros, fichas accesibles y vista previa ampliable
- [x] Veinticuatro fichas públicas indexables —doce es y doce en— con SEO propio, captura, dirección ficticia, alcance, contacto contextual, demo y temas relacionados
- [x] Doce demos web navegables; solo Brasca, Vedra y Solane prometen los recorridos profundos ya implementados
- [x] Sistema de datos y componentes evita doce implementaciones divergentes, pero permite identidad visual real por marca
- [x] Activos responsive, noindex de demos, datos ficticios, reduced-motion y capturas deterministas
- [x] QA visual y E2E de las doce rutas a 375 y 1366 px

**Hecho cuando:** el portfolio iguala la amplitud demostrativa de Camp sin fingir doce gestores ni degradar las tres demos de producto actuales. Cumplido con catálogo compartido, rutas es/en, noindex y suite E2E 55/55.

---

## F24 · Catálogo sectorial de paneles ✅

**Objetivo:** empaquetar comercialmente la profundidad ya existente del gestor de Reserva sin copiar la interfaz de Camp.
**Dependencias:** F10, F14–F19, F20.

- [x] `/paneles/` es/en con seis vistas: Servicio, Plano, Reservas y espera, Grupos y eventos, Informes, Inteligente
- [x] Cada ficha explica usuario, decisión, evidencia, nivel y límites; enlaza a un estado reproducible del gestor
- [x] Filtros Gestión/Inteligente y búsqueda accesible
- [x] Capturas reales derivadas del catálogo de F18; no se inventan KPIs ni integraciones para rellenar tarjetas
- [x] Páginas o paneles de detalle suficientes para entender cada módulo antes de abrir la demo
- [x] Doce fichas públicas indexables —seis es y seis en— con SEO propio, alcance, prueba, límite, CTA contextual y enlace al estado reproducible
- [x] Los recorridos, permisos y persistencia F5–F19 quedan intactos

**Hecho cuando:** el gestor puede explorarse como producto desde fuera y cada panel conduce a una demo sectorial verificable. Cumplido con catálogo compartido, rutas es/en, capturas reales, estados reproducibles y E2E 56/56.

---

## F25 · Precios, implantación y guías públicas ✅

**Objetivo:** ofrecer la misma claridad de compra y confianza operativa que Camp alrededor del producto.
**Dependencias:** F20.

- [x] Evolucionar `/planes/` como página canónica o añadir `/precios/` con redirección coherente; una sola fuente de verdad para SEO y navegación
- [x] Mantener tres ofertas comerciales en home y explicar en la página dedicada una escalera funcional más granular cuando aporte claridad
- [x] Cualquier cambio a los tres planes vigentes requiere ADR que sustituya explícitamente ADR-010; la paridad no lo cambia de forma implícita
- [x] Bloques de mantenimiento, desarrollo/mejoras y servicios de lanzamiento, sin publicar importes no aprobados
- [x] `/docs/` es/en con cinco guías: Sala, Gestión, Dirección, Propietario y Técnica
- [x] Contenido mínimo de migración, datos, dominio/DNS, cobros, RGPD, salida, soporte y responsabilidades por rol
- [x] Enlaces cruzados entre precios, demos, paneles, guías y contacto sin callejones sin salida

**Hecho cuando:** un propietario entiende cómo empezar, qué cambia al crecer, qué aporta Logic2B, qué debe aportar el restaurante y qué sigue pendiente de propuesta. Cumplido con `/planes/`, servicios sin importes, cinco guías es/en y enlaces cruzados.

---

## F26 · Home completo con oferta, portfolio, paneles y confianza ✅

**Objetivo:** cerrar la paridad de los 14 bloques del home sin alterar el gestor.
**Dependencias:** F22–F25.

- [x] Tres ofertas comerciales comparables en home, cada una asociada a una web y a su nivel de gestión
- [x] Teaser del portfolio de doce restaurantes con acceso a `/temas/`
- [x] Teaser de seis paneles específicos de restauración con acceso a `/paneles/`
- [x] Implantación guiada con entradas, configuración, validación, publicación, mantenimiento y límites
- [x] Teaser de cinco guías públicas por rol con acceso a `/docs/`
- [x] FAQ ampliada y cierre visual con vistas reales de escritorio y móvil
- [x] Footer rico con todas las rutas de producto, exploración, contacto, idiomas y legales
- [x] Auditoría de orden, ritmo y densidad frente al contrato de `PARIDAD-CAMP.md`, sin copiar la composición visual de Camp

**Hecho cuando:** el home cumple los 14 bloques en orden, ofrece profundidad equivalente a Camp y mantiene papel cálido, azul único y lenguaje editorial de Reserva. Cumplido en es/en con catálogos compartidos, seis paneles, cinco guías, FAQ de ocho preguntas, footer completo y E2E F26 dirigido 1/1.

---

## F27 · Integración, SEO, capturas y lanzamiento de la nueva arquitectura · cierre local ✅ / publicación pendiente

**Objetivo:** verificar y publicar la paridad completa sin romper las fronteras de la demo ni el producto existente.
**Dependencias:** F23–F26.

- [x] Contenido es/en completo, canonical/hreflang, sitemap y datos estructurados para home, temas, paneles, precios y guías
- [x] Cabecera pill, navegación responsive, contacto/modal, prefooter visual y footer estructural compartidos por todas las superficies comerciales; enlaces antiguos conservados o redirigidos
- [x] `pnpm fotos` ampliado con escenas del nuevo home, portfolio, paneles y cierre móvil/escritorio
- [x] Dos pases visuales completos y reproducibles: 42/42 PNG con digest agregado `a6ab36c4db011f6601a4b21e96c70322c99d7b04ce2268150c593d12a30e6aaf`
- [x] Pruebas dirigidas de los 14 bloques, shell, formularios, doce temas, seis paneles, previews y recorrido comercial; QA de navegador y responsive en escritorio y móvil
- [x] Regresión E2E integral 85/85 sobre la reconstrucción CAMP-parity, completada en 9,5 minutos junto con `pnpm check` 28/28 y 161 tests
- [x] Gates de honestidad: integraciones por madurez, demo noindex, cero escrituras externas de demos y D1 cero
- [x] Preferencias de cookies globales y reversibles desde el footer de las sesenta y ocho páginas, sin cargar analítica ni publicidad
- [x] Previews comerciales de doce webs y seis paneles con evidencia, límite, contacto y acceso profundo, bilingües y con fallback sin JavaScript
- [x] CTA por plan en home y `/planes/` que conserva el punto de partida hasta el formulario, separado del acceso a evidencia
- [x] Formulario de proyecto con teléfono y contexto opcionales, consentimiento obligatorio y política de datos bilingüe
- [x] Continuidad de la web o panel elegido hasta el formulario y el lead mediante contexto canónico validado, con plan derivado y sin duplicar formularios
- [x] Dirección ficticia y metadatos canónicos dentro de cada preview, bilingües y accesibles en escritorio de poca altura y móvil
- [x] Fichas públicas bilingües para cada dirección web, con captura real, alcance honesto, contacto contextual y demo separada sin relajar `X-Frame-Options`
- [x] Inicio comercial bilingüe en `/empezar/` que conserva plan, web o panel, reutiliza el único formulario real y separa la conversación comercial del cierre largo del home
- [x] Recorrido comercial guiado bilingüe de nueve hitos que cruza home, catálogo, web, reserva y gestor mediante un bridge site+demos; conserva estado en `sessionStorage`, permite pausar/reanudar/salir y no realiza escrituras
- [x] Captación breve del hero que conserva el correo hasta `/empezar/` sin enviarlo al servidor, limpia la URL y mantiene fallback sin JavaScript
- [x] Home de catorce bloques con hero, rails, formularios, sliders y popups de doce temas y seis paneles, alimentado solo por catálogos, textos y recursos visuales del proyecto
- [x] Builds estáticos verificados: 68 páginas de `apps/site` y 52 páginas de `apps/web`
- [x] Auditoría visual de navegador y responsive a 320/375/430/1366 px, rendimiento, accesibilidad, consola y recursos sobre los recorridos dirigidos
- [ ] Preview, smoke GET/HEAD y publicación de producción mediante los gates existentes; prueba de lead solo con autorización explícita

**Hecho cuando:** Reserva ofrece una experiencia pública estructuralmente equivalente a Camp, específica de restauración, con todos los gates verdes y sin ampliar silenciosamente las capacidades reales. El cierre local está completado; la publicación sigue requiriendo autorización expresa y validación de preview.

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

## M2 · Logic2B UI como contrato visual ✅

**Objetivo:** convertir `ui.logic2b.com` en una dependencia de diseño explícita, versionada y comprobable, sin borrar la identidad cálida ni reescribir los recorridos ya validados.
**Dependencias:** F11, F16.

- [x] Registro oficial y versión fijados en `packages/ui/components.json`
- [x] `Button` y `Badge` incorporados desde el registro con snapshots de base auditables y exports del paquete UI
- [x] Tokens semánticos de Logic2B UI adaptados a papel cálido, azul de acción, estados operativos y objetivos táctiles de 44 px
- [x] Consumo real de ambas primitivas en el gestor Vedra/Solane, incluida la lista de espera compartida
- [x] Gate local `pnpm verify:ui`, integrado en `pnpm check`, para proteger registro, versión, snapshots, tokens y consumo
- [x] Contrato, flujo de incorporación y decisión arquitectónica documentados en `docs/DESIGN.md` y ADR-017

**Hecho cuando:** el vínculo con `ui.logic2b.com` se puede demostrar desde configuración, código, snapshots, uso renderizado y un gate verde.

---

## M3 · Sincronización local entre pestañas ✅

**Objetivo:** hacer visible el inventario compartido en una sesión local abierta en más de una pestaña, sin convertir la demo en un backend multiusuario.
**Dependencias:** F7, F14, F15, F19, M2.

- [x] Suscripción común a `storage` con allowlist por clave y tratamiento seguro de `localStorage.clear()`
- [x] Gestor Vedra/Solane y widgets de reservas actualizan su estado al cambiar otra pestaña
- [x] Ticketing, confirmación de asistencia y superficies que dependen del inventario conservan parser defensivo y estados terminales
- [x] La pestaña escritora mantiene actualización inmediata, sin esperar al evento que el navegador no emite en el documento origen
- [x] La frontera permanece local: cero HTTP, proveedores, DB, jobs, credenciales o promesa de concurrencia entre usuarios
- [x] ADR-018 y E2E verifican que un evento publicado retira mesas del widget y aparece en el gestor ya abierto

**Hecho cuando:** una acción local en una pestaña se refleja en las superficies relacionadas abiertas en la misma sesión, con `pnpm check && pnpm e2e` verdes.

---

## M4 · Exportación local de informes derivados ✅

**Objetivo:** permitir que el recorrido comercial saque la muestra agregada del gestor en un formato legible, sin presentarla como contabilidad ni enviarla a terceros.
**Dependencias:** F10, F17, M2, M3.

- [x] Serializador CSV estable para ocupación, fuentes y escenarios hipotéticos
- [x] Escape de celdas y neutralización de prefijos de fórmula reutilizando la protección del CRM
- [x] Acción bilingüe en Informes de Vedra y Solane con descarga directa y nombre determinista
- [x] Copia visible que conserva `demo`, muestra ficticia y ausencia de contabilidad real
- [x] E2E y test unitario verifican contenido, descarga local y ausencia de red

**Hecho cuando:** el informe visible puede descargarse como CSV local sin cambiar el estado ni activar una integración; `pnpm check && pnpm e2e` verdes.

---

## Después (backlog, no fases)

Ver `../BACKLOG.md`: WhatsApp de confirmaciones, ca/fr, Google Reserve, propuesta nominal para prospecto real y vídeos de venta.
