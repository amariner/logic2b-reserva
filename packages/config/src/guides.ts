import type { Locale } from './index';

export type GuideText = Readonly<{ es: string; en: string }>;
export type GuideSlug = 'sala' | 'gestion' | 'direccion' | 'propietario' | 'tecnica';

export interface GuideSection {
  readonly title: GuideText;
  readonly intro: GuideText;
  readonly points: readonly GuideText[];
}

export interface GuideEntry {
  readonly slug: GuideSlug;
  readonly title: GuideText;
  readonly eyebrow: GuideText;
  readonly summary: GuideText;
  readonly audience: GuideText;
  readonly outcome: GuideText;
  readonly sections: readonly GuideSection[];
  readonly relatedPlan: 'basico' | 'gestion' | 'inteligente';
}

const text = (es: string, en: string): GuideText => ({ es, en });

export const GUIDE_CATALOG = [
  {
    slug: 'sala',
    title: text('Guía de Sala', 'Floor team guide'),
    eyebrow: text('Antes, durante y después del servicio', 'Before, during and after service'),
    summary: text('Cómo leer el servicio, mover una reserva y conservar el contexto que necesita el siguiente turno.', 'How to read service, move a booking and preserve the context the next shift needs.'),
    audience: text('Recepción, reservas, maître y equipo de sala', 'Hosts, bookings, maître d’ and floor team'),
    outcome: text('El equipo sabe qué puede cambiar, qué debe registrar y cuándo escalar una incidencia.', 'The team knows what it can change, what it must record and when to escalate an incident.'),
    relatedPlan: 'gestion',
    sections: [
      {
        title: text('Preparar el servicio', 'Prepare service'),
        intro: text('La vista del día debe coincidir con la realidad antes de abrir puertas.', 'The daily view must match reality before doors open.'),
        points: [
          text('Revisar reservas, espera, grupos, alergias, menús y notas de sala.', 'Review bookings, waitlist, groups, allergies, menus and floor notes.'),
          text('Confirmar que mesas bloqueadas por evento o privatización no se ofrecen.', 'Confirm that tables blocked by an event or private hire are not offered.'),
          text('Asignar una persona responsable de cambios y excepciones durante el turno.', 'Assign one person responsible for changes and exceptions during the shift.'),
        ],
      },
      {
        title: text('Operar con trazabilidad', 'Operate with traceability'),
        intro: text('Cada cambio debe dejar una causa comprensible para el resto del equipo.', 'Every change must leave a cause the rest of the team can understand.'),
        points: [
          text('Mover estados solo cuando la acción ha ocurrido: confirmada, sentada, finalizada o no-show.', 'Move states only when the action happened: confirmed, seated, finished or no-show.'),
          text('Registrar origen, mesa, menú y notas relevantes sin duplicar datos innecesarios.', 'Record source, table, menu and relevant notes without duplicating unnecessary data.'),
          text('Tratar avisos, depósitos y automatizaciones de la demo como simulaciones, no como mensajes o cobros reales.', 'Treat demo notifications, deposits and automation as simulations, not real messages or charges.'),
        ],
      },
      {
        title: text('Incidencias y soporte', 'Incidents and support'),
        intro: text('Una incidencia operativa necesita una salida conocida aunque el sistema no responda.', 'An operational incident needs a known fallback even when the system does not respond.'),
        points: [
          text('Conservar el canal alternativo acordado y no prometer confirmaciones que el sistema no ha emitido.', 'Keep the agreed fallback channel and do not promise confirmations the system has not issued.'),
          text('Anotar hora, usuario, reserva afectada y resultado esperado antes de contactar con soporte.', 'Record time, user, affected booking and expected result before contacting support.'),
          text('Escalar datos sensibles solo por el canal aprobado y con el mínimo contenido necesario.', 'Escalate sensitive data only through the approved channel with the minimum necessary content.'),
        ],
      },
    ],
  },
  {
    slug: 'gestion',
    title: text('Guía de Gestión', 'Management guide'),
    eyebrow: text('Configuración, datos y adopción', 'Configuration, data and adoption'),
    summary: text('Qué preparar para migrar la operativa, validar reglas y entregar una forma de trabajo sostenible.', 'What to prepare to migrate operations, validate rules and hand over a sustainable way of working.'),
    audience: text('Responsable de reservas, operaciones y administración', 'Bookings, operations and administration leads'),
    outcome: text('La implantación parte de datos revisados, responsables nombrados y criterios de aceptación visibles.', 'Implementation starts from reviewed data, named owners and visible acceptance criteria.'),
    relatedPlan: 'gestion',
    sections: [
      {
        title: text('Inventario y migración', 'Inventory and migration'),
        intro: text('Migrar no es copiar todo: es decidir qué dato sigue teniendo valor y quién lo valida.', 'Migration is not copying everything: it means deciding which data still has value and who validates it.'),
        points: [
          text('Inventariar reservas futuras, clientes, mesas, espacios, turnos, menús y reglas activas.', 'Inventory future bookings, guests, tables, spaces, shifts, menus and active rules.'),
          text('Acordar formato, fecha de corte, deduplicación y tratamiento de históricos.', 'Agree format, cut-off date, deduplication and historical-data treatment.'),
          text('Validar una muestra y el recuento final antes de aceptar la migración.', 'Validate a sample and final counts before accepting the migration.'),
        ],
      },
      {
        title: text('Datos y RGPD en la operación', 'Data and GDPR in operations'),
        intro: text('El restaurante define la finalidad y las personas autorizadas; Logic2B implementa el alcance acordado.', 'The restaurant defines purpose and authorised people; Logic2B implements the agreed scope.'),
        points: [
          text('Documentar qué datos se recogen, por qué, durante cuánto tiempo y quién accede.', 'Document which data is collected, why, for how long and who accesses it.'),
          text('Evitar notas libres innecesarias y restringir alergias u otra información sensible.', 'Avoid unnecessary free-form notes and restrict allergies or other sensitive information.'),
          text('Definir rectificación, supresión, exportación e incidente con asesoramiento propio cuando proceda.', 'Define correction, deletion, export and incident handling with your own advice where appropriate.'),
        ],
      },
      {
        title: text('Validación y entrega', 'Validation and handover'),
        intro: text('La publicación debe cerrar preguntas operativas, no abrirlas durante el primer servicio.', 'Go-live should close operational questions, not open them during the first service.'),
        points: [
          text('Probar reservas, grupos, bloqueos, roles, exportaciones y canal de soporte.', 'Test bookings, groups, blocks, roles, exports and the support channel.'),
          text('Nombrar responsables del restaurante para contenido, reglas y altas o bajas de usuarios.', 'Name restaurant owners for content, rules and user onboarding or offboarding.'),
          text('Aceptar por escrito alcance, límites, incidencias conocidas y plan de reversión.', 'Accept scope, limits, known issues and rollback plan in writing.'),
        ],
      },
    ],
  },
  {
    slug: 'direccion',
    title: text('Guía de Dirección', 'Management team guide'),
    eyebrow: text('Decisiones con contexto y límites', 'Decisions with context and limits'),
    summary: text('Cómo gobernar datos, reglas comerciales, cobros y señales sin delegar decisiones críticas al sistema.', 'How to govern data, commercial rules, charges and signals without delegating critical decisions to the system.'),
    audience: text('Dirección, operaciones y responsable de negocio', 'Management, operations and business owners'),
    outcome: text('Cada indicador y regla tiene una fuente, una persona responsable y un límite explícito.', 'Every indicator and rule has a source, an owner and an explicit limit.'),
    relatedPlan: 'inteligente',
    sections: [
      {
        title: text('Reglas y decisiones', 'Rules and decisions'),
        intro: text('Una recomendación solo es útil si el equipo entiende sus factores y conserva la decisión final.', 'A recommendation is useful only when the team understands its factors and keeps the final decision.'),
        points: [
          text('Aprobar reglas de disponibilidad, grupos, eventos, privatizaciones y depósitos.', 'Approve availability, group, event, private-hire and deposit rules.'),
          text('Definir qué indicadores son operativos, cuáles son hipótesis y qué dato los alimenta.', 'Define which indicators are operational, which are hypotheses and what data feeds them.'),
          text('Revisar sesgos, excepciones y resultados antes de ampliar automatizaciones.', 'Review bias, exceptions and outcomes before extending automation.'),
        ],
      },
      {
        title: text('Cobros y proveedores', 'Payments and providers'),
        intro: text('Las demos enseñan reglas, pero no eligen proveedor ni mueven dinero.', 'The demos show rules, but choose no provider and move no money.'),
        points: [
          text('Acordar proveedor, titular de cuenta, comisiones, devoluciones y conciliación.', 'Agree provider, account holder, fees, refunds and reconciliation.'),
          text('Validar consentimiento, condiciones, comunicación al cliente y actuación ante disputa.', 'Validate consent, terms, guest communication and dispute handling.'),
          text('Asignar al restaurante la aprobación final de cargos y excepciones comerciales.', 'Assign final approval of charges and commercial exceptions to the restaurant.'),
        ],
      },
      {
        title: text('Gobierno y continuidad', 'Governance and continuity'),
        intro: text('La dirección debe poder entender qué depende de Logic2B y cómo continuar o salir.', 'Management must understand what depends on Logic2B and how to continue or exit.'),
        points: [
          text('Revisar accesos, responsables, retención, exportaciones y cambios de alcance.', 'Review access, owners, retention, exports and scope changes.'),
          text('Acordar métricas de servicio y soporte solo cuando formen parte de la propuesta.', 'Agree service and support metrics only when they are part of the proposal.'),
          text('Mantener un procedimiento de exportación y salida probado, con plazos y formatos definidos.', 'Keep a tested export and exit procedure with defined timelines and formats.'),
        ],
      },
    ],
  },
  {
    slug: 'propietario',
    title: text('Guía del Propietario', 'Owner guide'),
    eyebrow: text('Compra, crecimiento y control', 'Purchase, growth and control'),
    summary: text('Las decisiones que conviene cerrar antes de empezar: alcance, activos, responsabilidades, soporte y salida.', 'Decisions worth closing before starting: scope, assets, responsibilities, support and exit.'),
    audience: text('Propiedad, gerencia y quien aprueba la inversión', 'Owners, general managers and investment approvers'),
    outcome: text('La propuesta se puede comparar por resultado, dependencia y responsabilidad, no solo por pantallas.', 'The proposal can be compared by outcome, dependency and responsibility, not just by screens.'),
    relatedPlan: 'basico',
    sections: [
      {
        title: text('Elegir punto de partida', 'Choose a starting point'),
        intro: text('Básico, Gestión e Inteligente son tres alcances comerciales; crecer no obliga a rehacer la identidad.', 'Basic, Management and Intelligent are three commercial scopes; growth does not require rebuilding the identity.'),
        points: [
          text('Definir el cuello de botella: captar, coordinar o decidir con más contexto.', 'Define the bottleneck: acquisition, coordination or deciding with more context.'),
          text('Abrir la demo asociada y contrastar el recorrido con el equipo que lo usará.', 'Open the associated demo and compare the journey with the team that will use it.'),
          text('Pedir una propuesta que separe lanzamiento, mantenimiento, mejoras e integraciones.', 'Request a proposal separating launch, maintenance, improvements and integrations.'),
        ],
      },
      {
        title: text('Conservar los activos', 'Keep control of assets'),
        intro: text('Dominio, cuentas y datos deben tener una titularidad entendible desde el primer día.', 'Domain, accounts and data should have understandable ownership from day one.'),
        points: [
          text('Confirmar quién es titular del dominio, DNS, correo y cuentas de proveedores.', 'Confirm who owns the domain, DNS, email and provider accounts.'),
          text('Acordar acceso administrativo, copias y formato de exportación de los datos.', 'Agree administrative access, backups and data-export format.'),
          text('Documentar qué materiales o licencias puede reutilizar el restaurante al terminar.', 'Document which materials or licences the restaurant can reuse at the end.'),
        ],
      },
      {
        title: text('Aprobar soporte y salida', 'Approve support and exit'),
        intro: text('La relación es más segura cuando mantenimiento y finalización están descritos antes de necesitarlos.', 'The relationship is safer when maintenance and termination are described before they are needed.'),
        points: [
          text('Acordar canal, horario, prioridad, mantenimiento y responsables de cada parte.', 'Agree channel, hours, priority, maintenance and each party’s owners.'),
          text('Definir cómo se entrega una exportación y qué ocurre con los datos al cerrar.', 'Define how an export is delivered and what happens to data on closure.'),
          text('No asumir precio, SLA o integración que no figure en la propuesta aprobada.', 'Do not assume a price, SLA or integration absent from the approved proposal.'),
        ],
      },
    ],
  },
  {
    slug: 'tecnica',
    title: text('Guía Técnica', 'Technical guide'),
    eyebrow: text('Dominio, seguridad e integraciones', 'Domain, security and integrations'),
    summary: text('El contrato técnico mínimo para publicar, conectar proveedores, proteger datos y conservar una salida verificable.', 'The minimum technical contract for publishing, connecting providers, protecting data and keeping a verifiable exit.'),
    audience: text('Proveedor técnico, sistemas, protección de datos y operaciones', 'Technical provider, IT, data protection and operations'),
    outcome: text('Cada dependencia tiene propietario, entorno, credencial, prueba y procedimiento de reversión.', 'Every dependency has an owner, environment, credential, test and rollback procedure.'),
    relatedPlan: 'inteligente',
    sections: [
      {
        title: text('Dominio, DNS y publicación', 'Domain, DNS and publishing'),
        intro: text('La publicación empieza por conocer la titularidad y termina con una reversión probada.', 'Publishing starts with known ownership and ends with a tested rollback.'),
        points: [
          text('Registrar titular, proveedor, acceso, registros DNS actuales y ventana de cambio.', 'Record owner, provider, access, current DNS records and change window.'),
          text('Reducir TTL cuando proceda, validar certificados, correo y rutas antes de cambiar tráfico.', 'Reduce TTL where appropriate and validate certificates, email and routes before switching traffic.'),
          text('Conservar configuración anterior y criterio explícito para revertir.', 'Keep the previous configuration and an explicit rollback criterion.'),
        ],
      },
      {
        title: text('Datos, seguridad y RGPD', 'Data, security and GDPR'),
        intro: text('La arquitectura debe reflejar finalidad, acceso, retención y borrado acordados.', 'Architecture should reflect agreed purpose, access, retention and deletion.'),
        points: [
          text('Mapear datos, sistemas, encargados, ubicaciones y flujos de exportación.', 'Map data, systems, processors, locations and export flows.'),
          text('Separar entornos y secretos; aplicar mínimo privilegio, registro y rotación.', 'Separate environments and secrets; apply least privilege, logging and rotation.'),
          text('Definir copias, restauración, incidentes y supresión con responsables y pruebas.', 'Define backups, restoration, incidents and deletion with owners and tests.'),
        ],
      },
      {
        title: text('Integraciones y cobros', 'Integrations and payments'),
        intro: text('Una conexión solo se considera real cuando proveedor, alcance y fallo están probados.', 'A connection is real only when provider, scope and failure have been tested.'),
        points: [
          text('Documentar API, entorno, credenciales, límites, reintentos e idempotencia.', 'Document API, environment, credentials, limits, retries and idempotency.'),
          text('Para cobros, acordar proveedor, webhooks, conciliación, devolución y disputa.', 'For payments, agree provider, webhooks, reconciliation, refunds and disputes.'),
          text('Etiquetar como demostrativa o prevista cualquier conexión que no esté implantada.', 'Label as demonstrative or planned any connection that has not been implemented.'),
        ],
      },
      {
        title: text('Soporte, entrega y salida', 'Support, handover and exit'),
        intro: text('La continuidad necesita documentación operable por otra persona, no solo por quien construyó.', 'Continuity needs documentation another person can operate, not only the builder.'),
        points: [
          text('Entregar arquitectura, dominios, cuentas, dependencias, monitorización y runbooks acordados.', 'Hand over architecture, domains, accounts, dependencies, monitoring and agreed runbooks.'),
          text('Probar soporte y recuperación con un caso realista antes de la aceptación.', 'Test support and recovery with a realistic case before acceptance.'),
          text('Acordar exportación, revocación de accesos, borrado y verificación al finalizar.', 'Agree export, access revocation, deletion and verification on termination.'),
        ],
      },
    ],
  },
] as const satisfies readonly GuideEntry[];

export const localizedGuideText = (value: GuideText, locale: Locale): string => value[locale];

export const guideUrl = (guide: GuideEntry | GuideSlug, locale: Locale = 'es'): string => {
  const slug = typeof guide === 'string' ? guide : guide.slug;
  return `${locale === 'en' ? '/en' : ''}/docs/${slug}/`;
};

export const getGuide = (slug: string): GuideEntry | undefined => GUIDE_CATALOG.find((guide) => guide.slug === slug);
