# ADR-022 · Libro operativo e inventario al confirmar

Fecha: 2026-10-03. Estado: aceptado para desarrollo local.

## Evidencia

La continuación solicitada del gestor revela tres huecos en los recorridos
existentes: Solane solo permite atender reservas con depósito retenido; el
widget y el grupo Vedra pueden confirmar una asignación anterior a un cambio
de inventario; el libro mezcla fechas sin búsqueda y no permite registrar una
reserva telefónica. Vaciar la fecha de Servicio también puede romper la vista.

## Decisión

Se abre F31 como entrega operativa acotada. F30 conserva sus tareas de
investigación comercial pendientes: esta entrega no presupone entrevistas ni
resultados de conversión.

- Validar la asignación y el inventario al confirmar, usando el estado local
  más reciente; conservar la entrada del usuario y explicar los conflictos.
- Completar transiciones de reserva independientemente de que exista depósito.
  Sentar libera la garantía; cancelar libera la garantía local; no-show con
  garantía conserva el permiso de Dirección. Cocina sigue en lectura.
- Compartir búsqueda y filtros de fecha, turno, estado y origen entre los dos
  libros, con resultados y restablecimiento accesibles en ES/EN.
- Registrar reservas telefónicas confirmadas usando la disponibilidad común.
  La asignación se revalida al guardar. No se crea aceptación de condiciones,
  depósito, cobro ni comunicación en nombre del cliente.
- Mantener localStorage v1, las primitivas y tokens existentes y la frontera
  ficticia. No hay backend, autenticación ni bloqueo transaccional multiusuario.

## Límites

La revalidación local detecta inventario cambiado antes del guardado. No ofrece
garantías de concurrencia de un servidor ni convierte la demo en un SaaS.
La implantación real requiere persistencia transaccional y permisos de servidor.
No se despliega ni se activa mensajería, analítica o servicios externos.

## Validación

Pruebas de conflictos con reservas, eventos y privatizaciones; intervalos
adyacentes; roles y garantías; búsqueda combinada; creación y persistencia;
recorridos de navegador ES/EN y móvil; gate completo `pnpm check`.
