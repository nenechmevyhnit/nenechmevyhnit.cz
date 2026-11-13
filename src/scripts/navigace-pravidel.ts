import { inicializujDetail, ukazUdalost } from './detail';
import { aktualniPohled, nastavPohledPravidel, pohledZAdresy, vychoziPohled, adresaPohledu } from './osa-pravidel';

/** Otevírání detailu pravidla nebo oblasti bez načítání stránky (obdoba navigace.ts pro kauzy).
 *  Klíč detailu je slug pravidla, nebo „oblasti/<id>“; adresa detailu je vždy /pravidla/<klíč>/. */
const TITULEK = 'Změny pravidel — Nenechme vyhnít';
const PREDPONA_OBLASTI = 'oblasti/';
const mezipamet = new Map<string, { html: string; trida: string; titulek: string }>();
let zaviramZHistorie = false;
type Volby = { pridatDoHistorie?: boolean; udalost?: number };

const jeOblast = (klic: string) => klic.startsWith(PREDPONA_OBLASTI);
const udalostZAdresy = (): number | undefined => {
  const u = new URLSearchParams(location.search).get('udalost');
  return u !== null && /^\d+$/.test(u) ? Number(u) : undefined;
};
const dialog = () => document.getElementById('detail') as HTMLDialogElement | null;
const vyber = (klic: string | null) => {
  document.querySelectorAll<HTMLElement>('.pr-radek').forEach(r => r.classList.toggle('vybrany', r.dataset.slug === klic));
  document.querySelectorAll<HTMLElement>('.ob-karta').forEach(k => k.classList.toggle('vybrana', klic === PREDPONA_OBLASTI + k.dataset.oblast));
};
const bezModifikatoru = (e: Event) => {
  const me = e as MouseEvent;
  return !(me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0);
};

async function nacti(klic: string) {
  if (!mezipamet.has(klic)) {
    const odpoved = await fetch(`/pravidla/${klic}/`);
    if (!odpoved.ok) throw new Error(`Detail ${klic} nenalezen`);
    const doc = new DOMParser().parseFromString(await odpoved.text(), 'text/html');
    const d = doc.getElementById('detail')!;
    mezipamet.set(klic, { html: d.innerHTML, trida: d.className, titulek: doc.title });
  }
  return mezipamet.get(klic)!;
}

async function otevri(klic: string, { pridatDoHistorie = true, udalost }: Volby = {}): Promise<void> {
  const dlg = dialog();
  if (!dlg) return;
  if (dlg.dataset.slug !== klic) {
    let data;
    try { data = await nacti(klic); } catch { location.href = `/pravidla/${klic}/`; return; }
    dlg.innerHTML = data.html;
    dlg.className = data.trida;
    dlg.dataset.slug = klic;
    inicializujDetail(dlg);
    document.title = data.titulek;
  } else {
    document.title = mezipamet.get(klic)?.titulek ?? document.title;
  }
  vyber(klic);
  const naUdalosti = udalost !== undefined && ukazUdalost(dlg, udalost);
  // adresa nese i pohled na pozadí, aby se po zavření vrátil (výchozí pohled parametr nemá)
  const dotaz = new URLSearchParams();
  if (naUdalosti) dotaz.set('udalost', String(udalost));
  const pohled = aktualniPohled();
  if (pohled !== vychoziPohled()) dotaz.set('pohled', pohled);
  const retezec = dotaz.toString();
  if (pridatDoHistorie) history.pushState({ slug: klic, ...(naUdalosti ? { udalost } : {}) }, '', `/pravidla/${klic}/${retezec ? `?${retezec}` : ''}`);
  if (!dlg.open) dlg.showModal();
}

export const otevriPravidlo = (slug: string, volby: Volby = {}): Promise<void> => otevri(slug, volby);
export const otevriOblast = (id: string, volby: Volby = {}): Promise<void> => otevri(PREDPONA_OBLASTI + id, volby);

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
    if (!a || !bezModifikatoru(e)) return;
    e.preventDefault();
    otevriPravidlo(a.closest<HTMLElement>('.pr-radek')!.dataset.slug!);
  });
  document.querySelector('.ob-karty')?.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.ob-btn');
    if (!a || !bezModifikatoru(e)) return;
    e.preventDefault();
    otevriOblast(a.closest<HTMLElement>('.ob-karta')!.dataset.oblast!);
  });
  // odkazy uvnitř detailu: z oblasti na rozbor změny (i rovnou na její zdroj), z detailu pravidla na oblast
  dlg.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-pravidlo], a[data-oblast-odkaz]');
    if (!a || !bezModifikatoru(e)) return;
    e.preventDefault();
    if (a.dataset.oblastOdkaz) { otevriOblast(a.dataset.oblastOdkaz); return; }
    const zdroj = a.dataset.zdrojZmeny;
    otevriPravidlo(a.dataset.pravidlo!).then(() => {
      if (zdroj) dlg.querySelector<HTMLElement>(`a[data-zdroj="${CSS.escape(zdroj)}"]`)?.click();
    });
  });

  dlg.addEventListener('close', () => {
    document.title = TITULEK;
    const klic = dlg.dataset.slug;
    delete document.body.dataset.otevrena;
    const pohled = aktualniPohled();
    // na ose a u oblasti se fokus vrací na řádek nebo kartu vždy, v seznamu jen když fokus nikde není
    if (klic && (pohled === 'osa' || jeOblast(klic) || document.activeElement === document.body || !document.activeElement)) {
      const cil = jeOblast(klic)
        ? `.ob-karta[data-oblast="${CSS.escape(klic.slice(PREDPONA_OBLASTI.length))}"]:not([hidden]) a.ob-btn`
        : pohled === 'osa'
          ? `.op-radek[data-slug="${CSS.escape(klic)}"]:not([hidden]) .op-nazev`
          : `.pr-radek[data-slug="${CSS.escape(klic)}"]:not([hidden]) a.pr-btn`;
      document.querySelector<HTMLElement>(cil)?.focus();
    }
    const zpet = adresaPohledu(pohled);
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
    if (stav?.slug) { otevri(stav.slug, { pridatDoHistorie: false, udalost: stav.udalost }); return; }
    if (dlg.open) { zaviramZHistorie = true; dlg.close(); }
  });
}
