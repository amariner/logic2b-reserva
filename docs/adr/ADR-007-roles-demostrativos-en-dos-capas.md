# ADR-007 · Roles demostrativos en dos capas

**Estado:** Aceptada  
**Fecha:** 2026-08-17

## Contexto

F9 necesita mostrar cómo cambia la operativa de Solane para Dirección, Sala y Cocina. La demo funciona íntegramente en el navegador, sin usuarios autenticados ni servidor de autorización, por lo que un selector visual por sí solo sería fácil de confundir con una garantía de seguridad que el producto todavía no ofrece.

## Decisión

Se define `canOperate(role, action)` en el dominio y se aplica en dos capas:

- la interfaz deshabilita acciones fuera de rol y explica explícitamente por qué;
- las funciones de transición del estado vuelven a comprobar el permiso antes de modificar reservas, eventos o privatizaciones.

Dirección puede operar todos los módulos demostrados. Sala puede sentar reservas, pero no cobrar no-shows ni gestionar eventos o privatizaciones. Cocina conserva acceso de consulta y no dispone de acciones operativas.

El rol se persiste en el estado local compartido para que el recorrido sobreviva a una recarga. El selector se rotula como demostrativo y no se presenta como autenticación ni como control de acceso de producción.

## Consecuencias

- Un error de interfaz no basta para ejecutar una transición prohibida dentro de la demo.
- Los tests unitarios pueden verificar permisos sin depender del renderizado.
- El estado local sigue siendo manipulable por quien controla el navegador; no constituye una frontera de seguridad.
- Una implementación real deberá repetir la autorización en un backend autenticado y auditable.
