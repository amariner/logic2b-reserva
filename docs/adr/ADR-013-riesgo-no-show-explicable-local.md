# ADR-013 · Riesgo de no-show explicable y local

**Estado:** Aceptada  
**Fecha:** 2026-08-18

## Contexto

Solane ya calcula `riskTier` durante la reserva para escenificar una política demostrativa de depósito. Ese cálculo se realiza antes de aceptar las condiciones y no debe mutar después. El asistente de decisiones, en cambio, solo muestra una recomendación genérica y no permite entender qué reservas requieren atención ni por qué.

Llamar «predicción» a una regla opaca o mostrar un porcentaje sin entrenamiento, validación ni datos suficientes fingiría precisión estadística. Conectar un modelo tampoco encaja en la arquitectura demo-first, local y sin proveedores de las demos.

## Decisión

F17 añade una segunda capa exclusivamente consultiva:

- `bookedAt?` registra la fecha de creación cuando está disponible. Es un campo aditivo; los payloads v1 anteriores siguen siendo válidos y la ausencia se presenta como señal desconocida.
- El dominio produce una puntuación operativa acotada entre 0 y 100. No representa una probabilidad de inasistencia.
- Cada aportación conserva código, puntos y dirección. Las señales cubren canal, historial previo, tamaño de grupo, antelación y franja de demanda.
- El resultado clasifica `low|medium|high` y sugiere confirmación estándar, confirmación 24 h o revisión manual. Ninguna sugerencia ejecuta acciones.
- Informes deriva el histórico solo de la muestra local anterior a la reserva y muestra el desglose en español e inglés.
- Los tres roles pueden consultar la recomendación. No se añade un permiso operativo porque no existe mutación asociada.

La puntuación no llama a `riskTier`, no recalcula `DepositRecord`, no altera condiciones aceptadas y no solicita ni transmite datos.

## Consecuencias

- Dos reservas con las mismas señales producen siempre el mismo resultado auditable.
- El equipo puede explicar por qué una reserva aparece antes que otra sin afirmar una precisión que no existe.
- Un producto real necesitará consentimiento y base jurídica, calidad de datos, evaluación de sesgos, calibración, monitorización y revisión humana antes de usar un modelo predictivo.
- Cambiar pesos o umbrales exige modificar el dominio, sus invariantes, el copy de límites y las pruebas.
