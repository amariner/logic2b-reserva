# ADR-019 · Paridad literal de la capa comercial con Logic2B Campings

## Estado

Aceptada · 2026-09-04.

## Contexto

Logic Reserva ya dispone de los contenidos, demos, doce direcciones web, seis vistas de producto, tres planes y cinco guías necesarios para explicar el producto. La primera implementación de F21–F27 buscó paridad narrativa con `camp.logic2b.com`, pero mantuvo una composición visual propia. Una fusión posterior dejó además dos generaciones de componentes comerciales coexistiendo, con catálogos huérfanos, claves de contenido duplicadas y referencias de interacción incompletas.

El objetivo de producto cambia: la capa comercial pública de Reserva debe usar el mismo armazón, orden, densidad, patrones de navegación e interacciones que Camp. La equivalencia debe ser reconocible bloque a bloque, incluidos hero, raíles, sliders, selectores, modales, página de conversión, temas, paneles, cierre, prefooter y footer. Cambian el dominio, la identidad cromática y todo el contenido sectorial.

## Decisión

1. La composición pública de `apps/site` toma los componentes comerciales de Camp como contrato de estructura y comportamiento.
2. Reserva conserva sus rutas canónicas actuales (`/planes/`, `/temas/`, `/paneles/`, `/empezar/`, `/docs/`) y sus espejos ingleses; donde Camp usa otro nombre de ruta se mantiene una equivalencia explícita, no una segunda navegación.
3. El home conserva catorce hitos verificables: cabecera, hero, ecosistema, recorrido, plataforma, conexiones, planes, portfolio, paneles, implantación, guías, FAQ, cierre y footer. Los bloques se agrupan visualmente igual que Camp cuando forman una misma banda.
4. Los componentes consumen exclusivamente los catálogos y textos de Reserva. No se copian nombres, métricas, precios, promesas ni imágenes de Camp.
5. La dirección visual de Camp se remapea a los tokens de Reserva: papel cálido, azul Logic2B, tinta y acentos ya aprobados. No se crea un segundo sistema transversal ni se modifica la API de `packages/ui`.
6. Los formularios comerciales siguen usando el único endpoint autorizado `POST /api/leads`; las demos y los paneles mantienen su frontera local y ficticia.
7. Los doce temas y seis paneles comparten un único sistema de previsualización modal y una página de detalle por elemento. El recorrido guiado adopta nueve hitos, con destinos propios de restauración.
8. Se retiran de la compilación las variantes comerciales huérfanas surgidas de la fusión; no se mantienen dos catálogos o dos recorridos para el mismo concepto.
9. La publicación permanece manual y fuera de esta decisión. El cambio se considera terminado solo con typecheck, lint, unitarios, build, E2E y revisión visual responsive verdes.

## Consecuencias

- La experiencia de los productos Logic2B gana una estructura comercial común y predecible.
- Reserva mantiene su identidad, contenido, demos y reglas sectoriales; la paridad no altera el dominio ni autoriza funciones reales nuevas.
- Los tests pasan a proteger tanto la correspondencia estructural con Camp como las fronteras honestas de Reserva.
- Las futuras mejoras del armazón común deben evaluarse en ambos productos para evitar una nueva divergencia.
