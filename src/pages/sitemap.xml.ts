import type { APIRoute } from 'astro';
import { adresy, sitemapaXml } from '../lib/sitemap';

export const GET: APIRoute = () => new Response(sitemapaXml(adresy()), {
  headers: { 'content-type': 'application/xml; charset=utf-8' },
});
