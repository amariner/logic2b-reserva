# ADR-003 · Mesas como inventario único de reservas, eventos y privatizaciones

**Fecha:** 2026-08-17 · **Estado:** aceptada

## Contexto

Los motores de reserva suelen gestionar mesas, entradas para eventos y alquileres de espacios en silos. Eso permite vender online una mesa que ya forma parte de un evento o una sala ya privatizada. El principal diferencial de Logic Reserva es demostrar que las tres operaciones consumen el mismo recurso físico.

## Decisión

La mesa (`Table`) es la unidad de inventario. Las reservas guardan `tableIds`; los eventos guardan `consumesTableIds`; una privatización bloqueada expande su `spaceId` a todas las mesas del espacio. `tableAvailability` recibe las tres colecciones y excluye cualquier mesa cuyo intervalo solape con la consulta cuando:

- la reserva está `pending`, `confirmed` o `seated`;
- el evento está `published` o `soldout`;
- la privatización está `blocked`.

Los estados preparatorios no consumen inventario: un evento `draft` y una privatización `requested`, `proposed` o `deposit_paid` pueden editarse sin afectar al widget. Las opciones devueltas pueden ser mesas individuales o conjuntos conectados mediante `combinableWith`, siempre dentro de un mismo espacio y con capacidad válida para el grupo.

## Consecuencias

- Publicar un evento cambia de inmediato la disponibilidad del widget sin sincronizaciones paralelas.
- `assertNoDoubleBooking` puede verificar fixtures y estados restaurados antes de mostrarlos.
- El plano de sala podrá explicar el motivo del bloqueo con estado y texto, no solo con color.
- Si una futura base de datos serializa operaciones concurrentes, deberá proteger este mismo invariante mediante transacción o control optimista; no se crearán inventarios separados.
