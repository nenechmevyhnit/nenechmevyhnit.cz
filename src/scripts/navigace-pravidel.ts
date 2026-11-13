import { inicializujDetail } from './detail';

/** Otevírání detailu pravidla bez načítání stránky (obdoba navigace.ts pro kauzy, bez osy a mapy). */
const TITULEK = 'Změny pravidel — Posuďte sami';
const mezipamet = new Map<string, { html: string; trida: string; titulek: string }>();
let zaviramZHistorie = false;

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

export async function otevriPravidlo(slug: string, { pridatDoHistorie = true } = {}): Promise<void> {
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
  if (pridatDoHistorie) history.pushState({ slug }, '', `/pravidla/${slug}/`);
  if (!dlg.open) dlg.showModal();
}

export function inicializujNavigaciPravidel(): void {
  const dlg = dialog();
  if (!dlg) return;
  const otevrena = document.body.dataset.otevrena;
  if (otevrena) {
    mezipamet.set(otevrena, { html: dlg.innerHTML, trida: dlg.className, titulek: document.title });
    inicializujDetail(dlg);
    vyber(otevrena);
    history.replaceState({ slug: otevrena }, '');
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
    // detail otevřený rovnou z adresy nemá kam vrátit fokus: vrátí se na řádek pravidla
    if ((document.activeElement === document.body || !document.activeElement) && slug) {
      document.querySelector<HTMLElement>(`.pr-radek[data-slug="${CSS.escape(slug)}"]:not([hidden]) a.pr-btn`)?.focus();
    }
    if (!zaviramZHistorie && location.pathname !== '/pravidla/') history.pushState({}, '', '/pravidla/');
    zaviramZHistorie = false;
    vyber(null);
  });
  dlg.addEventListener('click', e => {
    if (e.target === dlg || (e.target as HTMLElement).closest('.zavrit')) dlg.close();
  });

  addEventListener('popstate', e => {
    const slug = (e.state as { slug?: string } | null)?.slug;
    if (slug) { otevriPravidlo(slug, { pridatDoHistorie: false }); return; }
    if (dlg.open) { zaviramZHistorie = true; dlg.close(); }
  });
}
