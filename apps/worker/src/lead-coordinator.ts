import { deliverLead, leadSchema, type Lead, type LeadEnv } from './leads';
import { commercialLeadsEnabled, demoBlockedResponse } from './demo-mode';

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1_000;

interface StoredResponse { body: string; status: number; expiresAt: number; }

export class LeadCoordinator {
  private delivery?: Promise<StoredResponse>;

  constructor(private readonly state: DurableObjectState, private readonly env: LeadEnv) {}

  async fetch(request: Request): Promise<Response> {
    if (!commercialLeadsEnabled(this.env)) return demoBlockedResponse('commercial_lead_coordination');
    const path = new URL(request.url).pathname;
    if (path === '/rate-limit' && request.method === 'POST') return this.rateLimit();
    if (path === '/deliver' && request.method === 'POST') return this.deliver(request);
    return json({ error: 'not_found' }, 404);
  }

  async alarm(): Promise<void> {
    if (!commercialLeadsEnabled(this.env)) return;
    await this.state.storage.deleteAll();
  }

  private async rateLimit(now = Date.now()): Promise<Response> {
    const timestamps = (await this.state.storage.get<number[]>('timestamps') ?? []).filter((stamp) => now - stamp < RATE_WINDOW_MS);
    if (timestamps.length >= RATE_LIMIT) {
      const retryAfter = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - timestamps[0]!)) / 1_000));
      await this.state.storage.put('timestamps', timestamps);
      await this.state.storage.setAlarm(timestamps[0]! + RATE_WINDOW_MS);
      return json({ retryAfter });
    }
    timestamps.push(now);
    await this.state.storage.put('timestamps', timestamps);
    await this.state.storage.setAlarm(now + RATE_WINDOW_MS);
    return json({ retryAfter: null });
  }

  private async deliver(request: Request): Promise<Response> {
    const now = Date.now();
    const cached = await this.state.storage.get<StoredResponse>('result');
    if (cached && cached.expiresAt > now) return storedResponse(cached, true);
    if (cached) await this.state.storage.deleteAll();
    const parsed = leadSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ ok: false, outcome: 'invalid', error: 'invalid' }, 400);
    if (!this.delivery) this.delivery = this.performDelivery(parsed.data, now);
    try { return storedResponse(await this.delivery, false); }
    finally { this.delivery = undefined; }
  }

  private async performDelivery(lead: Lead, now: number): Promise<StoredResponse> {
    let ref = await this.state.storage.get<string>('ref');
    if (!ref) { ref = crypto.randomUUID(); await this.state.storage.put('ref', ref); }
    const response = await deliverLead(lead, this.env, ref);
    const stored = { body: await response.text(), status: response.status, expiresAt: now + IDEMPOTENCY_TTL_MS };
    if (response.status >= 200 && response.status < 300) {
      await this.state.storage.put('result', stored);
      await this.state.storage.setAlarm(stored.expiresAt);
    }
    return stored;
  }
}

function storedResponse(response: StoredResponse, replayed: boolean): Response {
  let body = response.body;
  if (replayed) {
    try { body = JSON.stringify({ ...(JSON.parse(body) as Record<string, unknown>), replayed: true }); }
    catch { /* Conserva una respuesta no JSON, aunque el proveedor no debería producirla. */ }
  }
  return new Response(body, { status: response.status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}
