# ADR-009 · Coordinación segura de leads

**Estado:** Aceptada  
**Fecha:** 2026-08-17

## Contexto

El formulario comercial debe entregar una solicitud una sola vez, limitar abuso y decir la verdad cuando el proveedor no está disponible. Un límite guardado únicamente en memoria no sobrevive a instancias distintas del Worker; confiar solo en el identificador del proveedor tampoco evita carreras concurrentes antes de crear el correo.

## Decisión

El Worker separa validación, coordinación y transporte:

- Zod normaliza el payload y exige consentimiento explícito; un campo honeypot absorbe bots sin revelar el filtro.
- Un Durable Object por hash de IP conserva las marcas temporales y admite como máximo cinco solicitudes en una ventana deslizante de un minuto.
- Un Durable Object por huella estable del lead serializa entregas concurrentes, conserva una referencia y cachea durante 24 horas únicamente respuestas satisfactorias.
- Resend recibe además `idempotency-key: reserva-lead/{ref}/internal`, por lo que la protección existe tanto antes como dentro del proveedor.
- Los errores del proveedor no se cachean y responden `failed(502)`; configuración ausente o coordinación no disponible responde `disabled(503)`. Ninguna ruta convierte un fallo en éxito.
- El valor de `LEADS_RESEND_API_KEY` vive exclusivamente como secret cifrado de Cloudflare. Los logs solo incluyen el nombre de un campo de configuración inválido, nunca su valor ni el contenido del lead.

## Consecuencias

- Dos solicitudes simultáneas con el mismo contenido producen como máximo un correo y comparten referencia.
- El límite distribuido funciona entre instancias y reinicios del Worker, a costa de una invocación de Durable Object por intento.
- Una entrega fallida puede reintentarse; una correcta se reproduce como `202` con `replayed: true` durante 24 horas.
- La prueba local puede cubrir todos los estados sin red real. La aceptación final exige una preview, un remitente verificado y una entrega controlada con autorización explícita.
