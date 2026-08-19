import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeadCoordinator } from './lead-coordinator';
import type { LeadEnv } from './leads';

const lead = { name: 'Ada Sala', restaurant: 'Bistró Ada', email: 'ada@example.test', phone: '', level: 'gestion', message: 'Reservas y grupos.', accept: true, website: '', lang: 'es' };
const emailEnv = { DEMO_MODE: 'true', COMMERCIAL_LEADS_ENABLED: 'true', LEADS_TRANSPORT: 'resend', LEADS_RESEND_API_KEY: 'secret', LEADS_FROM_EMAIL: 'hola@logic2b.com', LEADS_INTERNAL_RECIPIENT: 'marinerandreu+logic@gmail.com', LEADS_REPLY_TO: 'hola@logic2b.com' } as const satisfies LeadEnv;

class MemoryStorage {
  readonly values = new Map<string, unknown>();
  alarm: number | null = null;
  async get<T>(key: string): Promise<T | undefined> { return this.values.get(key) as T | undefined; }
  async put(key: string, value: unknown): Promise<void> { this.values.set(key, value); }
  async delete(): Promise<boolean> { return false; }
  async deleteAll(): Promise<void> { this.values.clear(); this.alarm = null; }
  async setAlarm(time: number | Date): Promise<void> { this.alarm = Number(time); }
}

const state = (storage = new MemoryStorage()) => ({ storage } as unknown as DurableObjectState);
const deliver = (coordinator: LeadCoordinator) => coordinator.fetch(new Request('https://coordinator/deliver', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(lead) }));

describe('LeadCoordinator', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('limita a cinco solicitudes por IP y minuto de forma persistente', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T10:00:00Z'));
    const storage = new MemoryStorage();
    let coordinator = new LeadCoordinator(state(storage), { DEMO_MODE: 'true', COMMERCIAL_LEADS_ENABLED: 'true' });
    for (let count = 0; count < 5; count += 1) expect(await (await coordinator.fetch(new Request('https://coordinator/rate-limit', { method: 'POST' }))).json()).toEqual({ retryAfter: null });
    coordinator = new LeadCoordinator(state(storage), { DEMO_MODE: 'true', COMMERCIAL_LEADS_ENABLED: 'true' });
    expect(await (await coordinator.fetch(new Request('https://coordinator/rate-limit', { method: 'POST' }))).json()).toEqual({ retryAfter: 60 });
  });

  it('reproduce una entrega completada sin volver a llamar a Resend', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    const storage = new MemoryStorage();
    const first = await deliver(new LeadCoordinator(state(storage), emailEnv));
    const firstBody = await first.json() as { ref: string };
    const second = await deliver(new LeadCoordinator(state(storage), emailEnv));
    expect(await second.json()).toMatchObject({ ref: firstBody.ref, replayed: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('permanece inerte sin la excepción comercial aunque se invoque directamente', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch');
    const storage = new MemoryStorage();
    const coordinator = new LeadCoordinator(state(storage), { ...emailEnv, COMMERCIAL_LEADS_ENABLED: 'false' });
    expect((await deliver(coordinator)).status).toBe(403);
    expect((await coordinator.fetch(new Request('https://coordinator/rate-limit', { method: 'POST' }))).status).toBe(403);
    await coordinator.alarm();
    expect(storage.values.size).toBe(0);
    expect(storage.alarm).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
