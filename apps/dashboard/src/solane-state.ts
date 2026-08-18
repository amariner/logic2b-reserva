import {
  assertNoDoubleBooking,
  canOperate,
  createWalkInBooking,
  depositFor,
  issueExperienceVoucher,
  noShowCharge,
  redeemExperienceVoucher,
  validateExperienceVoucher,
  validateEvent,
  validateSlot,
  type BookingSource,
  type BookingStatus,
  type DepositPolicyKind,
  type DepositRecord,
  type EventStatus,
  type ExperienceVoucher,
  type PrivateHire,
  type PrivateHireProposal,
  type PrivateHireStatus,
  type Restaurant,
  type RestaurantEvent,
  type RestaurantRole,
  type TableBooking,
  type WaitlistEntry,
  type WaitlistStatus,
} from '@logic-reserva/domain';
import { addWaitlistEntry, cloneWaitlistEntry, parseWaitlistEntries, transitionWaitlistEntry } from './waitlist';

export const SOLANE_STORAGE_KEY = 'logic-reserva-demo-solane-v1';
export const SOLANE_STATE_VERSION = 1 as const;

export interface SolaneEventSale {
  id: string;
  eventId: string;
  seats: number;
  purchasedAt: string;
}

export interface SolaneDemoState {
  version: typeof SOLANE_STATE_VERSION;
  bookings: TableBooking[];
  waitlist: WaitlistEntry[];
  events: RestaurantEvent[];
  sales: SolaneEventSale[];
  privateHires: PrivateHire[];
  vouchers: ExperienceVoucher[];
  role: RestaurantRole;
  privateHireTour: SolanePrivateHireTour;
}

export interface SolanePrivateHireTour {
  mode: 'choice' | 'guided' | 'free';
  step: 1 | 2 | 3;
  completed: boolean;
}

const BOOKING_STATUSES: readonly BookingStatus[] = ['pending', 'confirmed', 'seated', 'finished', 'no_show', 'cancelled'];
const BOOKING_SOURCES: readonly BookingSource[] = ['widget', 'phone', 'walkin', 'fixture'];
const EVENT_STATUSES: readonly EventStatus[] = ['draft', 'published', 'soldout', 'done'];
const DEPOSIT_POLICY_KINDS: readonly DepositPolicyKind[] = ['none', 'card_hold', 'prepay'];
const DEPOSIT_STATUSES = ['held', 'released', 'charged'] as const;
const PRIVATE_HIRE_STATUSES: readonly PrivateHireStatus[] = ['requested', 'proposed', 'deposit_paid', 'blocked'];
const RESTAURANT_ROLES: readonly RestaurantRole[] = ['direction', 'floor', 'kitchen'];

const cloneBooking = (booking: TableBooking): TableBooking => ({
  ...booking,
  tableIds: [...booking.tableIds],
  slot: { ...booking.slot },
  guest: { ...booking.guest },
  deposit: booking.deposit === undefined ? undefined : { ...booking.deposit, breakdown: { ...booking.deposit.breakdown } },
});

const cloneEvent = (event: RestaurantEvent): RestaurantEvent => ({ ...event, slot: { ...event.slot }, consumesTableIds: [...event.consumesTableIds] });
const cloneSale = (sale: SolaneEventSale): SolaneEventSale => ({ ...sale });
const clonePrivateHire = (hire: PrivateHire): PrivateHire => ({ ...hire, slot: { ...hire.slot }, proposal: hire.proposal === undefined ? undefined : { ...hire.proposal } });
const cloneVoucher = (voucher: ExperienceVoucher): ExperienceVoucher => ({ ...voucher, value: { ...voucher.value } });
const initialPrivateHireTour = (): SolanePrivateHireTour => ({ mode: 'choice', step: 1, completed: false });

function parseDeposit(value: unknown, partySize: number): DepositRecord | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<DepositRecord>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim() || candidate.id.length > 120) return null;
  if (typeof candidate.termsAcceptedAt !== 'string' || Number.isNaN(Date.parse(candidate.termsAcceptedAt))) return null;
  if (!DEPOSIT_STATUSES.includes(candidate.status as typeof DEPOSIT_STATUSES[number])) return null;
  if (candidate.breakdown === undefined || typeof candidate.breakdown !== 'object') return null;
  const breakdown = candidate.breakdown;
  if (!DEPOSIT_POLICY_KINDS.includes(breakdown.policyKind as DepositPolicyKind)) return null;
  if (![breakdown.partySize, breakdown.pricePerPersonCents, breakdown.menuSubtotalCents, breakdown.percentageBps, breakdown.amountCents].every(Number.isInteger)) return null;
  if (breakdown.partySize !== partySize || breakdown.pricePerPersonCents < 0 || breakdown.percentageBps < 0 || breakdown.percentageBps > 10_000) return null;
  const expected = depositFor({ kind: breakdown.policyKind, menuPercentageBps: breakdown.percentageBps }, breakdown.partySize, breakdown.pricePerPersonCents);
  if (expected.menuSubtotalCents !== breakdown.menuSubtotalCents || expected.amountCents !== breakdown.amountCents || expected.percentageBps !== breakdown.percentageBps) return null;
  return {
    id: candidate.id.trim(),
    breakdown: { ...expected },
    termsAcceptedAt: candidate.termsAcceptedAt,
    status: candidate.status as DepositRecord['status'],
  };
}

export const initialSolaneState = (
  fixtureBookings: readonly TableBooking[] = [],
  fixtureEvents: readonly RestaurantEvent[] = [],
  fixturePrivateHires: readonly PrivateHire[] = [],
): SolaneDemoState => ({
  version: SOLANE_STATE_VERSION,
  bookings: fixtureBookings.map(cloneBooking),
  waitlist: [],
  events: fixtureEvents.map(cloneEvent),
  sales: [],
  privateHires: fixturePrivateHires.map(clonePrivateHire),
  vouchers: [],
  role: 'direction',
  privateHireTour: initialPrivateHireTour(),
});

function parseBooking(value: unknown): TableBooking | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<TableBooking>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim() || candidate.id.length > 120 || candidate.restaurantId !== 'solane') return null;
  if (!Array.isArray(candidate.tableIds) || candidate.tableIds.length === 0 || candidate.tableIds.length > 8) return null;
  const tableIds = candidate.tableIds.filter((tableId): tableId is string => typeof tableId === 'string' && tableId.length > 0);
  if (tableIds.length !== candidate.tableIds.length || new Set(tableIds).size !== tableIds.length) return null;
  if (candidate.slot === undefined || validateSlot(candidate.slot).length > 0) return null;
  if (typeof candidate.partySize !== 'number' || !Number.isInteger(candidate.partySize) || candidate.partySize < 1 || candidate.partySize > 40) return null;
  if (!BOOKING_STATUSES.includes(candidate.status as BookingStatus) || !BOOKING_SOURCES.includes(candidate.source as BookingSource)) return null;
  if (candidate.guest === undefined || typeof candidate.guest.name !== 'string' || !candidate.guest.name.trim() || candidate.guest.name.length > 120) return null;
  if (candidate.guest.email !== undefined && (typeof candidate.guest.email !== 'string' || !candidate.guest.email.includes('@') || candidate.guest.email.length > 200)) return null;
  if (candidate.guest.phone !== undefined && (typeof candidate.guest.phone !== 'string' || candidate.guest.phone.length > 40)) return null;
  if (candidate.menuId !== undefined && typeof candidate.menuId !== 'string') return null;
  const deposit = candidate.deposit === undefined ? undefined : parseDeposit(candidate.deposit, candidate.partySize);
  if (candidate.deposit !== undefined && deposit === null) return null;
  return {
    id: candidate.id.trim(),
    restaurantId: 'solane',
    tableIds,
    slot: { ...candidate.slot },
    partySize: candidate.partySize,
    status: candidate.status as BookingStatus,
    guest: {
      name: candidate.guest.name.trim(),
      ...(candidate.guest.email === undefined ? {} : { email: candidate.guest.email.trim() }),
      ...(candidate.guest.phone === undefined ? {} : { phone: candidate.guest.phone.trim() }),
    },
    ...(candidate.menuId === undefined ? {} : { menuId: candidate.menuId }),
    ...(deposit === undefined || deposit === null ? {} : { deposit }),
    source: candidate.source as BookingSource,
  };
}

function parseEvent(value: unknown): RestaurantEvent | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<RestaurantEvent>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim() || candidate.id.length > 120 || candidate.restaurantId !== 'solane') return null;
  if (typeof candidate.name !== 'string' || !candidate.name.trim() || candidate.name.length > 120) return null;
  if (candidate.slot === undefined || validateSlot(candidate.slot).length > 0) return null;
  if (typeof candidate.capacity !== 'number' || !Number.isInteger(candidate.capacity) || candidate.capacity < 1 || candidate.capacity > 200) return null;
  if (typeof candidate.priceCents !== 'number' || !Number.isInteger(candidate.priceCents) || candidate.priceCents < 0 || candidate.priceCents > 10_000_000) return null;
  if (typeof candidate.soldSeats !== 'number' || !Number.isInteger(candidate.soldSeats) || candidate.soldSeats < 0 || candidate.soldSeats > candidate.capacity) return null;
  if (!Array.isArray(candidate.consumesTableIds) || candidate.consumesTableIds.length === 0 || candidate.consumesTableIds.length > 20) return null;
  const consumesTableIds = candidate.consumesTableIds.filter((tableId): tableId is string => typeof tableId === 'string' && tableId.length > 0);
  if (consumesTableIds.length !== candidate.consumesTableIds.length || new Set(consumesTableIds).size !== consumesTableIds.length) return null;
  if (!EVENT_STATUSES.includes(candidate.status as EventStatus)) return null;
  return {
    id: candidate.id.trim(),
    restaurantId: 'solane',
    name: candidate.name.trim(),
    slot: { ...candidate.slot },
    capacity: candidate.capacity,
    priceCents: candidate.priceCents,
    soldSeats: candidate.soldSeats,
    consumesTableIds,
    status: candidate.status as EventStatus,
  };
}

function parsePrivateHireProposal(value: unknown): PrivateHireProposal | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<PrivateHireProposal>;
  if (typeof candidate.menuId !== 'string' || !candidate.menuId.trim() || candidate.menuId.length > 120) return null;
  if (![candidate.pricePerPersonCents, candidate.minimumGuests, candidate.depositCents].every(Number.isInteger)) return null;
  if (candidate.pricePerPersonCents! < 0 || candidate.minimumGuests! < 1 || candidate.minimumGuests! > 200 || candidate.depositCents! < 0) return null;
  const maximum = candidate.pricePerPersonCents! * candidate.minimumGuests!;
  if (candidate.depositCents! > maximum) return null;
  return {
    menuId: candidate.menuId.trim(),
    pricePerPersonCents: candidate.pricePerPersonCents!,
    minimumGuests: candidate.minimumGuests!,
    depositCents: candidate.depositCents!,
  };
}

function parsePrivateHire(value: unknown): PrivateHire | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<PrivateHire>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim() || candidate.id.length > 120 || candidate.restaurantId !== 'solane') return null;
  if (typeof candidate.spaceId !== 'string' || !candidate.spaceId.trim() || candidate.spaceId.length > 120) return null;
  if (candidate.slot === undefined || validateSlot(candidate.slot).length > 0) return null;
  if (!PRIVATE_HIRE_STATUSES.includes(candidate.status as PrivateHireStatus)) return null;
  const proposal = candidate.proposal === undefined ? undefined : parsePrivateHireProposal(candidate.proposal);
  if (candidate.proposal !== undefined && proposal === null) return null;
  if (candidate.status !== 'requested' && (proposal === undefined || proposal === null)) return null;
  return {
    id: candidate.id.trim(),
    restaurantId: 'solane',
    spaceId: candidate.spaceId.trim(),
    slot: { ...candidate.slot },
    status: candidate.status as PrivateHireStatus,
    ...(proposal === undefined || proposal === null ? {} : { proposal }),
  };
}

function parsePrivateHireTour(value: unknown): SolanePrivateHireTour {
  if (value === null || typeof value !== 'object') return initialPrivateHireTour();
  const candidate = value as Partial<SolanePrivateHireTour>;
  const mode = ['choice', 'guided', 'free'].includes(candidate.mode ?? '') ? candidate.mode as SolanePrivateHireTour['mode'] : 'choice';
  const step = [1, 2, 3].includes(candidate.step ?? 0) ? candidate.step as SolanePrivateHireTour['step'] : 1;
  return { mode, step, completed: candidate.completed === true };
}

function parseSale(value: unknown): SolaneEventSale | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<SolaneEventSale>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim() || candidate.id.length > 120) return null;
  if (typeof candidate.eventId !== 'string' || !candidate.eventId.trim() || candidate.eventId.length > 120) return null;
  if (typeof candidate.seats !== 'number' || !Number.isInteger(candidate.seats) || candidate.seats < 1 || candidate.seats > 20) return null;
  if (typeof candidate.purchasedAt !== 'string' || Number.isNaN(Date.parse(candidate.purchasedAt))) return null;
  return { id: candidate.id.trim(), eventId: candidate.eventId.trim(), seats: candidate.seats, purchasedAt: candidate.purchasedAt };
}

function parseVoucher(value: unknown): ExperienceVoucher | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<ExperienceVoucher>;
  if (candidate.value === undefined || typeof candidate.value !== 'object') return null;
  const voucher: ExperienceVoucher = {
    id: typeof candidate.id === 'string' ? candidate.id.trim() : '',
    restaurantId: candidate.restaurantId === 'solane' ? 'solane' : '',
    code: typeof candidate.code === 'string' ? candidate.code.trim().toUpperCase() : '',
    experienceId: typeof candidate.experienceId === 'string' ? candidate.experienceId.trim() : '',
    experienceName: typeof candidate.experienceName === 'string' ? candidate.experienceName.trim() : '',
    recipientName: typeof candidate.recipientName === 'string' ? candidate.recipientName.trim() : '',
    value: {
      quantity: candidate.value.quantity ?? Number.NaN,
      unitValueCents: candidate.value.unitValueCents ?? Number.NaN,
      totalValueCents: candidate.value.totalValueCents ?? Number.NaN,
    },
    issuedAt: typeof candidate.issuedAt === 'string' ? candidate.issuedAt : '',
    expiresOn: typeof candidate.expiresOn === 'string' ? candidate.expiresOn : '',
    status: candidate.status ?? 'issued',
    ...(typeof candidate.redeemedAt === 'string' ? { redeemedAt: candidate.redeemedAt } : {}),
  };
  return validateExperienceVoucher(voucher).length === 0 ? voucher : null;
}

export function parseSolaneStored(
  raw: string | null,
  fixtureBookings: readonly TableBooking[] = [],
  fixtureEvents: readonly RestaurantEvent[] = [],
  fixturePrivateHires: readonly PrivateHire[] = [],
): SolaneDemoState {
  const fallback = initialSolaneState(fixtureBookings, fixtureEvents, fixturePrivateHires);
  if (raw === null) return fallback;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.version !== SOLANE_STATE_VERSION || !Array.isArray(value.bookings) || !Array.isArray(value.events)) return fallback;
    const bookings = new Map(fallback.bookings.map((booking) => [booking.id, booking]));
    for (const booking of value.bookings.map(parseBooking).filter((booking): booking is TableBooking => booking !== null).slice(0, 250)) bookings.set(booking.id, booking);
    const events = new Map(fallback.events.map((event) => [event.id, event]));
    for (const event of value.events.map(parseEvent).filter((event): event is RestaurantEvent => event !== null).slice(0, 100)) events.set(event.id, event);
    const eventIds = new Set(events.keys());
    const sales = (Array.isArray(value.sales) ? value.sales : []).map(parseSale).filter((sale): sale is SolaneEventSale => sale !== null && eventIds.has(sale.eventId)).slice(0, 500);
    const privateHires = new Map(fallback.privateHires.map((hire) => [hire.id, hire]));
    for (const hire of (Array.isArray(value.privateHires) ? value.privateHires : []).map(parsePrivateHire).filter((hire): hire is PrivateHire => hire !== null).slice(0, 100)) privateHires.set(hire.id, hire);
    return {
      version: SOLANE_STATE_VERSION,
      bookings: [...bookings.values()].map(cloneBooking),
      waitlist: parseWaitlistEntries(value.waitlist, 'solane'),
      events: [...events.values()].map(cloneEvent),
      sales: sales.map(cloneSale),
      privateHires: [...privateHires.values()].map(clonePrivateHire),
      vouchers: (Array.isArray(value.vouchers) ? value.vouchers : []).map(parseVoucher).filter((voucher): voucher is ExperienceVoucher => voucher !== null).slice(0, 500).map(cloneVoucher),
      role: RESTAURANT_ROLES.includes(value.role as RestaurantRole) ? value.role as RestaurantRole : 'direction',
      privateHireTour: parsePrivateHireTour(value.privateHireTour),
    };
  } catch {
    return fallback;
  }
}

export const serializeSolaneState = (state: SolaneDemoState): string => JSON.stringify({
  version: SOLANE_STATE_VERSION,
  bookings: state.bookings.map(cloneBooking),
  waitlist: state.waitlist.map(cloneWaitlistEntry),
  events: state.events.map(cloneEvent),
  sales: state.sales.map(cloneSale),
  privateHires: state.privateHires.map(clonePrivateHire),
  vouchers: state.vouchers.map(cloneVoucher),
  role: state.role,
  privateHireTour: { ...state.privateHireTour },
});

export function upsertSolaneBooking(state: SolaneDemoState, booking: TableBooking): SolaneDemoState {
  if (booking.restaurantId !== 'solane') return state;
  return { ...state, bookings: [...state.bookings.filter((candidate) => candidate.id !== booking.id), cloneBooking(booking)] };
}

export function addSolaneWaitlistEntry(state: SolaneDemoState, entry: WaitlistEntry): SolaneDemoState {
  if (!canOperate(state.role, 'manage_waitlist')) return state;
  const waitlist = addWaitlistEntry(state.waitlist, entry, 'solane');
  return waitlist === null ? state : { ...state, waitlist };
}

export function transitionSolaneWaitlistEntry(state: SolaneDemoState, entryId: string, status: Exclude<WaitlistStatus, 'seated'>): SolaneDemoState {
  if (!canOperate(state.role, 'manage_waitlist')) return state;
  const waitlist = transitionWaitlistEntry(state.waitlist, entryId, status);
  return waitlist === null ? state : { ...state, waitlist };
}

export function seatSolaneWaitlistEntry(state: SolaneDemoState, entryId: string, restaurant: Restaurant, bookingId: string): SolaneDemoState {
  if (!canOperate(state.role, 'manage_waitlist') || !canOperate(state.role, 'seat_booking') || state.bookings.some((booking) => booking.id === bookingId)) return state;
  const entry = state.waitlist.find((candidate) => candidate.id === entryId);
  if (entry === undefined) return state;
  const booking = createWalkInBooking(entry, restaurant, state.bookings, state.events, state.privateHires, bookingId);
  if (booking === null) return state;
  const waitlist = transitionWaitlistEntry(state.waitlist, entryId, 'seated', booking.id);
  if (waitlist === null) return state;
  return { ...state, bookings: [...state.bookings.map(cloneBooking), booking], waitlist };
}

export function resolveSolaneBookingDeposit(
  state: SolaneDemoState,
  bookingId: string,
  outcome: Extract<BookingStatus, 'seated' | 'no_show'>,
): SolaneDemoState {
  if (!canOperate(state.role, outcome === 'seated' ? 'seat_booking' : 'charge_no_show')) return state;
  const target = state.bookings.find((booking) => booking.id === bookingId);
  if (target?.deposit === undefined || target.deposit.status !== 'held' || !['pending', 'confirmed'].includes(target.status)) return state;
  const resolution = noShowCharge(target.deposit, outcome);
  return {
    ...state,
    bookings: state.bookings.map((booking) => booking.id === bookingId ? {
      ...cloneBooking(booking),
      status: outcome,
      deposit: { ...booking.deposit!, breakdown: { ...booking.deposit!.breakdown }, status: resolution.status },
    } : cloneBooking(booking)),
  };
}

export function createSolaneEvent(state: SolaneDemoState, event: RestaurantEvent, restaurant: Restaurant): SolaneDemoState {
  if (!canOperate(state.role, 'manage_events')) return state;
  const draft = { ...cloneEvent(event), status: 'draft' as const, soldSeats: 0 };
  if (validateEvent(draft, restaurant).length > 0) return state;
  return { ...state, events: [...state.events.filter((candidate) => candidate.id !== draft.id), draft] };
}

export function publishSolaneEvent(state: SolaneDemoState, eventId: string, restaurant: Restaurant): SolaneDemoState {
  if (!canOperate(state.role, 'manage_events')) return state;
  const target = state.events.find((event) => event.id === eventId);
  if (target === undefined || target.status !== 'draft') return state;
  const published = { ...cloneEvent(target), status: 'published' as const };
  if (validateEvent(published, restaurant).length > 0) return state;
  const events = state.events.map((event) => event.id === eventId ? published : cloneEvent(event));
  assertNoDoubleBooking(restaurant, state.bookings, events, state.privateHires);
  return { ...state, events };
}

export function setSolaneRole(state: SolaneDemoState, role: RestaurantRole): SolaneDemoState {
  if (!RESTAURANT_ROLES.includes(role) || state.role === role) return state;
  return { ...state, role };
}

export function startSolanePrivateHireTour(state: SolaneDemoState, mode: Extract<SolanePrivateHireTour['mode'], 'guided' | 'free'>): SolaneDemoState {
  return { ...state, privateHireTour: { mode, step: 1, completed: false } };
}

export function prepareSolanePrivateHire(
  state: SolaneDemoState,
  hireId: string,
  proposal: PrivateHireProposal,
  restaurant: Restaurant,
): SolaneDemoState {
  if (!canOperate(state.role, 'manage_private_hires')) return state;
  const target = state.privateHires.find((hire) => hire.id === hireId);
  const space = restaurant.spaces.find((candidate) => candidate.id === target?.spaceId);
  const parsedProposal = parsePrivateHireProposal(proposal);
  const maximumGuests = space?.tables.reduce((sum, table) => sum + table.maxSeats, 0) ?? 0;
  if (target === undefined || target.status !== 'requested' || space?.privatizable !== true || parsedProposal === null || parsedProposal.minimumGuests > maximumGuests || !restaurant.menus.some((menu) => menu.id === parsedProposal.menuId)) return state;
  return {
    ...state,
    privateHires: state.privateHires.map((hire) => hire.id === hireId ? { ...clonePrivateHire(hire), status: 'proposed', proposal: { ...parsedProposal } } : clonePrivateHire(hire)),
    privateHireTour: { ...state.privateHireTour, step: 2 },
  };
}

export function registerSolanePrivateHireDeposit(state: SolaneDemoState, hireId: string): SolaneDemoState {
  if (!canOperate(state.role, 'manage_private_hires')) return state;
  const target = state.privateHires.find((hire) => hire.id === hireId);
  if (target?.status !== 'proposed' || target.proposal === undefined) return state;
  return {
    ...state,
    privateHires: state.privateHires.map((hire) => hire.id === hireId ? { ...clonePrivateHire(hire), status: 'deposit_paid' } : clonePrivateHire(hire)),
    privateHireTour: { ...state.privateHireTour, step: 3 },
  };
}

export function blockSolanePrivateHire(state: SolaneDemoState, hireId: string, restaurant: Restaurant): SolaneDemoState {
  if (!canOperate(state.role, 'manage_private_hires')) return state;
  const target = state.privateHires.find((hire) => hire.id === hireId);
  if (target?.status !== 'deposit_paid' || target.proposal === undefined) return state;
  const privateHires = state.privateHires.map((hire) => hire.id === hireId ? { ...clonePrivateHire(hire), status: 'blocked' as const } : clonePrivateHire(hire));
  assertNoDoubleBooking(restaurant, state.bookings, state.events, privateHires);
  return { ...state, privateHires, privateHireTour: { ...state.privateHireTour, step: 3, completed: true } };
}

export function resetSolanePrivateHireTour(state: SolaneDemoState, fixturePrivateHires: readonly PrivateHire[]): SolaneDemoState {
  return { ...state, privateHires: fixturePrivateHires.map(clonePrivateHire), privateHireTour: initialPrivateHireTour() };
}

export function sellSolaneTickets(
  state: SolaneDemoState,
  eventId: string,
  seats: number,
  saleId: string,
  purchasedAt: string,
): SolaneDemoState {
  const target = state.events.find((event) => event.id === eventId);
  if (target === undefined || target.status !== 'published' || !Number.isInteger(seats) || seats < 1 || target.soldSeats + seats > target.capacity || !saleId.trim() || Number.isNaN(Date.parse(purchasedAt))) return state;
  const soldSeats = target.soldSeats + seats;
  const events = state.events.map((event) => event.id === eventId ? { ...cloneEvent(event), soldSeats, status: soldSeats === event.capacity ? 'soldout' as const : 'published' as const } : cloneEvent(event));
  const sale: SolaneEventSale = { id: saleId.trim(), eventId, seats, purchasedAt };
  return { ...state, events, sales: [...state.sales.filter((candidate) => candidate.id !== sale.id), sale] };
}

export function issueSolaneVoucher(state: SolaneDemoState, voucher: ExperienceVoucher): SolaneDemoState {
  if (voucher.restaurantId !== 'solane' || state.vouchers.some((candidate) => candidate.id === voucher.id || candidate.code === voucher.code.toUpperCase())) return state;
  const issued = issueExperienceVoucher(voucher);
  return issued === null ? state : { ...state, vouchers: [...state.vouchers.map(cloneVoucher), issued] };
}

export function redeemSolaneVoucher(state: SolaneDemoState, voucherId: string, redeemedAt: string): SolaneDemoState {
  if (!canOperate(state.role, 'manage_vouchers')) return state;
  const target = state.vouchers.find((voucher) => voucher.id === voucherId);
  if (target === undefined) return state;
  const redeemed = redeemExperienceVoucher(target, redeemedAt);
  if (redeemed === null) return state;
  return { ...state, vouchers: state.vouchers.map((voucher) => voucher.id === voucherId ? redeemed : cloneVoucher(voucher)) };
}
