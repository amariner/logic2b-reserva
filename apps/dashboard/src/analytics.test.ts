import { describe, expect, it } from 'vitest';
import type { CustomerProfile, Restaurant, TableBooking } from '@logic-reserva/domain';
import { bookingReports, buildCustomerRecords, customerRecordsToCsv, noShowRiskAssessments } from './analytics';

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

  it('prioriza riesgo desde la muestra y usa solo histórico anterior del mismo comensal', () => {
    const sample: TableBooking[] = [
      { ...bookings[0]!, id: 'lucia-history', slot: { ...bookings[0]!.slot, date: '2026-08-01' }, status: 'finished' },
      { ...bookings[1]!, id: 'lucia-current', slot: { ...bookings[1]!.slot, date: '2026-09-18', startMin: 1230 }, source: 'fixture', bookedAt: '2026-08-20T10:00:00.000Z' },
      { ...bookings[1]!, id: 'marc-current', guest: { name: 'Marc', phone: '+34 600 000 002' }, slot: { ...bookings[1]!.slot, date: '2026-09-18', startMin: 1245 }, status: 'pending', source: 'phone', bookedAt: '2026-09-17T18:00:00.000Z' },
    ];
    const assessments = noShowRiskAssessments(sample, restaurant, '2026-09-18');
    expect(assessments.map((assessment) => assessment.booking.id)).toEqual(['marc-current', 'lucia-current']);
    expect(assessments[0]).toMatchObject({ leadDays: 1, previousAttended: 0, isPeakSlot: true, recommendation: { operationalScore: 80, tier: 'high' } });
    expect(assessments[1]).toMatchObject({ leadDays: 29, previousAttended: 1, recommendation: { operationalScore: 30, tier: 'low' } });
  });

  it('mantiene visible la antelación desconocida en payloads v1', () => {
    const [assessment] = noShowRiskAssessments([{ ...bookings[1]!, slot: { ...bookings[1]!.slot, date: '2026-09-18' } }], restaurant, '2026-09-18');
    expect(assessment?.leadDays).toBeNull();
    expect(assessment?.recommendation.signals.some((signal) => signal.code === 'lead_unknown')).toBe(true);
  });
});
