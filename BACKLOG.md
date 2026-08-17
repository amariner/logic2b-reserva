# BACKLOG — ideas fuera del roadmap actual

Lo que surge durante las sesiones y no pertenece a la fase en curso. Nada de aquí entra en una sesión sin pasar antes por el ROADMAP.

## Producto (post-F12)

- Gift cards / bonos de experiencia vendidos desde el motor (validado por CoverManager, Zenchef, Superb; caja anticipada).
- Confirmaciones y recordatorios por WhatsApp (ojo: desde enero 2026 Meta restringe chatbots genéricos; solo vía proveedores oficiales de la API — verificar antes de prometerlo).
- Lista de espera y walk-ins en el gestor.
- Predicción de no-show con IA (riesgo por canal/histórico) — hoy el `riskTier` es por reglas; venderlo como "Inteligente".
- Google Reserve como canal (gratuito, el que más erosiona a los marketplaces).
- Puente prepago → factura conforme (Verifactu, IVA de anticipos): gap legal que nadie resuelve; posible diferencial futuro muy fuerte.
- Idiomas ca/fr (declarados en `PRODUCT.futureLocales`).
- Vista móvil optimizada del gestor para el equipo de sala.
- Propuesta comercial nominal para un prospecto real (patrón `/propuestas/azahar` de camp).
- Vídeos y capturas guiadas de venta (patrón `apps/site/scripts/` de camp).

## Técnica

- Extraer el copy de demos a `content.ts` si los ternarios de locale crecen (regla: con 3+ idiomas es obligatorio).
- Tour guiado reutilizable entre gestores (hoy se duplicará entre Vedra y Solane).
