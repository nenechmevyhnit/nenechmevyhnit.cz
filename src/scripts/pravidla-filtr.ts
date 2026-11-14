import { odpovidaPravidlo, seraditPolozkyPravidel, type PolozkaPravidla, type FiltrPravidel } from '../lib/hledani-pravidel';
import { spocitej, textPoctu } from '../lib/oblasti';
import { pocetNaStranku, pocetStranek, cislaStranek } from '../lib/strankovani';
import { sklonuj } from '../lib/cestina';
import type { Duvod, Cesta } from '../lib/pravidla-slovnik';
import type { Krok } from '../lib/pravidla-stavy';
import { inicializujCipy } from './cipy';

/** Nejvýš tolik změn pravidel na jedné stránce přehledu (řádky jsou vyšší než u kauz, víc by se četlo hůř). */
export const NEJVIC_PRAVIDEL_NA_STRANKU = 6;

export function inicializujFiltrPravidel(): void {
  const data = document.getElementById('nv-pravidla');
  const obal = document.querySelector<HTMLElement>('.pr-filtry');
  const seznamObal = document.querySelector<HTMLElement>('.pravidla-obal');
  if (!data || !obal || !seznamObal) return;
  const polozky: PolozkaPravidla[] = JSON.parse(data.textContent ?? '[]');
  const hledat = obal.querySelector<HTMLInputElement>('input[type="search"]')!;
  const jen = obal.querySelector<HTMLInputElement>('[data-jen-projednavane]')!;
  const cipy = [...obal.querySelectorAll<HTMLButtonElement>('[data-stitek]')];
  const cipyDuvodu = [...obal.querySelectorAll<HTMLButtonElement>('[data-duvod]')];
  const cipBez = obal.querySelector<HTMLButtonElement>('[data-bez-pripominek]');
  const karty = [...document.querySelectorAll<HTMLElement>('.ob-karta')];
  const prazdnoOblasti = document.querySelector<HTMLElement>('.ob-prazdno');
  const prepinaci = [...cipy, ...cipyDuvodu, ...(cipBez ? [cipBez] : [])];
  const vyberCesty = obal.querySelector<HTMLSelectElement>('select[data-filtr="cesta"]')!;
  const vyberStavu = obal.querySelector<HTMLSelectElement>('select[data-filtr="stav"]')!;
  const vyberRazeni = obal.querySelector<HTMLSelectElement>('select[data-razeni]')!;
  // počítadlo a Zrušit filtry jsou dvakrát: v záhlaví seznamu (počítač) a v řádku filtrů (mobil), CSS ukáže jen jedno
  const pocty = document.querySelectorAll<HTMLElement>('.pocet');
  const zrusit = [...document.querySelectorAll<HTMLButtonElement>('.f-zrusit')];
  const seznam = seznamObal.querySelector<HTMLElement>('.pravidla-seznam')!;
  const prazdno = seznam.querySelector<HTMLElement>('.prazdno')!;
  const strankovani = seznamObal.querySelector<HTMLElement>('.strankovani')!;
  const rozsah = strankovani.querySelector<HTMLElement>('.s-rozsah')!;
  const cisla = strankovani.querySelector<HTMLElement>('.s-cisla')!;
  const pred = strankovani.querySelector<HTMLButtonElement>('.s-pred')!;
  const dalsi = strankovani.querySelector<HTMLButtonElement>('.s-dalsi')!;
  const radky = new Map([...seznam.querySelectorAll<HTMLElement>('.pr-radek')].map(r => [r.dataset.slug!, r]));

  let poradi: PolozkaPravidla[] = seraditPolozkyPravidel(polozky, vyberRazeni.value);
  let shoda: PolozkaPravidla[] = poradi;
  let strana = 1;
  let naStranku = Infinity; // Infinity = stránkování vypnuté (vše se vejde)

  const radkyOsy = new Map([...document.querySelectorAll<HTMLElement>('.op-radek')].map(r => [r.dataset.slug!, r]));
  const prazdnoOsy = document.querySelector<HTMLElement>('.op-prazdno');

  const filtr = (): FiltrPravidel => ({
    text: hledat.value,
    stitky: cipy.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.stitek!),
    jenProjednavane: jen.checked,
    duvody: cipyDuvodu.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.duvod as Duvod),
    jenBezPripominek: cipBez?.getAttribute('aria-pressed') === 'true',
    cesta: vyberCesty.value as Cesta | '',
    stav: vyberStavu.value as Krok | '',
  });
  const stranaPravidla = (slug: string | null) => {
    const i = slug ? shoda.findIndex(p => p.slug === slug) : -1;
    return i < 0 || !isFinite(naStranku) ? null : Math.floor(i / naStranku) + 1;
  };

  /** Nejvyšší přirozená výška řádku přes všechny změny (i skryté), při současné šířce seznamu. */
  const potrebnaVyskaRadku = () => {
    seznam.classList.add('meri');
    let max = 0;
    for (const r of radky.values()) max = Math.max(max, r.getBoundingClientRect().height);
    seznam.classList.remove('meri');
    return Math.ceil(max);
  };

  /** Kolik řádků se vejde na výšku seznamu; stránkování zapne, jen když se všechny změny nevejdou. */
  const zmerStranku = () => {
    if (!radky.size) return;
    strankovani.hidden = true;
    seznam.classList.remove('strankovane');
    const vyskaRadku = potrebnaVyskaRadku();
    if (polozky.length <= pocetNaStranku(seznam.clientHeight, vyskaRadku, NEJVIC_PRAVIDEL_NA_STRANKU)) { naStranku = Infinity; return; }
    strankovani.hidden = false;
    seznam.classList.add('strankovane');
    naStranku = pocetNaStranku(seznam.clientHeight, vyskaRadku, NEJVIC_PRAVIDEL_NA_STRANKU);
    // řádky všech stránek stejně vysoké, i na poslední neúplné stránce
    seznam.style.setProperty('--vyska-radku', `${seznam.clientHeight / naStranku}px`);
  };

  const vykresliStrankovani = () => {
    if (!isFinite(naStranku)) return;
    // prázdný výsledek: hláška se „Zrušit filtry“ stačí
    strankovani.hidden = shoda.length === 0;
    const celkem = pocetStranek(shoda.length, naStranku);
    const od = (strana - 1) * naStranku;
    rozsah.textContent = shoda.length ? `${od + 1}–${Math.min(od + naStranku, shoda.length)} z ${shoda.length}` : '0 z 0';
    pred.disabled = strana <= 1;
    dalsi.disabled = strana >= celkem;
    cisla.replaceChildren(...cislaStranek(strana, celkem).map(c => {
      if (c === null) { const s = document.createElement('span'); s.className = 's-mezera'; s.textContent = '…'; return s; }
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = String(c); b.dataset.strana = String(c);
      b.setAttribute('aria-label', `Stránka ${c}`);
      if (c === strana) b.setAttribute('aria-current', 'page');
      return b;
    }));
  };

  const vykresli = () => {
    const celkem = pocetStranek(shoda.length, isFinite(naStranku) ? naStranku : shoda.length || 1);
    strana = Math.min(Math.max(1, strana), celkem);
    const od = isFinite(naStranku) ? (strana - 1) * naStranku : 0;
    const naTeto = new Set(shoda.slice(od, isFinite(naStranku) ? od + naStranku : shoda.length).map(p => p.slug));
    for (const [slug, r] of radky) r.hidden = !naTeto.has(slug);
    const n = shoda.length;
    prazdno.hidden = n > 0;
    const text = n === polozky.length ? sklonuj(n, ['změna', 'změny', 'změn']) : `${n} z ${polozky.length}`;
    pocty.forEach(p => { p.textContent = text; });
    const f = filtr();
    const aktivni = Boolean(f.text.trim() || f.stitky.length || f.duvody.length || f.jenProjednavane || f.jenBezPripominek || f.cesta || f.stav);
    // časová osa a karty oblastí ukazují celý výsledek filtru (nestránkují)
    const vShode = new Set(shoda.map(p => p.slug));
    for (const [slug, ro] of radkyOsy) ro.hidden = !vShode.has(slug);
    if (prazdnoOsy) prazdnoOsy.hidden = n > 0;
    for (const karta of karty) {
      const vOblasti = shoda.filter(p => p.oblasti.includes(karta.dataset.oblast as PolozkaPravidla['oblasti'][number]));
      karta.hidden = vOblasti.length === 0;
      const poctyKarty = karta.querySelector<HTMLElement>('.ob-pocty');
      if (poctyKarty) poctyKarty.textContent = textPoctu(spocitej(vOblasti.map(p => p.kategorie)));
    }
    if (prazdnoOblasti) prazdnoOblasti.hidden = karty.some(k => !k.hidden);
    zrusit.forEach(z => { z.hidden = !aktivni; });
    vykresliStrankovani();
  };

  /** Nový výsledek filtru: zpět na první stránku. */
  const pouzij = () => {
    const f = filtr();
    shoda = poradi.filter(p => odpovidaPravidlo(p, f));
    strana = 1;
    vykresli();
  };
  /** Nové řazení: řádky se přeskládají i v DOM (kvůli pořadí pro čtečky a tabulátor). */
  const preskladej = () => {
    poradi = seraditPolozkyPravidel(polozky, vyberRazeni.value);
    for (const p of poradi) { const r = radky.get(p.slug); if (r) seznam.insertBefore(r, prazdno); }
  };
  const vycisti = () => {
    hledat.value = '';
    jen.checked = false;
    vyberCesty.value = '';
    vyberStavu.value = '';
    prepinaci.forEach(c => c.setAttribute('aria-pressed', 'false'));
    pouzij();
    rozvrhniCipy();
  };
  hledat.addEventListener('input', pouzij);
  jen.addEventListener('change', pouzij);
  vyberCesty.addEventListener('change', pouzij);
  vyberStavu.addEventListener('change', pouzij);
  vyberRazeni.addEventListener('change', () => { preskladej(); pouzij(); });
  prepinaci.forEach(c => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    pouzij();
  }));
  zrusit.forEach(z => z.addEventListener('click', vycisti));
  prazdno.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);
  prazdnoOsy?.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);
  prazdnoOblasti?.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);

  pred.addEventListener('click', () => { strana--; vykresli(); });
  dalsi.addEventListener('click', () => { strana++; vykresli(); });
  cisla.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button[data-strana]');
    if (b) { strana = Number(b.dataset.strana); vykresli(); }
  });
  // otevřená změna (detail) má být v seznamu vidět: přepnout na její stránku
  document.addEventListener('nv:vyber', e => {
    const s = stranaPravidla((e as CustomEvent<string | null>).detail);
    if (s && s !== strana) { strana = s; vykresli(); }
  });

  // změna velikosti: přepočítat stránku a zůstat u vybrané změny, jinak u první změny dosavadní stránky
  let posledni = -1;
  const prepocitej = () => {
    // skrytý seznam (pohled Oblasti nebo Časová osa) má výšku 0: měří se, až se ukáže
    if (!seznamObal.clientHeight) { posledni = -1; vykresli(); return; }
    const v = seznamObal.clientHeight * 100000 + seznamObal.clientWidth;
    if (v === posledni) return;
    posledni = v;
    const vybrana = seznam.querySelector<HTMLElement>('.pr-radek.vybrany')?.dataset.slug ?? null;
    const kotva = vybrana ?? (isFinite(naStranku) ? shoda[(strana - 1) * naStranku]?.slug : null) ?? null;
    zmerStranku();
    strana = stranaPravidla(kotva) ?? 1;
    vykresli();
  };
  new ResizeObserver(prepocitej).observe(seznamObal);
  document.fonts.ready.then(() => { posledni = -1; prepocitej(); });

  const rozvrhniCipy = inicializujCipy(obal.querySelector<HTMLElement>('.f-cipy')!);

  // prohlížeč mohl po návratu na stránku obnovit hodnoty polí: převzít je
  if (vyberRazeni.value !== 'aktivita') preskladej();
  shoda = poradi.filter(p => odpovidaPravidlo(p, filtr()));
  prepocitej();
}
