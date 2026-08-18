import type { DemoSlug, Locale } from '@logic-reserva/config';
import type {
  CustomerProfile,
  PlanLevel,
  PrivateHire,
  Restaurant,
  RestaurantEvent,
  Table,
  TableBooking,
} from '@logic-reserva/domain';

export const DEMO_DATE = '2026-09-18';

export interface BilingualText {
  readonly es: string;
  readonly en: string;
}

const text = (es: string, en: string): BilingualText => ({ es, en });

function lineTables(prefix: string, count: number, minSeats = 1, maxSeats = 4): Table[] {
  return Array.from({ length: count }, (_, index) => {
    const position = index + 1;
    const combinableWith = [position > 1 ? `${prefix}${position - 1}` : undefined, position < count ? `${prefix}${position + 1}` : undefined].filter(
      (value): value is string => value !== undefined,
    );
    return { id: `${prefix}${position}`, name: `Mesa ${position}`, minSeats, maxSeats, combinableWith };
  });
}

export const DEMO_COPY = {
  brasca: {
    nav: [
      { label: text('Carta', 'Menu'), href: '#carta' },
      { label: text('El bistró', 'The bistro'), href: '#bistro' },
      { label: text('Contacto', 'Contact'), href: '#contacto' },
    ],
    hero: {
      eyebrow: text('Bistró de barrio · Valencia', 'Neighbourhood bistro · Valencia'),
      title: text('Fuego lento, mesa compartida.', 'Slow fire, shared table.'),
      body: text(
        'Producto de temporada, una carta corta y el punto justo de brasa. Ven como eres; del resto nos ocupamos nosotros.',
        'Seasonal produce, a short menu and just the right touch of fire. Come as you are; we will take care of the rest.',
      ),
      primaryAction: text('Pedir mesa', 'Request a table'),
      secondaryAction: text('Ver la carta', 'View the menu'),
    },
    form: {
      title: text('Pide tu mesa', 'Request your table'),
      date: text('Fecha', 'Date'),
      partySize: text('Personas', 'Guests'),
      service: text('Servicio', 'Service'),
      name: text('Tu nombre', 'Your name'),
      email: text('Correo', 'Email'),
      submit: text('Enviar solicitud', 'Send request'),
      privacy: text('Esta demo no envía ni guarda datos reales.', 'This demo does not send or store real data.'),
    },
  },
  vedra: {
    nav: [
      { label: text('Menús', 'Menus'), href: '#menus' },
      { label: text('Espacios', 'Spaces'), href: '#espacios' },
      { label: text('Grupos', 'Groups'), href: '#grupos' },
    ],
    hero: {
      eyebrow: text('Cocina mediterránea · Madrid', 'Mediterranean kitchen · Madrid'),
      title: text('Cada mesa encuentra su momento.', 'Every table finds its moment.'),
      body: text(
        'Tres espacios, menús que cambian con la estación y reservas directas para comidas, cenas y grupos.',
        'Three spaces, menus that change with the season and direct bookings for lunch, dinner and groups.',
      ),
      primaryAction: text('Reservar', 'Book a table'),
      secondaryAction: text('Menús de grupo', 'Group menus'),
    },
    form: {
      title: text('Reserva en Vedra', 'Book at Vedra'),
      date: text('Fecha', 'Date'),
      partySize: text('Personas', 'Guests'),
      service: text('Comida o cena', 'Lunch or dinner'),
      name: text('Nombre de la reserva', 'Booking name'),
      email: text('Correo de confirmación', 'Confirmation email'),
      submit: text('Buscar mesa', 'Find a table'),
      privacy: text('Demostración ficticia; no se completa ninguna reserva.', 'Fictional demo; no booking is completed.'),
    },
  },
  solane: {
    nav: [
      { label: text('Experiencia', 'Experience'), href: '#experiencia' },
      { label: text('Eventos', 'Events'), href: '#eventos' },
      { label: text('Privado', 'Private dining'), href: '#privado' },
    ],
    hero: {
      eyebrow: text('Gastronómico contemporáneo · Barcelona', 'Contemporary fine dining · Barcelona'),
      title: text('Una noche que empieza antes de sentarse.', 'An evening that begins before you sit down.'),
      body: text(
        'Menú degustación, cenas de aforo limitado y un privado pensado para celebrar sin interrupciones.',
        'Tasting menu, limited-seat dinners and a private room designed for uninterrupted celebrations.',
      ),
      primaryAction: text('Reservar experiencia', 'Book the experience'),
      secondaryAction: text('Descubrir eventos', 'Discover events'),
    },
    form: {
      title: text('Tu experiencia Solane', 'Your Solane experience'),
      date: text('Fecha', 'Date'),
      partySize: text('Comensales', 'Guests'),
      service: text('Experiencia', 'Experience'),
      name: text('Nombre', 'Name'),
      email: text('Correo', 'Email'),
      submit: text('Consultar disponibilidad', 'Check availability'),
      privacy: text('Pasarela y reserva simuladas; no se realizará ningún cobro.', 'Simulated booking and checkout; no charge will be made.'),
    },
  },
} as const satisfies Record<DemoSlug, {
  nav: readonly { label: BilingualText; href: string }[];
  hero: {
    eyebrow: BilingualText;
    title: BilingualText;
    body: BilingualText;
    primaryAction: BilingualText;
    secondaryAction: BilingualText;
  };
  form: {
    title: BilingualText;
    date: BilingualText;
    partySize: BilingualText;
    service: BilingualText;
    name: BilingualText;
    email: BilingualText;
    submit: BilingualText;
    privacy: BilingualText;
  };
}>;

export const BRASCA_PAGE_COPY = {
  menu: {
    eyebrow: text('Carta corta · producto cercano', 'Short menu · local produce'),
    title: text('Lo que hoy pasa por la brasa.', 'What meets the fire today.'),
    intro: text(
      'Cocinamos con lo que llega bien y servimos al centro. Los precios incluyen IVA; la carta cambia sin pedir permiso.',
      'We cook what arrives at its best and serve it for the table. Prices include VAT; the menu changes whenever it needs to.',
    ),
  },
  story: {
    eyebrow: text('Un bistró, no un concepto', 'A bistro, not a concept'),
    title: text('Brasca nació alrededor de una mesa larga.', 'Brasca began around one long table.'),
    paragraphs: [
      text(
        'Compramos cerca, encendemos temprano y dejamos que el fuego haga menos ruido que el producto. Aquí se viene a compartir sin ceremonia.',
        'We buy nearby, light the fire early and let it speak more softly than the produce. This is a place to share without ceremony.',
      ),
      text(
        'Ocho mesas, una sala y un equipo que confirma cada solicitud por correo. Ese gesto sencillo es exactamente el plan Básico.',
        'Eight tables, one room and a team that confirms every request by email. That simple gesture is exactly the Basic plan.',
      ),
    ],
    badge: text('Producto de temporada', 'Seasonal produce'),
  },
  visit: {
    eyebrow: text('Ven con tiempo', 'Come with time'),
    title: text('Una esquina ficticia de Valencia.', 'A fictional corner of Valencia.'),
    hours: text('Horarios', 'Opening hours'),
    address: text('Dónde estamos', 'Where to find us'),
    mapLabel: text('Mapa ilustrado de la ubicación ficticia de Brasca', 'Illustrated map of Brasca’s fictional location'),
    mapCaption: text('A siete minutos a pie del Mercado Central', 'Seven minutes on foot from the Central Market'),
  },
  form: {
    eyebrow: text('Plan Básico · solicitud por email', 'Basic plan · email request'),
    intro: text(
      'Elige una fecha y deja tus datos. En un negocio real el restaurante recibiría un correo y te respondería personalmente.',
      'Choose a date and leave your details. In a real venue the restaurant would receive an email and reply personally.',
    ),
    lunch: text('Comida', 'Lunch'),
    dinner: text('Cena', 'Dinner'),
    success: text(
      'Tu solicitud llegaría por email al restaurante — sin gestor en este nivel. Demostración ficticia: no se ha enviado ni guardado ningún dato.',
      'Your request would reach the restaurant by email — there is no manager at this level. Fictional demo: no data was sent or stored.',
    ),
    nextLevel: text('¿Necesitas confirmación en tiempo real? Descubre el nivel Gestión en Vedra.', 'Need real-time confirmation? Explore the Manage level in Vedra.'),
  },
  footer: {
    level: text('Brasca demuestra el plan Básico de Logic Reserva.', 'Brasca demonstrates the Logic Reserva Basic plan.'),
    back: text('Volver a Logic Reserva', 'Back to Logic Reserva'),
    language: text('English', 'Español'),
  },
} as const;

export const VEDRA_PAGE_COPY = {
  header: {
    manager: text('Abrir gestor', 'Open manager'),
    language: text('English', 'Español'),
  },
  intro: {
    eyebrow: text('Tres espacios · una sola hospitalidad', 'Three spaces · one hospitality'),
    title: text('La mesa adecuada antes de confirmar.', 'The right table before confirming.'),
    body: text(
      'Sala, galería y terraza comparten disponibilidad. Para grupos, Vedra combina mesas y propone un menú sin sacar al cliente de la web.',
      'Dining room, gallery and terrace share availability. For groups, Vedra combines tables and offers a menu without taking guests away from the website.',
    ),
    spaces: [
      { id: 'vedra-sala', label: text('Sala principal', 'Main dining room'), description: text('Ocho mesas junto a la cocina abierta.', 'Eight tables beside the open kitchen.') },
      { id: 'vedra-galeria', label: text('Galería', 'Gallery'), description: text('Seis mesas, luz natural y sobremesa larga.', 'Six tables, natural light and long lunches.') },
      { id: 'vedra-terraza', label: text('Terraza', 'Terrace'), description: text('Cuatro mesas protegidas por vegetación.', 'Four tables sheltered by greenery.') },
    ],
  },
  menus: {
    eyebrow: text('Elige sin cerrar la puerta', 'Choose without closing the door'),
    title: text('Carta, mediodía o mesa de grupo.', 'À la carte, lunch or a group table.'),
    items: [
      { id: 'vedra-carta', label: text('Carta de temporada', 'Seasonal menu'), description: text('Entrantes, arroces, mar y huerta.', 'Starters, rice, sea and garden.') },
      { id: 'vedra-mediodia', label: text('Menú de mediodía', 'Lunch menu'), description: text('Tres pases para días que siguen.', 'Three courses for days that continue.') },
      { id: 'vedra-grupos', label: text('Menú grupos', 'Group menu'), description: text('Aperitivos al centro y principal a elegir.', 'Shared starters and a choice of main.') },
    ],
    perPerson: text('por persona', 'per person'),
  },
  widget: {
    eyebrow: text('Reserva directa · demo funcional', 'Direct booking · functional demo'),
    title: text('Encuentra una mesa en Vedra.', 'Find a table at Vedra.'),
    body: text('La disponibilidad se calcula sobre mesas reales y franjas de 15 minutos.', 'Availability is calculated from real tables in 15-minute slots.'),
    demo: text('Demostración ficticia · No se realizará ninguna reserva ni cobro real', 'Fictional demonstration · No real booking or charge will be made'),
    steps: [text('Fecha y grupo', 'Date and party'), text('Hora', 'Time'), text('Menú', 'Menu'), text('Tus datos', 'Your details')],
    date: text('Fecha', 'Date'),
    service: text('Servicio', 'Service'),
    lunch: text('Comida', 'Lunch'),
    dinner: text('Cena', 'Dinner'),
    partySize: text('Personas', 'Guests'),
    table: text('mesa', 'table'),
    tables: text('mesas', 'tables'),
    chooseTime: text('Elige una hora disponible', 'Choose an available time'),
    noAvailability: text('No queda una combinación de mesas para este grupo. Prueba otro servicio o tamaño.', 'No table combination remains for this party. Try another service or party size.'),
    chooseMenu: text('Añade un menú si quieres', 'Add a menu if you wish'),
    noMenu: text('Sin menú cerrado', 'No fixed menu'),
    optional: text('Opcional', 'Optional'),
    name: text('Nombre de la reserva', 'Booking name'),
    email: text('Correo de confirmación', 'Confirmation email'),
    phone: text('Teléfono (opcional)', 'Phone (optional)'),
    previous: text('Atrás', 'Back'),
    next: text('Continuar', 'Continue'),
    confirm: text('Confirmar reserva demo', 'Confirm demo booking'),
    successTitle: text('Mesa confirmada en esta demo.', 'Table confirmed in this demo.'),
    successBody: text('La reserva se ha guardado solo en este navegador y ya aparece en el gestor.', 'The booking was saved only in this browser and now appears in the manager.'),
    openManager: text('Abrir la reserva en el gestor', 'Open the booking in the manager'),
    startAgain: text('Hacer otra reserva', 'Make another booking'),
    invalid: text('Completa los campos obligatorios antes de continuar.', 'Complete the required fields before continuing.'),
  },
  footer: {
    level: text('Vedra demuestra el nivel Gestión de Logic Reserva.', 'Vedra demonstrates the Logic Reserva Manage level.'),
    back: text('Volver a Logic Reserva', 'Back to Logic Reserva'),
  },
} as const;

export const SOLANE_PAGE_COPY = {
  header: {
    events: text('Eventos', 'Events'),
    vouchers: text('Bonos', 'Vouchers'),
    manager: text('Abrir gestor', 'Open manager'),
    language: text('English', 'Español'),
  },
  intro: {
    eyebrow: text('Una secuencia, dos maneras de vivirla', 'One sequence, two ways to experience it'),
    title: text('La noche se diseña alrededor de cada mesa.', 'The evening is designed around every table.'),
    body: text(
      'Solane combina menú degustación, secuencia vegetal y cenas de aforo limitado sobre el mismo inventario de sala.',
      'Solane combines a tasting menu, a plant-led sequence and limited-seat dinners over the same dining-room inventory.',
    ),
    menus: [
      { id: 'solane-degustacion', label: text('Menú Solane', 'Solane menu'), description: text('Cinco momentos entre huerta, mar y fuego.', 'Five moments across garden, sea and fire.') },
      { id: 'solane-vegetal', label: text('Secuencia vegetal', 'Plant-led sequence'), description: text('Bosque, brasa y temporada sin atajos.', 'Forest, fire and season without shortcuts.') },
    ],
    perPerson: text('por persona', 'per guest'),
  },
  eventTeaser: {
    eyebrow: text('Cenas de aforo limitado', 'Limited-seat dinners'),
    title: text('Hay noches que necesitan otro ritmo.', 'Some evenings need a different rhythm.'),
    body: text('Los eventos ocupan mesas reales. Cuando se publican, esas mesas dejan de estar disponibles para una reserva normal.', 'Events occupy real tables. Once published, those tables stop being available for a regular booking.'),
    action: text('Ver eventos y plazas', 'View events and seats'),
    voucherAction: text('Regalar una experiencia', 'Gift an experience'),
  },
  private: {
    eyebrow: text('Un espacio sin interrupciones', 'A space without interruptions'),
    title: text('El privado guarda su propio tempo.', 'The private room keeps its own tempo.'),
    body: text('Cuatro mesas, propuesta a medida y una sala que se incorporará al mismo inventario cuando la privatización quede confirmada.', 'Four tables, a tailored proposal and a room that will join the same inventory once the private hire is confirmed.'),
  },
  widget: {
    eyebrow: text('Reserva directa · inventario conectado', 'Direct booking · connected inventory'),
    title: text('Reserva tu experiencia Solane.', 'Book your Solane experience.'),
    body: text('Cada hora consulta reservas y eventos publicados antes de ofrecer una mesa.', 'Every time checks bookings and published events before offering a table.'),
    demo: text('Demostración ficticia · Sin reservas ni cobros reales', 'Fictional demonstration · No real bookings or charges'),
    steps: [text('Fecha y grupo', 'Date and party'), text('Hora', 'Time'), text('Experiencia', 'Experience'), text('Tus datos', 'Your details')],
    date: text('Fecha', 'Date'),
    time: text('Hora', 'Time'),
    partySize: text('Comensales', 'Guests'),
    chooseTime: text('Elige una hora disponible', 'Choose an available time'),
    freeTables: text('mesas libres', 'free tables'),
    noAvailability: text('No queda una mesa compatible para esta franja. Los eventos publicados también consumen sala.', 'No compatible table remains for this time. Published events also consume the dining room.'),
    chooseMenu: text('Elige la experiencia', 'Choose the experience'),
    perPerson: text('por persona', 'per guest'),
    name: text('Nombre de la reserva', 'Booking name'),
    email: text('Correo de confirmación', 'Confirmation email'),
    phone: text('Teléfono (opcional)', 'Phone (optional)'),
    deposit: {
      eyebrow: text('Protección anti no-show', 'No-show protection'),
      title: text('Depósito proporcional al menú', 'Deposit proportional to the menu'),
      risk: text('Riesgo calculado', 'Calculated risk'),
      tier: {
        low: text('Bajo', 'Low'),
        medium: text('Medio', 'Medium'),
        high: text('Alto', 'High'),
      },
      signalParty: text('Tamaño del grupo', 'Party size'),
      signalPeak: text('Viernes noche', 'Friday night'),
      signalHistory: text('Primera visita', 'First visit'),
      policy: text('Política demo', 'Demo policy'),
      policyNone: text('Sin depósito', 'No deposit'),
      policyHold: text('Huella bancaria simulada', 'Simulated card hold'),
      policyPrepay: text('Prepago simulado', 'Simulated prepayment'),
      subtotal: text('Menú · grupo completo', 'Menu · full party'),
      percentage: text('Porcentaje proporcional', 'Proportional percentage'),
      amount: text('Depósito demo', 'Demo deposit'),
      terms: text('He leído y acepto antes de reservar que, en caso de no presentación, el restaurante podrá aplicar este depósito proporcional al perjuicio indicado.', 'Before booking, I have read and accept that in the event of a no-show, the restaurant may apply this deposit in proportion to the stated loss.'),
      acceptedAt: text('Condiciones aceptadas', 'Terms accepted'),
      required: text('Acepta las condiciones informadas para continuar.', 'Accept the disclosed terms to continue.'),
      gatewayTitle: text('Pasarela neutra · demo — no se realizará ningún cobro', 'Neutral payment gateway · demo — no charge will be made'),
      gatewayBody: text('No pedimos tarjeta. Esta pantalla solo demuestra el paso operativo y guardará una retención ficticia en tu navegador.', 'We do not ask for card details. This screen only demonstrates the operational step and stores a fictional hold in your browser.'),
      gatewayAmount: text('Importe simulado', 'Simulated amount'),
      gatewayConfirm: text('Simular depósito y confirmar', 'Simulate deposit and confirm'),
      gatewayCancel: text('Volver sin confirmar', 'Go back without confirming'),
      held: text('Depósito retenido solo en esta demo', 'Deposit held only in this demo'),
    },
    previous: text('Atrás', 'Back'),
    next: text('Continuar', 'Continue'),
    confirm: text('Confirmar experiencia demo', 'Confirm demo experience'),
    successTitle: text('Experiencia confirmada en esta demo.', 'Experience confirmed in this demo.'),
    successBody: text('La reserva se guarda únicamente en este navegador y comparte inventario con los eventos.', 'The booking is stored only in this browser and shares inventory with events.'),
    openManager: text('Abrir en el gestor', 'Open in the manager'),
    startAgain: text('Hacer otra reserva', 'Make another booking'),
    invalid: text('Completa la selección y los campos obligatorios.', 'Complete the selection and required fields.'),
  },
  tickets: {
    eyebrow: text('Agenda Solane · demo funcional', 'Solane calendar · functional demo'),
    title: text('Cenas con plazas contadas.', 'Dinners with limited seats.'),
    body: text('La compra es una simulación local. No se solicitarán datos de pago ni se realizará ningún cobro.', 'The purchase is a local simulation. No payment details are requested and no charge is made.'),
    back: text('Volver a Solane', 'Back to Solane'),
    manager: text('Gestionar eventos', 'Manage events'),
    date: text('Fecha', 'Date'),
    time: text('Hora', 'Time'),
    price: text('Precio', 'Price'),
    remaining: text('plazas restantes', 'seats remaining'),
    tables: text('Mesas reservadas', 'Reserved tables'),
    seats: text('Plazas', 'Seats'),
    buy: text('Confirmar plazas demo', 'Confirm demo seats'),
    draft: text('Próximamente · aún no publicado', 'Coming soon · not published yet'),
    soldout: text('Aforo completo', 'Sold out'),
    success: text('Plazas guardadas en esta demo. No se ha realizado ningún cobro.', 'Seats saved in this demo. No charge was made.'),
    empty: text('Todavía no hay eventos en la agenda.', 'There are no events in the calendar yet.'),
  },
  vouchers: {
    eyebrow: text('Bonos Solane · demo funcional', 'Solane vouchers · functional demo'),
    title: text('Regala la experiencia antes de elegir la noche.', 'Gift the experience before choosing the night.'),
    body: text('La emisión se guarda solo en este navegador. No se solicita tarjeta, no existe cobro, correo, factura ni validez económica real.', 'Issuance is stored only in this browser. No card is requested and there is no charge, email, invoice or real economic value.'),
    back: text('Volver a Solane', 'Back to Solane'),
    manager: text('Gestionar bonos', 'Manage vouchers'),
    choose: text('Elige la experiencia', 'Choose the experience'),
    quantity: text('Personas', 'Guests'),
    recipient: text('Nombre de quien lo recibe', 'Recipient name'),
    recipientPlaceholder: text('Nombre de demostración', 'Demo name'),
    perPerson: text('por persona', 'per guest'),
    total: text('Valor ficticio total', 'Total fictional value'),
    prepare: text('Preparar bono demo', 'Prepare demo voucher'),
    gatewayTitle: text('Emisión local · demo — no se realizará ningún cobro', 'Local issuance · demo — no charge will be made'),
    gatewayBody: text('Este paso crea un código únicamente en localStorage para enseñar el recorrido operativo. No pedimos datos de pago ni enviamos nada.', 'This step creates a code only in localStorage to demonstrate the operational journey. We request no payment details and send nothing.'),
    issue: text('Emitir bono ficticio', 'Issue fictional voucher'),
    cancel: text('Volver', 'Go back'),
    successTitle: text('Bono emitido en esta demo.', 'Voucher issued in this demo.'),
    successBody: text('El código ya aparece en el gestor de Solane. Solo existe en este navegador y no tiene validez económica.', 'The code now appears in the Solane manager. It exists only in this browser and has no economic value.'),
    code: text('Código demo', 'Demo code'),
    expires: text('Caduca', 'Expires'),
    openManager: text('Abrir bonos en el gestor', 'Open vouchers in the manager'),
    startAgain: text('Emitir otro bono', 'Issue another voucher'),
    invalid: text('Elige una experiencia y completa el nombre.', 'Choose an experience and complete the name.'),
  },
  footer: {
    level: text('Solane demuestra el nivel Inteligente de Logic Reserva.', 'Solane demonstrates the Logic Reserva Intelligent tier.'),
    back: text('Volver a Logic Reserva', 'Back to Logic Reserva'),
  },
} as const;

export interface MenuItem {
  id: string;
  category: BilingualText;
  name: BilingualText;
  description: BilingualText;
  priceCents: number;
}

export interface DemoFixture {
  slug: DemoSlug;
  level: PlanLevel;
  restaurant: Restaurant;
  menuItems: readonly MenuItem[];
  bookings: TableBooking[];
  events: RestaurantEvent[];
  privateHires: PrivateHire[];
  customers: CustomerProfile[];
  address: BilingualText;
  hours: readonly BilingualText[];
  hero: {
    imageBase: string;
    alt: BilingualText;
    mark: string;
  };
}

const brasca: DemoFixture = {
  slug: 'brasca',
  level: 'basico',
  restaurant: {
    id: 'brasca',
    organizationId: 'logic-reserva-demo',
    name: 'Brasca',
    spaces: [{ id: 'brasca-sala', name: 'Sala', privatizable: false, tables: lineTables('b', 8, 1, 4) }],
    menus: [
      {
        id: 'brasca-carta',
        name: 'Carta Brasca',
        pricePerPersonCents: 3600,
        courses: ['Tomate a la brasa', 'Arroz de costilla', 'Tarta tibia de almendra'],
        bookableOnline: false,
      },
    ],
    shifts: [
      { id: 'brasca-lunch', kind: 'lunch', firstSeatingMin: 780, lastSeatingMin: 930 },
      { id: 'brasca-dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1350 },
    ],
  },
  menuItems: [
    { id: 'pan-brasa', category: text('Para empezar', 'To begin'), name: text('Pan de masa madre a la brasa', 'Fire-toasted sourdough'), description: text('Mantequilla ahumada y sal de romero', 'Smoked butter and rosemary salt'), priceCents: 650 },
    { id: 'tomate', category: text('Para empezar', 'To begin'), name: text('Tomate valenciano', 'Valencian tomato'), description: text('Brasa, jugo de aceituna y albahaca', 'Fire, olive jus and basil'), priceCents: 1300 },
    { id: 'croqueta', category: text('Para empezar', 'To begin'), name: text('Croqueta de pollo rustido', 'Roast chicken croquette'), description: text('Una unidad, recién hecha', 'One piece, made to order'), priceCents: 350 },
    { id: 'arroz', category: text('Del fuego', 'From the fire'), name: text('Arroz seco de costilla', 'Dry rice with pork rib'), description: text('Verduras de temporada y romero', 'Seasonal vegetables and rosemary'), priceCents: 2200 },
    { id: 'pescado', category: text('Del fuego', 'From the fire'), name: text('Pescado de lonja', 'Market fish'), description: text('Hinojo, limón asado y fondo corto', 'Fennel, roasted lemon and light jus'), priceCents: 2400 },
    { id: 'tarta', category: text('Algo dulce', 'Something sweet'), name: text('Tarta tibia de almendra', 'Warm almond tart'), description: text('Helado de leche tostada', 'Toasted milk ice cream'), priceCents: 850 },
  ],
  bookings: [],
  events: [],
  privateHires: [],
  customers: [],
  address: text('Carrer de la Brasa, 12 · Valencia', '12 Carrer de la Brasa · Valencia'),
  hours: [text('Martes–sábado · 13:00–16:00', 'Tuesday–Saturday · 13:00–16:00'), text('Jueves–sábado · 20:00–23:30', 'Thursday–Saturday · 20:00–23:30')],
  hero: {
    imageBase: '/images/heroes/brasca-v2',
    alt: text('Mesa cálida de Brasca junto al horno de leña', 'Warm Brasca table beside the wood-fired oven'),
    mark: 'B',
  },
};

const vedraBookings: TableBooking[] = [
  { id: 'vedra-fixture-1', restaurantId: 'vedra', tableIds: ['vs1'], slot: { date: DEMO_DATE, startMin: 780, durationMin: 105 }, partySize: 2, status: 'confirmed', guest: { name: 'Clara Montes' }, menuId: 'vedra-mediodia', source: 'fixture' },
  { id: 'vedra-fixture-2', restaurantId: 'vedra', tableIds: ['vt1'], slot: { date: DEMO_DATE, startMin: 810, durationMin: 90 }, partySize: 2, status: 'seated', guest: { name: 'Diego Ruiz' }, source: 'walkin' },
  { id: 'vedra-fixture-3', restaurantId: 'vedra', tableIds: ['vg1'], slot: { date: DEMO_DATE, startMin: 1230, durationMin: 105 }, partySize: 4, status: 'pending', guest: { name: 'Inés Soler' }, menuId: 'vedra-carta', source: 'phone' },
];

const vedra: DemoFixture = {
  slug: 'vedra',
  level: 'gestion',
  restaurant: {
    id: 'vedra',
    organizationId: 'logic-reserva-demo',
    name: 'Vedra',
    spaces: [
      { id: 'vedra-sala', name: 'Sala principal', privatizable: true, tables: lineTables('vs', 8, 1, 4) },
      { id: 'vedra-galeria', name: 'Galería', privatizable: true, tables: lineTables('vg', 6, 1, 4) },
      { id: 'vedra-terraza', name: 'Terraza', privatizable: false, tables: lineTables('vt', 4, 1, 4) },
    ],
    menus: [
      { id: 'vedra-carta', name: 'Carta de temporada', pricePerPersonCents: 4800, courses: ['Entrantes', 'Arroces', 'Mar y huerta'], bookableOnline: true },
      { id: 'vedra-mediodia', name: 'Menú de mediodía', pricePerPersonCents: 3200, courses: ['Entrante', 'Principal', 'Postre'], bookableOnline: true },
      { id: 'vedra-grupos', name: 'Menú grupos', pricePerPersonCents: 5900, courses: ['Aperitivos al centro', 'Principal a elegir', 'Postres'], bookableOnline: true },
    ],
    shifts: [
      { id: 'vedra-lunch', kind: 'lunch', firstSeatingMin: 780, lastSeatingMin: 930 },
      { id: 'vedra-dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1350 },
    ],
  },
  menuItems: [],
  bookings: vedraBookings,
  events: [],
  privateHires: [],
  customers: [],
  address: text('Calle de la Hiedra, 8 · Madrid', '8 Calle de la Hiedra · Madrid'),
  hours: [text('Lunes–domingo · 13:00–16:30', 'Monday–Sunday · 13:00–16:30'), text('Lunes–sábado · 20:00–00:00', 'Monday–Saturday · 20:00–00:00')],
  hero: {
    imageBase: '/images/heroes/vedra-v2',
    alt: text('Galería verde y luminosa del restaurante Vedra', 'Green, light-filled gallery at Vedra restaurant'),
    mark: 'V',
  },
};

const solaneBookings: TableBooking[] = [
  { id: 'sol-history-lucia-1', restaurantId: 'solane', tableIds: ['ss3'], slot: { date: '2026-06-12', startMin: 1200, durationMin: 120 }, partySize: 2, status: 'finished', guest: { name: 'Lucía Serra', email: 'lucia@example.test' }, menuId: 'solane-degustacion', source: 'widget' },
  { id: 'sol-history-lucia-2', restaurantId: 'solane', tableIds: ['ss4'], slot: { date: '2026-07-24', startMin: 1215, durationMin: 120 }, partySize: 3, status: 'finished', guest: { name: 'Lucía Serra', email: 'lucia@example.test' }, menuId: 'solane-vegetal', source: 'phone' },
  { id: 'sol-r1', restaurantId: 'solane', tableIds: ['ss1'], slot: { date: DEMO_DATE, startMin: 1200, durationMin: 105 }, partySize: 2, status: 'confirmed', guest: { name: 'Lucía Serra', email: 'lucia@example.test' }, menuId: 'solane-degustacion', source: 'fixture' },
  { id: 'sol-r2', restaurantId: 'solane', tableIds: ['ss2'], slot: { date: DEMO_DATE, startMin: 1215, durationMin: 105 }, partySize: 4, status: 'pending', guest: { name: 'Marc Vidal', phone: '+34 600 000 002' }, menuId: 'solane-degustacion', source: 'phone' },
  { id: 'sol-r3', restaurantId: 'solane', tableIds: ['ss3'], slot: { date: DEMO_DATE, startMin: 1170, durationMin: 120 }, partySize: 3, status: 'seated', guest: { name: 'Elena Puig' }, menuId: 'solane-degustacion', source: 'walkin' },
  { id: 'sol-r4', restaurantId: 'solane', tableIds: ['ss4'], slot: { date: DEMO_DATE, startMin: 1050, durationMin: 105 }, partySize: 2, status: 'finished', guest: { name: 'Hugo Martín' }, menuId: 'solane-degustacion', source: 'fixture' },
  { id: 'sol-r5', restaurantId: 'solane', tableIds: ['ss5'], slot: { date: DEMO_DATE, startMin: 1200, durationMin: 105 }, partySize: 2, status: 'no_show', guest: { name: 'Nora Costa' }, menuId: 'solane-degustacion', source: 'widget' },
  { id: 'sol-r6', restaurantId: 'solane', tableIds: ['ss6'], slot: { date: DEMO_DATE, startMin: 1260, durationMin: 90 }, partySize: 2, status: 'cancelled', guest: { name: 'Àlex Rius' }, source: 'widget' },
];

const solane: DemoFixture = {
  slug: 'solane',
  level: 'inteligente',
  restaurant: {
    id: 'solane',
    organizationId: 'logic-reserva-demo',
    name: 'Solane',
    spaces: [
      { id: 'solane-sala', name: 'Sala', privatizable: false, tables: lineTables('ss', 8, 1, 4) },
      { id: 'solane-privado', name: 'Privado', privatizable: true, tables: lineTables('sp', 4, 2, 6) },
    ],
    menus: [
      { id: 'solane-degustacion', name: 'Menú Solane', pricePerPersonCents: 12500, courses: ['Umbral', 'Huerta', 'Mar', 'Fuego', 'Sobremesa'], bookableOnline: true },
      { id: 'solane-vegetal', name: 'Secuencia vegetal', pricePerPersonCents: 11500, courses: ['Umbral', 'Huerta', 'Bosque', 'Brasa', 'Sobremesa'], bookableOnline: true },
    ],
    shifts: [{ id: 'solane-dinner', kind: 'dinner', firstSeatingMin: 1170, lastSeatingMin: 1305 }],
  },
  menuItems: [],
  bookings: solaneBookings,
  events: [
    {
      id: 'solane-maridaje',
      restaurantId: 'solane',
      name: 'Cena maridaje',
      slot: { date: DEMO_DATE, startMin: 1260, durationMin: 180 },
      capacity: 8,
      priceCents: 16500,
      soldSeats: 0,
      consumesTableIds: ['ss7', 'ss8'],
      status: 'draft',
    },
  ],
  privateHires: [
    {
      id: 'solane-hire-1',
      restaurantId: 'solane',
      spaceId: 'solane-privado',
      slot: { date: DEMO_DATE, startMin: 1200, durationMin: 240 },
      status: 'requested',
    },
  ],
  customers: [
    {
      id: 'solane-customer-lucia',
      restaurantId: 'solane',
      guest: { name: 'Lucía Serra', email: 'lucia@example.test' },
      allergies: ['Avellana'],
      floorNotes: 'Prefiere mesa tranquila y agua sin gas. Celebró aquí su aniversario.',
    },
    {
      id: 'solane-customer-marc',
      restaurantId: 'solane',
      guest: { name: 'Marc Vidal', phone: '+34 600 000 002' },
      allergies: [],
      floorNotes: 'Confirmar por teléfono y evitar mesa junto a la entrada.',
    },
    {
      id: 'solane-customer-elena',
      restaurantId: 'solane',
      guest: { name: 'Elena Puig' },
      allergies: ['Marisco'],
      floorNotes: 'Menú adaptado comunicado a cocina.',
    },
  ],
  address: text('Passatge de la Llum, 4 · Barcelona', '4 Passatge de la Llum · Barcelona'),
  hours: [text('Martes–sábado · 19:30–00:30', 'Tuesday–Saturday · 19:30–00:30')],
  hero: {
    imageBase: '/images/heroes/solane-v2',
    alt: text('Sala nocturna de Solane preparada para el menú degustación', 'Solane dining room at night, set for the tasting menu'),
    mark: 'S',
  },
};

export const DEMO_FIXTURES = { brasca, vedra, solane } satisfies Record<DemoSlug, DemoFixture>;

export const getDemoFixture = (slug: DemoSlug): DemoFixture => DEMO_FIXTURES[slug];
export const localized = (value: BilingualText, locale: Locale): string => value[locale];
