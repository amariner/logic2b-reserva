import type { Locale } from './index';
import { getTheme } from './themes';
import { getPanel } from './panels';

export const TOUR_STORAGE_KEY = 'logic2b:reserva-tour:v2';
export const TOUR_STEP_IDS = ['web', 'reserva', 'sala', 'planes'] as const;
export type TourStepId = (typeof TOUR_STEP_IDS)[number];
export interface TourStep { id: TourStepId; label: string; title: string; body: string; href: string; next: string }

export const tourCopy = (locale: Locale) => locale === 'en' ? {
  title: 'From your website to a table.', body: 'A short look at the guest experience and the day on the floor.',
  meta: '4 steps · 2 minutes · sample restaurant', eyebrow: 'Take a look', start: 'Show me', resume: 'Continue the tour',
  explore: 'Explore on my own', exit: 'Exit tour', progress: 'Tour steps', back: 'Back',
  collapse: 'Minimise tour', expand: 'Expand tour', return: 'Back to where I started', tour: 'Guided tour', contact: 'Talk about my restaurant',
} : {
  title: 'De tu web a la mesa.', body: 'Un vistazo a lo que ve el cliente y a cómo se organiza la sala.',
  meta: '4 pasos · 2 minutos · restaurante de ejemplo', eyebrow: 'Echa un vistazo', start: 'Ver cómo funciona', resume: 'Continuar recorrido',
  explore: 'Explorar por mi cuenta', exit: 'Salir del recorrido', progress: 'Pasos del recorrido', back: 'Atrás',
  collapse: 'Minimizar recorrido', expand: 'Ampliar recorrido', return: 'Volver al punto de partida', tour: 'Recorrido guiado', contact: 'Hablar de mi restaurante',
};

export const tourSteps = (locale: Locale): TourStep[] => {
  const prefix = locale === 'en' ? '/en' : '';
  const copy = locale === 'en' ? [
    ['Your website', 'A place that feels like you.', 'Your menu, your atmosphere and a clear invitation to book.', 'See the booking'],
    ['The booking', 'A table in a few steps.', 'Date, party size and time, all within the restaurant’s website. Take a look or try a sample booking.', 'See the floor'],
    ['The floor', 'Know who is coming.', 'Bookings, tables and the next arrival together. Explore the sample service at your own pace.', 'See the options'],
    ['Your next step', 'Start with what you need.', 'A website, day-to-day management or events too. Compare the three options and choose your starting point.', 'Talk about my restaurant'],
  ] : [
    ['Tu web', 'Un lugar que habla de ti.', 'Tu carta, tu ambiente y una invitación clara a reservar.', 'Ver la reserva'],
    ['La reserva', 'Una mesa en pocos pasos.', 'Fecha, personas y hora dentro de la web del restaurante. Puedes mirar o probar una reserva de ejemplo.', 'Ver la sala'],
    ['La sala', 'Saber quién viene.', 'Reservas, mesas y próximas llegadas en un mismo lugar. Explora el servicio de ejemplo a tu ritmo.', 'Ver las opciones'],
    ['Tu siguiente paso', 'Empieza por lo que necesitas.', 'Una web, la gestión del día a día o también tus eventos. Compara las tres opciones y elige por dónde empezar.', 'Hablar de mi restaurante'],
  ];
  const routes = ['/demos/vedra/', '/demos/vedra/#reserva', '/demos/vedra/gestion/?vista=servicio', '/planes/'];
  return TOUR_STEP_IDS.map((id, index) => ({ id, label: copy[index][0], title: copy[index][1], body: copy[index][2], next: copy[index][3], href: `${prefix}${routes[index]}` }));
};

// Keep shared links from the former nine-stop journey usable.
export const requestedTourStep = (value: string | null): number | null => {
  if (!value) return null;
  const semantic = TOUR_STEP_IDS.indexOf(value as TourStepId);
  if (semantic !== -1) return semantic;
  const legacy: Record<string, number> = { '1': 3, '2': 0, '3': 0, '4': 1, '5': 2, '6': 2, '7': 2, '8': 2, '9': 3 };
  return Object.hasOwn(legacy, value) ? legacy[value] : null;
};

export const tourStepUrl = (step: TourStep, context?: string): string => {
  const url = new URL(step.href, 'https://reserva.logic2b.com');
  url.searchParams.set('recorrido', step.id);
  if (context) {
    const safeContext = new URL(tourContactUrl('es', context), url.origin).searchParams;
    safeContext.forEach((value, key) => url.searchParams.set(key, value));
  }
  return `${url.pathname}${url.search}${url.hash}`;
};

export const tourContactUrl = (locale: Locale, context: string): string => {
  const params = new URLSearchParams(context);
  const result = new URLSearchParams();
  const theme = params.get('theme');
  const panel = params.get('panel');
  const plan = params.get('plan');
  if (theme && getTheme(theme)) result.set('theme', theme);
  else if (panel && getPanel(panel)) result.set('panel', panel);
  if (plan && ['basico', 'gestion', 'inteligente'].includes(plan)) result.set('plan', plan);
  if (result.size === 0) result.set('theme', 'vedra');
  return `${locale === 'en' ? '/en' : ''}/empezar/?${result}`;
};

export const tourContext = (url: URL): string => {
  const params = new URLSearchParams(url.search);
  const match = url.pathname.match(/^\/(?:en\/)?(temas|paneles)\/([^/]+)\/$/);
  if (match) params.set(match[1] === 'temas' ? 'theme' : 'panel', match[2]);
  return tourContactUrl('es', params.toString()).split('?')[1];
};

export const tourStepAtLocation = (url: URL): number | null => {
  const path = url.pathname.replace(/^\/en\//, '/');
  if (path === '/demos/vedra/') return url.hash === '#reserva' ? 1 : 0;
  if (path === '/demos/vedra/gestion/' && (url.searchParams.get('vista') ?? 'servicio') === 'servicio') return 2;
  if (path === '/planes/') return 3;
  return null;
};
