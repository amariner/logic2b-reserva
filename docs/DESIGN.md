# DESIGN — contrato visual

Referencia aprobada por producto: `DESIGN (1).md`, recibida el 2026-08-17. Su frase guía es **“cuaderno de papel cálido bajo la luz de la tarde”**. Es una referencia visual; las reglas funcionales y de producto siguen viviendo en `CLAUDE.md` y `docs/ROADMAP.md`.

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

Los tokens y primitivas viven en `packages/ui/src/theme.css`: `.shell`, `.pill`, `.card`, `.artifact`, `.eyebrow`, `.heading`, `.display`, `.status`, `.sr-only`. No se inventa una primitiva transversal dentro de una app: primero se añade al paquete UI.

- `.pill`: CTA primario azul.
- `.pill.ghost`: CTA secundario con lavado azul.
- `.card`: superficie blanca, radio 12 px, borde fino, sin sombra.
- `.artifact`: mockup de producto; es una de las pocas superficies autorizadas a usar sombra.

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
