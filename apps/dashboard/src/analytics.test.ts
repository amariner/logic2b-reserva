import { describe, expect, it } from 'vitest';
import type { CustomerProfile, Restaurant, TableBooking } from '@logic-reserva/domain';
import { bookingReports, buildCustomerRecords, customerRecordsToCsv } from './analytics';

const restaurant: Restaurant = {
  id: 'solane', organizationId: 'demo', name: 'Solane',
  spaces: [{ id: 'room', name: 'Sala', privatizable: false, tables: [{ id: 't1', name: 'Mesa 1', minSeats: 1, maxSeats: 4, combinableWith: [] }] }],
  menus: [{ id: 'menu', name: 'Menú', pricePerPersonCents: 10_000, courses: [], bookableOnline: true }],
  shifts: [{ id: 'dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1320 }],
};

const bookings: TableBooking[] = [
  { id: 'b1', restaurantId: 'solane', tableIds: ['t1'], slot: { date: '2026-08-01', startMin: 1200, durationMin: 90 }, partySize: 2, status: 'finished', guest: { name: '=Lucía', email: 'lucia@example.test' }, menuId: 'menu', source: 'widget' },
  { id: 'b2', restaurantId: 'solane', tableIds: ['t1'], slot: { date: '2026-09-01', startMin: 1215, durationMin: 90 }, partySize: 2, status: 'confirmed', guest: { name: '=Lucía', email: 'lucia@example.test' }, menuId: 'menu', source: 'phone' },
];

const profiles: CustomerProfile[] = [{ id: 'c1', restaurantId: 'solane', guest: { name: '=Lucía', email: 'lucia@example.test' }, allergies: ['Avellana'], floorNotes: 'Mesa tranquila' }];

describe('CRM e informes', () => {
  it('agrupa histórico por contacto y calcula gasto solo sobre visitas terminadas', () => {
    const [record] = buildCustomerRecords(bookings, profiles, restaurant);
    expect(record?.bookings).toHaveLength(2);
    expect(record?.spendCents).toBe(20_000);
    expect(record?.allergies).toEqual(['Avellana']);
  });

  it('genera CSV descargable, escapa fórmulas y conserva notas', () => {
    const csv = customerRecordsToCsv(buildCustomerRecords(bookings, profiles, restaurant));
    expect(csv).toContain('"name","email","phone"');
    expect(csv).toContain('"\'=Lucía"');
    expect(csv).toContain('"Mesa tranquila"');
  });

  it('calcula ocupación, fuentes y estimaciones desde la misma muestra', () => {
    const report = bookingReports(bookings, restaurant);
    expect(report.shifts[0]).toMatchObject({ kind: 'dinner', covers: 4, capacity: 8, occupancyPercent: 50, serviceDays: 2 });
    expect(report.sources.find((source) => source.source === 'widget')).toMatchObject({ count: 1, percentage: 50 });
    expect(report.marketplace.monthlyCents).toBe(1200);
    expect(report.noShowSavings.assumptions).toContain('Estimación');
  });
});
