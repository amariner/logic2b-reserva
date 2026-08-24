# ADR-008 · Informes derivados de la muestra

**Estado:** Aceptada  
**Fecha:** 2026-08-17

## Contexto

F10 debe cerrar el argumento comercial con CRM e informes, pero la demo no dispone de base de datos, periodo contable ni analítica conectada. Presentar sus agregados como resultados reales ocultaría una limitación material y mezclaría hechos del fixture con proyecciones sectoriales.

## Decisión

Todos los informes se calculan en el navegador a partir de las reservas visibles y los menús del restaurante:

- el gasto CRM suma únicamente visitas `finished` con menú y precio conocidos;
- la ocupación divide cubiertos operativos por capacidad física acumulada en las fechas de la muestra;
- el origen cuenta cada reserva por su `source`;
- la exposición estimada a no-show aplica una tasa sectorial a la muestra y se presenta como escenario, no como no-shows observados ni evitados;
- el coste comparativo hipotético usa `marketplaceSavings` con el supuesto editable de 3 €/cubierto, sin atribuirlo a una tarifa ni tratar la muestra como un mes real.

El CSV contiene exactamente los registros agregados visibles y se descarga localmente, sin red. Su serializador protege además frente a fórmulas al abrirlo en una hoja de cálculo.

## Consecuencias

- Un cambio en reservas o estado se refleja de inmediato en CRM e informes.
- Las cifras son reproducibles y auditables, pero no equivalen a contabilidad ni a rendimiento real.
- Solane demuestra todos los módulos; Vedra reutiliza la misma capa para un subset básico.
- Un producto real necesitará periodos configurables, datos de facturación y un backend analítico.
