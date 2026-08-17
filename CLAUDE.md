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

- **Demo comercial**, no SaaS: cero DB, cero auth. Estado en localStorage versionado. El único endpoint real es `POST /api/leads` (Resend → marinerandreu@gmail.com), que se activa en F12.
- **3 marcas ficticias**, una por modelo de negocio y nivel comercial:
  - **Brasca** — bistró de barrio. Nivel *Inicio*. Web con formulario muerto, sin gestor.
  - **Vedra** — restaurante con 2 salas, grupos y menús cerrados. Nivel *Gestión*. Widget nativo + gestor básico.
  - **Solane** — gastronómico con eventos, ticketing, depósitos y privatizaciones. Nivel *Visión/Inteligente*. Gestor completo con roles (dirección/sala/cocina).
- **Escalera comercial**: Inicio → Gestión → Automatiza → Inteligente (idéntica a la familia).
- **Idiomas**: es/en, rutas espejo `/x/` y `/en/x/`, copy en `content.ts` tipado `as const`.
- **Diferenciales que la demo escenifica** (por orden): (A) **inventario único mesa+menú+evento** — crear un evento consume mesas reales del plano y el widget deja de ofrecerlas; (C) anti no-show conforme a ley española — depósito escalonado por riesgo, proporcional al menú, condiciones aceptadas con timestamp, liberación automática al sentarse; (E) privatizaciones — solicitud→propuesta→señal→bloqueo del plano; (B) calculadora de ahorro vs marketplace — SIEMPRE etiquetada "estimación basada en tarifas publicadas por terceros"; (D) widget nativo con la marca del restaurante.
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
- La usuaria de referencia del gestor es el jefe de sala en plena hora punta: usable a 1366px, foco visible, `prefers-reduced-motion`, contraste AA.

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
