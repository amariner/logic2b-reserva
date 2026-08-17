# DESIGN — contrato visual

- Dos superficies, nunca mezcladas: **landing comercial** (editorial papel/tinta de la familia logic2b, serif Source Serif 4, acento burdeos `--bordeaux`) y **webs demo** (cada marca con su tema en `apps/web/src/styles/demos.css`, solo variables `--brand-*`).
- Tokens y primitivas en `packages/ui/src/theme.css` (`.shell`, `.pill`, `.card`, `.artifact`, `.eyebrow`, `.heading`, `.display`, `.status`, `.sr-only`). No inventar primitivas nuevas sin añadirlas ahí.
- Temas de marca: Brasca terracota cálido · Vedra verde oliva · Solane azul noche con dorado.
- Suelo obligatorio: usable a 1366px y 375px, foco de teclado visible (outline burdeos), contraste AA, `prefers-reduced-motion`, sin overflow horizontal desde 320px.
- El gestor se diseña para el jefe de sala en hora punta: acciones grandes, estados por color + texto (nunca solo color).
