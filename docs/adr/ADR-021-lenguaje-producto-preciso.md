# ADR-021 · Lenguaje visual v2: producto preciso y diagramas explicativos

**Estado:** Aceptada
**Fecha:** 2026-09-30

## Contexto

El rediseño editorial del home (26/09) dejó una web cálida, con titulares en serif y píldoras redondeadas. La revisión de producto pide un paso —pequeño— hacia más seriedad y tecnología, explicar el servicio de forma sencilla con gráficos detallados y que el gestor (backend demostrativo) hable el mismo idioma visual que la web comercial que lo vende. Hasta ahora cada gestor adoptaba el color de su restaurante ficticio (verde Vedra, noche Solane), así que el producto parecía dos productos distintos.

## Decisión

1. **Una capa de producto compartida.** `packages/ui/src/theme.css` define la clase `.lr-product` con los tokens v2 (`--lr-*`). La aplican la web comercial (`.commercial-site`) y el gestor (`.rd-app`). Las webs de las marcas ficticias no la usan: conservan `--brand-*`.
2. **Tipografía.** Titulares en Inter semibold con tracking negativo (`--display`). Etiquetas, índices, horas, importes y datos en JetBrains Mono (`--mono`). Source Serif 4 queda como acento: una palabra en cursiva por titular principal y citas editoriales puntuales, nunca en UI.
3. **Color.** Tinta `#0f1d2d`, texto secundario `#475767`, azul de producto `#1d5c96` (AA sobre blanco y papel), papel frío `#f3f5f7`, líneas de 11–20 % de tinta y retícula al 5 %. Los estados operativos (`--state-table-*`) son los mismos en web, diagramas y gestor.
4. **Geometría.** Botones rectangulares de 8 px; tarjetas de 12 px; escenarios de producto de 16–20 px. Las píldoras quedan para etiquetas y estados.
5. **Diagramas explicativos.** `apps/site/src/components/ServiceDiagram.astro` dibuja con HTML real y SVG decorativo seis explicaciones: cómo funciona, inventario único, recorrido anti no-show, privatización, escalera de planes y roles. El texto vive en `content.ts` (es/en), los importes salen de `depositFor` del dominio y cada diagrama lleva su límite demostrativo visible.
6. **Gestor unificado.** Vedra y Solane comparten cromo, tipografía, barra lateral y estados de Logic Reserva. La marca del restaurante aparece solo como identificador (monograma, nombre y un acento de 3 px), igual que un cliente dentro de un SaaS.

## Consecuencias

- La web comercial, los diagramas y el gestor comparten una única fuente de tokens; cambiar el azul de producto es una sola línea.
- Los ganchos de test (`data-*`, clases usadas por E2E) se conservan: el cambio es de piel y de contenido añadido, no de estructura de bloques.
- Las capturas comerciales (`pnpm fotos`, previews de paneles) quedan desactualizadas hasta regenerarlas.
- `docs/DESIGN.md` se actualiza para describir la capa `.lr-product`; la piel cálida anterior sigue vigente solo como base de `:root`.
