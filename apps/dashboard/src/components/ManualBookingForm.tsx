import { Phone, Save, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  estimateDurationMin,
  seatingTimes,
  tableAvailability,
  type PrivateHire,
  type Restaurant,
  type RestaurantEvent,
  type TableBooking,
  type TableOption,
} from '@logic-reserva/domain';
import { Button } from '@logic-reserva/ui/button';
import type { DashboardLocale } from '../content';
import { MANUAL_BOOKING_COPY } from '../manual-booking-content';

export interface ManualBookingFormProps {
  locale: DashboardLocale;
  restaurant: Restaurant;
  bookings: readonly TableBooking[];
  events?: readonly RestaurantEvent[];
  privateHires?: readonly PrivateHire[];
  initialDate: string;
  canManage: boolean;
  onSave: (booking: TableBooking) => boolean;
  onCancel: () => void;
}

interface BookingCriteria {
  date: string;
  shiftId: string;
  startMin: string;
  partySize: string;
}

type FormError = 'invalidName' | 'invalidEmail' | 'invalidPhone' | 'invalidDate' | 'invalidParty' | 'invalidTime' | 'invalidMenu' | 'missingTable' | 'inventoryChanged' | 'saveConflict' | 'readOnly';

const EMPTY_EVENTS: readonly RestaurantEvent[] = [];
const EMPTY_HIRES: readonly PrivateHire[] = [];
const optionKey = (option: TableOption) => JSON.stringify([...option.tableIds].sort());
const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validCriteria(criteria: BookingCriteria, restaurant: Restaurant): boolean {
  const shift = restaurant.shifts.find((candidate) => candidate.id === criteria.shiftId);
  const partySize = Number(criteria.partySize);
  return validDate(criteria.date)
    && Number.isInteger(partySize) && partySize >= 1 && partySize <= 40
    && criteria.startMin !== '' && shift !== undefined && seatingTimes(shift).includes(Number(criteria.startMin));
}

export default function ManualBookingForm({
  locale,
  restaurant,
  bookings,
  events = EMPTY_EVENTS,
  privateHires = EMPTY_HIRES,
  initialDate,
  canManage,
  onSave,
  onCancel,
}: ManualBookingFormProps) {
  const copy = MANUAL_BOOKING_COPY[locale];
  const formId = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [menuId, setMenuId] = useState('');
  const [error, setError] = useState<FormError | null>(null);

  const availableFor = (criteria: BookingCriteria) => validCriteria(criteria, restaurant)
    ? tableAvailability(restaurant, bookings, events, privateHires, {
      date: criteria.date,
      startMin: Number(criteria.startMin),
      durationMin: estimateDurationMin(Number(criteria.partySize)),
    }, Number(criteria.partySize))
    : [];

  // The initial suggestion is the first free seating time. Subsequent inventory
  // changes must never silently move a guest to a different table or time.
  const [initial] = useState(() => {
    const fallback: BookingCriteria = {
      date: initialDate,
      shiftId: restaurant.shifts[0]?.id ?? '',
      startMin: restaurant.shifts[0] ? String(seatingTimes(restaurant.shifts[0])[0] ?? '') : '',
      partySize: '2',
    };
    for (const shift of restaurant.shifts) {
      for (const startMin of seatingTimes(shift)) {
        const criteria = { ...fallback, shiftId: shift.id, startMin: String(startMin) };
        const option = availableFor(criteria)[0];
        if (option) return { criteria, selectedKey: optionKey(option) };
      }
    }
    return { criteria: fallback, selectedKey: '' };
  });
  const [criteria, setCriteria] = useState(initial.criteria);
  const [selectedKey, setSelectedKey] = useState(initial.selectedKey);
  const options = useMemo(() => validCriteria(criteria, restaurant)
    ? tableAvailability(restaurant, bookings, events, privateHires, {
      date: criteria.date,
      startMin: Number(criteria.startMin),
      durationMin: estimateDurationMin(Number(criteria.partySize)),
    }, Number(criteria.partySize))
    : [], [restaurant, bookings, events, privateHires, criteria]);
  const selectedOption = options.find((option) => optionKey(option) === selectedKey);
  const shift = restaurant.shifts.find((candidate) => candidate.id === criteria.shiftId);
  const times = shift ? seatingTimes(shift) : [];
  const duration = estimateDurationMin(Number(criteria.partySize));
  const isValidCriteria = validCriteria(criteria, restaurant);
  const tables = useMemo(() => new Map(restaurant.spaces.flatMap((space) => space.tables.map((table) => [table.id, table.name] as const))), [restaurant]);
  const tableDescription = (option: TableOption) => `${restaurant.spaces.find((space) => space.id === option.spaceId)?.name ?? option.spaceId} · ${option.tableIds.map((id) => tables.get(id) ?? id).join(' + ')}`;

  useEffect(() => { if (canManage) nameInput.current?.focus(); }, [canManage]);
  useEffect(() => {
    if (selectedKey && selectedOption === undefined) {
      setSelectedKey('');
      setError('inventoryChanged');
    }
  }, [selectedKey, selectedOption]);

  const updateCriteria = (patch: Partial<BookingCriteria>) => {
    const next = { ...criteria, ...patch };
    const nextOption = availableFor(next)[0];
    setCriteria(next);
    setSelectedKey(nextOption ? optionKey(nextOption) : '');
    setError(null);
  };

  const showError = (nextError: FormError, field?: string) => {
    setError(nextError);
    if (field) document.getElementById(`${formId}-${field}`)?.focus();
    else requestAnimationFrame(() => errorMessage.current?.focus());
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return showError('readOnly');
    if (!name.trim() || name.trim().length > 120) return showError('invalidName', 'name');
    if (phone.trim().length > 40) return showError('invalidPhone', 'phone');
    if (email.trim() && (!emailInput.current?.validity.valid || email.trim().length > 200)) return showError('invalidEmail', 'email');
    if (!validDate(criteria.date)) return showError('invalidDate', 'date');
    const partySize = Number(criteria.partySize);
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 40) return showError('invalidParty', 'party');
    if (!isValidCriteria) return showError('invalidTime', 'time');
    if (menuId && !restaurant.menus.some((menu) => menu.id === menuId)) return showError('invalidMenu', 'menu');
    const currentOption = availableFor(criteria).find((option) => optionKey(option) === selectedKey);
    if (!currentOption) return showError(selectedKey ? 'inventoryChanged' : 'missingTable', 'table');
    const booking: TableBooking = {
      id: crypto.randomUUID(),
      restaurantId: restaurant.id,
      tableIds: [...currentOption.tableIds],
      slot: { date: criteria.date, startMin: Number(criteria.startMin), durationMin: duration },
      partySize,
      status: 'confirmed',
      source: 'phone',
      bookedAt: new Date().toISOString(),
      guest: { name: name.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}), ...(email.trim() ? { email: email.trim() } : {}) },
      ...(menuId ? { menuId } : {}),
    };
    if (!onSave(booking)) showError('saveConflict');
  };

  return (
    <form className="rd-manual-booking" aria-labelledby={`${formId}-title`} aria-describedby={`${formId}-local`} data-manual-booking-form noValidate onSubmit={save}>
      <header className="rd-manual-booking__header">
        <h2 id={`${formId}-title`}><Phone size={18} aria-hidden="true" />{copy.title}</h2>
        <p>{copy.body}</p>
      </header>
      <p id={`${formId}-local`} className="rd-manual-booking__notice">{copy.localOnly}</p>
      {!canManage && <p className="rd-manual-booking__notice">{copy.readOnly}</p>}
      <div className="rd-manual-booking__fields">
        <label className="rd-manual-booking__field rd-manual-booking__field--wide" htmlFor={`${formId}-name`}>
          <span>{copy.name}</span>
          <input ref={nameInput} id={`${formId}-name`} name="guestName" autoComplete="name" required maxLength={120} value={name} aria-invalid={error === 'invalidName' || undefined} disabled={!canManage} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-phone`}>
          <span>{copy.phone}</span>
          <input id={`${formId}-phone`} name="phone" type="tel" autoComplete="tel" maxLength={40} value={phone} aria-invalid={error === 'invalidPhone' || undefined} disabled={!canManage} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-email`}>
          <span>{copy.email}</span>
          <input ref={emailInput} id={`${formId}-email`} name="email" type="email" autoComplete="email" maxLength={200} value={email} aria-invalid={error === 'invalidEmail' || undefined} disabled={!canManage} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-date`}>
          <span>{copy.date}</span>
          <input id={`${formId}-date`} name="date" type="date" required value={criteria.date} aria-invalid={error === 'invalidDate' || undefined} disabled={!canManage} onChange={(event) => updateCriteria({ date: event.target.value })} />
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-shift`}>
          <span>{copy.shift}</span>
          <select id={`${formId}-shift`} name="shift" required value={criteria.shiftId} disabled={!canManage || restaurant.shifts.length === 0} onChange={(event) => {
            const nextShift = restaurant.shifts.find((candidate) => candidate.id === event.target.value);
            updateCriteria({ shiftId: event.target.value, startMin: nextShift ? String(seatingTimes(nextShift)[0] ?? '') : '' });
          }}>
            {restaurant.shifts.map((candidate) => <option key={candidate.id} value={candidate.id}>{copy[candidate.kind]} · {timeLabel(candidate.firstSeatingMin)}–{timeLabel(candidate.lastSeatingMin)}</option>)}
          </select>
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-time`}>
          <span>{copy.time}</span>
          <select id={`${formId}-time`} name="time" required value={criteria.startMin} aria-invalid={error === 'invalidTime' || undefined} disabled={!canManage || times.length === 0} onChange={(event) => updateCriteria({ startMin: event.target.value })}>
            {times.map((time) => <option key={time} value={time}>{timeLabel(time)}</option>)}
          </select>
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-party`}>
          <span>{copy.party}</span>
          <input id={`${formId}-party`} name="partySize" type="number" inputMode="numeric" min="1" max="40" step="1" required value={criteria.partySize} aria-invalid={error === 'invalidParty' || undefined} disabled={!canManage} onChange={(event) => updateCriteria({ partySize: event.target.value })} />
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-menu`}>
          <span>{copy.menu}</span>
          <select id={`${formId}-menu`} name="menu" value={menuId} aria-invalid={error === 'invalidMenu' || undefined} disabled={!canManage} onChange={(event) => { setMenuId(event.target.value); setError(null); }}>
            <option value="">{copy.noMenu}</option>
            {restaurant.menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
          </select>
        </label>
        <label className="rd-manual-booking__field rd-manual-booking__field--wide" htmlFor={`${formId}-table`}>
          <span>{copy.table}</span>
          <select id={`${formId}-table`} name="table" required value={selectedOption ? selectedKey : ''} aria-invalid={error === 'inventoryChanged' || error === 'missingTable' || undefined} disabled={!canManage || options.length === 0} onChange={(event) => { setSelectedKey(event.target.value); setError(null); }}>
            <option value="" disabled>{copy.chooseTable}</option>
            {options.map((option) => <option key={optionKey(option)} value={optionKey(option)}>{tableDescription(option)} · {option.minSeats}–{option.maxSeats} {copy.capacity}</option>)}
          </select>
        </label>
      </div>
      {restaurant.shifts.length === 0 && <p className="rd-manual-booking__notice" role="status">{copy.noShifts}</p>}
      {isValidCriteria && options.length === 0 && <p className="rd-manual-booking__notice" role="status">{copy.noTables}</p>}
      <dl className="rd-manual-booking__summary" aria-live="polite">
        <div><dt>{copy.duration}</dt><dd>{isValidCriteria ? `${duration} ${copy.minutes} · ${timeLabel(Number(criteria.startMin))}–${timeLabel(Number(criteria.startMin) + duration)}` : '—'}</dd></div>
        <div><dt>{copy.assignment}</dt><dd>{selectedOption ? tableDescription(selectedOption) : copy.pendingAssignment}</dd></div>
      </dl>
      {error && <p ref={errorMessage} className="rd-manual-booking__error" role="alert" tabIndex={-1}>{copy[error]}</p>}
      <div className="rd-manual-booking__actions">
        <Button type="submit" className="rd-primary-action" disabled={!canManage || restaurant.shifts.length === 0 || (isValidCriteria && options.length === 0)}><Save size={16} aria-hidden="true" />{copy.save}</Button>
        <Button type="button" variant="outline" onClick={onCancel}><X size={16} aria-hidden="true" />{copy.cancel}</Button>
      </div>
    </form>
  );
}
