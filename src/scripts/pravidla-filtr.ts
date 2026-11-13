import { odpovidaPravidlo, type PolozkaPravidla, type FiltrPravidel } from '../lib/hledani-pravidel';
import type { Duvod } from '../lib/pravidla-slovnik';

export function inicializujFiltrPravidel(): void {
  const data = document.getElementById('nv-pravidla');
  const obal = document.querySelector<HTMLElement>('.pr-filtry');
  if (!data || !obal) return;
  const polozky: PolozkaPravidla[] = JSON.parse(data.textContent ?? '[]');
  const hledat = obal.querySelector<HTMLInputElement>('input[type="search"]')!;
  const jen = obal.querySelector<HTMLInputElement>('[data-jen-projednavane]')!;
  const cipy = [...obal.querySelectorAll<HTMLButtonElement>('[data-stitek]')];
  const cipyDuvodu = [...obal.querySelectorAll<HTMLButtonElement>('[data-duvod]')];
  const pocet = obal.querySelector<HTMLElement>('.pocet')!;
  const zrusit = obal.querySelector<HTMLButtonElement>('.f-zrusit')!;
  const prazdno = document.querySelector<HTMLElement>('.pravidla-seznam .prazdno')!;
  const radky = new Map([...document.querySelectorAll<HTMLElement>('.pr-radek')].map(r => [r.dataset.slug!, r]));

  const radkyOsy = new Map([...document.querySelectorAll<HTMLElement>('.op-radek')].map(r => [r.dataset.slug!, r]));
  const prazdnoOsy = document.querySelector<HTMLElement>('.op-prazdno');

  const filtr = (): FiltrPravidel => ({
    text: hledat.value,
    stitky: cipy.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.stitek!),
    jenProjednavane: jen.checked,
    duvody: cipyDuvodu.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.duvod as Duvod),
    jenBezPripominek: false,
  });
  const pouzij = () => {
    const f = filtr();
    let n = 0;
    for (const p of polozky) {
      const ok = odpovidaPravidlo(p, f);
      const r = radky.get(p.slug);
      if (r) r.hidden = !ok;
      const ro = radkyOsy.get(p.slug);
      if (ro) ro.hidden = !ok;
      if (ok) n++;
    }
    prazdno.hidden = n > 0;
    if (prazdnoOsy) prazdnoOsy.hidden = n > 0;
    pocet.textContent = `Zobrazeno ${n} z ${polozky.length}`;
    zrusit.hidden = !(f.text.trim() || f.stitky.length || f.duvody.length || f.jenProjednavane);
  };
  const vycisti = () => {
    hledat.value = '';
    jen.checked = false;
    [...cipy, ...cipyDuvodu].forEach(c => c.setAttribute('aria-pressed', 'false'));
    pouzij();
  };
  hledat.addEventListener('input', pouzij);
  jen.addEventListener('change', pouzij);
  [...cipy, ...cipyDuvodu].forEach(c => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    pouzij();
  }));
  zrusit.addEventListener('click', vycisti);
  prazdno.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);
  prazdnoOsy?.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);
  pouzij();
}
