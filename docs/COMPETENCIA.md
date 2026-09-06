# Competencia y posicionamiento (investigación agosto 2026)

Síntesis de la investigación de mercado que fundamenta el producto. Cautela: modelos, tarifas y cobertura varían por país, canal y plan. Una cifra sin fuente primaria y fecha no debe presentarse como dato duro en la demo.

## Actualización de precios públicos · 4 de septiembre de 2026

La revisión de páginas oficiales sitúa a los gestores generalistas para un restaurante entre **45 y 177 €/mes**, antes de extras o de una implantación a medida:

- **resOS** publica 45 €/mes para 350 reservas, 85 €/mes para 750 y 125 €/mes para reservas ilimitadas. Experiencias, pagos, diseño personalizable, analítica, API y otros módulos se cobran como extras. Fuente: https://resos.com/pricing/
- **Tablein** publica 67 €/mes para 50 reservas, 117 €/mes para 150 y 177 €/mes para reservas ilimitadas. Incluye todas las funciones, pero el volumen separa los planes. Fuente: https://www.tablein.com/pricing
- **TheFork Manager** mantiene planes Visibility, Performance y Enterprise, pero su página española no muestra una cuota mensual universal; las reservas originadas en TheFork y asociados pueden llevar una comisión basada en el ticket medio. Fuente: https://www.theforkmanager.com/es/software-restaurantes-precio
- **CoverManager** no publica una tarifa estándar verificable en su web española; se mantiene como referencia funcional, no como ancla numérica.

Logic Reserva no se posiciona como autoservicio genérico: combina dirección web propia, configuración sectorial y acompañamiento. La escalera aprobada para la demo comercial es:

| Plan | Cuota | Puesta en marcha | Criterio |
|---|---:|---:|---|
| Básico | 49 €/mes | 690 € | Entrada comparable a un gestor ligero, centrada en web y captación propia |
| Gestión | 149 €/mes | 1.290 € | Por encima del SaaS estándar por incluir web, sala, grupos e implantación guiada |
| Inteligente | 299 €/mes | 1.990 € | Eventos, privatizaciones y apoyo explicable; proveedores e integraciones se valoran aparte |

Los importes son por restaurante, sin IVA. Básico plantea seis meses mínimos; los costes de pasarela, SMS, TPV, migración o integración externa no están incluidos. Antes de contratación deben pasar de referencia comercial a condiciones contractuales completas.

## 1. Tres modelos económicos

| Modelo habitual | Ejemplos | Ingresos que puede incluir | Propuesta principal |
|---|---|---|---|
| Descubrimiento + reservas | TheFork, OpenTable | Cuota, comisión o servicios transaccionales según mercado/plan | Demanda, distribución y operación |
| Gestión de reservas | CoverManager, Tablein, Zenchef, SevenRooms, resOS | Suscripción o propuesta; algunos módulos transaccionales | Operación, datos y relación directa |
| Experiencias y ticketing | Tock, Fever, Eventbrite | Suscripción y/o porcentaje por transacción | Cobro anticipado y distribución de experiencias |

Logic Reserva vive en la frontera 2↔3: combina operación de sala, reservas, grupos y experiencias cobrables. El territorio no está vacío; la oportunidad está en demostrar la disponibilidad compartida con más claridad que el mercado.

## 2. Jugadores clave

- **TheFork**: actor dominante en Europa. Sus condiciones dependen de mercado, canal y servicio; no usar estimaciones agregadas de comisión como una tarifa universal. En junio de 2026 American Express **anunció una propuesta de adquisición**, con cierre previsto antes de terminar 2026; no debe describirse todavía como compra consumada.
- **CoverManager** (Sevilla): referente español; su web declara 36.000 restaurantes y ofrece reservas, pagos, experiencias, eventos y tarjetas regalo. Sin precios públicos.
- **Restoo, Tablein y Zenchef**: compiten con reserva directa, gestión y mensajes de “sin comisiones”. Las tarifas observadas en páginas o comparadores deben fecharse y verificarse antes de cualquier comparación pública.
- **SevenRooms**: plataforma enterprise de experiencia de cliente; DoorDash cerró su adquisición en 2025. No inferir encaje o precio para un restaurante individual sin propuesta verificable.
- **Tock / Resy**: referente conceptual de reservas y experiencias prepagadas. Resy comercializa planes «powered by Tock» y las reservas siguen administrándose por separado; no hay base para afirmar que Tock se haya apagado.
- **Bookline**: voz IA sobre motores de reserva existentes. Sus métricas comerciales requieren fuente y fecha antes de reutilizarse.
- **Tripleseat, Perfect Venue, Event Temple y Celebra**: referencias para grupos, propuestas, depósitos y privatizaciones. La disponibilidad y cobertura comercial deben comprobarse por país; no afirmar ausencia en España sin evidencia.
- El mensaje “sin comisiones” está muy extendido. Por sí solo no diferencia el producto.

## 3. Gaps del mercado (ordenados)

1. **La disponibilidad compartida rara vez protagoniza el discurso.** CoverManager, SevenRooms y Tableo ya incorporan eventos; por tanto, no es defendible decir que nadie lo hace. El hueco de Logic Reserva es convertir la relación mesa + grupo + evento en la idea central y demostrarla de forma navegable.
2. **Garantías y prepago añaden fricción de implantación.** Distintos proveedores los ofrecen; el espacio de mejora está en explicar política, aceptación y efecto operativo con claridad.
3. **Grupos y privatizaciones cruzan venta y sala.** Es una hipótesis comercial a validar con restaurantes, no una “tierra de nadie” demostrada.
4. **Propiedad y portabilidad del dato necesitan concreción.** Exportación, RGPD e integraciones ya existen en competidores; Logic debe explicar el acuerdo de datos de cada implantación, no usar un eslogan absoluto.
5. **No-show exige revisión por proyecto.** La información previa y la transparencia son necesarias, pero no bastan para afirmar que cualquier penalización sea válida o proporcional.
6. **La discontinuidad del widget puede afectar marca y conversión.** El efecto en SEO depende de la implementación; un widget nativo no es automáticamente indexable ni superior.
7. **La profundidad analítica varía.** El diferencial defendible es conectar ocupación, grupos y eventos en el mismo contexto demostrado.

## 4. Estado real de las capacidades

| Estado | Capacidades |
|---|---|
| Demostración visual local | Plano, reservas y estados; lista de espera; grupos; CRM e informes ficticios; eventos; depósitos; privatizaciones; bonos; IA determinista y automatizaciones simuladas |
| Pendiente de producción | Auth y permisos reales; base de datos multi-tenant; cobros; mensajería; exportación e integraciones con sistemas de cliente |
| Activable solo por proyecto validado | Proveedores, migración, reglas comerciales, tratamiento de datos, observabilidad y soporte acordado |

La matriz ejecutable y los límites completos viven en `docs/DEMO-MODE.md`. “Visible” nunca significa “activo en producción”.

## 5. Diferenciales elegidos para la demo

- **(A) Inventario único mesa+menú+evento** — protagonista. La demo de 30 segundos muestra el bloqueo de la sala en el mismo contexto, sin afirmar exclusividad de mercado.
- **(C) Recorrido anti no-show trazable en demo** — información previa, aceptación, desglose y liberación simulada. Política y cobro real se validan por proyecto.
- **(E) Privatizaciones** — solicitud → propuesta → señal → bloqueo del plano.
- **(B) Coste comparativo hipotético** — escenario interno de Informes bajo un supuesto editable de 3 €/cubierto. No se atribuye a una tarifa concreta, no presenta la muestra como un mes real y ya no se usa como calculadora pública en la landing.
- **(D) Experiencia integrada en la marca** — la demo muestra continuidad visual sin iframe ajeno. No prometer ventaja SEO automática.

## 6. Datos utilizables en copy (con alcance visible)

- Informe TheFork 2025, basado en actividad propia de 55.000 restaurantes europeos: **3,3%** de no-show en reservas individuales y reducción declarada del **78%** con garantía de tarjeta, hasta aproximadamente **0,7%**. Son claims del proveedor, no validación independiente.
- Serie española de TheFork: todos los meses entre enero y julio de 2025 quedaron por debajo del **3,4%** de no-show.
- Los **78,30€** por reserva ausente y **>15.500€/año** son cálculos derivados de supuestos de ticket, tamaño de mesa y volumen. No presentarlos como datos sectoriales; si se recuperan, etiquetarlos como escenario ilustrativo y mostrar la fórmula.
- El **+83%** de experiencias especiales procede de reservas de OpenTable en México (enero-agosto de 2025 frente a 2024). No usarlo como evidencia del mercado español.
- Consolidación: DoorDash cerró la compra de SevenRooms en 2025; AmEx ha propuesto adquirir TheFork en 2026. Esto refuerza el valor de explicar propiedad, portabilidad y uso del dato sin recurrir a mensajes alarmistas.

## 7. Guion de demo que maximiza credibilidad

(1) vista de servicio con plano → (2) crear evento y ver bloqueo de mesas del escenario → (3) comensal: reserva + menú + depósito simulado → (4) aceptación, desglose y liberación local → (5) CRM e informes ficticios. La demo no cobra, exporta ni modifica sistemas externos.

## 8. Fuentes primarias revisadas

- CoverManager: https://www.covermanager.com/es
- TheFork Manager: https://www.theforkmanager.com/es/
- Informe no-show TheFork 2025: https://www.theforkmanager.com/hubfs/Ebook/No-show%20white%20paper%20ES%20VDEF.pdf
- Serie española no-show 2025: https://www.theforkmanager.com/es/blog/que-razones-llevan-a-los-espanoles-a-hacer-un-no-show-en-un-restaurante
- CEC España, información previa y penalizaciones en reservas: https://portal-cec.consumo.gob.es/es/comunicacion/noticias/2026/cec-espana-ofrece-consejos-para-comprar-en-san-valentin-y-evitar-que-los
- SevenRooms: https://sevenrooms.com/en/platform/
- Zenchef: https://www.zenchef.com/
- Tableo eventos: https://tableo.com/es/restaurante/gestion-de-eventos/
- Tripleseat: https://tripleseat.com/
- Perfect Venue: https://www.perfectvenue.com/
- Event Temple: https://www.eventtemple.com/
- Celebra: https://celebra.club/
- Propuesta de adquisición de TheFork: https://ir.americanexpress.com/news/investor-relations-news/investor-relations-news-details/2026/American-Express-Announces-Proposed-Acquisition-of-TheFork-a-Leading-European-Restaurant-Booking-Platform/default.aspx
- Planes Resy powered by Tock: https://resy.com/join/plans-pricing/

## Revisión de tarifas — 5 de septiembre de 2026

Fuentes primarias consultadas para esta revisión (no se han utilizado estimaciones de comparadores):

| Proveedor | Tarifa publicada | Contexto |
| --- | --- | --- |
| [CoverManager España](https://www.covermanager.com/es/precios) | Essential 89 €/mes; Premium 189 €/mes; Enterprise a medida | La página muestra estos importes y habla también de propuesta por tamaño, módulos y volumen. No permite asegurar coste final ni base fiscal. |
| [resmio España](https://www.resmio.com/es/precios/) | Tabla: Basic 0 €, Premium 69,90 €, Ultimate 129,90 €/mes | Las tarjetas muestran importes con descuento (62,91/116,91). Permanencia de 12 meses; cancelación mensual añade 10 €/mes. Comparar modalidades equivalentes. |
| [Zenchef Francia](https://www.zenchef.com/fr/formules) | Reserve 129 €, Manage 169 €, Grow 249 €/mes | Referencia del mercado francés, no oferta confirmada para España. Pagos y complementos tienen condiciones propias. |

Decisión comercial solicitada por el propietario: Básico **49 €/mes + 290 € de alta**, Gestión **149 €/mes + 790 € de alta**, Inteligente **249 €/mes + 1.490 € de alta**. Precios sin IVA, por restaurante. Básico conserva seis meses de permanencia; demás condiciones en la propuesta. Cuota sin comisión de Logic2B por reserva; proveedores de pago, mensajes, migración e integraciones a medida aparte.

La cuota de Gestión queda entre las referencias de entrada y los planes de gestión completos. Inteligente se sitúa en el rango superior, con web, eventos y privatizaciones como especialización. Las altas son una estimación comercial propia para diseño y configuración, no precios atribuidos a los competidores. Validar margen con el esfuerzo real de cada implantación. Esta propuesta sustituye los importes de 49/149/299 y altas de 690/1.290/1.990 de la revisión anterior.

La demo actual no se compara como servicio operativo equivalente a estos SaaS: sigue siendo una demostración local sin reservas, mensajes ni cobros reales. Cada implantación de restaurante necesita alcance acordado.
