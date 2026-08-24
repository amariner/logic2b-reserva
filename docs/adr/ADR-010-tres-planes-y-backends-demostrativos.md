# ADR-010 · Tres planes y dos backends demostrativos

**Estado:** Aceptada  
**Fecha:** 2026-08-17

## Contexto

La escalera anterior mezclaba cuatro niveles comerciales con solo tres experiencias demostrables. En particular, separar Automatiza de Inteligente hacía menos clara la propuesta: las automatizaciones forman parte de la capa avanzada de operación y no necesitan un plan independiente.

El producto sigue siendo una demostración comercial sin base de datos, autenticación, pasarela ni integraciones reales. La arquitectura comercial debe expresar con claridad qué se vende y qué experiencia sirve como evidencia de cada plan.

## Decisión

Logic Reserva ofrece exactamente tres planes:

- **Básico:** web propia y formulario de solicitud de reserva que, en una implantación real para el restaurante, se recibiría por email. Brasca lo escenifica, pero su formulario demo no envía datos.
- **Gestión:** todo lo necesario para organizar reservas, mesas, grupos, clientes e informes desde un backend. Vedra es la demo de este gestor.
- **Inteligente:** todo Gestión más apoyo de IA para decisiones, automatizaciones y operación avanzada, incluidos eventos, depósitos, privatizaciones e inventario unificado. Solane es la demo de este gestor ampliado.

El antiguo plan Automatiza desaparece; sus capacidades pertenecen a Inteligente. El contrato comercial usa `basico | gestion | inteligente`, en ese orden. La landing puede presentar esos valores como prioridades operativas en vez de recomendar automáticamente un plan.

Los dos gestores son experiencias locales basadas en fixtures y `localStorage`. La IA de Solane se presenta expresamente como un cálculo demostrativo y determinista, sin modelo ni servicio externo conectado. Las automatizaciones también son recorridos simulados en el navegador.

El único formulario técnicamente conectado es el formulario comercial de la landing, que llama a `POST /api/leads` y dirige las solicitudes a `marinerandreu+logic@gmail.com`. Ningún formulario de Brasca, Vedra o Solane, ni ninguna acción de sus dashboards, realiza envíos o escrituras de red.

## Consecuencias

- `PlanLevel` y el payload de leads solo aceptan `basico`, `gestion` e `inteligente`; los valores heredados `inicio` y `automatiza` dejan de ser válidos.
- Cada plan tiene una demostración inequívoca: Brasca → Básico, Vedra → Gestión y Solane → Inteligente.
- Gestión e Inteligente pueden compartir componentes, pero la interfaz de Vedra no muestra IA ni automatizaciones y la de Solane debe identificarlas como demostrativas.
- Esta decisión no añade backend, autenticación, base de datos, proveedor de IA ni automatizaciones externas a las demos.
- Conectar en el futuro un formulario de reservas real de un restaurante será otra decisión e implementación, separada del formulario comercial de Logic2B.
