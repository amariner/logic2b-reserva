export interface PanelText {
  readonly es: string;
  readonly en: string;
}

export type PanelTier = 'gestion' | 'inteligente';
export type PanelSlug = 'servicio' | 'plano' | 'reservas-espera' | 'grupos-eventos' | 'informes' | 'inteligente';

export interface PanelCatalogEntry {
  readonly slug: PanelSlug;
  readonly name: PanelText;
  readonly strapline: PanelText;
  readonly audience: PanelText;
  readonly decision: PanelText;
  readonly capabilities: readonly PanelText[];
  readonly tier: PanelTier;
  readonly accent: string;
  readonly surface: string;
  readonly mark: string;
  readonly route: string;
  readonly image: string;
  readonly imageAlt: PanelText;
  readonly evidence: PanelText;
  readonly limit: PanelText;
}

export const PANEL_CATALOG: readonly PanelCatalogEntry[] = [
  {
    slug: 'servicio',
    name: { es: 'Servicio del día', en: 'Daily service' },
    strapline: { es: 'La sala, de un vistazo.', en: 'The dining room at a glance.' },
    audience: { es: 'Sala y encargado', en: 'Floor team and manager' },
    decision: { es: 'Qué está pasando ahora y qué necesita una acción antes del siguiente turno.', en: 'What is happening now and what needs action before the next shift.' },
    capabilities: [
      { es: 'Agenda por franjas de 15 minutos', en: '15-minute service timeline' },
      { es: 'Estado de mesa y reserva visibles', en: 'Table and booking states visible' },
      { es: 'Acciones de llegada y cierre', en: 'Arrival and close actions' },
    ],
    tier: 'gestion', accent: '#245b78', surface: '#e7f0f3', mark: 'S', route: '/demos/vedra/gestion/?vista=servicio',
    image: '/images/screens/04-vedra-grupo-desktop.png',
    imageAlt: { es: 'Captura real del gestor Vedra con la sala preparada', en: 'Real Vedra manager capture with the room prepared' },
    evidence: { es: 'Estado reproducible del gestor Vedra con mesas, grupos y capacidad en contexto.', en: 'Reproducible Vedra manager state with tables, groups and capacity in context.' },
    limit: { es: 'La demo usa fixtures locales: no hay cuentas, multiusuario ni migración conectados.', en: 'The demo uses local fixtures: accounts, multi-user access and migration are not connected.' },
  },
  {
    slug: 'plano',
    name: { es: 'Plano de sala', en: 'Floor plan' },
    strapline: { es: 'La capacidad real delante del equipo.', en: 'Real capacity in front of the team.' },
    audience: { es: 'Encargado y dirección', en: 'Manager and leadership' },
    decision: { es: 'Qué mesas se pueden combinar, bloquear o liberar sin romper la disponibilidad online.', en: 'Which tables can combine, block or release without breaking online availability.' },
    capabilities: [
      { es: 'Espacios y mesas con capacidad', en: 'Spaces and tables with capacity' },
      { es: 'Bloqueos de eventos sobre inventario', en: 'Event blocks on shared inventory' },
      { es: 'Combinaciones contiguas para grupos', en: 'Adjacent combinations for groups' },
    ],
    tier: 'gestion', accent: '#4d654f', surface: '#edf1e8', mark: 'P', route: '/demos/solane/gestion/?vista=plano',
    image: '/images/screens/05-solane-inventario-desktop.png',
    imageAlt: { es: 'Captura real del inventario Solane con un evento bloqueando mesas', en: 'Real Solane inventory capture with an event blocking tables' },
    evidence: { es: 'La cena maridaje de la fixture ocupa SS7 y SS8 y deja de ofrecerlas online.', en: 'The fixture pairing dinner occupies SS7 and SS8 and stops offering them online.' },
    limit: { es: 'Los bloqueos y eventos son ficticios; proveedor, contrato y cobro se definen por proyecto.', en: 'Blocks and events are fictional; provider, contract and payment are defined per project.' },
  },
  {
    slug: 'reservas-espera',
    name: { es: 'Reservas y espera', en: 'Bookings and waitlist' },
    strapline: { es: 'Cada solicitud tiene un siguiente paso.', en: 'Every request has a next step.' },
    audience: { es: 'Reservas y sala', en: 'Bookings and floor team' },
    decision: { es: 'Qué confirmar, sentar, cancelar o pasar a lista de espera cuando cambia el servicio.', en: 'What to confirm, seat, cancel or move to the waitlist when service changes.' },
    capabilities: [
      { es: 'Origen y estado de reserva', en: 'Booking source and status' },
      { es: 'Lista de espera con disponibilidad', en: 'Waitlist with availability' },
      { es: 'Transiciones legibles para el equipo', en: 'Readable team transitions' },
    ],
    tier: 'gestion', accent: '#925d3e', surface: '#f4e9df', mark: 'R', route: '/demos/vedra/gestion/?vista=reservas',
    image: '/images/screens/03-vedra-reserva-desktop.png',
    imageAlt: { es: 'Captura real del recorrido de reserva de Vedra', en: 'Real Vedra booking journey capture' },
    evidence: { es: 'La reserva empieza en la web de Vedra y llega al gestor con su contexto de servicio.', en: 'The booking starts on Vedra’s website and reaches the manager with service context.' },
    limit: { es: 'La espera y las transiciones se guardan solo en este navegador y no envían mensajes.', en: 'Waitlist and transitions stay in this browser and send no messages.' },
  },
  {
    slug: 'grupos-eventos',
    name: { es: 'Grupos y eventos', en: 'Groups and events' },
    strapline: { es: 'El evento también ocupa mesa.', en: 'The event takes up tables too.' },
    audience: { es: 'Eventos, dirección y sala', en: 'Events, leadership and floor team' },
    decision: { es: 'Cuándo una propuesta deja de ser una conversación y empieza a consumir capacidad real.', en: 'When a proposal stops being a conversation and starts consuming real capacity.' },
    capabilities: [
      { es: 'Solicitud, menú y condiciones', en: 'Request, menu and terms' },
      { es: 'Privatización guiada', en: 'Guided private hire' },
      { es: 'Bloqueo del espacio compartido', en: 'Shared space blocking' },
    ],
    tier: 'inteligente', accent: '#7f4c62', surface: '#f3e7eb', mark: 'G', route: '/demos/solane/gestion/?vista=privatizaciones',
    image: '/images/screens/07-solane-privatizacion-desktop.png',
    imageAlt: { es: 'Captura real de una privatización Solane con el espacio bloqueado', en: 'Real Solane private-hire capture with the space blocked' },
    evidence: { es: 'La solicitud de Privado avanza a propuesta y señal simulada antes de bloquear el espacio.', en: 'The Private request moves to a proposal and simulated deposit before blocking the space.' },
    limit: { es: 'La señal no cobra y las condiciones no crean un contrato real.', en: 'The deposit does not charge and the terms create no real contract.' },
  },
  {
    slug: 'informes',
    name: { es: 'Informes operativos', en: 'Operational reports' },
    strapline: { es: 'El servicio deja una conversación mejor.', en: 'Service leaves a better conversation.' },
    audience: { es: 'Dirección y propietario', en: 'Leadership and owner' },
    decision: { es: 'Qué revisar después del servicio y qué hipótesis merece una conversación, no una automatización ciega.', en: 'What to review after service and which hypothesis deserves a conversation, not blind automation.' },
    capabilities: [
      { es: 'Ocupación por servicio y origen', en: 'Occupancy by service and source' },
      { es: 'Exportación CRM de la muestra', en: 'CRM export of the sample' },
      { es: 'Señales consultivas explicables', en: 'Explainable consultative signals' },
    ],
    tier: 'inteligente', accent: '#5f5b87', surface: '#e9e8f3', mark: 'I', route: '/demos/solane/gestion/?vista=informes',
    image: '/images/screens/08-solane-riesgo-desktop.png',
    imageAlt: { es: 'Captura real de los informes Solane con señales explicables', en: 'Real Solane reports capture with explainable signals' },
    evidence: { es: 'Marc y Lucía aparecen con puntuación, señales y recomendaciones distintas en la vista de informes.', en: 'Marc and Lucía appear with different scores, signals and recommendations in reports.' },
    limit: { es: 'Los datos y costes son una muestra ficticia; no son contabilidad ni predicción.', en: 'Data and costs are a fictional sample; they are not accounting or prediction.' },
  },
  {
    slug: 'inteligente',
    name: { es: 'Vista inteligente', en: 'Intelligent view' },
    strapline: { es: 'Más contexto antes de decidir.', en: 'More context before deciding.' },
    audience: { es: 'Dirección y equipos avanzados', en: 'Leadership and advanced teams' },
    decision: { es: 'Qué señal merece atención y cómo mantener la decisión revisable por una persona.', en: 'Which signal deserves attention and how to keep the decision reviewable by a person.' },
    capabilities: [
      { es: 'Reglas deterministas visibles', en: 'Visible deterministic rules' },
      { es: 'Bonos, depósitos y eventos en contexto', en: 'Vouchers, deposits and events in context' },
      { es: 'Permisos de demo por rol', en: 'Demo role permissions' },
    ],
    tier: 'inteligente', accent: '#82622e', surface: '#f4eedf', mark: 'AI', route: '/demos/solane/gestion/?vista=informes',
    image: '/images/screens/08-solane-riesgo-desktop.png',
    imageAlt: { es: 'Captura real del panel Solane con recomendaciones revisables', en: 'Real Solane manager capture with reviewable recommendations' },
    evidence: { es: 'Solane deja la recomendación visible, sus señales trazables y el informe abierto para revisión.', en: 'Solane keeps the recommendation visible, its signals traceable and the report open for review.' },
    limit: { es: 'La IA y las automatizaciones son demostrativas; no hay modelo, credenciales ni acciones externas.', en: 'AI and automations are demonstrative; there is no model, credentials or external action.' },
  },
] as const;

export const panelBySlug = (slug: string): PanelCatalogEntry | undefined => PANEL_CATALOG.find((panel) => panel.slug === slug);
