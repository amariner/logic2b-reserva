export const SITE_CONTENT = {
  es: {
    nav: {
      problem: 'El reto',
      differences: 'Producto',
      demos: 'Demos',
      plans: 'Planes',
      support: 'Implantación',
      faq: 'Preguntas',
      contact: 'Solicitar demo',
      language: 'EN',
    },
    hero: {
      eyebrow: 'Reservas, grupos y eventos',
      beforeHighlight: 'La sala ',
      highlight: 'manda.',
      afterHighlight: ' También online.',
      promise: 'Una sola disponibilidad para todo el servicio.',
      body: 'Mesas, menús, grupos y eventos avanzan con la sala real delante. Lo que se ofrece online se bloquea donde corresponde, sin reconstruir el día entre herramientas.',
      support: 'La implantación se define con Logic2B a partir de tu operativa real.',
      primary: 'Abrir la demo · 2 min',
      secondary: 'Hablar de mi operativa',
      note: 'Escenario navegable de Solane · Datos ficticios, sin cobros reales',
    },
    differences: {
      eyebrow: 'Un servicio. Una disponibilidad.',
      title: 'Dos operativas que ya no compiten entre sí.',
      intro: 'La reserva diaria y los eventos necesitan recorridos distintos. Comparten la misma capacidad, las mismas mesas y una decisión visible para sala.',
      paths: [
        { id: 'restaurant', eyebrow: 'Servicio diario', title: 'La disponibilidad que publicas nace de la sala.', body: 'Cada solicitud responde a turno, mesa, tamaño de grupo y menú. El cliente reserva dentro de tu marca y el equipo recibe el contexto listo para actuar.', points: ['Mesas y turnos conectados', 'Menús opcionales o cerrados', 'Estados claros antes del servicio'], action: 'Ver reservas de restaurante' },
        { id: 'events', eyebrow: 'Grupos y eventos', title: 'El evento deja de vivir fuera del servicio.', body: 'Solicitud, propuesta, señal y bloqueo del espacio avanzan juntos. Cuando el evento ocupa mesas, la disponibilidad ordinaria responde.', points: ['Solicitud y propuesta con contexto', 'Señal y condiciones trazables en la demo', 'Bloqueo del espacio compartido'], action: 'Ver grupos y eventos' },
      ],
    },
    demos: {
      eyebrow: 'La prueba está abierta',
      title: 'No te lo contamos. Te lo dejamos abierto.',
      intro: 'Tres operaciones ficticias muestran tres puntos de partida. Entra, reserva, organiza un servicio y comprueba qué cambia cuando todo comparte contexto.',
      items: [
        { slug: 'solane', name: 'Solane', level: 'Inteligente', title: 'El evento también ocupa mesa', body: 'Eventos, depósitos y privatizaciones comparten el inventario del servicio. Publica una cena y comprueba cómo responde la disponibilidad.', action: 'Entrar en Solane', alt: 'Gestión de una privatización que bloquea el espacio en el inventario de Solane' },
        { slug: 'vedra', name: 'Vedra', level: 'Gestión', title: 'Ordena el servicio antes de abrir', body: 'Reservas, grupos, mesas y clientes llegan al mismo espacio de trabajo para que sala no tenga que reconstruir el día.', action: 'Entrar en Vedra', alt: 'Comedor luminoso del restaurante ficticio Vedra' },
        { slug: 'brasca', name: 'Brasca', level: 'Básico', title: 'Recupera una web que sí trabaja', body: 'Un bistró de barrio recibe solicitudes con su propia identidad y sin ceder el primer contacto.', action: 'Entrar en Brasca', alt: 'Mesa preparada en el bistró ficticio Brasca' },
      ],
    },
    human: {
      eyebrow: 'Implantación, no autoservicio',
      title: 'Tu operativa marca las reglas. Logic2B diseña el encaje.',
      body: 'Si el proyecto avanza, el alcance se acuerda sobre tus turnos, mesas, grupos, eventos y canales. La demostración enseña el recorrido; la implantación real se valida por proyecto.',
      items: [
        { number: '01', title: 'Leemos el servicio', body: 'Revisamos lo que ya funciona y dónde se pierde contexto antes de abrir puertas.' },
        { number: '02', title: 'Definimos el alcance', body: 'Acordamos recorridos, reglas e integraciones antes de convertir una pantalla en promesa.' },
        { number: '03', title: 'Validamos qué exigiría la puesta en marcha', body: 'Datos, permisos, cobros y proveedores requerirían un despliegue de cliente separado, desarrollado y aprobado para ese alcance.' },
      ],
      closing: 'Primero el servicio. Después, la tecnología que tendría sentido desarrollar o integrar.',
      action: 'Revisar mi operativa',
    },
    faq: {
      eyebrow: 'Antes de mover una sola mesa',
      title: 'Las dudas que sí cambian la decisión.',
      items: [
        { question: '¿Qué estoy viendo exactamente?', answer: 'Una demostración comercial navegable. El estado vive en tu navegador y no existen todavía cuentas, base de datos multi-tenant, cobros ni integraciones de restaurante.' },
        { question: '¿Qué se define antes de implantar?', answer: 'Alcance, datos, permisos, proveedores, migración, integraciones y soporte. Ninguna capacidad se considera activa por aparecer en una pantalla.' },
        { question: '¿Cómo se plantean datos, depósitos y no-shows?', answer: 'La demo muestra información previa, aceptación y desglose con datos ficticios. La propiedad del dato, la política aplicable y cualquier cobro real se validan y documentan en cada proyecto.' },
        { question: '¿Tengo que cambiar toda mi operativa?', answer: 'No. La conversación empieza por el cuello de botella actual y por lo que tu equipo ya sabe hacer. El alcance comercial se acuerda antes de desarrollar o activar nada.' },
      ],
    },
    lead: {
      eyebrow: 'Empieza con una conversación, no con una cuenta',
      title: 'Cuéntanos qué quieres ordenar. Te devolvemos un punto de partida.',
      body: 'Logic2B revisará la operativa que compartas y preparará un mapa inicial de alcance para reservas, grupos, eventos y sala.',
      fields: { name: 'Nombre', restaurant: 'Restaurante', email: 'Correo profesional', level: 'Qué quieres ordenar primero', message: '¿Qué ocurre hoy?', privacy: 'He leído la política de privacidad y acepto que Logic2B use estos datos para responder.' },
      priorities: [{ value: 'basico', label: 'Reserva directa en mi web' }, { value: 'gestion', label: 'Servicio diario y grupos' }, { value: 'inteligente', label: 'Eventos y privatizaciones' }],
      submit: 'Enviar solicitud',
      disabled: 'Envío deshabilitado en esta demo. No se ha enviado ni guardado ningún dato. Puedes contactar directamente con Logic2B por WhatsApp.',
      invalid: 'Revisa los campos obligatorios y la aceptación de privacidad.',
      failure: 'No se ha podido conectar. No se ha enviado ni guardado ningún dato.',
      success: 'Solicitud entregada a Logic2B. Conserva la referencia por si necesitas consultarnos.',
      limited: 'Has alcanzado el límite temporal de solicitudes. Espera un minuto o contacta por WhatsApp.',
      whatsapp: 'Hablar por WhatsApp',
    },
    cookies: {
      text: 'Esta web no carga analítica. Solo guardamos tu preferencia para no volver a preguntarte.',
      accept: 'Aceptar analítica futura',
      reject: 'Solo necesarias',
    },
    footer: {
      line: 'Una propuesta de reservas, grupos y eventos construida alrededor de la sala real.',
      plans: 'Planes',
      restaurants: 'Restaurantes',
      groups: 'Grupos y eventos',
      legal: 'Legal',
      privacy: 'Privacidad',
      cookies: 'Cookies',
      demo: 'Demostración comercial · No es un servicio en producción',
    },
  },
  en: {
    nav: { problem: 'The challenge', differences: 'Product', demos: 'Demos', plans: 'Plans', support: 'Implementation', faq: 'Questions', contact: 'Request a demo', language: 'ES' },
    hero: { eyebrow: 'Bookings, groups and events', beforeHighlight: 'The floor ', highlight: 'leads.', afterHighlight: ' Online too.', promise: 'One availability view for the whole service.', body: 'Tables, menus, groups and events move with the real floor in view. What is offered online is blocked in the right place, without rebuilding the day across tools.', support: 'Implementation is defined with Logic2B around your real operation.', primary: 'Open the demo · 2 min', secondary: 'Discuss my operation', note: 'Navigable Solane scenario · Fictional data, no real charges' },
    differences: { eyebrow: 'One service. One availability view.', title: 'Two operations that no longer compete.', intro: 'Daily bookings and events need different journeys. They share the same capacity, the same tables and one decision visible to the floor team.', paths: [{ id: 'restaurant', eyebrow: 'Daily service', title: 'Published availability starts with the floor.', body: 'Every enquiry follows turns, tables, party size and menu. Guests book inside your brand and the team receives context ready for action.', points: ['Connected tables and turns', 'Optional or fixed menus', 'Clear states before service'], action: 'See restaurant bookings' }, { id: 'events', eyebrow: 'Groups and events', title: 'The event stops living outside service.', body: 'Enquiry, proposal, deposit and space block move together. When the event uses tables, ordinary availability responds.', points: ['Context-rich enquiry and proposal', 'Traceable demo deposit and terms', 'Shared space blocking'], action: 'See groups and events' }] },
    demos: { eyebrow: 'The proof is open', title: 'We do not just describe it. We leave it open.', intro: 'Three fictional operations show three starting points. Step in, book, organise a service and see what changes when everything shares context.', items: [{ slug: 'solane', name: 'Solane', level: 'Intelligent', title: 'The event takes up tables too', body: 'Events, deposits and private hire share service inventory. Publish a dinner and watch availability respond.', action: 'Enter Solane', alt: 'Private-hire workflow blocking the space in Solane’s shared inventory' }, { slug: 'vedra', name: 'Vedra', level: 'Management', title: 'Organise service before opening', body: 'Bookings, groups, tables and guests reach one workspace so the floor team does not rebuild the day.', action: 'Enter Vedra', alt: 'Bright dining room at the fictional Vedra restaurant' }, { slug: 'brasca', name: 'Brasca', level: 'Basic', title: 'Make your website work again', body: 'A neighbourhood bistro receives enquiries in its own identity without giving away the first contact.', action: 'Enter Brasca', alt: 'A prepared table at the fictional Brasca bistro' }] },
    human: { eyebrow: 'Implementation, not self-service', title: 'Your operation sets the rules. Logic2B designs the fit.', body: 'If the project moves forward, scope is agreed around your turns, tables, groups, events and channels. The demo shows the journey; real implementation is validated per project.', items: [{ number: '01', title: 'Read the service', body: 'We review what already works and where context gets lost before doors open.' }, { number: '02', title: 'Define the scope', body: 'We agree journeys, rules and integrations before turning a screen into a promise.' }, { number: '03', title: 'Validate what launch would require', body: 'Data, permissions, payments and providers would require a separate client deployment, developed and approved for that scope.' }], closing: 'Service first. Then the technology that would make sense to develop or integrate.', action: 'Review my operation' },
    faq: { eyebrow: 'Before moving a single table', title: 'The questions that change the decision.', items: [{ question: 'What exactly am I looking at?', answer: 'A navigable commercial demonstration. State lives in your browser; there are no production accounts, multi-tenant database, payments or restaurant integrations yet.' }, { question: 'What is defined before implementation?', answer: 'Scope, data, permissions, providers, migration, integrations and support. A capability is not active merely because it appears on a screen.' }, { question: 'How are data, deposits and no-shows approached?', answer: 'The demo shows advance information, acceptance and a breakdown with fictional data. Data ownership, applicable policy and any real payment are validated and documented per project.' }, { question: 'Do I have to change my whole operation?', answer: 'No. The conversation starts with today’s bottleneck and what your team already does well. Commercial scope is agreed before anything is developed or activated.' }] },
    lead: { eyebrow: 'Start with a conversation, not an account', title: 'Tell us what you want to organise. We will return a starting point.', body: 'Logic2B will review the operation you share and prepare an initial scope map for bookings, groups, events and the floor.', fields: { name: 'Name', restaurant: 'Restaurant', email: 'Work email', level: 'What do you want to organise first?', message: 'What happens today?', privacy: 'I have read the privacy policy and accept that Logic2B uses these details to reply.' }, priorities: [{ value: 'basico', label: 'Direct booking on my website' }, { value: 'gestion', label: 'Daily service and groups' }, { value: 'inteligente', label: 'Events and private hire' }], submit: 'Send request', disabled: 'Sending is disabled in this demo. No data was sent or stored. You can contact Logic2B directly on WhatsApp.', invalid: 'Check the required fields and privacy acceptance.', failure: 'Connection failed. No data was sent or stored.', success: 'Request delivered to Logic2B. Keep the reference in case you need to contact us.', limited: 'You have reached the temporary request limit. Wait a minute or contact us on WhatsApp.', whatsapp: 'Talk on WhatsApp' },
    cookies: { text: 'This website loads no analytics. We only save your choice so we do not ask again.', accept: 'Allow future analytics', reject: 'Necessary only' },
    footer: { line: 'A booking, group and event proposition built around the real floor.', plans: 'Plans', restaurants: 'Restaurants', groups: 'Groups and events', legal: 'Legal', privacy: 'Privacy', cookies: 'Cookies', demo: 'Commercial demonstration · Not a production service' },
  },
} as const;

export const INFO_PAGES = {
  es: {
    planes: { eyebrow: 'Planes Logic Reserva', title: 'Tres formas de avanzar sin comprar de más.', intro: 'Básico muestra presencia y solicitudes; Gestión ordena la operación; Inteligente explora IA y automatización demostrativas. Logic2B define contigo qué alcance tendría sentido implantar.', points: ['Básico · web propia y recorrido de solicitud que una implantación podría enviar por email', 'Gestión · recorrido de organización con reservas, mesas, grupos, clientes e informes', 'Inteligente · IA determinista, automatizaciones simuladas, eventos y privatizaciones', 'Configuración y soporte sujetos al alcance comercial acordado'] },
    restaurantes: { eyebrow: 'Solución para restaurantes', title: 'La reserva puede empezar en tu web y terminar en la sala.', intro: 'La demo plantea una capa propia para convertir y ordenar el servicio. Datos, integraciones y puesta en marcha se concretan con Logic2B para cada proyecto.', points: ['Experiencia visual integrada en tu marca', 'Disponibilidad demostrada por mesa y turnos', 'Menús opcionales o cerrados', 'Estados legibles para el equipo de sala', 'Implantación y soporte por acordar'] },
    grupos: { eyebrow: 'Grupos y eventos', title: 'El evento deja de competir con la sala.', intro: 'La demo conecta aforo, menús, señal simulada y mesas consumidas. Logic2B valida contigo el recorrido y las integraciones antes de una implantación real.', points: ['Mesas combinables para grupos', 'Eventos que bloquean mesas en el escenario', 'Privatizaciones desde solicitud hasta señal simulada', 'Condiciones y desglose trazables en la demo', 'Alcance adaptado a tus formatos y condiciones'] },
    legal: { eyebrow: 'Información legal', title: 'Aviso legal de la demostración.', intro: 'Logic Reserva es una demostración comercial de Logic2B. No presta todavía un servicio de reservas, cobro o almacenamiento de datos.', points: ['Titular: Logic2B', 'Contacto: hola@logic2b.com', 'Las marcas Brasca, Vedra y Solane son ficticias', 'No existe relación contractual al explorar la demo'] },
    privacidad: { eyebrow: 'Privacidad', title: 'La demo no necesita tus datos para funcionar.', intro: 'No hay cuentas ni perfiles. El formulario de contacto solo transmite los datos que introduces para que Logic2B responda a tu solicitud.', points: ['El formulario exige aceptación antes de enviar', 'La entrega usa un canal transaccional y limita abusos', 'El estado de las demos permanece en el navegador', 'Puedes solicitar acceso, rectificación o supresión por email'] },
    cookies: { eyebrow: 'Cookies', title: 'Solo estado local y con permiso.', intro: 'Actualmente no cargamos analítica ni publicidad. La preferencia del banner se guarda localmente para no volver a preguntarte.', points: ['Sin cookies publicitarias', 'Sin analítica antes del consentimiento', 'Preferencia revocable borrando el almacenamiento local', 'Cualquier medición futura será opcional'] },
  },
  en: {
    planes: { eyebrow: 'Logic Reserva plans', title: 'Three ways to move forward without overbuying.', intro: 'Basic shows presence and enquiries; Management organises the journey; Intelligent explores demo AI and automation. Logic2B defines with you what scope would make sense to implement.', points: ['Basic · owned website and an enquiry journey that an implementation could send by email', 'Management · demonstrated organisation with bookings, tables, groups, guests and reports', 'Intelligent · deterministic AI, simulated automation, events and private hire', 'Configuration and support subject to agreed commercial scope'] },
    restaurantes: { eyebrow: 'For restaurants', title: 'A booking can start on your website and end on the restaurant floor.', intro: 'The demo proposes an owned layer for conversion and service organisation. Data, integrations and launch are defined with Logic2B for each project.', points: ['Visually integrated brand experience', 'Demonstrated table and turn availability', 'Optional or fixed menus', 'Readable states for floor teams', 'Implementation and support to be agreed'] },
    grupos: { eyebrow: 'Groups and events', title: 'The event no longer competes with the dining room.', intro: 'The demo connects capacity, menus, a simulated deposit and consumed tables. Logic2B validates the journey and integrations with you before real implementation.', points: ['Combinable tables for groups', 'Events block tables in the scenario', 'Private hire from request to simulated deposit', 'Traceable demo terms and breakdown', 'Scope adapted to your formats and terms'] },
    legal: { eyebrow: 'Legal information', title: 'Demo legal notice.', intro: 'Logic Reserva is a Logic2B commercial demonstration. It does not yet provide booking, payment or data storage services.', points: ['Owner: Logic2B', 'Contact: hola@logic2b.com', 'Brasca, Vedra and Solane are fictional brands', 'Exploring the demo creates no contract'] },
    privacidad: { eyebrow: 'Privacy', title: 'The demo needs no personal data to work.', intro: 'There are no accounts or profiles. The contact form only transmits the details you enter so Logic2B can answer your request.', points: ['The form requires consent before sending', 'Delivery uses a transactional channel and rate limits abuse', 'Demo state stays in the browser', 'Access, correction or deletion can be requested by email'] },
    cookies: { eyebrow: 'Cookies', title: 'Local state, and only with permission.', intro: 'We currently load no analytics or advertising. The banner preference is stored locally so we do not ask again.', points: ['No advertising cookies', 'No analytics before consent', 'Preference can be revoked by clearing local storage', 'Any future measurement will be optional'] },
  },
} as const;

export const COMMERCIAL_PAGE_DETAILS = {
  es: {
    planes: {
      metaTitle: 'Planes para digitalizar reservas | Logic Reserva',
      metaDescription: 'Demo de alcances para reservas: web propia, organización de sala y grupos, o eventos y automatización simulada. Implantación por definir.',
      chapters: [
        { title: 'Cuando la web informa, pero no convierte', body: 'Básico muestra cómo sustituir el “llámanos para reservar” por una experiencia propia. En una implantación, el restaurante podría recibir la solicitud sin enviar al cliente a una marca ajena.' },
        { title: 'Cuando coordinar ya pesa más que captar', body: 'Gestión ordena reservas, mesas, grupos y clientes antes del servicio. El valor no está en sumar pantallas, sino en dejar de reconstruir el día entre mensajes.' },
        { title: 'Cuando decidir tarde empieza a costar', body: 'Inteligente demuestra eventos, depósitos, automatizaciones simuladas y apoyo determinista a la decisión sobre el mismo contexto.' },
      ],
      outcomes: ['Empieza por un problema reconocible', 'Conserva un camino de crecimiento', 'Acuerda solo el alcance que usarás', 'Define con Logic2B qué requeriría una implantación'],
      faqs: [
        { question: '¿Puedo empezar por Básico y avanzar después?', answer: 'Sí. La escalera está pensada para añadir organización y decisión sin obligar al restaurante a adoptar toda la operativa desde el primer día.' },
        { question: '¿Hay un precio estándar para cada plan?', answer: 'La demo delimita el alcance funcional. La propuesta comercial depende de la web, los flujos, los puntos de venta y el acompañamiento que necesite cada restaurante.' },
        { question: '¿Qué plan encaja si ya tengo motor de reservas?', answer: 'Depende del cuello de botella. Si el problema está en grupos, eventos o coordinación de sala, Gestión o Inteligente pueden tener sentido aunque ya exista un canal de reserva.' },
        { question: '¿La configuración está incluida en la implantación?', answer: 'La demo no fija condiciones comerciales. En una implantación acordada, la propuesta debe detallar configuración, puesta en marcha, integraciones y soporte.' },
      ],
    },
    restaurantes: {
      metaTitle: 'Reservas online para restaurantes | Logic Reserva',
      metaDescription: 'Demo de reservas para restaurantes con identidad propia, disponibilidad por mesa, menús y operación de sala conectada en un mismo recorrido.',
      chapters: [
        { title: 'Antes de reservar, el cliente sigue en tu casa', body: 'La experiencia conserva el tono, la carta y la confianza de tu web. No obliga a saltar a otro dominio justo cuando el cliente está preparado para elegir.' },
        { title: 'Al confirmar, la promesa cabe en la sala', body: 'La disponibilidad responde a mesas, tamaños de grupo, turnos y menús. Lo que se ofrece online nace de la capacidad que el equipo puede atender.' },
        { title: 'Durante el servicio, nadie traduce el canal', body: 'Sala ve el origen, el estado y el contexto de cada reserva. El dato llega listo para actuar, no como otro mensaje que alguien tiene que interpretar.' },
      ],
      outcomes: ['Diseño orientado a la reserva directa', 'Menos conciliación antes del servicio', 'Modelo de datos por definir en cada implantación', 'Turnos, mesas y reglas validados con tu equipo'],
      faqs: [
        { question: '¿El widget puede respetar la marca del restaurante?', answer: 'Sí. La experiencia se plantea como parte de la web, con identidad, tono y recorrido propios, no como un iframe visualmente ajeno.' },
        { question: '¿Puede trabajar con menús cerrados?', answer: 'Sí. La demo muestra menús opcionales y cerrados vinculados a la reserva, de modo que cocina y sala conocen el compromiso antes del servicio.' },
        { question: '¿Logic Reserva cobra comisión por comensal?', answer: 'La demo no fija tarifas ni modelo de cobro. Cualquier cuota, coste transaccional, implantación y soporte debe aparecer en una propuesta comercial explícita.' },
        { question: '¿Tengo que configurar solo las mesas y los turnos?', answer: 'No. Si se acuerda una implantación, Logic2B revisa contigo el servicio y documenta qué configuración y soporte forman parte del alcance.' },
      ],
    },
    grupos: {
      metaTitle: 'Gestión de grupos y eventos | Logic Reserva',
      metaDescription: 'Demo de grupos, eventos y privatizaciones con menús, señales simuladas y mesas compartidas. La implantación se define por proyecto.',
      chapters: [
        { title: 'La solicitud deja de ser un mensaje suelto', body: 'Fechas, tamaño, formato y necesidades especiales entran con estructura. El equipo puede responder sin perseguir el contexto por correo y WhatsApp.' },
        { title: 'La propuesta se convierte en compromiso', body: 'Menú, condiciones y señal avanzan juntos. Cuando el cliente acepta, el espacio deja de ser una posibilidad y pasa a una decisión operativa.' },
        { title: 'El evento consume la sala que realmente ocupa', body: 'Las mesas bloqueadas dejan de ofrecerse en reserva ordinaria. Evento y restaurante comparten inventario para no vender dos veces la misma capacidad.' },
      ],
      outcomes: ['Seguimiento comercial demostrado en un recorrido', 'Señales y condiciones trazables en la demo', 'Aforo de eventos conectado a mesas del escenario', 'Alcance por validar alrededor de tus formatos reales'],
      faqs: [
        { question: '¿Sirve para grupos que combinan varias mesas?', answer: 'Sí. La demo permite proponer combinaciones según capacidad y conservar la asignación cuando el grupo avanza.' },
        { question: '¿Cómo se evita vender las mesas de un evento?', answer: 'Al publicar o confirmar el evento, las mesas consumidas se bloquean en el inventario compartido y dejan de aparecer como disponibilidad ordinaria.' },
        { question: '¿Puede gestionar una privatización completa?', answer: 'La experiencia cubre solicitud, propuesta, señal y bloqueo del espacio, con un estado entendible tanto para dirección como para sala.' },
        { question: '¿Quién adapta el circuito de grupos y eventos?', answer: 'En una implantación acordada, Logic2B define contigo solicitudes, formatos, menús, condiciones, señales, bloqueos y soporte. La demo no activa esos proveedores por sí sola.' },
      ],
    },
  },
  en: {
    planes: {
      metaTitle: 'Restaurant booking plans | Logic Reserva',
      metaDescription: 'Booking scope demo: owned website, floor and group organisation, or events and simulated automation. Implementation is defined per project.',
      chapters: [
        { title: 'When the website informs but does not convert', body: 'Basic shows how “call us to book” could become an owned experience. In an implementation, the restaurant could receive the enquiry without sending the guest to somebody else’s brand.' },
        { title: 'When coordination costs more than acquisition', body: 'Management organises bookings, tables, groups and guests before service. The value is not another screen, but no longer rebuilding the day from messages.' },
        { title: 'When late decisions start costing money', body: 'Intelligent demonstrates events, deposits, simulated automation and deterministic decision support in the same context.' },
      ],
      outcomes: ['Start with a recognisable problem', 'Keep a clear growth path', 'Agree only the scope you will use', 'Define with Logic2B what an implementation would require'],
      faqs: [
        { question: 'Can I start with Basic and move up later?', answer: 'Yes. The path adds organisation and decision support without forcing the restaurant to adopt the full operation on day one.' },
        { question: 'Is there a standard price for each plan?', answer: 'The demo defines functional scope. A commercial proposal depends on the website, workflows, locations and support each restaurant needs.' },
        { question: 'Which plan fits if I already have a booking engine?', answer: 'It depends on the bottleneck. If groups, events or floor coordination are the problem, Management or Intelligent may fit even with an existing booking channel.' },
        { question: 'Is configuration included in implementation?', answer: 'The demo sets no commercial terms. An agreed implementation proposal must detail configuration, launch, integrations and support.' },
      ],
    },
    restaurantes: {
      metaTitle: 'Online restaurant bookings | Logic Reserva',
      metaDescription: 'Restaurant booking demo with an owned identity, table availability, menus and floor operations connected in one journey.',
      chapters: [
        { title: 'Before booking, the guest stays in your home', body: 'The experience keeps the tone, menu and trust of your website. Guests do not jump to another domain just as they are ready to choose.' },
        { title: 'At confirmation, the promise fits the floor', body: 'Availability follows tables, party sizes, turns and menus. What is offered online comes from the capacity your team can actually serve.' },
        { title: 'During service, nobody translates the channel', body: 'Floor teams see the source, status and context of each booking. Data arrives ready for action, not as another message somebody must interpret.' },
      ],
      outcomes: ['A design oriented towards direct booking', 'Less reconciliation before service', 'A data model to define per implementation', 'Turns, tables and rules validated with your team'],
      faqs: [
        { question: 'Can the widget match the restaurant brand?', answer: 'Yes. The experience is designed as part of the website, with its own identity, tone and journey rather than a visually foreign iframe.' },
        { question: 'Can it work with fixed menus?', answer: 'Yes. The demo shows optional and fixed menus linked to the booking, so kitchen and floor teams know the commitment before service.' },
        { question: 'Does Logic Reserva charge per guest?', answer: 'The demo sets no pricing or charging model. Any subscription, transaction cost, implementation and support must appear in an explicit commercial proposal.' },
        { question: 'Do I have to configure tables and turns on my own?', answer: 'No. If an implementation is agreed, Logic2B reviews service with you and documents which configuration and support are in scope.' },
      ],
    },
    grupos: {
      metaTitle: 'Restaurant group and event management | Logic Reserva',
      metaDescription: 'Demo of groups, events and private hire with menus, simulated deposits and shared tables. Implementation is defined per project.',
      chapters: [
        { title: 'The enquiry stops being a loose message', body: 'Dates, party size, format and special needs arrive with structure. Your team can respond without chasing context across email and WhatsApp.' },
        { title: 'The proposal becomes a commitment', body: 'Menu, terms and deposit move together. Once the guest accepts, the space becomes an operational decision rather than a possibility.' },
        { title: 'The event consumes the floor it actually uses', body: 'Blocked tables stop appearing in ordinary booking availability. Events and restaurant service share inventory so the same capacity is never sold twice.' },
      ],
      outcomes: ['Commercial follow-up demonstrated in one journey', 'Traceable demo deposits and terms', 'Event capacity connected to scenario tables', 'Scope to validate around your real formats'],
      faqs: [
        { question: 'Does it work for groups combining several tables?', answer: 'Yes. The demo proposes combinations by capacity and keeps the assignment as the group progresses.' },
        { question: 'How do events stop tables being sold twice?', answer: 'When the event is published or confirmed, its tables are blocked in shared inventory and disappear from ordinary availability.' },
        { question: 'Can it manage full private hire?', answer: 'The experience covers enquiry, proposal, deposit and space block with a status both management and floor teams can understand.' },
        { question: 'Who adapts the group and event journey?', answer: 'In an agreed implementation, Logic2B defines enquiry types, formats, menus, terms, deposits, blocks and support with you. The demo activates no providers by itself.' },
      ],
    },
  },
} as const;

export type InfoPageKey = keyof typeof INFO_PAGES.es;
export type CommercialPageKey = keyof typeof COMMERCIAL_PAGE_DETAILS.es;
