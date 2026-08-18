import { describe, expect, it } from 'vitest';
import { tableAvailability, voucherValue, type ExperienceVoucher, type PrivateHire, type Restaurant, type RestaurantEvent, type TableBooking, type WaitlistEntry } from '@logic-reserva/domain';
import {
  SOLANE_STATE_VERSION,
  addSolaneWaitlistEntry,
  blockSolanePrivateHire,
  createSolaneEvent,
  initialSolaneState,
  issueSolaneVoucher,
  parseSolaneStored,
  publishSolaneEvent,
  prepareSolanePrivateHire,
  registerSolanePrivateHireDeposit,
  redeemSolaneVoucher,
  resolveSolaneBookingDeposit,
  seatSolaneWaitlistEntry,
  sellSolaneTickets,
  serializeSolaneState,
  setSolaneRole,
  startSolanePrivateHireTour,
  transitionSolaneWaitlistEntry,
  upsertSolaneBooking,
} from './solane-state';

const restaurant: Restaurant = {
  id: 'solane',
  organizationId: 'demo',
  name: 'Solane',
  spaces: [{ id: 'sala', name: 'Sala', privatizable: true, tables: [
    { id: 'ss1', name: 'Mesa 1', minSeats: 1, maxSeats: 4, combinableWith: ['ss2'] },
    { id: 'ss2', name: 'Mesa 2', minSeats: 1, maxSeats: 4, combinableWith: ['ss1'] },
  ] }],
  menus: [{ id: 'menu', name: 'Menú', pricePerPersonCents: 10000, courses: ['Uno'], bookableOnline: true }],
  shifts: [{ id: 'dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1320 }],
};

const booking = (id = 'booking-1'): TableBooking => ({
  id,
  restaurantId: 'solane',
  tableIds: ['ss1'],
  slot: { date: '2026-09-18', startMin: 1260, durationMin: 90 },
  partySize: 2,
  status: 'confirmed',
  guest: { name: 'Ada Demo' },
  menuId: 'menu',
  source: 'fixture',
});

const event = (id = 'event-1'): RestaurantEvent => ({
  id,
  restaurantId: 'solane',
  name: 'Cena especial',
  slot: { date: '2026-09-18', startMin: 1260, durationMin: 180 },
  capacity: 8,
  priceCents: 16500,
  soldSeats: 0,
  consumesTableIds: ['ss1', 'ss2'],
  status: 'draft',
});

const depositedBooking = (id = 'deposit-booking'): TableBooking => ({
  ...booking(id),
  deposit: {
    id: `deposit-${id}`,
    breakdown: {
      policyKind: 'prepay',
      partySize: 2,
      pricePerPersonCents: 10000,
      menuSubtotalCents: 20000,
      percentageBps: 5000,
      amountCents: 10000,
    },
    termsAcceptedAt: '2026-08-17T18:30:00.000Z',
    status: 'held',
  },
});

const privateHire = (): PrivateHire => ({
  id: 'hire-1',
  restaurantId: 'solane',
  spaceId: 'sala',
  slot: { date: '2026-09-20', startMin: 1200, durationMin: 240 },
  status: 'requested',
});

const waitlistEntry = (overrides: Partial<WaitlistEntry> = {}): WaitlistEntry => ({
  id: 'wait-1', restaurantId: 'solane', guest: { name: 'Clara Demo' }, partySize: 2,
  requestedSlot: { date: '2026-09-18', startMin: 1260, durationMin: 90 },
  arrivedAt: '2026-08-18T19:30:00.000Z', quotedWaitMin: 20, status: 'waiting', ...overrides,
});

const voucher = (overrides: Partial<ExperienceVoucher> = {}): ExperienceVoucher => ({
  id: 'voucher-1', restaurantId: 'solane', code: 'SOLANE-AB12CD', experienceId: 'menu', experienceName: 'Menú', recipientName: 'Ada Demo',
  value: voucherValue(2, 10000), issuedAt: '2026-08-18T16:00:00.000Z', expiresOn: '2027-08-18', status: 'issued', ...overrides,
});

describe('estado Solane versionado', () => {
  it('clona profundamente fixtures', () => {
    const sourceBooking = booking();
    const sourceEvent = event();
    const state = initialSolaneState([sourceBooking], [sourceEvent]);
    state.bookings[0].tableIds.push('ss2');
    state.events[0].consumesTableIds.pop();
    expect(sourceBooking.tableIds).toEqual(['ss1']);
    expect(sourceEvent.consumesTableIds).toEqual(['ss1', 'ss2']);
  });

  it('vuelve a fixtures ante JSON corrupto o versión futura', () => {
    const fallback = initialSolaneState([booking()], [event()]);
    expect(parseSolaneStored('{oops', [booking()], [event()])).toEqual(fallback);
    expect(parseSolaneStored(JSON.stringify({ version: 99, bookings: [], events: [] }), [booking()], [event()])).toEqual(fallback);
  });

  it('fusiona cambios almacenados con fixtures', () => {
    const web = { ...booking('web-1'), source: 'widget' as const, bookedAt: '2026-08-18T12:00:00.000Z' };
    const published = { ...event(), status: 'published' as const };
    const state = parseSolaneStored(JSON.stringify({ version: 1, bookings: [web], events: [published], sales: [] }), [booking()], [event()]);
    expect(state.bookings.map((item) => item.id)).toEqual(['booking-1', 'web-1']);
    expect(state.bookings.at(-1)?.bookedAt).toBe('2026-08-18T12:00:00.000Z');
    expect(state.events[0].status).toBe('published');
  });

  it('acepta el payload F8 sin campos F9 y aporta rol, tour y privatización fixture', () => {
    const legacy = JSON.stringify({ version: 1, bookings: [], events: [], sales: [] });
    const state = parseSolaneStored(legacy, [], [], [privateHire()]);
    expect(state.privateHires).toEqual([privateHire()]);
    expect(state.role).toBe('direction');
    expect(state.privateHireTour).toEqual({ mode: 'choice', step: 1, completed: false });
    expect(state.waitlist).toEqual([]);
    expect(state.vouchers).toEqual([]);
  });

  it('conserva un depósito válido y descarta una reserva con desglose corrupto', () => {
    const valid = parseSolaneStored(JSON.stringify({ version: 1, bookings: [depositedBooking()], events: [], sales: [] }));
    expect(valid.bookings[0].deposit).toEqual(depositedBooking().deposit);
    const corrupt = depositedBooking('corrupt');
    corrupt.deposit!.breakdown.amountCents = 99999;
    expect(parseSolaneStored(JSON.stringify({ version: 1, bookings: [corrupt], events: [], sales: [] })).bookings).toEqual([]);
  });

  it('mantiene compatible v1 sin bookedAt y rechaza una fecha de creación corrupta', () => {
    expect(parseSolaneStored(JSON.stringify({ version: 1, bookings: [booking('legacy')], events: [], sales: [] })).bookings[0]?.bookedAt).toBeUndefined();
    expect(parseSolaneStored(JSON.stringify({ version: 1, bookings: [{ ...booking('bad-date'), bookedAt: 'not-a-date' }], events: [], sales: [] })).bookings).toEqual([]);
  });

  it('descarta eventos corruptos y ventas huérfanas', () => {
    const state = parseSolaneStored(JSON.stringify({
      version: 1,
      bookings: [],
      events: [{ ...event('bad'), capacity: -2 }],
      sales: [{ id: 'sale', eventId: 'missing', seats: 2, purchasedAt: '2026-08-17T10:00:00.000Z' }],
    }), [], [event()]);
    expect(state.events).toEqual(initialSolaneState([], [event()]).events);
    expect(state.sales).toEqual([]);
  });

  it('crea un borrador válido y rechaza capacidad imposible', () => {
    const initial = initialSolaneState();
    expect(createSolaneEvent(initial, event(), restaurant).events).toHaveLength(1);
    expect(createSolaneEvent(initial, { ...event(), capacity: 9 }, restaurant)).toBe(initial);
  });

  it('publicar cambia inmediatamente la disponibilidad', () => {
    const draft = createSolaneEvent(initialSolaneState(), event(), restaurant);
    const before = tableAvailability(restaurant, [], draft.events, [], event().slot, 2);
    const published = publishSolaneEvent(draft, 'event-1', restaurant);
    const after = tableAvailability(restaurant, [], published.events, [], event().slot, 2);
    expect(before.length).toBeGreaterThan(0);
    expect(after).toEqual([]);
  });

  it('rechaza publicar sobre una reserva activa', () => {
    const draft = createSolaneEvent(initialSolaneState([booking()]), event(), restaurant);
    expect(() => publishSolaneEvent(draft, 'event-1', restaurant)).toThrow(/double booking/);
  });

  it('vende plazas, audita la venta y marca soldout', () => {
    let state = publishSolaneEvent(createSolaneEvent(initialSolaneState(), event(), restaurant), 'event-1', restaurant);
    state = sellSolaneTickets(state, 'event-1', 3, 'sale-1', '2026-08-17T10:00:00.000Z');
    expect(state.events[0]).toMatchObject({ soldSeats: 3, status: 'published' });
    state = sellSolaneTickets(state, 'event-1', 5, 'sale-2', '2026-08-17T10:01:00.000Z');
    expect(state.events[0]).toMatchObject({ soldSeats: 8, status: 'soldout' });
    expect(state.sales).toHaveLength(2);
  });

  it('no sobrevende ni acepta ventas en borrador', () => {
    const draft = createSolaneEvent(initialSolaneState(), event(), restaurant);
    expect(sellSolaneTickets(draft, 'event-1', 1, 'sale', '2026-08-17T10:00:00.000Z')).toBe(draft);
    const published = publishSolaneEvent(draft, 'event-1', restaurant);
    expect(sellSolaneTickets(published, 'event-1', 9, 'sale', '2026-08-17T10:00:00.000Z')).toBe(published);
  });

  it('resuelve el depósito con el motor de dominio para no-show y sentado', () => {
    const initial = initialSolaneState([depositedBooking('no-show'), depositedBooking('seated')]);
    const charged = resolveSolaneBookingDeposit(initial, 'no-show', 'no_show');
    expect(charged.bookings.find((item) => item.id === 'no-show')).toMatchObject({ status: 'no_show', deposit: { status: 'charged' } });
    const released = resolveSolaneBookingDeposit(charged, 'seated', 'seated');
    expect(released.bookings.find((item) => item.id === 'seated')).toMatchObject({ status: 'seated', deposit: { status: 'released' } });
    expect(resolveSolaneBookingDeposit(released, 'seated', 'no_show')).toBe(released);
  });

  it('completa solicitud, propuesta, señal y bloqueo del espacio', () => {
    let state = startSolanePrivateHireTour(initialSolaneState([], [], [privateHire()]), 'guided');
    state = prepareSolanePrivateHire(state, 'hire-1', { menuId: 'menu', pricePerPersonCents: 10000, minimumGuests: 6, depositCents: 15000 }, restaurant);
    expect(state.privateHires[0]).toMatchObject({ status: 'proposed', proposal: { menuId: 'menu', minimumGuests: 6 } });
    expect(state.privateHireTour.step).toBe(2);
    state = registerSolanePrivateHireDeposit(state, 'hire-1');
    expect(state.privateHires[0].status).toBe('deposit_paid');
    expect(state.privateHireTour.step).toBe(3);
    state = blockSolanePrivateHire(state, 'hire-1', restaurant);
    expect(state.privateHires[0].status).toBe('blocked');
    expect(state.privateHireTour.completed).toBe(true);
    expect(tableAvailability(restaurant, [], [], state.privateHires, privateHire().slot, 2)).toEqual([]);
  });

  it('aplica permisos también en las mutaciones del estado', () => {
    const kitchen = setSolaneRole(initialSolaneState([depositedBooking()], [], [privateHire()]), 'kitchen');
    expect(prepareSolanePrivateHire(kitchen, 'hire-1', { menuId: 'menu', pricePerPersonCents: 10000, minimumGuests: 6, depositCents: 15000 }, restaurant)).toBe(kitchen);
    expect(resolveSolaneBookingDeposit(kitchen, 'deposit-booking', 'seated')).toBe(kitchen);
    const floor = setSolaneRole(kitchen, 'floor');
    expect(resolveSolaneBookingDeposit(floor, 'deposit-booking', 'no_show')).toBe(floor);
    expect(resolveSolaneBookingDeposit(floor, 'deposit-booking', 'seated').bookings[0].deposit?.status).toBe('released');
  });

  it('serializa reservas, eventos y ventas sin perder datos', () => {
    let state = upsertSolaneBooking(initialSolaneState([], [event()]), { ...booking('web'), status: 'cancelled' });
    state = publishSolaneEvent(state, 'event-1', restaurant);
    state = sellSolaneTickets(state, 'event-1', 2, 'sale', '2026-08-17T10:00:00.000Z');
    expect(parseSolaneStored(serializeSolaneState(state))).toEqual(state);
    expect(JSON.parse(serializeSolaneState(state)).version).toBe(SOLANE_STATE_VERSION);
  });

  it('emite, persiste y canjea un bono una sola vez', () => {
    let state = issueSolaneVoucher(initialSolaneState(), voucher());
    expect(state.vouchers).toEqual([voucher()]);
    expect(parseSolaneStored(serializeSolaneState(state)).vouchers).toEqual([voucher()]);
    state = redeemSolaneVoucher(state, 'voucher-1', '2027-08-17T18:00:00.000Z');
    expect(state.vouchers[0]).toMatchObject({ status: 'redeemed', redeemedAt: '2027-08-17T18:00:00.000Z' });
    expect(redeemSolaneVoucher(state, 'voucher-1', '2027-08-17T19:00:00.000Z')).toBe(state);
  });

  it('descarta bonos manipulados y aplica permisos al canje', () => {
    const corrupt = { ...voucher(), value: { ...voucher().value, totalValueCents: 1 } };
    expect(parseSolaneStored(JSON.stringify({ version: 1, bookings: [], events: [], vouchers: [corrupt] })).vouchers).toEqual([]);
    const issued = issueSolaneVoucher(initialSolaneState(), voucher());
    const kitchen = setSolaneRole(issued, 'kitchen');
    expect(redeemSolaneVoucher(kitchen, 'voucher-1', '2027-08-17T18:00:00.000Z')).toBe(kitchen);
    const floor = setSolaneRole(kitchen, 'floor');
    expect(redeemSolaneVoucher(floor, 'voucher-1', '2027-08-17T18:00:00.000Z').vouchers[0].status).toBe('redeemed');
  });

  it('serializa y restaura el depósito y su aceptación temporal', () => {
    const state = initialSolaneState([depositedBooking()]);
    expect(parseSolaneStored(serializeSolaneState(state))).toEqual(state);
  });

  it('gestiona la cola y la convierte en reserva sentada sin saltarse el inventario', () => {
    let state = addSolaneWaitlistEntry(initialSolaneState(), waitlistEntry());
    state = transitionSolaneWaitlistEntry(state, 'wait-1', 'notified');
    state = seatSolaneWaitlistEntry(state, 'wait-1', restaurant, 'walkin-1');
    expect(state.waitlist[0]).toMatchObject({ status: 'seated', seatedBookingId: 'walkin-1' });
    expect(state.bookings[0]).toMatchObject({ id: 'walkin-1', source: 'walkin', status: 'seated', tableIds: ['ss1'] });
  });

  it('un evento publicado impide sentar la cola en sus mesas', () => {
    const fullEvent = { ...event(), status: 'published' as const };
    const state = addSolaneWaitlistEntry(initialSolaneState([], [fullEvent]), waitlistEntry());
    const unchanged = seatSolaneWaitlistEntry(state, 'wait-1', restaurant, 'walkin-blocked');
    expect(unchanged).toBe(state);
    expect(unchanged.waitlist[0].status).toBe('waiting');
  });

  it('Cocina no puede mutar la lista de espera', () => {
    const kitchen = setSolaneRole(initialSolaneState(), 'kitchen');
    expect(addSolaneWaitlistEntry(kitchen, waitlistEntry())).toBe(kitchen);
    const withEntry = addSolaneWaitlistEntry(initialSolaneState(), waitlistEntry());
    const kitchenWithEntry = setSolaneRole(withEntry, 'kitchen');
    expect(transitionSolaneWaitlistEntry(kitchenWithEntry, 'wait-1', 'cancelled')).toBe(kitchenWithEntry);
    expect(seatSolaneWaitlistEntry(kitchenWithEntry, 'wait-1', restaurant, 'walkin-1')).toBe(kitchenWithEntry);
  });

  it('descarta cola corrupta sin perder fixtures', () => {
    const raw = JSON.stringify({ version: 1, bookings: [], events: [], sales: [], waitlist: [waitlistEntry(), { ...waitlistEntry({ id: 'bad' }), quotedWaitMin: 999 }] });
    expect(parseSolaneStored(raw).waitlist).toEqual([waitlistEntry()]);
  });
});
