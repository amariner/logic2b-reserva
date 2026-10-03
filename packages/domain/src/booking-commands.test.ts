import { describe, expect, it } from 'vitest';
import { canCreateBooking, validateSlot, type Restaurant, type TableBooking } from './index';

const restaurant: Restaurant = {
  id: 'r', organizationId: 'demo', name: 'Restaurant',
  spaces: [{ id: 'room', name: 'Room', privatizable: true, tables: [
    { id: 't1', name: 'Table 1', minSeats: 1, maxSeats: 4, combinableWith: ['t2'] },
    { id: 't2', name: 'Table 2', minSeats: 1, maxSeats: 4, combinableWith: ['t1'] },
  ] }],
  menus: [{ id: 'menu', name: 'Menu', pricePerPersonCents: 1000, courses: ['Main'], bookableOnline: false }],
  shifts: [{ id: 'dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1410 }],
};
const booking: TableBooking = {
  id: 'new', restaurantId: 'r', tableIds: ['t1'],
  slot: { date: '2026-10-03', startMin: 1200, durationMin: 90 },
  partySize: 2, guest: { name: 'Guest' }, status: 'confirmed', source: 'phone',
};

describe('validación del alta de reserva', () => {
  it('comprueba capacidad, identidad, datos de contacto y horario', () => {
    expect(canCreateBooking(restaurant, booking, [])).toBe(true);
    expect(canCreateBooking(restaurant, { ...booking, id: ' ' }, [])).toBe(false);
    expect(canCreateBooking(restaurant, { ...booking, partySize: 5 }, [])).toBe(false);
    expect(canCreateBooking(restaurant, { ...booking, partySize: NaN }, [])).toBe(false);
    expect(canCreateBooking(restaurant, { ...booking, guest: { name: 'Guest', email: 'bad' } }, [])).toBe(false);
    expect(canCreateBooking(restaurant, { ...booking, slot: { ...booking.slot, startMin: 900 } }, [])).toBe(false);
  });

  it('protege IDs y permite reservas válidas junto a conflictos previos ajenos', () => {
    expect(canCreateBooking(restaurant, { ...booking, id: ' new ' }, [booking])).toBe(false);
    const elsewhere = { ...booking, tableIds: ['t2'] };
    expect(canCreateBooking(restaurant, booking, [{ ...elsewhere, id: 'a' }, { ...elsewhere, id: 'b' }])).toBe(true);
    expect(canCreateBooking(restaurant, booking, [{ ...booking, id: 'occupied' }])).toBe(false);
    expect(canCreateBooking(restaurant, booking, [{ ...booking, id: 'cancelled', status: 'cancelled' }])).toBe(true);
  });

  it('el widget respeta menús online; sala puede registrar un menú interno', () => {
    expect(canCreateBooking(restaurant, { ...booking, menuId: 'menu' }, [])).toBe(true);
    expect(canCreateBooking(restaurant, { ...booking, menuId: 'menu', source: 'widget' }, [])).toBe(false);
    expect(canCreateBooking(restaurant, { ...booking, menuId: 'missing' }, [])).toBe(false);
  });
});

describe('franjas válidas al reservar', () => {
  it('rechaza fechas imposibles, valores no enteros y horas fuera del día', () => {
    for (const date of ['', '2026-02-30', '2026-13-01', '2025-02-29']) expect(validateSlot({ ...booking.slot, date }).length).toBeGreaterThan(0);
    for (const startMin of [-15, 1440, NaN, Infinity, 1200.5]) expect(validateSlot({ ...booking.slot, startMin }).length).toBeGreaterThan(0);
    for (const durationMin of [-15, 0, NaN, Infinity, 90.5]) expect(validateSlot({ ...booking.slot, durationMin }).length).toBeGreaterThan(0);
  });

  it('acepta años bisiestos y servicios que terminan después de medianoche', () => {
    expect(validateSlot({ date: '2028-02-29', startMin: 1410, durationMin: 150 })).toEqual([]);
    expect(canCreateBooking(restaurant, { ...booking, slot: { ...booking.slot, startMin: 1410, durationMin: 150 } }, [])).toBe(true);
  });
});
