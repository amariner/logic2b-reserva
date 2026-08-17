# ADR-005 · Estado demo aislado por marca

**Estado:** Aceptada  
**Fecha:** 2026-08-17

## Contexto

Vedra y Solane representan niveles y recorridos distintos. Vedra persiste el ciclo de una reserva y un grupo; Solane debe compartir reservas, eventos y ventas entre su web, agenda pública y gestor. Reutilizar una única clave haría que los parsers conociesen campos ajenos y convertiría el reset de una demo en una mutación de la otra.

## Decisión

Cada marca conserva un contrato local versionado e independiente. Solane usa `logic-reserva-demo-solane-v1` con `{ bookings, events, sales }`; todas sus superficies leen y escriben ese mismo contrato. Vedra mantiene `logic-reserva-demo-vedra-v1` sin cambios.

La separación de almacenamiento no duplica reglas de negocio: disponibilidad, validación de eventos, conflictos y venta de aforo siguen delegándose en funciones puras del dominio. El dashboard común solo bifurca en su frontera por `slug` y entrega a cada marca su componente y parser.

## Consecuencias

- Web, widget, agenda y gestor de Solane comparten inventario y sobreviven a recargas.
- Restablecer Solane no elimina el recorrido de Vedra, y viceversa.
- Los contratos pueden evolucionar a ritmos distintos y deben mantener parsers defensivos y tests de compatibilidad.
- Las reglas transversales continúan centralizadas en `@logic-reserva/domain`; una divergencia entre superficies se considera un error.
