import { inicializujDetail, ukazUdalost } from './detail';
import { aktualniPohled, nastavPohledPravidel, pohledZAdresy, vychoziPohled, adresaPohledu } from './osa-pravidel';

/** Otevírání detailu pravidla bez načítání stránky (obdoba navigace.ts pro kauzy, bez osy a mapy). */
const TITULEK = 'Změny pravidel — Nenechme vyhnít';
const mezipamet = new Map<string, { html: string; trida: string; titulek: string }>();
let zaviramZHistorie = false;

const udalostZAdresy = (): number | undefined => {
  const u = new URLSearchParams(location.search).get('udalost');
  return u !== null && /^\d+$/.test(u) ? Number(u) : undefined;
};

const dialog = () => document.getElementById('detail') as HTMLDialogElement | null;
const vyber = (slug: string | null) =>
  document.querySelectorAll<HTMLElement>('.pr-radek').forEach(r => r.classList.toggle('vybrany', r.dataset.slug === slug));

async function nacti(slug: string) {
  if (!mezipamet.has(slug)) {
    const odpoved = await fetch(`/pravidla/${slug}/`);
    if (!odpoved.ok) throw new Error(`Pravidlo ${slug} nenalezeno`);
    const doc = new DOMParser().parseFromString(await odpoved.text(), 'text/html');
    const d = doc.getElementById('detail')!;
    mezipamet.set(slug, { html: d.innerHTML, trida: d.className, titulek: doc.title });
  }
  return mezipamet.get(slug)!;
}

export async function otevriPravidlo(slug: string, { pridatDoHistorie = true, udalost }: { pridatDoHistorie?: boolean; udalost?: number } = {}): Promise<void> {
  const dlg = dialog();
  if (!dlg) return;
  if (dlg.dataset.slug !== slug) {
    let data;
    try { data = await nacti(slug); } catch { location.href = `/pravidla/${slug}/`; return; }
    dlg.innerHTML = data.html;
    dlg.className = data.trida;
    dlg.dataset.slug = slug;
    inicializujDetail(dlg);
    document.title = data.titulek;
  } else {
    document.title = mezipamet.get(slug)?.titulek ?? document.title;
  }
  vyber(slug);
  const naUdalosti = udalost !== undefined && ukazUdalost(dlg, udalost);
  // adresa nese i pohled na pozadí (jako ?pohled=mapa na hlavní stránce), aby se po zavření vrátila osa
  const dotaz = new URLSearchParams();
  if (naUdalosti) dotaz.set('udalost', String(udalost));
  const pohled = aktualniPohled();
  if (pohled !== vychoziPohled()) dotaz.set('pohled', pohled);
  const retezec = dotaz.toString();
  if (pridatDoHistorie) history.pushState({ slug, ...(naUdalosti ? { udalost } : {}) }, '', `/pravidla/${slug}/${retezec ? `?${retezec}` : ''}`);
  if (!dlg.open) dlg.showModal();
}

export function inicializujNavigaciPravidel(): void {
  const dlg = dialog();
  if (!dlg) return;
  const otevrena = document.body.dataset.otevrena;
  if (otevrena) {
    mezipamet.set(otevrena, { html: dlg.innerHTML, trida: dlg.className, titulek: document.title });
    inicializujDetail(dlg);
    const u = udalostZAdresy();
    const naUdalosti = u !== undefined && ukazUdalost(dlg, u);
    vyber(otevrena);
    history.replaceState({ slug: otevrena, ...(naUdalosti ? { udalost: u } : {}) }, '');
    // v HTML je dialog otevřený (kvůli návštěvníkům bez JavaScriptu); modálně ho jde otevřít jen zavřený
    dlg.removeAttribute('open');
    dlg.showModal();
  } else {
    history.replaceState({}, '');
  }

  document.querySelector('.pravidla-seznam')?.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.pr-btn');
    const me = e as MouseEvent;
    if (!a || me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
    e.preventDefault();
    otevriPravidlo(a.closest<HTMLElement>('.pr-radek')!.dataset.slug!);
  });

  dlg.addEventListener('close', () => {
    document.title = TITULEK;
    const slug = dlg.dataset.slug;
    delete document.body.dataset.otevrena;
    const naOse = aktualniPohled() === 'osa';
    // na ose se fokus vrací vždy na název řádku (bod mohl zmizet pod popiskem), v seznamu jen když fokus nikde není
    if (slug && (naOse || document.activeElement === document.body || !document.activeElement)) {
      const cil = naOse
        ? `.op-radek[data-slug="${CSS.escape(slug)}"]:not([hidden]) .op-nazev`
        : `.pr-radek[data-slug="${CSS.escape(slug)}"]:not([hidden]) a.pr-btn`;
      document.querySelector<HTMLElement>(cil)?.focus();
    }
    const zpet = adresaPohledu(aktualniPohled());
    if (!zaviramZHistorie && location.pathname + location.search !== zpet) history.pushState({}, '', zpet);
    zaviramZHistorie = false;
    vyber(null);
  });
  dlg.addEventListener('click', e => {
    if (e.target === dlg || (e.target as HTMLElement).closest('.zavrit')) dlg.close();
  });

  addEventListener('popstate', e => {
    const stav = e.state as { slug?: string; udalost?: number } | null;
    nastavPohledPravidel(pohledZAdresy());
    if (stav?.slug) { otevriPravidlo(stav.slug, { pridatDoHistorie: false, udalost: stav.udalost }); return; }
    if (dlg.open) { zaviramZHistorie = true; dlg.close(); }
  });
}
