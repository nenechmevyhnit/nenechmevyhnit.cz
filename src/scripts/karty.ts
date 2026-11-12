export function inicializujKarty(): void {
  const dlg = document.querySelector<HTMLDialogElement>('.v4-dlg');
  if (!dlg) return;
  // Oddíl, který se nevejde, pokračuje ve sloupcích do strany: ukáže nápovědu a jde posouvat i klávesnicí.
  // Měří se až v dalším snímku: synchronní měření hned po přepnutí oddílu se slovníčky (mřížka rozdělená
  // do sloupců) Chrome zasekne.
  let snimek = 0;
  const overPreteceni = (naZacatek = false) => {
    cancelAnimationFrame(snimek);
    snimek = requestAnimationFrame(() => {
      const p = dlg.querySelector<HTMLElement>('.v4-dlg-panel:not([hidden])');
      const napoveda = p?.querySelector<HTMLElement>('.posun-napoveda');
      if (!p || !napoveda) return;
      if (naZacatek) p.scrollLeft = 0;
      const pretece = p.scrollWidth > p.clientWidth + 1;
      napoveda.hidden = !pretece;
      if (pretece) p.tabIndex = 0; else p.removeAttribute('tabindex');
    });
  };
  // Svislé kolečko myši nad modalem posouvá zobrazený oddíl do strany (text pokračuje ve sloupcích vedle sebe).
  // Vodorovný posun touchpadu a Ctrl + kolečko (přiblížení stránky) zůstávají prohlížeči.
  let cilPosunu = -1, konecPosunu = 0;
  dlg.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
    const p = dlg.querySelector<HTMLElement>('.v4-dlg-panel:not([hidden])');
    if (!p || p.scrollWidth <= p.clientWidth + 1) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * p.clientWidth : e.deltaY;
    const max = p.scrollWidth - p.clientWidth;
    // kolečko po zářezech jede plynule a rychlé zářezy se sčítají; jemné kroky touchpadu hned
    if (Math.abs(d) >= 50) {
      cilPosunu = Math.min(max, Math.max(0, (cilPosunu < 0 ? p.scrollLeft : cilPosunu) + d));
      clearTimeout(konecPosunu);
      konecPosunu = window.setTimeout(() => { cilPosunu = -1; }, 400);
      p.scrollTo({ left: cilPosunu, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    } else {
      cilPosunu = -1;
      p.scrollLeft += d;
    }
  }, { passive: false });
  addEventListener('resize', () => overPreteceni());
  document.fonts?.ready.then(() => overPreteceni());
  const ukaz = (id: string) => {
    dlg.querySelectorAll<HTMLElement>('.v4-dlg-panel').forEach(p => { p.hidden = p.dataset.sekce !== id; });
    cilPosunu = -1;
    overPreteceni(true);
    dlg.querySelectorAll<HTMLElement>('.v4-dlg-menu button').forEach(b => b.setAttribute('aria-current', String(b.dataset.sekce === id)));
    dlg.setAttribute('aria-labelledby', `v4-nadpis-${id}`);
  };
  document.querySelectorAll<HTMLElement>('.v4-karta button[data-sekce]').forEach(b => b.addEventListener('click', () => { ukaz(b.dataset.sekce!); dlg.showModal(); }));
  dlg.querySelectorAll<HTMLElement>('.v4-dlg-menu button').forEach(b => b.addEventListener('click', () => ukaz(b.dataset.sekce!)));
  dlg.querySelector('.zavrit')!.addEventListener('click', () => dlg.close());
  // přímý odkaz na část stránky, např. /metodika/#kriteria
  const cil = decodeURIComponent(location.hash.slice(1));
  if (cil && dlg.querySelector(`.v4-dlg-panel[data-sekce="${CSS.escape(cil)}"]`)) { ukaz(cil); dlg.showModal(); }
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  setTimeout(() => document.body.classList.add('nacteno'), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1600);
}
