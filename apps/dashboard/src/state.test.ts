import { describe, expect, it } from 'vitest';
import type { Restaurant, TableBooking, WaitlistEntry } from '@logic-reserva/domain';
import {
  DEMO_STATE_VERSION,
  addVedraWaitlistEntry,
  assignVedraGroupMenu,
  assignVedraGroupTables,
  confirmVedraGroup,
  initialVedraState,
  parseVedraStored,
  resetVedraGroupJourney,
  seatVedraWaitlistEntry,
  serializeVedraState,
  setVedraTourStep,
  startVedraTour,
  transitionVedraBooking,
  transitionVedraWaitlistEntry,
  upsertVedraBooking,
} from './state';

const fixture = (id = 'fixture-1'): TableBooking => ({
  id,
  restaurantId: 'vedra',
  tableIds: ['vs1'],
  slot: { date: '2026-09-18', startMin: 780, durationMin: 90 },
  partySize: 2,
  status: 'confirmed',
  guest: { name: 'Fixture Guest' },
  source: 'fixture',
});

const restaurant: Restaurant = {
  id: 'vedra', organizationId: 'demo', name: 'Vedra',
  spaces: [{ id: 'sala', name: 'Sala', privatizable: false, tables: [
    { id: 'vs1', name: 'Mesa 1', minSeats: 1, maxSeats: 2, combinableWith: ['vs2'] },
    { id: 'vs2', name: 'Mesa 2', minSeats: 2, maxSeats: 4, combinableWith: ['vs1'] },
  ] }],
  menus: [],
  shifts: [{ id: 'dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1320 }],
};

const waitlistEntry = (overrides: Partial<WaitlistEntry> = {}): WaitlistEntry => ({
  id: 'wait-1', restaurantId: 'vedra', guest: { name: 'Clara Demo' }, partySize: 2,
  requestedSlot: { date: '2026-09-18', startMin: 1200, durationMin: 90 },
  arrivedAt: '2026-08-18T19:30:00.000Z', quotedWaitMin: 20, status: 'waiting', ...overrides,
});

describe('estado Vedra versionado', () => {
  it('crea copias profundas de los fixtures', () => {
    const original = fixture();
    const state = initialVedraState([original]);
    state.bookings[0].guest.name = 'Changed';
    state.bookings[0].tableIds.push('vs2');
    state.group.guest.name = 'Changed group';
    state.group.tableIds.push('vs4');
    expect(original.guest.name).toBe('Fixture Guest');
    expect(original.tableIds).toEqual(['vs1']);
    expect(initialVedraState([original]).group.guest.name).toBe('Familia Ortega');
    expect(initialVedraState([original]).group.tableIds).toEqual([]);
  });

  it('vuelve al estado inicial ante JSON corrupto', () => {
    expect(parseVedraStored('{oops', [fixture()])).toEqual(initialVedraState([fixture()]));
  });

  it('rechaza una versión futura', () => {
    expect(parseVedraStored(JSON.stringify({ version: 99, bookings: [] }), [fixture()])).toEqual(initialVedraState([fixture()]));
  });

  it('fusiona fixtures con reservas web almacenadas', () => {
    const website = { ...fixture('web-1'), guest: { name: 'Web Guest' }, source: 'widget' as const, bookedAt: '2026-08-18T12:00:00.000Z' };
    const state = parseVedraStored(JSON.stringify({ version: DEMO_STATE_VERSION, bookings: [website] }), [fixture()]);
    expect(state.bookings.map((booking) => booking.id)).toEqual(['fixture-1', 'web-1']);
    expect(state.bookings.at(-1)?.bookedAt).toBe('2026-08-18T12:00:00.000Z');
  });

  it('migra de forma compatible el payload F5 que solo tenía reservas', () => {
    const legacy = JSON.stringify({ version: 1, bookings: [{ ...fixture('web-old'), source: 'widget' }] });
    const state = parseVedraStored(legacy, [fixture()]);
    expect(state.bookings.map((booking) => booking.id)).toEqual(['fixture-1', 'web-old']);
    expect(state.group.status).toBe('requested');
    expect(state.tourMode).toBe('unset');
    expect(state.waitlist).toEqual([]);
  });

  it('la versión almacenada sustituye un fixture con el mismo id', () => {
    const updated = { ...fixture(), status: 'seated' as const };
    const state = parseVedraStored(JSON.stringify({ version: DEMO_STATE_VERSION, bookings: [updated] }), [fixture()]);
    expect(state.bookings).toHaveLength(1);
    expect(state.bookings[0].status).toBe('seated');
  });

  it('descarta reservas inválidas sin perder fixtures', () => {
    const invalid = { ...fixture('bad'), partySize: -3 };
    const state = parseVedraStored(JSON.stringify({ version: DEMO_STATE_VERSION, bookings: [invalid] }), [fixture()]);
    expect(state.bookings).toEqual(initialVedraState([fixture()]).bookings);
  });

  it('descarta bookedAt corrupto y sigue aceptando payloads antiguos sin el campo', () => {
    const corrupt = { ...fixture('bad-date'), bookedAt: 'ayer' };
    expect(parseVedraStored(JSON.stringify({ version: 1, bookings: [corrupt] })).bookings).toEqual([]);
    expect(parseVedraStored(JSON.stringify({ version: 1, bookings: [fixture('legacy')] })).bookings[0]?.bookedAt).toBeUndefined();
  });

  it('descarta un recorrido de grupo corrupto sin perder las reservas', () => {
    const raw = JSON.stringify({
      version: 1,
      bookings: [fixture('web-safe')],
      group: { ...initialVedraState().group, status: 'confirmed', tableIds: [] },
      tourMode: 'guided',
      tourStep: 99,
    });
    const state = parseVedraStored(raw, [fixture()]);
    expect(state.bookings.map((booking) => booking.id)).toEqual(['fixture-1', 'web-safe']);
    expect(state.group).toEqual(initialVedraState([fixture()]).group);
    expect(state.tourStep).toBeNull();
  });

  it('serializa y recupera el estado sin cambiar datos', () => {
    const state = upsertVedraBooking(initialVedraState([fixture()]), { ...fixture('web-2'), source: 'widget' });
    expect(parseVedraStored(serializeVedraState(state))).toEqual(state);
  });

  it('solo permite transiciones operativas válidas', () => {
    const state = initialVedraState([fixture()]);
    expect(transitionVedraBooking(state, 'fixture-1', 'seated').bookings[0].status).toBe('seated');
    expect(transitionVedraBooking(state, 'fixture-1', 'finished').bookings[0].status).toBe('confirmed');
  });

  it('completa solicitud → combinación → menú → confirmación', () => {
    let state = startVedraTour(initialVedraState([fixture()]), 'guided');
    expect(state.tourStep).toBe(1);
    state = setVedraTourStep(state, 2);
    expect(state.tourStep).toBe(2);
    state = assignVedraGroupTables(state, ['vs4', 'vs5']);
    expect(state.group.status).toBe('tables_assigned');
    expect(state.tourStep).toBe(3);
    state = assignVedraGroupMenu(state, 'vedra-grupos');
    expect(state.group.status).toBe('menu_assigned');
    state = confirmVedraGroup(state);
    expect(state.group.status).toBe('confirmed');
    expect(state.tourCompleted).toBe(true);
    expect(state.bookings.at(-1)).toMatchObject({
      id: 'vedra-group-booking-8',
      tableIds: ['vs4', 'vs5'],
      partySize: 8,
      menuId: 'vedra-grupos',
      status: 'confirmed',
    });
  });

  it('no confirma un grupo sin combinación y menú', () => {
    const initial = initialVedraState([fixture()]);
    expect(assignVedraGroupMenu(initial, 'vedra-grupos')).toBe(initial);
    expect(confirmVedraGroup(initial)).toBe(initial);
    expect(assignVedraGroupTables(initial, ['vs4'])).toBe(initial);
  });

  it('reinicia solo el viaje de grupo y conserva otras reservas', () => {
    const withWeb = upsertVedraBooking(initialVedraState([fixture()]), { ...fixture('web-keep'), source: 'widget' });
    const confirmed = confirmVedraGroup(assignVedraGroupMenu(assignVedraGroupTables(withWeb, ['vs4', 'vs5']), 'vedra-grupos'));
    const reset = resetVedraGroupJourney(confirmed);
    expect(reset.bookings.map((booking) => booking.id)).toEqual(['fixture-1', 'web-keep']);
    expect(reset.group.status).toBe('requested');
    expect(reset.tourMode).toBe('unset');
  });

  it('añade, avisa y sienta un walk-in sobre una mesa realmente disponible', () => {
    let state = addVedraWaitlistEntry(initialVedraState([fixture()]), waitlistEntry());
    state = transitionVedraWaitlistEntry(state, 'wait-1', 'notified');
    expect(state.waitlist[0].status).toBe('notified');
    state = seatVedraWaitlistEntry(state, 'wait-1', restaurant, 'walkin-1');
    expect(state.waitlist[0]).toMatchObject({ status: 'seated', seatedBookingId: 'walkin-1' });
    expect(state.bookings.find((booking) => booking.id === 'walkin-1')).toMatchObject({ source: 'walkin', status: 'seated', tableIds: ['vs1'] });
  });

  it('mantiene la entrada en espera si no hay inventario', () => {
    const occupied = [fixture('occupied-1'), { ...fixture('occupied-2'), tableIds: ['vs2'] }];
    const state = addVedraWaitlistEntry(initialVedraState(occupied), waitlistEntry({ requestedSlot: fixture().slot }));
    const unchanged = seatVedraWaitlistEntry(state, 'wait-1', restaurant, 'walkin-no-room');
    expect(unchanged).toBe(state);
    expect(unchanged.waitlist[0].status).toBe('waiting');
  });

  it('descarta entradas de espera corruptas sin perder reservas', () => {
    const raw = JSON.stringify({ version: 1, bookings: [], waitlist: [waitlistEntry(), { ...waitlistEntry({ id: 'bad' }), partySize: -1 }] });
    expect(parseVedraStored(raw).waitlist).toEqual([waitlistEntry()]);
  });
});
