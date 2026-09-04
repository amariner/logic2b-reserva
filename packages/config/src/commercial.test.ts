import { describe, expect, it } from 'vitest';
import { COMMERCIAL_PLANS, IMPLEMENTATION_PATH, IMPLEMENTATION_SERVICES, commercialContactUrl, commercialDemoUrl } from './commercial';

describe('commercial offer', () => {
  it('preserves ADR-010 as exactly three ordered plans', () => {
    expect(COMMERCIAL_PLANS.map(({ slug }) => slug)).toEqual(['basico', 'gestion', 'inteligente']);
    expect(new Set(COMMERCIAL_PLANS.map(({ name }) => name.es))).toEqual(new Set(['Básico', 'Gestión', 'Inteligente']));
  });

  it('maps every plan to its agreed demonstration and explicit boundary', () => {
    expect(COMMERCIAL_PLANS.map(({ demo }) => demo.name)).toEqual(['Brasca', 'Vedra', 'Solane']);
    expect(COMMERCIAL_PLANS.every(({ capabilities, boundary }) => capabilities.length === 3 && boundary.es.length > 40)).toBe(true);
    expect(commercialDemoUrl(COMMERCIAL_PLANS[1])).toBe('/demos/vedra/gestion/?vista=servicio');
    expect(commercialDemoUrl(COMMERCIAL_PLANS[2], 'en')).toBe('/en/demos/solane/gestion/?vista=plano');
    expect(commercialContactUrl(COMMERCIAL_PLANS[0])).toBe('/empezar/?plan=basico');
    expect(commercialContactUrl(COMMERCIAL_PLANS[2], 'en')).toBe('/en/empezar/?plan=inteligente');
  });

  it('describes launch, care and evolution without publishing prices', () => {
    expect(IMPLEMENTATION_SERVICES.map(({ slug }) => slug)).toEqual(['launch', 'care', 'evolution']);
    const text = JSON.stringify(IMPLEMENTATION_SERVICES);
    expect(text).not.toMatch(/€|EUR|\beuros?\b/i);
  });

  it('exposes the six agreed implementation moments in narrative order', () => {
    expect(IMPLEMENTATION_PATH.map(({ slug }) => slug)).toEqual([
      'inputs', 'configuration', 'validation', 'publication', 'maintenance', 'boundaries',
    ]);
    expect(IMPLEMENTATION_PATH.every(({ owner, summary }) => owner.es && summary.en)).toBe(true);
  });
});
