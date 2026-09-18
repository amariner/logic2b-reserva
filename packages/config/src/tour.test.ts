import { describe, expect, it } from 'vitest';
import { requestedTourStep, tourContactUrl, tourContext, tourStepAtLocation, tourSteps, tourStepUrl } from './tour';

describe('commercial journey routes', () => {
  it('keeps all nine existing shared links useful without expanding the short journey', () => {
    expect(tourSteps('es')).toHaveLength(4);
    expect(['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(requestedTourStep)).toEqual([3, 0, 0, 1, 2, 2, 2, 2, 3]);
    expect(requestedTourStep('web')).toBe(0);
    expect(requestedTourStep('sala')).toBe(2);
    for (const invalid of [null, '', '0', '10', 'Infinity', 'intro', '__proto__']) expect(requestedTourStep(invalid)).toBeNull();
  });

  it('returns to the correct step after browser back, including the booking fragment', () => {
    for (const locale of ['es', 'en'] as const) {
      tourSteps(locale).forEach((step, index) => {
        const url = new URL(tourStepUrl(step), 'https://reserva.logic2b.com');
        expect(requestedTourStep(url.searchParams.get('recorrido'))).toBe(index);
        expect(tourStepAtLocation(url)).toBe(index);
        if (locale === 'en') expect(url.pathname.startsWith('/en/')).toBe(true);
      });
    }
    expect(tourStepAtLocation(new URL('https://reserva.logic2b.com/empezar/'))).toBeNull();
  });

  it('keeps only a valid selected theme, panel or plan when starting a conversation', () => {
    expect(tourContext(new URL('https://reserva.logic2b.com/en/temas/solane/?email=private@example.test'))).toBe('theme=solane');
    expect(tourContactUrl('en', 'panel=inteligente&email=private@example.test')).toBe('/en/empezar/?panel=inteligente');
    expect(tourContactUrl('es', 'plan=basico')).toBe('/empezar/?plan=basico');
    expect(tourContactUrl('es', 'theme=vedra&plan=inteligente')).toBe('/empezar/?theme=vedra&plan=inteligente');
    expect(tourContactUrl('en', 'panel=inteligente&plan=gestion')).toBe('/en/empezar/?panel=inteligente&plan=gestion');
    expect(tourContactUrl('es', 'theme=missing&panel=missing&plan=missing&email=private@example.test')).toBe('/empezar/?theme=vedra');
  });

  it('carries only valid commercial context between steps when storage is unavailable', () => {
    const url = new URL(tourStepUrl(tourSteps('en')[2], 'panel=inteligente&plan=gestion&email=private@example.test'), 'https://reserva.logic2b.com');
    expect(url.pathname).toBe('/en/demos/vedra/gestion/');
    expect(url.searchParams.get('vista')).toBe('servicio');
    expect(url.searchParams.get('recorrido')).toBe('sala');
    expect(url.searchParams.get('panel')).toBe('inteligente');
    expect(url.searchParams.get('plan')).toBe('gestion');
    expect(url.searchParams.has('email')).toBe(false);
  });
});
