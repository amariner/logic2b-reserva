# ADR-017 · Logic2B UI como sistema de diseño

**Estado:** aceptada

**Fecha:** 2026-08-31

## Contexto

Logic Reserva tenía tokens y primitivas propios, pero no conservaba un vínculo verificable con el sistema compartido de la familia. La semejanza visual no bastaba: no existían `components.json`, versión del registro, snapshots de origen ni componentes consumidos desde `ui.logic2b.com`.

Logic2B UI distribuye código React abierto y modificable. Su implementación canónica usa Tailwind CSS v4, mientras que este monorepo ya sirve tres superficies Astro y un paquete React embebido con CSS global explícito. Introducir un segundo pipeline de estilos solo para dos primitivas ampliaría el bundle y la superficie de build sin mejorar la demostración.

## Decisión

- `https://ui.logic2b.com` es la fuente canónica para nuevos componentes, bloques, geometría, estados y tokens semánticos de interfaz.
- `packages/ui/components.json` fija el registro y la versión consumida. Los componentes se incorporan con la CLI oficial y se conservan sus bases en `packages/ui/.logic2b/base/` para poder auditar y fusionar futuras actualizaciones.
- `Button` y `Badge` son las primeras primitivas copiadas del registro. Mantienen API de variantes, composición con Radix y atributos `data-slot`; sus clases se adaptan al CSS explícito del monorepo y al mínimo táctil de 44 px.
- `packages/ui/src/theme.css` implementa el contrato semántico de Logic2B UI (`--background`, `--foreground`, `--primary`, `--card`, `--border`, `--ring`, etc.) sobre la personalidad de producto ya aprobada: papel cálido, azul de acción y acentos planos.
- Las marcas ficticias pueden redefinir sus variables `--brand-*`, pero no crean otra API transversal de botones, badges, formularios o superficies.
- `pnpm verify:ui`, incluido en `pnpm check`, falla si desaparecen el registro, la versión fijada, los snapshots, los tokens obligatorios o el consumo real de las primitivas en el gestor.

## Consecuencias

El diseño compartido pasa de ser una referencia informal a un contrato versionado y comprobable. Reserva conserva su identidad y su pipeline de CSS actual, pero las nuevas primitivas deben empezar en Logic2B UI y quedar bajo control del repositorio. Actualizar el registro es un cambio deliberado: se revisa el changelog del componente, se ejecuta la actualización, se resuelven las adaptaciones locales y se valida con `pnpm check && pnpm e2e`.
