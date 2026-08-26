# Contrato técnico de `DEMO_MODE`

## Garantía

Los despliegues públicos de este repositorio declaran `DEMO_MODE=true`. Las rutas de Brasca, Vedra y Solane son superficies demostrativas: permiten recorrer el producto, pero no cobran, reservan, publican, notifican ni modifican sistemas externos.

La landing de Logic Reserva no forma parte de la simulación operativa. Tiene una única excepción deliberada: `POST /api/leads` puede enviar a Logic2B los datos comerciales que una persona introduce y consiente. La excepción requiere a la vez `COMMERCIAL_LEADS_ENABLED=true`, `LEADS_TRANSPORT=resend`, configuración válida y el secret separado `LEADS_RESEND_API_KEY`. No habilita ninguna otra API o proveedor.

En lenguaje comercial:

- “Visible en la demo” no significa “activo en producción”.
- “Activable” requiere validación y configuración por proyecto.
- “A medida” es algo que se puede analizar y desarrollar; no está incluido por existir una pantalla.
- Una capacidad parcial o futura nunca se presenta como disponible.

## Manifest de capacidades

El manifest ejecutable vive en `apps/worker/src/demo-mode.ts`:

- `productDemo.sideEffects=false`;
- `productDemo.jobs=false`;
- email, pagos, webhooks y almacenamiento externo: `disabled`;
- automatizaciones: `mock`;
- `commercialLanding.leadCapture=explicitly_configured` como única excepción.

`DEMO_MODE` falla cerrado: cualquier valor distinto del literal `false` mantiene el producto en demo. La excepción comercial también falla cerrada: solo el literal `true` la habilita.

## Matriz de efectos

| Superficie | Efecto posible | Barrera | Respuesta/evidencia |
|---|---|---|---|
| Demos y gestores | Reservas, eventos, bonos, depósitos, CRM | Sin APIs; estado versionado en `localStorage`; gate que prohíbe red | Recorrido local y restaurable |
| Confirmación de asistencia | Preparación y respuesta por referencia opaca | Ruta local sin transporte, endpoint, job ni datos de contacto visibles | Estado terminal en el mismo navegador; el enlace no se envía |
| Pagos | Cobro o sesión de pasarela | Sin proveedor, tarjeta ni endpoint | Representación visual inerte |
| Email/SMS de producto | Notificación a clientes | Sin proveedor ni endpoint | Aviso local; APIs desconocidas responden `404` |
| Webhooks/almacenamiento | Mutación de terceros | Sin rutas, bindings ni credenciales | APIs desconocidas responden `404` |
| Jobs/automatizaciones | Efectos diferidos | Sin triggers ni colas; automatizaciones calculadas localmente | Gate de configuración |
| Formulario comercial | Email real a Logic2B | Allowlist exacta, consentimiento, honeypot, rate limit, idempotencia y configuración validada | `202`, `400`, `429`, `502` o `503`; nunca éxito ficticio |
| Lead deshabilitado | Lectura, persistencia o email | Guardia en router, handler, Durable Object y adaptador | `403` antes de leer el body |

Los logs del proveedor solo incluyen evento, estado y tipo de error. No registran cuerpos, emails, tokens ni secretos.

## Inventario visual

| Capacidad | Estado | Qué demuestra | Límite / activación real |
|---|---|---|---|
| Web y solicitud Brasca | `demo_visual_disponible` | Experiencia Básico con marca propia | El formulario de marca no envía; requiere canal de proyecto |
| Reservas, mesas, menús y grupos Vedra | `demo_visual_disponible` | Inventario único y operación de sala | Estado ficticio local; requiere auth, DB y despliegue aislado |
| Lista de espera, CRM e informes | `demo_visual_disponible` | Recorridos de gestión y métricas derivadas | Sin perfiles reales ni exportación a terceros |
| Eventos y ticketing Solane | `demo_visual_disponible` | Aforo conectado al plano | Venta ficticia; sin cobro ni ticket real |
| Depósitos anti no-show | `demo_visual_disponible` | Política, desglose y consentimiento | Pasarela neutra; no crea sesiones ni cargos |
| Confirmación de asistencia | `demo_visual_disponible` | Enlace es/en, respuesta y seguimiento manual | Solo `localStorage`; sin WhatsApp, correo ni validez entre dispositivos |
| Privatizaciones y bonos | `demo_visual_disponible` | Propuesta, señal, bloqueo y canje | Todo queda en el navegador, sin validez económica |
| IA y automatizaciones | `demo_visual_disponible` | Recomendaciones deterministas y recorridos | Sin modelo, job o proveedor conectado |
| Email/SMS transaccional de producto | `demo_visual_pendiente` | Hay avisos visuales locales | Requiere proveedor, plantillas, consentimiento y pruebas por proyecto |
| Auth, permisos reales y persistencia multi-tenant | `en_ruta` | No se comunican como activos | Requiere diseño y backend de producción |
| Captación de leads Logic2B | `solo_interna` | Operación comercial de la landing | Única integración real; no es una capacidad del restaurante |
| Integraciones de cliente | `activable_por_proyecto` | Alcance analizable | Requiere ownership, secretos, migración y validación específicas |

## Datos y restauración

Las marcas y personas de las demos son ficticias. Vedra y Solane guardan únicamente estado demostrativo en claves `logic-reserva-demo-*-v1`. Los botones de restauración eliminan esas claves y reconstruyen fixtures conocidos; un payload corrupto o de versión desconocida también vuelve al estado inicial. El formulario comercial es la excepción y debe usarse con datos reales solo cuando se quiere contactar con Logic2B.

## Activación real del producto

Cambiar `DEMO_MODE=false` no convierte por sí solo esta demo en producción. Un despliegue de cliente separado debe tener capacidad activada en una allowlist propia, migraciones, auth y permisos, secretos independientes, proveedores verificados, observabilidad, recuperación, E2E/smoke verdes y aprobación explícita del rollout. Si falta cualquiera de esas condiciones, la integración debe permanecer cerrada.

Nunca se reutilizan el Worker, Durable Object, dominio ni secretos de la demo pública para un cliente.

## Pruebas, recuperación y rollback

`pnpm check` cubre dominio, tipos, build, manifest, ausencia de red en demos, ausencia de triggers/colas y guardas de leads. `pnpm e2e` recorre las superficies, impide mutaciones HTTP desde las demos y valida restauración. Los tests del Worker prueban tanto la entrega comercial con `DEMO_MODE=true` como el bloqueo antes del body cuando falta su allowlist.

Antes de publicar se ejecutan también los dry-runs descritos en `docs/DEPLOY.md`. Ante una regresión de captación, se cambia `COMMERCIAL_LEADS_ENABLED=false` o `LEADS_TRANSPORT=disabled` y se publica la configuración autorizada; no se borra infraestructura ni datos como mecanismo de rollback.

## Limitaciones conocidas

- No existe todavía el motor servidor de producción (auth, DB multi-tenant, pagos o integraciones de restaurante).
- `localStorage` es persistencia del navegador, no una garantía de conservación.
- La restauración es por navegador/dispositivo, no global.
- La excepción comercial escribe rate limit e idempotencia en Durable Objects y envía email; queda deliberadamente fuera de la promesa “sin efectos” de las demos de producto.
