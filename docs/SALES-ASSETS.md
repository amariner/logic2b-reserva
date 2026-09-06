# Capturas guiadas de venta

Contrato canónico de F18/F23/F27 para generar un paquete comercial de Logic Reserva a partir del producto real, sin mantener composiciones manuales ni un segundo juego de datos. Este documento define el inventario v3; el script solo lo ejecuta.

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

Línea base vigente del 06/09/2026: versión 3, 42 capturas con Chromium Headless Shell 151.0.7922.34 y digest agregado `1da526293ba4be768e31efb0d48d1cb1a88685902eb8445160e7425e5600f3a5`. Incluye la revisión comercial, las fotografías de las nueve direcciones y la continuidad del correo hasta la solicitud. El digest se calcula aplicando SHA-256 a la concatenación, sin separadores, de los 42 valores `sha256` del manifiesto en su orden declarado.

Los dos pases finales coinciden en 40/42 hashes. Los dos restantes difieren en 57 píxeles de los bordes del catálogo de paneles y 6 píxeles de la imagen reducida del cierre móvil; el comparador estándar de Playwright confirma **42/42 sin diferencias perceptuales** con tolerancia de color 0.1 y cero píxeles de diferencia admitidos tras esa comparación. Se sustituye la igualdad binaria absoluta como único gate por esta comparación explícita, para distinguir ruido de rasterizado de una regresión visual. Los PNG se conservan sin retoques ni cuantización de color.

Para repetir la comprobación: conservar el directorio completo del primer pase, ejecutar el segundo y lanzar `CAPTURE_BASELINE_DIR=/ruta/al/primer-pase pnpm fotos:comparar`. El comparador exige el mismo inventario, nunca actualiza las imágenes de referencia y genera diferencias en `test-results/visual/` si falla. Las 48 portadas comerciales independientes sí coinciden byte a byte; su manifest está en `images/theme-previews/`.

Un cambio de escena, ruta, viewport, convención de nombre o frontera de red exige actualizar primero este documento y después el script y el manifiesto en el mismo cambio.

El runner prefiere Chromium Headless Shell instalado por `pnpm exec playwright install chromium`; `CHROMIUM_PATH` permite fijar un binario explícito y Chrome del sistema queda como fallback. Registra la versión en la salida y exige dos frames consecutivos idénticos antes de guardar cada PNG. No comparar hashes obtenidos con versiones diferentes del navegador.

El runner desactiva rasterizado parcial y optimizaciones de CPU de Skia. Son opciones del [runner oficial de Chrome](https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md), aplicadas solo a la captura para evitar variaciones de unos pocos píxeles entre ejecuciones.
