import { z } from 'zod';
import { commercialLeadsEnabled, demoBlockedResponse, type DemoModeEnv } from './demo-mode';

export interface LeadEnv extends DemoModeEnv {
  LEADS_TRANSPORT?: 'resend' | 'disabled';
  LEADS_RESEND_API_KEY?: string;
  LEADS_FROM_EMAIL?: string;
  LEADS_INTERNAL_RECIPIENT?: string;
  LEADS_REPLY_TO?: string;
  LEAD_COORDINATOR?: DurableObjectNamespace;
}

const emailConfigurationSchema = z.object({
  apiKey: z.string().trim().min(1),
  fromEmail: z.string().trim().email().max(254),
  internalRecipient: z.string().trim().email().max(254),
  replyTo: z.string().trim().email().max(254),
});

type EmailConfiguration = z.output<typeof emailConfigurationSchema>;

const leadInterestSchema = z.object({
  kind: z.enum(['theme', 'panel']),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(80),
  name: z.string().trim().min(1).max(160),
});

const fullLeadSchema = z.object({
  source: z.literal('full'),
  name: z.string().trim().min(1).max(120),
  restaurant: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional(),
  level: z.enum(['basico', 'gestion', 'inteligente']),
  message: z.string().trim().max(2_000).default(''),
  interest: leadInterestSchema.optional(),
  lang: z.enum(['es', 'en']).default('es'),
  accept: z.literal(true),
  website: z.string().trim().max(200).optional(),
});

const briefLeadSchema = z.object({
  source: z.literal('brief'),
  email: z.string().trim().email().max(200),
  lang: z.enum(['es', 'en']).default('es'),
  accept: z.literal(true),
  website: z.string().trim().max(200).optional(),
});

export const leadSchema = z.preprocess((candidate) => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || 'source' in candidate) return candidate;
  return { ...candidate, source: 'full' };
}, z.discriminatedUnion('source', [fullLeadSchema, briefLeadSchema]))
  .transform((lead) => ({ ...lead, email: lead.email.toLowerCase() }));

export type Lead = z.output<typeof leadSchema>;

export interface LeadCoordination {
  rateLimit(ip: string): Promise<number | null>;
  submit(fingerprint: string, lead: Lead): Promise<Response>;
}

export async function handleLead(request: Request, env: LeadEnv, coordination = cloudflareCoordination(env)): Promise<Response> {
  // Keep this second guard: callers cannot bypass the public Worker router.
  if (!commercialLeadsEnabled(env)) return demoBlockedResponse('commercial_lead_delivery');
  if (!coordination) return json({ ok: false, outcome: 'disabled', error: 'lead_coordination_unavailable' }, 503);
  const ip = request.headers.get('cf-connecting-ip') ?? 'local';
  let retryAfter: number | null;
  try { retryAfter = await coordination.rateLimit(ip); }
  catch {
    console.error(JSON.stringify({ event: 'lead_rate_limit_failed' }));
    return json({ ok: false, outcome: 'failed', error: 'lead_coordination_failed' }, 503);
  }
  if (retryAfter) return json({ ok: false, outcome: 'limited', error: 'rate_limited', retryAfter }, 429, { 'retry-after': String(retryAfter) });

  const raw: unknown = await request.json().catch(() => null);
  const bot = z.object({ website: z.string().optional() }).passthrough().safeParse(raw);
  if (bot.success && bot.data.website?.trim()) return json({ ok: true, outcome: 'received' }, 202);
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return json({ ok: false, outcome: 'invalid', error: 'invalid', issues: parsed.error.issues }, 400);

  if ((env.LEADS_TRANSPORT ?? 'disabled') !== 'resend') return json({ ok: false, outcome: 'disabled', error: 'lead_delivery_disabled' }, 503);
  if (!parseEmailConfiguration(env)) {
    logInvalidEmailConfiguration(env);
    return json({ ok: false, outcome: 'disabled', error: 'lead_email_configuration_invalid' }, 503);
  }

  const fingerprint = await sha256(stableJson(parsed.data));
  try { return await coordination.submit(fingerprint, parsed.data); }
  catch {
    console.error(JSON.stringify({ event: 'lead_coordination_failed' }));
    return json({ ok: false, outcome: 'failed', error: 'lead_coordination_failed' }, 503);
  }
}

export async function deliverLead(lead: Lead, env: LeadEnv, ref: string): Promise<Response> {
  // Provider adapter also fails closed if invoked directly.
  if (!commercialLeadsEnabled(env)) return demoBlockedResponse('commercial_email_provider');
  const configuration = parseEmailConfiguration(env);
  if ((env.LEADS_TRANSPORT ?? 'disabled') !== 'resend' || !configuration) return json({ ok: false, outcome: 'disabled', error: 'lead_delivery_disabled' }, 503);
  const isBrief = lead.source === 'brief';
  const rows: [string, string][] = isBrief ? [
    ['Tipo', 'Captación breve'], ['Email', lead.email], ['Idioma', lead.lang], ['Privacidad', 'Aceptada para responder'],
  ] : [
    ['Tipo', 'Solicitud completa'], ['Restaurante', lead.restaurant], ['Nombre', lead.name], ['Email', lead.email], ['Teléfono', lead.phone || '—'],
    ['Nivel de interés', lead.level],
    ['Interés seleccionado', lead.interest ? `${lead.interest.kind === 'theme' ? (lead.lang === 'en' ? 'Website' : 'Web') : (lead.lang === 'en' ? 'Product view' : 'Vista de producto')} · ${lead.interest.name}` : '—'],
    ['Idioma', lead.lang], ['Privacidad', 'Aceptada para responder'],
  ];
  const subject = isBrief ? `${lead.email} · interés inicial Logic Reserva` : `${lead.restaurant} · solicitud Logic Reserva`;
  const detail = isBrief
    ? 'Solicita información inicial desde el hero comercial.'
    : lead.message || (lead.lang === 'en' ? 'No additional message.' : 'Sin mensaje adicional.');
  const text = `Nueva solicitud — Logic Reserva\n\n${rows.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nQué quiere resolver:\n${detail}\n\nReferencia: ${ref}`;
  const html = `<h2>Nueva solicitud — Logic Reserva</h2><table>${rows.map(([key, value]) => `<tr><td><strong>${escapeHtml(key)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join('')}</table><p><strong>Qué quiere resolver</strong><br>${escapeHtml(detail)}</p><p>Referencia: ${escapeHtml(ref)}</p>`;
  const delivered = await resend(configuration.apiKey, `reserva-lead/${ref}/internal`, {
    from: `Logic Reserva <${configuration.fromEmail}>`,
    to: [configuration.internalRecipient],
    reply_to: lead.email || configuration.replyTo,
    subject,
    html,
    text,
  });
  if (!delivered) {
    console.error(JSON.stringify({ event: 'lead_delivery_failed', ref, channel: 'internal_email' }));
    return json({ ok: false, outcome: 'failed', error: 'lead_delivery_failed', ref }, 502);
  }
  return json({ ok: true, outcome: 'delivered', ref }, 202);
}

function parseEmailConfiguration(env: LeadEnv): EmailConfiguration | null {
  const parsed = emailConfigurationSchema.safeParse({
    apiKey: env.LEADS_RESEND_API_KEY,
    fromEmail: env.LEADS_FROM_EMAIL,
    internalRecipient: env.LEADS_INTERNAL_RECIPIENT,
    replyTo: env.LEADS_REPLY_TO,
  });
  return parsed.success ? parsed.data : null;
}

function logInvalidEmailConfiguration(env: LeadEnv): void {
  const fieldNames: Record<string, string> = {
    apiKey: 'LEADS_RESEND_API_KEY',
    fromEmail: 'LEADS_FROM_EMAIL',
    internalRecipient: 'LEADS_INTERNAL_RECIPIENT',
    replyTo: 'LEADS_REPLY_TO',
  };
  const parsed = emailConfigurationSchema.safeParse({
    apiKey: env.LEADS_RESEND_API_KEY,
    fromEmail: env.LEADS_FROM_EMAIL,
    internalRecipient: env.LEADS_INTERNAL_RECIPIENT,
    replyTo: env.LEADS_REPLY_TO,
  });
  const fields = parsed.success ? [] : [...new Set(parsed.error.issues.map((issue) => fieldNames[String(issue.path[0])]).filter(Boolean))];
  console.error(JSON.stringify({ event: 'lead_email_configuration_invalid', fields }));
}

function cloudflareCoordination(env: LeadEnv): LeadCoordination | null {
  if (!env.LEAD_COORDINATOR) return null;
  let namespace = env.LEAD_COORDINATOR;
  try { namespace = namespace.jurisdiction('eu'); }
  catch { /* workerd local no implementa restricciones de jurisdicción. */ }
  return {
    async rateLimit(ip) {
      const key = await sha256(ip);
      const response = await namespace.getByName(`rate:${key}`).fetch('https://lead-coordinator/rate-limit', { method: 'POST' });
      if (!response.ok) throw new Error('rate_limit_unavailable');
      const body = await response.json() as { retryAfter?: number | null };
      return body.retryAfter ?? null;
    },
    submit(fingerprint, lead) {
      return namespace.getByName(`lead:${fingerprint}`).fetch('https://lead-coordinator/deliver', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(lead),
      });
    },
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function resend(apiKey: string, idempotencyKey: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const providerError: unknown = await response.json().catch(() => null);
      const errorType = z.object({ name: z.string().max(120).optional() }).passthrough().safeParse(providerError);
      console.error(JSON.stringify({
        event: 'lead_provider_rejected',
        provider: 'resend',
        status: response.status,
        errorType: errorType.success ? errorType.data.name ?? 'unknown' : 'unknown',
      }));
    }
    return response.ok;
  } catch {
    console.error(JSON.stringify({ event: 'lead_provider_unreachable', provider: 'resend' }));
    return false;
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
}
