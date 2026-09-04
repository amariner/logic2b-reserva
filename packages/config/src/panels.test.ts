import { describe, expect, it } from 'vitest';
import { PANEL_CATALOG, getPanel, panelContactUrl, panelDemoUrl, panelDetailUrl } from './panels';

describe('panel catalogue', () => {
  it('defines the six agreed restaurant product doors once', () => {
    expect(PANEL_CATALOG).toHaveLength(6);
    expect(new Set(PANEL_CATALOG.map(({ slug }) => slug)).size).toBe(6);
    expect(PANEL_CATALOG.map(({ slug }) => slug)).toEqual([
      'servicio', 'plano', 'reservas-espera', 'grupos-eventos', 'informes', 'inteligente',
    ]);
  });

  it('keeps management and intelligent scope explicit', () => {
    expect(PANEL_CATALOG.filter(({ level }) => level === 'management')).toHaveLength(5);
    expect(PANEL_CATALOG.filter(({ level }) => level === 'intelligent')).toHaveLength(1);
    for (const panel of PANEL_CATALOG) {
      expect(panel.user.es).toBeTruthy();
      expect(panel.decision.en).toBeTruthy();
      expect(panel.evidence.es).toBeTruthy();
      expect(panel.limit.en).toBeTruthy();
      expect(panel.signals).toHaveLength(3);
      for (const locale of ['es', 'en'] as const) {
        expect(panel.metaDescription[locale].length).toBeGreaterThanOrEqual(100);
        expect(panel.metaDescription[locale].length).toBeLessThanOrEqual(160);
      }
    }
  });

  it('links only to reproducible manager states and existing F18 captures', () => {
    for (const panel of PANEL_CATALOG) {
      expect(panel.demoPath).toMatch(/^\/demos\/(vedra|solane)\/gestion\/\?vista=/);
      expect(panel.screenshot.base).toMatch(/^(04-vedra-grupo|05-solane-inventario|07-solane-privatizacion|08-solane-riesgo)$/);
    }
  });

  it('builds locale-aware demo routes and resolves entries', () => {
    expect(panelDemoUrl('servicio')).toBe('/demos/vedra/gestion/?vista=servicio');
    expect(panelDemoUrl('inteligente', 'en')).toBe('/en/demos/solane/gestion/?vista=informes');
    expect(panelDetailUrl('servicio')).toBe('/paneles/servicio/');
    expect(panelDetailUrl('inteligente', 'en')).toBe('/en/paneles/inteligente/');
    expect(panelContactUrl('plano')).toBe('/empezar/?panel=plano');
    expect(panelContactUrl('informes', 'en')).toBe('/en/empezar/?panel=informes');
    expect(getPanel('plano')?.title.es).toBe('Plano de sala');
    expect(getPanel('unknown')).toBeUndefined();
  });
});
