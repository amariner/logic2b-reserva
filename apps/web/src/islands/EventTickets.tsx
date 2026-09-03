import { CalendarDays, Clock3, Ticket, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RestaurantEvent, TableBooking } from '@logic-reserva/domain';
import {
  SOLANE_STORAGE_KEY,
  parseSolaneStored,
  sellSolaneTickets,
  serializeSolaneState,
  type SolaneDemoState,
} from '@logic-reserva/dashboard/solane-state';
import type { Locale } from '@logic-reserva/config';
import { subscribeToStorageKey } from '@logic-reserva/dashboard/storage-sync';
import { SOLANE_PAGE_COPY, localized } from '../data';

interface EventTicketsProps {
  initialBookings: TableBooking[];
  initialEvents: RestaurantEvent[];
  locale?: Locale;
}

const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export default function EventTickets({ initialBookings, initialEvents, locale = 'es' }: EventTicketsProps) {
  const copy = SOLANE_PAGE_COPY.tickets;
  const [state, setState] = useState<SolaneDemoState>(() => parseSolaneStored(null, initialBookings, initialEvents));
  const [seats, setSeats] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = () => setState(parseSolaneStored(localStorage.getItem(SOLANE_STORAGE_KEY), initialBookings, initialEvents));
    load();
    return subscribeToStorageKey(SOLANE_STORAGE_KEY, () => load());
  }, [initialBookings, initialEvents]);

  const buy = (eventId: string) => {
    const count = seats[eventId] ?? 1;
    const current = parseSolaneStored(localStorage.getItem(SOLANE_STORAGE_KEY), initialBookings, initialEvents);
    const now = new Date().toISOString();
    const next = sellSolaneTickets(current, eventId, count, `solane-sale-${Date.now()}`, now);
    if (next === current) return;
    localStorage.setItem(SOLANE_STORAGE_KEY, serializeSolaneState(next));
    setState(next);
    setMessage(localized(copy.success, locale));
  };

  const events = [...state.events].sort((left, right) => left.slot.date.localeCompare(right.slot.date) || left.slot.startMin - right.slot.startMin);
  return (
    <div className="et-list" data-event-tickets>
      {events.length === 0 && <p className="et-empty">{localized(copy.empty, locale)}</p>}
      {events.map((event) => {
        const remaining = event.capacity - event.soldSeats;
        const canBuy = event.status === 'published' && remaining > 0;
        const maxSeats = Math.min(4, remaining);
        return (
          <article className="et-card" key={event.id} data-event-id={event.id} data-event-status={event.status}>
            <header><div><p>{event.status === 'draft' ? localized(copy.draft, locale) : event.status === 'soldout' ? localized(copy.soldout, locale) : localized(copy.eyebrow, locale)}</p><h2>{event.name}</h2></div><Ticket size={30} aria-hidden="true" /></header>
            <dl>
              <div><dt><CalendarDays size={14} aria-hidden="true" />{localized(copy.date, locale)}</dt><dd>{event.slot.date}</dd></div>
              <div><dt><Clock3 size={14} aria-hidden="true" />{localized(copy.time, locale)}</dt><dd>{timeLabel(event.slot.startMin)}</dd></div>
              <div><dt><UsersRound size={14} aria-hidden="true" />{localized(copy.remaining, locale)}</dt><dd data-event-remaining>{remaining}</dd></div>
              <div><dt>{localized(copy.tables, locale)}</dt><dd>{event.consumesTableIds.map((tableId) => tableId.toUpperCase()).join(' + ')}</dd></div>
            </dl>
            <div className="et-price"><span>{localized(copy.price, locale)}</span><strong>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(event.priceCents / 100)}</strong></div>
            <div className="et-actions">
              <label>{localized(copy.seats, locale)}<select value={seats[event.id] ?? 1} disabled={!canBuy} onChange={(changeEvent) => setSeats((current) => ({ ...current, [event.id]: Number(changeEvent.target.value) }))}>{Array.from({ length: Math.max(1, maxSeats) }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
              <button type="button" disabled={!canBuy} onClick={() => buy(event.id)}>{canBuy ? localized(copy.buy, locale) : event.status === 'soldout' ? localized(copy.soldout, locale) : localized(copy.draft, locale)}</button>
            </div>
          </article>
        );
      })}
      <p className="et-message" role="status">{message}</p>
    </div>
  );
}
