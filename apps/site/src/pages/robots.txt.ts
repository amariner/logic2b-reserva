import type { APIRoute } from 'astro';
import { PRODUCT } from '@logic-reserva/config';

export const GET: APIRoute = () => new Response(
  `User-agent: *\nAllow: /\nDisallow: /demos/\nDisallow: /en/demos/\nSitemap: ${PRODUCT.url}/sitemap.xml\n`,
  { headers: { 'content-type': 'text/plain; charset=utf-8' } },
);
