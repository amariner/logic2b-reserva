# Logic Reserva

Motor de reservas **demo-first para restaurantes y eventos**: mesas, menús y eventos con un solo inventario. Tercer producto de la familia logic2b (hermano de Logic Camp y Logic Estancia).

- **Qué es:** demo comercial navegable con 3 restaurantes ficticios: Brasca representa Básico (web + solicitudes por email), Vedra Gestión (backend de organización) y Solane Inteligente (Gestión + IA demostrativa, automatizaciones y operación avanzada), más landing de producto con captación de leads real.
- **Qué no es:** un SaaS en producción. Sin base de datos ni auth; todo el estado de las demos vive en el navegador (localStorage) y está etiquetado como ficticio.

## Frontera de demo

Los despliegues públicos usan `DEMO_MODE=true`: ninguna interacción de Brasca, Vedra o Solane cobra, reserva, publica, notifica ni escribe fuera del navegador. La única excepción real es el formulario de la landing de Logic Reserva, habilitado separadamente con `COMMERCIAL_LEADS_ENABLED=true`, que envía a Logic2B leads consentidos y no habilita capacidades del producto.

Contrato, matriz de efectos, inventario de capacidades, activación y rollback: [`docs/DEMO-MODE.md`](docs/DEMO-MODE.md).

## Arranque

```bash
pnpm install
pnpm dev        # worker local con landing + demos
pnpm check      # typecheck + lint + test + build
pnpm e2e        # build + Playwright
pnpm fotos      # build + 16 capturas comerciales deterministas
```

## Para continuar el desarrollo

Lee `CLAUDE.md` (contrato de trabajo) → `SIGUIENTE-SESION.md` (dónde estamos) → `docs/ROADMAP.md` (fases y criterios de hecho). Contexto de mercado en `docs/COMPETENCIA.md`; contrato de capturas en `docs/SALES-ASSETS.md`; preview y producción en `docs/DEPLOY.md`.
