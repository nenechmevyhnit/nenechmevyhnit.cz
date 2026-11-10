import { inicializujDetail } from './detail';
import { vyberKauzu } from './osa';

const mezipamet = new Map<string, { html: string; trida: string; titulek: string }>();
const TITULEK_HLAVNI = 'Nenechme vyhnít — kauzy Andreje Babiše';
let zaviramZHistorie = false;

const dialog = () => document.getElementById('detail') as HTMLDialogElement;

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
  if (pridatDoHistorie) history.pushState({ slug }, '', `/kauzy/${slug}/`);
  if (!dlg.open) dlg.showModal();
}

export function zavriDetail({ pridatDoHistorie = true } = {}): void {
  const dlg = dialog();
  zaviramZHistorie = !pridatDoHistorie;
  if (dlg.open) dlg.close();
  else if (pridatDoHistorie && location.pathname !== '/') history.pushState({}, '', '/');
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
    if (!zaviramZHistorie && location.pathname !== '/') history.pushState({}, '', '/');
    zaviramZHistorie = false;
  });
  dlg.addEventListener('click', e => {
    if (e.target === dlg || (e.target as HTMLElement).closest('.zavrit')) dlg.close();
  });

  addEventListener('popstate', e => {
    const slug = (e.state as { slug?: string } | null)?.slug;
    if (slug) otevriDetail(slug, { pridatDoHistorie: false });
    else zavriDetail({ pridatDoHistorie: false });
  });
}
