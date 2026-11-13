import { otevriPravidlo } from './navigace-pravidel';

/** Přepínání Seznam · Časová osa, popisky bodů a posun osy na „dnes“ (spec osy pravidel, oddíl 2, 5 a 6). */
export type Pohled = 'seznam' | 'osa';

export const aktualniPohled = (): Pohled => (document.body.dataset.pohledPravidel === 'osa' ? 'osa' : 'seznam');

let nastavPohled: ((p: Pohled, zapsat: boolean) => void) | null = null;
export const pohledZAdresy = (): Pohled => (new URLSearchParams(location.search).get('pohled') === 'osa' ? 'osa' : 'seznam');
/** Zobrazí seznam nebo osu (Zpět a Vpřed v prohlížeči: pohled se řídí adresou, nezapisuje se do ní). */
export function nastavPohledPravidel(p: Pohled, { zapsat = false }: { zapsat?: boolean } = {}): void { nastavPohled?.(p, zapsat); }

export function inicializujOsuPravidel(): void {
  const osa = document.querySelector<HTMLElement>('[data-osa-pravidel]');
  const prepinac = document.querySelector<HTMLElement>('.pr-pohled');
  const seznam = document.querySelector<HTMLElement>('.pravidla-obal');
  if (!osa || !prepinac || !seznam) return;
  const plocha = osa.querySelector<HTMLElement>('.op-plocha')!;
  const popisek = osa.querySelector<HTMLElement>('.op-popisek')!;
  prepinac.hidden = false;

  const nastav = (p: Pohled, zapsat: boolean) => {
    document.body.dataset.pohledPravidel = p;
    osa.hidden = p !== 'osa';
    seznam.hidden = p === 'osa';
    prepinac.querySelectorAll<HTMLButtonElement>('[data-pohled]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pohled === p)));
    if (zapsat && location.pathname === '/pravidla/') history.replaceState(history.state, '', p === 'osa' ? '/pravidla/?pohled=osa' : '/pravidla/');
    if (p === 'osa') requestAnimationFrame(posunNaDnes);
    document.dispatchEvent(new CustomEvent('nv:pohled-pravidel', { detail: p }));
  };
  const posunNaDnes = () => {
    if (plocha.scrollWidth <= plocha.clientWidth) return;
    const dnes = osa.querySelector<HTMLElement>('.op-radek .op-dnes, .op-hlava .op-dnes-popisek');
    if (!dnes) return;
    const r = dnes.getBoundingClientRect(), p = plocha.getBoundingClientRect();
    plocha.scrollLeft += r.left - p.left - plocha.clientWidth / 2;
  };

  nastavPohled = nastav;
  prepinac.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pohled]');
    if (b) nastav(b.dataset.pohled as Pohled, true);
  });
  nastav(pohledZAdresy(), false);

  // popisek bodu: jeden prvek s position: fixed, aby ho neořízla posouvaná plocha
  const ukazPopisek = (el: HTMLElement) => {
    const text = el.dataset.popisek;
    if (!text) return;
    popisek.textContent = text;
    popisek.hidden = false;
    const r = el.getBoundingClientRect(), w = popisek.offsetWidth, h = popisek.offsetHeight;
    const left = Math.min(Math.max(4, r.left + r.width / 2 - w / 2), innerWidth - w - 4);
    const top = r.top - h - 6 >= 4 ? r.top - h - 6 : r.bottom + 6;
    popisek.style.left = `${left}px`;
    popisek.style.top = `${top}px`;
  };
  let casovac = 0;
  const zrusCasovac = () => { clearTimeout(casovac); casovac = 0; };
  const skryjPopisek = () => { zrusCasovac(); popisek.hidden = true; };
  // hoverable (WCAG 1.4.13): po opuštění bodu zůstane popisek krátce, aby na něj šlo najet
  const skryjPozdeji = () => { zrusCasovac(); casovac = window.setTimeout(skryjPopisek, 150); };
  const bod = (t: EventTarget | null) => (t as HTMLElement | null)?.closest<HTMLElement>('.op-bod[data-popisek]') ?? null;
  osa.addEventListener('pointerover', e => {
    const b = bod(e.target);
    if (b) { zrusCasovac(); ukazPopisek(b); } else if ((e.target as HTMLElement).closest('.op-popisek')) zrusCasovac();
  });
  osa.addEventListener('pointerout', e => {
    const t = e.target as HTMLElement;
    if (!bod(t) && !t.closest('.op-popisek')) return;
    const kam = e.relatedTarget as HTMLElement | null;
    if (kam && (kam.closest('.op-popisek') || bod(kam))) return;
    skryjPozdeji();
  });
  osa.addEventListener('focusin', e => { const b = bod(e.target); if (b) ukazPopisek(b); else skryjPopisek(); });
  osa.addEventListener('focusout', skryjPopisek);
  osa.addEventListener('keydown', e => { if (e.key === 'Escape') skryjPopisek(); });
  // posun způsobený fokusem na bod popisek jen přesune, ruční posun ho skryje
  plocha.addEventListener('scroll', () => {
    const b = bod(document.activeElement);
    if (b && !popisek.hidden) ukazPopisek(b); else skryjPopisek();
  }, { passive: true });

  osa.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.op-bod, a.op-drive, a.op-nazev');
    const me = e as MouseEvent;
    if (!a || me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
    e.preventDefault();
    skryjPopisek();
    const slug = a.closest<HTMLElement>('.op-radek')!.dataset.slug!;
    const u = a.dataset.udalost;
    otevriPravidlo(slug, u !== undefined ? { udalost: Number(u) } : {});
  });
}
