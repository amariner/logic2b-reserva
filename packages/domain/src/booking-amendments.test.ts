import { describe, expect, it } from 'vitest';
import {
  amendBooking,
  canAmendBookingAssignment,
  depositFor,
  type BookingAmendment,
  type DepositRecord,
  type PrivateHire,
  type Restaurant,
  type RestaurantEvent,
  type TableBooking,
} from './index';

const restaurant: Restaurant = {
  id: 'restaurant', organizationId: 'demo', name: 'Restaurant',
  spaces: [
    { id: 'room', name: 'Room', privatizable: true, tables: [
      { id: 'a', name: 'A', minSeats: 1, maxSeats: 4, combinableWith: ['b'] },
      { id: 'b', name: 'B', minSeats: 1, maxSeats: 4, combinableWith: ['a'] },
      { id: 'c', name: 'C', minSeats: 1, maxSeats: 4, combinableWith: [] },
    ] },
    { id: 'private', name: 'Private', privatizable: true, tables: [
      { id: 'p', name: 'P', minSeats: 2, maxSeats: 6, combinableWith: [] },
    ] },
  ],
  menus: [{ id: 'internal', name: 'Internal menu', pricePerPersonCents: 3500, courses: ['Main'], bookableOnline: false }],
  shifts: [{ id: 'dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1410 }],
};

const booking = (overrides: Partial<TableBooking> = {}): TableBooking => ({
  id: 'booking', restaurantId: restaurant.id, tableIds: ['a'], partySize: 2,
  slot: { date: '2026-10-03', startMin: 1200, durationMin: 150 },
  guest: { name: 'Ada Demo', email: 'ada@example.test', phone: '+34 600 123 456' },
  status: 'pending', source: 'phone', menuId: 'internal', bookedAt: '2026-10-01T09:00:00.000Z',
  ...overrides,
});

const amendment = (original: TableBooking, overrides: Partial<BookingAmendment> = {}): BookingAmendment => ({
  slot: { ...original.slot }, partySize: original.partySize, tableIds: ['b'], ...overrides,
});

const deposit = (status: DepositRecord['status'] = 'held', zero = false): DepositRecord => ({
  id: 'guarantee', status, termsAcceptedAt: '2026-10-01T08:59:00.000Z',
  breakdown: depositFor({ kind: zero ? 'none' : 'prepay', menuPercentageBps: zero ? 0 : 5000 }, 2, 3500),
});

const event = (overrides: Partial<RestaurantEvent> = {}): RestaurantEvent => ({
  id: 'event', restaurantId: restaurant.id, name: 'Dinner event', slot: { ...booking().slot },
  consumesTableIds: ['b'], capacity: 4, soldSeats: 0, priceCents: 5000, status: 'published', ...overrides,
});

const hire = (overrides: Partial<PrivateHire> = {}): PrivateHire => ({
  id: 'hire', restaurantId: restaurant.id, spaceId: 'room', slot: { ...booking().slot }, status: 'blocked', ...overrides,
});

describe('reprogramación de reservas existentes', () => {
  it.each(['phone', 'widget'] as const)('preserva identidad y metadatos de una reserva %s sin aplicar restricciones de alta', (source) => {
    const original = booking({ source });
    const before = JSON.stringify(original);
    const updated = amendBooking(restaurant, original, amendment(original), [original]);
    expect(updated).toEqual({ ...original, tableIds: ['b'] });
    expect(updated?.status).toBe('pending');
    expect(updated?.menuId).toBe('internal');
    expect(JSON.stringify(original)).toBe(before);
    expect(updated?.guest).not.toBe(original.guest);
    expect(updated?.slot).not.toBe(original.slot);
    expect(updated?.tableIds).not.toBe(original.tableIds);
  });

  it('conserva duración original con el mismo grupo aunque se solicite otra duración', () => {
    const original = booking();
    const updated = amendBooking(restaurant, original, amendment(original, { slot: { ...original.slot, startMin: 1230, durationMin: 90 } }), [original]);
    expect(updated?.slot).toEqual({ ...original.slot, startMin: 1230, durationMin: 150 });
  });

  it('recalcula duración al cambiar personas y admite una combinación válida no mínima', () => {
    const original = booking();
    const larger = amendBooking(restaurant, original, amendment(original, { partySize: 6, tableIds: ['a', 'b'] }), [original]);
    expect(larger).toMatchObject({ partySize: 6, tableIds: ['a', 'b'], slot: { durationMin: 120 } });
    const sameParty = amendBooking(restaurant, original, amendment(original, { tableIds: ['a', 'b'] }), [original]);
    expect(sameParty).toMatchObject({ partySize: 2, tableIds: ['a', 'b'], slot: { durationMin: 150 } });
  });

  it('no guarda cambios vacíos ni reordenación de mesas; el editor reconoce la asignación válida', () => {
    const original = booking({ tableIds: ['a', 'b'], partySize: 6 });
    const noOp = amendment(original, { tableIds: ['b', 'a'] });
    expect(amendBooking(restaurant, original, noOp, [original])).toBeNull();
    expect(canAmendBookingAssignment(restaurant, original, noOp, [original])).toBe(true);
    expect(canAmendBookingAssignment(restaurant, original, noOp, [original], [event()])).toBe(false);
    const ignoredFields = { ...amendment(original), id: 'replacement', guest: { name: 'Replacement' }, source: 'widget', status: 'confirmed', menuId: 'missing' };
    expect(amendBooking(restaurant, original, { ...ignoredFields, tableIds: ['a', 'b'], slot: { ...original.slot, startMin: 1215 } }, [original])).toMatchObject({
      id: original.id, guest: original.guest, status: original.status, source: original.source, menuId: original.menuId,
    });
  });

  it.each(['seated', 'finished', 'no_show', 'cancelled'] as const)('rechaza una reserva %s', (status) => {
    const original = booking({ status });
    expect(amendBooking(restaurant, original, amendment(original), [original])).toBeNull();
    expect(canAmendBookingAssignment(restaurant, original, amendment(original), [original])).toBe(false);
  });

  it('rechaza reserva ausente, id duplicado o de otro restaurante', () => {
    const original = booking();
    expect(amendBooking(restaurant, original, amendment(original), [])).toBeNull();
    expect(amendBooking(restaurant, original, amendment(original), [original, { ...original }])).toBeNull();
    const otherRestaurant = booking({ restaurantId: 'other' });
    expect(amendBooking(restaurant, otherRestaurant, amendment(otherRestaurant), [otherRestaurant])).toBeNull();
  });
});

describe('captura original de la reserva', () => {
  it('rechaza cambios posteriores en cualquiera de los metadatos o condiciones conservados', () => {
    const original = booking();
    const mutations: Partial<TableBooking>[] = [
      { status: 'confirmed' }, { source: 'widget' }, { bookedAt: '2026-10-01T10:00:00.000Z' },
      { menuId: undefined }, { restaurantId: 'other' }, { tableIds: ['c'] }, { partySize: 3 },
      { guest: { ...original.guest, name: 'Different' } }, { guest: { ...original.guest, email: 'other@example.test' } },
      { guest: { ...original.guest, phone: undefined } }, { slot: { ...original.slot, date: '2026-10-04' } },
      { slot: { ...original.slot, startMin: 1215 } }, { slot: { ...original.slot, durationMin: 90 } }, { deposit: deposit() },
    ];
    for (const mutation of mutations) expect(amendBooking(restaurant, original, amendment(original), [{ ...original, ...mutation }])).toBeNull();
  });

  it('compara todos los campos del depósito, incluida aceptación y desglose', () => {
    const original = booking({ deposit: deposit() });
    const mutations: DepositRecord[] = [
      { ...deposit(), id: 'other-guarantee' }, { ...deposit(), status: 'released' },
      { ...deposit(), termsAcceptedAt: '2026-10-01T10:00:00.000Z' },
      { ...deposit(), breakdown: depositFor({ kind: 'card_hold', menuPercentageBps: 2500 }, 2, 3500) },
      { ...deposit(), breakdown: depositFor({ kind: 'prepay', menuPercentageBps: 5000 }, 2, 4000) },
    ];
    for (const guarantee of mutations) expect(amendBooking(restaurant, original, amendment(original), [{ ...original, deposit: guarantee }])).toBeNull();
  });

  it('acepta los mismos datos serializados con distinto orden de propiedades', () => {
    const original = booking({ deposit: deposit() });
    const guarantee = original.deposit!;
    const breakdown = guarantee.breakdown;
    const reordered: TableBooking = {
      bookedAt: original.bookedAt, source: original.source, status: original.status, menuId: original.menuId,
      deposit: { breakdown: { amountCents: breakdown.amountCents, percentageBps: breakdown.percentageBps, menuSubtotalCents: breakdown.menuSubtotalCents,
        pricePerPersonCents: breakdown.pricePerPersonCents, partySize: breakdown.partySize, policyKind: breakdown.policyKind },
      termsAcceptedAt: guarantee.termsAcceptedAt, status: guarantee.status, id: guarantee.id },
      guest: { phone: original.guest.phone, email: original.guest.email, name: original.guest.name },
      partySize: original.partySize, slot: { durationMin: original.slot.durationMin, startMin: original.slot.startMin, date: original.slot.date },
      tableIds: [...original.tableIds], restaurantId: original.restaurantId, id: original.id,
    };
    expect(JSON.stringify(reordered)).not.toBe(JSON.stringify(original));
    expect(amendBooking(restaurant, original, amendment(original), [reordered])).toEqual({ ...original, tableIds: ['b'] });
  });
});

describe('garantías aceptadas al editar', () => {
  it.each(['held', 'released', 'charged'] as const)('una garantía %s solo permite reasignar, conservando todo el justificante', (status) => {
    const original = booking({ status: 'confirmed', deposit: deposit(status) });
    const updated = amendBooking(restaurant, original, amendment(original), [original]);
    expect(updated).toEqual({ ...original, tableIds: ['b'] });
    expect(updated?.deposit).not.toBe(original.deposit);
    expect(updated?.deposit?.breakdown).not.toBe(original.deposit?.breakdown);
    for (const changes of [
      amendment(original, { slot: { ...original.slot, date: '2026-10-04' } }),
      amendment(original, { slot: { ...original.slot, startMin: 1215 } }),
      amendment(original, { slot: { ...original.slot, durationMin: 90 } }),
      amendment(original, { partySize: 3 }),
    ]) expect(amendBooking(restaurant, original, changes, [original])).toBeNull();
  });

  it('un registro de garantía cero también bloquea cambios de condiciones', () => {
    const original = booking({ deposit: deposit('released', true) });
    expect(amendBooking(restaurant, original, amendment(original), [original])?.deposit).toEqual(original.deposit);
    expect(amendBooking(restaurant, original, amendment(original, { partySize: 3 }), [original])).toBeNull();
  });

  it('el resultado no comparte estructuras mutables con reserva, depósito ni formulario', () => {
    const original = booking({ deposit: deposit() });
    const changes = amendment(original);
    const before = JSON.stringify({ original, changes });
    const updated = amendBooking(restaurant, original, changes, [original])!;
    expect(updated).not.toBeNull();
    updated.tableIds.push('c');
    updated.slot.startMin = 0;
    updated.guest.name = 'Changed';
    updated.deposit!.termsAcceptedAt = 'Changed';
    updated.deposit!.breakdown.amountCents = 0;
    expect(JSON.stringify({ original, changes })).toBe(before);
  });
});

describe('inventario y datos de la modificación', () => {
  it('excluye solamente la propia reserva y respeta ocupaciones adyacentes', () => {
    const original = booking();
    const moved = amendment(original, { slot: { ...original.slot, startMin: 1215 }, tableIds: ['a'] });
    expect(amendBooking(restaurant, original, moved, [original])?.slot.startMin).toBe(1215);
    const occupied = booking({ id: 'other', tableIds: ['b'] });
    expect(amendBooking(restaurant, original, amendment(original), [original, occupied])).toBeNull();
    expect(amendBooking(restaurant, original, amendment(original), [original, { ...occupied, status: 'cancelled' }])).not.toBeNull();
    const adjacent = { ...occupied, slot: { ...occupied.slot, startMin: 1110, durationMin: 90 } };
    expect(amendBooking(restaurant, original, amendment(original), [original, adjacent])).not.toBeNull();
  });

  it('comprueba la duración recalculada completa antes de ampliar un grupo', () => {
    const original = booking({ slot: { ...booking().slot, durationMin: 90 } });
    const later = booking({ id: 'later', tableIds: ['b'], slot: { ...original.slot, startMin: 1290 } });
    expect(amendBooking(restaurant, original, amendment(original, { partySize: 6, tableIds: ['a', 'b'] }), [original, later])).toBeNull();
    const adjacent = { ...later, slot: { ...later.slot, startMin: 1320 } };
    expect(amendBooking(restaurant, original, amendment(original, { partySize: 6, tableIds: ['a', 'b'] }), [original, adjacent])?.slot.durationMin).toBe(120);
  });

  it('respeta eventos y privatizaciones sin bloquear borradores ni intervalos adyacentes', () => {
    const original = booking();
    for (const status of ['published', 'soldout'] as const) expect(amendBooking(restaurant, original, amendment(original), [original], [event({ status })])).toBeNull();
    for (const status of ['draft', 'done'] as const) expect(amendBooking(restaurant, original, amendment(original), [original], [event({ status })])).not.toBeNull();
    expect(amendBooking(restaurant, original, amendment(original), [original], [], [hire()])).toBeNull();
    expect(amendBooking(restaurant, original, amendment(original), [original], [], [hire({ status: 'proposed' })])).not.toBeNull();
    const before = { ...original.slot, startMin: 1110, durationMin: 90 };
    expect(amendBooking(restaurant, original, amendment(original), [original], [event({ slot: before })], [hire({ slot: before })])).not.toBeNull();
  });

  it('valida aforo, conectividad, sala, menú y turno conservando servicios hasta pasada medianoche', () => {
    const original = booking();
    for (const tableIds of [[], ['unknown'], ['a', 'a'], ['a', 'c'], ['a', 'p']]) expect(amendBooking(restaurant, original, amendment(original, { tableIds }), [original])).toBeNull();
    expect(amendBooking(restaurant, original, amendment(original, { partySize: 5 }), [original])).toBeNull();
    expect(amendBooking(restaurant, original, amendment(original, { slot: { ...original.slot, startMin: 900 } }), [original])).toBeNull();
    expect(amendBooking({ ...restaurant, menus: [] }, original, amendment(original), [original])).toBeNull();
    expect(amendBooking(restaurant, original, amendment(original, { slot: { ...original.slot, startMin: 1410 } }), [original])?.slot).toMatchObject({ startMin: 1410, durationMin: 150 });
  });

  it('rechaza entradas runtime corruptas sin lanzar ni ignorar una ocupación malformada', () => {
    const original = booking();
    const corruptChanges: unknown[] = [null, {}, { ...amendment(original), slot: null }, { ...amendment(original), tableIds: null },
      { ...amendment(original), tableIds: [1] }, { ...amendment(original), partySize: NaN }, { ...amendment(original), partySize: '2' },
      { ...amendment(original), slot: { ...original.slot, date: '2026-02-30' } }, { ...amendment(original), slot: { ...original.slot, startMin: Infinity } }];
    for (const changes of corruptChanges) expect(amendBooking(restaurant, original, changes as BookingAmendment, [original])).toBeNull();
    for (const corrupt of [null, {}, { ...original, guest: null }, { ...original, slot: null }, { ...original, deposit: { breakdown: null } }]) {
      expect(amendBooking(restaurant, corrupt as TableBooking, amendment(original), [original])).toBeNull();
    }
    expect(amendBooking(null as unknown as Restaurant, original, amendment(original), [original])).toBeNull();
    expect(amendBooking(restaurant, original, amendment(original), [original, null as unknown as TableBooking])).toBeNull();
    expect(amendBooking(restaurant, original, amendment(original), [original], [null as unknown as RestaurantEvent])).toBeNull();
    expect(amendBooking(restaurant, original, amendment(original), [original], [], [null as unknown as PrivateHire])).toBeNull();
    const fakeStatus = { ...event(), status: { toString: () => 'published' } } as unknown as RestaurantEvent;
    expect(amendBooking(restaurant, original, amendment(original), [original], [fakeStatus])).toBeNull();
  });
});
