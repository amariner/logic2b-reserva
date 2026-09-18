# Revisión de conversión · 18/09/2026

Referencia revisada en navegador: https://camp.logic2b.com/ (home, popup de tema
L’Olivar y panel Planning). Su patrón útil es una vista dominante, una acción
contextual clara y el detalle disponible después. Reserva conserva capturas
reales de sus demos, sin relajar las cabeceras de seguridad para incrustarlas.

La entrega F28 aplica esa jerarquía al hero, temas y paneles, mantiene la elección
hasta el formulario y reduce el recorrido comercial a cuatro pasos. Las nueve
webs compartidas ganan composiciones diferenciadas. El formulario reúne los
campos esenciales y despliega teléfono/comentario; el correo del hero es opcional.
El fondo comercial vuelve a papel cálido y se retiran efectos decorativos de los
bloques principales. La nueva foto de contacto se genera con OpenAI y se omite
visualmente en móvil para que el formulario aparezca antes.

No se publican porcentajes de mejora ni nuevos servicios. ADR-020 recoge el
criterio de producto y F28 en ROADMAP su aceptación. Las notas siguientes son
históricas y no sustituyen los resultados de validación de esta entrega.

---

# Revisión UI/UX · Logic Reserva / Logic2B Campings

Referencia: https://camp.logic2b.com/ — consultada el 05/09/2026.

Objetivo: misma familia visual y mismos apartados, con contenido de restaurantes y conservación de las demos y niveles de Reserva. La paridad se refiere a arquitectura comercial y lenguaje visual, no a un calco de píxeles ni a las funciones de camping.

| Apartado de Camp | Equivalente en Reserva |
| --- | --- |
| Cabecera flotante: Webs / Gestor / Precios | Cabecera compartida con estado activo e idioma en contexto |
| Hero editorial con catálogo visual | Titular serif, email inicial, tres entradas, mosaico de restaurantes |
| Ecosistema | Fila compacta con estados de conexión explícitos |
| Flujo en siete pasos | Web, disponibilidad, reserva, sala, señales, comunicación, decisión |
| Plataforma en cinco pestañas | Web, reservas, sala, grupos/eventos, operativa |
| Integraciones | Herramientas, pagos y asistentes con alcance indicado |
| Tres packs con web y gestor | Básico, Gestión, Inteligente; componente único de precios |
| Doce temas | Doce webs navegables y vistas previas |
| Seis paneles | Seis vistas conservadas, con enlaces a demos |
| Implantación | Seis pasos compactos; detalle en Planes |
| Cinco guías | Guías por rol; tabla de responsabilidades desplegable |
| FAQ | Preguntas plegadas, precios y límites de demo claros |
| Cierre | Invitación a demo y contacto con captura de gestor |
| Pie | Producto, catálogo, demos, contacto, idiomas y legal |

Cambios transversales: anchura comercial 1.280 px, tipografía serif para títulos, paleta azul/tinta de Reserva, botones redondos, menos títulos excesivos, lenguaje directo en home/catálogos/fichas/contacto, ritmo de espacios común. Estilos limitados al layout comercial; las identidades de las doce webs y la operativa de los gestores se conservan.

Recursos: fotografías existentes de Brasca, Vedra y Solane reutilizadas en portada y packs; vistas reales de las doce webs optimizadas a WebP para el catálogo. Se mantienen originales y su procedencia. No se incorporan fotos de restaurantes reales ni testimonios inventados.

Precios y justificación: `docs/COMPETENCIA.md`. No se ha migrado la infraestructura ni modificado el sistema de reservas, el transporte comercial o los textos legales.

Validación: `pnpm check` 28/28; 102 HTML y 3.598 referencias internas auditadas sin errores. 18 escenarios E2E contra Worker pasan antes de una caída de su proxy local. El barrido UI independiente pasa 12/12 sobre el build estático, incluidas las 68 páginas comerciales a 320/375/430/1366 px, catálogos, fichas, packs y guías. Vista final de home revisada visualmente en navegador. La regresión integral contra Worker y la regeneración de capturas contractuales quedan pendientes antes de publicar.

Cierre posterior del 06/09/2026: la auditoría de temas completa los 92 escenarios funcionales contra Worker y regenera las 42 capturas con comparación visual 42/42. Se añaden 48 portadas reales ES/EN y nueve fotografías originales. Evidencia y alcance exacto en [AUDITORIA-TEMAS.md](AUDITORIA-TEMAS.md); el protocolo de rasterizado y comparación está en [SALES-ASSETS.md](SALES-ASSETS.md). La publicación sigue requiriendo autorización.


## Afinado de conversión F29 · 18/09/2026

Comparación directa con los visores del Camp publicado: superficie visual grande,
lateral compacto y acción contextual. Reserva añade con sus capturas reales un
selector Escritorio/Móvil y scroll de la vista móvil; mantiene el detalle plegado
y las rutas de ficha y demo. No se habilitan iframes ni se cambian cabeceras.

Se conserva el recorrido corto de cuatro momentos. Contacto accesible antes del
final, contexto al cambiar de plan y retorno a la elección evitan trabajo repetido.
El cierre del home y las fichas habla de la actividad del restaurante y prioriza
la conversación. Las composiciones móviles ponen CTA/foto antes del texto largo.
La evidencia y los resultados del gate están en PROGRESS.md.
