import type { APIRoute } from 'astro';
import { PRODUCT } from '@logic-reserva/config';

const paths = [
  '/', '/planes/', '/soluciones/restaurantes/', '/soluciones/grupos-y-eventos/', '/legal/', '/privacidad/', '/cookies/',
  '/en/', '/en/planes/', '/en/soluciones/restaurantes/', '/en/soluciones/grupos-y-eventos/', '/en/legal/', '/en/privacidad/', '/en/cookies/',
] as const;

export const GET: APIRoute = () => {
  const urls = paths.map((path) => `<url><loc>${new URL(path, PRODUCT.url).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
