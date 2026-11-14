import { vybranyKlub } from '../lib/hlasovani';

/** Filtr klubu na stránce hlasování (spec hlasování, oddíl 7). Vybraný klub nese kotva adresy (#ano). Přepnutí ji mění
 *  přes replaceState, takže odkaz jde sdílet a Zpět vede na předchozí stránku. Bez skriptu jsou vidět oddíly všech klubů. */
export function inicializujFiltrHlasovani(): void {
  const stranka = document.querySelector<HTMLElement>('.hl-stranka');
  if (!stranka) return;
  const sekce = [...stranka.querySelectorAll<HTMLElement>('.hl-klub')];
  const slugy = sekce.map(s => s.id);
  const vsichni = stranka.querySelector<HTMLElement>('.hl-vsichni');
  const seznam = stranka.querySelector<HTMLElement>('.hl-poslanci');
  const odkazy = [...stranka.querySelectorAll<HTMLAnchorElement>('a[data-klub]')];
  const nastav = (slug: string) => {
    if (vsichni) vsichni.hidden = slug !== '';
    sekce.forEach(s => { s.hidden = s.id !== slug; });
    odkazy.forEach(a => a.setAttribute('aria-current', String((a.dataset.klub ?? '') === slug)));
    if (seznam) seznam.scrollLeft = 0;
  };
  stranka.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-klub]');
    if (!a) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const slug = a.dataset.klub ?? '';
    history.replaceState(history.state, '', slug ? `#${slug}` : location.pathname + location.search);
    nastav(slug);
  });
  addEventListener('hashchange', () => nastav(vybranyKlub(location.hash, slugy)));
  nastav(vybranyKlub(location.hash, slugy));
}
