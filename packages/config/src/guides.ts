export interface GuideText {
  readonly es: string;
  readonly en: string;
}

export type GuideSlug = 'sala' | 'gestion' | 'direccion' | 'propietario' | 'tecnica';

export interface GuideCatalogEntry {
  readonly slug: GuideSlug;
  readonly title: GuideText;
  readonly role: GuideText;
  readonly intro: GuideText;
  readonly topics: readonly GuideText[];
  readonly checklist: readonly GuideText[];
  readonly boundary: GuideText;
  readonly route: string;
}

export const GUIDE_CATALOG: readonly GuideCatalogEntry[] = [
  {
    slug: 'sala',
    title: { es: 'Sala sin perder el ritmo', en: 'Floor service without losing the rhythm' },
    role: { es: 'Para sala y encargado', en: 'For floor teams and managers' },
    intro: { es: 'Un recorrido para preparar el servicio, recibir reservas y resolver cambios con el plano delante.', en: 'A route for preparing service, receiving bookings and handling changes with the floor plan in front of you.' },
    topics: [
      { es: 'Servicio del día y estados de mesa', en: 'Daily service and table states' },
      { es: 'Reservas, llegadas y lista de espera', en: 'Bookings, arrivals and waitlist' },
      { es: 'Qué necesita ver el equipo en cada turno', en: 'What the team needs to see on each shift' },
    ],
    checklist: [
      { es: 'Turnos, espacios y mesas validados', en: 'Shifts, spaces and tables validated' },
      { es: 'Reglas de combinación y duración acordadas', en: 'Combination and duration rules agreed' },
      { es: 'Prueba del recorrido con el equipo real', en: 'Journey tested with the real team' },
    ],
    boundary: { es: 'La demo no sustituye formación, autenticación ni protocolos de servicio.', en: 'The demo does not replace training, authentication or service protocols.' },
    route: '/paneles/#panel-servicio',
  },
  {
    slug: 'gestion',
    title: { es: 'Gestión con contexto', en: 'Management with context' },
    role: { es: 'Para gestión operativa', en: 'For operations managers' },
    intro: { es: 'Cómo ordenar reservas, grupos, clientes y configuración para que la operación no dependa de memoria dispersa.', en: 'How to organise bookings, groups, guests and configuration so operations do not depend on scattered memory.' },
    topics: [
      { es: 'Libro de reservas y trazabilidad del origen', en: 'Booking book and source traceability' },
      { es: 'Grupos, menús y capacidad compartida', en: 'Groups, menus and shared capacity' },
      { es: 'Configuración de lectura y alcance por definir', en: 'Read-only configuration and scope to define' },
    ],
    checklist: [
      { es: 'Datos iniciales y migración inventariados', en: 'Initial data and migration inventoried' },
      { es: 'Roles y permisos definidos por responsabilidad', en: 'Roles and permissions defined by responsibility' },
      { es: 'Escenarios de excepción probados', en: 'Exception scenarios tested' },
    ],
    boundary: { es: 'La demo guarda cambios en el navegador: no crea cuentas ni un espacio multiusuario.', en: 'The demo saves changes in the browser: it creates no accounts or multi-user workspace.' },
    route: '/paneles/#panel-reservas-espera',
  },
  {
    slug: 'direccion',
    title: { es: 'Dirección ve dónde actuar', en: 'Leadership sees where to act' },
    role: { es: 'Para dirección', en: 'For leadership' },
    intro: { es: 'Una lectura de informes y señales para convertir el servicio en decisiones explicables y revisables.', en: 'A reading of reports and signals to turn service into explainable, reviewable decisions.' },
    topics: [
      { es: 'Ocupación por servicio y origen de la reserva', en: 'Occupancy by service and booking source' },
      { es: 'Costes hipotéticos y exposición a no-show', en: 'Hypothetical costs and no-show exposure' },
      { es: 'Exportación y conversación con el equipo', en: 'Export and conversation with the team' },
    ],
    checklist: [
      { es: 'Métricas que sí están disponibles acordadas', en: 'Available metrics agreed' },
      { es: 'Supuestos separados de datos observados', en: 'Assumptions separated from observed data' },
      { es: 'Revisión humana antes de automatizar', en: 'Human review before automation' },
    ],
    boundary: { es: 'La muestra no es contabilidad, predicción ni una orden automática.', en: 'The sample is not accounting, prediction or an automatic instruction.' },
    route: '/paneles/#panel-informes',
  },
  {
    slug: 'propietario',
    title: { es: 'Propietario entiende el alcance', en: 'Owners understand the scope' },
    role: { es: 'Para propietario', en: 'For owners' },
    intro: { es: 'Las preguntas que conviene responder antes de elegir web, gestor, integraciones, soporte y crecimiento.', en: 'The questions to answer before choosing website, manager, integrations, support and growth.' },
    topics: [
      { es: 'Qué resuelve cada nivel Básico, Gestión e Inteligente', en: 'What Basic, Management and Intelligent each solve' },
      { es: 'Dominio, datos, cobros y responsabilidades', en: 'Domain, data, payments and responsibilities' },
      { es: 'Mantenimiento, mejoras y salida', en: 'Maintenance, improvements and exit' },
    ],
    checklist: [
      { es: 'Cuello de botella operativo escrito', en: 'Operational bottleneck written down' },
      { es: 'Proveedores y propiedad del dato identificados', en: 'Providers and data ownership identified' },
      { es: 'Criterio de éxito y soporte acordados', en: 'Success and support criteria agreed' },
    ],
    boundary: { es: 'Los tres planes orientan el alcance; no son una tarifa ni un contrato automático.', en: 'The three plans frame scope; they are not a price list or automatic contract.' },
    route: '/planes/',
  },
  {
    slug: 'tecnica',
    title: { es: 'Técnica para publicar con criterio', en: 'Technical notes for a considered launch' },
    role: { es: 'Para técnica y proveedores', en: 'For technical teams and providers' },
    intro: { es: 'Una guía de dominio, datos, RGPD y conexiones para que publicar no oculte responsabilidades.', en: 'A guide to domain, data, GDPR and connections so launch does not hide responsibilities.' },
    topics: [
      { es: 'Dominio, DNS, entornos y publicación', en: 'Domain, DNS, environments and publishing' },
      { es: 'Datos, RGPD, acceso y salida', en: 'Data, GDPR, access and exit' },
      { es: 'Pagos, webhooks y proveedores por validar', en: 'Payments, webhooks and providers to validate' },
    ],
    checklist: [
      { es: 'Responsable de cada sistema documentado', en: 'Owner for each system documented' },
      { es: 'Plan de migración, copia y salida acordado', en: 'Migration, backup and exit plan agreed' },
      { es: 'Credenciales y eventos externos fuera de la demo', en: 'Credentials and external events kept outside the demo' },
    ],
    boundary: { es: 'Reserva demo no activa D1, correo de restaurante, pagos ni webhooks externos.', en: 'The Reserva demo does not activate D1, restaurant email, payments or external webhooks.' },
    route: '/paneles/#panel-inteligente',
  },
] as const;

export const guideBySlug = (slug: string): GuideCatalogEntry | undefined => GUIDE_CATALOG.find((guide) => guide.slug === slug);
