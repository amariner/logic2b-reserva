import {
  assertNoDoubleBooking,
  depositFor,
  estimateDurationMin,
  slotsOverlap,
  validateBooking,
  validateRestaurant,
  validateSlot,
  type DepositRecord,
  type PrivateHire,
  type Restaurant,
  type RestaurantEvent,
  type TableBooking,
  type TimeSlot,
} from './index';

export interface BookingAmendment {
  slot: TimeSlot;
  partySize: number;
  tableIds: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown, maximum = 120): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
const isInteger = (value: unknown, minimum: number, maximum = Number.MAX_SAFE_INTEGER): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const isTimestamp = (value: unknown): value is string => typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => isText(item));
const isOneOf = (value: unknown, allowed: readonly string[]): value is string => typeof value === 'string' && allowed.includes(value);

function isSlot(value: unknown): value is TimeSlot {
  return isRecord(value) && typeof value.date === 'string' && isInteger(value.startMin, 0, 1439)
    && isInteger(value.durationMin, 1) && validateSlot(value as unknown as TimeSlot).length === 0;
}

function isDeposit(value: unknown, partySize: number): value is DepositRecord {
  if (!isRecord(value) || !isText(value.id) || !isTimestamp(value.termsAcceptedAt) || !isOneOf(value.status, ['held', 'released', 'charged'])) return false;
  const breakdown = value.breakdown;
  if (!isRecord(breakdown) || !isOneOf(breakdown.policyKind, ['none', 'card_hold', 'prepay'])) return false;
  if (breakdown.partySize !== partySize || !isInteger(breakdown.pricePerPersonCents, 0) || !isInteger(breakdown.menuSubtotalCents, 0)
    || !isInteger(breakdown.amountCents, 0) || !isInteger(breakdown.percentageBps, 0, 10_000)) return false;
  const expected = depositFor({ kind: breakdown.policyKind as DepositRecord['breakdown']['policyKind'], menuPercentageBps: breakdown.percentageBps }, partySize, breakdown.pricePerPersonCents);
  return expected.menuSubtotalCents === breakdown.menuSubtotalCents && expected.amountCents === breakdown.amountCents
    && expected.percentageBps === breakdown.percentageBps;
}

function isBooking(value: unknown): value is TableBooking {
  if (!isRecord(value) || !isText(value.id) || !isText(value.restaurantId) || !isSlot(value.slot) || !isInteger(value.partySize, 1, 40)) return false;
  if (!isStringArray(value.tableIds) || value.tableIds.length === 0 || new Set(value.tableIds).size !== value.tableIds.length) return false;
  if (!isOneOf(value.status, ['pending', 'confirmed', 'seated', 'finished', 'cancelled', 'no_show']) || !isOneOf(value.source, ['fixture', 'widget', 'phone', 'walkin'])) return false;
  if (!isRecord(value.guest) || !isText(value.guest.name)) return false;
  if (value.guest.email !== undefined && (typeof value.guest.email !== 'string' || !value.guest.email.includes('@') || value.guest.email.length > 200)) return false;
  if (value.guest.phone !== undefined && (typeof value.guest.phone !== 'string' || value.guest.phone.length > 40)) return false;
  return (value.menuId === undefined || isText(value.menuId)) && (value.bookedAt === undefined || isTimestamp(value.bookedAt))
    && (value.deposit === undefined || isDeposit(value.deposit, value.partySize));
}

function isRestaurant(value: unknown): value is Restaurant {
  if (!isRecord(value) || !isText(value.id) || !isText(value.organizationId) || !isText(value.name)) return false;
  if (!Array.isArray(value.spaces) || !value.spaces.every((space: unknown) => isRecord(space) && isText(space.id) && isText(space.name)
    && typeof space.privatizable === 'boolean' && Array.isArray(space.tables) && space.tables.every((table: unknown) => isRecord(table)
      && isText(table.id) && isText(table.name) && isInteger(table.minSeats, 1) && isInteger(table.maxSeats, 1) && isStringArray(table.combinableWith)))) return false;
  if (!Array.isArray(value.menus) || !value.menus.every((menu: unknown) => isRecord(menu) && isText(menu.id) && isText(menu.name)
    && isInteger(menu.pricePerPersonCents, 0) && isStringArray(menu.courses) && typeof menu.bookableOnline === 'boolean')) return false;
  if (!Array.isArray(value.shifts) || !value.shifts.every((shift: unknown) => isRecord(shift) && isText(shift.id)
    && (shift.kind === 'lunch' || shift.kind === 'dinner') && isInteger(shift.firstSeatingMin, 0, 1439) && isInteger(shift.lastSeatingMin, 0, 1439))) return false;
  return validateRestaurant(value as unknown as Restaurant).length === 0;
}

function isEvent(value: unknown): value is RestaurantEvent {
  return isRecord(value) && isText(value.id) && isText(value.restaurantId) && isText(value.name) && isSlot(value.slot)
    && isInteger(value.capacity, 1) && isInteger(value.soldSeats, 0, value.capacity) && isInteger(value.priceCents, 0)
    && isStringArray(value.consumesTableIds) && value.consumesTableIds.length > 0 && new Set(value.consumesTableIds).size === value.consumesTableIds.length
    && isOneOf(value.status, ['draft', 'published', 'soldout', 'done']);
}

function isHire(value: unknown): value is PrivateHire {
  if (!isRecord(value) || !isText(value.id) || !isText(value.restaurantId) || !isText(value.spaceId) || !isSlot(value.slot)
    || !isOneOf(value.status, ['requested', 'proposed', 'deposit_paid', 'blocked'])) return false;
  if (value.proposal === undefined) return true;
  const proposal = value.proposal;
  return isRecord(proposal) && isText(proposal.menuId) && isInteger(proposal.pricePerPersonCents, 0)
    && isInteger(proposal.minimumGuests, 1) && isInteger(proposal.depositCents, 0, proposal.pricePerPersonCents * proposal.minimumGuests);
}

/** Explicit field order makes persisted object-key ordering irrelevant. */
function bookingSnapshot(booking: TableBooking): string {
  const deposit = booking.deposit;
  return JSON.stringify([
    booking.id, booking.restaurantId, [...booking.tableIds].sort(),
    booking.slot.date, booking.slot.startMin, booking.slot.durationMin,
    booking.partySize, booking.status, booking.source, booking.bookedAt ?? null,
    booking.guest.name, booking.guest.email ?? null, booking.guest.phone ?? null,
    booking.menuId ?? null,
    deposit === undefined ? null : [
      deposit.id, deposit.status, deposit.termsAcceptedAt,
      deposit.breakdown.policyKind, deposit.breakdown.partySize, deposit.breakdown.pricePerPersonCents,
      deposit.breakdown.menuSubtotalCents, deposit.breakdown.percentageBps, deposit.breakdown.amountCents,
    ],
  ]);
}

function validatedAmendment(
  restaurant: Restaurant,
  original: TableBooking,
  changes: BookingAmendment,
  bookings: readonly TableBooking[],
  events: readonly RestaurantEvent[],
  hires: readonly PrivateHire[],
): TableBooking | null {
  try {
    if (!isRestaurant(restaurant) || !isBooking(original) || !['pending', 'confirmed'].includes(original.status)) return null;
    if (!isRecord(changes) || !isSlot(changes.slot) || !isInteger(changes.partySize, 1, 40) || !isStringArray(changes.tableIds)) return null;
    if (!Array.isArray(bookings) || !bookings.every(isBooking) || !Array.isArray(events) || !events.every(isEvent) || !Array.isArray(hires) || !hires.every(isHire)) return null;
    const matches = bookings.filter((booking) => booking.id === original.id);
    if (matches.length !== 1 || bookingSnapshot(matches[0]) !== bookingSnapshot(original)) return null;
    const current = matches[0];
    const partyChanged = changes.partySize !== current.partySize;
    if (current.deposit !== undefined && (partyChanged || changes.slot.date !== current.slot.date
      || changes.slot.startMin !== current.slot.startMin || changes.slot.durationMin !== current.slot.durationMin)) return null;
    const candidate: TableBooking = {
      ...current,
      tableIds: [...changes.tableIds],
      slot: { ...changes.slot, durationMin: partyChanged ? estimateDurationMin(changes.partySize) : current.slot.durationMin },
      partySize: changes.partySize,
      guest: { ...current.guest },
      ...(current.deposit === undefined ? {} : { deposit: { ...current.deposit, breakdown: { ...current.deposit.breakdown } } }),
    };
    if (!isBooking(candidate) || validateBooking(candidate, restaurant).length > 0) return null;
    if (!restaurant.shifts.some((shift) => candidate.slot.startMin >= shift.firstSeatingMin && candidate.slot.startMin <= shift.lastSeatingMin)) return null;

    const sharesTables = (tableIds: readonly string[]) => tableIds.some((tableId) => candidate.tableIds.includes(tableId));
    const otherBookings = bookings.filter((booking) => booking.id !== current.id && slotsOverlap(booking.slot, candidate.slot) && sharesTables(booking.tableIds));
    const otherEvents = events.filter((event) => slotsOverlap(event.slot, candidate.slot) && sharesTables(event.consumesTableIds));
    const otherHires = hires.filter((hire) => slotsOverlap(hire.slot, candidate.slot)
      && sharesTables(restaurant.spaces.find((space) => space.id === hire.spaceId)?.tables.map((table) => table.id) ?? []));
    assertNoDoubleBooking(restaurant, [...otherBookings, candidate], otherEvents, otherHires);
    return candidate;
  } catch {
    // Persisted or external runtime values must never crash an edit in progress.
    return null;
  }
}

/** Availability for the editor, including a valid unchanged assignment. */
export function canAmendBookingAssignment(
  restaurant: Restaurant,
  original: TableBooking,
  changes: BookingAmendment,
  bookings: readonly TableBooking[],
  events: readonly RestaurantEvent[] = [],
  hires: readonly PrivateHire[] = [],
): boolean {
  return validatedAmendment(restaurant, original, changes, bookings, events, hires) !== null;
}

/** Amend only the captured booking; reject stale snapshots and unchanged data. */
export function amendBooking(
  restaurant: Restaurant,
  original: TableBooking,
  changes: BookingAmendment,
  bookings: readonly TableBooking[],
  events: readonly RestaurantEvent[] = [],
  hires: readonly PrivateHire[] = [],
): TableBooking | null {
  const amended = validatedAmendment(restaurant, original, changes, bookings, events, hires);
  return amended === null || bookingSnapshot(amended) === bookingSnapshot(original) ? null : amended;
}
