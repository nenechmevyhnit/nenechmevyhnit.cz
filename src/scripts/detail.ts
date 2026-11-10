export function inicializujDetail(dlg: HTMLDialogElement): void {
  const polozky = [...dlg.querySelectorAll<HTMLElement>('.udalosti-seznam > li')];
  if (!polozky.length) return;
  const panelChrono = dlg.querySelector<HTMLElement>('.m2-panel[data-p="chrono"]')!;
  const body = [...dlg.querySelectorAll<HTMLElement>('.mini-osa .bod')];
  const popis = dlg.querySelector<HTMLElement>('.vybrany-popis')!;
  const [zpet, dal] = dlg.querySelectorAll<HTMLButtonElement>('.listovani [data-krok]');
  let akt = polozky.length - 1;

  const prepni = (p: string) => {
    dlg.querySelectorAll<HTMLElement>('.zalozky [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.p === p)));
    dlg.querySelectorAll<HTMLElement>('.m2-panel').forEach(x => { x.hidden = x.dataset.p !== p; });
  };

  const ukaz = (i: number, smer = true) => {
    const pred = akt;
    akt = Math.max(0, Math.min(polozky.length - 1, i));
    if (!smer || akt === pred) delete panelChrono.dataset.smer; else panelChrono.dataset.smer = akt > pred ? 'vpred' : 'zpet';
    polozky.forEach((li, j) => { li.hidden = j !== akt; });
    body.forEach((b, j) => b.setAttribute('aria-current', String(j === akt)));
    popis.style.left = body[akt].style.left;
    popis.textContent = polozky[akt].querySelector('time')?.firstChild?.textContent ?? '';
    const nazev = (j: number) => polozky[j]?.querySelector('h3')?.textContent ?? '';
    zpet.disabled = akt === 0; dal.disabled = akt === polozky.length - 1;
    zpet.querySelector('span')!.textContent = akt > 0 ? nazev(akt - 1) : '';
    dal.querySelector('span')!.textContent = akt < polozky.length - 1 ? nazev(akt + 1) : '';
  };

  dlg.querySelector('.zalozky')!.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
    if (b) prepni(b.dataset.p!);
  });
  dlg.querySelector('.mini-osa')!.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.bod');
    if (b) { prepni('chrono'); ukaz(Number(b.dataset.i)); }
  });
  zpet.addEventListener('click', () => ukaz(akt - 1));
  dal.addEventListener('click', () => ukaz(akt + 1));
  dlg.addEventListener('keydown', e => {
    if (panelChrono.hidden) return;
    if (e.key === 'ArrowLeft') ukaz(akt - 1);
    if (e.key === 'ArrowRight') ukaz(akt + 1);
  });
  dlg.addEventListener('click', e => {
    // inicializujDetail běží při každém načtení kauzy do téhož <dialog>, posluchačů přibývá: kauzu otevřít jen jednou
    const jina = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-kauza]');
    if (jina) { e.preventDefault(); e.stopImmediatePropagation(); document.dispatchEvent(new CustomEvent('nv:otevri', { detail: jina.dataset.kauza })); return; }
    const naMapu = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-na-mapu]');
    if (naMapu) { e.preventDefault(); e.stopImmediatePropagation(); document.dispatchEvent(new CustomEvent('nv:na-mapu', { detail: naMapu.dataset.naMapu })); return; }
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-zdroj]');
    if (a) {
      e.preventDefault();
      prepni('zdroje');
      const cil = dlg.querySelector<HTMLElement>(`#zdroj-${a.dataset.zdroj}`);
      if (cil) { cil.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); cil.classList.add('blik'); setTimeout(() => cil.classList.remove('blik'), 1600); }
      return;
    }
    const s = (e.target as HTMLElement).closest<HTMLElement>('[data-sdilet]');
    if (s) { e.preventDefault(); navigator.clipboard?.writeText(location.href); s.textContent = 'Odkaz zkopírován ✓'; }
  });
  ukaz(akt, false);
}
