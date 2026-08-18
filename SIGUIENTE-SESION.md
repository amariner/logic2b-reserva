# SIGUIENTE SESIÓN

**Fase actual:** F14 lista de espera completada en local ✅ · publicación autorizada · F12 sigue pendiente en preview (2026-08-18)
**Siguiente hito:** publicar de forma conjunta heroes v2, F13 y F14; después completar preview — ver `docs/ROADMAP.md` §F12–F14

## Siguiente paso concreto

1. Instalar y autenticar GitHub CLI (`brew install gh && gh auth login`); el usuario ya autorizó consolidar, subir y desplegar en una sola entrega heroes v2, F13, accesibilidad y F14.
2. Iniciar sesión en Resend y configurar de forma interactiva `LEADS_RESEND_API_KEY` en preview; nunca copiar la clave al repositorio ni al chat.
3. Desplegar preview/producción con los gates existentes, ejecutar `pnpm verify:public` y cerrar las dos casillas restantes de F12.

## Bloqueos / avisos

- La arquitectura comercial cerrada tiene exactamente tres planes: Básico → Gestión → Inteligente. Ver `docs/adr/ADR-010-tres-planes-y-backends-demostrativos.md`; no reintroducir Inicio ni Automatiza como planes.
- Los heroes v2 de Brasca, Vedra y Solane ya se generaron con OpenAI y se sirven como AVIF responsive. Para nuevas imágenes: OpenAI integrado, nunca Higgsfield, una generación cada vez y con pausa entre solicitudes.
- Brasca escenifica Básico (web + solicitud que en una implantación real llegaría por email), Vedra es el backend demo de Gestión y Solane es Gestión ampliado con IA, automatizaciones y operación avanzada.
- La IA y las automatizaciones de Solane son demostraciones deterministas en el navegador, sin modelo, agente, proveedor ni ejecución externa.
- La entrega real de producción ya fue autorizada y validada: devolvió `202 delivered` para la referencia `da2a827b-39f0-4e65-96cf-c4a894d4fcec`, `replayed: true` al repetir exactamente el mismo payload y el usuario confirmó visualmente la llegada única en Gmail. Para cerrar F12 falta repetir el protocolo en preview después de configurar su secret; no generar otro correo sin autorización explícita.
- `logic-reserva-preview` y `logic-reserva` existen. `reserva.logic2b.com` está actualizado y verificado como único dominio personalizado; producción declara `LEADS_RESEND_API_KEY` y su transporte ya se validó mediante entrega real. La auditoría de la sesión 25 confirma que preview sigue sin ningún secret.
- No volver a la antigua paleta burdeos: la referencia vigente es `docs/DESIGN.md` (papel cálido + azul único).
- El servidor dev actual queda disponible en `http://localhost:8787`; si la sesión se pierde, `pnpm dev` lo recompone después de `pnpm build` cuando cambie una app estática.
- Mantener un único punto de bifurcación demo/real y la etiqueta ficticia visible en web y gestor.
- El único formulario real es el comercial de la landing. Demos y dashboards son muestras locales sin backend, correo, pagos ni integraciones.
- Preservar F7–F11: demos y E2E no deben depender de Resend; solo `/api/leads` cambia de fail-closed a transporte real cuando la configuración lo habilita.
- No alterar los rótulos de estimación ni convertir CSV/localStorage en integraciones reales.
- Mantener la fecha operativa de Solane en el día fixture aunque el CRM contenga histórico anterior.
- El contrato local de F12, la arquitectura de tres planes y la auditoría visual/accesible (incluidos los heroes v2) están completos: 50 tests de dominio, 32 de dashboard, 10 de fixtures, 9 de Worker, `pnpm check` 28/28 y `pnpm e2e` 43/43. Los dry-runs de preview y producción aceptan 113 assets. No reimplementar el transporte; continuar desde la preview.
- `pnpm verify:public` revalida preview y producción sin enviar leads; los workflows lo ejecutan después del deploy.
- La última ejecución de `pnpm verify:public` fue verde el 2026-08-18; los heroes v2 siguen únicamente en el worktree hasta que se autorice su publicación.
- F13 deja en el worktree el nuevo copy es/en, el rediseño de la landing, las páginas comerciales ampliadas, el SEO técnico y el endurecimiento de accesibilidad. `pnpm check` sigue 28/28 y la cobertura E2E total pasa a 43 escenarios; no confundir esta validación local con una publicación.
- La sesión 26 revalidó desde cero el bundle pendiente: `git diff --check`, `pnpm check` 28/28, `pnpm e2e` 43/43 y los dos dry-runs estrictos con 113 assets. No se publicó ni se modificó ningún servicio externo.
- F14 añade `?vista=espera` en Vedra/Solane, persiste una cola compatible con v1 y convierte clientes sentados en reservas `walkin` mediante el inventario único. Gates de sesión 27: dominio 54, dashboard 39, `pnpm check` 28/28, E2E 45/45 y dos dry-runs con 113 assets; revisión visual a 1366/375 sin overflow.
- Mantener el selector de rol como demostrativo, local y sin autenticación; F10 no lo convierte en una frontera de seguridad.
- Mantener estado textual además de color, copy es/en, `noindex` triple y todos los E2E F7–F11 intactos.
