import type { MiddlewareHandler } from 'astro';
import { vlnkyVHtml } from './lib/cestina';

/** Každá stránka projde českou sazbou: jednopísmenné předložky a spojky nezůstanou na konci řádku.
 *  Při sestavení webu se to stane jednou, za běhu statického webu už se nic nepřepočítává. */
export const onRequest: MiddlewareHandler = async (_kontext, dalsi) => {
  const odpoved = await dalsi();
  if (!odpoved.headers.get('content-type')?.includes('text/html')) return odpoved;
  const html = vlnkyVHtml(await odpoved.text());
  return new Response(html, { status: odpoved.status, statusText: odpoved.statusText, headers: odpoved.headers });
};
