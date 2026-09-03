export interface PlanText {
  readonly es: string;
  readonly en: string;
}

export type PlanSlug = 'basico' | 'gestion' | 'inteligente';

export interface PlanCatalogEntry {
  readonly slug: PlanSlug;
  readonly name: PlanText;
  readonly strapline: PlanText;
  readonly body: PlanText;
  readonly features: readonly PlanText[];
  readonly level: PlanText;
  readonly demoRoute: string;
  readonly accent: string;
  readonly surface: string;
}

export const PLAN_CATALOG: readonly PlanCatalogEntry[] = [
  {
    slug: 'basico',
    name: { es: 'Básico', en: 'Basic' },
    strapline: { es: 'Tu web vuelve a trabajar.', en: 'Your website works again.' },
    body: { es: 'Presencia propia y un recorrido de solicitud que conserva el primer contacto.', en: 'An owned presence and an enquiry journey that keeps the first contact.' },
    features: [
      { es: 'Web con identidad de restaurante', en: 'Website with restaurant identity' },
      { es: 'Solicitud directa de mesa', en: 'Direct table enquiry' },
      { es: 'Punto de partida para crecer', en: 'A starting point to grow' },
    ],
    level: { es: 'Entrada', en: 'Starting point' },
    demoRoute: '/demos/brasca/',
    accent: '#a3472c',
    surface: '#f4dfd2',
  },
  {
    slug: 'gestion',
    name: { es: 'Gestión', en: 'Management' },
    strapline: { es: 'El servicio llega ordenado.', en: 'Service arrives organised.' },
    body: { es: 'Reservas, mesas, grupos y clientes comparten el contexto que necesita la sala.', en: 'Bookings, tables, groups and guests share the context the floor team needs.' },
    features: [
      { es: 'Turnos, mesas y menús', en: 'Turns, tables and menus' },
      { es: 'Servicio y grupos en un espacio', en: 'Service and groups in one workspace' },
      { es: 'Estados visibles para el equipo', en: 'Visible states for the team' },
    ],
    level: { es: 'Operación', en: 'Operations' },
    demoRoute: '/demos/vedra/gestion/?vista=servicio',
    accent: '#53613b',
    surface: '#e4e8d3',
  },
  {
    slug: 'inteligente',
    name: { es: 'Inteligente', en: 'Intelligent' },
    strapline: { es: 'Más contexto antes de decidir.', en: 'More context before deciding.' },
    body: { es: 'Eventos, depósitos y señales deterministas para explorar decisiones revisables.', en: 'Events, deposits and deterministic signals for exploring reviewable decisions.' },
    features: [
      { es: 'Eventos y privatizaciones', en: 'Events and private hire' },
      { es: 'Señales explicables', en: 'Explainable signals' },
      { es: 'Automatización solo demostrativa', en: 'Demonstrative automation only' },
    ],
    level: { es: 'Decisión', en: 'Decision support' },
    demoRoute: '/demos/solane/gestion/?vista=plano',
    accent: '#202b50',
    surface: '#e1e5ef',
  },
] as const;

export const planBySlug = (slug: string): PlanCatalogEntry | undefined => PLAN_CATALOG.find((plan) => plan.slug === slug);
