/** Rozměry závislé na šířce okna (tlačítko „celé shrnutí“, vytrácení záložek) přepočítá naposledy otevřená kauza. */
let premerAktualni: (() => void) | null = null;
const sPosluchaci = new WeakSet<HTMLDialogElement>();

/** Posluchače na samotném <dialog> přidat jen jednou: inicializujDetail běží při každém načtení kauzy do téhož prvku. */
function jednouNaDialog(dlg: HTMLDialogElement): void {
  if (sPosluchaci.has(dlg)) return;
  sPosluchaci.add(dlg);
  addEventListener('resize', () => premerAktualni?.());
  // Obsah, který pokračuje ve sloupcích do strany (Souvislosti, Zdroje, delší události), jde posouvat i obyčejným
  // kolečkem myši. Touchpad posouvá do strany sám (deltaX), Ctrl + kolečko zůstává prohlížeči na zvětšení.
  dlg.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    let el = e.target as HTMLElement | null;
    while (el && el !== dlg) {
      const cs = getComputedStyle(el);
      if (el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(cs.overflowY)) return; // posouvá se svisle sám
      if (el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(cs.overflowX)) {
        const krok = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        const max = el.scrollWidth - el.clientWidth;
        if ((krok < 0 && el.scrollLeft <= 0) || (krok > 0 && el.scrollLeft >= max - 1)) return;
        e.preventDefault();
        el.scrollLeft += krok;
        return;
      }
      el = el.parentElement;
    }
  }, { passive: false });
}

/** Zobrazení události zvenku (osa pravidel, adresa ?udalost=): inicializujDetail sem uloží funkci pro aktuální obsah. */
const ukazovace = new WeakMap<HTMLDialogElement, (i: number) => boolean>();
export function ukazUdalost(dlg: HTMLDialogElement, i: number): boolean {
  return ukazovace.get(dlg)?.(i) ?? false;
}

export function inicializujDetail(dlg: HTMLDialogElement): void {
  ukazovace.delete(dlg); // zastaralá funkce z předchozího obsahu, kdyby nový detail žádné události neměl
  const lista = dlg.querySelector<HTMLElement>('.zalozky');
  if (!lista) return; // prázdný dialog: přehled bez otevřeného detailu
  jednouNaDialog(dlg);
  // detail oblasti nemá události ani průběh: části pro průběh se přeskočí
  const polozky = [...dlg.querySelectorAll<HTMLElement>('.udalosti-seznam > li')];
  const panelChrono = dlg.querySelector<HTMLElement>('.m2-panel[data-p="chrono"]');
  const body = [...dlg.querySelectorAll<HTMLElement>('.mini-osa .bod')];
  const popis = dlg.querySelector<HTMLElement>('.vybrany-popis');
  const [zpet, dal] = dlg.querySelectorAll<HTMLButtonElement>('.listovani [data-krok]');
  const hlava = dlg.querySelector<HTMLElement>('.m2-hlava')!;
  const perex = hlava.querySelector<HTMLElement>('.perex');
  const vice = hlava.querySelector<HTMLButtonElement>('.perex-vice');
  const proVasObal = hlava.querySelector<HTMLElement>('.pro-vas-obal');
  const proVas = proVasObal?.querySelector<HTMLElement>('.pro-vas');
  const proVasVice = proVasObal?.querySelector<HTMLButtonElement>('.pro-vas-vice');
  let akt = polozky.length - 1;

  /** Záložky, které se nevejdou, se posouvají do strany; okraj, za kterým pokračují, se vytrácí. */
  const okrajeLisy = () => {
    const max = lista.scrollWidth - lista.clientWidth;
    lista.classList.toggle('mizi-vlevo', lista.scrollLeft > 2);
    lista.classList.toggle('mizi-vpravo', lista.scrollLeft < max - 2);
  };
  /** Tlačítko „celé shrnutí“ jen tehdy, když je shrnutí zkrácené (na mobilu na tři řádky). */
  const zmerPerex = () => {
    if (perex && vice && !hlava.classList.contains('rozbalene')) vice.hidden = perex.scrollHeight <= perex.clientHeight + 1;
  };
  /** Tlačítko „celý text“ u „Co by to znamenalo pro vás“ jen tehdy, když je text na nízkém okně zkrácený na jeden řádek. */
  const zmerProVas = () => {
    if (proVas && proVasVice && proVasObal && !proVasObal.classList.contains('rozbalene')) proVasVice.hidden = proVas.scrollHeight <= proVas.clientHeight + 1;
  };
  /** Body mini-osy mají cíl široký 24 px, ale nikdy se nepřekrývají se sousedy: u blízkých dat je cíl užší
   *  (nejméně jako viditelný bod), aby klik na bod nevzal sousední událost. Viditelný bod se u hustě
   *  nahuštěných událostí (úzký mobil) zmenší, aby se body neslévaly do jedné šmouhy. */
  const sirkyBodu = () => {
    const w = (body[0]?.parentElement as HTMLElement | null)?.clientWidth ?? 0;
    const x = body.map(b => (parseFloat(b.style.left) / 100) * w);
    body.forEach((b, i) => {
      const mezera = Math.min(i > 0 ? x[i] - x[i - 1] : Infinity, i < x.length - 1 ? x[i + 1] - x[i] : Infinity);
      b.style.setProperty('--sirka', `${Math.max(14, Math.min(24, Math.floor(mezera)))}px`);
      b.style.setProperty('--bod', `${Math.max(8, Math.min(14, Math.floor(mezera) - 1))}px`);
    });
  };
  /** Popisek vybrané události nad mini-osou nepřesahuje okraj modalu (u první a poslední události se posune
   *  dovnitř, šipka dál ukazuje na bod). Počítá se z cílové polohy, ne z měření, protože poloha se animuje. */
  const umistiPopis = () => {
    const osa = popis.parentElement as HTMLElement;
    const w = popis.offsetWidth, sirka = osa.clientWidth;
    if (!w || !sirka) return;
    const o = osa.getBoundingClientRect(), d = dlg.getBoundingClientRect();
    const min = d.left + 8 - o.left, max = d.right - 8 - o.left;
    const vlevo = (parseFloat(popis.style.left) / 100) * sirka - w / 2;
    const posun = vlevo < min ? min - vlevo : vlevo + w > max ? max - vlevo - w : 0;
    popis.style.setProperty('--posun', `${Math.round(posun)}px`);
  };
  /** Seznam zdrojů se posouvá svisle; spodní okraj se vytrácí, dokud pod ním další zdroje pokračují. */
  const seznamZdroju = dlg.querySelector<HTMLElement>('.m2-panel[data-p="zdroje"] ol.zdroje');
  const okrajeZdroju = () => {
    if (!seznamZdroju) return;
    seznamZdroju.classList.toggle('pokracuje', seznamZdroju.scrollTop < seznamZdroju.scrollHeight - seznamZdroju.clientHeight - 2);
  };
  seznamZdroju?.addEventListener('scroll', okrajeZdroju, { passive: true });
  /** Filtr zdrojů podle skupiny; prázdná skupina = všechny. */
  const filtrujZdroje = (skupina: string) => {
    if (!seznamZdroju) return;
    dlg.querySelectorAll<HTMLElement>('.zdroje-filtr [data-skupina]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.skupina === skupina)));
    seznamZdroju.querySelectorAll<HTMLElement>(':scope > li').forEach(li => { li.hidden = !!skupina && li.dataset.skupina !== skupina; });
    seznamZdroju.scrollTop = 0;
    okrajeZdroju();
  };
  dlg.querySelector('.zdroje-filtr')?.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-skupina]');
    if (b) filtrujZdroje(b.dataset.skupina!);
  });
  premerAktualni = () => { okrajeLisy(); zmerPerex(); zmerProVas(); sirkyBodu(); okrajeZdroju(); umistiPopis(); };
  lista.addEventListener('scroll', okrajeLisy, { passive: true });
  vice?.addEventListener('click', () => {
    const rozbaleno = hlava.classList.toggle('rozbalene');
    vice!.setAttribute('aria-expanded', String(rozbaleno));
    vice!.textContent = rozbaleno ? 'méně' : 'celé shrnutí';
  });
  proVasVice?.addEventListener('click', () => {
    const rozbaleno = proVasObal!.classList.toggle('rozbalene');
    proVasVice.setAttribute('aria-expanded', String(rozbaleno));
    proVasVice.textContent = rozbaleno ? 'méně' : 'celý text';
  });
  // rozměry jdou změřit až po otevření dialogu (otevírá se hned po inicializaci)
  requestAnimationFrame(() => premerAktualni?.());

  const osa = dlg.querySelector<HTMLElement>('.mini-osa')!;
  const prepni = (p: string) => {
    dlg.querySelectorAll<HTMLElement>('.zalozky [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.p === p)));
    dlg.querySelectorAll<HTMLElement>('.m2-panel').forEach(x => { x.hidden = x.dataset.p !== p; });
    if (p === 'zdroje') okrajeZdroju();
    // Na mobilu se celý modal posouvá dolů a lišta záložek se přilepí nahoře. Když je čtenář níž v delší
    // záložce, nová záložka začne hned pod lištou (ne uprostřed nebo za koncem kratšího obsahu).
    const hranice = osa.offsetTop + osa.offsetHeight;
    if (getComputedStyle(dlg).overflowY === 'auto' && dlg.scrollTop > hranice) dlg.scrollTop = hranice;
    // vybraná záložka musí být celá vidět, i když se lišta posouvá do strany
    const b = lista.querySelector<HTMLElement>(`[role="tab"][data-p="${p}"]`);
    if (b) {
      const l = b.offsetLeft - lista.offsetLeft, r = l + b.offsetWidth;
      // vpravo má lišta na mobilu místo pod zavíracím tlačítkem: záložka nesmí skončit pod ním
      const vpravo = Math.max(24, parseFloat(getComputedStyle(lista).paddingRight) || 0);
      if (l < lista.scrollLeft + 24) lista.scrollLeft = l - 24;
      else if (r > lista.scrollLeft + lista.clientWidth - vpravo) lista.scrollLeft = r - lista.clientWidth + vpravo;
    }
  };

  const ukaz = (i: number, smer = true) => {
    if (!polozky.length || !panelChrono || !zpet || !dal) return;
    const pred = akt;
    akt = Math.max(0, Math.min(polozky.length - 1, i));
    if (!smer || akt === pred) delete panelChrono.dataset.smer; else panelChrono.dataset.smer = akt > pred ? 'vpred' : 'zpet';
    polozky.forEach((li, j) => { li.hidden = j !== akt; });
    body.forEach((b, j) => b.setAttribute('aria-current', String(j === akt)));
    if (popis && body[akt]) {
      popis.style.left = body[akt].style.left;
      popis.textContent = polozky[akt].querySelector('time')?.firstChild?.textContent ?? '';
      umistiPopis();
    }
    const nazev = (j: number) => polozky[j]?.querySelector('h3')?.textContent ?? '';
    zpet.disabled = akt === 0; dal.disabled = akt === polozky.length - 1;
    zpet.querySelector('span')!.textContent = akt > 0 ? nazev(akt - 1) : '';
    dal.querySelector('span')!.textContent = akt < polozky.length - 1 ? nazev(akt + 1) : '';
  };

  lista.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
    if (b) prepni(b.dataset.p!);
  });
  dlg.querySelector('.mini-osa')?.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.bod');
    if (b) { prepni('chrono'); ukaz(Number(b.dataset.i)); }
  });
  // detail pravidla: krok v ukazateli průběhu otevře svou událost (prvek je uvnitř dialogu, s obsahem se vyměňuje)
  dlg.querySelector('.prubeh-detail')?.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-udalost]');
    if (b) { prepni('chrono'); ukaz(Number(b.dataset.udalost)); }
  });
  zpet?.addEventListener('click', () => ukaz(akt - 1));
  dal?.addEventListener('click', () => ukaz(akt + 1));
  dlg.addEventListener('keydown', e => {
    if (!panelChrono || panelChrono.hidden) return;
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
      if (cil?.hidden) filtrujZdroje(''); // odkazovaný zdroj schovává filtr: ukázat zase všechny
      if (cil) { cil.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); cil.classList.add('blik'); setTimeout(() => cil.classList.remove('blik'), 1600); }
      return;
    }
    const s = (e.target as HTMLElement).closest<HTMLElement>('[data-sdilet]');
    if (s) { e.preventDefault(); navigator.clipboard?.writeText(location.href); s.textContent = 'Odkaz zkopírován ✓'; }
  });
  ukaz(akt, false);
  ukazovace.set(dlg, (i: number) => {
    if (!polozky.length || !Number.isInteger(i) || i < 0 || i >= polozky.length) return false;
    prepni('chrono');
    ukaz(i, false);
    return true;
  });
}
