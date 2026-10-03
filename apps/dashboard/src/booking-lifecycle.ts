import { canOperate, noShowCharge, type BookingStatus, type TableBooking } from '@logic-reserva/domain';
import type { SolaneDemoState } from './solane-state';

const ALLOWED_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['seated', 'no_show', 'cancelled'],
  seated: ['finished'],
  finished: [],
  no_show: [],
  cancelled: [],
};

function hasChargeableDeposit(booking: TableBooking): boolean {
  return booking.deposit?.status === 'held' && booking.deposit.breakdown.amountCents > 0;
}

export function nextSolaneBookingStatuses(state: SolaneDemoState, bookingId: string): readonly BookingStatus[] {
  if (!canOperate(state.role, 'seat_booking')) return [];
  const booking = state.bookings.find((candidate) => candidate.id === bookingId);
  if (booking === undefined || booking.restaurantId !== 'solane') return [];
  return ALLOWED_TRANSITIONS[booking.status].filter((status) =>
    status !== 'no_show' || !hasChargeableDeposit(booking) || canOperate(state.role, 'charge_no_show'),
  );
}

export function transitionSolaneBooking(state: SolaneDemoState, bookingId: string, status: BookingStatus): SolaneDemoState {
  if (!nextSolaneBookingStatuses(state, bookingId).includes(status)) return state;
  return {
    ...state,
    bookings: state.bookings.map((booking) => {
      if (booking.id !== bookingId) return booking;
      const deposit = booking.deposit === undefined ? undefined : {
        ...booking.deposit,
        breakdown: { ...booking.deposit.breakdown },
      };
      // Keep the original acceptance and breakdown; a resolved guarantee is final.
      if (deposit?.status === 'held') {
        if (status === 'seated' || status === 'finished' || status === 'cancelled') deposit.status = 'released';
        if (status === 'no_show') {
          deposit.status = hasChargeableDeposit(booking) ? noShowCharge(deposit, status).status : 'released';
        }
      }
      return {
        ...booking,
        tableIds: [...booking.tableIds],
        slot: { ...booking.slot },
        guest: { ...booking.guest },
        ...(deposit === undefined ? {} : { deposit }),
        status,
      };
    }),
  };
}
