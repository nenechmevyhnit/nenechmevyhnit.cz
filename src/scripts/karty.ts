export function inicializujKarty(): void {
  const dlg = document.querySelector<HTMLDialogElement>('.v4-dlg');
  if (!dlg) return;
  const ukaz = (id: string) => {
    dlg.querySelectorAll<HTMLElement>('.v4-dlg-panel').forEach(p => { p.hidden = p.dataset.sekce !== id; });
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
