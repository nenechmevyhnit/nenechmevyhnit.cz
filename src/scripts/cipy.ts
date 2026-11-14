import { sklonuj } from '../lib/cestina';

/**
 * Témata (čipy) v jednom řádku: jen ta, která se vejdou, zbytek otevře tlačítko „+N další“. Vybraná témata jsou
 * vidět vždy, ostatní se doplní v abecedním pořadí, dokud je místo. Nic se neposouvá ani nemizí do ztracena.
 * Čipy důvodu u pravidel (data-duvod) se chovají stejně jako témata; oddělovač mezi nimi a tématy jen ubírá místo
 * a schová se, když na jedné z jeho stran nic vidět není.
 * Vrací funkci, která řádek znovu rozvrhne (např. po zrušení filtrů).
 */
export function inicializujCipy(cipy: HTMLElement): () => void {
  const obal = cipy.parentElement!;
  const vice = cipy.querySelector<HTMLButtonElement>('.f-vice');
  if (!vice) return () => {};
  const vsechnyCipy = [...cipy.querySelectorAll<HTMLButtonElement>('button[data-duvod], button[data-bez-pripominek], button[data-stitek]')];
  const pevne = [...cipy.children].filter((e): e is HTMLElement => e instanceof HTMLElement && !e.matches('button'));
  const oddelovace = () => pevne.forEach(e => {
    const pred = vsechnyCipy.filter(c => c.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING);
    const za = vsechnyCipy.filter(c => !pred.includes(c));
    e.hidden = !pred.some(c => !c.hidden) || !za.some(c => !c.hidden);
  });
  let rozbaleno = false;

  function rozvrhni() {
    obal.classList.toggle('rozbalene', rozbaleno);
    vsechnyCipy.forEach(c => { c.hidden = false; });
    pevne.forEach(e => { e.hidden = false; });
    if (rozbaleno) {
      vice!.hidden = false; vice!.textContent = 'méně'; vice!.setAttribute('aria-expanded', 'true');
      return;
    }
    vice!.hidden = true;
    const mezera = parseFloat(getComputedStyle(cipy).columnGap) || 0;
    const sirkaPevnych = pevne.reduce((s, e) => s + e.getBoundingClientRect().width + parseFloat(getComputedStyle(e).marginLeft) + parseFloat(getComputedStyle(e).marginRight) + mezera, 0);
    const sirka = cipy.clientWidth - sirkaPevnych;
    const sirky = vsechnyCipy.map(c => c.getBoundingClientRect().width);
    if (sirky.reduce((a, b) => a + b, 0) + mezera * (sirky.length - 1) <= sirka) return;
    // místo pro tlačítko (nejdelší možný popisek)
    vice!.hidden = false; vice!.textContent = `+${sklonuj(vsechnyCipy.length, ['další', 'další', 'dalších'])}`;
    let zbyva = sirka - vice!.getBoundingClientRect().width - mezera;
    const ukazat = new Set<number>();
    vsechnyCipy.forEach((c, i) => { if (c.getAttribute('aria-pressed') === 'true') { ukazat.add(i); zbyva -= sirky[i] + mezera; } });
    // ostatní souvisle od začátku abecedy: první, které se nevejde, a všechna za ním jdou pod „+N další“
    let plno = false;
    vsechnyCipy.forEach((c, i) => {
      if (ukazat.has(i) || plno) return;
      if (sirky[i] + mezera <= zbyva) { ukazat.add(i); zbyva -= sirky[i] + mezera; } else plno = true;
    });
    vsechnyCipy.forEach((c, i) => { c.hidden = !ukazat.has(i); });
    oddelovace();
    const skryto = vsechnyCipy.length - ukazat.size;
    vice!.textContent = `+${sklonuj(skryto, ['další', 'další', 'dalších'])}`;
    vice!.setAttribute('aria-expanded', 'false');
  }
  vice.addEventListener('click', () => {
    rozbaleno = !rozbaleno;
    rozvrhni();
    if (!rozbaleno) vice.focus();
  });
  new ResizeObserver(() => rozvrhni()).observe(obal);
  document.fonts.ready.then(rozvrhni);
  return rozvrhni;
}
