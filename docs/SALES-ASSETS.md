# Capturas guiadas de venta

Contrato canónico de F18/F23/F27 para generar un paquete comercial de Logic Reserva a partir del producto real, sin mantener composiciones manuales ni un segundo juego de datos. Este documento define el inventario v3; el script solo lo ejecuta.

## Paquete de publicación F28/F29 · 18/09/2026

La autorización de publicación cierra el pendiente de capturas históricas:
**42 PNG regenerados en dos pases completos, 42/42 hashes idénticos y 42/42
comparaciones visuales correctas**. Chromium 153.0.8010.48, mismo binario en ambos
pases, captura secuencial sobre el Worker local con correo deshabilitado.
Digest contractual vigente:
`2fac4ed01e8c9ab9e6e324bdfcbebd62a8eb371f50e173c5399e81750d90b62d`.
Los doce WebP históricos se conservan. El home y el cierre se han revisado
visualmente en escritorio/móvil; no hay recursos sin cargar ni acciones tapadas.
Los inventarios de 48 temas y 24 paneles permanecen separados y verificados.

Las referencias a las 42 capturas pendientes en los apartados F28/F29 siguientes
describen sus entregas locales anteriores y quedan resueltas por este paquete.

## Afinado F29 · 18/09/2026

Se renuevan las **48 previews de temas** después de mejorar las nueve webs
compartidas. Se capturan sobre el Worker local con los dos idiomas y ambos
viewports; los 48 hashes coinciden con el manifiesto. Digest del inventario:
`98009b690b8f0980dfed4988588700f73c1dd3f311805170a4319385ee8b739b`.
Es un pase completo; no se afirma reproducibilidad entre dos ejecuciones.

Las 24 capturas de paneles de F28 se conservan y verifican con su manifiesto.
El nuevo selector Escritorio/Móvil consume esos recursos. La fotografía
`preparar-servicio-v1.png` de OpenAI y sus derivados AVIF/WebP acompañan la puesta
en marcha del home; prompt y procedencia en `apps/site/assets/editorial/README.md`.
Cero vídeos nuevos. Las 42 capturas comerciales históricas aún deben actualizarse
antes de una publicación: no se presentan como capturas del nuevo home.

## Previews de navegación F28 · 18/09/2026

Las previews que utilizan home, popups, catálogos y fichas forman dos inventarios independientes del paquete contractual `images/screens/`:

| Inventario | Comando | Combinaciones | Destino |
| --- | --- | --- | --- |
| Webs | `pnpm fotos:temas` | 12 slugs × ES/EN × escritorio/móvil = 48 | `apps/site/public/images/theme-previews/` |
| Paneles | `pnpm fotos:paneles` | 6 slugs × ES/EN × escritorio/móvil = 24 | `apps/site/public/images/panel-previews/` |

Son capturas de la aplicación navegable, no imágenes generadas ni composiciones manuales. Cada inventario escribe `{locale}/{slug}-{desktop|mobile}.webp` y un `manifest.json` con ruta, dimensiones y SHA-256. Los paneles añaden la vista y su preparación. El catálogo servido determina los slugs y las rutas para evitar una segunda lista en el generador. Las 72 previews del 18/09 coinciden con los hashes de sus manifiestos; ese chequeo de integridad no prueba igualdad entre dos generaciones.

Los comandos no reconstruyen ni arrancan el servidor. Se ejecutan sobre el build compuesto ya servido en un origen local, por defecto `http://127.0.0.1:8791`; `CAPTURE_ORIGIN` solo admite `localhost` o `127.0.0.1`. Para repetir la captura de paneles:

```bash
CAPTURE_ORIGIN=http://127.0.0.1:8791 pnpm fotos:paneles
```

Después se recompone el build para incorporar las previews y se reinicia el runtime que vaya a validarlo. El Worker local verifica los recorridos y sus fronteras; un servidor estático del mismo bundle puede utilizarse para la captura visual, pero no acredita los endpoints ni las cabeceras del Worker. No se captura preview remota ni producción.

El generador de paneles recorre las 24 combinaciones en serie, con un contexto limpio para cada una, viewport de 1366×900 o 375×812, escala 1, idioma correspondiente, zona `Europe/Madrid`, movimiento reducido, service workers bloqueados y reloj `2026-09-18T10:00:00+02:00`. Solo permite GET/HEAD del origen local; registra como fallo las peticiones prohibidas de cada escena. Espera la vista hidratada, fuentes e imágenes, comprueba idioma, aviso ficticio y ausencia de overflow, y exige dos screenshots consecutivos idénticos antes de guardar el WebP. Usa Chrome del sistema o el binario explícito de `CHROMIUM_PATH`, con GPU desactivada. Se deben fijar el mismo navegador y protocolo para comparar pases.

En Grupos y eventos, la preparación pulsa el control público `private-tour-mode:free` y abre la propuesta existente; la solicitud sigue en estado `requested`. No acepta propuestas, genera señales ni bloquea inventario. El resto de vistas se captura en su estado inicial. El paquete se escribe primero en una carpeta temporal y solo reemplaza el anterior al completar sus 24 escenas.

En esta entrega, la comparación del primer pase sobre Worker con el pase final sobre servidor estático conserva **13/24 hashes exactos**. Las cuatro combinaciones de Grupos y eventos cambian por la preparación en modo libre incorporada entre pases; otras siete capturas móviles presentan diferencias de rasterizado. No se declara 24/24 reproducible entre ejecuciones ni equivalencia visual contractual entre esos pases. La estabilidad de dos screenshots consecutivos se comprueba dentro de cada escena final y tiene un alcance distinto.

Digests del inventario final, calculados con SHA-256 sobre `JSON.stringify(manifest.captures)`:

- Temas, 48 previews: `2320699086639f1e4375723739dc3c4fda44ae8a7b89718ec9a41805786d4d4b`.
- Paneles, 24 previews: `e2b6bbb74e0a6c087164ed355a5d3b08953e0a9d617c24beb7b48edf947adb63`.

**Las 42 capturas de venta de `pnpm fotos` no se han regenerado en F28.** El contrato v3 y la evidencia histórica siguientes se conservan separados de estas 72 previews. La validación funcional final de F28 se registra en `PROGRESS.md`; no se infiere de haber completado las capturas.

## Alcance v3

- Idioma canónico: español (`es-ES`). El inglés podrá añadirse como otro catálogo, no como una bifurcación dentro de estas escenas.
- Formatos: PNG opaco, color sRGB, `deviceScaleFactor: 1` y captura del viewport completo, no de toda la página.
- Encuadres: `desktop` 1366×900 y `mobile` 375×812. Cada escena produce ambos formatos.
- Origen único: bundle local compuesto, servido por el Worker en `http://127.0.0.1:8791`. Nunca preview ni producción.
- Destino versionable: `apps/site/public/images/screens/`.
- Comando previsto: `pnpm fotos`.

La versión actual contiene veintiuna escenas y cuarenta y dos PNG. No incluye vídeo, voz, cursor animado ni una copia del tour interactivo.

## Catálogo canónico

| Orden | ID                     | Ruta inicial                                   | Estado determinista y encuadre comercial                                                                                                                      |
| ----- | ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01    | `brasca-marca`         | `/demos/brasca/`                               | Estado inicial; hero, propuesta Básico y etiqueta de demostración visibles.                                                                                   |
| 02    | `brasca-solicitud`     | `/demos/brasca/`                               | Formulario de solicitud en blanco y explicación de que en una implantación real llegaría por email; no se envía ni se simula una entrega.                     |
| 03    | `vedra-reserva`        | `/demos/vedra/`                                | Widget avanzado hasta la elección de horario y menú con `DEMO_DATE`, sin completar datos de contacto ni confirmar.                                            |
| 04    | `vedra-grupo`          | `/demos/vedra/gestion/?vista=plano`            | Estado inicial restaurado y solicitud fixture del grupo de 8 seleccionada; propuesta T4+T5 y menú de grupo visibles mediante el recorrido existente.          |
| 05    | `solane-inventario`    | `/demos/solane/gestion/?vista=plano`           | Evento fixture «Cena maridaje» publicado mediante las acciones existentes; sus mesas aparecen bloqueadas en el plano con estado textual además de color.      |
| 06    | `solane-deposito`      | `/demos/solane/`                               | Widget en el diálogo de depósito simulado: menú, porcentaje, total, condiciones y aviso de que no se realizará ningún cobro visibles.                         |
| 07    | `solane-privatizacion` | `/demos/solane/gestion/?vista=privatizaciones` | Solicitud fixture llevada a propuesta y señal simulada mediante el flujo existente; espacio Privado bloqueado y frontera ficticia visibles.                   |
| 08    | `solane-riesgo`        | `/demos/solane/gestion/?vista=informes`        | Estado inicial; Marc y Lucía visibles con puntuaciones, señales, recomendaciones distintas y el aviso de que no son probabilidades ni decisiones automáticas. |
| 09    | `la-trece-web`         | `/demos/la-trece/`                             | Hero inicial de la dirección web ficticia para bar de barrio.                                                                                                |
| 10    | `salobre-web`          | `/demos/salobre/`                              | Hero inicial de la dirección web ficticia para arrocería.                                                                                                     |
| 11    | `trama-web`            | `/demos/trama/`                                | Hero inicial de la dirección web ficticia para grupo pequeño.                                                                                                 |
| 12    | `umbral-web`           | `/demos/umbral/`                               | Hero inicial de la dirección web ficticia para restaurante de hotel.                                                                                          |
| 13    | `nacre-web`            | `/demos/nacre/`                                | Hero inicial de la dirección web ficticia para alta cocina.                                                                                                   |
| 14    | `brisa-alta-web`       | `/demos/brisa-alta/`                           | Hero inicial de la dirección web ficticia para terraza estacional.                                                                                            |
| 15    | `nave-nueve-web`       | `/demos/nave-nueve/`                           | Hero inicial de la dirección web ficticia para local de eventos.                                                                                              |
| 16    | `miga-club-web`        | `/demos/miga-club/`                            | Hero inicial de la dirección web ficticia para cadena casual.                                                                                                 |
| 17    | `mercat-33-web`        | `/demos/mercat-33/`                            | Hero inicial de la dirección web ficticia para espacio gastronómico.                                                                                          |
| 18    | `logic-reserva-home`   | `/`                                             | Hero de la landing comercial con las tres entradas al producto, prueba visual y siguiente paso visibles.                                                      |
| 19    | `logic-reserva-portfolio` | `/`                                          | Inicio del catálogo de doce direcciones web ficticias, con cabecera comercial, primera fila y controles de preview progresivos visibles.                       |
| 20    | `logic-reserva-paneles` | `/`                                            | Inicio del catálogo de seis vistas del gestor con evidencia, madurez y acciones separadas de preview/apertura.                                                  |
| 21    | `logic-reserva-cierre` | `/`                                             | Cierre comercial con pantallas reales, siguiente paso y formulario vacío; no se envía ningún dato.                                                            |

`DEMO_DATE` es la fecha operativa exportada por los fixtures (`2026-09-18`). El catálogo no puede derivar escenas de la fecha real de ejecución.

## Contrato de ejecución

Cada combinación escena/viewport se ejecuta en serie, en un contexto de navegador nuevo y en este orden. No se paralelizan viewports: Chrome puede variar el rasterizado AVIF cuando dos contextos capturan la misma escena simultáneamente y el contrato exige hashes reproducibles.

1. Fijar locale `es-ES`, zona horaria `Europe/Madrid`, esquema claro, movimiento reducido, render software y reloj en `2026-08-18T10:00:00+02:00`.
2. Bloquear todo origen salvo `http://127.0.0.1:8791` y todo método salvo GET/HEAD antes de abrir la primera página.
3. Abrir la ruta, borrar cookies, `sessionStorage` y `localStorage`, recargar y usar el reset propio de la demo cuando exista.
4. Preparar la escena únicamente con fixtures y acciones públicas ya cubiertas por los E2E. Se permite abrir una vista, seleccionar una reserva o avanzar un diálogo; no se permite copiar reglas de disponibilidad, depósito, riesgo o transición al script.
5. Esperar `document.fonts.ready`, carga y `image.decode()` de cada imagen del encuadre y el final de cualquier render React/Astro. La intersección con el viewport se comprueba en ambos ejes: un carrusel no debe esperar imágenes lazy situadas fuera de la pantalla. Las imágenes seleccionadas se solicitan antes de decodificarlas. Las escenas comerciales consumen los PNG ya creados en el mismo directorio temporal, no el paquete de la ejecución anterior. Desactivar animaciones, transiciones, caret y barras de desplazamiento solo mediante una hoja de estilo de captura.
6. Verificar etiqueta ficticia visible en demos o cabecera comercial visible en escenas de landing, ausencia de overflow horizontal y cero errores de consola o página.
7. Capturar el viewport y cerrar el contexto, aunque falle la escena.

La preparación de una escena no se reutiliza para la siguiente. El orden del catálogo solo determina los nombres, nunca una dependencia de estado.

## Frontera de datos y red

Las capturas solo pueden contener copy del repositorio y fixtures ficticios versionados. Se aceptan nombres de personajes ya presentes, dominios `.test`/`.invalid`, teléfonos evidentemente ficticios y referencias generadas de la demo. Quedan prohibidos:

- nombres, correos, teléfonos, reservas o mensajes introducidos manualmente desde información real;
- `marinerandreu+logic@gmail.com`, claves, tokens, variables de entorno o respuestas de proveedores;
- cookies o almacenamiento heredados de otra ejecución;
- llamadas a Resend, analítica, WhatsApp, pagos, modelos, agentes o cualquier host externo;
- cualquier POST, PUT, PATCH o DELETE, incluido `POST /api/leads`.

El script debe fallar al observar una petición prohibida; abortarla sin informar del fallo no es suficiente. La prueba de red se aplica también a formularios demostrativos.

## Archivos y manifiesto

Los nombres siguen `{orden}-{id}-{viewport}.png`, por ejemplo:

```text
01-brasca-marca-desktop.png
01-brasca-marca-mobile.png
08-solane-riesgo-desktop.png
08-solane-riesgo-mobile.png
17-mercat-33-web-desktop.png
17-mercat-33-web-mobile.png
18-logic-reserva-home-desktop.png
18-logic-reserva-home-mobile.png
21-logic-reserva-cierre-desktop.png
21-logic-reserva-cierre-mobile.png
```

`apps/site/public/images/screens/manifest.json` contiene únicamente datos estables: versión del contrato, locale, ID, marca, ruta, estado semántico, viewport, dimensiones y nombre de archivo. No incluye `generatedAt`, rutas absolutas, hostname de la máquina ni otro dato dependiente de la ejecución.

La regeneración escribe primero en un directorio temporal y solo sustituye el paquete cuando las cuarenta y dos combinaciones han pasado. Un fallo deja intacto el último paquete válido; no puede mezclar capturas antiguas y nuevas.

## Verificación de hecho

`pnpm fotos` termina correctamente solo si:

- existen exactamente las cuarenta y dos combinaciones declaradas y el manifiesto referencia cada una una sola vez;
- cada PNG tiene las dimensiones contractuales, contenido no vacío e imágenes cargadas en el encuadre; las demos conservan su etiqueta ficticia y la landing su cabecera comercial;
- no hubo errores de consola, excepciones de página, overflow horizontal ni peticiones prohibidas;
- una segunda ejecución limpia produce el mismo inventario, nombres, orden y dimensiones;
- dos ejecuciones consecutivas mantienen el inventario y pasan 42/42 comparaciones visuales con `threshold: 0.1` y `maxDiffPixels: 0`; se registran también los hashes exactos y cualquier variación de antialiasing;
- el catálogo no contiene datos personales reales ni afirma entrega, cobro, IA o automatización conectada;
- `pnpm check && pnpm e2e` continúan verdes después de incorporar el paquete.

Línea base histórica del 08/09/2026: versión 3, 42 capturas con Chromium Headless Shell 151.0.7922.34 y digest agregado `15bb46a52800d154d7c6704f1a52781a178b3716a1e8ea65993c008dae4db4e3`. Incluye el cierre interactivo del home y sus recursos gráficos de aquella entrega. Los dos pases de esa sesión coinciden **42/42 byte a byte** y pasan **42/42 comparaciones visuales**. Se ejecutó el generador mediante `CAPTURE_ORIGIN` sobre el mismo Worker local en Miniflare/workerd directo, evitando el cierre conocido de ProxyWorker. Los doce WebP derivados existentes se conservan: el generador de PNG sustituye su carpeta, por lo que deben recuperarse antes del build. El digest se calcula aplicando SHA-256 a la concatenación, sin separadores, de los 42 valores `sha256` del manifiesto en su orden declarado.

En la auditoría anterior del 06/09, los dos pases coincidían en 40/42 hashes. Los dos restantes diferían en 57 píxeles de los bordes del catálogo de paneles y 6 píxeles de la imagen reducida del cierre móvil; el comparador estándar de Playwright confirmó **42/42 sin diferencias perceptuales** con tolerancia de color 0.1 y cero píxeles de diferencia admitidos tras esa comparación. Se mantiene esta comparación explícita para distinguir ruido de rasterizado de una regresión visual. Los PNG se conservan sin retoques ni cuantización de color.

Para repetir la comprobación: conservar el directorio completo del primer pase, ejecutar el segundo y lanzar `CAPTURE_BASELINE_DIR=/ruta/al/primer-pase pnpm fotos:comparar`. El comparador exige el mismo inventario, nunca actualiza las imágenes de referencia y genera diferencias en `test-results/visual/` si falla. Las 48 portadas comerciales independientes de la auditoría del 06/09 coincidían byte a byte; ese resultado histórico no acredita dos pases del inventario F28 actualizado en `images/theme-previews/`.

Un cambio de escena, ruta, viewport, convención de nombre o frontera de red exige actualizar primero este documento y después el script y el manifiesto en el mismo cambio.

El runner prefiere Chromium Headless Shell instalado por `pnpm exec playwright install chromium`; `CHROMIUM_PATH` permite fijar un binario explícito y Chrome del sistema queda como fallback. Registra la versión en la salida y exige dos frames consecutivos idénticos antes de guardar cada PNG. No comparar hashes obtenidos con versiones diferentes del navegador.

El runner desactiva rasterizado parcial y optimizaciones de CPU de Skia. Son opciones del [runner oficial de Chrome](https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md), aplicadas solo a la captura para evitar variaciones de unos pocos píxeles entre ejecuciones.
