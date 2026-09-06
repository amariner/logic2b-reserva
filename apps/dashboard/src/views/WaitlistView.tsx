import { Armchair, BellRing, Clock3, UserPlus, UsersRound, XCircle } from 'lucide-react';
import { useId, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '@logic-reserva/ui/badge';
import { Button } from '@logic-reserva/ui/button';
import {
  estimateDurationMin,
  tableAvailability,
  type PrivateHire,
  type Restaurant,
  type RestaurantEvent,
  type TableBooking,
  type WaitlistEntry,
  type WaitlistStatus,
} from '@logic-reserva/domain';
import type { DashboardLocale } from '../content';

interface WaitlistViewProps {
  locale: DashboardLocale;
  restaurant: Restaurant;
  entries: readonly WaitlistEntry[];
  bookings: readonly TableBooking[];
  events?: readonly RestaurantEvent[];
  privateHires?: readonly PrivateHire[];
  initialDate: string;
  initialTime: number;
  canManage?: boolean;
  onAdd: (entry: WaitlistEntry) => void;
  onTransition: (entryId: string, status: Extract<WaitlistStatus, 'notified' | 'cancelled'>) => void;
  onSeat: (entryId: string, bookingId: string) => void;
}

const COPY = {
  es: {
    eyebrow: 'Lista de espera', title: 'La demanda espontánea, dentro del inventario.',
    body: 'Registra la llegada, comunica una espera y asigna la primera combinación mínima que esté realmente libre.',
    localOnly: 'Aviso local · No se envían SMS ni mensajes reales', newEntry: 'Añadir a la cola', name: 'Nombre',
    namePlaceholder: 'Nombre del cliente', contact: 'Teléfono (opcional)', contactPlaceholder: '+34 600 000 000',
    party: 'Personas', date: 'Fecha', time: 'Hora solicitada', quote: 'Espera comunicada', minutes: 'min',
    add: 'Añadir a espera', active: 'Esperando ahora', history: 'Historial de esta demo', empty: 'No hay nadie esperando.',
    waiting: 'En espera', notified: 'Avisado · demo', seated: 'Sentado', cancelled: 'Cancelado',
    arrived: 'Llegó', requested: 'Solicita', tableReady: 'Mesa disponible', noTable: 'Sin mesa disponible',
    notify: 'Marcar como avisado', seat: 'Sentar ahora', cancel: 'Cancelar espera',
    notifiedHelp: 'El aviso solo cambia el estado en este navegador.',
    readOnly: 'Tu rol puede consultar la cola, pero no modificarla.',
  },
  en: {
    eyebrow: 'Waitlist', title: 'Walk-in demand, inside the same inventory.',
    body: 'Record the arrival, quote a wait and assign the first minimal combination that is actually free.',
    localOnly: 'Local notice · No real SMS or messages are sent', newEntry: 'Add to queue', name: 'Name',
    namePlaceholder: 'Guest name', contact: 'Phone (optional)', contactPlaceholder: '+34 600 000 000',
    party: 'Guests', date: 'Date', time: 'Requested time', quote: 'Quoted wait', minutes: 'min',
    add: 'Add to waitlist', active: 'Waiting now', history: 'Demo history', empty: 'Nobody is waiting.',
    waiting: 'Waiting', notified: 'Notified · demo', seated: 'Seated', cancelled: 'Cancelled',
    arrived: 'Arrived', requested: 'Requests', tableReady: 'Table available', noTable: 'No table available',
    notify: 'Mark as notified', seat: 'Seat now', cancel: 'Cancel wait',
    notifiedHelp: 'The notice only changes state in this browser.',
    readOnly: 'Your role can view the queue but cannot change it.',
  },
} as const;

const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const minutesFromTime = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export default function WaitlistView({
  locale,
  restaurant,
  entries,
  bookings,
  events = [],
  privateHires = [],
  initialDate,
  initialTime,
  canManage = true,
  onAdd,
  onTransition,
  onSeat,
}: WaitlistViewProps) {
  const copy = COPY[locale];
  const formId = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [quotedWaitMin, setQuotedWaitMin] = useState(20);
  const [notice, setNotice] = useState('');
  const tables = useMemo(() => new Map(restaurant.spaces.flatMap((space) => space.tables.map((table) => [table.id, table.name] as const))), [restaurant]);
  const activeEntries = entries.filter((entry) => entry.status === 'waiting' || entry.status === 'notified');
  const historyEntries = entries.filter((entry) => entry.status === 'seated' || entry.status === 'cancelled');

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage || !name.trim()) return;
    const stamp = Date.now();
    onAdd({
      id: `waitlist-${restaurant.id}-${stamp}`,
      restaurantId: restaurant.id,
      guest: { name: name.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) },
      partySize,
      requestedSlot: { date, startMin: time, durationMin: estimateDurationMin(partySize) },
      arrivedAt: new Date(stamp).toISOString(),
      quotedWaitMin,
      status: 'waiting',
    });
    setName('');
    setPhone('');
    setNotice(`${name.trim()} · ${copy.waiting}`);
  };

  const availabilityFor = (entry: WaitlistEntry) => tableAvailability(
    restaurant,
    bookings,
    events,
    privateHires,
    entry.requestedSlot,
    entry.partySize,
  )[0];

  return (
    <section className="rd-view" data-dashboard-view="espera">
      <header className="rd-view-header">
        <div><p className="rd-eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.body}</p></div>
        <Badge className="badge" data-tone="info"><BellRing size={14} aria-hidden="true" />{copy.localOnly}</Badge>
      </header>
      {!canManage && <p className="rd-role-warning"><BellRing size={16} aria-hidden="true" />{copy.readOnly}</p>}
      <p className="rd-live" role="status" aria-live="polite">{notice}</p>

      <div className="rd-waitlist-layout">
        <form className="rd-waitlist-form" onSubmit={add} data-waitlist-form>
          <h2><UserPlus size={18} aria-hidden="true" />{copy.newEntry}</h2>
          <label htmlFor={`${formId}-name`}><span>{copy.name}</span><input id={`${formId}-name`} required maxLength={120} value={name} placeholder={copy.namePlaceholder} disabled={!canManage} onChange={(event) => setName(event.target.value)} /></label>
          <label htmlFor={`${formId}-phone`}><span>{copy.contact}</span><input id={`${formId}-phone`} maxLength={40} value={phone} placeholder={copy.contactPlaceholder} disabled={!canManage} onChange={(event) => setPhone(event.target.value)} /></label>
          <div className="rd-waitlist-form__row">
            <label htmlFor={`${formId}-party`}><span>{copy.party}</span><input id={`${formId}-party`} type="number" min="1" max="40" required value={partySize} disabled={!canManage} onChange={(event) => setPartySize(Number(event.target.value))} /></label>
            <label htmlFor={`${formId}-quote`}><span>{copy.quote}</span><select id={`${formId}-quote`} value={quotedWaitMin} disabled={!canManage} onChange={(event) => setQuotedWaitMin(Number(event.target.value))}>{[0, 10, 20, 30, 45, 60, 90].map((minutes) => <option value={minutes} key={minutes}>{minutes} {copy.minutes}</option>)}</select></label>
          </div>
          <div className="rd-waitlist-form__row">
            <label htmlFor={`${formId}-date`}><span>{copy.date}</span><input id={`${formId}-date`} type="date" required value={date} disabled={!canManage} onChange={(event) => setDate(event.target.value)} /></label>
            <label htmlFor={`${formId}-time`}><span>{copy.time}</span><input id={`${formId}-time`} type="time" step="900" required value={timeLabel(time)} disabled={!canManage} onChange={(event) => setTime(minutesFromTime(event.target.value))} /></label>
          </div>
          <Button className="rd-primary-action" type="submit" disabled={!canManage}><UserPlus size={16} aria-hidden="true" />{copy.add}</Button>
        </form>

        <div className="rd-waitlist-queue">
          <div className="rd-waitlist-queue__title"><div><h2>{copy.active}</h2><p>{copy.notifiedHelp}</p></div><strong>{activeEntries.length}</strong></div>
          {activeEntries.length === 0 && <p className="rd-empty">{copy.empty}</p>}
          {activeEntries.map((entry) => {
            const option = availabilityFor(entry);
            const tableNames = option?.tableIds.map((tableId) => tables.get(tableId) ?? tableId).join(' + ');
            const arrival = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.arrivedAt));
            return (
              <article className="rd-waitlist-card" key={entry.id} data-waitlist-entry={entry.id} data-waitlist-status={entry.status}>
                <header><span className="rd-avatar" aria-hidden="true">{entry.guest.name.slice(0, 1).toUpperCase()}</span><div><h3>{entry.guest.name}</h3><p><UsersRound size={13} aria-hidden="true" />{entry.partySize} · <Clock3 size={13} aria-hidden="true" />{entry.quotedWaitMin} {copy.minutes}</p></div><Badge className="badge" data-tone={entry.status === 'notified' ? 'info' : 'warning'}>{copy[entry.status]}</Badge></header>
                <dl><div><dt>{copy.arrived}</dt><dd>{arrival}</dd></div><div><dt>{copy.requested}</dt><dd>{entry.requestedSlot.date} · {timeLabel(entry.requestedSlot.startMin)}</dd></div><div><dt>{option ? copy.tableReady : copy.noTable}</dt><dd>{tableNames ?? '—'}</dd></div></dl>
                <div className="rd-waitlist-actions">
                  {entry.status === 'waiting' && <Button variant="outline" type="button" data-waitlist-action="notified" disabled={!canManage} onClick={() => { onTransition(entry.id, 'notified'); setNotice(`${entry.guest.name} · ${copy.notified}`); }}><BellRing size={15} aria-hidden="true" />{copy.notify}</Button>}
                  <Button className="rd-primary-action" type="button" data-waitlist-action="seated" disabled={!canManage || option === undefined} onClick={() => { onSeat(entry.id, `walkin-${entry.id}`); setNotice(`${entry.guest.name} · ${copy.seated}`); }}><Armchair size={15} aria-hidden="true" />{option ? copy.seat : copy.noTable}</Button>
                  <Button className="danger" variant="destructive" type="button" data-waitlist-action="cancelled" disabled={!canManage} onClick={() => { onTransition(entry.id, 'cancelled'); setNotice(`${entry.guest.name} · ${copy.cancelled}`); }}><XCircle size={15} aria-hidden="true" />{copy.cancel}</Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {historyEntries.length > 0 && <section className="rd-waitlist-history"><h2>{copy.history}</h2>{historyEntries.map((entry) => <div key={entry.id} data-waitlist-history={entry.status}><span>{entry.guest.name} · {entry.partySize}</span><Badge className="badge" data-tone={entry.status === 'seated' ? 'success' : 'danger'}>{copy[entry.status]}</Badge></div>)}</section>}
    </section>
  );
}
