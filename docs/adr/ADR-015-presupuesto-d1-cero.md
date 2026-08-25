# ADR-015 · Presupuesto D1 cero

**Estado:** Aceptada

**Fecha:** 2026-08-25

## Contexto

Logic Reserva es una demo comercial construida deliberadamente sin base de datos. Las reservas ficticias, eventos, bonos y estados operativos se generan desde fixtures versionados y se modifican solo en `localStorage`. El único efecto real es la captación comercial separada de `/api/leads`, coordinada mediante Durable Objects y entregada por Resend.

Una auditoría local y de la versión activa confirmó que el Worker solo expone `fetch` y la clase `LeadCoordinator`: no tiene binding D1, handler `scheduled`, Cron Trigger, migraciones SQL, seed remoto ni endpoint que escriba filas. Añadir D1 a esta demo aumentaría coste y superficie de datos sin resolver una necesidad actual.

## Decisión

- El presupuesto D1 de Logic Reserva es **cero**: 0 consultas, 0 filas leídas y 0 filas escritas por ejecución y por día.
- Producción y preview no pueden declarar `d1_databases`, `triggers.crons` ni handlers `scheduled`.
- `apps/worker/d1-budget.json` fija los límites gratuitos de referencia y un fusible a cero. Si en otro producto se necesitara un refresco de fixtures, su intervalo mínimo sería semanal; en este despliegue no existe ninguno.
- El gate `verify-d1-budget.mjs` falla ante bindings, crons, API D1 o SQL de runtime no presupuestados. También mantiene protegidas las tablas lógicas `real_reservations` y `real_contacts`.
- Catálogo, actividades y contenido permanecen como fixtures estáticos. Los resets de demo continúan siendo eliminaciones locales por navegador, nunca seeds o truncados remotos.
- Introducir persistencia real requerirá otra decisión explícita con auth, aislamiento, migraciones aditivas, índices, presupuesto medido y un plan de preservación; no basta con relajar este fusible.

## Consecuencias

- El consumo D1 de `reserva.logic2b.com` es mínimo, determinista y no depende del tráfico.
- No hay índices D1 que añadir ni consultas que optimizar mientras el presupuesto siga a cero.
- Reservas ficticias pueden regenerarse sin tocar sistemas remotos; contactos comerciales y cualquier futura reserva real quedan fuera de los resets.
- El límite gratuito compartido de la cuenta puede agotarse por otros Workers o bases. Esa operación debe corregirse en sus repositorios propietarios y no justifica conectar Logic Reserva a esas bases.
