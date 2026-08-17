# ADR-004 · Evolución aditiva del estado demo

**Estado:** Aceptada  
**Fecha:** 2026-08-17

## Contexto

F5 publicó el contrato local `logic-reserva-demo-vedra-v1` con reservas creadas desde la web. F6 necesita persistir además una solicitud de grupo y el progreso del recorrido guiado. Cambiar de clave o rechazar el payload anterior rompería el viaje web → gestor ya demostrado.

## Decisión

La versión `v1` admite extensiones aditivas mientras los campos existentes conserven su significado. El parser proporciona valores iniciales seguros cuando faltan `group`, `tourMode`, `tourStep` o `tourCompleted`, por lo que un payload de F5 sigue siendo válido. Los campos nuevos también se validan de forma defensiva y vuelven a su fixture ante corrupción.

Un incremento de versión queda reservado para cambios incompatibles: reinterpretar campos, eliminar datos o alterar invariantes persistidos. La clave pública no cambia durante F6.

## Consecuencias

- Las reservas creadas en F5 sobreviven al despliegue de F6.
- El reset total recupera fixtures; el reset del recorrido elimina solo su reserva derivada.
- Los tests deben cubrir explícitamente payload legado, versión futura, corrupción de los campos aditivos y serialización completa.
