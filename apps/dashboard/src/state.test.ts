import { describe, expect, it } from 'vitest';
import type { TableBooking } from '@logic-reserva/domain';
import {
  DEMO_STATE_VERSION,
  assignVedraGroupMenu,
  assignVedraGroupTables,
  confirmVedraGroup,
  initialVedraState,
  parseVedraStored,
  resetVedraGroupJourney,
  serializeVedraState,
  setVedraTourStep,
  startVedraTour,
  transitionVedraBooking,
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
    const website = { ...fixture('web-1'), guest: { name: 'Web Guest' }, source: 'widget' as const };
    const state = parseVedraStored(JSON.stringify({ version: DEMO_STATE_VERSION, bookings: [website] }), [fixture()]);
    expect(state.bookings.map((booking) => booking.id)).toEqual(['fixture-1', 'web-1']);
  });

  it('migra de forma compatible el payload F5 que solo tenía reservas', () => {
    const legacy = JSON.stringify({ version: 1, bookings: [{ ...fixture('web-old'), source: 'widget' }] });
    const state = parseVedraStored(legacy, [fixture()]);
    expect(state.bookings.map((booking) => booking.id)).toEqual(['fixture-1', 'web-old']);
    expect(state.group.status).toBe('requested');
    expect(state.tourMode).toBe('unset');
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
});
