import { describe, expect, it } from 'vitest';
import {
  CAPABILITIES,
  assertNoDoubleBooking,
  canOperate,
  createWalkInBooking,
  depositFor,
  estimateDurationMin,
  hasLevel,
  issueExperienceVoucher,
  marketplaceSavings,
  noShowLoss,
  noShowCharge,
  noShowRiskRecommendation,
  recommendLevel,
  redeemExperienceVoucher,
  riskTier,
  seatingTimes,
  slotsOverlap,
  tableAvailability,
  validateBooking,
  validateEvent,
  validateExperienceVoucher,
  validateRestaurant,
  validateSlot,
  validateWaitlistEntry,
  voucherValue,
  type DepositRecord,
  type ExperienceVoucher,
  type PrivateHire,
  type Restaurant,
  type RestaurantEvent,
  type TableBooking,
  type TimeSlot,
  type WaitlistEntry,
} from './index';

const slot = (startMin: number, durationMin: number, date = '2026-09-04'): TimeSlot => ({ date, startMin, durationMin });

describe('núcleo temporal', () => {
  it('un slot que termina exactamente cuando empieza otro NO solapa (semiabierto)', () => {
    expect(slotsOverlap(slot(1200, 90), slot(1290, 90))).toBe(false);
  });

  it('slots que comparten minutos solapan, y el solape es simétrico', () => {
    expect(slotsOverlap(slot(1200, 90), slot(1215, 90))).toBe(true);
    expect(slotsOverlap(slot(1215, 90), slot(1200, 90))).toBe(true);
  });

  it('fechas distintas nunca solapan', () => {
    expect(slotsOverlap(slot(1200, 90), slot(1200, 90, '2026-09-05'))).toBe(false);
  });

  it('valida múltiplos de 15 y formato de fecha', () => {
    expect(validateSlot(slot(1200, 90))).toEqual([]);
    expect(validateSlot(slot(1207, 90))).toContain('startMin must be a multiple of 15');
    expect(validateSlot(slot(1200, 0))).toContain('durationMin must be a positive multiple of 15');
    expect(validateSlot({ date: '4/9/2026', startMin: 1200, durationMin: 90 })).toContain('date must be ISO YYYY-MM-DD');
  });

  it('estima la rotación por tamaño de grupo', () => {
    expect(estimateDurationMin(2)).toBe(90);
    expect(estimateDurationMin(4)).toBe(105);
    expect(estimateDurationMin(6)).toBe(120);
    expect(estimateDurationMin(9)).toBe(150);
  });

  it('genera franjas cada 15 minutos incluyendo la última', () => {
    expect(seatingTimes({ id: 's', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1260 })).toEqual([1200, 1215, 1230, 1245, 1260]);
  });
});

describe('escalera comercial', () => {
  it('hasLevel respeta el orden basico→gestion→inteligente', () => {
    expect(hasLevel('inteligente', 'gestion')).toBe(true);
    expect(hasLevel('basico', 'gestion')).toBe(false);
  });

  it('eventos o privatizaciones recomiendan inteligente', () => {
    const base = { servicesPerDay: 2, seats: 60, wantsOnlineBooking: true, hasGroupsOrMenus: true, eventsPerMonth: 0, noShowPain: false, wantsPrivateHire: false } as const;
    expect(recommendLevel({ ...base, eventsPerMonth: 2 })).toBe('inteligente');
    expect(recommendLevel({ ...base, wantsPrivateHire: true })).toBe('inteligente');
    expect(recommendLevel({ ...base, noShowPain: true })).toBe('inteligente');
    expect(recommendLevel(base)).toBe('gestion');
    expect(recommendLevel({ ...base, wantsOnlineBooking: false, hasGroupsOrMenus: false })).toBe('basico');
  });
});

describe('calculadoras', () => {
  it('marketplaceSavings usa céntimos enteros y se declara estimación', () => {
    const s = marketplaceSavings(1130);
    expect(s.monthlyCents).toBe(339000);
    expect(s.yearlyCents).toBe(4068000);
    expect(s.assumptions).toMatch(/Estimación/);
  });

  it('noShowLoss redondea a céntimos enteros', () => {
    const l = noShowLoss(500);
    expect(Number.isInteger(l.monthlyCents)).toBe(true);
    expect(l.assumptions).toMatch(/Estimación/);
  });
});

const restaurant: Restaurant = {
  id: 'solane',
  organizationId: 'logic-demo',
  name: 'Solane',
  spaces: [
    {
      id: 'main',
      name: 'Sala',
      privatizable: true,
      tables: [
        { id: 't1', name: 'Mesa 1', minSeats: 1, maxSeats: 2, combinableWith: ['t2'] },
        { id: 't2', name: 'Mesa 2', minSeats: 2, maxSeats: 4, combinableWith: ['t1', 't3'] },
        { id: 't3', name: 'Mesa 3', minSeats: 2, maxSeats: 4, combinableWith: ['t2'] },
      ],
    },
    {
      id: 'private',
      name: 'Privado',
      privatizable: true,
      tables: [{ id: 'p1', name: 'Privado 1', minSeats: 4, maxSeats: 8, combinableWith: [] }],
    },
  ],
  menus: [
    { id: 'degustacion', name: 'Degustación', pricePerPersonCents: 9500, courses: ['Aperitivo', 'Principal'], bookableOnline: true },
  ],
  shifts: [
    { id: 'lunch', kind: 'lunch', firstSeatingMin: 780, lastSeatingMin: 900 },
    { id: 'dinner', kind: 'dinner', firstSeatingMin: 1200, lastSeatingMin: 1320 },
  ],
};

const booking = (overrides: Partial<TableBooking> = {}): TableBooking => ({
  id: 'b1',
  restaurantId: restaurant.id,
  tableIds: ['t1'],
  slot: slot(1200, 90),
  partySize: 2,
  status: 'confirmed',
  guest: { name: 'Ada' },
  source: 'fixture',
  ...overrides,
});

const event = (overrides: Partial<RestaurantEvent> = {}): RestaurantEvent => ({
  id: 'e1',
  restaurantId: restaurant.id,
  name: 'Cena maridaje',
  slot: slot(1200, 120),
  capacity: 6,
  priceCents: 12500,
  soldSeats: 0,
  consumesTableIds: ['t1', 't2'],
  status: 'draft',
  ...overrides,
});

const hire = (overrides: Partial<PrivateHire> = {}): PrivateHire => ({
  id: 'h1',
  restaurantId: restaurant.id,
  spaceId: 'private',
  slot: slot(1200, 180),
  status: 'requested',
  ...overrides,
});

describe('restaurante y validaciones', () => {
  it('acepta un restaurante consistente', () => {
    expect(validateRestaurant(restaurant)).toEqual([]);
  });

  it('rechaza ids de mesa duplicados entre salas', () => {
    const invalid: Restaurant = {
      ...restaurant,
      spaces: [restaurant.spaces[0], { ...restaurant.spaces[1], tables: [{ ...restaurant.spaces[1].tables[0], id: 't1' }] }],
    };
    expect(validateRestaurant(invalid)).toContain('duplicate table id: t1');
  });

  it('rechaza capacidad mínima no positiva', () => {
    const invalid: Restaurant = {
      ...restaurant,
      spaces: [{ ...restaurant.spaces[0], tables: [{ ...restaurant.spaces[0].tables[0], minSeats: 0 }] }],
    };
    expect(validateRestaurant(invalid).some((error) => error.includes('minSeats'))).toBe(true);
  });

  it('rechaza capacidad máxima menor que la mínima', () => {
    const invalid: Restaurant = {
      ...restaurant,
      spaces: [{ ...restaurant.spaces[0], tables: [{ ...restaurant.spaces[0].tables[0], minSeats: 4, maxSeats: 2 }] }],
    };
    expect(validateRestaurant(invalid).some((error) => error.includes('maxSeats'))).toBe(true);
  });

  it('rechaza combinaciones con mesas de otra sala o inexistentes', () => {
    const invalid: Restaurant = {
      ...restaurant,
      spaces: [{ ...restaurant.spaces[0], tables: [{ ...restaurant.spaces[0].tables[0], combinableWith: ['p1'] }] }],
    };
    expect(validateRestaurant(invalid).some((error) => error.includes('unknown table in its space'))).toBe(true);
  });

  it('rechaza turnos que no respetan los 15 minutos', () => {
    const invalid = { ...restaurant, shifts: [{ ...restaurant.shifts[0], firstSeatingMin: 787 }] };
    expect(validateRestaurant(invalid).some((error) => error.includes('multiples of 15'))).toBe(true);
  });

  it('valida que un evento no venda más de su aforo', () => {
    expect(validateEvent(event({ soldSeats: 7 }), restaurant).some((error) => error.includes('soldSeats'))).toBe(true);
  });

  it('valida que las mesas consumidas cubren el aforo del evento', () => {
    expect(validateEvent(event({ capacity: 7, consumesTableIds: ['t1', 't2'] }), restaurant)).toContain(
      'event e1 capacity exceeds the seats of its consumed tables',
    );
  });

  it('rechaza mesas desconocidas en un evento', () => {
    expect(validateEvent(event({ consumesTableIds: ['missing'] }), restaurant).some((error) => error.includes('unknown table'))).toBe(true);
  });

  it('acepta una reserva en mesas combinables de la misma sala', () => {
    expect(validateBooking(booking({ tableIds: ['t1', 't2'], partySize: 6 }), restaurant)).toEqual([]);
  });

  it('rechaza una reserva con mesas de salas distintas', () => {
    expect(validateBooking(booking({ tableIds: ['t1', 'p1'], partySize: 6 }), restaurant).some((error) => error.includes('same space'))).toBe(true);
  });

  it('rechaza una reserva que no cabe en sus mesas', () => {
    expect(validateBooking(booking({ partySize: 3 }), restaurant)).toContain('booking b1 partySize must fit within [1, 2]');
  });

  it('rechaza una combinación de mesas desconectada', () => {
    expect(validateBooking(booking({ tableIds: ['t1', 't3'], partySize: 4 }), restaurant).some((error) => error.includes('must be combinable'))).toBe(true);
  });
});

describe('disponibilidad e inventario único', () => {
  it('ofrece una mesa individual cuando tiene capacidad', () => {
    const options = tableAvailability(restaurant, [], [], [], slot(1200, 90), 4);
    expect(options.some((option) => option.tableIds.length === 1 && option.tableIds[0] === 't2')).toBe(true);
  });

  it('ofrece combinaciones conectadas para grupos grandes', () => {
    const options = tableAvailability(restaurant, [], [], [], slot(1200, 90), 6);
    expect(options.some((option) => option.tableIds.includes('t1') && option.tableIds.includes('t2'))).toBe(true);
  });

  it('una reserva confirmada retira su mesa mientras solapa', () => {
    const options = tableAvailability(restaurant, [booking()], [], [], slot(1215, 60), 2);
    expect(options.some((option) => option.tableIds.includes('t1'))).toBe(false);
  });

  it('una reserva cancelada no bloquea inventario', () => {
    const options = tableAvailability(restaurant, [booking({ status: 'cancelled' })], [], [], slot(1215, 60), 2);
    expect(options.some((option) => option.tableIds.includes('t1'))).toBe(true);
  });

  it('rangos adyacentes liberan la mesa por ser semiabiertos', () => {
    const options = tableAvailability(restaurant, [booking()], [], [], slot(1290, 90), 2);
    expect(options.some((option) => option.tableIds.includes('t1'))).toBe(true);
  });

  it('INVARIANTE ESTRELLA: publicar un evento retira sus mesas', () => {
    const before = tableAvailability(restaurant, [], [event()], [], slot(1215, 90), 2);
    const after = tableAvailability(restaurant, [], [event({ status: 'published' })], [], slot(1215, 90), 2);
    expect(before.some((option) => option.tableIds.includes('t1'))).toBe(true);
    expect(after.some((option) => option.tableIds.includes('t1') || option.tableIds.includes('t2'))).toBe(false);
  });

  it('un evento terminado no bloquea inventario', () => {
    const options = tableAvailability(restaurant, [], [event({ status: 'done' })], [], slot(1215, 90), 2);
    expect(options.some((option) => option.tableIds.includes('t1'))).toBe(true);
  });

  it('una privatización bloqueada retira todas las mesas de su sala', () => {
    const options = tableAvailability(restaurant, [], [], [hire({ status: 'blocked' })], slot(1215, 90), 6);
    expect(options.some((option) => option.spaceId === 'private')).toBe(false);
  });

  it('una solicitud de privatización todavía no bloquea la sala', () => {
    const options = tableAvailability(restaurant, [], [], [hire()], slot(1215, 90), 6);
    expect(options.some((option) => option.spaceId === 'private')).toBe(true);
  });

  it('rechaza tamaño de grupo o slot inválidos con una lista vacía', () => {
    expect(tableAvailability(restaurant, [], [], [], slot(1200, 90), 0)).toEqual([]);
    expect(tableAvailability(restaurant, [], [], [], slot(1207, 90), 2)).toEqual([]);
  });

  it('assertNoDoubleBooking detecta reserva contra evento', () => {
    expect(() => assertNoDoubleBooking(restaurant, [booking()], [event({ status: 'published' })], [])).toThrow(/double booking/);
  });

  it('assertNoDoubleBooking permite ocupaciones adyacentes', () => {
    expect(() =>
      assertNoDoubleBooking(restaurant, [booking()], [event({ status: 'published', slot: slot(1290, 90) })], []),
    ).not.toThrow();
  });
});

describe('lista de espera e inventario único', () => {
  const waitlistEntry = (overrides: Partial<WaitlistEntry> = {}): WaitlistEntry => ({
    id: 'wait-1',
    restaurantId: restaurant.id,
    guest: { name: 'Clara Sin Reserva', phone: '+34 600 111 222' },
    partySize: 2,
    requestedSlot: slot(1200, 90),
    arrivedAt: '2026-08-18T19:45:00.000Z',
    quotedWaitMin: 20,
    status: 'waiting',
    ...overrides,
  });

  it('valida la cola con los mismos contratos temporales y límites de grupo', () => {
    expect(validateWaitlistEntry(waitlistEntry())).toEqual([]);
    expect(validateWaitlistEntry(waitlistEntry({ partySize: 0 }))).toContain('waitlist wait-1: partySize must be between 1 and 40');
    expect(validateWaitlistEntry(waitlistEntry({ requestedSlot: slot(1207, 90) }))).toContain('waitlist wait-1: startMin must be a multiple of 15');
    expect(validateWaitlistEntry(waitlistEntry({ status: 'seated' }))).toContain('waitlist wait-1: seatedBookingId is required when seated');
  });

  it('convierte la demanda espontánea en una reserva sentada sobre la opción mínima', () => {
    expect(createWalkInBooking(waitlistEntry(), restaurant, [], [], [], 'walkin-booking-1')).toMatchObject({
      id: 'walkin-booking-1',
      tableIds: ['t1'],
      partySize: 2,
      status: 'seated',
      source: 'walkin',
      guest: { name: 'Clara Sin Reserva' },
    });
  });

  it('no sienta si reservas, eventos o privatizaciones agotan las opciones', () => {
    const allMainTables = [
      booking({ id: 'b1', tableIds: ['t1'] }),
      booking({ id: 'b2', tableIds: ['t2'] }),
      booking({ id: 'b3', tableIds: ['t3'] }),
      booking({ id: 'b4', tableIds: ['p1'] }),
    ];
    expect(createWalkInBooking(waitlistEntry(), restaurant, allMainTables, [], [], 'walkin-booking-1')).toBeNull();
    expect(createWalkInBooking(
      waitlistEntry(),
      restaurant,
      [booking({ id: 'b3', tableIds: ['t3'] })],
      [event({ status: 'published' })],
      [hire({ status: 'blocked' })],
      'walkin-booking-2',
    )).toBeNull();
  });

  it('rechaza entradas terminales o pertenecientes a otro restaurante', () => {
    expect(createWalkInBooking(waitlistEntry({ status: 'cancelled' }), restaurant, [], [], [], 'walkin-booking-1')).toBeNull();
    expect(createWalkInBooking(waitlistEntry({ restaurantId: 'otra-marca' }), restaurant, [], [], [], 'walkin-booking-1')).toBeNull();
  });
});

describe('riesgo y depósitos', () => {
  const heldDeposit = (amountCents = 19000): DepositRecord => ({
    id: 'd1',
    breakdown: {
      policyKind: 'card_hold',
      partySize: 4,
      pricePerPersonCents: 9500,
      menuSubtotalCents: 38000,
      percentageBps: 5000,
      amountCents,
    },
    termsAcceptedAt: '2026-08-17T18:30:00.000Z',
    status: 'held',
  });

  it('clasifica un grupo grande como riesgo alto', () => {
    expect(riskTier({ partySize: 8, isPeakSlot: false, hasHistory: true, leadDays: 20 })).toBe('high');
  });

  it('clasifica pico sin historial como riesgo alto', () => {
    expect(riskTier({ partySize: 2, isPeakSlot: true, hasHistory: false, leadDays: 20 })).toBe('high');
  });

  it('clasifica una reserva habitual y anticipada como riesgo bajo', () => {
    expect(riskTier({ partySize: 2, isPeakSlot: false, hasHistory: true, leadDays: 14 })).toBe('low');
  });

  it('prioriza revisión manual para una primera reserva telefónica, pico y última hora', () => {
    const result = noShowRiskRecommendation({ source: 'phone', partySize: 4, isPeakSlot: true, leadDays: 1, previousAttended: 0, previousNoShows: 0 });
    expect(result).toMatchObject({ ruleset: 'no-show-demo-v1', basis: 'deterministic-demo', operationalScore: 80, tier: 'high', suggestedAction: 'manual_review' });
    expect(result.signals.map((signal) => signal.code)).toEqual(['baseline', 'channel_phone', 'history_first_visit', 'party_standard', 'lead_short', 'slot_peak']);
  });

  it('reduce la prioridad cuando existe asistencia previa aunque la franja sea pico', () => {
    expect(noShowRiskRecommendation({ source: 'fixture', partySize: 2, isPeakSlot: true, leadDays: 29, previousAttended: 2, previousNoShows: 0 })).toMatchObject({ operationalScore: 30, tier: 'low', suggestedAction: 'standard_confirmation' });
  });

  it('hace visible un no-show previo sin ocultar la asistencia histórica', () => {
    const result = noShowRiskRecommendation({ source: 'widget', partySize: 2, isPeakSlot: true, leadDays: 10, previousAttended: 3, previousNoShows: 1 });
    expect(result.signals).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'history_repeat_attendance', points: -25 }),
      expect.objectContaining({ code: 'history_previous_no_show', points: 30 }),
    ]));
    expect(result).toMatchObject({ operationalScore: 45, tier: 'medium', suggestedAction: 'confirm_24h' });
  });

  it('trata la antelación desconocida como evidencia ausente, no como riesgo inventado', () => {
    const result = noShowRiskRecommendation({ source: 'fixture', partySize: 2, isPeakSlot: false, leadDays: null, previousAttended: 0, previousNoShows: 0 });
    expect(result.signals).toContainEqual({ category: 'lead_time', code: 'lead_unknown', points: 0 });
  });

  it('acota el score entre 0 y 100 y devuelve siempre céntimos intactos fuera de esta recomendación', () => {
    expect(noShowRiskRecommendation({ source: 'walkin', partySize: 1, isPeakSlot: false, leadDays: 0, previousAttended: 20, previousNoShows: 0 }).operationalScore).toBe(0);
    expect(noShowRiskRecommendation({ source: 'phone', partySize: 20, isPeakSlot: true, leadDays: 30, previousAttended: 0, previousNoShows: 4 }).operationalScore).toBe(100);
    expect(depositFor({ kind: 'prepay', menuPercentageBps: 5000 }, 2, 12500).amountCents).toBe(12500);
  });

  it('calcula el depósito como porcentaje del menú y conserva el desglose', () => {
    expect(depositFor({ kind: 'prepay', menuPercentageBps: 2500 }, 4, 9500)).toEqual({
      policyKind: 'prepay',
      partySize: 4,
      pricePerPersonCents: 9500,
      menuSubtotalCents: 38000,
      percentageBps: 2500,
      amountCents: 9500,
    });
  });

  it('la política none siempre produce importe cero', () => {
    expect(depositFor({ kind: 'none', menuPercentageBps: 9000 }, 4, 9500).amountCents).toBe(0);
  });

  it('limita el porcentaje a 100 % y mantiene céntimos enteros', () => {
    const result = depositFor({ kind: 'card_hold', menuPercentageBps: 20000 }, 3, 3333);
    expect(result.percentageBps).toBe(10000);
    expect(result.amountCents).toBe(9999);
    expect(Number.isInteger(result.amountCents)).toBe(true);
  });

  it('sentar al comensal libera el depósito completo', () => {
    expect(noShowCharge(heldDeposit(), 'seated')).toMatchObject({ status: 'released', chargedCents: 0, releasedCents: 19000 });
  });

  it('un no-show nunca cobra más que el depósito', () => {
    expect(noShowCharge(heldDeposit(), 'no_show', 99999)).toMatchObject({ status: 'charged', chargedCents: 19000, releasedCents: 0 });
  });

  it('un cobro proporcional devuelve el resto liberado', () => {
    expect(noShowCharge(heldDeposit(), 'no_show', 5000)).toMatchObject({ chargedCents: 5000, releasedCents: 14000 });
  });

  it('mantiene la retención mientras no hay desenlace', () => {
    expect(noShowCharge(heldDeposit(), 'confirmed')).toMatchObject({ status: 'held', reason: 'awaiting-outcome' });
  });
});

describe('bonos de experiencia', () => {
  const voucher = (overrides: Partial<ExperienceVoucher> = {}): ExperienceVoucher => ({
    id: 'voucher-1',
    restaurantId: 'solane',
    code: 'SOLANE-AB12CD',
    experienceId: 'menu-origen',
    experienceName: 'Menú Origen',
    recipientName: 'Ada Demo',
    value: voucherValue(2, 12500),
    issuedAt: '2026-08-18T16:00:00.000Z',
    expiresOn: '2027-08-18',
    status: 'issued',
    ...overrides,
  });

  it('conserva un desglose auditable en céntimos enteros', () => {
    expect(voucherValue(2, 12500)).toEqual({ quantity: 2, unitValueCents: 12500, totalValueCents: 25000 });
    expect(issueExperienceVoucher(voucher())).toEqual(voucher());
  });

  it('rechaza totales manipulados y caducidad anterior a la emisión', () => {
    expect(validateExperienceVoucher(voucher({ value: { quantity: 2, unitValueCents: 12500, totalValueCents: 1 } }))).toContain('voucher voucher-1: totalValueCents is invalid');
    expect(issueExperienceVoucher(voucher({ expiresOn: '2026-08-18' }))).toBeNull();
  });

  it('canjea una sola vez dentro del rango semiabierto de vigencia', () => {
    const redeemed = redeemExperienceVoucher(voucher(), '2027-08-17T23:59:59.000Z');
    expect(redeemed).toMatchObject({ status: 'redeemed', redeemedAt: '2027-08-17T23:59:59.000Z' });
    expect(redeemExperienceVoucher(redeemed!, '2027-08-17T23:59:59.500Z')).toBeNull();
    expect(redeemExperienceVoucher(voucher(), '2027-08-18T00:00:00.000Z')).toBeNull();
  });
});

describe('roles del gestor', () => {
  it('Dirección puede ejecutar todas las operaciones demostradas', () => {
    expect(['manage_events', 'manage_private_hires', 'manage_waitlist', 'manage_vouchers', 'seat_booking', 'charge_no_show'].every((action) => canOperate('direction', action as Parameters<typeof canOperate>[1]))).toBe(true);
  });

  it('Sala puede gestionar la espera y sentar, pero no cobros, eventos ni privatizaciones', () => {
    expect(canOperate('floor', 'seat_booking')).toBe(true);
    expect(canOperate('floor', 'manage_waitlist')).toBe(true);
    expect(canOperate('floor', 'manage_vouchers')).toBe(true);
    expect(canOperate('floor', 'charge_no_show')).toBe(false);
    expect(canOperate('floor', 'manage_events')).toBe(false);
    expect(canOperate('floor', 'manage_private_hires')).toBe(false);
  });

  it('Cocina conserva acceso de lectura sin operaciones', () => {
    expect(canOperate('kitchen', 'seat_booking')).toBe(false);
    expect(canOperate('kitchen', 'manage_waitlist')).toBe(false);
    expect(canOperate('kitchen', 'charge_no_show')).toBe(false);
    expect(canOperate('kitchen', 'manage_events')).toBe(false);
    expect(canOperate('kitchen', 'manage_vouchers')).toBe(false);
  });
});

describe('catálogo comercial', () => {
  it('cada capacidad declara evidencia y madurez visible', () => {
    expect(CAPABILITIES.length).toBeGreaterThan(0);
    expect(CAPABILITIES.every((capability) => capability.evidence && capability.maturity)).toBe(true);
  });

  it('el inventario único está demostrado por Solane', () => {
    expect(CAPABILITIES.find((capability) => capability.id === 'unified-inventory')).toMatchObject({
      evidence: 'solane',
      maturity: 'functional-demo',
    });
  });
});
