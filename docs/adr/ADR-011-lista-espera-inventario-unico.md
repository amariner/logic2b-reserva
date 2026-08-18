# ADR-011 · Lista de espera sobre el inventario único

**Estado:** Aceptada
**Fecha:** 2026-08-18

## Contexto

Vedra y Solane ya comparten el contrato `TableBooking` y el cálculo puro `tableAvailability`, pero solo representan demanda con reserva previa. Añadir clientes sin reserva mediante una agenda independiente podría prometer mesas que ya consumen una reserva, un evento o una privatización, rompiendo el diferencial principal del producto.

La experiencia sigue siendo una demostración local: no hay base de datos, SMS, WhatsApp, pagos ni notificaciones reales. El tiempo comunicado al cliente es un dato operativo introducido por el equipo, no una predicción.

## Decisión

La lista de espera es una cola operativa compartida por los niveles Gestión e Inteligente. Cada entrada conserva identidad, contacto opcional, tamaño de grupo, instante de llegada, franja solicitada, espera comunicada y estado `waiting | notified | seated | cancelled`.

Sentar una entrada no asigna una mesa por su cuenta: el dominio consulta `tableAvailability` con todas las reservas activas y, en Solane, también con eventos publicados y privatizaciones bloqueadas. Elige la opción mínima disponible y crea una `TableBooking` con `source: 'walkin'` y `status: 'seated'`. Si no existe opción, la entrada permanece en cola.

La cola se añade de forma compatible a los payloads locales v1 de Vedra y Solane. Un campo ausente se interpreta como una cola vacía; un elemento corrupto se descarta sin perder fixtures ni el resto del estado. Las transiciones terminales no se reabren.

En Solane, Dirección y Sala pueden añadir, avisar, sentar o cancelar; Cocina solo consulta. La interfaz deshabilita las acciones y las mutaciones vuelven a comprobar el permiso.

## Consecuencias

- Espera y walk-ins no crean un segundo inventario ni pueden provocar dobles reservas.
- Una mesa sentada desde la cola aparece automáticamente en Servicio, Reservas, CRM e Informes como cualquier otra reserva.
- Avisar es una transición local visible; no envía mensajes ni llama a servicios externos.
- Restablecer la demo elimina la cola y sus reservas añadidas, conservando los fixtures iniciales.
- El modelo puede incorporar en el futuro una integración de avisos, pero requerirá otra decisión y una frontera real explícita.
