import {
  BarChart3,
  BellRing,
  CalendarDays,
  Clock3,
  ExternalLink,
  ListChecks,
  MapPinned,
  RotateCcw,
  Settings2,
  TableProperties,
  UserRound,
  UsersRound,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Badge } from '@logic-reserva/ui/badge';
import { Button } from '@logic-reserva/ui/button';
import {
  SLOT_STEP_MIN,
  seatingTimes,
  type BookingStatus,
  type CustomerProfile,
  type Restaurant,
  type RestaurantEvent,
  type PrivateHire,
  type ServiceKind,
  type TableBooking,
} from '@logic-reserva/domain';
import {
  DASHBOARD_COPY,
  DASHBOARD_VIEWS,
  dashboardText,
  dashboardView,
  type DashboardLocale,
  type DashboardView,
} from './content';
import {
  VEDRA_STORAGE_KEY,
  initialVedraState,
  addVedraWaitlistEntry,
  nextBookingStatuses,
  parseVedraStored,
  serializeVedraState,
  seatVedraWaitlistEntry,
  transitionVedraBooking,
  transitionVedraWaitlistEntry,
  type VedraDemoState,
} from './state';
import CustomersView from './views/CustomersView';
import FloorPlanView from './views/FloorPlanView';
import SettingsView from './views/SettingsView';
import SolaneDashboard from './SolaneDashboard';
import ReportsView from './views/ReportsView';
import WaitlistView from './views/WaitlistView';
import MobileDashboardNav from './MobileDashboardNav';

interface VedraDashboardProps {
  slug: 'vedra';
  locale?: DashboardLocale;
  restaurant: Restaurant;
  initialBookings: TableBooking[];
}

interface SolaneDashboardProps {
  slug: 'solane';
  locale?: DashboardLocale;
  restaurant: Restaurant;
  initialBookings: TableBooking[];
  initialEvents: RestaurantEvent[];
  initialPrivateHires: PrivateHire[];
  initialCustomers: CustomerProfile[];
}

export type DashboardDemoProps = VedraDashboardProps | SolaneDashboardProps;

type BookingFilter = 'all' | 'active' | 'closed';

const ACTIVE_STATUSES: readonly BookingStatus[] = ['pending', 'confirmed', 'seated'];
const TIMELINE_STATUSES: readonly BookingStatus[] = ['confirmed', 'seated'];
const STATUS_TONES: Record<BookingStatus, 'warning' | 'success' | 'info' | 'danger'> = {
  pending: 'warning',
  confirmed: 'success',
  seated: 'info',
  finished: 'success',
  no_show: 'danger',
  cancelled: 'danger',
};
const NAV_ICONS: Record<DashboardView, typeof TableProperties> = {
  servicio: TableProperties,
  plano: MapPinned,
  reservas: ListChecks,
  espera: BellRing,
  clientes: UserRound,
  informes: BarChart3,
  ajustes: Settings2,
};
const MOBILE_PRIMARY_VIEWS = ['servicio', 'reservas', 'espera', 'plano'] as const satisfies readonly DashboardView[];

const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function VedraDashboard({ slug, locale = 'es', restaurant, initialBookings }: VedraDashboardProps) {
  const copy = DASHBOARD_COPY;
  const initialDate = [...initialBookings].sort((left, right) => left.slot.date.localeCompare(right.slot.date))[0]?.slot.date ?? '2026-09-18';
  const [state, setState] = useState<VedraDemoState>(() => initialVedraState(initialBookings));
  const [view, setCurrentView] = useState<DashboardView>('servicio');
  const [date, setDate] = useState(initialDate);
  const [service, setService] = useState<ServiceKind>('lunch');
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [hydrated, setHydrated] = useState(false);
  const initialized = useRef(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setState(parseVedraStored(localStorage.getItem(VEDRA_STORAGE_KEY), initialBookings));
      setCurrentView(dashboardView(new URL(window.location.href).searchParams.get('vista')));
      setHydrated(true);
    }
    const syncView = () => setCurrentView(dashboardView(new URL(window.location.href).searchParams.get('vista')));
    window.addEventListener('popstate', syncView);
    return () => window.removeEventListener('popstate', syncView);
  }, [initialBookings]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(VEDRA_STORAGE_KEY, serializeVedraState(state));
  }, [hydrated, state]);

  const setView = (nextView: DashboardView) => {
    const url = new URL(window.location.href);
    url.searchParams.set('vista', nextView);
    window.history.replaceState({}, '', url);
    setCurrentView(nextView);
  };

  const reset = () => {
    localStorage.removeItem(VEDRA_STORAGE_KEY);
    setState(initialVedraState(initialBookings));
    setDate(initialDate);
    setService('lunch');
    setFilter('all');
    setNotice(dashboardText(copy.resetDone, locale));
  };

  const transition = (bookingId: string, status: BookingStatus) => {
    setState((current) => transitionVedraBooking(current, bookingId, status));
    setNotice('');
  };

  const tables = useMemo(() => restaurant.spaces.flatMap((space) => space.tables.map((table) => ({ ...table, space }))), [restaurant]);
  const tableById = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);
  const menuById = useMemo(() => new Map(restaurant.menus.map((menu) => [menu.id, menu])), [restaurant.menus]);
  const shift = restaurant.shifts.find((candidate) => candidate.kind === service);
  const slots = useMemo(() => {
    if (shift === undefined) return [];
    const seatings = seatingTimes(shift);
    const last = seatings.at(-1) ?? shift.lastSeatingMin;
    const result = [...seatings];
    for (let time = last + SLOT_STEP_MIN; time < last + 150; time += SLOT_STEP_MIN) result.push(time);
    return result;
  }, [shift]);

  const serviceBookings = useMemo(() => {
    if (shift === undefined) return [];
    return state.bookings.filter((booking) =>
      booking.slot.date === date
      && TIMELINE_STATUSES.includes(booking.status)
      && booking.slot.startMin >= shift.firstSeatingMin
      && booking.slot.startMin <= shift.lastSeatingMin,
    );
  }, [date, shift, state.bookings]);

  const filteredBookings = useMemo(() => [...state.bookings]
    .filter((booking) => filter === 'all' || (filter === 'active' ? ACTIVE_STATUSES.includes(booking.status) : !ACTIVE_STATUSES.includes(booking.status)))
    .sort((left, right) => left.slot.date.localeCompare(right.slot.date) || left.slot.startMin - right.slot.startMin), [filter, state.bookings]);

  const gridStyle = { gridTemplateColumns: `168px repeat(${slots.length}, minmax(68px, 1fr))` } satisfies CSSProperties;
  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
  const websiteHref = `${locale === 'en' ? '/en' : ''}/demos/${slug}/`;

  return (
    <div className="rd-app" data-dashboard-demo>
      <aside className="rd-sidebar">
        <a className="rd-lockup" href={websiteHref} aria-label={restaurant.name}>
          <span>V</span><strong>{restaurant.name}</strong>
        </a>
        <p className="rd-product">{dashboardText(copy.product, locale)}</p>
        <nav className="rd-nav" aria-label={dashboardText(copy.product, locale)}>
          {DASHBOARD_VIEWS.map((item) => {
            const Icon = NAV_ICONS[item.id];
            return <button key={item.id} type="button" className={view === item.id ? 'active' : ''} aria-current={view === item.id ? 'page' : undefined} onClick={() => setView(item.id)}><Icon size={18} aria-hidden="true" />{dashboardText(item.label, locale)}</button>;
          })}
        </nav>
        <div className="rd-sidebar__bottom">
          <a href={websiteHref}><ExternalLink size={16} aria-hidden="true" />{dashboardText(copy.backToWebsite, locale)}</a>
          <Button variant="ghost" type="button" onClick={reset}><RotateCcw size={16} aria-hidden="true" />{dashboardText(copy.reset, locale)}</Button>
        </div>
      </aside>

      <main id="contenido" className="rd-main" tabIndex={-1}>
        <div className="rd-demo-notice"><span>{dashboardText(copy.fictional, locale)}</span><Button variant="outline" type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />{dashboardText(copy.reset, locale)}</Button></div>
        <p className="rd-live" role="status" aria-live="polite">{notice}</p>

        {view === 'servicio' && (
          <section className="rd-view" data-dashboard-view="servicio">
            <header className="rd-view-header">
              <div><p className="rd-eyebrow">{dashboardText(copy.service.eyebrow, locale)}</p><h1>{dashboardText(copy.service.title, locale)}</h1><p>{dashboardText(copy.service.body, locale)}</p></div>
              <div className="rd-controls">
                <label><span><CalendarDays size={15} aria-hidden="true" />{dashboardText(copy.service.date, locale)}</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
                <label><span><Clock3 size={15} aria-hidden="true" />{dashboardText(copy.service.shift, locale)}</span><select value={service} onChange={(event) => setService(event.target.value as ServiceKind)}><option value="lunch">{dashboardText(copy.service.lunch, locale)}</option><option value="dinner">{dashboardText(copy.service.dinner, locale)}</option></select></label>
              </div>
            </header>

            <div className="rd-service-summary">
              <div><UtensilsCrossed size={18} aria-hidden="true" /><span>{formattedDate}</span></div>
              <div><TableProperties size={18} aria-hidden="true" /><strong>{tables.length}</strong><span>{dashboardText(copy.service.tables, locale)}</span></div>
              <div><UsersRound size={18} aria-hidden="true" /><strong>{serviceBookings.reduce((sum, booking) => sum + booking.partySize, 0)}</strong><span>{dashboardText(copy.reservations.people, locale)}</span></div>
            </div>

            {serviceBookings.length === 0 && <p className="rd-empty">{dashboardText(copy.service.empty, locale)}</p>}
            <div className="rd-timeline-wrap" data-service-timeline>
              <div className="rd-timeline rd-timeline--header" style={gridStyle}>
                <strong>{dashboardText(copy.service.tables, locale)}</strong>
                {slots.map((slot) => <time key={slot}>{timeLabel(slot)}</time>)}
              </div>
              {tables.map((table) => {
                const bookings = serviceBookings.filter((booking) => booking.tableIds.includes(table.id));
                return (
                  <div className="rd-timeline rd-timeline--row" style={gridStyle} key={table.id}>
                    <div className="rd-table-label"><b>{table.name}</b><small>{table.space.name} · {table.id.toUpperCase()}</small></div>
                    {slots.map((slot) => <span className="rd-slot" key={slot} aria-hidden="true" />)}
                    {bookings.map((booking) => {
                      const start = slots.indexOf(booking.slot.startMin);
                      if (start < 0) return null;
                      const span = Math.max(1, Math.ceil(booking.slot.durationMin / SLOT_STEP_MIN));
                      const style = { gridColumn: `${start + 2} / span ${Math.min(span, slots.length - start)}` } satisfies CSSProperties;
                      return <article className="rd-timeline-booking" style={style} key={booking.id} data-source={booking.source}><div><b>{booking.guest.name}</b><small>{booking.partySize} · {timeLabel(booking.slot.startMin)}</small></div>{booking.source === 'widget' && <em>{dashboardText(copy.source.widget, locale)}</em>}</article>;
                    })}
                  </div>
                );
              })}
            </div>
            <div className="rd-mobile-service-list" data-mobile-service-list>
              {[...serviceBookings].sort((left, right) => left.slot.startMin - right.slot.startMin).map((booking) => {
                const assignedTables = booking.tableIds.map((tableId) => tableById.get(tableId)?.name ?? tableId).join(' + ');
                const transitions = nextBookingStatuses(booking.status);
                return <article key={booking.id} data-mobile-service-booking={booking.id}>
                  <header><time>{timeLabel(booking.slot.startMin)}</time><Badge className="badge" data-tone={STATUS_TONES[booking.status]}>{dashboardText(copy.status[booking.status], locale)}</Badge></header>
                  <div><span className="rd-avatar" aria-hidden="true">{booking.guest.name.slice(0, 1).toUpperCase()}</span><div><h2>{booking.guest.name}</h2><p>{booking.partySize} {dashboardText(copy.reservations.people, locale)} · {assignedTables}</p></div></div>
                  {transitions.length > 0 && <footer>{transitions.map((status) => <button key={status} className={status === 'cancelled' || status === 'no_show' ? 'danger' : ''} type="button" data-mobile-service-action={status} onClick={() => transition(booking.id, status)}>{dashboardText(copy.action[status], locale)}</button>)}</footer>}
                </article>;
              })}
            </div>
          </section>
        )}

        {view === 'reservas' && (
          <section className="rd-view" data-dashboard-view="reservas">
            <header className="rd-view-header">
              <div><p className="rd-eyebrow">{dashboardText(copy.reservations.eyebrow, locale)}</p><h1>{dashboardText(copy.reservations.title, locale)}</h1><p>{dashboardText(copy.reservations.body, locale)}</p></div>
              <div className="rd-filter" role="group" aria-label={dashboardText(copy.reservations.status, locale)}>
                {(['all', 'active', 'closed'] as const).map((candidate) => <button key={candidate} type="button" className={filter === candidate ? 'active' : ''} onClick={() => setFilter(candidate)}>{dashboardText(copy.reservations[candidate], locale)}</button>)}
              </div>
            </header>

            <div className="rd-booking-list" data-reservation-list>
              {filteredBookings.length === 0 && <p className="rd-empty">{dashboardText(copy.reservations.empty, locale)}</p>}
              {filteredBookings.map((booking) => {
                const assignedTables = booking.tableIds.map((tableId) => tableById.get(tableId)?.name ?? tableId).join(' + ');
                const menu = booking.menuId === undefined ? undefined : menuById.get(booking.menuId);
                const transitions = nextBookingStatuses(booking.status);
                return (
                  <article className="rd-booking" key={booking.id} data-booking-id={booking.id}>
                    <div className="rd-booking__guest"><span className="rd-avatar" aria-hidden="true">{booking.guest.name.slice(0, 1).toUpperCase()}</span><div><h2>{booking.guest.name}</h2><p>{booking.guest.email ?? booking.guest.phone ?? dashboardText(copy.source[booking.source], locale)}</p></div></div>
                    <dl className="rd-booking__details">
                      <div><dt>{dashboardText(copy.reservations.dateTime, locale)}</dt><dd><b>{booking.slot.date}</b><span>{timeLabel(booking.slot.startMin)} · {booking.slot.durationMin} {dashboardText(copy.minutes, locale)}</span></dd></div>
                      <div><dt>{dashboardText(copy.reservations.party, locale)}</dt><dd><b>{booking.partySize} {dashboardText(copy.reservations.people, locale)}</b><span>{dashboardText(copy.source[booking.source], locale)}</span></dd></div>
                      <div><dt>{dashboardText(copy.reservations.assignment, locale)}</dt><dd><b>{assignedTables}</b><span>{menu?.name ?? dashboardText(copy.reservations.noMenu, locale)}</span></dd></div>
                    </dl>
                    <div className="rd-booking__state"><Badge className="badge" data-tone={STATUS_TONES[booking.status]} data-booking-status>{dashboardText(copy.status[booking.status], locale)}</Badge>{booking.source === 'widget' && <span className="rd-web-badge">{dashboardText(copy.source.widget, locale)}</span>}</div>
                    <div className="rd-booking__actions">
                      {transitions.length === 0 ? <small>{dashboardText(copy.reservations.noActions, locale)}</small> : transitions.map((status) => <button key={status} className={status === 'cancelled' || status === 'no_show' ? 'danger' : ''} type="button" data-booking-action={status} onClick={() => transition(booking.id, status)}>{dashboardText(copy.action[status], locale)}</button>)}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {view === 'plano' && <FloorPlanView locale={locale} restaurant={restaurant} state={state} onChange={setState} onView={setView} />}
        {view === 'espera' && <WaitlistView
          locale={locale}
          restaurant={restaurant}
          entries={state.waitlist}
          bookings={state.bookings}
          initialDate={date}
          initialTime={shift?.firstSeatingMin ?? 780}
          onAdd={(entry) => setState((current) => addVedraWaitlistEntry(current, entry))}
          onTransition={(entryId, status) => setState((current) => transitionVedraWaitlistEntry(current, entryId, status))}
          onSeat={(entryId, bookingId) => setState((current) => seatVedraWaitlistEntry(current, entryId, restaurant, bookingId))}
        />}
        {view === 'clientes' && <CustomersView locale={locale} state={state} />}
        {view === 'informes' && <ReportsView locale={locale} restaurant={restaurant} bookings={state.bookings} mode="management" />}
        {view === 'ajustes' && <SettingsView locale={locale} restaurant={restaurant} />}
      </main>
      <MobileDashboardNav
        ariaLabel={dashboardText(copy.product, locale)}
        currentView={view}
        items={DASHBOARD_VIEWS.map((item) => ({ id: item.id, label: dashboardText(item.label, locale), icon: NAV_ICONS[item.id] }))}
        primaryViews={MOBILE_PRIMARY_VIEWS}
        moreLabel={locale === 'en' ? 'More' : 'Más'}
        onSelect={setView}
      />
    </div>
  );
}

export default function DashboardDemo(props: DashboardDemoProps) {
  if (props.slug === 'solane') {
    return <SolaneDashboard {...props} />;
  }
  return <VedraDashboard {...props} />;
}
