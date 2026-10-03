import { amendBooking, canOperate, type BookingAmendment, type Restaurant, type TableBooking } from '@logic-reserva/domain';
import type { SolaneDemoState } from './solane-state';
import type { VedraDemoState } from './state';

export function amendVedraBooking(
  state: VedraDemoState,
  restaurant: Restaurant,
  original: TableBooking,
  changes: BookingAmendment,
): VedraDemoState {
  if (restaurant.id !== 'vedra') return state;
  const amended = amendBooking(restaurant, original, changes, state.bookings);
  if (amended === null) return state;
  const group = state.group.status === 'confirmed' && state.group.bookingId === amended.id ? {
    ...state.group,
    slot: { ...amended.slot },
    partySize: amended.partySize,
    tableIds: [...amended.tableIds],
    menuId: amended.menuId,
  } : state.group;
  return { ...state, group, bookings: state.bookings.map((booking) => booking.id === amended.id ? amended : booking) };
}

export function amendSolaneBooking(
  state: SolaneDemoState,
  restaurant: Restaurant,
  original: TableBooking,
  changes: BookingAmendment,
): SolaneDemoState {
  if (restaurant.id !== 'solane' || !canOperate(state.role, 'seat_booking')) return state;
  const amended = amendBooking(restaurant, original, changes, state.bookings, state.events, state.privateHires);
  if (amended === null) return state;
  const attendanceChanged = amended.slot.date !== original.slot.date
    || amended.slot.startMin !== original.slot.startMin
    || amended.slot.durationMin !== original.slot.durationMin
    || amended.partySize !== original.partySize;
  return {
    ...state,
    bookings: state.bookings.map((booking) => booking.id === amended.id ? amended : booking),
    attendanceConfirmations: attendanceChanged
      ? state.attendanceConfirmations.filter((confirmation) => confirmation.bookingId !== amended.id)
      : state.attendanceConfirmations,
  };
}
