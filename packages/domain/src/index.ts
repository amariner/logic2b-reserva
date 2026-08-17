// Dominio puro de Logic Reserva: sin I/O, sin framework, sin dependencias.
// Convenciones heredadas de la familia logic2b:
// - Dinero en céntimos enteros (EUR), nunca decimales.
// - Fechas ISO YYYY-MM-DD sin zona horaria.
// - Rangos temporales semiabiertos [start, end).
// La diferencia clave frente a estancia/camp: aquí se reserva por FRANJA HORARIA
// dentro de un día de servicio (slots de 15 minutos), no por noches.

// ── Núcleo temporal ────────────────────────────────────────────────

export const SLOT_STEP_MIN = 15;

export type ServiceKind = 'lunch' | 'dinner';

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  startMin: number; // minutos desde las 00:00, múltiplo de SLOT_STEP_MIN
  durationMin: number; // múltiplo de SLOT_STEP_MIN, > 0
}

export interface Shift {
  id: string;
  kind: ServiceKind;
  firstSeatingMin: number;
  lastSeatingMin: number;
}

export function slotEnd(slot: TimeSlot): number {
  return slot.startMin + slot.durationMin;
}

export function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  if (a.date !== b.date) return false;
  return a.startMin < slotEnd(b) && b.startMin < slotEnd(a);
}

export function validateSlot(slot: TimeSlot): string[] {
  const errors: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) errors.push('date must be ISO YYYY-MM-DD');
  if (slot.startMin % SLOT_STEP_MIN !== 0) errors.push(`startMin must be a multiple of ${SLOT_STEP_MIN}`);
  if (slot.durationMin <= 0 || slot.durationMin % SLOT_STEP_MIN !== 0)
    errors.push(`durationMin must be a positive multiple of ${SLOT_STEP_MIN}`);
  return errors;
}

// Duración estimada de mesa por tamaño de grupo (rotación).
export function estimateDurationMin(partySize: number): number {
  if (partySize <= 2) return 90;
  if (partySize <= 4) return 105;
  if (partySize <= 6) return 120;
  return 150;
}

// Franjas ofertables de un turno, cada SLOT_STEP_MIN minutos.
export function seatingTimes(shift: Shift): number[] {
  const times: number[] = [];
  for (let t = shift.firstSeatingMin; t <= shift.lastSeatingMin; t += SLOT_STEP_MIN) times.push(t);
  return times;
}

// ── Escalera comercial ─────────────────────────────────────────────

export type PlanLevel = 'inicio' | 'gestion' | 'automatiza' | 'inteligente';

export const LEVELS: Record<PlanLevel, { rank: number }> = {
  inicio: { rank: 0 },
  gestion: { rank: 1 },
  automatiza: { rank: 2 },
  inteligente: { rank: 3 },
};

export function hasLevel(current: PlanLevel, required: PlanLevel): boolean {
  return LEVELS[current].rank >= LEVELS[required].rank;
}

export interface ScopeSignals {
  servicesPerDay: 1 | 2;
  seats: number;
  wantsOnlineBooking: boolean;
  hasGroupsOrMenus: boolean;
  eventsPerMonth: number;
  noShowPain: boolean;
  wantsPrivateHire: boolean;
}

export function recommendLevel(signals: ScopeSignals): PlanLevel {
  if (signals.eventsPerMonth > 0 || signals.wantsPrivateHire) return 'inteligente';
  if (signals.noShowPain) return 'automatiza';
  if (signals.wantsOnlineBooking || signals.hasGroupsOrMenus) return 'gestion';
  return 'inicio';
}

// ── Calculadoras comerciales (siempre etiquetadas como estimación) ─

export interface SavingsEstimate {
  monthlyCents: number;
  yearlyCents: number;
  assumptions: string;
}

// feePerCoverCents por defecto 300 (~3 €/cubierto): estimación publicada por
// terceros sobre marketplaces; el copy SIEMPRE debe presentarla como estimación.
export function marketplaceSavings(coversPerMonth: number, feePerCoverCents = 300): SavingsEstimate {
  const monthlyCents = coversPerMonth * feePerCoverCents;
  return {
    monthlyCents,
    yearlyCents: monthlyCents * 12,
    assumptions: `Estimación basada en tarifas publicadas por terceros (~${(feePerCoverCents / 100).toFixed(2)} €/cubierto).`,
  };
}

// Pérdida estimada por no-shows: tasa media España 3,3 % y ~78,30 € por mesa
// perdida (datos sector 2025-2026); presentar siempre como estimación.
export function noShowLoss(reservationsPerMonth: number, rate = 0.033, avgTicketCents = 7830): SavingsEstimate {
  const monthlyCents = Math.round(reservationsPerMonth * rate * avgTicketCents);
  return {
    monthlyCents,
    yearlyCents: monthlyCents * 12,
    assumptions: `Estimación con tasa de no-show del ${(rate * 100).toFixed(1)} % y ticket medio de ${(avgTicketCents / 100).toFixed(2)} € por mesa.`,
  };
}
