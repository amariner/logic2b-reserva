# SIGUIENTE SESIÓN

**Fase actual:** F12 en curso · producción actualizada y verificada ✅ (2026-08-17)
**Siguiente hito:** validar una entrega real autorizada y cerrar F12 — ver `docs/ROADMAP.md` §F12

## Siguiente paso concreto

1. Iniciar sesión en Resend y verificar que `hola@logic2b.com` pertenece a un dominio autorizado.
2. Con autorización explícita para generar un correo real, enviar una única solicitud controlada en `reserva.logic2b.com`; comprobar `delivered(202)`, referencia y llegada a `marinerandreu+logic@gmail.com`.
3. Repetir exactamente el mismo payload y verificar `replayed: true` sin un segundo correo.
4. Configurar después `LEADS_RESEND_API_KEY` en preview si se quiere conservar un entorno completo de validación previa para futuros cambios.

## Bloqueos / avisos

- La arquitectura comercial cerrada tiene exactamente tres planes: Básico → Gestión → Inteligente. Ver `docs/adr/ADR-010-tres-planes-y-backends-demostrativos.md`; no reintroducir Inicio ni Automatiza como planes.
- Brasca escenifica Básico (web + solicitud que en una implantación real llegaría por email), Vedra es el backend demo de Gestión y Solane es Gestión ampliado con IA, automatizaciones y operación avanzada.
- La IA y las automatizaciones de Solane son demostraciones deterministas en el navegador, sin modelo, agente, proveedor ni ejecución externa.
- Para cerrar F12 hace falta iniciar sesión en Resend y autorización explícita para realizar una entrega real. El despliegue no se considera autorización para generar ese correo de prueba.
- `logic-reserva-preview` y `logic-reserva` existen. `reserva.logic2b.com` está actualizado y verificado como único dominio personalizado; producción declara `LEADS_RESEND_API_KEY`, aunque su valor todavía no se ha validado mediante una entrega. Preview sigue sin secret.
- No volver a la antigua paleta burdeos: la referencia vigente es `docs/DESIGN.md` (papel cálido + azul único).
- El servidor dev actual sigue disponible en `http://localhost:8788`; si la sesión se pierde, `pnpm dev` lo recompone.
- Mantener un único punto de bifurcación demo/real y la etiqueta ficticia visible en web y gestor.
- El único formulario real es el comercial de la landing. Demos y dashboards son muestras locales sin backend, correo, pagos ni integraciones.
- Preservar F7–F11: demos y E2E no deben depender de Resend; solo `/api/leads` cambia de fail-closed a transporte real cuando la configuración lo habilita.
- No alterar los rótulos de estimación ni convertir CSV/localStorage en integraciones reales.
- Mantener la fecha operativa de Solane en el día fixture aunque el CRM contenga histórico anterior.
- El contrato local de F12, la arquitectura de tres planes y la auditoría visual están completos: 50 tests de dominio, 32 de dashboard, 9 de fixtures, 9 de Worker, `pnpm check` 28/28 y `pnpm e2e` 34/34. No reimplementar el transporte; continuar desde la preview.
- `pnpm verify:public` revalida preview y producción sin enviar leads; los workflows lo ejecutan después del deploy.
- Mantener el selector de rol como demostrativo, local y sin autenticación; F10 no lo convierte en una frontera de seguridad.
- Mantener estado textual además de color, copy es/en, `noindex` triple y todos los E2E F7–F11 intactos.
