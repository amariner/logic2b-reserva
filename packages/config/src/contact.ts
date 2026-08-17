import type { Locale } from './index';

const PHONE = '+34 626 432 316';
const WA = '34626432316';

export function logic2bContact(locale: Locale, context: 'commercial' | 'docs' | 'demo' | 'dashboard') {
  const labels = locale === 'en'
    ? { commercial: 'Talk to Logic2B', docs: 'Ask Logic2B', demo: 'Logic2B · Contact', dashboard: 'Logic2B help' }
    : { commercial: 'Habla con Logic2B', docs: 'Pregunta a Logic2B', demo: 'Logic2B · Contacta', dashboard: 'Ayuda Logic2B' };
  const message = locale === 'en'
    ? `Hello Logic2B, I would like to know more about Logic Reserva (${context}).`
    : `Hola Logic2B, quiero conocer mejor Logic Reserva (${context}).`;
  return { phone: PHONE, label: labels[context], href: `https://wa.me/${WA}?text=${encodeURIComponent(message)}` };
}
