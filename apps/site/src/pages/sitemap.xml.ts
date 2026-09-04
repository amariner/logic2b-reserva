import type { APIRoute } from 'astro';
import { PRODUCT } from '@logic-reserva/config';
import { GUIDE_CATALOG } from '@logic-reserva/config/guides';
import { PANEL_CATALOG } from '@logic-reserva/config/panels';
import { THEME_CATALOG } from '@logic-reserva/config/themes';

const paths = [
  { es: '/', en: '/en/', priority: '1.0', changefreq: 'weekly' },
  { es: '/empezar/', en: '/en/empezar/', priority: '0.8', changefreq: 'monthly' },
  { es: '/temas/', en: '/en/temas/', priority: '0.9', changefreq: 'monthly' },
  ...THEME_CATALOG.map(({ slug }) => ({ es: `/temas/${slug}/`, en: `/en/temas/${slug}/`, priority: '0.8', changefreq: 'monthly' })),
  { es: '/paneles/', en: '/en/paneles/', priority: '0.9', changefreq: 'monthly' },
  ...PANEL_CATALOG.map(({ slug }) => ({ es: `/paneles/${slug}/`, en: `/en/paneles/${slug}/`, priority: '0.8', changefreq: 'monthly' })),
  { es: '/planes/', en: '/en/planes/', priority: '0.8', changefreq: 'monthly' },
  { es: '/docs/', en: '/en/docs/', priority: '0.8', changefreq: 'monthly' },
  ...GUIDE_CATALOG.map(({ slug }) => ({ es: `/docs/${slug}/`, en: `/en/docs/${slug}/`, priority: '0.7', changefreq: 'monthly' })),
  { es: '/soluciones/restaurantes/', en: '/en/soluciones/restaurantes/', priority: '0.9', changefreq: 'monthly' },
  { es: '/soluciones/grupos-y-eventos/', en: '/en/soluciones/grupos-y-eventos/', priority: '0.9', changefreq: 'monthly' },
  { es: '/legal/', en: '/en/legal/', priority: '0.2', changefreq: 'yearly' },
  { es: '/privacidad/', en: '/en/privacidad/', priority: '0.2', changefreq: 'yearly' },
  { es: '/cookies/', en: '/en/cookies/', priority: '0.2', changefreq: 'yearly' },
];

const lastmod = '2026-09-04';
const renderUrl = (path: string, alternate: string, locale: 'es' | 'en', priority: string, changefreq: string) => `<url>
  <loc>${new URL(path, PRODUCT.url).href}</loc>
  <xhtml:link rel="alternate" hreflang="${locale}" href="${new URL(path, PRODUCT.url).href}" />
  <xhtml:link rel="alternate" hreflang="${locale === 'es' ? 'en' : 'es'}" href="${new URL(alternate, PRODUCT.url).href}" />
  <xhtml:link rel="alternate" hreflang="x-default" href="${new URL(locale === 'es' ? path : alternate, PRODUCT.url).href}" />
  <lastmod>${lastmod}</lastmod>
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>
</url>`;

export const GET: APIRoute = () => {
  const urls = paths.flatMap((entry) => [
    renderUrl(entry.es, entry.en, 'es', entry.priority, entry.changefreq),
    renderUrl(entry.en, entry.es, 'en', entry.priority, entry.changefreq),
  ]).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
