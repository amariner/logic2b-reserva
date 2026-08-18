import {
  nextWaitlistStatuses,
  validateWaitlistEntry,
  type WaitlistEntry,
  type WaitlistStatus,
} from '@logic-reserva/domain';

const WAITLIST_STATUSES: readonly WaitlistStatus[] = ['waiting', 'notified', 'seated', 'cancelled'];

export const cloneWaitlistEntry = (entry: WaitlistEntry): WaitlistEntry => ({
  ...entry,
  guest: { ...entry.guest },
  requestedSlot: { ...entry.requestedSlot },
});

function parseWaitlistEntry(value: unknown, restaurantId: string): WaitlistEntry | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<WaitlistEntry>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim() || candidate.id.length > 120) return null;
  if (candidate.restaurantId !== restaurantId || candidate.guest === undefined || candidate.requestedSlot === undefined) return null;
  if (typeof candidate.guest.name !== 'string' || typeof candidate.arrivedAt !== 'string') return null;
  if (typeof candidate.partySize !== 'number' || typeof candidate.quotedWaitMin !== 'number') return null;
  if (!WAITLIST_STATUSES.includes(candidate.status as WaitlistStatus)) return null;
  if (candidate.guest.email !== undefined && typeof candidate.guest.email !== 'string') return null;
  if (candidate.guest.phone !== undefined && typeof candidate.guest.phone !== 'string') return null;
  if (candidate.seatedBookingId !== undefined && typeof candidate.seatedBookingId !== 'string') return null;
  const entry: WaitlistEntry = {
    id: candidate.id.trim(),
    restaurantId,
    guest: {
      name: candidate.guest.name.trim(),
      ...(candidate.guest.email === undefined ? {} : { email: candidate.guest.email.trim() }),
      ...(candidate.guest.phone === undefined ? {} : { phone: candidate.guest.phone.trim() }),
    },
    partySize: candidate.partySize,
    requestedSlot: { ...candidate.requestedSlot },
    arrivedAt: candidate.arrivedAt,
    quotedWaitMin: candidate.quotedWaitMin,
    status: candidate.status as WaitlistStatus,
    ...(candidate.seatedBookingId === undefined ? {} : { seatedBookingId: candidate.seatedBookingId.trim() }),
  };
  return validateWaitlistEntry(entry).length === 0 ? entry : null;
}

export function parseWaitlistEntries(value: unknown, restaurantId: string): WaitlistEntry[] {
  if (!Array.isArray(value)) return [];
  const entries = new Map<string, WaitlistEntry>();
  for (const entry of value.map((candidate) => parseWaitlistEntry(candidate, restaurantId)).filter((candidate): candidate is WaitlistEntry => candidate !== null).slice(0, 250)) {
    entries.set(entry.id, entry);
  }
  return [...entries.values()].map(cloneWaitlistEntry);
}

export function addWaitlistEntry(entries: readonly WaitlistEntry[], entry: WaitlistEntry, restaurantId: string): WaitlistEntry[] | null {
  if (entry.restaurantId !== restaurantId || entry.status !== 'waiting' || entries.some((candidate) => candidate.id === entry.id) || validateWaitlistEntry(entry).length > 0) return null;
  return [...entries.map(cloneWaitlistEntry), cloneWaitlistEntry(entry)];
}

export function transitionWaitlistEntry(
  entries: readonly WaitlistEntry[],
  entryId: string,
  status: WaitlistStatus,
  seatedBookingId?: string,
): WaitlistEntry[] | null {
  const target = entries.find((entry) => entry.id === entryId);
  if (target === undefined || !nextWaitlistStatuses(target.status).includes(status)) return null;
  const nextTarget: WaitlistEntry = {
    ...cloneWaitlistEntry(target),
    status,
    ...(status === 'seated' ? { seatedBookingId: seatedBookingId?.trim() ?? '' } : {}),
  };
  if (validateWaitlistEntry(nextTarget).length > 0) return null;
  return entries.map((entry) => entry.id === entryId ? nextTarget : cloneWaitlistEntry(entry));
}
