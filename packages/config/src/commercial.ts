import type { Locale } from './index';

export type CommercialText = Readonly<{ es: string; en: string }>;
export type CommercialPlanSlug = 'basico' | 'gestion' | 'inteligente';

export interface CommercialPlan {
  readonly slug: CommercialPlanSlug;
  readonly name: CommercialText;
  readonly eyebrow: CommercialText;
  readonly promise: CommercialText;
  readonly bestFor: CommercialText;
  readonly capabilities: readonly CommercialText[];
  readonly boundary: CommercialText;
  readonly nextStep: CommercialText;
  readonly demo: { readonly name: 'Brasca' | 'Vedra' | 'Solane'; readonly path: string };
}

export interface ImplementationService {
  readonly slug: 'launch' | 'care' | 'evolution';
  readonly title: CommercialText;
  readonly summary: CommercialText;
  readonly steps: readonly CommercialText[];
  readonly boundary: CommercialText;
}

export interface ImplementationStep {
  readonly slug: 'inputs' | 'configuration' | 'validation' | 'publication' | 'maintenance' | 'boundaries';
  readonly title: CommercialText;
  readonly summary: CommercialText;
  readonly owner: CommercialText;
}

const text = (es: string, en: string): CommercialText => ({ es, en });

export const COMMERCIAL_PLANS = [
  {
    slug: 'basico',
    name: text('Básico', 'Basic'),
    eyebrow: text('Presencia y captación propias', 'Owned presence and acquisition'),
    promise: text('Una web que explica, convence y abre una solicitud sin entregar la relación a otra marca.', 'A website that explains, persuades and opens an enquiry without handing the relationship to another brand.'),
    bestFor: text('Restaurantes que necesitan ordenar primero su presencia digital y el primer contacto.', 'Restaurants that first need to organise their digital presence and first contact.'),
    capabilities: [
      text('Web propia adaptada a la identidad del restaurante', 'Owned website adapted to the restaurant identity'),
      text('Carta, horarios, ubicación y propuesta comercial', 'Menu, hours, location and commercial proposition'),
      text('Recorrido de solicitud que una implantación podría enviar por email', 'Enquiry journey that an implementation could send by email'),
    ],
    boundary: text('No incluye gestor operativo. La demo Brasca no envía ni guarda solicitudes.', 'Does not include an operational workspace. The Brasca demo sends or stores no enquiries.'),
    nextStep: text('Añadir Gestión cuando coordinar reservas y sala ya pesa más que captar.', 'Add Management when coordinating bookings and the floor costs more than acquisition.'),
    demo: { name: 'Brasca', path: '/demos/brasca/' },
  },
  {
    slug: 'gestion',
    name: text('Gestión', 'Management'),
    eyebrow: text('Operación compartida', 'Shared operation'),
    promise: text('Reservas, mesas, grupos, clientes e informes dentro del mismo contexto de servicio.', 'Bookings, tables, groups, guests and reports inside the same service context.'),
    bestFor: text('Equipos que reconstruyen el día entre llamadas, mensajes, hojas y memoria de sala.', 'Teams rebuilding the day from calls, messages, sheets and floor-team memory.'),
    capabilities: [
      text('Todo el alcance de Básico', 'Everything in Basic'),
      text('Reservas, espera, plano de sala, grupos y clientes', 'Bookings, waitlist, floor plan, groups and guests'),
      text('Informes operativos a partir de los datos disponibles', 'Operational reports based on the available data'),
    ],
    boundary: text('La demo Vedra usa datos ficticios y estado local; no hay multiusuario, TPV ni mensajería conectada.', 'The Vedra demo uses fictional data and local state; there is no multi-user access, POS or connected messaging.'),
    nextStep: text('Añadir Inteligente cuando eventos, depósitos y priorización necesiten el mismo inventario.', 'Add Intelligent when events, deposits and prioritisation need the same inventory.'),
    demo: { name: 'Vedra', path: '/demos/vedra/gestion/?vista=servicio' },
  },
  {
    slug: 'inteligente',
    name: text('Inteligente', 'Intelligent'),
    eyebrow: text('Decisión y operación avanzada', 'Decision and advanced operations'),
    promise: text('La base de Gestión ampliada con eventos, depósitos, privatizaciones y apoyo explicable a la decisión.', 'The Management foundation extended with events, deposits, private hire and explainable decision support.'),
    bestFor: text('Operaciones con más compromisos de capacidad, reglas comerciales y decisiones que coordinar.', 'Operations coordinating more capacity commitments, commercial rules and decisions.'),
    capabilities: [
      text('Todo el alcance de Gestión', 'Everything in Management'),
      text('Eventos, depósitos y privatizaciones sobre inventario compartido', 'Events, deposits and private hire on shared inventory'),
      text('IA determinista y automatizaciones simuladas con factores visibles', 'Deterministic AI and simulated automation with visible factors'),
    ],
    boundary: text('La inteligencia y las automatizaciones son demostrativas: no existe modelo externo, cobro ni acción autónoma.', 'Intelligence and automation are demonstrative: there is no external model, charge or autonomous action.'),
    nextStep: text('El alcance real se valida por restaurante, proveedor e integración antes de implantar.', 'Real scope is validated per restaurant, provider and integration before implementation.'),
    demo: { name: 'Solane', path: '/demos/solane/gestion/?vista=plano' },
  },
] as const satisfies readonly CommercialPlan[];

export const IMPLEMENTATION_SERVICES = [
  {
    slug: 'launch',
    title: text('Servicios de lanzamiento', 'Launch services'),
    summary: text('Convertir una demo en un sistema propio exige contexto, configuración y una validación compartida.', 'Turning a demo into an owned system requires context, configuration and shared validation.'),
    steps: [
      text('Inventario de datos, canales, dominio, proveedores y responsables', 'Inventory of data, channels, domain, providers and owners'),
      text('Configuración, migración acordada y pruebas con el equipo', 'Configuration, agreed migration and team testing'),
      text('Publicación, entrega y criterios de aceptación', 'Publication, handover and acceptance criteria'),
    ],
    boundary: text('Calendario, migración, integraciones y precio se concretan en propuesta.', 'Timeline, migration, integrations and price are defined in the proposal.'),
  },
  {
    slug: 'care',
    title: text('Mantenimiento y soporte', 'Maintenance and support'),
    summary: text('Acordar quién atiende incidencias, qué se monitoriza y cómo se actualiza evita una dependencia difusa.', 'Agreeing who handles incidents, what is monitored and how updates work avoids unclear dependency.'),
    steps: [
      text('Canal, horario y prioridad de soporte acordados', 'Agreed support channel, hours and priority'),
      text('Mantenimiento técnico y revisión de compatibilidad', 'Technical maintenance and compatibility review'),
      text('Copias, exportaciones y continuidad según el alcance', 'Backups, exports and continuity according to scope'),
    ],
    boundary: text('No se publica una tarifa ni un SLA sin aprobación comercial.', 'No fee or SLA is published without commercial approval.'),
  },
  {
    slug: 'evolution',
    title: text('Desarrollo y mejoras', 'Development and improvements'),
    summary: text('Las nuevas reglas, vistas o conexiones se priorizan con evidencia operativa, no como promesas implícitas.', 'New rules, views or connections are prioritised with operational evidence, not as implied promises.'),
    steps: [
      text('Backlog compartido y objetivo verificable', 'Shared backlog and verifiable objective'),
      text('Estimación y aprobación antes de desarrollar', 'Estimate and approval before development'),
      text('Pruebas, documentación y entrega de cada cambio', 'Testing, documentation and handover for each change'),
    ],
    boundary: text('Cada mejora fuera del alcance acordado requiere valoración propia.', 'Each improvement outside the agreed scope requires its own assessment.'),
  },
] as const satisfies readonly ImplementationService[];

export const IMPLEMENTATION_PATH = [
  {
    slug: 'inputs',
    title: text('Datos de partida', 'Starting inputs'),
    summary: text('Mesas, espacios, turnos, menús, canales, dominio y responsables se inventarían y revisarían antes de configurar.', 'Tables, spaces, shifts, menus, channels, domain and owners would be inventoried and reviewed before configuration.'),
    owner: text('Restaurante + Logic2B', 'Restaurant + Logic2B'),
  },
  {
    slug: 'configuration',
    title: text('Configuración', 'Configuration'),
    summary: text('La identidad, disponibilidad, reglas, permisos y recorridos se adaptarían al alcance aprobado.', 'Identity, availability, rules, permissions and journeys would be adapted to the approved scope.'),
    owner: text('Logic2B, con validación del restaurante', 'Logic2B, with restaurant validation'),
  },
  {
    slug: 'validation',
    title: text('Validación', 'Validation'),
    summary: text('El equipo probaría reservas, grupos, bloqueos, datos, roles y salidas con criterios de aceptación visibles.', 'The team would test bookings, groups, blocks, data, roles and exports against visible acceptance criteria.'),
    owner: text('Equipo operativo del restaurante', 'Restaurant operations team'),
  },
  {
    slug: 'publication',
    title: text('Publicación', 'Publication'),
    summary: text('Dominio, DNS, contenidos, proveedores y reversión se comprobarían antes de abrir tráfico real.', 'Domain, DNS, content, providers and rollback would be checked before opening real traffic.'),
    owner: text('Responsables acordados por proyecto', 'Owners agreed per project'),
  },
  {
    slug: 'maintenance',
    title: text('Mantenimiento', 'Maintenance'),
    summary: text('Canal, horario, prioridades, compatibilidad, copias y continuidad solo existirían según la propuesta aceptada.', 'Channel, hours, priorities, compatibility, backups and continuity would exist only as defined in the accepted proposal.'),
    owner: text('Alcance de servicio aprobado', 'Approved service scope'),
  },
  {
    slug: 'boundaries',
    title: text('Límites y mejoras', 'Boundaries and improvements'),
    summary: text('Integraciones, cobros, mensajería, SLA y nuevas funciones no se presuponen: se estiman y aprueban por separado.', 'Integrations, payments, messaging, SLAs and new features are not assumed: they are estimated and approved separately.'),
    owner: text('Propuesta y backlog compartido', 'Proposal and shared backlog'),
  },
] as const satisfies readonly ImplementationStep[];

export const localizedCommercialText = (value: CommercialText, locale: Locale): string => value[locale];

export const commercialDemoUrl = (plan: CommercialPlan, locale: Locale = 'es'): string =>
  `${locale === 'en' ? '/en' : ''}${plan.demo.path}`;

export const commercialContactUrl = (plan: CommercialPlan, locale: Locale = 'es'): string =>
  `${locale === 'en' ? '/en' : ''}/empezar/?plan=${plan.slug}`;
