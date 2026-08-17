# PROGRESS — Logic Reserva

Una entrada por sesión, la más reciente arriba. Formato: fecha · fase · qué se hizo · estado del check.

---

## 2026-08-17 · Sesión 1 · F0 Scaffold ✅

- Sesión de grilling completa: decisiones de producto cerradas (demo comercial patrón estancia, 3 marcas Brasca/Vedra/Solane, escalera de la familia, es/en, los 5 diferenciales con el inventario único como protagonista).
- Exploración de los proyectos hermanos (camp = proceso, estancia = arquitectura; gestor-reservas descartado como base, es Svelte) e investigación profunda de competencia → `docs/COMPETENCIA.md`.
- Scaffold completo del monorepo: raíz + packages (config, domain con núcleo temporal/escalera/calculadoras + 12 tests, ui con tokens) + apps (site con index es/en, web con DemoLayout y stubs de las 3 marcas, dashboard stub, worker con compose + security headers + x-robots-tag + /api/leads fail-closed 503).
- Documentación de proceso: CLAUDE.md, docs/ROADMAP.md (F0–F12 con criterios de hecho), docs/COMPETENCIA.md, docs/DESIGN.md, ADR-001, BACKLOG.md, SIGUIENTE-SESION.md.
- `pnpm check`: ✅ verde (28/28 tareas; 10 tests de dominio). Prueba de humo del worker local: landing, demos y espejo /en/ en 200, `/api/leads` responde 503 fail-closed, headers de seguridad + `x-robots-tag: noindex` en `/demos/*`.
- Ajustes sobre el molde estancia: `turbo.json` build depende de typecheck (evita carrera de `astro check` y `astro build` sobre `.astro/`); `run_worker_first` incluye `/demos/*` y `/en/demos/*` para que el worker inyecte de verdad el `x-robots-tag` (en estancia solo cubre `/api/*`, así que allí ese header nunca se aplica — apuntado como posible fix en aquel proyecto).
