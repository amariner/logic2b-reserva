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
      base: '04-vedra-grupo',
      caption: text('Vedra · El grupo confirmado entra en el mismo gestor que el servicio.', 'Vedra · The confirmed group enters the same workspace as service.'),
      alt: text('Gestor de Vedra con grupo, mesas combinables y navegación hacia Servicio', 'Vedra workspace with a group, combinable tables and navigation to Service'),
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
      base: '05-solane-inventario',
      caption: text('Solane · Reservas y evento consumen mesas del mismo plano.', 'Solane · Bookings and an event consume tables from the same floor plan.'),
      alt: text('Plano de Solane con mesas libres, reservadas y bloqueadas por un evento', 'Solane floor plan with free, booked and event-blocked tables'),
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
      base: '04-vedra-grupo',
      caption: text('Vedra · Reserva de grupo con mesas y menú trazables antes del servicio.', 'Vedra · Group booking with traceable tables and menu before service.'),
      alt: text('Gestor de Vedra con una reserva de grupo y dos mesas seleccionadas', 'Vedra workspace with a group booking and two selected tables'),
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
      base: '07-solane-privatizacion',
      caption: text('Solane · Propuesta y señal simulada terminan en un espacio bloqueado.', 'Solane · Proposal and simulated deposit end in a blocked room.'),
      alt: text('Privatización de Solane confirmada con propuesta, señal simulada y espacio bloqueado', 'Confirmed Solane private hire with proposal, simulated deposit and blocked room'),
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
      base: '08-solane-riesgo',
      caption: text('Solane · La misma base de informes admite una capa inteligente explicable.', 'Solane · The same reporting base supports an explainable intelligent layer.'),
      alt: text('Informe ficticio de Solane con reservas, señales visibles y coste comparativo hipotético', 'Fictional Solane report with bookings, visible signals and hypothetical comparative cost'),
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
      base: '08-solane-riesgo',
      caption: text('Solane · Factores visibles, recomendación local y decisión humana.', 'Solane · Visible factors, local recommendation and human decision.'),
      alt: text('Vista inteligente de Solane con dos reservas priorizadas y factores explicables', 'Solane intelligent view with two prioritised bookings and explainable factors'),
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
