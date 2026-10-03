import { Pencil, Save, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  canAmendBookingAssignment,
  estimateDurationMin,
  seatingTimes,
  tableAvailability,
  validateSlot,
  type BookingAmendment,
  type PrivateHire,
  type Restaurant,
  type RestaurantEvent,
  type TableBooking,
} from '@logic-reserva/domain';
import { Button } from '@logic-reserva/ui/button';
import type { DashboardLocale } from '../content';
import { BOOKING_AMENDMENT_COPY } from '../booking-amendment-content';

export interface BookingAmendmentFormProps {
  locale: DashboardLocale;
  restaurant: Restaurant;
  booking: TableBooking;
  bookings: readonly TableBooking[];
  events?: readonly RestaurantEvent[];
  privateHires?: readonly PrivateHire[];
  canManage: boolean;
  onSave: (changes: BookingAmendment) => boolean;
  onCancel: () => void;
}

interface AmendmentCriteria {
  date: string;
  shiftId: string;
  startMin: string;
  partySize: string;
}

type FormError = 'readOnly' | 'closedBooking' | 'invalidDate' | 'invalidParty' | 'invalidTime' | 'missingTable' | 'assignmentChanged' | 'saveFailed';

const EMPTY_EVENTS: readonly RestaurantEvent[] = [];
const EMPTY_HIRES: readonly PrivateHire[] = [];
const tableKey = (tableIds: readonly string[]) => JSON.stringify([...tableIds].sort());
const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function validDate(date: string): boolean {
  return validateSlot({ date, startMin: 0, durationMin: 15 }).length === 0;
}

function validCriteria(criteria: AmendmentCriteria, restaurant: Restaurant): boolean {
  const shift = restaurant.shifts.find((candidate) => candidate.id === criteria.shiftId);
  const partySize = Number(criteria.partySize);
  return validDate(criteria.date)
    && Number.isInteger(partySize) && partySize >= 1 && partySize <= 40
    && criteria.startMin !== '' && shift !== undefined && seatingTimes(shift).includes(Number(criteria.startMin));
}

export default function BookingAmendmentForm({
  locale,
  restaurant,
  booking,
  bookings,
  events = EMPTY_EVENTS,
  privateHires = EMPTY_HIRES,
  canManage,
  onSave,
  onCancel,
}: BookingAmendmentFormProps) {
  const copy = BOOKING_AMENDMENT_COPY[locale];
  const formId = useId();
  const dateInput = useRef<HTMLInputElement>(null);
  const tableInput = useRef<HTMLSelectElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  // Preserve the snapshot displayed when editing opened; live inventory changes
  // must not rewrite either the original details or the user's proposed change.
  const [original] = useState(booking);
  const depositLocked = original.deposit !== undefined;
  const editableStatus = original.status === 'pending' || original.status === 'confirmed';
  const canEdit = canManage && editableStatus;
  const [criteria, setCriteria] = useState<AmendmentCriteria>(() => ({
    date: original.slot.date,
    shiftId: restaurant.shifts.find((shift) => seatingTimes(shift).includes(original.slot.startMin))?.id ?? '',
    startMin: String(original.slot.startMin),
    partySize: String(original.partySize),
  }));
  const [selectedKey, setSelectedKey] = useState(() => tableKey(original.tableIds));
  const [error, setError] = useState<FormError | null>(null);
  const partySize = Number(criteria.partySize);
  const duration = partySize === original.partySize ? original.slot.durationMin : estimateDurationMin(partySize);
  const slot = useMemo(() => ({ date: criteria.date, startMin: Number(criteria.startMin), durationMin: duration }), [criteria.date, criteria.startMin, duration]);
  const isValidCriteria = validCriteria(criteria, restaurant);
  const originalKey = tableKey(original.tableIds);
  const conditionsChanged = slot.date !== original.slot.date
    || slot.startMin !== original.slot.startMin
    || slot.durationMin !== original.slot.durationMin
    || partySize !== original.partySize;
  const hasChanges = conditionsChanged || selectedKey !== originalKey;
  const shift = restaurant.shifts.find((candidate) => candidate.id === criteria.shiftId);
  const times = shift ? seatingTimes(shift) : [];
  const tables = useMemo(() => new Map(restaurant.spaces.flatMap((space) => space.tables.map((table) => [table.id, { ...table, spaceId: space.id }] as const))), [restaurant]);

  const options = useMemo(() => {
    if (!isValidCriteria) return [];
    const remainingBookings = bookings.filter((candidate) => candidate.id !== original.id || candidate.restaurantId !== original.restaurantId);
    const available = tableAvailability(restaurant, remainingBookings, events, privateHires, slot, partySize);
    // Existing assignments can legitimately use more tables than the minimal
    // suggestions. Keep that option whenever the shared domain validator accepts it.
    if (!available.some((option) => tableKey(option.tableIds) === originalKey)
      && canAmendBookingAssignment(restaurant, original, { slot, partySize, tableIds: original.tableIds }, bookings, events, privateHires)) {
      const originalTables = original.tableIds.flatMap((id) => {
        const table = tables.get(id);
        return table ? [table] : [];
      });
      available.unshift({
        spaceId: originalTables[0]?.spaceId ?? '',
        tableIds: [...original.tableIds],
        minSeats: originalTables.reduce((sum, table) => sum + table.minSeats, 0),
        maxSeats: originalTables.reduce((sum, table) => sum + table.maxSeats, 0),
      });
    }
    return available;
  }, [isValidCriteria, bookings, original, restaurant, events, privateHires, slot, partySize, originalKey, tables]);
  const selectedOption = options.find((option) => tableKey(option.tableIds) === selectedKey);
  const tableDescription = (tableIds: readonly string[]) => {
    const spaceId = tables.get(tableIds[0])?.spaceId;
    const space = restaurant.spaces.find((candidate) => candidate.id === spaceId);
    return `${space?.name ? `${space.name} · ` : ''}${tableIds.map((id) => tables.get(id)?.name ?? id).join(' + ')}`;
  };

  useEffect(() => {
    if (!canEdit) return;
    if (depositLocked) tableInput.current?.focus();
    else dateInput.current?.focus();
  }, [canEdit, depositLocked]);

  useEffect(() => {
    if (isValidCriteria && selectedKey && selectedOption === undefined) {
      setSelectedKey('');
      setError('assignmentChanged');
    }
  }, [isValidCriteria, selectedKey, selectedOption]);

  const updateCriteria = (patch: Partial<AmendmentCriteria>) => {
    if (depositLocked) return;
    setCriteria((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const showError = (nextError: FormError) => {
    setError(nextError);
    requestAnimationFrame(() => errorMessage.current?.focus());
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return showError('readOnly');
    if (!editableStatus) return showError('closedBooking');
    if (!validDate(criteria.date)) return showError('invalidDate');
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 40) return showError('invalidParty');
    if (!isValidCriteria) return showError('invalidTime');
    if (!selectedOption) return showError('missingTable');
    if (!hasChanges) return;
    const changes: BookingAmendment = { slot, partySize, tableIds: [...selectedOption.tableIds] };
    if (!canAmendBookingAssignment(restaurant, original, changes, bookings, events, privateHires) || !onSave(changes)) showError('saveFailed');
  };

  return (
    <form className="rd-manual-booking" aria-labelledby={`${formId}-title`} aria-describedby={`${formId}-local`} data-booking-amendment-form noValidate onSubmit={save}>
      <header className="rd-manual-booking__header">
        <h2 id={`${formId}-title`}><Pencil size={18} aria-hidden="true" />{copy.title} · {original.guest.name}</h2>
        <p>{copy.body}</p>
      </header>
      <p id={`${formId}-local`} className="rd-manual-booking__notice">{copy.localOnly}</p>
      {!canManage && <p className="rd-manual-booking__notice">{copy.readOnly}</p>}
      {!editableStatus && <p className="rd-manual-booking__notice">{copy.closedBooking}</p>}
      {depositLocked && <p id={`${formId}-deposit`} className="rd-manual-booking__notice" data-amendment-deposit-lock>{copy.depositLocked}</p>}
      <div className="rd-manual-booking__fields">
        <label className="rd-manual-booking__field" htmlFor={`${formId}-date`}>
          <span>{copy.date}</span>
          <input ref={dateInput} id={`${formId}-date`} name="date" type="date" required value={criteria.date} aria-invalid={error === 'invalidDate' || undefined} aria-describedby={depositLocked ? `${formId}-deposit` : undefined} disabled={!canEdit || depositLocked} onChange={(event) => updateCriteria({ date: event.target.value })} />
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-shift`}>
          <span>{copy.shift}</span>
          <select id={`${formId}-shift`} name="shift" required value={criteria.shiftId} disabled={!canEdit || depositLocked || restaurant.shifts.length === 0} aria-describedby={depositLocked ? `${formId}-deposit` : undefined} onChange={(event) => {
            const nextShift = restaurant.shifts.find((candidate) => candidate.id === event.target.value);
            updateCriteria({ shiftId: event.target.value, startMin: nextShift ? String(seatingTimes(nextShift)[0] ?? '') : '' });
          }}>
            {criteria.shiftId === '' && <option value="" disabled>—</option>}
            {restaurant.shifts.map((candidate) => <option key={candidate.id} value={candidate.id}>{copy[candidate.kind]} · {timeLabel(candidate.firstSeatingMin)}–{timeLabel(candidate.lastSeatingMin)}</option>)}
          </select>
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-time`}>
          <span>{copy.time}</span>
          <select id={`${formId}-time`} name="time" required value={criteria.startMin} aria-invalid={error === 'invalidTime' || undefined} aria-describedby={depositLocked ? `${formId}-deposit` : undefined} disabled={!canEdit || depositLocked || times.length === 0} onChange={(event) => updateCriteria({ startMin: event.target.value })}>
            {!times.includes(Number(criteria.startMin)) && <option value={criteria.startMin} disabled>{timeLabel(Number(criteria.startMin))}</option>}
            {times.map((time) => <option key={time} value={time}>{timeLabel(time)}</option>)}
          </select>
        </label>
        <label className="rd-manual-booking__field" htmlFor={`${formId}-party`}>
          <span>{copy.party}</span>
          <input id={`${formId}-party`} name="partySize" type="number" inputMode="numeric" min="1" max="40" step="1" required value={criteria.partySize} aria-invalid={error === 'invalidParty' || undefined} aria-describedby={depositLocked ? `${formId}-deposit` : undefined} disabled={!canEdit || depositLocked} onChange={(event) => updateCriteria({ partySize: event.target.value })} />
        </label>
        <label className="rd-manual-booking__field rd-manual-booking__field--wide" htmlFor={`${formId}-table`}>
          <span>{copy.table}</span>
          <select ref={tableInput} id={`${formId}-table`} name="table" required value={selectedOption ? selectedKey : ''} aria-invalid={error === 'assignmentChanged' || error === 'missingTable' || undefined} disabled={!canEdit || options.length === 0} onChange={(event) => { setSelectedKey(event.target.value); setError(null); }}>
            <option value="" disabled>{copy.chooseTable}</option>
            {options.map((option) => <option key={tableKey(option.tableIds)} value={tableKey(option.tableIds)}>{tableDescription(option.tableIds)} · {option.minSeats}–{option.maxSeats} {copy.capacity}</option>)}
          </select>
        </label>
      </div>
      {restaurant.shifts.length === 0 && <p className="rd-manual-booking__notice">{copy.noShifts}</p>}
      {isValidCriteria && options.length === 0 && <p className="rd-manual-booking__notice">{depositLocked ? copy.noTablesWithDeposit : copy.noTables}</p>}
      <dl className="rd-manual-booking__summary" aria-live="polite" aria-atomic="true">
        <div data-amendment-before>
          <dt>{copy.before}</dt>
          <dd><time dateTime={original.slot.date}>{original.slot.date}</time> · {timeLabel(original.slot.startMin)}<br />{original.partySize} {copy.people} · {copy.duration}: {original.slot.durationMin} {copy.minutes}<br />{tableDescription(original.tableIds)}</dd>
        </div>
        <div data-amendment-after>
          <dt>{copy.after}</dt>
          <dd>{isValidCriteria ? <><time dateTime={criteria.date}>{criteria.date}</time> · {timeLabel(slot.startMin)}<br />{partySize} {copy.people} · {copy.duration}: {duration} {copy.minutes}</> : copy.incompleteConditions}<br />{selectedOption ? tableDescription(selectedOption.tableIds) : copy.pendingAssignment}</dd>
        </div>
      </dl>
      {restaurant.id === 'solane' && isValidCriteria && conditionsChanged && <p className="rd-manual-booking__notice" data-amendment-attendance-warning>{copy.attendanceWarning}</p>}
      {!hasChanges && <p className="rd-manual-booking__notice">{copy.noChanges}</p>}
      {error && <p ref={errorMessage} className="rd-manual-booking__error" role="alert" tabIndex={-1}>{depositLocked && error === 'assignmentChanged' ? copy.assignmentChangedWithDeposit : copy[error]}</p>}
      <div className="rd-manual-booking__actions">
        <Button type="submit" className="rd-primary-action" data-amendment-save disabled={!canEdit || !hasChanges || (isValidCriteria && options.length === 0)}><Save size={16} aria-hidden="true" />{copy.save}</Button>
        <Button type="button" variant="outline" data-amendment-cancel onClick={onCancel}><X size={16} aria-hidden="true" />{copy.cancel}</Button>
      </div>
    </form>
  );
}
