# ADR-014 — Demo de producto con excepción comercial de leads

**Estado:** aceptada
**Fecha:** 2026-08-20

## Contexto

Logic Reserva debe poder enseñarse públicamente sin que las interacciones de producto afecten dinero, datos de restaurantes, clientes o proveedores. Al mismo tiempo, la landing del propio producto necesita recibir solicitudes comerciales reales gestionadas por Logic2B.

Tratar ambos tipos de interacción como una sola frontera haría que `DEMO_MODE=true` bloqueara una captación legítima o, al contrario, que la existencia de Resend pareciera habilitar efectos dentro de las demos.

## Decisión

- Los despliegues públicos declaran `DEMO_MODE=true`.
- Las superficies Brasca, Vedra y Solane no tienen acceso de escritura a red y usan fixtures más `localStorage` restaurable.
- El formulario de la landing es una excepción fuera del producto simulado. Requiere el flag independiente y exacto `COMMERCIAL_LEADS_ENABLED=true`.
- La excepción solo permite `POST /api/leads`; cualquier otra `/api/*` responde `404`.
- Router, handler, Durable Object y adaptador de Resend repiten la comprobación de la allowlist comercial.
- La entrega mantiene consentimiento, honeypot, límite por IP, idempotencia y configuración validada. Sin secret o transporte válido falla cerrado.
- El manifest de `apps/worker/src/demo-mode.ts` distingue expresamente `productDemo` y `commercialLanding`.

## Consecuencias

`DEMO_MODE=true` significa “producto simulado sin efectos”, no “sitio corporativo incapaz de recibir contacto”. La documentación y las pruebas deben conservar siempre esa precisión. Ningún proveedor añadido en el futuro puede reutilizar la excepción de leads.
