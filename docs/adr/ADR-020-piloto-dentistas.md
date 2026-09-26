# ADR-020 · Primera pasada del nicho dentistas

**Fecha:** 2026-09-26
**Estado:** aceptada

## Contexto

Logic Reserva demuestra hoy un producto específico para restauración. Antes de
duplicar su dominio, sus planes o sus demos, se quiere comprobar si la propuesta
comercial también resulta comprensible para una clínica dental.

## Decisión

La primera pasada se publica como una landing bilingüe y aislada en
`/dentistas/` y `/en/dentistas/`. Presenta un único recorrido verificable
—solicitud, agenda, preparación y seguimiento— y una interfaz ilustrativa
con datos ficticios.

Esta pasada no reutiliza los planes de restauración, no cambia el contrato de
leads y no afirma disponer de historia clínica, diagnóstico, receta,
recordatorios, integraciones o mensajería real. El contacto se inicia mediante
el canal comercial existente con un texto específico del nicho.

## Consecuencias

- Podemos enseñar y contrastar una hipótesis sectorial sin contaminar el motor
  de mesas, menús y eventos.
- Las dos rutas son indexables, canónicas, accesibles y aparecen en el sitemap.
- Una demo operativa dental, un formulario específico o precios propios
  requerirán una decisión posterior basada en la validación de esta página.
