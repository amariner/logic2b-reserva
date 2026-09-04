import { describe, expect, it } from 'vitest';
import { PRODUCT } from './index';
import {
  THEME_CATALOG,
  WEB_ONLY_THEMES,
  getTheme,
  themeContactUrl,
  themeDetailUrl,
  themeMetaDescription,
  themeUrl,
} from './themes';

const expectedFormats = [
  'Bar de barrio',
  'Arrocería',
  'Grupo pequeño',
  'Restaurante de hotel',
  'Alta cocina',
  'Terraza estacional',
  'Local de eventos',
  'Cadena casual',
  'Espacio gastronómico',
] as const;

describe('theme catalogue', () => {
  it('keeps twelve unique fictional brands', () => {
    expect(THEME_CATALOG).toHaveLength(12);
    expect(new Set(THEME_CATALOG.map(({ slug }) => slug)).size).toBe(12);
    expect(new Set(THEME_CATALOG.map(({ name }) => name)).size).toBe(12);
  });

  it('keeps the three product journeys deep and the other nine web-only', () => {
    const deep = THEME_CATALOG.filter(({ depth }) => depth === 'deep');

    expect(deep.map(({ slug }) => slug).sort()).toEqual([...PRODUCT.demoSlugs].sort());
    expect(WEB_ONLY_THEMES).toHaveLength(9);
    expect(WEB_ONLY_THEMES.every(({ web }) => Boolean(web))).toBe(true);
  });

  it('covers the nine agreed commercial formats with complete demo copy', () => {
    expect(WEB_ONLY_THEMES.map(({ format }) => format.es).sort()).toEqual([...expectedFormats].sort());

    for (const theme of WEB_ONLY_THEMES) {
      expect(theme.web?.menu).toHaveLength(3);
      expect(theme.web?.body.es).toBeTruthy();
      expect(theme.web?.body.en).toBeTruthy();
      expect(Object.values(theme.palette).every((colour) => /^#[0-9a-f]{6}$/i.test(colour))).toBe(true);
    }
  });

  it('keeps a stable screenshot and unique search description for every public detail page', () => {
    const descriptions = new Set<string>();
    for (const theme of THEME_CATALOG) {
      expect(theme.screenshotBase).toMatch(/^\d{2}-[a-z0-9-]+$/);
      const metadata = themeMetaDescription(theme);
      for (const description of [metadata.es, metadata.en]) {
        expect(description.length).toBeGreaterThanOrEqual(100);
        expect(description.length).toBeLessThanOrEqual(160);
        expect(descriptions.has(description)).toBe(false);
        descriptions.add(description);
      }
    }
  });

  it('builds locale-aware routes and resolves known themes', () => {
    expect(themeUrl('la-trece')).toBe('/demos/la-trece/');
    expect(themeUrl('la-trece', 'en')).toBe('/en/demos/la-trece/');
    expect(themeDetailUrl('la-trece')).toBe('/temas/la-trece/');
    expect(themeDetailUrl('la-trece', 'en')).toBe('/en/temas/la-trece/');
    expect(themeContactUrl('la-trece')).toBe('/empezar/?theme=la-trece');
    expect(themeContactUrl('la-trece', 'en')).toBe('/en/empezar/?theme=la-trece');
    expect(getTheme('solane')?.name).toBe('Solane');
    expect(getTheme('unknown')).toBeUndefined();
  });
});
