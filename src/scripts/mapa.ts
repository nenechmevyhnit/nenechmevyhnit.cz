import { rozlozMapu, viditelneUzly, zvyrazneni, idKauzy, type Graf } from '../lib/mapa';
import { svgMapy } from '../lib/mapa-html';
import { viditelneKauzy } from './stav-filtru';
import { vyberKauzu } from './osa';

const mobil = () => matchMedia('(max-width: 760px)').matches;

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
  const panel = obal.querySelector<HTMLElement>('.mapa-panel')!;
  const panelNadpis = panel.querySelector<HTMLElement>('.mapa-panel-nadpis')!;
  const panelObsah = panel.querySelector<HTMLElement>('.mapa-panel-obsah')!;
  const hrany = new Map(grafMapy.hrany.map(h => [h.id, h]));
  const uzly = new Map(grafMapy.uzly.map(u => [u.id, u]));
  let vybrano: string | null = g.dataset.vybrano ? idKauzy(g.dataset.vybrano) : null;
  let otvirac: HTMLElement | null = null;

  const zvyrazni = (id: string | null) => {
    const z = id ? zvyrazneni(grafMapy, id) : null;
    svg.classList.toggle('ztlumeno', z !== null);
    svg.querySelectorAll<SVGElement>('[data-uzel]').forEach(el => el.classList.toggle('zvyrazneno', !!z?.uzly.has(el.dataset.uzel!)));
    svg.querySelectorAll<SVGElement>('[data-hrana]').forEach(el => el.classList.toggle('zvyrazneno', !!z?.hrany.has(el.dataset.hrana!)));
  };
  const nadpisHrany = (id: string) => {
    const h = hrany.get(id)!;
    const r = uzly.get(h.rodic)!.nazev, p = uzly.get(h.potomek)!.nazev;
    return h.druh === 'navaznost' ? `${p} → ${r}` : `${r} → ${p}`;
  };
  const hlavniHrana = (uzel: string) => strom.querySelector<HTMLElement>(`li[data-uzel="${CSS.escape(uzel)}"][data-hlavni]`)?.dataset.hrana;
  const zavriPanel = (vratitFokus = true) => {
    if (panel.hidden) return;
    panel.hidden = true;
    if (vratitFokus) otvirac?.focus();
    otvirac = null;
  };
  /** Panel s vysvětlením vazby u uzlu. Obsah je kopie skrytého .s-vazba ze stromu. */
  const otevriPanel = (hrana: string, odkud: HTMLElement | null) => {
    const zdroj = document.getElementById(`s-vazba-${hrana}`);
    if (!zdroj) return;
    panelNadpis.textContent = nadpisHrany(hrana);
    panelObsah.innerHTML = zdroj.innerHTML;
    const kotva = svg.querySelector(`[data-uzel="${CSS.escape(hrany.get(hrana)!.potomek)}"]`);
    if (kotva) {
      const r = kotva.getBoundingClientRect(), o = obal.getBoundingClientRect();
      panel.style.left = `${Math.max(8, Math.min(r.right - o.left + obal.scrollLeft + 8, obal.scrollWidth - 316))}px`;
      panel.style.top = `${r.top - o.top + obal.scrollTop}px`;
    }
    panel.hidden = false;
    otvirac = odkud;
    panel.querySelector<HTMLElement>('.mapa-panel-zavrit')!.focus();
  };
  const prepni = (b: HTMLButtonElement) => {
    const cil = document.getElementById(b.getAttribute('aria-controls')!);
    if (!cil) return;
    const otevrit = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(otevrit));
    cil.hidden = !otevrit;
  };
  const otevriKauzu = (slug: string) => document.dispatchEvent(new CustomEvent('nv:otevri', { detail: slug }));

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
    zavriPanel(false);
    zvyrazni(vybrano && vid.has(vybrano) ? vybrano : null);
  };

  document.querySelectorAll<HTMLButtonElement>('.pohled button').forEach(b =>
    b.addEventListener('click', () => nastavPohled(b.dataset.pohled as Pohled)));
  addEventListener('popstate', () => nastavPohled(pohledZAdresy(), { zapsat: false }));
  document.addEventListener('nv:filtr', prekresli);
  obal.addEventListener('click', e => {
    const t = e.target as Element;
    if (t.closest('.mapa-panel-zavrit')) { zavriPanel(); return; }
    const uzel = t.closest<SVGGElement>('.mapa-svg [data-uzel]');
    if (uzel) {
      const id = uzel.dataset.uzel!;
      if (id.startsWith('k:')) otevriKauzu(id.slice(2));
      else { const h = hlavniHrana(id); if (h) otevriPanel(h, null); }
      return;
    }
    const cara = t.closest<SVGGElement>('.mapa-svg .m-cara');
    if (cara) { if (hrany.get(cara.dataset.hrana!)?.popis) otevriPanel(cara.dataset.hrana!, null); return; }
    const odkaz = t.closest<HTMLAnchorElement>('.strom a[data-slug]');
    if (odkaz) {
      const me = e as MouseEvent;
      if (me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
      e.preventDefault();
      otevriKauzu(odkaz.dataset.slug!);
      return;
    }
    const tlacitko = t.closest<HTMLButtonElement>('.strom .s-info, .strom .s-akter');
    const nositel = tlacitko?.closest<HTMLElement>('[data-hrana]');
    if (!tlacitko || !nositel) return;
    if (!mobil()) { otevriPanel(nositel.dataset.hrana!, tlacitko); return; }
    // mobil: jméno aktéra rozbaluje větev, ⓘ (nebo jméno aktéra bez větve) ukáže vysvětlení pod řádkem
    if (tlacitko.classList.contains('s-akter') && tlacitko.hasAttribute('aria-expanded')) { prepni(tlacitko); return; }
    const i = tlacitko.classList.contains('s-info') ? tlacitko : nositel.querySelector<HTMLButtonElement>(':scope > .s-radek .s-info');
    if (i) prepni(i);
  });
  obal.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); e.stopPropagation(); zavriPanel(); }
  });
  obal.addEventListener('pointerover', e => {
    const u = (e.target as Element).closest<SVGGElement>('.mapa-svg [data-uzel]');
    if (u) zvyrazni(u.dataset.uzel!);
  });
  obal.addEventListener('pointerout', e => {
    if ((e.target as Element).closest('.mapa-svg [data-uzel]')) zvyrazni(vybrano);
  });
  strom.addEventListener('focusin', e => {
    const li = (e.target as Element).closest<HTMLElement>('li[data-uzel]');
    svg.querySelectorAll('.fokus').forEach(x => x.classList.remove('fokus'));
    if (!li) return;
    zvyrazni(li.dataset.uzel!);
    const u = svg.querySelector<SVGGElement>(`[data-uzel="${CSS.escape(li.dataset.uzel!)}"]`);
    if (u && !mobil()) { u.classList.add('fokus'); u.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  });
  strom.addEventListener('focusout', () => {
    svg.querySelectorAll('.fokus').forEach(x => x.classList.remove('fokus'));
    zvyrazni(vybrano);
  });
  document.addEventListener('nv:vyber', e => {
    const slug = (e as CustomEvent<string | null>).detail;
    vybrano = slug ? idKauzy(slug) : null;
    zvyrazni(vybrano);
  });

  /** Na mobilu rozbalení jen přímí aktéři, na počítači vše (strom tam slouží klávesnici a čtečkám). */
  const nastavRozbaleni = () => strom.querySelectorAll<HTMLButtonElement>('.s-akter[aria-expanded]').forEach(b => {
    const otevrit = !mobil() || Number(b.closest<HTMLElement>('li')!.dataset.hloubka) <= 1;
    b.setAttribute('aria-expanded', String(otevrit));
    document.getElementById(b.getAttribute('aria-controls')!)!.hidden = !otevrit;
  });
  matchMedia('(max-width: 760px)').addEventListener('change', nastavRozbaleni);
  nastavRozbaleni();

  nastavPohled(pohledZAdresy(), { zapsat: false });
  prekresli();
  const vyber = new URLSearchParams(location.search).get('vyber');
  if (vyber && uzly.has(idKauzy(vyber))) vyberKauzu(vyber);
}
