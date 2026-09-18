# ADR-020 · Explorar, entender y conversar

Estado: aceptada · 18/09/2026.

La petición del propietario prioriza conversión, sutileza y un recorrido corto,
con los popups y la orientación de Camp como referencia. La profundidad del
catálogo ya existe; añadir explicaciones y pasos obligatorios no ayuda a elegir.

## Decisión

- Se conservan los catorce bloques, las rutas y los tres planes. El home muestra
  primero el beneficio y la evidencia; las precisiones extensas se despliegan.
- Las tarjetas de temas del hero abren el mismo visor que el portfolio. El visor
  prioriza la captura real, una acción contextual y enlaces secundarios discretos.
  Sin JavaScript, cada tarjeta mantiene acceso a su ficha pública.
- La guía voluntaria se reduce a cuatro momentos: web, reserva, sala y encaje del
  plan. Sustituye expresamente los nueve hitos de ADR-019 §7 y las referencias a
  seis hitos de F27. Los enlaces antiguos se resuelven al momento equivalente.
- El visitante puede llegar a la conversación en cualquier momento. La elección
  de tema, panel y plan se conserva. El correo inicial es opcional y permanece
  local hasta el envío consentido del formulario existente.
- El formulario muestra primero los datos esenciales y permite ampliar teléfono
  y mensaje. No se crean endpoints, cuentas ni nuevas escrituras.
- Se mantienen las etiquetas de demostración y el alcance real, con copy breve en
  la superficie de decisión y detalle disponible donde ayuda a entenderla.
- Los nuevos raster se generan con OpenAI. Esta entrega no necesita otro vídeo;
  los dos clips históricos no cuentan como generaciones de esta solicitud.

## Aceptación

ES/EN, contexto conservado, teclado, retorno del foco, salida del recorrido,
fallback de enlaces, móvil desde 320 px y escritorio de poca altura. Verificación
contra el bundle compuesto, `pnpm check`, recorridos funcionales y capturas reales.
La publicación conserva su proceso; no se envía ningún lead real para probarlo.

## Afinado F29 · 18/09/2026

El visor permite comparar escritorio y móvil mediante capturas reales. El
recorrido da acceso al contacto desde cada momento y conserva el interés cuando
se elige una tarjeta de plan. Si el navegador bloquea sessionStorage, solo se
transportan slugs comerciales validados entre pantallas; nunca datos personales.

La solicitud devuelve al tema/panel de origen y mantiene WhatsApp en móvil. Sin
JavaScript, ofrece contacto directo y no habilita campos que puedan acabar en
una URL. En `/empezar/` ES/EN no aparece automáticamente el aviso de preferencias:
no se carga analítica, no se registra consentimiento implícito y el control sigue
accesible en el pie. Las demás rutas mantienen su comportamiento.

El cierre usa una acción principal de conversación y lenguaje del restaurante;
la información de alcance y demostración sigue disponible. No se modifica el
contrato de tres planes ni se atribuye una mejora de conversión medida.
