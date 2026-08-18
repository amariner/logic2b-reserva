import {
  createWalkInBooking,
  validateSlot,
  type BookingSource,
  type BookingStatus,
  type Guest,
  type Restaurant,
  type TableBooking,
  type TimeSlot,
  type WaitlistEntry,
  type WaitlistStatus,
} from '@logic-reserva/domain';
import { addWaitlistEntry, cloneWaitlistEntry, parseWaitlistEntries, transitionWaitlistEntry } from './waitlist';

export const VEDRA_STORAGE_KEY = 'logic-reserva-demo-vedra-v1';
export const DEMO_STATE_VERSION = 1 as const;

export type VedraGroupStatus = 'requested' | 'tables_assigned' | 'menu_assigned' | 'confirmed';
export type VedraTourMode = 'unset' | 'guided' | 'free';

export interface VedraGroupRequest {
  id: string;
  bookingId: string;
  restaurantId: 'vedra';
  guest: Guest;
  slot: TimeSlot;
  partySize: number;
  status: VedraGroupStatus;
  tableIds: string[];
  menuId?: string;
}

export interface VedraDemoState {
  version: typeof DEMO_STATE_VERSION;
  bookings: TableBooking[];
  waitlist: WaitlistEntry[];
  group: VedraGroupRequest;
  tourMode: VedraTourMode;
  tourStep: 1 | 2 | 3 | null;
  tourCompleted: boolean;
}

const BOOKING_STATUSES: readonly BookingStatus[] = ['pending', 'confirmed', 'seated', 'finished', 'no_show', 'cancelled'];
const BOOKING_SOURCES: readonly BookingSource[] = ['widget', 'phone', 'walkin', 'fixture'];
const GROUP_STATUSES: readonly VedraGroupStatus[] = ['requested', 'tables_assigned', 'menu_assigned', 'confirmed'];
const TOUR_MODES: readonly VedraTourMode[] = ['unset', 'guided', 'free'];

const cloneBooking = (booking: TableBooking): TableBooking => ({
  ...booking,
  tableIds: [...booking.tableIds],
  slot: { ...booking.slot },
  guest: { ...booking.guest },
  deposit: booking.deposit === undefined ? undefined : { ...booking.deposit, breakdown: { ...booking.deposit.breakdown } },
});

const cloneGroup = (group: VedraGroupRequest): VedraGroupRequest => ({
  ...group,
  guest: { ...group.guest },
  slot: { ...group.slot },
  tableIds: [...group.tableIds],
});

const groupFixture = (date: string): VedraGroupRequest => ({
  id: 'vedra-group-8',
  bookingId: 'vedra-group-booking-8',
  restaurantId: 'vedra',
  guest: { name: 'Familia Ortega', email: 'familia.ortega@example.test', phone: '+34 600 800 800' },
  slot: { date, startMin: 900, durationMin: 150 },
  partySize: 8,
  status: 'requested',
  tableIds: [],
});

export const initialVedraState = (fixtureBookings: readonly TableBooking[] = []): VedraDemoState => {
  const date = [...fixtureBookings].sort((left, right) => left.slot.date.localeCompare(right.slot.date))[0]?.slot.date ?? '2026-09-18';
  return {
    version: DEMO_STATE_VERSION,
    bookings: fixtureBookings.map(cloneBooking),
    waitlist: [],
    group: groupFixture(date),
    tourMode: 'unset',
    tourStep: null,
    tourCompleted: false,
  };
};

function parseBooking(value: unknown): TableBooking | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<TableBooking>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim() || candidate.id.length > 120) return null;
  if (candidate.restaurantId !== 'vedra') return null;
  if (!Array.isArray(candidate.tableIds) || candidate.tableIds.length === 0 || candidate.tableIds.length > 8) return null;
  const tableIds = candidate.tableIds.filter((tableId): tableId is string => typeof tableId === 'string' && tableId.length > 0);
  if (tableIds.length !== candidate.tableIds.length || new Set(tableIds).size !== tableIds.length) return null;
  if (candidate.slot === undefined || validateSlot(candidate.slot).length > 0) return null;
  if (typeof candidate.partySize !== 'number' || !Number.isInteger(candidate.partySize) || candidate.partySize < 1 || candidate.partySize > 40) return null;
  if (!BOOKING_STATUSES.includes(candidate.status as BookingStatus)) return null;
  if (!BOOKING_SOURCES.includes(candidate.source as BookingSource)) return null;
  if (candidate.guest === undefined || typeof candidate.guest.name !== 'string' || !candidate.guest.name.trim() || candidate.guest.name.length > 120) return null;
  if (candidate.guest.email !== undefined && (typeof candidate.guest.email !== 'string' || !candidate.guest.email.includes('@') || candidate.guest.email.length > 200)) return null;
  if (candidate.guest.phone !== undefined && (typeof candidate.guest.phone !== 'string' || candidate.guest.phone.length > 40)) return null;
  if (candidate.menuId !== undefined && typeof candidate.menuId !== 'string') return null;

  return {
    id: candidate.id.trim(),
    restaurantId: 'vedra',
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
    source: candidate.source as BookingSource,
  };
}

function parseGroup(value: unknown, fallback: VedraGroupRequest): VedraGroupRequest {
  if (value === null || typeof value !== 'object') return cloneGroup(fallback);
  const candidate = value as Partial<VedraGroupRequest>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim() || candidate.id.length > 120) return cloneGroup(fallback);
  if (typeof candidate.bookingId !== 'string' || !candidate.bookingId.trim() || candidate.bookingId.length > 120) return cloneGroup(fallback);
  if (candidate.restaurantId !== 'vedra' || candidate.slot === undefined || validateSlot(candidate.slot).length > 0) return cloneGroup(fallback);
  if (typeof candidate.partySize !== 'number' || !Number.isInteger(candidate.partySize) || candidate.partySize < 2 || candidate.partySize > 40) return cloneGroup(fallback);
  if (!GROUP_STATUSES.includes(candidate.status as VedraGroupStatus)) return cloneGroup(fallback);
  if (!Array.isArray(candidate.tableIds) || candidate.tableIds.length > 8) return cloneGroup(fallback);
  const tableIds = candidate.tableIds.filter((tableId): tableId is string => typeof tableId === 'string' && tableId.length > 0);
  if (tableIds.length !== candidate.tableIds.length || new Set(tableIds).size !== tableIds.length) return cloneGroup(fallback);
  if (candidate.status !== 'requested' && tableIds.length < 2) return cloneGroup(fallback);
  if ((candidate.status === 'menu_assigned' || candidate.status === 'confirmed') && (typeof candidate.menuId !== 'string' || !candidate.menuId.trim())) return cloneGroup(fallback);
  if (candidate.guest === undefined || typeof candidate.guest.name !== 'string' || !candidate.guest.name.trim() || candidate.guest.name.length > 120) return cloneGroup(fallback);
  if (candidate.guest.email !== undefined && (typeof candidate.guest.email !== 'string' || !candidate.guest.email.includes('@') || candidate.guest.email.length > 200)) return cloneGroup(fallback);
  if (candidate.guest.phone !== undefined && (typeof candidate.guest.phone !== 'string' || candidate.guest.phone.length > 40)) return cloneGroup(fallback);

  return {
    id: candidate.id.trim(),
    bookingId: candidate.bookingId.trim(),
    restaurantId: 'vedra',
    guest: {
      name: candidate.guest.name.trim(),
      ...(candidate.guest.email === undefined ? {} : { email: candidate.guest.email.trim() }),
      ...(candidate.guest.phone === undefined ? {} : { phone: candidate.guest.phone.trim() }),
    },
    slot: { ...candidate.slot },
    partySize: candidate.partySize,
    status: candidate.status as VedraGroupStatus,
    tableIds,
    ...(candidate.menuId === undefined ? {} : { menuId: candidate.menuId.trim() }),
  };
}

export function parseVedraStored(raw: string | null, fixtureBookings: readonly TableBooking[] = []): VedraDemoState {
  const fallback = initialVedraState(fixtureBookings);
  if (raw === null) return fallback;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.version !== DEMO_STATE_VERSION || !Array.isArray(value.bookings)) return fallback;
    const parsed = value.bookings.map(parseBooking).filter((booking): booking is TableBooking => booking !== null).slice(0, 250);
    const merged = new Map(fallback.bookings.map((booking) => [booking.id, booking]));
    for (const booking of parsed) merged.set(booking.id, booking);
    const group = parseGroup(value.group, fallback.group);
    const tourMode = TOUR_MODES.includes(value.tourMode as VedraTourMode) ? value.tourMode as VedraTourMode : fallback.tourMode;
    const tourStep = value.tourStep === 1 || value.tourStep === 2 || value.tourStep === 3 ? value.tourStep : null;
    const tourCompleted = typeof value.tourCompleted === 'boolean' ? value.tourCompleted : false;
    return {
      version: DEMO_STATE_VERSION,
      bookings: [...merged.values()].map(cloneBooking),
      waitlist: parseWaitlistEntries(value.waitlist, 'vedra'),
      group,
      tourMode,
      tourStep: tourMode === 'guided' ? tourStep : null,
      tourCompleted,
    };
  } catch {
    return fallback;
  }
}

export const serializeVedraState = (state: VedraDemoState): string => JSON.stringify({
  version: DEMO_STATE_VERSION,
  bookings: state.bookings.map(cloneBooking),
  waitlist: state.waitlist.map(cloneWaitlistEntry),
  group: cloneGroup(state.group),
  tourMode: state.tourMode,
  tourStep: state.tourStep,
  tourCompleted: state.tourCompleted,
});

export function upsertVedraBooking(state: VedraDemoState, booking: TableBooking): VedraDemoState {
  const bookings = state.bookings.filter((candidate) => candidate.id !== booking.id);
  return { ...state, bookings: [...bookings, cloneBooking(booking)], group: cloneGroup(state.group) };
}

const ALLOWED_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['seated', 'no_show', 'cancelled'],
  seated: ['finished'],
  finished: [],
  no_show: [],
  cancelled: [],
};

export const nextBookingStatuses = (status: BookingStatus): readonly BookingStatus[] => ALLOWED_TRANSITIONS[status];

export function transitionVedraBooking(state: VedraDemoState, bookingId: string, status: BookingStatus): VedraDemoState {
  return {
    ...state,
    group: cloneGroup(state.group),
    bookings: state.bookings.map((booking) =>
      booking.id === bookingId && ALLOWED_TRANSITIONS[booking.status].includes(status) ? { ...cloneBooking(booking), status } : cloneBooking(booking),
    ),
  };
}

export function addVedraWaitlistEntry(state: VedraDemoState, entry: WaitlistEntry): VedraDemoState {
  const waitlist = addWaitlistEntry(state.waitlist, entry, 'vedra');
  return waitlist === null ? state : { ...state, waitlist };
}

export function transitionVedraWaitlistEntry(state: VedraDemoState, entryId: string, status: Exclude<WaitlistStatus, 'seated'>): VedraDemoState {
  const waitlist = transitionWaitlistEntry(state.waitlist, entryId, status);
  return waitlist === null ? state : { ...state, waitlist };
}

export function seatVedraWaitlistEntry(state: VedraDemoState, entryId: string, restaurant: Restaurant, bookingId: string): VedraDemoState {
  if (state.bookings.some((booking) => booking.id === bookingId)) return state;
  const entry = state.waitlist.find((candidate) => candidate.id === entryId);
  if (entry === undefined) return state;
  const booking = createWalkInBooking(entry, restaurant, state.bookings, [], [], bookingId);
  if (booking === null) return state;
  const waitlist = transitionWaitlistEntry(state.waitlist, entryId, 'seated', booking.id);
  if (waitlist === null) return state;
  return { ...state, bookings: [...state.bookings.map(cloneBooking), booking], waitlist };
}

export function startVedraTour(state: VedraDemoState, mode: Exclude<VedraTourMode, 'unset'>): VedraDemoState {
  const step = mode === 'guided'
    ? state.group.status === 'requested' ? 1 : 3
    : null;
  return { ...state, bookings: state.bookings.map(cloneBooking), group: cloneGroup(state.group), tourMode: mode, tourStep: step, tourCompleted: state.group.status === 'confirmed' };
}

export function setVedraTourStep(state: VedraDemoState, step: 1 | 2 | 3): VedraDemoState {
  if (state.tourMode !== 'guided' || state.tourCompleted) return state;
  return { ...state, bookings: state.bookings.map(cloneBooking), group: cloneGroup(state.group), tourStep: step };
}

export function assignVedraGroupTables(state: VedraDemoState, tableIds: readonly string[]): VedraDemoState {
  const unique = [...new Set(tableIds.filter((tableId) => tableId.trim().length > 0))];
  if (state.group.status === 'confirmed' || unique.length < 2 || unique.length > 8) return state;
  const group = { ...cloneGroup(state.group), tableIds: unique, status: state.group.menuId === undefined ? 'tables_assigned' as const : 'menu_assigned' as const };
  return { ...state, bookings: state.bookings.map(cloneBooking), group, tourStep: state.tourMode === 'guided' ? 3 : null };
}

export function assignVedraGroupMenu(state: VedraDemoState, menuId: string): VedraDemoState {
  if (state.group.status === 'confirmed' || state.group.tableIds.length < 2 || !menuId.trim()) return state;
  return {
    ...state,
    bookings: state.bookings.map(cloneBooking),
    group: { ...cloneGroup(state.group), menuId: menuId.trim(), status: 'menu_assigned' },
  };
}

export function confirmVedraGroup(state: VedraDemoState): VedraDemoState {
  if (state.group.status !== 'menu_assigned' || state.group.menuId === undefined || state.group.tableIds.length < 2) return state;
  const booking: TableBooking = {
    id: state.group.bookingId,
    restaurantId: state.group.restaurantId,
    tableIds: [...state.group.tableIds],
    slot: { ...state.group.slot },
    partySize: state.group.partySize,
    status: 'confirmed',
    guest: { ...state.group.guest },
    menuId: state.group.menuId,
    source: 'phone',
  };
  const next = upsertVedraBooking(state, booking);
  return { ...next, group: { ...cloneGroup(next.group), status: 'confirmed' }, tourCompleted: true, tourStep: next.tourMode === 'guided' ? 3 : null };
}

export function resetVedraGroupJourney(state: VedraDemoState): VedraDemoState {
  return {
    ...state,
    bookings: state.bookings.filter((booking) => booking.id !== state.group.bookingId).map(cloneBooking),
    group: groupFixture(state.group.slot.date),
    tourMode: 'unset',
    tourStep: null,
    tourCompleted: false,
  };
}
