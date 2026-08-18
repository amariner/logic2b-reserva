import { describe, expect, it } from 'vitest';
import { assertNoDoubleBooking, validateBooking, validateEvent, validateRestaurant } from '@logic-reserva/domain';
import { DEMO_COPY, DEMO_FIXTURES } from './data';

describe('fixtures de las marcas', () => {
  it('todos los restaurantes cumplen los invariantes del dominio', () => {
    for (const fixture of Object.values(DEMO_FIXTURES)) expect(validateRestaurant(fixture.restaurant)).toEqual([]);
  });

  it('las tres marcas representan exactamente Básico, Gestión e Inteligente', () => {
    expect(DEMO_FIXTURES.brasca.level).toBe('basico');
    expect(DEMO_FIXTURES.vedra.level).toBe('gestion');
    expect(DEMO_FIXTURES.solane.level).toBe('inteligente');
    expect(new Set(Object.values(DEMO_FIXTURES).map((fixture) => fixture.level))).toEqual(new Set(['basico', 'gestion', 'inteligente']));
  });

  it('las tres marcas usan los heroes v2 generados con OpenAI', () => {
    expect(Object.fromEntries(Object.entries(DEMO_FIXTURES).map(([slug, fixture]) => [slug, fixture.hero.imageBase]))).toEqual({
      brasca: '/images/heroes/brasca-v2',
      vedra: '/images/heroes/vedra-v2',
      solane: '/images/heroes/solane-v2',
    });
  });

  it('Brasca tiene una sala y ocho mesas', () => {
    expect(DEMO_FIXTURES.brasca.restaurant.spaces).toHaveLength(1);
    expect(DEMO_FIXTURES.brasca.restaurant.spaces[0].tables).toHaveLength(8);
    expect(DEMO_FIXTURES.brasca.menuItems).toHaveLength(6);
    expect(DEMO_FIXTURES.brasca.menuItems.every((item) => Number.isInteger(item.priceCents) && item.priceCents > 0)).toBe(true);
  });

  it('Vedra tiene dos salas, terraza, dieciocho mesas y tres menús', () => {
    const fixture = DEMO_FIXTURES.vedra;
    expect(fixture.restaurant.spaces).toHaveLength(3);
    expect(fixture.restaurant.spaces.flatMap((space) => space.tables)).toHaveLength(18);
    expect(fixture.restaurant.menus).toHaveLength(3);
  });

  it('Solane tiene doce mesas, evento en borrador y solicitud de privatización', () => {
    const fixture = DEMO_FIXTURES.solane;
    expect(fixture.restaurant.spaces.flatMap((space) => space.tables)).toHaveLength(12);
    expect(fixture.events).toEqual([expect.objectContaining({ name: 'Cena maridaje', status: 'draft' })]);
    expect(fixture.privateHires).toEqual([expect.objectContaining({ status: 'requested' })]);
  });

  it('todos los eventos y reservas fixture son válidos', () => {
    for (const fixture of Object.values(DEMO_FIXTURES)) {
      for (const event of fixture.events) expect(validateEvent(event, fixture.restaurant)).toEqual([]);
      for (const booking of fixture.bookings) expect(validateBooking(booking, fixture.restaurant)).toEqual([]);
    }
  });

  it('ningún fixture contiene dobles reservas activas', () => {
    for (const fixture of Object.values(DEMO_FIXTURES)) {
      expect(() => assertNoDoubleBooking(fixture.restaurant, fixture.bookings, fixture.events, fixture.privateHires)).not.toThrow();
    }
  });

  it('Solane incluye variedad realista de estados de reserva', () => {
    expect(new Set(DEMO_FIXTURES.solane.bookings.map((booking) => booking.status))).toEqual(
      new Set(['confirmed', 'pending', 'seated', 'finished', 'no_show', 'cancelled']),
    );
  });

  it('todo el copy de navegación, hero y formulario existe en español e inglés', () => {
    for (const copy of Object.values(DEMO_COPY)) {
      for (const item of copy.nav) expect([item.label.es, item.label.en].every(Boolean)).toBe(true);
      for (const value of Object.values(copy.hero)) expect([value.es, value.en].every(Boolean)).toBe(true);
      for (const value of Object.values(copy.form)) expect([value.es, value.en].every(Boolean)).toBe(true);
    }
  });
});
