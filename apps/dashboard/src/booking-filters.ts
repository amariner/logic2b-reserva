import type { BookingSource, BookingStatus, Restaurant, ServiceKind, TableBooking } from '@logic-reserva/domain';

export interface BookingFilters {
  query: string;
  date: string;
  service: 'all' | ServiceKind;
  status: 'all' | 'active' | 'closed' | BookingStatus;
  source: 'all' | BookingSource;
}

export const INITIAL_BOOKING_FILTERS: Readonly<BookingFilters> = Object.freeze({
  query: '',
  date: '',
  service: 'all',
  status: 'all',
  source: 'all',
});

const ACTIVE_STATUSES: readonly BookingStatus[] = ['pending', 'confirmed', 'seated'];
const normalize = (value: string): string => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim();
const phoneDigits = (value: string): string => value.replace(/\D/g, '');
const isPhoneQuery = (value: string): boolean => /^[+\d().\s-]+$/.test(value) && /\d/.test(value);

/** Read-only view over one restaurant's book; leaves the source array and its records untouched. */
export function filterBookings(
  bookings: readonly TableBooking[],
  restaurant: Restaurant,
  filters: Readonly<BookingFilters>,
): TableBooking[] {
  const query = normalize(filters.query);
  const terms = query.split(/\s+/).filter(Boolean);
  const tables = new Map(restaurant.spaces.flatMap((space) => space.tables.map((table) => [table.id, table.name] as const)));
  const shifts = restaurant.shifts.filter((shift) => shift.kind === filters.service);

  return bookings.filter((booking) => {
    if (booking.restaurantId !== restaurant.id) return false;
    if (filters.date && booking.slot.date !== filters.date) return false;
    if (filters.service !== 'all' && !shifts.some((shift) => booking.slot.startMin >= shift.firstSeatingMin && booking.slot.startMin <= shift.lastSeatingMin)) return false;
    if (filters.source !== 'all' && booking.source !== filters.source) return false;
    const active = ACTIVE_STATUSES.includes(booking.status);
    if (filters.status === 'active' && !active) return false;
    if (filters.status === 'closed' && active) return false;
    if (!['all', 'active', 'closed'].includes(filters.status) && booking.status !== filters.status) return false;
    if (!query) return true;

    const phone = phoneDigits(booking.guest.phone ?? '');
    const searchable = normalize([
      booking.id,
      booking.guest.name,
      booking.guest.email ?? '',
      booking.guest.phone ?? '',
      ...booking.tableIds.flatMap((tableId) => [tableId, tables.get(tableId) ?? '']),
    ].join(' '));
    if (isPhoneQuery(query)) return phone.includes(phoneDigits(query)) || searchable.includes(query);
    return terms.every((term) => searchable.includes(term) || (isPhoneQuery(term) && phone.includes(phoneDigits(term))));
  }).sort((left, right) => left.slot.date.localeCompare(right.slot.date) || left.slot.startMin - right.slot.startMin);
}
