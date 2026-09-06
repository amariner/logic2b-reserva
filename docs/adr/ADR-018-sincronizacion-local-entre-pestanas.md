# ADR-018 · Sincronización local entre pestañas

**Estado:** aceptada

**Fecha:** 2026-09-03

## Contexto

Las webs demo y sus gestores comparten un estado versionado en `localStorage`. Hasta ahora cada superficie volvía a leerlo al montar o al recargar, pero una pestaña ya abierta no reflejaba una reserva, venta, bloqueo o respuesta creada desde otra pestaña. Esto debilitaba la demostración del inventario único y podía mostrar disponibilidad obsoleta durante un recorrido.

El producto sigue siendo una demostración local: no hay servidor, sincronización remota, autenticación ni transporte transaccional. La mejora debe conservar esa frontera y no convertir `localStorage` en una promesa de consistencia multiusuario.

## Decisión

- Las superficies que leen un estado demo se suscriben al evento nativo `storage` mediante `subscribeToStorageKey` en `apps/dashboard/src/storage-sync.ts`.
- Cada listener acepta solo su propia clave y los eventos `clear()` (`key === null`); los cambios de `sessionStorage` u otras claves se ignoran.
- La pestaña que escribe continúa actualizando su propio React state explícitamente, porque el navegador no emite `storage` en el documento que originó el cambio.
- El payload entrante siempre pasa por el parser defensivo existente antes de llegar a la interfaz. Un estado corrupto, futuro o borrado vuelve al fixture inicial.
- La sincronización es una comodidad de una sesión local compartida, no una garantía de concurrencia: dos pestañas que escriban simultáneamente siguen sujetas a la semántica de `localStorage` y no representan usuarios distintos.

## Consecuencias

El evento publicado en el gestor puede retirar sus mesas del widget ya abierto, y las acciones de reservas, lista de espera, bonos, ticketing y confirmación se reflejan en las superficies abiertas de la misma sesión. La solución no añade peticiones HTTP, bindings, jobs, base de datos, credenciales ni efectos reales.
