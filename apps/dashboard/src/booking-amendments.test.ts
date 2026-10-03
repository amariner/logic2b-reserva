import { describe, expect, it } from 'vitest';
import { depositFor, type AttendanceConfirmation, type BookingAmendment, type BookingStatus, type Restaurant, type TableBooking } from '@logic-reserva/domain';
import { amendSolaneBooking, amendVedraBooking } from './booking-amendments';
import { initialSolaneState, parseSolaneStored, serializeSolaneState } from './solane-state';
import { initialVedraState, parseVedraStored, serializeVedraState } from './state';

const restaurant = (id: 'solane' | 'vedra'): Restaurant => ({
  id, organizationId: 'demo', name: id,
  spaces: [{ id: 'room', name: 'Sala', privatizable: true, tables: [
    { id: 't1', name: 'Mesa 1', minSeats: 1, maxSeats: 8, combinableWith: ['t2'] },
    { id: 't2', name: 'Mesa 2', minSeats: 1, maxSeats: 8, combinableWith: ['t1'] },
  ] }],
  menus: [{ id: 'menu', name: 'Menú', pricePerPersonCents: 10000, courses: ['Uno'], bookableOnline: true }],
  shifts: [{ id: 'dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1380 }],
});

const booking = (restaurantId: 'solane' | 'vedra', id = 'booking-1'): TableBooking => ({
  id, restaurantId, tableIds: ['t1'], slot: { date: '2026-10-03', startMin: 1200, durationMin: 105 },
  partySize: 2, status: 'confirmed', source: 'phone', menuId: 'menu',
  guest: { name: 'Ada Demo', email: 'ada@example.test', phone: '+34600000000' },
  bookedAt: '2026-10-01T09:00:00.000Z',
});

const reassignment = (original: TableBooking): BookingAmendment => ({
  slot: { ...original.slot }, partySize: original.partySize, tableIds: ['t2'],
});

const confirmation = (bookingId = 'booking-1', reference = 'solane_reference_01'): AttendanceConfirmation => ({
  reference, bookingId, restaurantId: 'solane', status: 'prepared',
  preparedAt: '2026-10-01T10:00:00.000Z', expiresAt: '2026-10-03T12:00:00.000Z',
});

describe('edición de reservas dentro del estado del gestor', () => {
  it('Vedra sustituye solo la reserva editada y conserva sus metadatos y el estado ajeno', () => {
    const original = booking('vedra');
    const state = initialVedraState([original, { ...booking('vedra', 'other'), slot: { ...original.slot, date: '2026-10-04' } }]);
    const before = JSON.stringify(state);
    const next = amendVedraBooking(state, restaurant('vedra'), original, reassignment(original));
    expect(next.bookings[0]).toEqual({ ...original, tableIds: ['t2'] });
    expect(next.bookings[1]).toBe(state.bookings[1]);
    expect(next.group).toBe(state.group);
    expect(next.waitlist).toBe(state.waitlist);
    expect(JSON.stringify(state)).toBe(before);
    expect(parseVedraStored(serializeVedraState(next))).toEqual(next);
  });

  it.each(['direction', 'floor'] as const)('Solane permite editar con %s sin alterar los demás módulos', (role) => {
    const original = booking('solane');
    const state = { ...initialSolaneState([original]), role, attendanceConfirmations: [confirmation()] };
    const before = JSON.stringify(state);
    const next = amendSolaneBooking(state, restaurant('solane'), original, reassignment(original));
    expect(next.bookings[0]).toEqual({ ...original, tableIds: ['t2'] });
    expect({ ...next, bookings: state.bookings }).toEqual(state);
    expect(next.events).toBe(state.events);
    expect(next.privateHires).toBe(state.privateHires);
    expect(next.waitlist).toBe(state.waitlist);
    expect(next.vouchers).toBe(state.vouchers);
    expect(next.sales).toBe(state.sales);
    expect(next.attendanceConfirmations).toBe(state.attendanceConfirmations);
    expect(JSON.stringify(state)).toBe(before);
    expect(parseSolaneStored(serializeSolaneState(next))).toEqual(next);
  });

  it('Cocina no puede editar y conserva también los enlaces de asistencia', () => {
    const original = booking('solane');
    const state = { ...initialSolaneState([original]), role: 'kitchen' as const, attendanceConfirmations: [confirmation()] };
    expect(amendSolaneBooking(state, restaurant('solane'), original, reassignment(original))).toBe(state);
  });

  it.each(['pending', 'confirmed'] as const)('preserva el estado %s al cambiar las condiciones', (status) => {
    const original = { ...booking('solane'), status };
    const state = initialSolaneState([original]);
    const next = amendSolaneBooking(state, restaurant('solane'), original, { ...reassignment(original), partySize: 5 });
    expect(next.bookings[0]).toMatchObject({ status, partySize: 5, slot: { durationMin: 120 }, id: original.id, source: original.source, bookedAt: original.bookedAt });
  });

  it.each(['seated', 'finished', 'no_show', 'cancelled'] satisfies BookingStatus[])('rechaza una edición abierta antes de pasar a %s', (status) => {
    const original = booking('solane');
    const state = { ...initialSolaneState([{ ...original, status }]), attendanceConfirmations: [confirmation()] };
    expect(amendSolaneBooking(state, restaurant('solane'), original, reassignment(original))).toBe(state);
    const vedraOriginal = booking('vedra');
    const vedraState = initialVedraState([{ ...vedraOriginal, status }]);
    expect(amendVedraBooking(vedraState, restaurant('vedra'), vedraOriginal, reassignment(vedraOriginal))).toBe(vedraState);
  });

  it('rechaza el snapshot anterior cuando cambia un dato del cliente aunque la mesa siga disponible', () => {
    const original = booking('solane');
    const current = { ...original, guest: { ...original.guest, phone: '+34600000001' } };
    const state = { ...initialSolaneState([current]), attendanceConfirmations: [confirmation()] };
    expect(amendSolaneBooking(state, restaurant('solane'), original, reassignment(original))).toBe(state);
    const vedraOriginal = booking('vedra');
    const vedraState = initialVedraState([{ ...vedraOriginal, bookedAt: '2026-10-01T09:15:00.000Z' }]);
    expect(amendVedraBooking(vedraState, restaurant('vedra'), vedraOriginal, reassignment(vedraOriginal))).toBe(vedraState);
  });

  it('conserva identidad del estado ante ausencia, no-op o restaurante incorrecto', () => {
    const original = booking('solane');
    const state = initialSolaneState([original]);
    expect(amendSolaneBooking(state, restaurant('solane'), { ...original, id: 'missing' }, reassignment(original))).toBe(state);
    expect(amendSolaneBooking(state, restaurant('solane'), original, { ...reassignment(original), tableIds: ['t1'] })).toBe(state);
    expect(amendSolaneBooking(state, restaurant('vedra'), original, reassignment(original))).toBe(state);
    const vedraOriginal = booking('vedra');
    const vedraState = initialVedraState([vedraOriginal]);
    expect(amendVedraBooking(vedraState, restaurant('vedra'), { ...vedraOriginal, id: 'missing' }, reassignment(vedraOriginal))).toBe(vedraState);
    expect(amendVedraBooking(vedraState, restaurant('vedra'), vedraOriginal, { ...reassignment(vedraOriginal), tableIds: ['t1'] })).toBe(vedraState);
    expect(amendVedraBooking(vedraState, restaurant('solane'), vedraOriginal, reassignment(vedraOriginal))).toBe(vedraState);
  });

  it.each(['date', 'startMin', 'partySize'] as const)('retira todos los enlaces propios al cambiar %s y conserva los de otras reservas', (field) => {
    const original = booking('solane');
    const other = { ...booking('solane', 'other'), slot: { ...original.slot, date: '2026-10-10' } };
    const own = confirmation();
    const oldResponse: AttendanceConfirmation = { ...confirmation(original.id, 'solane_reference_02'), status: 'attendance_confirmed', respondedAt: '2026-10-01T11:00:00.000Z' };
    const unrelated = confirmation(other.id, 'solane_reference_03');
    const state = { ...initialSolaneState([original, other]), attendanceConfirmations: [own, oldResponse, unrelated] };
    const changes = reassignment(original);
    if (field === 'date') changes.slot.date = '2026-10-04';
    if (field === 'startMin') changes.slot.startMin = 1230;
    if (field === 'partySize') changes.partySize = 5;
    const next = amendSolaneBooking(state, restaurant('solane'), original, changes);
    expect(next).not.toBe(state);
    expect(next.attendanceConfirmations).toEqual([unrelated]);
    expect(next.attendanceConfirmations[0]).toBe(unrelated);
    expect(state.attendanceConfirmations).toEqual([own, oldResponse, unrelated]);
    expect(parseSolaneStored(serializeSolaneState(next))).toEqual(next);
  });

  it('reasigna una garantía liberada conservando aceptación, importe y referencias de asistencia', () => {
    const original: TableBooking = {
      ...booking('solane'), source: 'widget', deposit: {
        id: 'deposit-1', status: 'released', termsAcceptedAt: '2026-10-01T08:59:00.000Z',
        breakdown: depositFor({ kind: 'prepay', menuPercentageBps: 5000 }, 2, 10000),
      },
    };
    const state = { ...initialSolaneState([original]), attendanceConfirmations: [confirmation()] };
    const next = amendSolaneBooking(state, restaurant('solane'), original, reassignment(original));
    expect(next.bookings[0].deposit).toEqual(original.deposit);
    expect(next.attendanceConfirmations).toBe(state.attendanceConfirmations);
    expect(parseSolaneStored(serializeSolaneState(next))).toEqual(next);
    const scheduleChange = { ...reassignment(original), slot: { ...original.slot, startMin: 1230 } };
    expect(amendSolaneBooking(state, restaurant('solane'), original, scheduleChange)).toBe(state);
  });

  it('pasa eventos y privatizaciones actuales al dominio y conserva enlaces cuando impiden la edición', () => {
    const original = booking('solane');
    const eventState = {
      ...initialSolaneState([original], [{
        id: 'event-1', restaurantId: 'solane', name: 'Evento', status: 'published',
        slot: { ...original.slot }, capacity: 8, soldSeats: 0, priceCents: 1000, consumesTableIds: ['t2'],
      }]), attendanceConfirmations: [confirmation()],
    };
    expect(amendSolaneBooking(eventState, restaurant('solane'), original, reassignment(original))).toBe(eventState);
    const hireState = {
      ...initialSolaneState([original], [], [{
        id: 'hire-1', restaurantId: 'solane', spaceId: 'room', status: 'blocked',
        slot: { ...original.slot, date: '2026-10-04' },
        proposal: { menuId: 'menu', pricePerPersonCents: 10000, minimumGuests: 8, depositCents: 10000 },
      }]), attendanceConfirmations: [confirmation()],
    };
    expect(amendSolaneBooking(hireState, restaurant('solane'), original, {
      ...reassignment(original), slot: { ...original.slot, date: '2026-10-04' },
    })).toBe(hireState);
  });

  it('mantiene el detalle del grupo confirmado coherente al reducirlo a una persona y una mesa', () => {
    const original = { ...booking('vedra', 'vedra-group-booking-8'), tableIds: ['t1', 't2'], partySize: 8 };
    const initial = initialVedraState([original]);
    const state = {
      ...initial, tourMode: 'guided' as const, tourStep: 3 as const, tourCompleted: true,
      group: { ...initial.group, status: 'confirmed' as const, tableIds: [...original.tableIds], partySize: 8, slot: { ...original.slot }, menuId: original.menuId },
    };
    const next = amendVedraBooking(state, restaurant('vedra'), original, {
      ...reassignment(original), partySize: 1, slot: { ...original.slot, startMin: 1230 },
    });
    expect(next.group).toEqual({ ...state.group, slot: { ...next.bookings[0].slot }, partySize: 1, tableIds: ['t2'] });
    expect(next.group.tableIds).not.toBe(next.bookings[0].tableIds);
    expect(next.group.slot).not.toBe(next.bookings[0].slot);
    expect(state.group.partySize).toBe(8);
    expect(parseVedraStored(serializeVedraState(next))).toEqual(next);
  });
});
