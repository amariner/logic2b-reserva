# ADR-023 · Reprogramación segura de reservas

Fecha: 2026-10-03. Estado: aceptado para desarrollo local.

## Evidencia

F31 permite registrar y atender reservas, pero un cambio solicitado por el
cliente exige cancelar y volver a crear, perdiendo identidad y contexto. F32
incorpora la edición dentro del libro existente, sin añadir otra pantalla.

## Decisión

- Permitir editar únicamente reservas pendientes o confirmadas. Conservar id,
  origen, fecha de creación, cliente, menú y estado. Sala y Dirección pueden
  editar; Cocina permanece en lectura.
- Sin registro de depósito: cambiar fecha, hora, personas y asignación. Si
  cambia el grupo, recalcular la duración con la regla común; de lo contrario
  conservar la duración original. Mostrar comparación antes/después y exigir
  una acción explícita de guardado.
- Si la reserva corresponde al grupo confirmado de Vedra, actualizar también
  su resumen de fecha, personas y mesas para conservar la coherencia al recargar.
- Con cualquier registro de depósito, incluso de importe cero o ya liberado:
  permitir solo reasignar mesas. No modificar fecha, hora, duración, personas,
  menú, desglose, importe ni aceptación. Cambiar las condiciones financieras
  requiere un futuro recorrido de aceptación del cliente; no se inventa aquí.
- Revalidar en dominio mesas, capacidad, turno y ocupaciones de reservas,
  eventos y privatizaciones, excluyendo únicamente la propia reserva. Al
  guardar, leer el último estado local y rechazar si la reserva cambió desde
  que se abrió la edición. Un conflicto conserva la entrada y permite cancelar
  y volver a abrir sobre los datos actuales.
- Cuando cambien fecha, hora, duración o personas, retirar las referencias de
  asistencia locales de esa reserva para que ningún enlace anterior confirme
  otras condiciones. La interfaz avisa antes de guardar. Una reasignación de
  mesas conserva esos enlaces. No simular expiraciones con fechas inventadas.
- Mantener localStorage v1 y el alcance ficticio. No existe transacción entre
  pestañas ni garantía multiusuario de servidor; tampoco mensajes ni cobros.

## Validación

Invariantes de identidad y depósito, conflictos y adyacencia, rechazo de
ediciones obsoletas, roles, invalidación de referencias, persistencia, ES/EN,
teclado y móvil. Gate completo `pnpm check` y navegador sobre el build final.
