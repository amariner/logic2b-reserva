# SIGUIENTE SESIÓN

**Fase actual:** F0 completada ✅ (2026-08-17)
**Siguiente fase:** **F1 · Dominio completo de restauración** — ver `docs/ROADMAP.md` §F1

## Siguiente paso concreto

1. Abrir `packages/domain/src/index.ts` (ya contiene el núcleo temporal, la escalera y las calculadoras).
2. Añadir las entidades: `Restaurant → Space → Table`, `Menu`, `TableBooking`, `RestaurantEvent` (con `consumesTableIds`), `PrivateHire`, depósitos (`riskTier`, `DepositPolicy`, `depositFor`, `noShowCharge`).
3. Implementar **`tableAvailability`** (el invariante estrella: evento publicado ⇒ sus mesas desaparecen de la disponibilidad) + `validateRestaurant`/`validateEvent`.
4. ≥30 tests en `index.test.ts` (hay 12; ampliar). Escribir `docs/adr/ADR-002-slots-15min.md` y `ADR-003-inventario-unico.md`.
5. Cerrar: `pnpm check` verde → PROGRESS.md → este archivo → checkboxes en ROADMAP.

## Bloqueos / avisos

- Ninguno. `pnpm install` ya ejecutado en F0; si el entorno es nuevo, correr `pnpm install` primero.
- Referencia útil para el estilo de dominio: `../estancia.logic2b.com/packages/domain/src/index.ts`.
