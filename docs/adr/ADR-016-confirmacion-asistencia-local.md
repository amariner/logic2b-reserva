# ADR-016 · Confirmación de asistencia con enlace local

**Estado:** aceptada

**Fecha:** 2026-08-26

## Contexto

F17 identifica reservas que conviene revisar, pero una recomendación consultiva no demuestra el recorrido humano posterior. La demo necesita preparar y responder una confirmación sin prometer WhatsApp, correo, jobs, webhooks ni una entrega que el producto todavía no implementa.

## Decisión

- `AttendanceConfirmation` es un modelo puro con referencia opaca, vigencia semiabierta y estados `prepared`, `attendance_confirmed`, `change_requested` y `expired`.
- Las respuestas y la caducidad son terminales e idempotentes. Un timestamp anterior a la preparación se rechaza; una respuesta al alcanzar la caducidad termina como `expired`.
- El estado Solane v1 se amplía de forma aditiva. El parser descarta payloads corruptos, referencias duplicadas y registros huérfanos, y conserva payloads anteriores sin este campo.
- Dirección y Sala pueden preparar un enlace para una reserva activa. Cocina solo consulta. La mutación aplica el permiso aunque se invoque fuera de la interfaz.
- La ruta es/en muestra únicamente restaurante, fecha, hora y tamaño de grupo. Nunca muestra nombre, correo ni teléfono.
- La respuesta se guarda en `localStorage`. Solicitar cambio crea solo un estado de seguimiento manual: no cancela, no libera mesas y no modifica reserva, score ni depósito.
- Un enlace desconocido, caducado o ya respondido falla de forma segura y no revela si existe una reserva asociada. El acuse se muestra solo inmediatamente después de responder; recargar vuelve al fallo seguro.

## Consecuencias

La demo prueba el flujo completo en un solo navegador y sin efectos externos. Un enlace copiado a otro dispositivo no funcionará porque no existe backend compartido; esta limitación es deliberada y visible. El transporte real de confirmaciones permanece en backlog y exigirá su propio modelo de autorización, privacidad, observabilidad y entrega.
