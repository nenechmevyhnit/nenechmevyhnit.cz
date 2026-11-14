import { odpovidaPravidlo, type PolozkaPravidla, type FiltrPravidel } from '../lib/hledani-pravidel';
import { spocitej, textPoctu } from '../lib/oblasti';
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
  const cipBez = obal.querySelector<HTMLButtonElement>('[data-bez-pripominek]');
  const karty = [...document.querySelectorAll<HTMLElement>('.ob-karta')];
  const prazdnoOblasti = document.querySelector<HTMLElement>('.ob-prazdno');
  const prepinaci = [...cipy, ...cipyDuvodu, ...(cipBez ? [cipBez] : [])];
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
    jenBezPripominek: cipBez?.getAttribute('aria-pressed') === 'true',
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
    // karty oblastí: skrýt oblast bez odpovídající změny a přepočítat její počty
    const vyhovujici = polozky.filter(p => odpovidaPravidlo(p, f));
    for (const karta of karty) {
      const vOblasti = vyhovujici.filter(p => p.oblasti.includes(karta.dataset.oblast as PolozkaPravidla['oblasti'][number]));
      karta.hidden = vOblasti.length === 0;
      const pocty = karta.querySelector<HTMLElement>('.ob-pocty');
      if (pocty) pocty.textContent = textPoctu(spocitej(vOblasti.map(p => p.kategorie)));
    }
    if (prazdnoOblasti) prazdnoOblasti.hidden = karty.some(k => !k.hidden);
    prazdno.hidden = n > 0;
    if (prazdnoOsy) prazdnoOsy.hidden = n > 0;
    pocet.textContent = `Zobrazeno ${n} z ${polozky.length}`;
    zrusit.hidden = !(f.text.trim() || f.stitky.length || f.duvody.length || f.jenProjednavane || f.jenBezPripominek);
  };
  const vycisti = () => {
    hledat.value = '';
    jen.checked = false;
    prepinaci.forEach(c => c.setAttribute('aria-pressed', 'false'));
    pouzij();
  };
  hledat.addEventListener('input', pouzij);
  jen.addEventListener('change', pouzij);
  prepinaci.forEach(c => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    pouzij();
  }));
  zrusit.addEventListener('click', vycisti);
  prazdno.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);
  prazdnoOsy?.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);
  prazdnoOblasti?.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);
  pouzij();
}
