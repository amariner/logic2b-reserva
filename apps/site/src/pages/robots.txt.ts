import type { APIRoute } from 'astro';
import { PRODUCT } from '@logic-reserva/config';

export const GET: APIRoute = () => new Response(
  `User-agent: *\nAllow: /\nDisallow: /demos/\nDisallow: /en/demos/\n\nSitemap: ${PRODUCT.url}/sitemap.xml\nHost: ${PRODUCT.domain}\n`,
  { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } },
);
