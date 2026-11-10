const graf = () => document.getElementById('graf') as HTMLElement | null;

/** Zvýrazní kauzu na ose: pásmo přes celý graf a popisky od/do. null = zrušit výběr. */
export function vyberKauzu(slug: string | null): void {
  const g = graf();
  if (!g) return;
  g.querySelectorAll<HTMLElement>('.radek').forEach(r => r.classList.toggle('vybrany', r.dataset.slug === slug));
  const radek = slug ? g.querySelector<HTMLElement>(`.radek[data-slug="${CSS.escape(slug)}"]`) : null;
  if (!radek) { g.removeAttribute('data-vybrano'); return; }
  const prvni = !g.dataset.vybrano;
  g.dataset.vybrano = slug!;
  const od = Number(radek.dataset.od) / 100, doo = Number(radek.dataset.do) / 100;
  const otevrena = radek.dataset.otevrena === 'ano';
  const pasmo = g.querySelector<HTMLElement>('.pasmo')!;
  pasmo.style.setProperty('--od', String(od));
  pasmo.style.setProperty('--delka', String(Math.max(doo - od, 0.004)));
  pasmo.classList.toggle('otevrena', otevrena);
  const p1 = g.querySelector<HTMLElement>('.pilulka.od')!, p2 = g.querySelector<HTMLElement>('.pilulka.do')!;
  p1.style.setProperty('--x', String(od)); p1.textContent = radek.dataset.odRok ?? '';
  p2.style.setProperty('--x', String(doo)); p2.textContent = radek.dataset.doRok ?? '';
  p2.classList.toggle('otevrena', otevrena);
  p2.style.display = radek.dataset.odRok === radek.dataset.doRok ? 'none' : '';
  if (prvni) [pasmo, p1, p2].forEach(el => { el.classList.remove('animuj'); void el.offsetWidth; el.classList.add('animuj'); });
}

export function inicializujOsu(): void {
  const sPohybem = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => document.body.classList.add('nacteno'), sPohybem ? 2200 : 0);
}
