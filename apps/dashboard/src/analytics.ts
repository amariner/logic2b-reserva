import {
  marketplaceSavings,
  noShowLoss,
  type BookingSource,
  type CustomerProfile,
  type Guest,
  type Restaurant,
  type ServiceKind,
  type TableBooking,
} from '@logic-reserva/domain';

const ATTENDED_STATUSES = new Set(['finished']);
const OCCUPIED_STATUSES = new Set(['pending', 'confirmed', 'seated', 'finished']);

export interface CustomerRecord {
  key: string;
  guest: Guest;
  bookings: TableBooking[];
  allergies: string[];
  floorNotes: string;
  spendCents: number;
}

export interface ShiftReport {
  kind: ServiceKind;
  covers: number;
  capacity: number;
  occupancyPercent: number;
  serviceDays: number;
}

export interface BookingReports {
  shifts: ShiftReport[];
  sources: { source: BookingSource; count: number; percentage: number }[];
  totalBookings: number;
  directCovers: number;
  noShowsPrevented: number;
  noShowSavings: ReturnType<typeof noShowLoss>;
  marketplace: ReturnType<typeof marketplaceSavings>;
}

export const guestKey = (guest: Guest): string => guest.email?.trim().toLowerCase()
  ?? guest.phone?.replaceAll(' ', '')
  ?? guest.name.trim().toLowerCase();

const bookingSpend = (booking: TableBooking, restaurant: Restaurant): number => {
  if (!ATTENDED_STATUSES.has(booking.status) || booking.menuId === undefined) return 0;
  const menu = restaurant.menus.find((candidate) => candidate.id === booking.menuId);
  return menu === undefined ? 0 : menu.pricePerPersonCents * booking.partySize;
};

export function buildCustomerRecords(
  bookings: readonly TableBooking[],
  profiles: readonly CustomerProfile[],
  restaurant: Restaurant,
): CustomerRecord[] {
  const records = new Map<string, CustomerRecord>();
  for (const profile of profiles.filter((candidate) => candidate.restaurantId === restaurant.id)) {
    const key = guestKey(profile.guest);
    records.set(key, {
      key,
      guest: { ...profile.guest },
      bookings: [],
      allergies: [...profile.allergies],
      floorNotes: profile.floorNotes,
      spendCents: 0,
    });
  }
  for (const booking of bookings) {
    const key = guestKey(booking.guest);
    const current = records.get(key) ?? {
      key,
      guest: { ...booking.guest },
      bookings: [],
      allergies: [],
      floorNotes: '',
      spendCents: 0,
    };
    current.guest = { ...current.guest, ...booking.guest };
    current.bookings.push(booking);
    current.spendCents += bookingSpend(booking, restaurant);
    records.set(key, current);
  }
  return [...records.values()]
    .map((record) => ({ ...record, bookings: [...record.bookings].sort((left, right) => right.slot.date.localeCompare(left.slot.date) || right.slot.startMin - left.slot.startMin) }))
    .sort((left, right) => left.guest.name.localeCompare(right.guest.name));
}

const csvCell = (value: string | number): string => {
  let normalized = String(value).replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  if (/^[=+\-@]/.test(normalized)) normalized = `'${normalized}`;
  return `"${normalized.replaceAll('"', '""')}"`;
};

export function customerRecordsToCsv(records: readonly CustomerRecord[]): string {
  const header = ['name', 'email', 'phone', 'bookings', 'covers', 'spend_eur', 'allergies', 'floor_notes', 'last_booking'];
  const rows = records.map((record) => [
    record.guest.name,
    record.guest.email ?? '',
    record.guest.phone ?? '',
    record.bookings.length,
    record.bookings.reduce((sum, booking) => sum + booking.partySize, 0),
    (record.spendCents / 100).toFixed(2),
    record.allergies.join(' | '),
    record.floorNotes,
    record.bookings[0]?.slot.date ?? '',
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function bookingReports(bookings: readonly TableBooking[], restaurant: Restaurant): BookingReports {
  const capacityPerService = restaurant.spaces.flatMap((space) => space.tables).reduce((sum, table) => sum + table.maxSeats, 0);
  const shifts = restaurant.shifts.map((shift): ShiftReport => {
    const inShift = bookings.filter((booking) => booking.slot.startMin >= shift.firstSeatingMin && booking.slot.startMin <= shift.lastSeatingMin);
    const eligible = inShift.filter((booking) => OCCUPIED_STATUSES.has(booking.status));
    const dates = new Set(inShift.map((booking) => booking.slot.date));
    const serviceDays = Math.max(1, dates.size);
    const capacity = capacityPerService * serviceDays;
    const covers = eligible.reduce((sum, booking) => sum + booking.partySize, 0);
    return { kind: shift.kind, covers, capacity, occupancyPercent: capacity === 0 ? 0 : Math.round((covers / capacity) * 100), serviceDays };
  });
  const sourceCounts = new Map<BookingSource, number>([['widget', 0], ['phone', 0], ['walkin', 0], ['fixture', 0]]);
  for (const booking of bookings) sourceCounts.set(booking.source, (sourceCounts.get(booking.source) ?? 0) + 1);
  const totalBookings = bookings.length;
  const sources = [...sourceCounts].map(([source, count]) => ({ source, count, percentage: totalBookings === 0 ? 0 : Math.round((count / totalBookings) * 100) }));
  const eligibleBookings = bookings.filter((booking) => OCCUPIED_STATUSES.has(booking.status));
  const directCovers = eligibleBookings.reduce((sum, booking) => sum + booking.partySize, 0);
  return {
    shifts,
    sources,
    totalBookings,
    directCovers,
    noShowsPrevented: Math.round(eligibleBookings.length * 0.033 * 100) / 100,
    noShowSavings: noShowLoss(eligibleBookings.length),
    marketplace: marketplaceSavings(directCovers),
  };
}
