# ADR-012 · Bonos locales y canje único

## Contexto

Los bonos de experiencia permiten captar caja antes de que exista una fecha de reserva. En esta demo comercial deben enseñar el recorrido de venta directa y el trabajo posterior del equipo, pero no pueden presentarse como pago, factura, correo o título económico real.

El estado de Solane ya comparte reservas, eventos, privatizaciones y lista de espera mediante `logic-reserva-demo-solane-v1`. Crear otra agenda o un backend exclusivo para bonos rompería la frontera demo-first y haría más difícil explicar qué es real.

## Decisión

- El dominio incorpora un `ExperienceVoucher` puro con código, experiencia, cantidad, desglose monetario, emisión, caducidad y estado `issued | redeemed | voided`.
- Todo importe se conserva en céntimos enteros. `voucherValue` recalcula `unitValueCents × quantity`; el parser rechaza cualquier total manipulado.
- `issueExperienceVoucher` exige identidad, experiencia, código, fechas y valor válidos. `redeemExperienceVoucher` solo permite `issued → redeemed`, una vez, y conserva el instante del canje.
- La página pública de Solane emite el bono de forma simulada en `localStorage`; no pide tarjeta, no llama a red, no envía correo y no genera factura.
- Los bonos se añaden de forma aditiva al payload local v1 para conservar compatibilidad con recorridos anteriores. Datos corruptos se descartan sin perder fixtures válidos.
- La vista del gestor muestra caja anticipada ficticia y permite canje local a Dirección y Sala. Cocina conserva lectura. El selector de rol sigue sin ser una frontera de seguridad.
- El copy visible declara que el bono carece de validez económica fuera de la demostración.

## Consecuencias

- Web y gestor representan el mismo bono sin crear un servicio externo.
- El canje es verificable y no repetible mediante una transición pura.
- La demo no cubre pago, devolución, fiscalidad, Verifactu, entrega por email ni reserva asociada; esas capacidades requieren una fase futura y proveedores reales.
