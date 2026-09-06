# Logic Reserva — contrato de trabajo

Motor de reservas **demo-first para restaurantes y eventos**. Tercer producto de la familia logic2b, hermano de `../estancia.logic2b.com` (molde arquitectónico) y `../camp.logic2b.com` (proceso y convenciones).

## Cómo continuar el proyecto (mecánica de sesión)

Cuando llegue una orden tipo "sigue desarrollando este proyecto" (`/goal` o similar):

1. **Lee `SIGUIENTE-SESION.md`** — dice la fase actual, el siguiente paso concreto y los bloqueos.
2. **Lee la fase correspondiente en `docs/ROADMAP.md`** — entregables con paths y criterio de hecho.
3. Ejecuta la fase (o el tramo que quepa en la sesión).
4. Cierra SIEMPRE con: `pnpm check` verde → entrada nueva en `PROGRESS.md` → actualizar `SIGUIENTE-SESION.md` → marcar checkboxes en `docs/ROADMAP.md`.
5. Las ideas fuera de la fase van a `BACKLOG.md`, no al código.

**Nunca cierres una sesión con `pnpm check` en rojo.** Si una decisión de arquitectura es nueva, escribe un ADR en `docs/adr/` antes del código.

## Qué es este producto (decisiones cerradas — no reabrir)

- **Demo comercial**, no SaaS: `DEMO_MODE=true`, cero DB y cero auth para el producto. Estado en localStorage versionado. El único endpoint real es la excepción separada `POST /api/leads` de la landing comercial (`COMMERCIAL_LEADS_ENABLED=true`, Resend → marinerandreu+logic@gmail.com). Los formularios de las marcas y los dashboards son muestras locales: nunca llaman a un backend. Contrato completo en `docs/DEMO-MODE.md`.
- **3 marcas ficticias**, una por modelo de negocio y nivel comercial:
  - **Brasca** — bistró de barrio. Plan *Básico*. Web propia con formulario que, en un proyecto real, enviaría la solicitud por email; la demo no envía.
  - **Vedra** — restaurante con 2 salas, grupos y menús cerrados. Plan *Gestión*. Widget nativo + backend demostrativo de organización.
  - **Solane** — gastronómico con eventos, ticketing, depósitos y privatizaciones. Plan *Inteligente*. Todo Gestión más IA demostrativa para decisiones, automatizaciones y gestión avanzada, con roles dirección/sala/cocina.
- **Tres planes comerciales**: Básico → Gestión → Inteligente. No existe un cuarto plan Automatiza: sus capacidades pertenecen a Inteligente.
- **Idiomas**: es/en, rutas espejo `/x/` y `/en/x/`, copy en `content.ts` tipado `as const`.
- **Diferenciales que la demo escenifica** (por orden): (A) **inventario único mesa+menú+evento** — crear un evento consume mesas reales del plano y el widget deja de ofrecerlas; (C) recorrido anti no-show — regla ficticia 0/25/50 % sobre el menú, información previa, aceptación con timestamp y liberación automática al sentarse; política, importe y validez reales se revisan por proyecto; (E) privatizaciones — solicitud→propuesta→señal→bloqueo del plano; (B) informes con escenarios, nunca resultados reales — exposición estimada y coste comparativo hipotético bajo un supuesto editable de 3 €/cubierto, sin tarifa atribuida ni mes real; (D) widget nativo con la marca del restaurante.
- Contexto de mercado en `docs/COMPETENCIA.md`. Roadmap completo en `docs/ROADMAP.md`.

## Convenciones duras

- **Dinero en céntimos enteros** (EUR). Desglose auditable en JSON, nunca un número suelto.
- **Fechas ISO `YYYY-MM-DD`**. Rangos temporales **semiabiertos `[start, end)`**. Slots de **15 minutos** (`SLOT_STEP_MIN`), no noches — es la diferencia de dominio clave frente a estancia/camp.
- **TypeScript estricto, `any` prohibido** (ESLint lo marca como error).
- **`packages/domain` es puro**: sin I/O, sin framework, sin dependencias. Todo cálculo de disponibilidad, precios, depósitos y recomendación vive ahí, con tests de invariantes.
- **Simulación honesta**: un solo punto de bifurcación por superficie, etiqueta visible ("Demostración ficticia · Sin reservas ni cobros reales"), el endpoint de leads falla en cerrado — nunca finge éxito.
- **Demos aisladas de SEO por tres vías**: `<meta robots>` en el layout, `x-robots-tag` en el worker, `Disallow` en robots.txt + exclusión del sitemap.
- **localStorage versionado** con parser defensivo (clave `logic-reserva-demo-{marca}-v1`); ante corrupción o versión desconocida → estado inicial.
- **Navegación/vistas definidas en UN solo sitio.** Vistas del gestor por `?vista=` con `history.replaceState`, sin router.
- Copy siempre desde `content.ts`; nada de strings de marca hardcodeados en componentes.
- Los nuevos recursos raster generados por IA usan la herramienta integrada de OpenAI, nunca Higgsfield; se solicitan de uno en uno y con una pausa entre generaciones.
- La usuaria de referencia del gestor es el jefe de sala en plena hora punta: usable a 1366px, foco visible, `prefers-reduced-motion`, contraste AA.
- **Sistema de diseño:** `https://ui.logic2b.com` es la fuente canónica. Nuevas primitivas React se copian con la CLI al paquete `packages/ui`, conservan snapshots en `.logic2b/base` y se consumen desde sus exports; los tokens oficiales se personalizan en `theme.css`. No crear un sistema transversal alternativo dentro de una app. Contrato en `docs/DESIGN.md` y ADR-017; `pnpm verify:ui` protege la integración.

## Arquitectura

```
apps/site       Astro — landing comercial Logic Reserva (indexable)
apps/web        Astro + islas React — webs demo de las 3 marcas (noindex)
apps/dashboard  React puro — componente DashboardDemo embebido como isla (NO desplegable)
apps/worker     Cloudflare Worker único — sirve assets compuestos + /api/leads
packages/domain Dominio puro con tests (slots, disponibilidad, depósitos, escalera)
packages/config PRODUCT, locales, demoSlugs, contacto Logic2B
packages/ui     theme.css — tokens + primitivas compartidas
```

El build es de composición: `apps/worker/scripts/compose.mjs` copia `site/dist` + `web/dist` en `worker/dist/assets`; un solo Worker sirve todo en `reserva.logic2b.com` (cero CORS).

## Comandos

- `pnpm dev` — worker con todo compuesto en local (puerto de wrangler)
- `pnpm check` — typecheck + lint + test + build (el gate de cierre de sesión)
- `pnpm e2e` — build + Playwright contra el worker en 127.0.0.1:8791
- `pnpm --filter @logic-reserva/domain test` — solo tests de dominio
- Deploy: manual y con gate doble (ver F12); nunca automático.

## Referencias de patrón (leer antes de reinventar)

- `../estancia.logic2b.com/apps/dashboard/src/state.ts` — localStorage versionado + `canOperate`
- `../estancia.logic2b.com/apps/web/src/components/DemoLanding.astro` — `saveJourney()` web→gestor
- `../estancia.logic2b.com/tests/e2e/estancia.spec.ts` — formato de la spec E2E
- `../estancia.logic2b.com/apps/worker/src/leads.ts` — endpoint de leads que falla en cerrado (para F12)
- NO copiar `@tailwindcss/vite` (dependencia muerta en estancia). `../gestor-reservas` (Svelte) solo inspiración visual.
