import { describe, expect, it } from 'vitest';
import type { BookingStatus, Restaurant, TableBooking } from '@logic-reserva/domain';
import { filterBookings, INITIAL_BOOKING_FILTERS, type BookingFilters } from './booking-filters';

const restaurant: Restaurant = {
  id: 'vedra', organizationId: 'demo', name: 'Vedra',
  spaces: [{ id: 'room', name: 'Sala', privatizable: false, tables: [
    { id: 'vs1', name: 'Rincón del jardín', minSeats: 1, maxSeats: 4, combinableWith: ['vs2'] },
    { id: 'vs2', name: 'Mesa 2', minSeats: 1, maxSeats: 4, combinableWith: ['vs1'] },
  ] }],
  menus: [],
  shifts: [
    { id: 'lunch', kind: 'lunch', firstSeatingMin: 780, lastSeatingMin: 900 },
    { id: 'dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1320 },
  ],
};

const booking: TableBooking = {
  id: 'booking-entrada-1', restaurantId: 'vedra', tableIds: ['vs1'],
  slot: { date: '2026-10-03', startMin: 780, durationMin: 90 },
  partySize: 2, status: 'confirmed', source: 'phone',
  guest: { name: 'María Núñez', email: 'maria@example.test', phone: '+34 (600) 123-456' },
};

const withFilters = (changes: Partial<BookingFilters>): BookingFilters => ({ ...INITIAL_BOOKING_FILTERS, ...changes });
const ids = (bookings: readonly TableBooking[]) => bookings.map((item) => item.id);

describe('libro de reservas: búsqueda y filtros operativos', () => {
  it('busca sin acentos ni mayúsculas y combina términos entre contacto y asignación', () => {
    for (const query of ['  MARIA NUNEZ  ', 'Maria JARDIN', 'maria@example.test', 'VS1', 'booking-entrada-1', 'rincon']) {
      expect(ids(filterBookings([booking], restaurant, withFilters({ query }))), query).toEqual([booking.id]);
    }
    expect(filterBookings([booking], restaurant, withFilters({ query: 'Maria terraza' }))).toEqual([]);
  });

  it('encuentra teléfonos con o sin prefijo y separadores sin ignorar el orden de los números', () => {
    for (const query of ['600123456', '+34 600 123 456', '(600) 123-456', 'Maria 600123']) {
      expect(ids(filterBookings([booking], restaurant, withFilters({ query }))), query).toEqual([booking.id]);
    }
    expect(filterBookings([booking], restaurant, withFilters({ query: '123 600' }))).toEqual([]);
    expect(filterBookings([booking], restaurant, withFilters({ query: 'Otro 600123456' }))).toEqual([]);
    expect(filterBookings([{ ...booking, guest: { name: 'Sin teléfono' } }], restaurant, withFilters({ query: '600123456' }))).toEqual([]);
  });

  it('mantiene la búsqueda de números de mesa aunque exista un teléfono', () => {
    const assigned = { ...booking, tableIds: ['vs2'] };
    expect(ids(filterBookings([assigned], restaurant, withFilters({ query: 'Mesa 2' })))).toEqual([booking.id]);
    expect(ids(filterBookings([assigned], restaurant, withFilters({ query: '2' })))).toEqual([booking.id]);
  });

  it('aplica juntos fecha, turno, estado, origen y búsqueda', () => {
    const samples: TableBooking[] = [
      booking,
      { ...booking, id: 'other-date', slot: { ...booking.slot, date: '2026-10-04' } },
      { ...booking, id: 'other-shift', slot: { ...booking.slot, startMin: 1200 } },
      { ...booking, id: 'other-status', status: 'cancelled' },
      { ...booking, id: 'other-source', source: 'widget' },
      { ...booking, id: 'other-name', guest: { name: 'Otra persona' } },
    ];
    expect(ids(filterBookings(samples, restaurant, withFilters({ query: 'Maria', date: '2026-10-03', service: 'lunch', status: 'confirmed', source: 'phone' })))).toEqual([booking.id]);
    expect(filterBookings(samples, restaurant, withFilters({ date: '2026-10-05' }))).toEqual([]);
  });

  it('distingue pendientes, confirmadas y sentadas de todos los estados cerrados', () => {
    const statuses: BookingStatus[] = ['pending', 'confirmed', 'seated', 'finished', 'no_show', 'cancelled'];
    const samples = statuses.map((status) => ({ ...booking, id: status, status }));
    expect(ids(filterBookings(samples, restaurant, withFilters({ status: 'active' })))).toEqual(['pending', 'confirmed', 'seated']);
    expect(ids(filterBookings(samples, restaurant, withFilters({ status: 'closed' })))).toEqual(['finished', 'no_show', 'cancelled']);
    for (const status of statuses) expect(ids(filterBookings(samples, restaurant, withFilters({ status })))).toEqual([status]);
  });

  it('clasifica por hora de llegada e incluye el primer y último asiento de cada turno', () => {
    const samples = [779, 780, 900, 901, 1200, 1320, 1321].map((startMin) => ({ ...booking, id: String(startMin), slot: { ...booking.slot, startMin, durationMin: 600 } }));
    expect(ids(filterBookings(samples, restaurant, withFilters({ service: 'lunch' })))).toEqual(['780', '900']);
    expect(ids(filterBookings(samples, restaurant, withFilters({ service: 'dinner' })))).toEqual(['1200', '1320']);
    expect(filterBookings(samples, { ...restaurant, shifts: restaurant.shifts.filter((shift) => shift.kind === 'lunch') }, withFilters({ service: 'dinner' }))).toEqual([]);
  });

  it('ordena por fecha y hora, mantiene empates y no muta la muestra', () => {
    const samples: readonly TableBooking[] = Object.freeze([
      Object.freeze({ ...booking, id: 'tomorrow', slot: { ...booking.slot, date: '2026-10-04' } }),
      Object.freeze({ ...booking, id: 'later', slot: { ...booking.slot, startMin: 900 } }),
      Object.freeze({ ...booking, id: 'first-tie' }),
      Object.freeze({ ...booking, id: 'second-tie' }),
    ]);
    const before = JSON.stringify(samples);
    const result = filterBookings(samples, restaurant, INITIAL_BOOKING_FILTERS);
    expect(ids(result)).toEqual(['first-tie', 'second-tie', 'later', 'tomorrow']);
    expect(JSON.stringify(samples)).toBe(before);
    expect(result[0]).toBe(samples[2]);
  });

  it('conserva todas las fechas al limpiar y excluye datos de otro restaurante', () => {
    const samples = [booking, { ...booking, id: 'next-date', slot: { ...booking.slot, date: '2026-10-04' } }, { ...booking, id: 'other-restaurant', restaurantId: 'solane' }];
    expect(ids(filterBookings(samples, restaurant, withFilters({ query: '   ' })))).toEqual([booking.id, 'next-date']);
    expect(filterBookings([], restaurant, INITIAL_BOOKING_FILTERS)).toEqual([]);
  });
});
