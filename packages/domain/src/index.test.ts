import { describe, expect, it } from 'vitest';
import {
  estimateDurationMin,
  hasLevel,
  marketplaceSavings,
  noShowLoss,
  recommendLevel,
  seatingTimes,
  slotsOverlap,
  validateSlot,
  type TimeSlot,
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
  it('hasLevel respeta el orden inicio→gestion→automatiza→inteligente', () => {
    expect(hasLevel('inteligente', 'gestion')).toBe(true);
    expect(hasLevel('inicio', 'gestion')).toBe(false);
  });

  it('eventos o privatizaciones recomiendan inteligente', () => {
    const base = { servicesPerDay: 2, seats: 60, wantsOnlineBooking: true, hasGroupsOrMenus: true, eventsPerMonth: 0, noShowPain: false, wantsPrivateHire: false } as const;
    expect(recommendLevel({ ...base, eventsPerMonth: 2 })).toBe('inteligente');
    expect(recommendLevel({ ...base, wantsPrivateHire: true })).toBe('inteligente');
    expect(recommendLevel({ ...base, noShowPain: true })).toBe('automatiza');
    expect(recommendLevel(base)).toBe('gestion');
    expect(recommendLevel({ ...base, wantsOnlineBooking: false, hasGroupsOrMenus: false })).toBe('inicio');
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
