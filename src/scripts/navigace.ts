import { inicializujDetail } from './detail';
import { vyberKauzu } from './osa';
import { nastavPohled, aktualniPohled } from './mapa';

const mezipamet = new Map<string, { html: string; trida: string; titulek: string }>();
const TITULEK_HLAVNI = 'Archiv kauz Andreje Babiše — Nenechme vyhnít';
let zaviramZHistorie = false;

const dialog = () => document.getElementById('detail') as HTMLDialogElement;
/** Detail otevřený z mapy si pohled pamatuje v adrese, aby se po zavření vrátil na mapu. */
const dotazPohledu = () => (aktualniPohled() === 'mapa' ? '?pohled=mapa' : '');

async function nactiDetail(slug: string) {
  if (!mezipamet.has(slug)) {
    const odpoved = await fetch(`/kauzy/${slug}/`);
    if (!odpoved.ok) throw new Error(`Kauza ${slug} nenalezena`);
    const doc = new DOMParser().parseFromString(await odpoved.text(), 'text/html');
    const d = doc.getElementById('detail')!;
    mezipamet.set(slug, { html: d.innerHTML, trida: d.className, titulek: doc.title });
  }
  return mezipamet.get(slug)!;
}

export async function otevriDetail(slug: string, { pridatDoHistorie = true } = {}): Promise<void> {
  const dlg = dialog();
  if (dlg.dataset.slug !== slug) {
    let data;
    try { data = await nactiDetail(slug); } catch { location.href = `/kauzy/${slug}/`; return; }
    dlg.innerHTML = data.html;
    dlg.className = data.trida;
    dlg.dataset.slug = slug;
    inicializujDetail(dlg);
    document.title = data.titulek;
  } else {
    document.title = mezipamet.get(slug)?.titulek ?? document.title;
  }
  vyberKauzu(slug);
  if (pridatDoHistorie) history.pushState({ slug }, '', `/kauzy/${slug}/${dotazPohledu()}`);
  if (!dlg.open) dlg.showModal();
}

export function zavriDetail({ pridatDoHistorie = true } = {}): void {
  const dlg = dialog();
  zaviramZHistorie = !pridatDoHistorie;
  if (dlg.open) dlg.close();
  else if (pridatDoHistorie && location.pathname !== '/') history.pushState({}, '', `/${dotazPohledu()}`);
}

export function inicializujNavigaci(): void {
  const dlg = dialog();
  if (!dlg) return;
  const otevrena = document.body.dataset.otevrena;
  if (otevrena) {
    mezipamet.set(otevrena, { html: dlg.innerHTML, trida: dlg.className, titulek: document.title });
    inicializujDetail(dlg);
    vyberKauzu(otevrena);
    history.replaceState({ slug: otevrena }, '');
    // v HTML je dialog otevřený (kvůli návštěvníkům bez JavaScriptu); modálně ho jde otevřít jen zavřený.
    // Odebrání atributu neposílá událost close, takže se adresa nemění.
    dlg.removeAttribute('open');
    dlg.showModal();
  } else {
    history.replaceState({}, '');
  }

  document.querySelector('#graf')?.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.radek-btn');
    const me = e as MouseEvent;
    if (!a || me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
    e.preventDefault();
    otevriDetail(a.closest<HTMLElement>('.radek')!.dataset.slug!);
  });

  dlg.addEventListener('close', () => {
    document.title = TITULEK_HLAVNI;
    // Detail otevřený rovnou z adresy nemá kam vrátit fokus (skončil by na <body>): vrátí se na řádek kauzy na ose.
    const slug = dlg.dataset.slug;
    delete document.body.dataset.otevrena;
    if ((document.activeElement === document.body || !document.activeElement) && slug && aktualniPohled() !== 'mapa') {
      document.querySelector<HTMLElement>(`#graf .radek[data-slug="${CSS.escape(slug)}"]:not([hidden]) a.radek-btn`)?.focus();
    }
    if (!zaviramZHistorie && location.pathname !== '/') history.pushState({}, '', `/${dotazPohledu()}`);
    zaviramZHistorie = false;
    // po zavření detailu nemá na ose zůstat pásmo a popisky od/do zavřené kauzy.
    // Na mapě (i po „Ukázat na mapě“, které přepne pohled ještě před zavřením) kauza zůstane zvýrazněná.
    if (aktualniPohled() !== 'mapa') vyberKauzu(null);
  });
  dlg.addEventListener('click', e => {
    if (e.target === dlg || (e.target as HTMLElement).closest('.zavrit')) dlg.close();
  });

  addEventListener('popstate', e => {
    const slug = (e.state as { slug?: string } | null)?.slug;
    if (slug) otevriDetail(slug, { pridatDoHistorie: false });
    else zavriDetail({ pridatDoHistorie: false });
  });

  // mapa a odkazy mezi kauzami v detailu otevírají kauzu stejnou cestou jako osa
  document.addEventListener('nv:otevri', e => { otevriDetail((e as CustomEvent<string>).detail); });
  // „Ukázat na mapě“ z detailu: přepnout na mapu, zavřít detail (adresa /?pohled=mapa) a nechat kauzu vybranou
  document.addEventListener('nv:na-mapu', e => {
    const slug = (e as CustomEvent<string>).detail;
    nastavPohled('mapa', { zapsat: false });
    zavriDetail();
    vyberKauzu(slug);
  });
}
