# DESIGN — contrato visual

Sistema de diseño canónico: [Logic2B UI](https://ui.logic2b.com/), integrado y versionado en `packages/ui/components.json`. La piel aprobada para este producto conserva la frase guía **“cuaderno de papel cálido bajo la luz de la tarde”**: personaliza los tokens del sistema compartido, no crea un sistema paralelo. Las reglas funcionales y de producto siguen viviendo en `CLAUDE.md` y `docs/ROADMAP.md`; la decisión de integración está en `docs/adr/ADR-017-logic2b-ui-como-sistema-de-diseno.md`.

## Ámbito

- La landing comercial y las superficies de producto Logic Reserva usan este sistema cálido, editorial y plano.
- Las webs ficticias Brasca, Vedra y Solane conservan identidad propia mediante `--brand-*` en `apps/web/src/styles/demos.css`; dentro de widgets y gestor comparten geometría, accesibilidad y estados del sistema.
- El gestor prioriza lectura inmediata para un jefe de sala a 1366 px: acciones grandes y estados comunicados con texto e icono además de color.

## Lenguaje visual

- Canvas `#f6f5f4`; las tarjetas son blanco puro sobre ese papel cálido.
- Texto negro con jerarquía por alpha; cuerpo cálido `#615d59`.
- Azul `#0075de` reservado para una única acción primaria por pantalla. Secundarias en `#e6f3fe` o transparentes; el texto azul pequeño usa la variante AA `#0068c7` sobre superficies claras.
- Acentos planos rotatorios: amarillo `#ffb110`, coral `#f64932`, cielo `#62aef0` y medianoche `#02093a`.
- Tarjetas a 12 px, botones a 8 px y píldoras solo para etiquetas o palabras destacadas. Sin gradientes.
- Las tarjetas de contenido no tienen sombra: borde de 1 px `rgb(0 0 0 / 8%)`. Solo navegación fija y mockups de producto pueden elevarse.
- Inter es la sans principal. Source Serif 4 se reserva para introducciones editoriales, nunca navegación o UI.
- Titulares compactos con tracking negativo. Ritmo cómodo en múltiplos de 4 px, secciones separadas unos 80 px y ancho máximo 1440 px.
- Movimiento de 200 ms `ease`; rebote solo en marcas decorativas y siempre desactivable con `prefers-reduced-motion`.

## Primitivas compartidas

Los tokens y primitivas viven en `packages/ui`. Los componentes React parten del registro de Logic2B UI y se consumen mediante exports como `@logic-reserva/ui/button` y `@logic-reserva/ui/badge`; las clases compartidas viven en `packages/ui/src/theme.css`. No se inventa una primitiva transversal dentro de una app: primero se busca en [Components](https://ui.logic2b.com/docs/components), se copia al paquete UI y después se adapta a la piel de Reserva.

`Button` y `Badge` conservan el contrato `data-slot` y las variantes del registro. `.shell`, `.pill`, `.card`, `.artifact`, `.eyebrow`, `.heading`, `.display`, `.status` y `.sr-only` siguen disponibles para Astro y superficies anteriores mientras se migra por uso, no mediante una reescritura indiscriminada.

- `.pill`: CTA primario azul.
- `.pill.ghost`: CTA secundario con lavado azul.
- `.card`: superficie blanca, radio 12 px, borde fino, sin sombra.
- `.artifact`: mockup de producto; es una de las pocas superficies autorizadas a usar sombra.

El gestor toma `admin-reservations-01`, `sidebar`, `data-table`, `button`, `badge`, `input`, `select` y `dialog` del catálogo como patrones preferentes. Se adapta el dominio y el copy; no se copia una demo genérica completa sobre los recorridos ya probados.

## Incorporar o actualizar componentes

1. Revisar el componente y su accesibilidad en `ui.logic2b.com`.
2. Ejecutar `pnpm dlx logic2b@latest add <componente> --cwd packages/ui --no-install`.
3. Añadir las dependencias declaradas al `package.json` del paquete UI y conservar `.logic2b/base/`.
4. Resolver imports relativos y adaptar las clases a los tokens semánticos de `theme.css`, manteniendo API, estados, `data-slot`, foco y objetivos de 44 px.
5. Consumir la primitiva desde una superficie real y cerrar con `pnpm verify:ui && pnpm check && pnpm e2e`.

## Accesibilidad y responsive

- Contraste AA, foco visible azul, objetivos táctiles de al menos 44 px.
- Sin overflow horizontal desde 320 px; revisión obligatoria a 375 y 1366 px.
- Los avisos fijos no pueden cubrir la conversión principal; el consentimiento se comprueba además a 1280 × 720 contra las dos acciones del hero.
- `prefers-reduced-motion` reduce animaciones y scroll suave.
- Ilustraciones decorativas llevan `aria-hidden`; los estados nunca dependen solo del color.

## Evitar

- Fondo general blanco, sombras decorativas en tarjetas, gradientes o radios mayores de 12 px en rectángulos.
- En el gestor, las guías temporales y selecciones se resuelven con bordes, líneas y `outline`, nunca con gradientes o sombras de tarjeta.
- Varios botones rellenos de colores distintos en una misma vista.
- Serif en controles o etiquetas.
- Fotografía de stock y 3D abstracto. La imagen de producto se apoya en mockups reales, pequeños personajes planos y marcas dibujadas.
