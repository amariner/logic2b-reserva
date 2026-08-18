// Dominio puro de Logic Reserva: sin I/O, sin framework, sin dependencias.
// Convenciones heredadas de la familia logic2b:
// - Dinero en céntimos enteros (EUR), nunca decimales.
// - Fechas ISO YYYY-MM-DD sin zona horaria.
// - Rangos temporales semiabiertos [start, end).
// La diferencia clave frente a estancia/camp: aquí se reserva por FRANJA HORARIA
// dentro de un día de servicio (slots de 15 minutos), no por noches.

// ── Núcleo temporal ────────────────────────────────────────────────

export const SLOT_STEP_MIN = 15;

export type ServiceKind = 'lunch' | 'dinner';

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  startMin: number; // minutos desde las 00:00, múltiplo de SLOT_STEP_MIN
  durationMin: number; // múltiplo de SLOT_STEP_MIN, > 0
}

export interface Shift {
  id: string;
  kind: ServiceKind;
  firstSeatingMin: number;
  lastSeatingMin: number;
}

export function slotEnd(slot: TimeSlot): number {
  return slot.startMin + slot.durationMin;
}

export function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  if (a.date !== b.date) return false;
  return a.startMin < slotEnd(b) && b.startMin < slotEnd(a);
}

export function validateSlot(slot: TimeSlot): string[] {
  const errors: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) errors.push('date must be ISO YYYY-MM-DD');
  if (slot.startMin % SLOT_STEP_MIN !== 0) errors.push(`startMin must be a multiple of ${SLOT_STEP_MIN}`);
  if (slot.durationMin <= 0 || slot.durationMin % SLOT_STEP_MIN !== 0)
    errors.push(`durationMin must be a positive multiple of ${SLOT_STEP_MIN}`);
  return errors;
}

// Duración estimada de mesa por tamaño de grupo (rotación).
export function estimateDurationMin(partySize: number): number {
  if (partySize <= 2) return 90;
  if (partySize <= 4) return 105;
  if (partySize <= 6) return 120;
  return 150;
}

// Franjas ofertables de un turno, cada SLOT_STEP_MIN minutos.
export function seatingTimes(shift: Shift): number[] {
  const times: number[] = [];
  for (let t = shift.firstSeatingMin; t <= shift.lastSeatingMin; t += SLOT_STEP_MIN) times.push(t);
  return times;
}

// ── Restaurantes e inventario único ───────────────────────────────

export interface RestaurantOrganization {
  id: string;
  name: string;
  restaurants: Restaurant[];
}

export interface Restaurant {
  id: string;
  organizationId: string;
  name: string;
  spaces: Space[];
  menus: Menu[];
  shifts: Shift[];
}

export interface Space {
  id: string;
  name: string;
  privatizable: boolean;
  tables: Table[];
}

export interface Table {
  id: string;
  name: string;
  minSeats: number;
  maxSeats: number;
  combinableWith: string[];
}

export interface Menu {
  id: string;
  name: string;
  pricePerPersonCents: number;
  courses: string[];
  bookableOnline: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'seated' | 'finished' | 'no_show' | 'cancelled';
export type BookingSource = 'widget' | 'phone' | 'walkin' | 'fixture';

export interface Guest {
  name: string;
  email?: string;
  phone?: string;
}

export interface CustomerProfile {
  id: string;
  restaurantId: string;
  guest: Guest;
  allergies: string[];
  floorNotes: string;
}

export interface TableBooking {
  id: string;
  restaurantId: string;
  tableIds: string[];
  slot: TimeSlot;
  partySize: number;
  status: BookingStatus;
  guest: Guest;
  menuId?: string;
  deposit?: DepositRecord;
  source: BookingSource;
  bookedAt?: string;
}

export type WaitlistStatus = 'waiting' | 'notified' | 'seated' | 'cancelled';

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  guest: Guest;
  partySize: number;
  requestedSlot: TimeSlot;
  arrivedAt: string;
  quotedWaitMin: number;
  status: WaitlistStatus;
  seatedBookingId?: string;
}

export type EventStatus = 'draft' | 'published' | 'soldout' | 'done';

export interface RestaurantEvent {
  id: string;
  restaurantId: string;
  name: string;
  slot: TimeSlot;
  capacity: number;
  priceCents: number;
  soldSeats: number;
  consumesTableIds: string[];
  status: EventStatus;
}

export type PrivateHireStatus = 'requested' | 'proposed' | 'deposit_paid' | 'blocked';

export interface PrivateHireProposal {
  menuId: string;
  pricePerPersonCents: number;
  minimumGuests: number;
  depositCents: number;
}

export interface PrivateHire {
  id: string;
  restaurantId: string;
  spaceId: string;
  slot: TimeSlot;
  status: PrivateHireStatus;
  proposal?: PrivateHireProposal;
}

export type VoucherStatus = 'issued' | 'redeemed' | 'voided';

export interface VoucherValueBreakdown {
  quantity: number;
  unitValueCents: number;
  totalValueCents: number;
}

export interface ExperienceVoucher {
  id: string;
  restaurantId: string;
  code: string;
  experienceId: string;
  experienceName: string;
  recipientName: string;
  value: VoucherValueBreakdown;
  issuedAt: string;
  expiresOn: string;
  status: VoucherStatus;
  redeemedAt?: string;
}

export interface TableOption {
  spaceId: string;
  tableIds: string[];
  minSeats: number;
  maxSeats: number;
}

const ACTIVE_BOOKING_STATUSES: ReadonlySet<BookingStatus> = new Set(['pending', 'confirmed', 'seated']);
const BLOCKING_EVENT_STATUSES: ReadonlySet<EventStatus> = new Set(['published', 'soldout']);

function allTables(restaurant: Restaurant): Array<Table & { spaceId: string }> {
  return restaurant.spaces.flatMap((space) => space.tables.map((table) => ({ ...table, spaceId: space.id })));
}

function blockingTableIds(
  restaurant: Restaurant,
  bookings: readonly TableBooking[],
  events: readonly RestaurantEvent[],
  hires: readonly PrivateHire[],
  slot: TimeSlot,
): Set<string> {
  const blocked = new Set<string>();

  for (const booking of bookings) {
    if (booking.restaurantId === restaurant.id && ACTIVE_BOOKING_STATUSES.has(booking.status) && slotsOverlap(booking.slot, slot)) {
      for (const tableId of booking.tableIds) blocked.add(tableId);
    }
  }

  for (const event of events) {
    if (event.restaurantId === restaurant.id && BLOCKING_EVENT_STATUSES.has(event.status) && slotsOverlap(event.slot, slot)) {
      for (const tableId of event.consumesTableIds) blocked.add(tableId);
    }
  }

  for (const hire of hires) {
    if (hire.restaurantId !== restaurant.id || hire.status !== 'blocked' || !slotsOverlap(hire.slot, slot)) continue;
    const space = restaurant.spaces.find((candidate) => candidate.id === hire.spaceId);
    for (const table of space?.tables ?? []) blocked.add(table.id);
  }

  return blocked;
}

function connected(tableIds: readonly string[], tablesById: ReadonlyMap<string, Table>): boolean {
  if (tableIds.length <= 1) return true;
  const allowed = new Set(tableIds);
  const visited = new Set<string>();
  const pending = [tableIds[0]];

  while (pending.length > 0) {
    const tableId = pending.pop();
    if (tableId === undefined || visited.has(tableId)) continue;
    visited.add(tableId);
    const table = tablesById.get(tableId);
    for (const neighbour of table?.combinableWith ?? []) {
      if (allowed.has(neighbour) && !visited.has(neighbour)) pending.push(neighbour);
    }
    for (const candidateId of allowed) {
      if (tablesById.get(candidateId)?.combinableWith.includes(tableId) && !visited.has(candidateId)) pending.push(candidateId);
    }
  }

  return visited.size === allowed.size;
}

/**
 * Devuelve las opciones mínimas de mesa que pueden alojar al grupo. Una opción
 * puede ser una mesa o un conjunto conectado mediante `combinableWith`.
 */
export function tableAvailability(
  restaurant: Restaurant,
  bookings: readonly TableBooking[],
  events: readonly RestaurantEvent[],
  hires: readonly PrivateHire[],
  slot: TimeSlot,
  partySize: number,
): TableOption[] {
  if (partySize <= 0 || validateSlot(slot).length > 0) return [];
  const blocked = blockingTableIds(restaurant, bookings, events, hires, slot);
  const options: TableOption[] = [];

  for (const space of restaurant.spaces) {
    const tables = space.tables.filter((table) => !blocked.has(table.id));
    const tablesById = new Map(tables.map((table) => [table.id, table]));
    const candidateCount = 2 ** tables.length;

    for (let mask = 1; mask < candidateCount; mask += 1) {
      const selected = tables.filter((_, index) => (mask & 2 ** index) !== 0);
      const tableIds = selected.map((table) => table.id);
      if (!connected(tableIds, tablesById)) continue;

      const minSeats = selected.reduce((sum, table) => sum + table.minSeats, 0);
      const maxSeats = selected.reduce((sum, table) => sum + table.maxSeats, 0);
      if (partySize < minSeats || partySize > maxSeats) continue;

      // Si una parte conectada del conjunto ya sirve, preferimos esa opción
      // mínima y evitamos combinaciones redundantes para el equipo de sala.
      const isRedundant = options.some(
        (option) => option.spaceId === space.id && option.tableIds.every((tableId) => tableIds.includes(tableId)),
      );
      if (!isRedundant) options.push({ spaceId: space.id, tableIds, minSeats, maxSeats });
    }
  }

  return options.sort((a, b) => a.maxSeats - b.maxSeats || a.tableIds.length - b.tableIds.length);
}

const WAITLIST_TRANSITIONS: Readonly<Record<WaitlistStatus, readonly WaitlistStatus[]>> = {
  waiting: ['notified', 'seated', 'cancelled'],
  notified: ['seated', 'cancelled'],
  seated: [],
  cancelled: [],
};

export const nextWaitlistStatuses = (status: WaitlistStatus): readonly WaitlistStatus[] => WAITLIST_TRANSITIONS[status];

export function validateWaitlistEntry(entry: WaitlistEntry): string[] {
  const errors = validateSlot(entry.requestedSlot).map((error) => `waitlist ${entry.id}: ${error}`);
  if (!entry.id.trim()) errors.push('waitlist id is required');
  if (!entry.restaurantId.trim()) errors.push(`waitlist ${entry.id}: restaurantId is required`);
  if (!entry.guest.name.trim() || entry.guest.name.length > 120) errors.push(`waitlist ${entry.id}: guest name is invalid`);
  if (entry.guest.email !== undefined && (!entry.guest.email.includes('@') || entry.guest.email.length > 200)) errors.push(`waitlist ${entry.id}: guest email is invalid`);
  if (entry.guest.phone !== undefined && entry.guest.phone.length > 40) errors.push(`waitlist ${entry.id}: guest phone is invalid`);
  if (!Number.isInteger(entry.partySize) || entry.partySize < 1 || entry.partySize > 40) errors.push(`waitlist ${entry.id}: partySize must be between 1 and 40`);
  if (Number.isNaN(Date.parse(entry.arrivedAt))) errors.push(`waitlist ${entry.id}: arrivedAt must be an ISO timestamp`);
  if (!Number.isInteger(entry.quotedWaitMin) || entry.quotedWaitMin < 0 || entry.quotedWaitMin > 360) errors.push(`waitlist ${entry.id}: quotedWaitMin must be between 0 and 360`);
  if (!Object.hasOwn(WAITLIST_TRANSITIONS, entry.status)) errors.push(`waitlist ${entry.id}: status is invalid`);
  if (entry.status === 'seated' && !entry.seatedBookingId?.trim()) errors.push(`waitlist ${entry.id}: seatedBookingId is required when seated`);
  if (entry.status !== 'seated' && entry.seatedBookingId !== undefined) errors.push(`waitlist ${entry.id}: seatedBookingId is only valid when seated`);
  return errors;
}

/**
 * Convierte una entrada activa en una reserva sentada usando la opción mínima
 * disponible del mismo inventario que reservas, eventos y privatizaciones.
 */
export function createWalkInBooking(
  entry: WaitlistEntry,
  restaurant: Restaurant,
  bookings: readonly TableBooking[],
  events: readonly RestaurantEvent[],
  hires: readonly PrivateHire[],
  bookingId: string,
): TableBooking | null {
  if (entry.restaurantId !== restaurant.id || !['waiting', 'notified'].includes(entry.status) || validateWaitlistEntry(entry).length > 0 || !bookingId.trim()) return null;
  const option = tableAvailability(restaurant, bookings, events, hires, entry.requestedSlot, entry.partySize)[0];
  if (option === undefined) return null;
  return {
    id: bookingId.trim(),
    restaurantId: restaurant.id,
    tableIds: [...option.tableIds],
    slot: { ...entry.requestedSlot },
    partySize: entry.partySize,
    status: 'seated',
    guest: { ...entry.guest },
    source: 'walkin',
  };
}

export function validateRestaurant(restaurant: Restaurant): string[] {
  const errors: string[] = [];
  const tableIds = new Set<string>();
  const menuIds = new Set<string>();
  const spaceIds = new Set<string>();

  if (!restaurant.id.trim()) errors.push('restaurant id is required');
  if (!restaurant.name.trim()) errors.push('restaurant name is required');
  if (restaurant.spaces.length === 0) errors.push('restaurant must have at least one space');

  for (const space of restaurant.spaces) {
    if (spaceIds.has(space.id)) errors.push(`duplicate space id: ${space.id}`);
    spaceIds.add(space.id);
    if (space.tables.length === 0) errors.push(`space ${space.id} must have at least one table`);

    const idsInSpace = new Set(space.tables.map((table) => table.id));
    for (const table of space.tables) {
      if (tableIds.has(table.id)) errors.push(`duplicate table id: ${table.id}`);
      tableIds.add(table.id);
      if (!Number.isInteger(table.minSeats) || table.minSeats <= 0) errors.push(`table ${table.id} minSeats must be a positive integer`);
      if (!Number.isInteger(table.maxSeats) || table.maxSeats < table.minSeats)
        errors.push(`table ${table.id} maxSeats must be an integer greater than or equal to minSeats`);
      for (const neighbour of table.combinableWith) {
        if (neighbour === table.id) errors.push(`table ${table.id} cannot combine with itself`);
        if (!idsInSpace.has(neighbour)) errors.push(`table ${table.id} combines with unknown table in its space: ${neighbour}`);
      }
    }
  }

  for (const menu of restaurant.menus) {
    if (menuIds.has(menu.id)) errors.push(`duplicate menu id: ${menu.id}`);
    menuIds.add(menu.id);
    if (!Number.isInteger(menu.pricePerPersonCents) || menu.pricePerPersonCents < 0)
      errors.push(`menu ${menu.id} pricePerPersonCents must be a non-negative integer`);
    if (menu.courses.length === 0) errors.push(`menu ${menu.id} must have at least one course`);
  }

  for (const shift of restaurant.shifts) {
    if (shift.firstSeatingMin > shift.lastSeatingMin) errors.push(`shift ${shift.id} first seating must not be after last seating`);
    if (shift.firstSeatingMin % SLOT_STEP_MIN !== 0 || shift.lastSeatingMin % SLOT_STEP_MIN !== 0)
      errors.push(`shift ${shift.id} seatings must be multiples of ${SLOT_STEP_MIN}`);
  }

  return errors;
}

export function validateEvent(event: RestaurantEvent, restaurant: Restaurant): string[] {
  const errors = validateSlot(event.slot).map((error) => `event ${event.id}: ${error}`);
  const tables = new Map(allTables(restaurant).map((table) => [table.id, table]));
  const consumed = new Set(event.consumesTableIds);

  if (event.restaurantId !== restaurant.id) errors.push(`event ${event.id} belongs to another restaurant`);
  if (!Number.isInteger(event.capacity) || event.capacity <= 0) errors.push(`event ${event.id} capacity must be a positive integer`);
  if (!Number.isInteger(event.soldSeats) || event.soldSeats < 0 || event.soldSeats > event.capacity)
    errors.push(`event ${event.id} soldSeats must be between 0 and capacity`);
  if (!Number.isInteger(event.priceCents) || event.priceCents < 0) errors.push(`event ${event.id} priceCents must be a non-negative integer`);
  if (consumed.size !== event.consumesTableIds.length) errors.push(`event ${event.id} contains duplicate table ids`);
  if (event.consumesTableIds.length === 0) errors.push(`event ${event.id} must consume at least one table`);

  let seats = 0;
  for (const tableId of consumed) {
    const table = tables.get(tableId);
    if (table === undefined) errors.push(`event ${event.id} consumes unknown table: ${tableId}`);
    else seats += table.maxSeats;
  }
  if (seats < event.capacity) errors.push(`event ${event.id} capacity exceeds the seats of its consumed tables`);
  return errors;
}

export function validateBooking(booking: TableBooking, restaurant: Restaurant): string[] {
  const errors = validateSlot(booking.slot).map((error) => `booking ${booking.id}: ${error}`);
  const selected = allTables(restaurant).filter((table) => booking.tableIds.includes(table.id));

  if (booking.restaurantId !== restaurant.id) errors.push(`booking ${booking.id} belongs to another restaurant`);
  if (new Set(booking.tableIds).size !== booking.tableIds.length) errors.push(`booking ${booking.id} contains duplicate table ids`);
  if (selected.length !== booking.tableIds.length) errors.push(`booking ${booking.id} contains unknown table ids`);
  if (new Set(selected.map((table) => table.spaceId)).size > 1) errors.push(`booking ${booking.id} tables must belong to the same space`);

  const tablesById = new Map(selected.map((table) => [table.id, table]));
  if (!connected(booking.tableIds, tablesById)) errors.push(`booking ${booking.id} tables must be combinable`);
  const minSeats = selected.reduce((sum, table) => sum + table.minSeats, 0);
  const maxSeats = selected.reduce((sum, table) => sum + table.maxSeats, 0);
  if (!Number.isInteger(booking.partySize) || booking.partySize < minSeats || booking.partySize > maxSeats)
    errors.push(`booking ${booking.id} partySize must fit within [${minSeats}, ${maxSeats}]`);
  if (booking.menuId !== undefined && !restaurant.menus.some((menu) => menu.id === booking.menuId))
    errors.push(`booking ${booking.id} references unknown menu: ${booking.menuId}`);
  return errors;
}

interface Occupancy {
  id: string;
  slot: TimeSlot;
  tableIds: string[];
}

export function assertNoDoubleBooking(
  restaurant: Restaurant,
  bookings: readonly TableBooking[],
  events: readonly RestaurantEvent[],
  hires: readonly PrivateHire[],
): void {
  const occupancies: Occupancy[] = [];
  for (const booking of bookings) {
    if (booking.restaurantId === restaurant.id && ACTIVE_BOOKING_STATUSES.has(booking.status))
      occupancies.push({ id: `booking:${booking.id}`, slot: booking.slot, tableIds: booking.tableIds });
  }
  for (const event of events) {
    if (event.restaurantId === restaurant.id && BLOCKING_EVENT_STATUSES.has(event.status))
      occupancies.push({ id: `event:${event.id}`, slot: event.slot, tableIds: event.consumesTableIds });
  }
  for (const hire of hires) {
    if (hire.restaurantId !== restaurant.id || hire.status !== 'blocked') continue;
    const tableIds = restaurant.spaces.find((space) => space.id === hire.spaceId)?.tables.map((table) => table.id) ?? [];
    occupancies.push({ id: `hire:${hire.id}`, slot: hire.slot, tableIds });
  }

  for (let left = 0; left < occupancies.length; left += 1) {
    for (let right = left + 1; right < occupancies.length; right += 1) {
      const a = occupancies[left];
      const b = occupancies[right];
      if (slotsOverlap(a.slot, b.slot) && a.tableIds.some((tableId) => b.tableIds.includes(tableId)))
        throw new Error(`double booking between ${a.id} and ${b.id}`);
    }
  }
}

// ── Depósitos anti no-show ────────────────────────────────────────

export type RiskTier = 'low' | 'medium' | 'high';

export interface RiskSignals {
  partySize: number;
  isPeakSlot: boolean;
  hasHistory: boolean;
  leadDays: number;
}

export function riskTier(signals: RiskSignals): RiskTier {
  if (signals.partySize >= 8 || (signals.isPeakSlot && !signals.hasHistory)) return 'high';
  if (signals.partySize >= 5 || signals.isPeakSlot || !signals.hasHistory || signals.leadDays <= 1) return 'medium';
  return 'low';
}

export type NoShowSignalCategory = 'baseline' | 'channel' | 'history' | 'party' | 'lead_time' | 'slot';
export type NoShowSignalCode =
  | 'baseline'
  | 'channel_direct'
  | 'channel_phone'
  | 'channel_walkin'
  | 'channel_fixture'
  | 'history_first_visit'
  | 'history_repeat_attendance'
  | 'history_previous_no_show'
  | 'party_large'
  | 'party_standard'
  | 'lead_short'
  | 'lead_long'
  | 'lead_standard'
  | 'lead_unknown'
  | 'slot_peak'
  | 'slot_off_peak';
export type NoShowSuggestedAction = 'standard_confirmation' | 'confirm_24h' | 'manual_review';

export interface NoShowRiskInput {
  source: BookingSource;
  partySize: number;
  isPeakSlot: boolean;
  leadDays: number | null;
  previousAttended: number;
  previousNoShows: number;
}

export interface NoShowSignalContribution {
  category: NoShowSignalCategory;
  code: NoShowSignalCode;
  points: number;
}

export interface NoShowRiskRecommendation {
  ruleset: 'no-show-demo-v1';
  basis: 'deterministic-demo';
  operationalScore: number;
  tier: RiskTier;
  suggestedAction: NoShowSuggestedAction;
  signals: NoShowSignalContribution[];
}

export function noShowRiskRecommendation(input: NoShowRiskInput): NoShowRiskRecommendation {
  const partySize = Math.max(1, Math.trunc(input.partySize));
  const previousAttended = Math.max(0, Math.trunc(input.previousAttended));
  const previousNoShows = Math.max(0, Math.trunc(input.previousNoShows));
  const leadDays = input.leadDays === null || !Number.isFinite(input.leadDays) ? null : Math.max(0, Math.trunc(input.leadDays));
  const signals: NoShowSignalContribution[] = [{ category: 'baseline', code: 'baseline', points: 30 }];

  const channel: Record<BookingSource, NoShowSignalContribution> = {
    widget: { category: 'channel', code: 'channel_direct', points: -5 },
    phone: { category: 'channel', code: 'channel_phone', points: 10 },
    walkin: { category: 'channel', code: 'channel_walkin', points: -30 },
    fixture: { category: 'channel', code: 'channel_fixture', points: 0 },
  };
  signals.push(channel[input.source]);

  signals.push(previousAttended > 0
    ? { category: 'history', code: 'history_repeat_attendance', points: -25 }
    : { category: 'history', code: 'history_first_visit', points: 15 });
  if (previousNoShows > 0) signals.push({ category: 'history', code: 'history_previous_no_show', points: 30 });

  signals.push(partySize >= 6
    ? { category: 'party', code: 'party_large', points: 25 }
    : { category: 'party', code: 'party_standard', points: 0 });

  if (leadDays === null) signals.push({ category: 'lead_time', code: 'lead_unknown', points: 0 });
  else if (leadDays <= 1) signals.push({ category: 'lead_time', code: 'lead_short', points: 10 });
  else if (leadDays >= 21) signals.push({ category: 'lead_time', code: 'lead_long', points: 10 });
  else signals.push({ category: 'lead_time', code: 'lead_standard', points: 0 });

  signals.push(input.isPeakSlot
    ? { category: 'slot', code: 'slot_peak', points: 15 }
    : { category: 'slot', code: 'slot_off_peak', points: 0 });

  const operationalScore = Math.min(100, Math.max(0, signals.reduce((sum, signal) => sum + signal.points, 0)));
  const tier: RiskTier = operationalScore >= 60 ? 'high' : operationalScore >= 35 ? 'medium' : 'low';
  const suggestedAction: NoShowSuggestedAction = tier === 'high' ? 'manual_review' : tier === 'medium' ? 'confirm_24h' : 'standard_confirmation';
  return { ruleset: 'no-show-demo-v1', basis: 'deterministic-demo', operationalScore, tier, suggestedAction, signals };
}

export type DepositPolicyKind = 'none' | 'card_hold' | 'prepay';

export interface DepositPolicy {
  kind: DepositPolicyKind;
  menuPercentageBps: number;
}

export interface DepositBreakdown {
  policyKind: DepositPolicyKind;
  partySize: number;
  pricePerPersonCents: number;
  menuSubtotalCents: number;
  percentageBps: number;
  amountCents: number;
}

export function depositFor(policy: DepositPolicy, partySize: number, pricePerPersonCents: number): DepositBreakdown {
  const safePartySize = Math.max(0, Math.trunc(partySize));
  const safePrice = Math.max(0, Math.trunc(pricePerPersonCents));
  const percentageBps = policy.kind === 'none' ? 0 : Math.min(10_000, Math.max(0, Math.trunc(policy.menuPercentageBps)));
  const menuSubtotalCents = safePartySize * safePrice;
  return {
    policyKind: policy.kind,
    partySize: safePartySize,
    pricePerPersonCents: safePrice,
    menuSubtotalCents,
    percentageBps,
    amountCents: Math.round((menuSubtotalCents * percentageBps) / 10_000),
  };
}

export type DepositStatus = 'held' | 'released' | 'charged';

export interface DepositRecord {
  id: string;
  breakdown: DepositBreakdown;
  termsAcceptedAt: string;
  status: DepositStatus;
}

export interface DepositResolution {
  status: DepositStatus;
  chargedCents: number;
  releasedCents: number;
  reason: 'guest-seated' | 'no-show' | 'awaiting-outcome';
}

export function noShowCharge(
  deposit: DepositRecord,
  bookingStatus: BookingStatus,
  requestedChargeCents = deposit.breakdown.amountCents,
): DepositResolution {
  const amountCents = deposit.breakdown.amountCents;
  if (bookingStatus === 'seated' || bookingStatus === 'finished') {
    return { status: 'released', chargedCents: 0, releasedCents: amountCents, reason: 'guest-seated' };
  }
  if (bookingStatus === 'no_show') {
    const chargedCents = Math.min(amountCents, Math.max(0, Math.trunc(requestedChargeCents)));
    return { status: 'charged', chargedCents, releasedCents: amountCents - chargedCents, reason: 'no-show' };
  }
  return { status: 'held', chargedCents: 0, releasedCents: 0, reason: 'awaiting-outcome' };
}

// ── Bonos de experiencia ──────────────────────────────────────────

export function voucherValue(quantity: number, unitValueCents: number): VoucherValueBreakdown {
  const safeQuantity = Math.max(0, Math.trunc(quantity));
  const safeUnitValue = Math.max(0, Math.trunc(unitValueCents));
  return { quantity: safeQuantity, unitValueCents: safeUnitValue, totalValueCents: safeQuantity * safeUnitValue };
}

export function validateExperienceVoucher(voucher: ExperienceVoucher): string[] {
  const errors: string[] = [];
  if (!voucher.id.trim() || voucher.id.length > 120) errors.push('voucher id is invalid');
  if (!voucher.restaurantId.trim() || voucher.restaurantId.length > 120) errors.push(`voucher ${voucher.id}: restaurantId is invalid`);
  if (!/^[A-Z0-9-]{6,32}$/.test(voucher.code)) errors.push(`voucher ${voucher.id}: code is invalid`);
  if (!voucher.experienceId.trim() || voucher.experienceId.length > 120) errors.push(`voucher ${voucher.id}: experienceId is invalid`);
  if (!voucher.experienceName.trim() || voucher.experienceName.length > 160) errors.push(`voucher ${voucher.id}: experienceName is invalid`);
  if (!voucher.recipientName.trim() || voucher.recipientName.length > 120) errors.push(`voucher ${voucher.id}: recipientName is invalid`);
  const expectedValue = voucherValue(voucher.value.quantity, voucher.value.unitValueCents);
  if (!Number.isInteger(voucher.value.quantity) || voucher.value.quantity < 1 || voucher.value.quantity > 20) errors.push(`voucher ${voucher.id}: quantity must be between 1 and 20`);
  if (!Number.isInteger(voucher.value.unitValueCents) || voucher.value.unitValueCents < 0 || voucher.value.unitValueCents > 10_000_000) errors.push(`voucher ${voucher.id}: unitValueCents is invalid`);
  if (voucher.value.totalValueCents !== expectedValue.totalValueCents) errors.push(`voucher ${voucher.id}: totalValueCents is invalid`);
  const issuedMs = Date.parse(voucher.issuedAt);
  const expiresMs = /^\d{4}-\d{2}-\d{2}$/.test(voucher.expiresOn) ? Date.parse(`${voucher.expiresOn}T00:00:00.000Z`) : Number.NaN;
  if (Number.isNaN(issuedMs)) errors.push(`voucher ${voucher.id}: issuedAt is invalid`);
  if (Number.isNaN(expiresMs) || (!Number.isNaN(issuedMs) && expiresMs <= issuedMs)) errors.push(`voucher ${voucher.id}: expiresOn must be after issuedAt`);
  if (!['issued', 'redeemed', 'voided'].includes(voucher.status)) errors.push(`voucher ${voucher.id}: status is invalid`);
  const redeemedMs = voucher.redeemedAt === undefined ? Number.NaN : Date.parse(voucher.redeemedAt);
  if (voucher.status === 'redeemed' && (Number.isNaN(redeemedMs) || redeemedMs < issuedMs || redeemedMs >= expiresMs)) errors.push(`voucher ${voucher.id}: redeemedAt is invalid`);
  if (voucher.status !== 'redeemed' && voucher.redeemedAt !== undefined) errors.push(`voucher ${voucher.id}: redeemedAt is only valid when redeemed`);
  return errors;
}

export function issueExperienceVoucher(voucher: ExperienceVoucher): ExperienceVoucher | null {
  const normalized: ExperienceVoucher = {
    ...voucher,
    id: voucher.id.trim(),
    restaurantId: voucher.restaurantId.trim(),
    code: voucher.code.trim().toUpperCase(),
    experienceId: voucher.experienceId.trim(),
    experienceName: voucher.experienceName.trim(),
    recipientName: voucher.recipientName.trim(),
    value: voucherValue(voucher.value.quantity, voucher.value.unitValueCents),
    status: 'issued',
  };
  delete normalized.redeemedAt;
  return validateExperienceVoucher(normalized).length === 0 ? normalized : null;
}

export function redeemExperienceVoucher(voucher: ExperienceVoucher, redeemedAt: string): ExperienceVoucher | null {
  if (voucher.status !== 'issued') return null;
  const redeemed = { ...voucher, value: { ...voucher.value }, status: 'redeemed' as const, redeemedAt };
  return validateExperienceVoucher(redeemed).length === 0 ? redeemed : null;
}

// ── Permisos demostrativos del gestor ─────────────────────────────

export type RestaurantRole = 'direction' | 'floor' | 'kitchen';
export type RestaurantAction = 'manage_events' | 'manage_private_hires' | 'manage_waitlist' | 'manage_vouchers' | 'seat_booking' | 'charge_no_show';

export function canOperate(role: RestaurantRole, action: RestaurantAction): boolean {
  if (role === 'direction') return true;
  if (role === 'floor') return action === 'seat_booking' || action === 'manage_waitlist' || action === 'manage_vouchers';
  return false;
}

// ── Capacidades demostrables ──────────────────────────────────────

export type CapabilityEvidence = 'brasca' | 'vedra' | 'solane';
export type CapabilityMaturity = 'available' | 'functional-demo' | 'next-to-validate' | 'future';

export interface Capability {
  id: string;
  label: string;
  level: PlanLevel;
  evidence: CapabilityEvidence;
  maturity: CapabilityMaturity;
}

export const CAPABILITIES: readonly Capability[] = [
  { id: 'branded-site', label: 'Web propia con solicitudes por email', level: 'basico', evidence: 'brasca', maturity: 'functional-demo' },
  { id: 'online-booking', label: 'Reserva online con menú', level: 'gestion', evidence: 'vedra', maturity: 'functional-demo' },
  { id: 'unified-inventory', label: 'Inventario único de mesas y eventos', level: 'inteligente', evidence: 'solane', maturity: 'functional-demo' },
  { id: 'no-show-deposits', label: 'Depósitos anti no-show', level: 'inteligente', evidence: 'solane', maturity: 'functional-demo' },
  { id: 'explainable-no-show-risk', label: 'Riesgo de no-show explicable', level: 'inteligente', evidence: 'solane', maturity: 'functional-demo' },
  { id: 'private-hire', label: 'Privatizaciones', level: 'inteligente', evidence: 'solane', maturity: 'functional-demo' },
  { id: 'guest-crm', label: 'CRM de comensales y exportación', level: 'inteligente', evidence: 'solane', maturity: 'functional-demo' },
  { id: 'booking-reports', label: 'Informes de ocupación y origen', level: 'gestion', evidence: 'vedra', maturity: 'functional-demo' },
  { id: 'waitlist-walkins', label: 'Lista de espera y clientes sin reserva', level: 'gestion', evidence: 'vedra', maturity: 'functional-demo' },
  { id: 'experience-vouchers', label: 'Bonos de experiencia y canje', level: 'inteligente', evidence: 'solane', maturity: 'functional-demo' },
  { id: 'decision-assistant', label: 'IA demostrativa para apoyo a decisiones', level: 'inteligente', evidence: 'solane', maturity: 'functional-demo' },
  { id: 'operational-automations', label: 'Automatizaciones de inventario y seguimiento', level: 'inteligente', evidence: 'solane', maturity: 'functional-demo' },
] as const;

// ── Escalera comercial ─────────────────────────────────────────────

export type PlanLevel = 'basico' | 'gestion' | 'inteligente';

export const LEVELS: Record<PlanLevel, { rank: number }> = {
  basico: { rank: 0 },
  gestion: { rank: 1 },
  inteligente: { rank: 2 },
};

export function hasLevel(current: PlanLevel, required: PlanLevel): boolean {
  return LEVELS[current].rank >= LEVELS[required].rank;
}

export interface ScopeSignals {
  servicesPerDay: 1 | 2;
  seats: number;
  wantsOnlineBooking: boolean;
  hasGroupsOrMenus: boolean;
  eventsPerMonth: number;
  noShowPain: boolean;
  wantsPrivateHire: boolean;
}

export function recommendLevel(signals: ScopeSignals): PlanLevel {
  if (signals.eventsPerMonth > 0 || signals.wantsPrivateHire || signals.noShowPain) return 'inteligente';
  if (signals.wantsOnlineBooking || signals.hasGroupsOrMenus) return 'gestion';
  return 'basico';
}

// ── Calculadoras comerciales (siempre etiquetadas como estimación) ─

export interface SavingsEstimate {
  monthlyCents: number;
  yearlyCents: number;
  assumptions: string;
}

// feePerCoverCents por defecto 300 (~3 €/cubierto): estimación publicada por
// terceros sobre marketplaces; el copy SIEMPRE debe presentarla como estimación.
export function marketplaceSavings(coversPerMonth: number, feePerCoverCents = 300): SavingsEstimate {
  const monthlyCents = coversPerMonth * feePerCoverCents;
  return {
    monthlyCents,
    yearlyCents: monthlyCents * 12,
    assumptions: `Estimación basada en tarifas publicadas por terceros (~${(feePerCoverCents / 100).toFixed(2)} €/cubierto).`,
  };
}

// Pérdida estimada por no-shows: tasa media España 3,3 % y ~78,30 € por mesa
// perdida (datos sector 2025-2026); presentar siempre como estimación.
export function noShowLoss(reservationsPerMonth: number, rate = 0.033, avgTicketCents = 7830): SavingsEstimate {
  const monthlyCents = Math.round(reservationsPerMonth * rate * avgTicketCents);
  return {
    monthlyCents,
    yearlyCents: monthlyCents * 12,
    assumptions: `Estimación con tasa de no-show del ${(rate * 100).toFixed(1)} % y ticket medio de ${(avgTicketCents / 100).toFixed(2)} € por mesa.`,
  };
}
