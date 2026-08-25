# Presupuesto y auditoría de Cloudflare D1

**Corte:** 2026-08-25 · **Proyecto:** `reserva.logic2b.com` · **Límites de referencia:** 5.000.000 filas leídas y 100.000 escritas al día.

No existe `AGENTS.md` dentro del repositorio. La auditoría se realizó después de leer `CLAUDE.md`, README, runbook de despliegue, contrato demo, roadmap y ADRs.

## Resultado

Logic Reserva consume **0 filas D1 leídas y 0 escritas**. El repositorio y la versión activa no tienen binding D1, SQL, migraciones, seed remoto, Cron Trigger ni handler `scheduled`. El tráfico web, las reservas demo y los contactos comerciales no pueden incrementar el contador D1.

El gate local mantiene ese presupuesto en `apps/worker/d1-budget.json` y falla si se introduce una dependencia D1 o un cron sin una nueva decisión de arquitectura.

## Inventario del proyecto

| Superficie | Persistencia o efecto | Frecuencia | D1 por ejecución | Tablas D1 |
|---|---|---:|---:|---|
| GET de landing, páginas y assets | Assets estáticos del Worker | Por visita | 0 lecturas / 0 escrituras | Ninguna |
| Reservas Vedra/Solane | Fixtures + `localStorage` por navegador | Por acción del visitante | 0 / 0 | Ninguna |
| Eventos, ventas, privatizaciones, espera y bonos demo | `localStorage` de Solane | Por acción del visitante | 0 / 0 | Ninguna |
| Restablecer una demo | Elimina una clave local y reconstruye fixtures | Manual, por navegador | 0 / 0 | Ninguna |
| `POST /api/leads` | Durable Objects para rate limit/idempotencia + Resend | Solo al enviar el formulario | 0 / 0 | Ninguna |
| Alarmas de `LeadCoordinator` | Limpieza del estado técnico del Durable Object | 60 s tras rate limit; 24 h tras entrega correcta | 0 / 0 | Ninguna |
| `pnpm fotos`, build y composición | Archivos locales/estáticos | Manual o durante CI | 0 / 0 | Ninguna |
| Workflows de preview/producción | Check, E2E, dry-run, despliegue manual | Solo `workflow_dispatch` autorizado | 0 / 0 | Ninguna |

No existen otros endpoints de escritura. Cualquier `/api/*` distinta de `/api/leads` responde `404`; las demos tienen un gate que prohíbe `fetch`, formularios con `action`, WebSocket, EventSource y `sendBeacon`.

### Jobs, crons, seeds y resets

- Cron Triggers de Cloudflare: **0**.
- Handlers `scheduled`: **0**.
- Colas y productores/consumidores: **0**.
- Bases o migraciones D1 declaradas: **0**.
- Seeds D1 locales o remotos: **0**.
- Resets D1 públicos o internos: **0**.
- Alarmas Durable Object: dos TTL técnicos por clave; no son crons, no recorren tablas y no usan D1.

## Fronteras de datos

| Categoría | Tratamiento |
|---|---|
| Reservas reales | El proyecto no las recibe ni persiste actualmente. Quedan protegidas por política: ningún reset o fixture puede representarlas o borrarlas. |
| Contactos reales | Solo entran por `/api/leads`. El Durable Object conserva timestamps, referencia y respuesta técnica; no persiste el cuerpo del contacto en D1. La entrega por Resend se mantiene intacta. |
| Reservas ficticias | Fixtures de código y estado local aislado por marca. Se pueden restaurar por navegador sin trabajo programado. |
| Catálogo, actividades y contenido | Fixtures TypeScript y páginas estáticas. No existe sincronización automática. |

## Consultas, índices, polling y escrituras repetidas

No hay consultas SQL ni tablas D1 en el runtime, por lo que no existen full scans o índices D1 ausentes que corregir en este repositorio. Tampoco hay polling en las demos ni jobs periódicos. Las escrituras de reservas demo son sustituciones acotadas de una única clave local; quedan fuera de la cuota D1.

`LeadCoordinator` sí usa almacenamiento SQLite de Durable Objects, que es un producto y contador distinto. Una solicitud nueva consulta y actualiza el rate limit, consulta la caché idempotente y, tras una entrega correcta, conserva una referencia y resultado con TTL. Los replays reutilizan el resultado y no vuelven a enviar correo. No se ha cambiado este flujo porque ya es acotado, idempotente y no consume D1.

## Comprobación remota de solo lectura

La sesión Cloudflare estaba autenticada. Se consultaron únicamente metadatos agregados, la versión activa y D1 Insights; no se leyeron filas ni valores personales.

La versión activa de `logic-reserva` declara únicamente assets, variables, un secret y el namespace `LeadCoordinator`. Sus handlers son `fetch` y la clase Durable Object; no aparece D1 ni `scheduled`.

Inventario de bases de la misma cuenta, no vinculadas a Logic Reserva:

| Base | Tablas | Filas leídas, últimas 24 h | % límite lectura | Filas escritas, últimas 24 h | % límite escritura | Vínculo con `logic-reserva` |
|---|---:|---:|---:|---:|---:|---|
| `ecom-demo` | 135 | 134.611 | 2,6922 % | 54.625 | 54,625 % | Ninguno |
| `logic-camp-demo` | 22 | 13.049.636 | 260,9927 % | 16 | 0,016 % | Ninguno |
| `mvp-db` | 5 | 0 | 0 % | 0 | 0 % | Ninguno |
| `c-reservas` | 1 | 0 | 0 % | 0 | 0 % | Ninguno |
| **Total de cuenta observado** | — | **13.184.247** | **263,6849 %** | **54.641** | **54,641 %** | — |

El exceso de lectura observado pertenece a otro proyecto. El perfil agregado de siete días señala como principal consumidor una búsqueda repetida en `booking_guests` por `guest_id` (39.391 ejecuciones, 3.491 filas leídas de media), seguida de listados de reservas con joins amplios. Es evidencia compatible con un índice ausente y polling/repetición en ese Worker, pero debe corregirse en su repositorio propietario. En `c-reservas` y `mvp-db` no hubo consultas durante el periodo de siete días consultado.

La base `ecom-demo` todavía refleja numerosas ejecuciones de resets completos dentro de la ventana de siete días, aunque LogicEcom ya contiene el patrón nuevo de refresco semanal y acotado. Tampoco está enlazada a Logic Reserva.

## Antes / después

| Métrica diaria estimada de Logic Reserva | Antes | Después | % límite gratuito después |
|---|---:|---:|---:|
| Consultas D1 | 0 | 0 | — |
| Filas D1 leídas | 0 | 0 | 0 % |
| Filas D1 escritas | 0 | 0 | 0 % |
| Cron Triggers | 0 | 0 | — |
| Jobs programados D1 | 0 | 0 | — |
| Protección automática | Ausencia validada parcialmente | Fusible explícito a cero + gate de CI | — |

El consumo no baja porque ya era cero; lo que cambia es su predictibilidad. Un futuro binding, cron, handler programado o SQL de runtime romperá `pnpm check` antes de poder publicarse.

## Política para un eventual cambio

No hay motivo actual para activar reservas demo remotas. Si una futura decisión lo exigiera, el gate solo podría relajarse junto con un ADR y pruebas que demuestren, como mínimo: frecuencia no superior a semanal (168 h), lotes acotados, idempotencia, deduplicación de ticks, presupuesto por ejecución y protección absoluta de reservas reales, contactos, catálogo y contenido. Producción no puede usarse para comprobarlo.
