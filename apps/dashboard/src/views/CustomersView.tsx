import { CalendarDays, Mail, Phone, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import type { Guest, TableBooking } from '@logic-reserva/domain';
import { DASHBOARD_COPY, dashboardText, type DashboardLocale } from '../content';
import type { VedraDemoState } from '../state';

interface CustomersViewProps {
  locale: DashboardLocale;
  state: VedraDemoState;
}

interface CustomerRecord {
  key: string;
  guest: Guest;
  bookings: TableBooking[];
  hasGroupRequest: boolean;
}

const guestKey = (guest: Guest) => guest.email?.toLowerCase() ?? guest.phone ?? guest.name.toLowerCase();
const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export default function CustomersView({ locale, state }: CustomersViewProps) {
  const copy = DASHBOARD_COPY.customers;
  const customers = useMemo(() => {
    const records = new Map<string, CustomerRecord>();
    for (const booking of state.bookings) {
      const key = guestKey(booking.guest);
      const current = records.get(key) ?? { key, guest: { ...booking.guest }, bookings: [], hasGroupRequest: false };
      current.bookings.push(booking);
      records.set(key, current);
    }
    const groupKey = guestKey(state.group.guest);
    const groupRecord = records.get(groupKey) ?? { key: groupKey, guest: { ...state.group.guest }, bookings: [], hasGroupRequest: false };
    groupRecord.hasGroupRequest = state.group.status !== 'confirmed';
    records.set(groupKey, groupRecord);
    return [...records.values()].sort((left, right) => left.guest.name.localeCompare(right.guest.name, locale));
  }, [locale, state.bookings, state.group.guest, state.group.status]);

  return (
    <section className="rd-view" data-dashboard-view="clientes">
      <header className="rd-view-header"><div><p className="rd-eyebrow">{dashboardText(copy.eyebrow, locale)}</p><h1>{dashboardText(copy.title, locale)}</h1><p>{dashboardText(copy.body, locale)}</p></div></header>
      <div className="rd-customer-grid">
        {customers.map((customer) => {
          const sorted = [...customer.bookings].sort((left, right) => right.slot.date.localeCompare(left.slot.date) || right.slot.startMin - left.slot.startMin);
          const latest = sorted[0];
          const covers = customer.bookings.reduce((sum, booking) => sum + booking.partySize, 0) + (customer.hasGroupRequest ? state.group.partySize : 0);
          return (
            <article className="rd-customer-card" key={customer.key}>
              <header><span className="rd-avatar"><UserRound size={17} aria-hidden="true" /></span><div><h2>{customer.guest.name}</h2>{customer.hasGroupRequest && <span className="badge" data-tone="warning">{dashboardText(copy.groupRequest, locale)}</span>}</div></header>
              <dl>
                <div><dt>{dashboardText(copy.contact, locale)}</dt><dd>{customer.guest.email && <span><Mail size={14} aria-hidden="true" />{customer.guest.email}</span>}{customer.guest.phone && <span><Phone size={14} aria-hidden="true" />{customer.guest.phone}</span>}{!customer.guest.email && !customer.guest.phone && <span>{dashboardText(copy.notAvailable, locale)}</span>}</dd></div>
                <div><dt>{dashboardText(copy.lastVisit, locale)}</dt><dd><span><CalendarDays size={14} aria-hidden="true" />{latest === undefined ? state.group.slot.date : `${latest.slot.date} · ${timeLabel(latest.slot.startMin)}`}</span></dd></div>
                <div><dt>{dashboardText(copy.bookings, locale)}</dt><dd><b>{customer.bookings.length}</b></dd></div>
                <div><dt>{dashboardText(copy.covers, locale)}</dt><dd><b>{covers}</b></dd></div>
                {latest && <div><dt>{dashboardText(copy.source, locale)}</dt><dd>{dashboardText(DASHBOARD_COPY.source[latest.source], locale)}</dd></div>}
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
