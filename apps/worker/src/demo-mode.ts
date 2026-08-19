export interface DemoModeEnv {
  DEMO_MODE?: string;
  COMMERCIAL_LEADS_ENABLED?: string;
}

/**
 * Public deployments fail closed: only the exact value `false` can leave demo
 * mode. A missing, misspelled or unexpected value keeps every effect blocked.
 */
export function isDemoMode(env: DemoModeEnv): boolean {
  return env.DEMO_MODE !== 'false';
}

/** The commercial landing is outside the simulated product surfaces. */
export function commercialLeadsEnabled(env: DemoModeEnv): boolean {
  return env.COMMERCIAL_LEADS_ENABLED === 'true';
}

export const DEMO_CAPABILITIES = Object.freeze({
  mode: 'demo',
  productDemo: Object.freeze({
    sideEffects: false,
    jobs: false,
    providers: Object.freeze({
      email: 'disabled',
      payments: 'disabled',
      webhooks: 'disabled',
      externalStorage: 'disabled',
      automation: 'mock',
    }),
  }),
  commercialLanding: Object.freeze({
    leadCapture: 'explicitly_configured',
    email: 'resend',
    durableCoordination: 'enabled',
  }),
} as const);

export function demoBlockedResponse(capability: string): Response {
  return new Response(JSON.stringify({
    ok: false,
    outcome: 'demo_blocked',
    error: 'side_effects_disabled',
    capability,
  }), {
    status: 403,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
