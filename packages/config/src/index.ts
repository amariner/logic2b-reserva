export const PRODUCT = {
  name: 'Logic Reserva',
  lockup: 'Logic Reserva · by Logic2B',
  domain: 'reserva.logic2b.com',
  url: 'https://reserva.logic2b.com',
  email: 'hola@logic2b.com',
  locales: ['es', 'en'] as const,
  futureLocales: ['ca', 'fr'] as const,
  demoSlugs: ['brasca', 'vedra', 'solane'] as const,
};

export type Locale = (typeof PRODUCT.locales)[number];
export type DemoSlug = (typeof PRODUCT.demoSlugs)[number];

export const demoUrl = (slug: DemoSlug, locale: Locale = 'es') =>
  `${locale === 'en' ? '/en' : ''}/demos/${slug}/`;
