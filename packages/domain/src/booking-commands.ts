import {
  assertNoDoubleBooking,
  slotsOverlap,
  validateBooking,
  type PrivateHire,
  type Restaurant,
  type RestaurantEvent,
  type TableBooking,
} from './index';

/** Validate a new assignment against the inventory at the time of insertion. */
export function canCreateBooking(
  restaurant: Restaurant,
  booking: TableBooking,
  bookings: readonly TableBooking[],
  events: readonly RestaurantEvent[] = [],
  privateHires: readonly PrivateHire[] = [],
): boolean {
  if (!booking.id.trim() || bookings.some((existing) => existing.id === booking.id.trim())) return false;
  if (!['pending', 'confirmed', 'seated'].includes(booking.status)) return false;
  if (!['widget', 'phone', 'walkin', 'fixture'].includes(booking.source)) return false;
  if (booking.source === 'phone' && (booking.status !== 'confirmed' || booking.deposit !== undefined)) return false;
  if (!booking.guest.name.trim() || booking.guest.name.length > 120) return false;
  if (booking.guest.email !== undefined && (!booking.guest.email.includes('@') || booking.guest.email.length > 200)) return false;
  if (booking.guest.phone !== undefined && booking.guest.phone.length > 40) return false;
  if (booking.bookedAt !== undefined && Number.isNaN(Date.parse(booking.bookedAt))) return false;
  if (booking.tableIds.length === 0 || booking.partySize < 1 || booking.partySize > 40 || validateBooking(booking, restaurant).length > 0) return false;
  if (!restaurant.shifts.some((shift) => booking.slot.startMin >= shift.firstSeatingMin && booking.slot.startMin <= shift.lastSeatingMin)) return false;
  if (booking.source === 'widget' && booking.menuId !== undefined && !restaurant.menus.some((menu) => menu.id === booking.menuId && menu.bookableOnline)) return false;

  const sharesTables = (tableIds: readonly string[]) => tableIds.some((tableId) => booking.tableIds.includes(tableId));
  // Only occupancy touching this assignment matters; an unrelated historical
  // conflict must not prevent a valid new booking elsewhere in the restaurant.
  const relevantBookings = bookings.filter((existing) => slotsOverlap(existing.slot, booking.slot) && sharesTables(existing.tableIds));
  const relevantEvents = events.filter((event) => slotsOverlap(event.slot, booking.slot) && sharesTables(event.consumesTableIds));
  const relevantHires = privateHires.filter((hire) => slotsOverlap(hire.slot, booking.slot) && sharesTables(restaurant.spaces.find((space) => space.id === hire.spaceId)?.tables.map((table) => table.id) ?? []));
  try {
    assertNoDoubleBooking(restaurant, [...relevantBookings, booking], relevantEvents, relevantHires);
    return true;
  } catch {
    return false;
  }
}
