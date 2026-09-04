import { describe, expect, it } from 'vitest';
import { GUIDE_CATALOG, getGuide, guideUrl } from './guides';

describe('public guides', () => {
  it('defines the five agreed role guides once', () => {
    expect(GUIDE_CATALOG.map(({ slug }) => slug)).toEqual(['sala', 'gestion', 'direccion', 'propietario', 'tecnica']);
    expect(new Set(GUIDE_CATALOG.map(({ slug }) => slug)).size).toBe(5);
  });

  it('gives every role actionable sections and an explicit outcome', () => {
    for (const guide of GUIDE_CATALOG) {
      expect(guide.sections.length).toBeGreaterThanOrEqual(3);
      expect(guide.sections.every(({ points }) => points.length === 3)).toBe(true);
      expect(guide.audience.es).toBeTruthy();
      expect(guide.outcome.en).toBeTruthy();
    }
  });

  it('covers the agreed implementation and continuity topics', () => {
    const corpus = JSON.stringify(GUIDE_CATALOG).toLocaleLowerCase();
    for (const topic of ['migración', 'datos', 'dominio', 'dns', 'cobros', 'rgpd', 'salida', 'soporte']) {
      expect(corpus, topic).toContain(topic);
    }
  });

  it('builds bilingual routes and resolves entries', () => {
    expect(guideUrl('sala')).toBe('/docs/sala/');
    expect(guideUrl('tecnica', 'en')).toBe('/en/docs/tecnica/');
    expect(getGuide('direccion')?.title.es).toBe('Guía de Dirección');
    expect(getGuide('unknown')).toBeUndefined();
  });
});
