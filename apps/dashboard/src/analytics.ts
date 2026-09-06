import {
  marketplaceSavings,
  noShowRiskRecommendation,
  noShowLoss,
  type BookingSource,
  type CustomerProfile,
  type Guest,
  type Restaurant,
  type NoShowRiskRecommendation,
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

export interface BookingRiskAssessment {
  booking: TableBooking;
  leadDays: number | null;
  previousAttended: number;
  previousNoShows: number;
  isPeakSlot: boolean;
  recommendation: NoShowRiskRecommendation;
}

export const guestKey = (guest: Guest): string => guest.email?.trim().toLowerCase()
  ?? guest.phone?.replaceAll(' ', '')
  ?? guest.name.trim().toLowerCase();

const leadDaysFor = (booking: TableBooking): number | null => {
  if (booking.bookedAt === undefined) return null;
  const bookedDate = booking.bookedAt.slice(0, 10);
  const bookedMs = /^\d{4}-\d{2}-\d{2}$/.test(bookedDate) ? Date.parse(`${bookedDate}T00:00:00.000Z`) : Number.NaN;
  const serviceMs = Date.parse(`${booking.slot.date}T00:00:00.000Z`);
  if (Number.isNaN(bookedMs) || Number.isNaN(serviceMs)) return null;
  return Math.max(0, Math.round((serviceMs - bookedMs) / 86_400_000));
};

export function noShowRiskAssessments(
  bookings: readonly TableBooking[],
  restaurant: Restaurant,
  operationalDate: string,
): BookingRiskAssessment[] {
  return bookings
    .filter((booking) => booking.slot.date === operationalDate && (booking.status === 'pending' || booking.status === 'confirmed'))
    .map((booking): BookingRiskAssessment => {
      const key = guestKey(booking.guest);
      const history = bookings.filter((candidate) => candidate.id !== booking.id && candidate.slot.date < booking.slot.date && guestKey(candidate.guest) === key);
      const previousAttended = history.filter((candidate) => candidate.status === 'finished').length;
      const previousNoShows = history.filter((candidate) => candidate.status === 'no_show').length;
      const shift = restaurant.shifts.find((candidate) => booking.slot.startMin >= candidate.firstSeatingMin && booking.slot.startMin <= candidate.lastSeatingMin);
      const peakStart = shift === undefined ? Number.POSITIVE_INFINITY : Math.min(shift.lastSeatingMin, shift.firstSeatingMin + 30);
      const peakEnd = shift === undefined ? Number.NEGATIVE_INFINITY : Math.max(shift.firstSeatingMin, shift.lastSeatingMin - 30);
      const isPeakSlot = booking.slot.startMin >= peakStart && booking.slot.startMin <= peakEnd;
      const leadDays = leadDaysFor(booking);
      const recommendation = noShowRiskRecommendation({ source: booking.source, partySize: booking.partySize, isPeakSlot, leadDays, previousAttended, previousNoShows });
      return { booking, leadDays, previousAttended, previousNoShows, isPeakSlot, recommendation };
    })
    .sort((left, right) => right.recommendation.operationalScore - left.recommendation.operationalScore || left.booking.slot.startMin - right.booking.slot.startMin || left.booking.id.localeCompare(right.booking.id));
}

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

export function bookingReportsToCsv(report: BookingReports): string {
  const header = ['section', 'metric', 'value', 'detail'];
  const rows: (string | number)[][] = [
    ...report.shifts.map((shift) => [
      'occupancy', shift.kind, `${shift.occupancyPercent}%`, `${shift.covers} covers · ${shift.capacity} capacity · ${shift.serviceDays} sample services`,
    ]),
    ...report.sources.map((source) => [
      'sources', source.source, `${source.percentage}%`, `${source.count} bookings`,
    ]),
    ['scenario', 'no_show_exposure', report.noShowsPrevented, report.noShowSavings.assumptions],
    ['scenario', 'hypothetical_marketplace_monthly_eur', (report.marketplace.monthlyCents / 100).toFixed(2), report.marketplace.assumptions],
    ['scenario', 'hypothetical_marketplace_yearly_eur', (report.marketplace.yearlyCents / 100).toFixed(2), 'Same fictional sample multiplied by 12; not a real year.'],
  ];
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
