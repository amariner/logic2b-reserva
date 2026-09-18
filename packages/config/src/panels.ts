import type { Locale } from './index';

export type PanelText = Readonly<{ es: string; en: string }>;
export type PanelLevel = 'management' | 'intelligent';

export interface PanelEntry {
  readonly slug: 'servicio' | 'plano' | 'reservas-espera' | 'grupos-eventos' | 'informes' | 'inteligente';
  readonly title: PanelText;
  readonly eyebrow: PanelText;
  readonly summary: PanelText;
  readonly metaDescription: PanelText;
  readonly signals: readonly [PanelText, PanelText, PanelText];
  readonly user: PanelText;
  readonly decision: PanelText;
  readonly evidence: PanelText;
  readonly limit: PanelText;
  readonly level: PanelLevel;
  readonly demoPath: string;
  readonly screenshot: {
    readonly base: string;
    readonly caption: PanelText;
    readonly alt: PanelText;
  };
}

const text = (es: string, en: string): PanelText => ({ es, en });

export const PANEL_CATALOG = [
  {
    slug: 'servicio',
    eyebrow: text('Ahora en sala', 'Now on the floor'),
    title: text('Servicio del día', 'Today’s service'),
    summary: text('Una agenda operativa para saber quién llega, qué mesa ocupa y qué necesita atención.', 'An operational agenda showing who is arriving, which table they use and what needs attention.'),
    metaDescription: text('Explora la agenda de servicio de Logic Reserva con asignación de mesas, evidencia ficticia, alcance de implantación y límites explícitos.', 'Explore Logic Reserva’s service agenda with table assignments, fictional evidence, implementation scope and explicit operational limits.'),
    signals: [text('Agenda', 'Agenda'), text('Asignación', 'Assignment'), text('Estado', 'Status')],
    user: text('Sala y responsable de reservas', 'Floor and booking teams'),
    decision: text('Qué atender ahora y cómo avanza cada mesa desde confirmada hasta cerrada.', 'What needs attention now and how each table moves from confirmed to closed.'),
    evidence: text('El fixture de Vedra reúne reservas web, grupos, origen, estado y asignación sobre el servicio del 18 de septiembre.', 'The Vedra fixture brings together web bookings, groups, source, status and assignment for the 18 September service.'),
    limit: text('El estado se guarda en este navegador; no hay operación multiusuario, TPV ni sincronización externa.', 'State is stored in this browser; there is no multi-user operation, POS or external synchronisation.'),
    level: 'management',
    demoPath: '/demos/vedra/gestion/?vista=servicio',
    screenshot: {
      base: 'servicio',
      caption: text('Vedra · Llegadas, mesas y reservas en la agenda del día.', 'Vedra · Arrivals, tables and bookings in the daily agenda.'),
      alt: text('Agenda del servicio de Vedra con reservas y asignación de mesas', 'Vedra service agenda with bookings and table assignments'),
    },
  },
  {
    slug: 'plano',
    eyebrow: text('Inventario único', 'One inventory'),
    title: text('Plano de sala', 'Floor plan'),
    summary: text('Mesas, reservas, eventos y privatizaciones comparten una capacidad que se puede leer.', 'Tables, bookings, events and private hire share one readable capacity.'),
    metaDescription: text('Explora el plano de sala de Logic Reserva con inventario compartido, capacidad legible, bloqueos explicados y una demo reproducible.', 'Explore Logic Reserva’s floor plan with shared inventory, readable capacity, explained blocks and a reproducible restaurant demo.'),
    signals: [text('Inventario', 'Inventory'), text('Capacidad', 'Capacity'), text('Bloqueos', 'Blocks')],
    user: text('Sala, reservas y dirección', 'Floor, bookings and management'),
    decision: text('Qué mesa está libre, reservada o bloqueada y qué compromiso explica ese estado.', 'Which table is free, booked or blocked and which commitment explains that state.'),
    evidence: text('Solane muestra la cena maridaje ocupando SS7 y SS8 mientras las reservas ordinarias consumen otras mesas.', 'Solane shows the wine-pairing dinner taking SS7 and SS8 while ordinary bookings consume other tables.'),
    limit: text('El inventario pertenece al escenario ficticio y no publica cambios en un motor o restaurante real.', 'The inventory belongs to the fictional scenario and publishes no changes to a real engine or restaurant.'),
    level: 'management',
    demoPath: '/demos/solane/gestion/?vista=plano',
    screenshot: {
      base: 'plano',
      caption: text('Solane · Mesas, reservas y eventos en el mismo plano.', 'Solane · Tables, bookings and events on one floor plan.'),
      alt: text('Plano de sala de Solane con espacios, capacidad y estado de las mesas', 'Solane floor plan with rooms, capacity and table status'),
    },
  },
  {
    slug: 'reservas-espera',
    eyebrow: text('Demanda ordenada', 'Demand in order'),
    title: text('Reservas y espera', 'Bookings and waitlist'),
    summary: text('Solicitudes, reservas confirmadas y clientes sin reserva avanzan sin perder origen ni estado.', 'Enquiries, confirmed bookings and walk-ins move forward without losing source or status.'),
    metaDescription: text('Explora reservas y lista de espera en Logic Reserva con origen, estado y capacidad compartidos, evidencia ficticia y límites claros.', 'Explore bookings and waitlist in Logic Reserva with shared source, status and capacity, fictional evidence and clear implementation limits.'),
    signals: [text('Origen', 'Source'), text('Espera', 'Waitlist'), text('Capacidad', 'Capacity')],
    user: text('Reservas y equipo de sala', 'Bookings and floor teams'),
    decision: text('A quién confirmar, avisar o sentar y qué capacidad queda después de cada acción.', 'Who to confirm, notify or seat and what capacity remains after each action.'),
    evidence: text('Vedra conserva origen web, menú, mesa y estado; la espera puede convertirse en walk-in usando el inventario común.', 'Vedra keeps web source, menu, table and status; a waitlist entry can become a walk-in using the shared inventory.'),
    limit: text('Avisar cambia el estado local, pero no envía SMS ni WhatsApp. Los datos se restablecen con la demo.', 'Notify changes local state but sends no SMS or WhatsApp. Data resets with the demo.'),
    level: 'management',
    demoPath: '/demos/vedra/gestion/?vista=espera',
    screenshot: {
      base: 'reservas-espera',
      caption: text('Vedra · Lista de espera conectada con la capacidad de sala.', 'Vedra · Waitlist connected to floor capacity.'),
      alt: text('Lista de espera de Vedra con registro de llegadas y disponibilidad de sala', 'Vedra waitlist with arrival registration and floor availability'),
    },
  },
  {
    slug: 'grupos-eventos',
    eyebrow: text('Oportunidad y capacidad', 'Opportunity and capacity'),
    title: text('Grupos y eventos', 'Groups and events'),
    summary: text('La propuesta comercial termina en una asignación operativa, no en un mensaje aislado.', 'The commercial proposal ends in an operational assignment, not an isolated message.'),
    metaDescription: text('Explora grupos y eventos en Logic Reserva desde la propuesta hasta la señal simulada y el bloqueo de espacio, con límites verificables.', 'Explore groups and events in Logic Reserva from proposal to simulated deposit and room block, with verifiable implementation boundaries.'),
    signals: [text('Propuesta', 'Proposal'), text('Señal simulada', 'Simulated deposit'), text('Espacios', 'Rooms')],
    user: text('Comercial, dirección y sala', 'Sales, management and floor teams'),
    decision: text('Qué proponer, qué señal solicitar y cuándo bloquear mesas o un espacio completo.', 'What to propose, which deposit to request and when to block tables or an entire room.'),
    evidence: text('La privatización de Solane recorre solicitud, propuesta, señal simulada y bloqueo del espacio Privado.', 'Solane private hire moves through enquiry, proposal, simulated deposit and a block on the Private room.'),
    limit: text('La señal no mueve dinero; contratos, mensajes y proveedores se acuerdan por proyecto.', 'The deposit moves no money; contracts, messages and providers are agreed per project.'),
    level: 'management',
    demoPath: '/demos/solane/gestion/?vista=privatizaciones',
    screenshot: {
      base: 'grupos-eventos',
      caption: text('Solane · Solicitudes, propuestas y seguimiento de espacios privados.', 'Solane · Enquiries, proposals and private-room follow-up.'),
      alt: text('Panel de privatizaciones de Solane con solicitudes y propuestas de eventos', 'Solane private hire panel with event enquiries and proposals'),
    },
  },
  {
    slug: 'informes',
    eyebrow: text('Lectura operativa', 'Operational reading'),
    title: text('Informes', 'Reports'),
    summary: text('Cubiertos, ocupación y origen se calculan desde las reservas que existen en el escenario.', 'Covers, occupancy and source are calculated from the bookings present in the scenario.'),
    metaDescription: text('Explora los informes de Logic Reserva con cubiertos, ocupación y origen calculados desde un escenario ficticio y sin métricas externas.', 'Explore Logic Reserva reports with covers, occupancy and source calculated from a fictional scenario without invented external metrics.'),
    signals: [text('Cubiertos', 'Covers'), text('Ocupación', 'Occupancy'), text('Origen', 'Source')],
    user: text('Dirección y responsable de operaciones', 'Management and operations leads'),
    decision: text('Qué servicio revisar y qué parte del resultado puede explicarse con los datos disponibles.', 'Which service to review and which part of the result can be explained by the available data.'),
    evidence: text('La vista Gestión agrega únicamente reservas fixture y cambios locales; no rellena tarjetas con métricas externas.', 'The Management view aggregates only fixture bookings and local changes; it does not fill cards with external metrics.'),
    limit: text('Es una muestra sectorial, no un histórico real ni una integración contable o de analítica.', 'This is a sector sample, not real history or an accounting or analytics integration.'),
    level: 'management',
    demoPath: '/demos/vedra/gestion/?vista=informes',
    screenshot: {
      base: 'informes',
      caption: text('Vedra · Cubiertos, ocupación y origen del servicio.', 'Vedra · Service covers, occupancy and source.'),
      alt: text('Informes de Vedra con cubiertos, ocupación y origen de las reservas', 'Vedra reports with covers, occupancy and booking sources'),
    },
  },
  {
    slug: 'inteligente',
    eyebrow: text('Apoyo explicable', 'Explainable support'),
    title: text('Vista inteligente', 'Intelligent view'),
    summary: text('Una prioridad reproducible enseña sus factores y deja la decisión en manos del equipo.', 'A reproducible priority shows its factors and leaves the decision with the team.'),
    metaDescription: text('Explora la vista inteligente de Logic Reserva con factores visibles, prioridad reproducible, evidencia local y revisión humana obligatoria.', 'Explore Logic Reserva’s intelligent view with visible factors, reproducible priority, local evidence and mandatory human review.'),
    signals: [text('Factores', 'Factors'), text('Prioridad', 'Priority'), text('Revisión humana', 'Human review')],
    user: text('Dirección y responsable de reservas', 'Management and booking leads'),
    decision: text('Qué reservas revisar primero y por qué, sin delegar la acción final.', 'Which bookings to review first and why, without delegating the final action.'),
    evidence: text('Marc y Lucía reciben puntuaciones distintas a partir de antelación, canal, asistencia previa, tamaño y franja del fixture.', 'Marc and Lucía receive different scores from lead time, channel, prior attendance, party size and fixture time slot.'),
    limit: text('El score no es una probabilidad ni usa un modelo externo; no contacta, cancela, cobra ni modifica reservas automáticamente.', 'The score is not a probability and uses no external model; it does not contact, cancel, charge or modify bookings automatically.'),
    level: 'intelligent',
    demoPath: '/demos/solane/gestion/?vista=informes',
    screenshot: {
      base: 'inteligente',
      caption: text('Solane · Asistente de decisiones y automatizaciones demostrativas.', 'Solane · Decision assistant and demonstration automations.'),
      alt: text('Informes de Solane con ocupación, origen y asistente de decisiones', 'Solane reports with occupancy, booking sources and a decision assistant'),
    },
  },
] as const satisfies readonly PanelEntry[];

export type PanelSlug = (typeof PANEL_CATALOG)[number]['slug'];

export const localizedPanelText = (value: PanelText, locale: Locale): string => value[locale];

export const panelDemoUrl = (panel: PanelEntry | PanelSlug, locale: Locale = 'es'): string => {
  const entry = typeof panel === 'string' ? PANEL_CATALOG.find(({ slug }) => slug === panel) : panel;
  if (!entry) throw new Error(`Unknown panel: ${panel}`);
  return `${locale === 'en' ? '/en' : ''}${entry.demoPath}`;
};

export const panelDetailUrl = (panel: PanelEntry | PanelSlug, locale: Locale = 'es'): string => {
  const entry = typeof panel === 'string' ? PANEL_CATALOG.find(({ slug }) => slug === panel) : panel;
  if (!entry) throw new Error(`Unknown panel: ${panel}`);
  return `${locale === 'en' ? '/en' : ''}/paneles/${entry.slug}/`;
};

export const panelContactUrl = (panel: PanelEntry | PanelSlug, locale: Locale = 'es'): string => {
  const entry = typeof panel === 'string' ? PANEL_CATALOG.find(({ slug }) => slug === panel) : panel;
  if (!entry) throw new Error(`Unknown panel: ${panel}`);
  return `${locale === 'en' ? '/en' : ''}/empezar/?panel=${encodeURIComponent(entry.slug)}`;
};

export const getPanel = (slug: string): PanelEntry | undefined => PANEL_CATALOG.find((panel) => panel.slug === slug);

export const panelPreviewBase = (panel: PanelEntry | PanelSlug, locale: Locale = 'es'): string => {
  const entry = typeof panel === 'string' ? getPanel(panel) : panel;
  if (!entry) throw new Error(`Unknown panel: ${panel}`);
  return `/images/panel-previews/${locale}/${entry.screenshot.base}`;
};
