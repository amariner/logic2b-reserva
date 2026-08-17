# ADR-002 · Franjas de 15 minutos y rangos semiabiertos

**Fecha:** 2026-08-17 · **Estado:** aceptada

## Contexto

Una reserva de restauración necesita expresar horas de llegada, duración de mesa y solapes dentro de un mismo día. Usar fechas completas con zona horaria en el dominio añadiría ambigüedad de horario de verano sin aportar valor a una demo local, y tratar los extremos como inclusivos bloquearía artificialmente una mesa cuando una ocupación termina justo al empezar la siguiente.

## Decisión

Representar cada ocupación con `TimeSlot { date, startMin, durationMin }`: fecha ISO `YYYY-MM-DD`, minutos desde medianoche y granularidad obligatoria de 15 minutos. Todos los intervalos son semiabiertos `[start, end)`. Por tanto, `[20:00, 21:30)` y `[21:30, 23:00)` no se solapan.

La capa de presentación podrá formatear esos minutos según el idioma, pero nunca cambiar la semántica. Los turnos solo contienen primera y última hora de llegada; `seatingTimes` genera las franjas ofertables de 15 en 15 minutos.

## Consecuencias

- La disponibilidad es determinista y no depende del reloj, del navegador ni de una zona horaria.
- Una mesa se libera exactamente al final de la duración prevista.
- Cualquier persistencia futura deberá conservar fecha local y minutos, y resolver la zona horaria únicamente en los límites de I/O.
- Duraciones y horas que no sean múltiplos de 15 se rechazan antes de calcular disponibilidad.
