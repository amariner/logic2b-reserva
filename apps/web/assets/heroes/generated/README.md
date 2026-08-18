# Heroes v2 · procedencia y regeneración

Las tres fuentes PNG de esta carpeta se generaron el 2026-08-18 con la herramienta integrada de imágenes de OpenAI. No se utilizó Higgsfield ni el CLI/API con una clave propia.

Las solicitudes se ejecutaron de forma estrictamente secuencial, una imagen por llamada, con una pausa de 15 segundos entre Brasca y Vedra y otra pausa de 15 segundos entre Vedra y Solane.

## Prompts finales

Todos los prompts exigían composición horizontal 4:3, ilustración editorial dibujada, grano sutil de papel, ausencia de texto/logos/marcas de agua, nada de fotografía de stock y ninguna referencia a un restaurante real.

- `brasca-v2.png`: bistró de barrio íntimo en Valencia alrededor del fuego lento y una mesa compartida; horno de leña visible, luz mediterránea de tarde, terracota, arcilla, crema cálido y oliva apagado.
- `vedra-v2.png`: restaurante mediterráneo luminoso en Madrid con galería, profundidad entre tres espacios y terraza vegetal; luz natural de mediodía, marfil, salvia, oliva, eucalipto y pequeños acentos de latón.
- `solane-v2.png`: sala gastronómica contemporánea en Barcelona preparada para un menú degustación nocturno; mesas espaciadas, lámparas escultóricas y acceso sutil a un privado; azul medianoche, tinta, lino marfil y latón envejecido.

## Derivados web

`pnpm images` lee estas fuentes y genera AVIF de 640, 960 y 1600 píxeles en `apps/web/public/images/heroes/`. Las fuentes originales no se sirven directamente al navegador.
