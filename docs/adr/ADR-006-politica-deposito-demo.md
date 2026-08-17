# ADR-006 · Política de depósito de la demo

**Estado:** Aceptada  
**Fecha:** 2026-08-17

## Contexto

El dominio calcula riesgo y depósitos, pero no prescribe qué porcentaje comercial corresponde a cada nivel. F8 necesita un recorrido reproducible que muestre proporcionalidad, aceptación previa y resolución sin presentar una política ficticia como asesoramiento legal ni como configuración de producción.

## Decisión

Solane usa una política exclusivamente demostrativa y visible:

- riesgo bajo: sin depósito (0 %);
- riesgo medio: huella bancaria simulada del 25 %;
- riesgo alto: prepago simulado del 50 %.

El porcentaje se aplica al precio por persona del menú multiplicado por el grupo mediante `depositFor`. `riskTier` recibe tamaño del grupo, viernes noche, ausencia de historial y antelación. La aceptación se guarda antes de confirmar con `termsAcceptedAt` y el gestor resuelve con `noShowCharge`, que nunca supera el depósito calculado y libera la totalidad al sentar.

La pasarela no solicita tarjeta ni realiza red. Todo el recorrido está rotulado como demo y el panel operativo recuerda que la legalidad depende de informar previamente y mantener proporcionalidad con el perjuicio.

## Consecuencias

- Los importes son deterministas y auditables de web a gestor.
- Cambiar porcentajes requiere una decisión explícita y actualizar copy, tests y ejemplos.
- La política no es recomendación jurídica ni configuración lista para producción.
- Un proveedor real de pagos queda fuera de alcance; la demo conserva únicamente estado local.
