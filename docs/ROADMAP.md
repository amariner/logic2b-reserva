# ROADMAP — Logic Reserva

Cada fase cabe en una sesión de trabajo y tiene criterio de hecho **verificable**. El estado vivo (fase actual + siguiente paso) está en `../SIGUIENTE-SESION.md`; este documento es el mapa completo. Al terminar una fase: marcar sus checkboxes aquí, entrada en `PROGRESS.md`, actualizar `SIGUIENTE-SESION.md`.

Guion comercial que todo esto construye (el "demo de 5 pasos" de Solane, validado contra la competencia en `COMPETENCIA.md`):
1. Vista de servicio del día con plano de sala vivo →
2. Crear evento "Cena maridaje, 24 plazas" seleccionando mesas reales → el widget deja de ofrecerlas (**inventario único, gap nº1 del mercado**) →
3. Un comensal reserva: mesa + menú degustación + depósito proporcional con condiciones y timestamp →
4. Marcar no-show con cobro proporcional / sentar y liberar depósito automáticamente →
5. CRM + export + calculadora de ahorro vs marketplace ("estimación de terceros").

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

## F1 · Dominio completo de restauración

**Objetivo:** todo el modelo y las reglas de negocio, puros y testeados. Es el cimiento de TODAS las fases siguientes.
**Dependencias:** F0.

- [ ] Entidades en `packages/domain/src/index.ts`: `RestaurantOrganization → Restaurant → Space (privatizable) → Table (minSeats/maxSeats, combinableWith)`, `Menu (pricePerPersonCents, courses, bookableOnline)`, `Shift` por restaurante
- [ ] `TableBooking`: `tableIds[]`, `slot`, `partySize`, `status: pending|confirmed|seated|finished|no_show|cancelled`, `guest`, `menuId?`, `deposit?`, `source: widget|phone|walkin|fixture`
- [ ] `RestaurantEvent`: `capacity`, `priceCents`, `soldSeats`, `consumesTableIds[]`, `status: draft|published|soldout|done`
- [ ] `PrivateHire`: `spaceId`, `slot`, `status: requested|proposed|deposit_paid|blocked`, propuesta con menú y mínimo de comensales
- [ ] **`tableAvailability(restaurant, bookings, events, hires, slot, partySize)`** — pura; excluye mesas por reserva activa, evento publicado o privatización bloqueada. `assertNoDoubleBooking`
- [ ] Depósitos: `RiskTier`, `riskTier({partySize, isPeakSlot, hasHistory, leadDays})`, `DepositPolicy` (none|card_hold|prepay, % sobre menú), `depositFor` con breakdown, `DepositRecord` (`termsAcceptedAt` obligatorio, `held→released|charged`), `noShowCharge` (nunca > depósito; `seated ⇒ released`)
- [ ] `validateRestaurant` / `validateEvent` con invariantes: `sum(maxSeats de consumesTableIds) >= capacity`; `soldSeats <= capacity`; mesas de un booking del mismo Space y combinables; `partySize` dentro de `[sum(min), sum(max)]`
- [ ] `CAPABILITIES` con `evidence: brasca|vedra|solane` y `maturity: available|functional-demo|next-to-validate|future`
- [ ] ≥30 tests, incluido el del invariante estrella: **publicar un evento retira sus mesas de `tableAvailability`**
- [ ] `docs/adr/ADR-002-slots-15min.md` y `ADR-003-inventario-unico.md`

**Hecho cuando:** `pnpm --filter @logic-reserva/domain test` verde; cero `any`; cero imports de I/O o framework.

---

## F2 · Tokens de tema + fixtures completos

**Objetivo:** identidad visual de las 3 marcas y los datos ficticios que alimentan todo.
**Dependencias:** F1.

- [ ] `packages/ui/src/theme.css` ampliado: tokens de estado de mesa (libre/ocupada/bloqueada-evento/privatizada), badges, tablas del gestor
- [ ] `apps/web/src/styles/demos.css`: temas completos por marca (tipografía display, superficies, hero)
- [ ] `apps/web/src/data.ts`: los 3 restaurantes completos validando `validateRestaurant` — Brasca (8 mesas, 1 sala, carta), Vedra (2 salas + terraza, ~18 mesas combinables, 3 menús incl. grupo), Solane (sala + privado, 12 mesas, menú degustación, 1 evento en borrador "Cena maridaje", 1 solicitud de privatización, reservas fixture del día con variedad de estados)
- [ ] `scripts/images.mjs` (sharp → AVIF 640/960/1600) + imágenes hero por marca en `apps/web/public/`
- [ ] Copy bilingüe de marcas en `apps/web/src/data.ts` (nav, hero, textos de formulario)

**Hecho cuando:** `pnpm check` verde; un test valida que TODOS los fixtures pasan `validateRestaurant`.

---

## F3 · Landing comercial

**Objetivo:** el funnel de venta y captación de leads (la razón de ser de la demo).
**Dependencias:** F2.

- [ ] `apps/site/src/content.ts` — todo el copy es (en mínimo viable), tipado `as const`
- [ ] `Landing.astro`: hero "Tus reservas, tu marca, tus datos" → problema con datos duros (no-show 3,3%, ~78€/mesa, >15.500€/año; experiencias +83%; ver COMPETENCIA.md §6) → los 4 diferenciales → tarjetas de las 3 demos → escalera de niveles con madurez visible → FAQ (legalidad de depósitos, RGPD, qué es demo) → formulario de leads
- [ ] Configurador de alcance (isla o script): `recommendLevel(ScopeSignals)` → recomienda plan y lo preselecciona en el form
- [ ] Calculadora pública de ahorro con `marketplaceSavings` + rótulo de estimación
- [ ] Form de leads → `POST /api/leads` (aún responde 503; UI muestra estado honesto "demo sin envío")
- [ ] Páginas: `/planes/`, `/soluciones/restaurantes/`, `/soluciones/grupos-y-eventos/`, `/legal/`, `/privacidad/`, `/cookies/` + espejos `/en/` stub
- [ ] `sitemap.xml.ts` (excluye /demos/), `robots.txt` (Disallow /demos/), consentimiento antes de cualquier analítica

**Hecho cuando:** E2E site en `tests/e2e/reserva.spec.ts`: 200 en todas las rutas, sin overflow horizontal a 320/375/430/1366px, cero errores de consola.

---

## F4 · Demo Brasca (nivel Inicio)

**Objetivo:** la marca que vende el peldaño básico: "la web que ya vende".
**Dependencias:** F2.

- [ ] `/demos/brasca/` one-page: hero, carta con precios (desde fixtures), horarios, ubicación ficticia, formulario de solicitud de mesa
- [ ] Formulario MUERTO con mensaje honesto: "Tu solicitud llegaría por email al restaurante — sin gestor en este nivel"
- [ ] Espejo `/en/demos/brasca/`
- [ ] Noindex triple verificado (meta + header worker + robots.txt)

**Hecho cuando:** E2E brasca: 200, noindex, el submit muestra el mensaje, sin overflow, consola limpia.

---

## F5 · Vedra: widget de reserva + gestor básico

**Objetivo:** el corazón del producto — reservar mesa con menú desde la web y verlo en el gestor.
**Dependencias:** F2.

- [ ] `apps/web/src/islands/BookingWidget.tsx`: fecha → servicio (comida/cena) → personas → hora (franjas de 15' de `seatingTimes` filtradas por `tableAvailability` sobre fixtures) → **menú opcional con precio/persona** → datos → confirmación
- [ ] `saveJourney()`: escribe la reserva en `logic-reserva-demo-vedra-v1` y ofrece "Abrir el gestor"
- [ ] `apps/dashboard/src/state.ts`: `DemoState` versionado + `parseStored` defensivo (con `state.test.ts`: corrupción, versión futura, merge)
- [ ] `DashboardDemo.tsx` real con vistas `?vista=servicio` (timeline mesas × franjas del día, la reserva del widget aparece con badge "Desde la web demo") y `?vista=reservas` (lista + transiciones de estado)
- [ ] `apps/web/src/pages/demos/vedra/gestion/index.astro` monta la isla
- [ ] Botón "Restablecer demo"

**Hecho cuando:** E2E: reservar en la web → abrir gestor → la reserva está; `state.test.ts` verde.

---

## F6 · Vedra: plano de sala + grupos

**Objetivo:** el recorrido dramatizado de Vedra — grupo de 8, combinar mesas, menú de grupo.
**Dependencias:** F5.

- [ ] Vista `?vista=plano`: plano por Space (SVG o grid), color por estado de mesa, click → detalle
- [ ] Combinar mesas: para partySize > maxSeats de una mesa, proponer combinaciones válidas (`combinableWith`)
- [ ] Recorrido guiado: solicitud de grupo de 8 (fixture) → combinar T4+T5 → asignar menú de grupo → confirmar
- [ ] Vistas `?vista=clientes` (ficha básica) y `?vista=ajustes` (turnos, mesas, menús — lectura con etiqueta de madurez)
- [ ] Tour guiado de 3 pasos de Vedra

**Hecho cuando:** E2E del recorrido de grupo completo.

---

## F7 · Solane: web + eventos + INVENTARIO ÚNICO

**Objetivo:** el diferencial estrella en pantalla (pasos 1–2 del guion).
**Dependencias:** F6.

- [ ] `/demos/solane/` con `BookingWidget` completo y `/demos/solane/eventos/` con `EventTickets.tsx`: lista de eventos, aforo restante, compra simulada de plazas
- [ ] Gestor Solane: vistas `servicio`, `plano`, `reservas`, `eventos`
- [ ] **Crear evento desde el gestor**: nombre, fecha, precio, aforo, selección de mesas del plano → al publicar, las mesas quedan bloqueadas (estado visual propio) y `tableAvailability` deja de ofrecerlas en el widget para slots solapados
- [ ] Vender plazas desde `/eventos/` descuenta aforo en tiempo real (localStorage compartido)

**Hecho cuando:** E2E del invariante estrella: crear evento en gestor → recargar web → la franja del evento no ofrece esas mesas; comprar plazas → aforo baja.

---

## F8 · Depósitos anti no-show (ley española)

**Objetivo:** pasos 3–4 del guion; el argumento con números duros.
**Dependencias:** F7.

- [ ] En el widget Solane: `riskTier` (grupo grande / viernes noche / sin historial) → depósito proporcional al menú con desglose visible, checkbox de condiciones + `termsAcceptedAt` mostrado, pasarela simulada en `<dialog>` etiquetada "Pasarela neutra · demo — no se realizará ningún cobro"
- [ ] En el gestor: marcar no-show → cobro proporcional con breakdown y referencia a las condiciones aceptadas; sentar la reserva → "Depósito liberado automáticamente"
- [ ] Panel lateral explicativo (copy de COMPETENCIA.md §5-C): informado antes de reservar + proporcional al perjuicio

**Hecho cuando:** E2E pasos 3–4 completos con aserciones sobre el desglose y la liberación.

---

## F9 · Privatizaciones + roles

**Objetivo:** el módulo que más impresiona a un propietario (diferencial E).
**Dependencias:** F7.

- [ ] Vista `?vista=privatizaciones`: solicitud fixture (`requested`) → "Preparar propuesta" (menú + precio/persona + mínimo) → "Registrar señal" (simulada) → `blocked`: el Privado se pinta bloqueado en plano y desaparece del widget
- [ ] Selector de rol Dirección/Sala/Cocina con `canOperate`; acciones fuera de rol deshabilitadas con aviso explícito
- [ ] Tour guiado de 3 pasos de Solane

**Hecho cuando:** E2E: flujo privatización completo + cocina no puede sentar mesas ni cobrar no-shows.

---

## F10 · CRM + informes + calculadora

**Objetivo:** paso 5 del guion; cerrar el argumento comercial.
**Dependencias:** F8.

- [ ] Vista `?vista=clientes` Solane: ficha con histórico, gasto, alergias, notas de sala, export CSV simulado (descarga real de los fixtures)
- [ ] Vista `?vista=informes`: ocupación por servicio, no-shows evitados (estimación etiquetada), origen de reservas, y la **calculadora de ahorro vs marketplace** con el rótulo "estimación basada en tarifas publicadas por terceros"
- [ ] Informes básicos en Vedra (subset)

**Hecho cuando:** E2E paso 5; el rótulo de estimación tiene aserción propia en la spec.

---

## F11 · i18n en + E2E integral + pulido

**Objetivo:** producto enseñable de punta a punta en dos idiomas.
**Dependencias:** F3–F10.

- [ ] Espejo `/en/` completo de site y demos; copy centralizado (cero ternarios de locale en JSX)
- [ ] `tests/e2e/reserva.spec.ts` consolidado: todas las rutas 200, noindex de demos, sin overflow a 320/375/430/1366, cero errores de consola, los 3 recorridos dramatizados y el test **"guion de demo comercial"** (5 pasos Solane de una tirada)
- [ ] Imágenes AVIF con `<picture>` + srcset; accesibilidad: foco visible, aria en el plano, reduced-motion
- [ ] Revisión visual a 375px y 1366px de cada pantalla

**Hecho cuando:** `pnpm check && pnpm e2e` verde íntegro.

---

## F12 · Worker real + deploy

**Objetivo:** reserva.logic2b.com en producción con leads reales.
**Dependencias:** F11.

- [ ] `apps/worker/src/leads.ts`: Zod + honeypot + rate-limit 5/min + Resend con idempotency-key → marinerandreu@gmail.com; estados delivered(202)/invalid(400)/limited(429)/failed(502)/disabled(503) — **nunca finge entrega** (copiar patrón de `../estancia.logic2b.com/apps/worker/src/leads.ts`)
- [ ] `LEADS_TRANSPORT: 'resend'` + secret `LEADS_RESEND_API_KEY`
- [ ] Workflow de deploy con gate doble: `workflow_dispatch` que exige teclear `DEPLOY` + variable `RESERVA_DEPLOY_ENABLED == 'true'`
- [ ] Verificación en preview: lead de prueba llega por email; cabeceras de seguridad y x-robots-tag presentes
- [ ] Deploy manual a `reserva.logic2b.com` (zona logic2b.com)

**Hecho cuando:** demo pública en reserva.logic2b.com y un lead de prueba en la bandeja de entrada.

---

## Después (backlog, no fases)

Ver `../BACKLOG.md`: gift cards/bonos, WhatsApp de confirmaciones, ca/fr, IA de predicción de no-show, Google Reserve, propuesta nominal para prospecto real, vídeos de venta.
