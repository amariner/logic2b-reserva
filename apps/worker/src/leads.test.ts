import { afterEach, describe, expect, it, vi } from 'vitest';
import { deliverLead, handleLead, leadSchema, type LeadCoordination, type LeadEnv } from './leads';

const lead = { name: 'Ada Sala', restaurant: 'Bistró Ada', email: 'ada@example.test', phone: '+34 600 000 000', level: 'gestion', message: 'Quiero ordenar reservas y grupos.', accept: true, website: '', lang: 'es' } as const;
const emailEnv = {
  LEADS_TRANSPORT: 'resend',
  LEADS_RESEND_API_KEY: 'secret-test-key',
  LEADS_FROM_EMAIL: 'hola@logic2b.com',
  LEADS_INTERNAL_RECIPIENT: 'marinerandreu+logic@gmail.com',
  LEADS_REPLY_TO: 'hola@logic2b.com',
} as const satisfies LeadEnv;

function directCoordination(env: LeadEnv): LeadCoordination {
  return { rateLimit: async () => null, submit: async (_fingerprint, submittedLead) => deliverLead(submittedLead, env, 'test-ref') };
}

function submit(env: LeadEnv, body: unknown = lead, coordination: LeadCoordination = directCoordination(env)) {
  return handleLead(new Request('https://test/api/leads', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': crypto.randomUUID() }, body: JSON.stringify(body) }), env, coordination);
}

describe('leads de Logic Reserva', () => {
  afterEach(() => vi.restoreAllMocks());

  it('normaliza el email y exige consentimiento explícito', () => {
    expect(leadSchema.parse({ ...lead, email: 'ADA@Example.Test' }).email).toBe('ada@example.test');
    expect(leadSchema.safeParse({ ...lead, accept: false }).success).toBe(false);
    expect(leadSchema.safeParse({ ...lead, level: 'basico' }).success).toBe(true);
    expect(leadSchema.safeParse({ ...lead, level: 'automatiza' }).success).toBe(false);
  });

  it('responde invalid(400) sin llamar al proveedor', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch');
    const response = await submit(emailEnv, { ...lead, email: 'incorrecto' });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ outcome: 'invalid' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('responde limited(429) con Retry-After', async () => {
    const coordination: LeadCoordination = { rateLimit: async () => 37, submit: async () => new Response() };
    const response = await submit(emailEnv, lead, coordination);
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('37');
    expect(await response.json()).toMatchObject({ outcome: 'limited', retryAfter: 37 });
  });

  it('responde disabled(503) cuando el transporte o la configuración no están listos', async () => {
    const disabled = await submit({ LEADS_TRANSPORT: 'disabled' });
    expect(disabled.status).toBe(503);
    expect(await disabled.json()).toMatchObject({ outcome: 'disabled' });
    const logger = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const incomplete = await submit({ LEADS_TRANSPORT: 'resend', LEADS_RESEND_API_KEY: 'secret-that-must-not-leak' });
    expect(incomplete.status).toBe(503);
    expect(await incomplete.json()).toMatchObject({ error: 'lead_email_configuration_invalid' });
    expect(logger.mock.calls.flat().join(' ')).not.toContain('secret-that-must-not-leak');
    expect(logger.mock.calls.flat().join(' ')).toContain('LEADS_FROM_EMAIL');

    logger.mockClear();
    const invalidEmail = await submit({ ...emailEnv, LEADS_FROM_EMAIL: 'not-an-email' });
    expect(invalidEmail.status).toBe(503);
    expect(logger.mock.calls.flat().join(' ')).toContain('LEADS_FROM_EMAIL');
    expect(logger.mock.calls.flat().join(' ')).not.toContain('not-an-email');
  });

  it('acepta el honeypot sin entregar ni revelar el filtro', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch');
    const response = await submit(emailEnv, { ...lead, website: 'spam.test' });
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true, outcome: 'received' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('responde failed(502) si Resend no acepta el correo', async () => {
    const logger = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ name: 'validation_error', message: 'detalle sensible' }), { status: 422, headers: { 'content-type': 'application/json' } }));
    const response = await submit(emailEnv);
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ outcome: 'failed', ref: 'test-ref' });
    expect(logger.mock.calls.flat().join(' ')).toContain('lead_provider_rejected');
    expect(logger.mock.calls.flat().join(' ')).toContain('validation_error');
    expect(logger.mock.calls.flat().join(' ')).not.toContain('detalle sensible');
    expect(logger.mock.calls.flat().join(' ')).not.toContain(lead.email);
  });

  it('registra un fallo de red sin exponer la excepción', async () => {
    const logger = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('secret-network-detail'));
    const response = await submit(emailEnv);
    expect(response.status).toBe(502);
    expect(logger.mock.calls.flat().join(' ')).toContain('lead_provider_unreachable');
    expect(logger.mock.calls.flat().join(' ')).not.toContain('secret-network-detail');
  });

  it('responde delivered(202), usa idempotency-key y dirige el lead al destinatario acordado', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    const response = await submit(emailEnv);
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ outcome: 'delivered', ref: 'test-ref' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [, init] = fetcher.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    const payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(headers.get('idempotency-key')).toBe('reserva-lead/test-ref/internal');
    expect(payload).toMatchObject({ from: 'Logic Reserva <hola@logic2b.com>', to: ['marinerandreu+logic@gmail.com'], reply_to: 'ada@example.test' });
  });
});
