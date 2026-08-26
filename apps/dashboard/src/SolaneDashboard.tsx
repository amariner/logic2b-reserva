import {
  BarChart3,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gift,
  ListChecks,
  MapPinned,
  RotateCcw,
  ShieldCheck,
  TableProperties,
  TicketCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { canOperate, type CustomerProfile, type PrivateHire, type PrivateHireProposal, type Restaurant, type RestaurantEvent, type RestaurantRole, type TableBooking, type TimeSlot } from '@logic-reserva/domain';
import type { DashboardLocale } from './content';
import {
  SOLANE_STORAGE_KEY,
  addSolaneWaitlistEntry,
  blockSolanePrivateHire,
  createSolaneEvent,
  initialSolaneState,
  parseSolaneStored,
  publishSolaneEvent,
  prepareSolanePrivateHire,
  prepareSolaneAttendanceConfirmation,
  registerSolanePrivateHireDeposit,
  redeemSolaneVoucher,
  resetSolanePrivateHireTour,
  resolveSolaneBookingDeposit,
  seatSolaneWaitlistEntry,
  serializeSolaneState,
  setSolaneRole,
  startSolanePrivateHireTour,
  transitionSolaneWaitlistEntry,
  type SolaneDemoState,
} from './solane-state';
import ReportsView from './views/ReportsView';
import SolaneCustomersView from './views/SolaneCustomersView';
import WaitlistView from './views/WaitlistView';
import MobileDashboardNav from './MobileDashboardNav';

interface SolaneDashboardProps {
  slug: 'solane';
  locale?: DashboardLocale;
  restaurant: Restaurant;
  initialBookings: TableBooking[];
  initialEvents: RestaurantEvent[];
  initialPrivateHires: PrivateHire[];
  initialCustomers: CustomerProfile[];
}

type SolaneView = 'servicio' | 'plano' | 'reservas' | 'espera' | 'eventos' | 'bonos' | 'privatizaciones' | 'clientes' | 'informes';
type CopyText = { readonly es: string; readonly en: string };

const text = (es: string, en: string): CopyText => ({ es, en });
const NAV = [
  { id: 'servicio', label: text('Servicio', 'Service'), icon: TableProperties },
  { id: 'plano', label: text('Plano', 'Floor plan'), icon: MapPinned },
  { id: 'reservas', label: text('Reservas', 'Bookings'), icon: ListChecks },
  { id: 'espera', label: text('Espera', 'Waitlist'), icon: BellRing },
  { id: 'eventos', label: text('Eventos', 'Events'), icon: TicketCheck },
  { id: 'bonos', label: text('Bonos', 'Vouchers'), icon: Gift },
  { id: 'privatizaciones', label: text('Privatizaciones', 'Private hire'), icon: Building2 },
  { id: 'clientes', label: text('Clientes', 'Guests'), icon: UserRound },
  { id: 'informes', label: text('Informes', 'Reports'), icon: BarChart3 },
] as const satisfies readonly { id: SolaneView; label: CopyText; icon: typeof TableProperties }[];
const MOBILE_PRIMARY_VIEWS = ['servicio', 'reservas', 'espera', 'plano'] as const satisfies readonly SolaneView[];

const COPY = {
  product: text('Logic Reserva · Inteligente', 'Logic Reserva · Intelligent'),
  fictional: text('Demostración ficticia · El inventario se comparte con la web en este navegador', 'Fictional demonstration · Inventory is shared with the website in this browser'),
  back: text('Volver a la web', 'Back to website'),
  reset: text('Restablecer demo', 'Reset demo'),
  resetDone: text('Demo restablecida con los datos iniciales.', 'Demo reset to its initial data.'),
  date: text('Fecha', 'Date'),
  time: text('Hora', 'Time'),
  tables: text('Mesas', 'Tables'),
  people: text('personas', 'guests'),
  free: text('Libre', 'Free'),
  occupied: text('Reserva', 'Booking'),
  event: text('Evento', 'Event'),
  private: text('Privatizado', 'Private hire'),
  role: {
    label: text('Rol de la demo', 'Demo role'),
    direction: text('Dirección', 'Management'),
    floor: text('Sala', 'Floor'),
    kitchen: text('Cocina', 'Kitchen'),
    changed: text('Rol cambiado. Los permisos visibles se han actualizado.', 'Role changed. Visible permissions have been updated.'),
    readOnly: text('Tu rol actual puede consultar esta información, pero no ejecutar esta acción.', 'Your current role can view this information but cannot perform this action.'),
    kitchenWarning: text('Cocina está en modo lectura: no puede sentar reservas ni aplicar depósitos.', 'Kitchen is read-only: it cannot seat bookings or apply deposits.'),
  },
  service: {
    eyebrow: text('Servicio inteligente', 'Intelligent service'),
    title: text('Una sala, un solo inventario.', 'One room, one inventory.'),
    body: text('Reservas y eventos publicados comparten el mismo plano. Cada bloqueo aparece aquí y desaparece de la disponibilidad online.', 'Bookings and published events share the same floor plan. Every block appears here and disappears from online availability.'),
    bookings: text('reservas activas', 'active bookings'),
    events: text('eventos publicados', 'published events'),
    empty: text('No hay ocupaciones activas para esta fecha.', 'There are no active occupancies for this date.'),
  },
  floor: {
    eyebrow: text('Plano operativo', 'Live floor plan'),
    title: text('El evento también ocupa mesa.', 'Events occupy tables too.'),
    body: text('Cambia fecha y hora para ver el estado que consume el motor de disponibilidad. El rojo identifica inventario reservado por un evento publicado.', 'Change date and time to see the state consumed by the availability engine. Red identifies inventory reserved by a published event.'),
    legend: text('Estado en la franja seleccionada', 'State in the selected slot'),
  },
  reservations: {
    eyebrow: text('Libro de reservas', 'Booking book'),
    title: text('La demanda, con su origen.', 'Demand, with its source.'),
    body: text('Las reservas del widget aterrizan con su asignación, depósito calculado por la regla demo y aceptación temporal de condiciones.', 'Widget bookings land with their assignment, a deposit calculated by the demo rule and timestamped acceptance of terms.'),
    guest: text('Reserva', 'Booking'),
    assignment: text('Asignación', 'Assignment'),
    status: text('Estado', 'Status'),
    empty: text('Todavía no hay reservas.', 'There are no bookings yet.'),
    legalTitle: text('Regla ficticia informada antes de reservar', 'Fictional rule disclosed before booking'),
    legalBody: text('La demo aplica 0 %, 25 % o 50 % sobre el total del menú para escenificar el recorrido y conserva la aceptación con fecha. No existe ningún cobro real; política, importe, aplicación y validez deben validarse por proyecto antes de activarlos.', 'The demo applies 0%, 25% or 50% to the menu total to illustrate the journey and keeps timestamped acceptance. No real charge exists; policy, amount, application and validity must be validated per project before activation.'),
    deposit: text('Depósito anti no-show', 'No-show deposit'),
    subtotal: text('Menú · grupo', 'Menu · party'),
    percentage: text('Porcentaje', 'Percentage'),
    amount: text('Importe máximo', 'Maximum amount'),
    termsAccepted: text('Condiciones aceptadas', 'Terms accepted'),
    held: text('Retenido · demo', 'Held · demo'),
    charged: text('Regla demo aplicada · sin cobro real', 'Demo rule applied · no real charge'),
    released: text('Depósito liberado automáticamente', 'Deposit released automatically'),
    markNoShow: text('Marcar no-show y simular aplicación', 'Mark no-show and simulate application'),
    seat: text('Sentar y liberar depósito', 'Seat and release deposit'),
    chargedNotice: text('No-show registrado en la demo. El depósito ficticio mostrado pasa a aplicado en el estado local; no existe cobro real.', 'No-show recorded in the demo. The displayed fictional deposit is marked as applied in local state; no real charge exists.'),
    releasedNotice: text('Depósito liberado automáticamente al sentar la reserva.', 'Deposit released automatically when the booking was seated.'),
    statusLabels: {
      pending: text('Pendiente', 'Pending'),
      confirmed: text('Confirmada', 'Confirmed'),
      seated: text('Sentada', 'Seated'),
      finished: text('Finalizada', 'Finished'),
      no_show: text('No presentado', 'No-show'),
      cancelled: text('Cancelada', 'Cancelled'),
    },
  },
  events: {
    eyebrow: text('Agenda y ticketing', 'Calendar and ticketing'),
    title: text('Publica una experiencia y bloquea la sala.', 'Publish an experience and block the room.'),
    body: text('Primero se guarda como borrador. Al publicar, el dominio comprueba conflictos y las mesas dejan de ofrecerse en el widget.', 'It is first saved as a draft. On publish, the domain checks conflicts and the tables stop being offered in the widget.'),
    newTitle: text('Nuevo evento', 'New event'),
    name: text('Nombre', 'Name'),
    namePlaceholder: text('Cena de temporada', 'Seasonal dinner'),
    duration: text('Duración (min)', 'Duration (min)'),
    price: text('Precio por plaza (€)', 'Price per seat (€)'),
    capacity: text('Aforo', 'Capacity'),
    selectTables: text('Mesas que consume', 'Tables consumed'),
    selectedCapacity: text('capacidad física seleccionada', 'selected physical capacity'),
    create: text('Guardar borrador', 'Save draft'),
    createDone: text('Evento guardado como borrador. Publícalo para bloquear sus mesas.', 'Event saved as a draft. Publish it to block its tables.'),
    invalid: text('Revisa los campos: el aforo debe caber en las mesas seleccionadas.', 'Check the fields: capacity must fit in the selected tables.'),
    listTitle: text('Agenda de eventos', 'Event calendar'),
    draft: text('Borrador', 'Draft'),
    published: text('Publicado', 'Published'),
    soldout: text('Completo', 'Sold out'),
    done: text('Finalizado', 'Done'),
    publish: text('Publicar y bloquear mesas', 'Publish and block tables'),
    publishDone: text('Evento publicado. Sus mesas ya no están disponibles en la web.', 'Event published. Its tables are no longer available on the website.'),
    conflict: text('No se puede publicar: una reserva u otro evento ya ocupa alguna mesa en esa franja.', 'Cannot publish: a booking or another event already occupies a table in that slot.'),
    remaining: text('plazas restantes', 'seats remaining'),
    sales: text('ventas simuladas', 'simulated sales'),
    publicAgenda: text('Ver agenda pública', 'View public calendar'),
  },
  vouchers: {
    eyebrow: text('Bonos de experiencia', 'Experience vouchers'),
    title: text('Caja anticipada, canje bajo control.', 'Advance revenue, controlled redemption.'),
    body: text('Los bonos emitidos en la web llegan con valor auditable y código único. Todo es local y ficticio: no existe cobro, factura ni validez económica.', 'Vouchers issued on the website arrive with an auditable value and unique code. Everything is local and fictional: there is no charge, invoice or economic value.'),
    publicPage: text('Emitir bono demo', 'Issue demo voucher'),
    activeValue: text('Valor ficticio activo', 'Active fictional value'),
    issuedCount: text('Pendientes de canje', 'Awaiting redemption'),
    redeemedCount: text('Canjeados', 'Redeemed'),
    empty: text('Todavía no hay bonos emitidos desde la web demo.', 'No vouchers have been issued from the demo website yet.'),
    code: text('Código', 'Code'),
    recipient: text('Destinatario', 'Recipient'),
    experience: text('Experiencia', 'Experience'),
    value: text('Valor', 'Value'),
    issuedAt: text('Emitido', 'Issued'),
    expiresOn: text('Caduca', 'Expires'),
    issued: text('Emitido · pendiente', 'Issued · pending'),
    redeemed: text('Canjeado', 'Redeemed'),
    voided: text('Anulado', 'Voided'),
    redeem: text('Canjear bono en esta demo', 'Redeem voucher in this demo'),
    redeemDone: text('Bono canjeado. El código queda cerrado y no puede utilizarse de nuevo.', 'Voucher redeemed. The code is now closed and cannot be used again.'),
    roleWarning: text('Cocina puede consultar los bonos, pero el canje corresponde a Dirección o Sala.', 'Kitchen can view vouchers, but redemption belongs to Management or Floor.'),
  },
  privateHires: {
    eyebrow: text('Privatizaciones', 'Private hire'),
    title: text('Del interés al bloqueo de sala.', 'From enquiry to a blocked room.'),
    body: text('La propuesta, la señal simulada y el bloqueo viven en el mismo inventario que reservas y eventos.', 'The proposal, simulated deposit and room block live in the same inventory as bookings and events.'),
    chooseTitle: text('¿Cómo quieres recorrer la privatización?', 'How would you like to explore private hire?'),
    chooseBody: text('El modo guiado acompaña los tres momentos comerciales. El modo libre mantiene todas las acciones visibles.', 'Guided mode walks through the three commercial moments. Free mode keeps every action visible.'),
    guided: text('Empezar recorrido guiado', 'Start guided journey'),
    free: text('Explorar libremente', 'Explore freely'),
    tourLabel: text('Recorrido Solane', 'Solane journey'),
    steps: [text('Solicitud', 'Enquiry'), text('Propuesta y señal', 'Proposal and deposit'), text('Bloquear espacio', 'Block space')],
    requestTitle: text('Una noche para quedarse con todo el Privado.', 'An evening with the Private Room all to itself.'),
    requestBody: text('La solicitud todavía no consume mesas. Prepara una propuesta antes de prometer el espacio.', 'The enquiry does not consume tables yet. Prepare a proposal before promising the space.'),
    space: text('Espacio', 'Space'),
    dateTime: text('Fecha y hora', 'Date and time'),
    menu: text('Menú', 'Menu'),
    price: text('Precio por persona (€)', 'Price per person (€)'),
    minimum: text('Mínimo de invitados', 'Minimum guests'),
    deposit: text('Señal (€)', 'Deposit (€)'),
    prepare: text('Preparar propuesta', 'Prepare proposal'),
    proposalDone: text('Propuesta preparada. La sala sigue disponible hasta registrar la señal y confirmar el bloqueo.', 'Proposal prepared. The room remains available until the deposit is recorded and the block is confirmed.'),
    register: text('Registrar señal simulada', 'Record simulated deposit'),
    registerDone: text('Señal simulada registrada. Confirma el bloqueo para retirar el Privado del widget.', 'Simulated deposit recorded. Confirm the block to remove the Private Room from the widget.'),
    block: text('Bloquear Privado en inventario', 'Block Private Room in inventory'),
    blockDone: text('Privado bloqueado. Sus cuatro mesas ya no aparecen en la disponibilidad online.', 'Private Room blocked. Its four tables no longer appear in online availability.'),
    conflict: text('No se puede bloquear: otra ocupación coincide con el espacio y la franja.', 'Cannot block: another occupancy overlaps this room and slot.'),
    requested: text('Solicitud recibida', 'Enquiry received'),
    proposed: text('Propuesta enviada', 'Proposal sent'),
    deposit_paid: text('Señal registrada · demo', 'Deposit recorded · demo'),
    blocked: text('Espacio bloqueado', 'Room blocked'),
    completedTitle: text('Privado confirmado y fuera del widget.', 'Private Room confirmed and removed from the widget.'),
    completedBody: text('El bloqueo se ve en rojo azulado en el plano y consume todas las mesas del espacio durante la franja.', 'The block appears in blue-red on the floor plan and consumes every table in the room for the slot.'),
    openFloor: text('Ver bloqueo en el plano', 'View block on floor plan'),
    restart: text('Reiniciar recorrido', 'Restart journey'),
  },
} as const;

const ACTIVE_BOOKING_STATUSES = new Set(['pending', 'confirmed', 'seated']);
const ACTIVE_EVENT_STATUSES = new Set(['published', 'soldout']);
const local = (value: CopyText, locale: DashboardLocale) => value[locale];
const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const timeValue = (minutes: number) => timeLabel(minutes);
const minutesFromTime = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  return hours * 60 + minutes;
};
const overlaps = (left: TimeSlot, right: TimeSlot) => left.date === right.date
  && left.startMin < right.startMin + right.durationMin
  && right.startMin < left.startMin + left.durationMin;

function parseView(value: string | null): SolaneView {
  return NAV.some((item) => item.id === value) ? value as SolaneView : 'servicio';
}

export default function SolaneDashboard({ locale = 'es', restaurant, initialBookings, initialEvents, initialPrivateHires, initialCustomers }: SolaneDashboardProps) {
  const initialDate = initialEvents[0]?.slot.date
    ?? initialPrivateHires[0]?.slot.date
    ?? [...initialBookings].sort((left, right) => right.slot.date.localeCompare(left.slot.date))[0]?.slot.date
    ?? '2026-09-18';
  const [state, setState] = useState<SolaneDemoState>(() => initialSolaneState(initialBookings, initialEvents, initialPrivateHires));
  const [view, setViewState] = useState<SolaneView>('servicio');
  const [date, setDate] = useState(initialDate);
  const [floorTime, setFloorTime] = useState(1260);
  const [hydrated, setHydrated] = useState(false);
  const initialized = useRef(false);
  const [notice, setNotice] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(initialDate);
  const [eventTime, setEventTime] = useState(1260);
  const [eventDuration, setEventDuration] = useState(180);
  const [eventPrice, setEventPrice] = useState(165);
  const [eventCapacity, setEventCapacity] = useState(8);
  const [eventTableIds, setEventTableIds] = useState<string[]>([]);
  const [proposalMenuId, setProposalMenuId] = useState(restaurant.menus[0]?.id ?? '');
  const [proposalPrice, setProposalPrice] = useState(125);
  const [proposalMinimum, setProposalMinimum] = useState(12);
  const [proposalDeposit, setProposalDeposit] = useState(500);

  const tables = useMemo(() => restaurant.spaces.flatMap((space) => space.tables.map((table) => ({ ...table, space }))), [restaurant]);
  const tableById = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setState(parseSolaneStored(localStorage.getItem(SOLANE_STORAGE_KEY), initialBookings, initialEvents, initialPrivateHires));
      setViewState(parseView(new URL(window.location.href).searchParams.get('vista')));
      setHydrated(true);
    }
    const syncView = () => setViewState(parseView(new URL(window.location.href).searchParams.get('vista')));
    window.addEventListener('popstate', syncView);
    return () => window.removeEventListener('popstate', syncView);
  }, [initialBookings, initialEvents, initialPrivateHires]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(SOLANE_STORAGE_KEY, serializeSolaneState(state));
  }, [hydrated, state]);

  const commit = (next: SolaneDemoState) => {
    localStorage.setItem(SOLANE_STORAGE_KEY, serializeSolaneState(next));
    setState(next);
  };

  const setView = (nextView: SolaneView) => {
    const url = new URL(window.location.href);
    url.searchParams.set('vista', nextView);
    window.history.replaceState({}, '', url);
    setViewState(nextView);
    setNotice('');
  };

  const reset = () => {
    localStorage.removeItem(SOLANE_STORAGE_KEY);
    setState(initialSolaneState(initialBookings, initialEvents, initialPrivateHires));
    setDate(initialDate);
    setFloorTime(1260);
    setNotice(local(COPY.resetDone, locale));
  };

  const toggleEventTable = (tableId: string) => {
    setEventTableIds((current) => current.includes(tableId) ? current.filter((id) => id !== tableId) : [...current, tableId]);
  };

  const createEvent = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const event: RestaurantEvent = {
      id: `solane-event-${Date.now()}`,
      restaurantId: restaurant.id,
      name: eventName.trim(),
      slot: { date: eventDate, startMin: eventTime, durationMin: eventDuration },
      capacity: eventCapacity,
      priceCents: Math.round(eventPrice * 100),
      soldSeats: 0,
      consumesTableIds: eventTableIds,
      status: 'draft',
    };
    const next = createSolaneEvent(state, event, restaurant);
    if (next === state) {
      setNotice(local(COPY.events.invalid, locale));
      return;
    }
    commit(next);
    setEventName('');
    setNotice(local(COPY.events.createDone, locale));
  };

  const publish = (eventId: string) => {
    try {
      const next = publishSolaneEvent(state, eventId, restaurant);
      if (next === state) return;
      commit(next);
      setNotice(local(COPY.events.publishDone, locale));
    } catch {
      setNotice(local(COPY.events.conflict, locale));
    }
  };

  const changeRole = (role: RestaurantRole) => {
    const next = setSolaneRole(state, role);
    if (next !== state) commit(next);
    setNotice(local(COPY.role.changed, locale));
  };

  const resolveDeposit = (bookingId: string, outcome: 'seated' | 'no_show') => {
    const next = resolveSolaneBookingDeposit(state, bookingId, outcome);
    if (next === state) return;
    commit(next);
    setNotice(local(outcome === 'seated' ? COPY.reservations.releasedNotice : COPY.reservations.chargedNotice, locale));
  };

  const preparePrivateHire = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const hire = state.privateHires[0];
    if (hire === undefined) return;
    const proposal: PrivateHireProposal = {
      menuId: proposalMenuId,
      pricePerPersonCents: Math.round(proposalPrice * 100),
      minimumGuests: proposalMinimum,
      depositCents: Math.round(proposalDeposit * 100),
    };
    const next = prepareSolanePrivateHire(state, hire.id, proposal, restaurant);
    if (next === state) {
      setNotice(local(canOperate(state.role, 'manage_private_hires') ? COPY.events.invalid : COPY.role.readOnly, locale));
      return;
    }
    commit(next);
    setNotice(local(COPY.privateHires.proposalDone, locale));
  };

  const registerPrivateHireDeposit = (hireId: string) => {
    const next = registerSolanePrivateHireDeposit(state, hireId);
    if (next === state) return;
    commit(next);
    setNotice(local(COPY.privateHires.registerDone, locale));
  };

  const blockPrivateHire = (hireId: string) => {
    try {
      const next = blockSolanePrivateHire(state, hireId, restaurant);
      if (next === state) return;
      commit(next);
      setNotice(local(COPY.privateHires.blockDone, locale));
    } catch {
      setNotice(local(COPY.privateHires.conflict, locale));
    }
  };

  const restartPrivateHireTour = () => {
    commit(resetSolanePrivateHireTour(state, initialPrivateHires));
    setNotice('');
  };

  const redeemVoucher = (voucherId: string) => {
    const next = redeemSolaneVoucher(state, voucherId, new Date().toISOString());
    if (next === state) return;
    commit(next);
    setNotice(local(COPY.vouchers.redeemDone, locale));
  };

  const prepareAttendance = (bookingId: string) => {
    const preparedAt = new Date();
    const expiresAt = new Date(preparedAt.getTime() + 48 * 60 * 60 * 1000);
    const reference = `solane_${crypto.randomUUID().replaceAll('-', '_')}`;
    const next = prepareSolaneAttendanceConfirmation(state, bookingId, reference, preparedAt.toISOString(), expiresAt.toISOString());
    if (next === state) {
      setNotice(local(COPY.role.readOnly, locale));
      return;
    }
    commit(next);
    setNotice(locale === 'en' ? 'Local confirmation link prepared. Nothing was sent.' : 'Enlace local de confirmación preparado. No se ha enviado nada.');
  };

  const activeBookings = state.bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.has(booking.status));
  const activeEvents = state.events.filter((event) => ACTIVE_EVENT_STATUSES.has(event.status));
  const privateHire = state.privateHires[0];
  const canManageEvents = canOperate(state.role, 'manage_events');
  const canManagePrivateHires = canOperate(state.role, 'manage_private_hires');
  const canManageWaitlist = canOperate(state.role, 'manage_waitlist');
  const canManageVouchers = canOperate(state.role, 'manage_vouchers');
  const dayBookings = activeBookings.filter((booking) => booking.slot.date === date);
  const dayEvents = activeEvents.filter((event) => event.slot.date === date);
  const floorSlot = { date, startMin: floorTime, durationMin: 15 };
  const selectedCapacity = eventTableIds.reduce((sum, tableId) => sum + (tableById.get(tableId)?.maxSeats ?? 0), 0);
  const websiteHref = `${locale === 'en' ? '/en' : ''}/demos/solane/`;
  const ticketsHref = `${websiteHref}eventos/`;
  const vouchersHref = `${websiteHref}bonos/`;
  const confirmationHref = `${websiteHref}confirmacion/`;

  return (
    <div className="rd-app rd-app--solane" data-dashboard-demo data-dashboard-brand="solane">
      <aside className="rd-sidebar">
        <a className="rd-lockup" href={websiteHref} aria-label={restaurant.name}><span>S</span><strong>{restaurant.name}</strong></a>
        <p className="rd-product">{local(COPY.product, locale)}</p>
        <nav className="rd-nav" aria-label={local(COPY.product, locale)}>
          {NAV.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} type="button" className={view === item.id ? 'active' : ''} aria-current={view === item.id ? 'page' : undefined} onClick={() => setView(item.id)}><Icon size={18} aria-hidden="true" />{local(item.label, locale)}</button>;
          })}
        </nav>
        <div className="rd-sidebar__bottom">
          <a href={websiteHref}><ExternalLink size={16} aria-hidden="true" />{local(COPY.back, locale)}</a>
          <button type="button" onClick={reset}><RotateCcw size={16} aria-hidden="true" />{local(COPY.reset, locale)}</button>
        </div>
      </aside>

      <main id="contenido" className="rd-main" tabIndex={-1}>
        <div className="rd-demo-notice"><span>{local(COPY.fictional, locale)}</span><div className="rd-demo-actions"><label>{local(COPY.role.label, locale)}<select data-role-selector disabled={!hydrated} value={state.role} onChange={(changeEvent) => changeRole(changeEvent.target.value as RestaurantRole)}><option value="direction">{local(COPY.role.direction, locale)}</option><option value="floor">{local(COPY.role.floor, locale)}</option><option value="kitchen">{local(COPY.role.kitchen, locale)}</option></select></label><button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />{local(COPY.reset, locale)}</button></div></div>
        <p className="rd-live" role="status" aria-live="polite">{notice}</p>

        {view === 'servicio' && (
          <section className="rd-view" data-dashboard-view="servicio">
            <header className="rd-view-header">
              <div><p className="rd-eyebrow">{local(COPY.service.eyebrow, locale)}</p><h1>{local(COPY.service.title, locale)}</h1><p>{local(COPY.service.body, locale)}</p></div>
              <div className="rd-controls"><label><span><CalendarDays size={15} aria-hidden="true" />{local(COPY.date, locale)}</span><input type="date" value={date} onChange={(changeEvent) => setDate(changeEvent.target.value)} /></label></div>
            </header>
            <div className="rd-service-summary">
              <div><CalendarDays size={18} aria-hidden="true" /><span>{new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}</span></div>
              <div><UsersRound size={18} aria-hidden="true" /><strong>{dayBookings.length}</strong><span>{local(COPY.service.bookings, locale)}</span></div>
              <div><TicketCheck size={18} aria-hidden="true" /><strong>{dayEvents.length}</strong><span>{local(COPY.service.events, locale)}</span></div>
            </div>
            {dayBookings.length + dayEvents.length === 0 && <p className="rd-empty">{local(COPY.service.empty, locale)}</p>}
            <div className="rd-solane-service" data-service-inventory>
              {[...dayBookings.map((booking) => ({ id: booking.id, kind: 'booking' as const, title: booking.guest.name, slot: booking.slot, tableIds: booking.tableIds, detail: `${booking.partySize} ${local(COPY.people, locale)}` })), ...dayEvents.map((event) => ({ id: event.id, kind: 'event' as const, title: event.name, slot: event.slot, tableIds: event.consumesTableIds, detail: `${event.capacity - event.soldSeats} ${local(COPY.events.remaining, locale)}` }))]
                .sort((left, right) => left.slot.startMin - right.slot.startMin)
                .map((item) => <article key={`${item.kind}-${item.id}`} data-inventory-kind={item.kind}><time>{timeLabel(item.slot.startMin)}</time><span className="rd-inventory-dot" /><div><h2>{item.title}</h2><p>{item.detail} · {item.tableIds.map((id) => id.toUpperCase()).join(' + ')}</p></div><span className="badge" data-tone={item.kind === 'event' ? 'danger' : 'success'}>{local(item.kind === 'event' ? COPY.event : COPY.occupied, locale)}</span></article>)}
            </div>
          </section>
        )}

        {view === 'plano' && (
          <section className="rd-view" data-dashboard-view="plano">
            <header className="rd-view-header">
              <div><p className="rd-eyebrow">{local(COPY.floor.eyebrow, locale)}</p><h1>{local(COPY.floor.title, locale)}</h1><p>{local(COPY.floor.body, locale)}</p></div>
              <div className="rd-controls">
                <label><span><CalendarDays size={15} aria-hidden="true" />{local(COPY.date, locale)}</span><input type="date" value={date} onChange={(changeEvent) => setDate(changeEvent.target.value)} /></label>
                <label><span><Clock3 size={15} aria-hidden="true" />{local(COPY.time, locale)}</span><input type="time" step="900" value={timeValue(floorTime)} onChange={(changeEvent) => setFloorTime(minutesFromTime(changeEvent.target.value))} /></label>
              </div>
            </header>
            <div className="rd-floor-legend" aria-label={local(COPY.floor.legend, locale)}><span data-state="free">{local(COPY.free, locale)}</span><span data-state="occupied">{local(COPY.occupied, locale)}</span><span data-state="event">{local(COPY.event, locale)}</span><span data-state="private">{local(COPY.private, locale)}</span></div>
            <div className="rd-solane-spaces">
              {restaurant.spaces.map((space) => <section className="rd-solane-space" key={space.id}><header><h2>{space.name}</h2><span>{space.tables.length} {local(COPY.tables, locale).toLowerCase()}</span></header><div>{space.tables.map((table) => {
                const event = activeEvents.find((candidate) => candidate.consumesTableIds.includes(table.id) && overlaps(candidate.slot, floorSlot));
                const booking = activeBookings.find((candidate) => candidate.tableIds.includes(table.id) && overlaps(candidate.slot, floorSlot));
                const hire = state.privateHires.find((candidate) => candidate.status === 'blocked' && candidate.spaceId === space.id && overlaps(candidate.slot, floorSlot));
                const status = hire !== undefined ? 'private' : event === undefined ? booking === undefined ? 'free' : 'occupied' : 'event';
                const detail = hire === undefined ? event?.name ?? booking?.guest.name ?? `${table.minSeats}–${table.maxSeats} ${local(COPY.people, locale)}` : local(COPY.privateHires.blocked, locale);
                const statusLabel = local(status === 'private' ? COPY.private : status === 'event' ? COPY.event : status === 'occupied' ? COPY.occupied : COPY.free, locale);
                return <article className="rd-solane-table" key={table.id} data-table-id={table.id} data-state={status} aria-label={`${table.name} · ${statusLabel} · ${detail}`}><span>{table.id.toUpperCase()}</span><h3>{table.name}</h3><p>{detail}</p><b>{statusLabel}</b></article>;
              })}</div></section>)}
            </div>
          </section>
        )}

        {view === 'reservas' && (
          <section className="rd-view" data-dashboard-view="reservas">
            <header className="rd-view-header"><div><p className="rd-eyebrow">{local(COPY.reservations.eyebrow, locale)}</p><h1>{local(COPY.reservations.title, locale)}</h1><p>{local(COPY.reservations.body, locale)}</p></div></header>
            <div className="rd-reservations-layout">
              <aside className="rd-deposit-law" data-deposit-legal-panel><ShieldCheck size={24} aria-hidden="true" /><div><h2>{local(COPY.reservations.legalTitle, locale)}</h2><p>{local(COPY.reservations.legalBody, locale)}</p></div></aside>
              <div className="rd-booking-list" data-reservation-list>
              {state.bookings.length === 0 && <p className="rd-empty">{local(COPY.reservations.empty, locale)}</p>}
              {[...state.bookings].sort((left, right) => left.slot.date.localeCompare(right.slot.date) || left.slot.startMin - right.slot.startMin).map((booking) => {
                const deposit = booking.deposit;
                const formatMoney = (cents: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
                return <article className={`rd-booking rd-booking--compact${deposit ? ' rd-booking--deposit' : ''}`} key={booking.id} data-booking-id={booking.id}>
                  <div className="rd-booking__guest"><span className="rd-avatar">{booking.guest.name.slice(0, 1).toUpperCase()}</span><div><h2>{booking.guest.name}</h2><p>{booking.guest.email ?? booking.guest.phone ?? booking.source}</p></div></div>
                  <dl className="rd-booking__details"><div><dt>{local(COPY.date, locale)} · {local(COPY.time, locale)}</dt><dd><b>{booking.slot.date}</b><span>{timeLabel(booking.slot.startMin)}</span></dd></div><div><dt>{local(COPY.reservations.assignment, locale)}</dt><dd><b>{booking.tableIds.map((id) => id.toUpperCase()).join(' + ')}</b><span>{booking.partySize} {local(COPY.people, locale)}</span></dd></div><div><dt>{local(COPY.reservations.status, locale)}</dt><dd><b data-booking-status>{local(COPY.reservations.statusLabels[booking.status], locale)}</b><span>{booking.source}</span></dd></div></dl>
                  {deposit && <section className="rd-deposit-record" data-deposit-record data-deposit-status={deposit.status}><header><div><p>{local(COPY.reservations.deposit, locale)}</p><h3>{local(deposit.status === 'held' ? COPY.reservations.held : deposit.status === 'charged' ? COPY.reservations.charged : COPY.reservations.released, locale)}</h3></div><span className="badge" data-tone={deposit.status === 'charged' ? 'danger' : deposit.status === 'released' ? 'success' : 'warning'}>{deposit.status}</span></header><dl><div><dt>{local(COPY.reservations.subtotal, locale)}</dt><dd>{formatMoney(deposit.breakdown.menuSubtotalCents)}</dd></div><div><dt>{local(COPY.reservations.percentage, locale)}</dt><dd>{deposit.breakdown.percentageBps / 100}%</dd></div><div><dt>{local(COPY.reservations.amount, locale)}</dt><dd data-deposit-resolution-amount>{formatMoney(deposit.breakdown.amountCents)}</dd></div></dl><p>{local(COPY.reservations.termsAccepted, locale)} · <time dateTime={deposit.termsAcceptedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(deposit.termsAcceptedAt))}</time></p>{deposit.status === 'held' && (!canOperate(state.role, 'charge_no_show') || !canOperate(state.role, 'seat_booking')) && <p className="rd-role-warning" data-role-warning>{local(state.role === 'kitchen' ? COPY.role.kitchenWarning : COPY.role.readOnly, locale)}</p>}{deposit.status === 'held' && <div><button type="button" data-deposit-action="no_show" disabled={!canOperate(state.role, 'charge_no_show')} onClick={() => resolveDeposit(booking.id, 'no_show')}>{local(COPY.reservations.markNoShow, locale)}</button><button type="button" data-deposit-action="seated" disabled={!canOperate(state.role, 'seat_booking')} onClick={() => resolveDeposit(booking.id, 'seated')}>{local(COPY.reservations.seat, locale)}</button></div>}</section>}
                </article>;
              })}
              </div>
            </div>
          </section>
        )}

        {view === 'eventos' && (
          <section className="rd-view" data-dashboard-view="eventos">
            <header className="rd-view-header"><div><p className="rd-eyebrow">{local(COPY.events.eyebrow, locale)}</p><h1>{local(COPY.events.title, locale)}</h1><p>{local(COPY.events.body, locale)}</p></div><a className="rd-secondary-action" href={ticketsHref}><ExternalLink size={15} aria-hidden="true" />{local(COPY.events.publicAgenda, locale)}</a></header>
            <div className="rd-event-workspace">
              <form className="rd-event-form" onSubmit={createEvent} data-event-form>
                <h2>{local(COPY.events.newTitle, locale)}</h2>
                {!canManageEvents && <p className="rd-role-warning rd-event-form__wide" data-role-warning>{local(COPY.role.readOnly, locale)}</p>}
                <label className="rd-event-form__wide"><span>{local(COPY.events.name, locale)}</span><input required disabled={!canManageEvents} name="event-name" value={eventName} placeholder={local(COPY.events.namePlaceholder, locale)} onChange={(changeEvent) => setEventName(changeEvent.target.value)} /></label>
                <label><span>{local(COPY.date, locale)}</span><input required disabled={!canManageEvents} name="event-date" type="date" value={eventDate} onChange={(changeEvent) => setEventDate(changeEvent.target.value)} /></label>
                <label><span>{local(COPY.time, locale)}</span><input required disabled={!canManageEvents} name="event-time" type="time" step="900" value={timeValue(eventTime)} onChange={(changeEvent) => setEventTime(minutesFromTime(changeEvent.target.value))} /></label>
                <label><span>{local(COPY.events.duration, locale)}</span><input required disabled={!canManageEvents} name="event-duration" type="number" min="15" step="15" value={eventDuration} onChange={(changeEvent) => setEventDuration(Number(changeEvent.target.value))} /></label>
                <label><span>{local(COPY.events.price, locale)}</span><input required disabled={!canManageEvents} name="event-price" type="number" min="0" step="0.01" value={eventPrice} onChange={(changeEvent) => setEventPrice(Number(changeEvent.target.value))} /></label>
                <label><span>{local(COPY.events.capacity, locale)}</span><input required disabled={!canManageEvents} name="event-capacity" type="number" min="1" value={eventCapacity} onChange={(changeEvent) => setEventCapacity(Number(changeEvent.target.value))} /></label>
                <fieldset className="rd-event-form__tables" disabled={!canManageEvents}><legend>{local(COPY.events.selectTables, locale)}</legend>{restaurant.spaces.map((space) => <div key={space.id}><strong>{space.name}</strong><span>{space.tables.map((table) => <label key={table.id}><input type="checkbox" checked={eventTableIds.includes(table.id)} data-event-table-id={table.id} onChange={() => toggleEventTable(table.id)} /><b>{table.name}</b><small>{table.id.toUpperCase()} · {table.maxSeats}</small></label>)}</span></div>)}</fieldset>
                <p className="rd-event-capacity"><strong>{selectedCapacity}</strong> {local(COPY.events.selectedCapacity, locale)}</p>
                <button className="rd-primary-action rd-event-form__submit" type="submit" disabled={!canManageEvents} data-create-event>{local(COPY.events.create, locale)}</button>
              </form>

              <div className="rd-event-list" data-manager-event-list>
                <h2>{local(COPY.events.listTitle, locale)}</h2>
                {[...state.events].sort((left, right) => right.slot.date.localeCompare(left.slot.date) || right.slot.startMin - left.slot.startMin).map((event) => {
                  const remaining = event.capacity - event.soldSeats;
                  return <article className="rd-event-card" key={event.id} data-manager-event-id={event.id} data-manager-event-status={event.status}><header><div><span className="badge" data-tone={event.status === 'draft' ? 'warning' : event.status === 'published' ? 'success' : 'danger'}>{local(COPY.events[event.status], locale)}</span><h3>{event.name}</h3></div><TicketCheck size={26} aria-hidden="true" /></header><dl><div><dt>{local(COPY.date, locale)}</dt><dd>{event.slot.date}</dd></div><div><dt>{local(COPY.time, locale)}</dt><dd>{timeLabel(event.slot.startMin)}</dd></div><div><dt>{local(COPY.events.remaining, locale)}</dt><dd data-manager-event-remaining>{remaining} / {event.capacity}</dd></div><div><dt>{local(COPY.tables, locale)}</dt><dd>{event.consumesTableIds.map((id) => id.toUpperCase()).join(' + ')}</dd></div></dl><p>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(event.priceCents / 100)} · {state.sales.filter((sale) => sale.eventId === event.id).length} {local(COPY.events.sales, locale)}</p>{event.status === 'draft' && <button className="rd-primary-action" type="button" disabled={!canManageEvents} data-publish-event onClick={() => publish(event.id)}>{local(COPY.events.publish, locale)}</button>}</article>;
                })}
              </div>
            </div>
          </section>
        )}

        {view === 'bonos' && (
          <section className="rd-view" data-dashboard-view="bonos">
            <header className="rd-view-header"><div><p className="rd-eyebrow">{local(COPY.vouchers.eyebrow, locale)}</p><h1>{local(COPY.vouchers.title, locale)}</h1><p>{local(COPY.vouchers.body, locale)}</p></div><a className="rd-secondary-action" href={vouchersHref}><ExternalLink size={15} aria-hidden="true" />{local(COPY.vouchers.publicPage, locale)}</a></header>
            <div className="rd-voucher-summary">
              <div><Gift size={20} aria-hidden="true" /><strong>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(state.vouchers.filter((voucher) => voucher.status === 'issued').reduce((sum, voucher) => sum + voucher.value.totalValueCents, 0) / 100)}</strong><span>{local(COPY.vouchers.activeValue, locale)}</span></div>
              <div><TicketCheck size={20} aria-hidden="true" /><strong>{state.vouchers.filter((voucher) => voucher.status === 'issued').length}</strong><span>{local(COPY.vouchers.issuedCount, locale)}</span></div>
              <div><CheckCircle2 size={20} aria-hidden="true" /><strong>{state.vouchers.filter((voucher) => voucher.status === 'redeemed').length}</strong><span>{local(COPY.vouchers.redeemedCount, locale)}</span></div>
            </div>
            {!canManageVouchers && <p className="rd-role-warning" data-role-warning>{local(COPY.vouchers.roleWarning, locale)}</p>}
            <div className="rd-voucher-list" data-manager-voucher-list>
              {state.vouchers.length === 0 && <p className="rd-empty">{local(COPY.vouchers.empty, locale)}</p>}
              {[...state.vouchers].sort((left, right) => right.issuedAt.localeCompare(left.issuedAt)).map((voucher) => <article className="rd-voucher-card" key={voucher.id} data-manager-voucher-id={voucher.id} data-voucher-status={voucher.status}>
                <header><div><span className="badge" data-tone={voucher.status === 'issued' ? 'warning' : voucher.status === 'redeemed' ? 'success' : 'danger'}>{local(COPY.vouchers[voucher.status], locale)}</span><h2>{voucher.experienceName}</h2></div><Gift size={28} aria-hidden="true" /></header>
                <dl><div><dt>{local(COPY.vouchers.code, locale)}</dt><dd data-manager-voucher-code>{voucher.code}</dd></div><div><dt>{local(COPY.vouchers.recipient, locale)}</dt><dd>{voucher.recipientName}</dd></div><div><dt>{local(COPY.vouchers.value, locale)}</dt><dd>{voucher.value.quantity} × {new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(voucher.value.unitValueCents / 100)} = {new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(voucher.value.totalValueCents / 100)}</dd></div><div><dt>{local(COPY.vouchers.issuedAt, locale)}</dt><dd>{voucher.issuedAt.slice(0, 10)}</dd></div><div><dt>{local(COPY.vouchers.expiresOn, locale)}</dt><dd>{voucher.expiresOn}</dd></div></dl>
                {voucher.status === 'issued' && <button className="rd-primary-action" type="button" data-redeem-voucher disabled={!canManageVouchers} onClick={() => redeemVoucher(voucher.id)}>{local(COPY.vouchers.redeem, locale)}</button>}
              </article>)}
            </div>
          </section>
        )}

        {view === 'privatizaciones' && (
          <section className="rd-view" data-dashboard-view="privatizaciones">
            <header className="rd-view-header"><div><p className="rd-eyebrow">{local(COPY.privateHires.eyebrow, locale)}</p><h1>{local(COPY.privateHires.title, locale)}</h1><p>{local(COPY.privateHires.body, locale)}</p></div></header>
            {privateHire === undefined ? <p className="rd-empty">{local(COPY.reservations.empty, locale)}</p> : <div className="rd-private-workspace" data-private-hire-id={privateHire.id} data-private-hire-status={privateHire.status}>
              {state.privateHireTour.mode === 'choice' ? <section className="rd-private-mode"><Building2 size={30} aria-hidden="true" /><h2>{local(COPY.privateHires.chooseTitle, locale)}</h2><p>{local(COPY.privateHires.chooseBody, locale)}</p><div><button type="button" data-private-tour-mode="guided" onClick={() => commit(startSolanePrivateHireTour(state, 'guided'))}><b>{local(COPY.privateHires.guided, locale)}</b><span>{local(COPY.privateHires.steps[0], locale)} → {local(COPY.privateHires.steps[2], locale)}</span></button><button type="button" className="ghost" data-private-tour-mode="free" onClick={() => commit(startSolanePrivateHireTour(state, 'free'))}><b>{local(COPY.privateHires.free, locale)}</b><span>{local(COPY.privateHires.chooseBody, locale)}</span></button></div></section> : <>
                <ol className="rd-private-progress" aria-label={local(COPY.privateHires.tourLabel, locale)}>{COPY.privateHires.steps.map((stepLabel, index) => { const number = index + 1; const active = state.privateHireTour.completed ? 'complete' : number === state.privateHireTour.step ? 'active' : number < state.privateHireTour.step ? 'complete' : ''; return <li key={stepLabel.es} className={active}><span>{number < state.privateHireTour.step || state.privateHireTour.completed ? '✓' : number}</span><b>{local(stepLabel, locale)}</b></li>; })}</ol>
                <article className="rd-private-card rd-private-request"><header><div><span className="badge" data-tone={privateHire.status === 'blocked' ? 'success' : privateHire.status === 'deposit_paid' ? 'info' : 'warning'}>{local(COPY.privateHires[privateHire.status], locale)}</span><h2>{local(COPY.privateHires.requestTitle, locale)}</h2></div><Building2 size={30} aria-hidden="true" /></header><p>{local(COPY.privateHires.requestBody, locale)}</p><dl><div><dt>{local(COPY.privateHires.space, locale)}</dt><dd>{restaurant.spaces.find((space) => space.id === privateHire.spaceId)?.name ?? privateHire.spaceId}</dd></div><div><dt>{local(COPY.privateHires.dateTime, locale)}</dt><dd>{privateHire.slot.date} · {timeLabel(privateHire.slot.startMin)}</dd></div><div><dt>{local(COPY.events.duration, locale)}</dt><dd>{privateHire.slot.durationMin} min</dd></div></dl></article>

                {privateHire.status === 'requested' && <form className="rd-private-card rd-private-proposal" data-private-proposal onSubmit={preparePrivateHire}><h2>{local(COPY.privateHires.steps[1], locale)}</h2>{!canManagePrivateHires && <p className="rd-role-warning" data-role-warning>{local(COPY.role.readOnly, locale)}</p>}<div><label>{local(COPY.privateHires.menu, locale)}<select name="private-menu" disabled={!canManagePrivateHires} value={proposalMenuId} onChange={(changeEvent) => setProposalMenuId(changeEvent.target.value)}>{restaurant.menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}</select></label><label>{local(COPY.privateHires.price, locale)}<input name="private-price" disabled={!canManagePrivateHires} type="number" min="0" step="0.01" value={proposalPrice} onChange={(changeEvent) => setProposalPrice(Number(changeEvent.target.value))} /></label><label>{local(COPY.privateHires.minimum, locale)}<input name="private-minimum" disabled={!canManagePrivateHires} type="number" min="1" value={proposalMinimum} onChange={(changeEvent) => setProposalMinimum(Number(changeEvent.target.value))} /></label><label>{local(COPY.privateHires.deposit, locale)}<input name="private-deposit" disabled={!canManagePrivateHires} type="number" min="0" step="0.01" value={proposalDeposit} onChange={(changeEvent) => setProposalDeposit(Number(changeEvent.target.value))} /></label></div><button className="rd-primary-action" type="submit" disabled={!canManagePrivateHires} data-prepare-private-hire>{local(COPY.privateHires.prepare, locale)}</button></form>}

                {privateHire.proposal && <article className="rd-private-card rd-private-offer" data-private-offer><header><div><span className="badge" data-tone={privateHire.status === 'blocked' ? 'success' : 'info'}>{local(COPY.privateHires[privateHire.status], locale)}</span><h2>{restaurant.menus.find((menu) => menu.id === privateHire.proposal?.menuId)?.name ?? privateHire.proposal.menuId}</h2></div><CheckCircle2 size={28} aria-hidden="true" /></header><dl><div><dt>{local(COPY.privateHires.price, locale)}</dt><dd>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(privateHire.proposal.pricePerPersonCents / 100)}</dd></div><div><dt>{local(COPY.privateHires.minimum, locale)}</dt><dd>{privateHire.proposal.minimumGuests}</dd></div><div><dt>{local(COPY.privateHires.deposit, locale)}</dt><dd>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(privateHire.proposal.depositCents / 100)}</dd></div></dl>{privateHire.status === 'proposed' && <><button className="rd-primary-action" type="button" disabled={!canManagePrivateHires} data-register-private-deposit onClick={() => registerPrivateHireDeposit(privateHire.id)}>{local(COPY.privateHires.register, locale)}</button>{!canManagePrivateHires && <p className="rd-role-warning" data-role-warning>{local(COPY.role.readOnly, locale)}</p>}</>}{privateHire.status === 'deposit_paid' && <><button className="rd-primary-action" type="button" disabled={!canManagePrivateHires} data-block-private-hire onClick={() => blockPrivateHire(privateHire.id)}>{local(COPY.privateHires.block, locale)}</button>{!canManagePrivateHires && <p className="rd-role-warning" data-role-warning>{local(COPY.role.readOnly, locale)}</p>}</>}</article>}

                {privateHire.status === 'blocked' && <section className="rd-private-success" data-private-tour-complete><span><CheckCircle2 size={24} aria-hidden="true" /></span><h2>{local(COPY.privateHires.completedTitle, locale)}</h2><p>{local(COPY.privateHires.completedBody, locale)}</p><div><button className="rd-primary-action" type="button" onClick={() => { setDate(privateHire.slot.date); setFloorTime(privateHire.slot.startMin); setView('plano'); }}>{local(COPY.privateHires.openFloor, locale)}</button><button className="rd-secondary-action" type="button" onClick={restartPrivateHireTour}>{local(COPY.privateHires.restart, locale)}</button></div></section>}
              </>}
            </div>}
          </section>
        )}
        {view === 'espera' && <WaitlistView
          locale={locale}
          restaurant={restaurant}
          entries={state.waitlist}
          bookings={state.bookings}
          events={state.events}
          privateHires={state.privateHires}
          initialDate={date}
          initialTime={floorTime}
          canManage={canManageWaitlist}
          onAdd={(entry) => commit(addSolaneWaitlistEntry(state, entry))}
          onTransition={(entryId, status) => commit(transitionSolaneWaitlistEntry(state, entryId, status))}
          onSeat={(entryId, bookingId) => commit(seatSolaneWaitlistEntry(state, entryId, restaurant, bookingId))}
        />}
        {view === 'clientes' && <SolaneCustomersView locale={locale} restaurant={restaurant} bookings={state.bookings} profiles={initialCustomers} />}
        {view === 'informes' && <ReportsView locale={locale} restaurant={restaurant} bookings={state.bookings} mode="intelligent" attendanceConfirmations={state.attendanceConfirmations} canPrepareAttendance={canOperate(state.role, 'manage_attendance_confirmations')} confirmationBaseHref={confirmationHref} onPrepareAttendance={prepareAttendance} />}
      </main>
      <MobileDashboardNav
        ariaLabel={local(COPY.product, locale)}
        currentView={view}
        items={NAV.map((item) => ({ id: item.id, label: local(item.label, locale), icon: item.icon }))}
        primaryViews={MOBILE_PRIMARY_VIEWS}
        moreLabel={locale === 'en' ? 'More' : 'Más'}
        onSelect={setView}
      />
    </div>
  );
}
