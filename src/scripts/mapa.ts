import { rozlozMapu, viditelneUzly, type Graf } from '../lib/mapa';
import { svgMapy } from '../lib/mapa-html';
import { viditelneKauzy } from './stav-filtru';

export type Pohled = 'osa' | 'mapa';
const graf = () => document.getElementById('graf');

export const pohledZAdresy = (): Pohled => (new URLSearchParams(location.search).get('pohled') === 'mapa' ? 'mapa' : 'osa');

/** Přepne osu a mapu. Adresu mění bez nového záznamu v historii. */
export function nastavPohled(p: Pohled, { zapsat = true } = {}): void {
  const g = graf();
  if (!g?.querySelector('.mapa')) return;
  const proved = () => {
    g.dataset.pohled = p;
    document.querySelectorAll<HTMLButtonElement>('.pohled button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pohled === p)));
    document.dispatchEvent(new CustomEvent('nv:pohled', { detail: p }));
  };
  const sPohybem = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && sPohybem && document.body.classList.contains('nacteno') && g.dataset.pohled !== p) {
    const t = document.startViewTransition(proved);
    [t.ready, t.finished, t.updateCallbackDone].forEach(x => x.catch(() => {}));
  } else proved();
  if (zapsat) {
    const url = new URL(location.href);
    if (p === 'mapa') url.searchParams.set('pohled', 'mapa'); else url.searchParams.delete('pohled');
    url.searchParams.delete('vyber');
    history.replaceState(history.state, '', url.pathname + url.search);
  }
}

export function inicializujMapu(): void {
  const g = graf();
  const obal = g?.querySelector<HTMLElement>('.mapa');
  const data = document.getElementById('nv-mapa');
  if (!g || !obal || !data) return;
  const grafMapy: Graf = JSON.parse(data.textContent || '{}');
  const strom = obal.querySelector<HTMLElement>('.strom')!;
  const prazdno = obal.querySelector<HTMLElement>('.mapa-prazdno')!;
  let svg = obal.querySelector<SVGSVGElement>('.mapa-svg')!;

  /** Překreslí SVG podle výsledku filtrů a ve stromu skryje, co na mapě není. */
  const prekresli = () => {
    const kauzy = viditelneKauzy();
    const vid = viditelneUzly(grafMapy, kauzy);
    const docasny = document.createElement('div');
    docasny.innerHTML = svgMapy(rozlozMapu(grafMapy, kauzy));
    const novy = docasny.firstElementChild as SVGSVGElement;
    svg.replaceWith(novy);
    svg = novy;
    strom.querySelectorAll<HTMLElement>('li[data-uzel]').forEach(li => { li.hidden = !vid.has(li.dataset.uzel!); });
    prazdno.hidden = vid.size > 1;
  };

  document.querySelectorAll<HTMLButtonElement>('.pohled button').forEach(b =>
    b.addEventListener('click', () => nastavPohled(b.dataset.pohled as Pohled)));
  addEventListener('popstate', () => nastavPohled(pohledZAdresy(), { zapsat: false }));
  document.addEventListener('nv:filtr', prekresli);

  nastavPohled(pohledZAdresy(), { zapsat: false });
  prekresli();
}
