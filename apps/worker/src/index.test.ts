import { describe, expect, it, vi } from 'vitest';
import worker, { type Env } from './index';

function env(overrides: Partial<Env> = {}): Env {
  return {
    DEMO_MODE: 'true',
    COMMERCIAL_LEADS_ENABLED: 'false',
    ASSETS: { fetch: vi.fn(async () => new Response('asset')) } as unknown as Fetcher,
    ...overrides,
  };
}

describe('frontera HTTP del Worker', () => {
  it('bloquea la excepción comercial antes de leer el body', async () => {
    const response = await worker.fetch(
      new Request('https://demo.test/api/leads', { method: 'POST', body: '{json inválido' }),
      env(),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ outcome: 'demo_blocked', capability: 'lead_delivery' });
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('mantiene ocultas las demás APIs', async () => {
    const response = await worker.fetch(new Request('https://demo.test/api/payments', { method: 'POST' }), env());
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not_found' });
  });
});
