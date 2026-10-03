import { describe, expect, it } from 'vitest';
import { depositFor, tableAvailability, type BookingStatus, type DepositRecord, type Restaurant, type RestaurantRole, type TableBooking } from '@logic-reserva/domain';
import { nextSolaneBookingStatuses, transitionSolaneBooking } from './booking-lifecycle';
import { initialSolaneState, parseSolaneStored, serializeSolaneState } from './solane-state';

const restaurant: Restaurant = {
  id: 'solane', organizationId: 'demo', name: 'Solane',
  spaces: [{ id: 'sala', name: 'Sala', privatizable: true, tables: [
    { id: 'ss1', name: 'Mesa 1', minSeats: 1, maxSeats: 4, combinableWith: [] },
  ] }],
  menus: [{ id: 'menu', name: 'Menú', pricePerPersonCents: 10000, courses: ['Uno'], bookableOnline: true }],
  shifts: [{ id: 'dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1320 }],
};

const booking = (status: BookingStatus = 'confirmed', deposit?: DepositRecord): TableBooking => ({
  id: 'booking-1', restaurantId: 'solane', tableIds: ['ss1'],
  slot: { date: '2026-10-03', startMin: 1260, durationMin: 90 },
  partySize: 2, status, guest: { name: 'Ada Demo', email: 'ada@example.test', phone: '+34600000000' },
  menuId: 'menu', source: 'widget', bookedAt: '2026-10-01T09:00:00.000Z',
  ...(deposit === undefined ? {} : { deposit }),
});

const heldDeposit = (): DepositRecord => ({
  id: 'deposit-1', status: 'held', termsAcceptedAt: '2026-10-01T08:59:00.000Z',
  breakdown: depositFor({ kind: 'prepay', menuPercentageBps: 5000 }, 2, 10000),
});

const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'], confirmed: ['seated', 'no_show', 'cancelled'],
  seated: ['finished'], finished: [], no_show: [], cancelled: [],
};
const statuses = Object.keys(transitions) as BookingStatus[];

describe('ciclo operativo de reservas Solane', () => {
  it.each(['direction', 'floor'] as const)('permite a %s completar cada transición sin depósito y bloquea saltos y reaperturas', (role) => {
    for (const from of statuses) {
      const state = { ...initialSolaneState([booking(from)]), role };
      expect(nextSolaneBookingStatuses(state, 'booking-1')).toEqual(transitions[from]);
      for (const to of statuses) {
        const next = transitionSolaneBooking(state, 'booking-1', to);
        if (transitions[from].includes(to)) {
          expect(next.bookings[0].status).toBe(to);
          expect(next.bookings[0].deposit).toBeUndefined();
          expect(state.bookings[0].status).toBe(from);
        } else expect(next).toBe(state);
      }
    }
  });

  it('Cocina no puede operar ningún estado aunque no haya un cargo', () => {
    for (const from of statuses) {
      const state = { ...initialSolaneState([booking(from)]), role: 'kitchen' as const };
      expect(nextSolaneBookingStatuses(state, 'booking-1')).toEqual([]);
      for (const to of statuses) expect(transitionSolaneBooking(state, 'booking-1', to)).toBe(state);
    }
  });

  it('no modifica el estado para identificadores desconocidos o reservas de otro restaurante', () => {
    const state = initialSolaneState([{ ...booking(), restaurantId: 'vedra' }]);
    for (const id of ['missing', 'booking-1']) {
      expect(nextSolaneBookingStatuses(state, id)).toEqual([]);
      expect(transitionSolaneBooking(state, id, 'seated')).toBe(state);
    }
  });

  it.each(['direction', 'floor'] as const)('confirmar con %s conserva la garantía pendiente de resolución', (role) => {
    const state = { ...initialSolaneState([booking('pending', heldDeposit())]), role };
    const next = transitionSolaneBooking(state, 'booking-1', 'confirmed');
    expect(next.bookings[0]).toEqual({ ...state.bookings[0], status: 'confirmed' });
  });

  it.each([
    ['confirmed', 'seated'], ['pending', 'cancelled'], ['confirmed', 'cancelled'], ['seated', 'finished'],
  ] as const)('%s → %s libera la garantía retenida sin cambiar su justificante', (from, to) => {
    const state = { ...initialSolaneState([booking(from, heldDeposit())]), role: 'floor' as const };
    const next = transitionSolaneBooking(state, 'booking-1', to);
    expect(next.bookings[0].status).toBe(to);
    expect(next.bookings[0].deposit).toEqual({ ...state.bookings[0].deposit, status: 'released' });
    expect(state.bookings[0].deposit?.status).toBe('held');
  });

  it('reservar el cobro de una garantía retenida a Dirección también protege la función de estado', () => {
    const floor = { ...initialSolaneState([booking('confirmed', heldDeposit())]), role: 'floor' as const };
    expect(nextSolaneBookingStatuses(floor, 'booking-1')).toEqual(['seated', 'cancelled']);
    expect(transitionSolaneBooking(floor, 'booking-1', 'no_show')).toBe(floor);
    const direction = { ...floor, role: 'direction' as const };
    expect(nextSolaneBookingStatuses(direction, 'booking-1')).toEqual(['seated', 'no_show', 'cancelled']);
    const charged = transitionSolaneBooking(direction, 'booking-1', 'no_show');
    expect(charged.bookings[0]).toEqual({ ...direction.bookings[0], status: 'no_show', deposit: { ...heldDeposit(), status: 'charged' } });
    expect(transitionSolaneBooking(charged, 'booking-1', 'no_show')).toBe(charged);
  });

  it.each(['direction', 'floor'] as const)('permite no-show sin cargo a %s con importe cero', (role) => {
    const deposit = { ...heldDeposit(), breakdown: depositFor({ kind: 'none', menuPercentageBps: 0 }, 2, 10000) };
    const state = { ...initialSolaneState([booking('confirmed', deposit)]), role };
    expect(nextSolaneBookingStatuses(state, 'booking-1')).toContain('no_show');
    const next = transitionSolaneBooking(state, 'booking-1', 'no_show');
    expect(next.bookings[0].status).toBe('no_show');
    expect(next.bookings[0].deposit).toEqual({ ...deposit, status: 'released' });
  });

  it.each(['released', 'charged'] as const)('una garantía %s nunca vuelve a cargarse ni cambia al operar la reserva', (depositStatus) => {
    for (const role of ['direction', 'floor'] satisfies RestaurantRole[]) {
      for (const from of statuses) {
        const deposit = { ...heldDeposit(), status: depositStatus };
        const state = { ...initialSolaneState([booking(from, deposit)]), role };
        for (const to of transitions[from]) {
          const next = transitionSolaneBooking(state, 'booking-1', to);
          expect(next.bookings[0].status).toBe(to);
          expect(next.bookings[0].deposit).toEqual(deposit);
        }
      }
    }
  });

  it.each([
    ['pending', 'confirmed', false], ['confirmed', 'seated', false], ['seated', 'finished', true],
    ['pending', 'cancelled', true], ['confirmed', 'cancelled', true], ['confirmed', 'no_show', true],
  ] as const)('%s → %s actualiza la ocupación real del inventario', (from, to, freesTable) => {
    const state = initialSolaneState([booking(from)]);
    expect(tableAvailability(restaurant, state.bookings, [], [], booking().slot, 2)).toEqual([]);
    const next = transitionSolaneBooking(state, 'booking-1', to);
    const available = tableAvailability(restaurant, next.bookings, [], [], booking().slot, 2);
    expect(available.map((option) => option.tableIds)).toEqual(freesTable ? [['ss1']] : []);
  });

  it('conserva los datos auditables y aísla objetos mutables de la reserva original', () => {
    const state = initialSolaneState([booking('confirmed', heldDeposit()), { ...booking(), id: 'unrelated' }]);
    const before = JSON.stringify(state);
    const next = transitionSolaneBooking(state, 'booking-1', 'no_show');
    expect(JSON.stringify(state)).toBe(before);
    expect(next.bookings[0]).toMatchObject({
      id: 'booking-1', guest: booking().guest, tableIds: ['ss1'], slot: booking().slot, menuId: 'menu',
      bookedAt: booking().bookedAt, source: 'widget', deposit: { ...heldDeposit(), status: 'charged' },
    });
    expect(next.bookings[1]).toBe(state.bookings[1]);
    next.bookings[0].tableIds.push('ss2');
    next.bookings[0].slot.durationMin = 30;
    next.bookings[0].guest.name = 'Changed';
    next.bookings[0].deposit!.breakdown.amountCents = 1;
    next.bookings[0].deposit!.termsAcceptedAt = 'Changed';
    expect(JSON.stringify(state)).toBe(before);
  });

  it.each(['cancelled', 'no_show', 'seated'] as const)('conserva %s y la garantía resuelta en almacenamiento v1', (status) => {
    const next = transitionSolaneBooking(initialSolaneState([booking('confirmed', heldDeposit())]), 'booking-1', status);
    expect(parseSolaneStored(serializeSolaneState(next))).toEqual(next);
  });
});
