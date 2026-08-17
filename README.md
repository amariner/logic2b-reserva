# Logic Reserva

Motor de reservas **demo-first para restaurantes y eventos**: mesas, menús y eventos con un solo inventario. Tercer producto de la familia logic2b (hermano de Logic Camp y Logic Estancia).

- **Qué es:** demo comercial navegable con 3 restaurantes ficticios: Brasca representa Básico (web + solicitudes por email), Vedra Gestión (backend de organización) y Solane Inteligente (Gestión + IA demostrativa, automatizaciones y operación avanzada), más landing de producto con captación de leads real.
- **Qué no es:** un SaaS en producción. Sin base de datos ni auth; todo el estado de las demos vive en el navegador (localStorage) y está etiquetado como ficticio.

## Arranque

```bash
pnpm install
pnpm dev        # worker local con landing + demos
pnpm check      # typecheck + lint + test + build
pnpm e2e        # build + Playwright
```

## Para continuar el desarrollo

Lee `CLAUDE.md` (contrato de trabajo) → `SIGUIENTE-SESION.md` (dónde estamos) → `docs/ROADMAP.md` (fases F0–F12 con criterios de hecho). Contexto de mercado en `docs/COMPETENCIA.md`; preview y producción en `docs/DEPLOY.md`.
