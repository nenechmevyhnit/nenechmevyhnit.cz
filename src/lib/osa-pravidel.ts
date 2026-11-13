import { rokCislo, datumText } from './casova-osa';
import { popisekKroku, UKONCUJICI, type Krok } from './pravidla-stavy';
import { popisekCesty, type Cesta } from './pravidla-slovnik';

/** Časová osa změn pravidel (spec 2026-11-13-osa-pravidel). Jen výpočet; vykreslení je v OsaPravidel.astro. */
export const OSA_OD = '2025-12-01';
const OKRAJ = 0.5 / 12; // půl měsíce za koncem osy
const BLIZKO = 1.0; // body bližší než tolik procent osy se překrývají: skupina s posunem
const MESICE = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];

export type DruhBodu = 'krok' | 'konec' | 'udalost' | 'ucinnost';
export type BodOsy = { x: number; druh: DruhBodu; datum: string; popisek: string; popisekSkupiny: string | null; udalost: number | null; posun: number };
export type RadekOsy = {
  slug: string; nazev: string; cesta: string; /** popisek posledního kroku, „“ bez kroku */ stav: string; body: BodOsy[];
  cara: { od: number; do: number } | null; caraBudouci: { od: number; do: number } | null;
  drive: { pocet: number; udalost: number } | null;
};
export type ZnackaOsy = { x: number; text: string; rok: boolean };
export type Osa = { od: string; do: string; dnes: number; znacky: ZnackaOsy[]; radky: RadekOsy[] };
export type ZaznamOsy = {
  slug: string;
  pravidlo: { nazev: string; cesta: Cesta; udalosti: readonly { datum: string; krok?: Krok; nazev: string }[]; ucinnostOd?: string };
};

const kulate = (n: number) => Math.round(n * 100) / 100;

export function osaPravidel(zaznamy: readonly ZaznamOsy[], dnes: Date): Osa {
  // místní datum, stejně jako jeVBudoucnosti v schema.ts (UTC by kolem půlnoci posunulo „dnes“ o den)
  const dnesIso = `${dnes.getFullYear()}-${String(dnes.getMonth() + 1).padStart(2, '0')}-${String(dnes.getDate()).padStart(2, '0')}`;
  const budouci = zaznamy.map(z => z.pravidlo.ucinnostOd).filter((d): d is string => !!d && d > dnesIso);
  const konec = [dnesIso, ...budouci].sort().at(-1)!;
  const od = rokCislo(OSA_OD), doCislo = rokCislo(konec) + OKRAJ;
  const x = (datum: string) => kulate(Math.min(100, Math.max(0, ((rokCislo(datum) - od) / (doCislo - od)) * 100)));

  const znacky: ZnackaOsy[] = [];
  for (let r = 2025, m = 12; rokCislo(`${r}-${String(m).padStart(2, '0')}-01`) <= doCislo; m === 12 ? (r++, m = 1) : m++) {
    const d = `${r}-${String(m).padStart(2, '0')}-01`;
    znacky.push({ x: x(d), text: m === 1 ? String(r) : MESICE[m - 1], rok: m === 1 });
  }

  const radky = zaznamy.map(({ slug, pravidlo: p }) => {
    const body: BodOsy[] = [];
    let pocetDrive = 0, prvniDrive = -1;
    p.udalosti.forEach((u, i) => {
      if (rokCislo(u.datum) < od) { pocetDrive++; if (prvniDrive < 0) prvniDrive = i; return; }
      const druh: DruhBodu = u.krok ? (UKONCUJICI.includes(u.krok) ? 'konec' : 'krok') : 'udalost';
      body.push({ x: x(u.datum), druh, datum: u.datum, popisek: `${datumText(u.datum)} · ${u.krok ? popisekKroku(u.krok) : u.nazev}`, popisekSkupiny: null, udalost: i, posun: 0 });
    });
    if (p.ucinnostOd && p.ucinnostOd > dnesIso)
      body.push({ x: x(p.ucinnostOd), druh: 'ucinnost', datum: p.ucinnostOd, popisek: `Účinnost od ${datumText(p.ucinnostOd)}`, popisekSkupiny: null, udalost: null, posun: 0 });
    // body blízko sebe (rozdíl poloh menší než BLIZKO procenta osy): posun vedle sebe a společný popisek
    const serazene = [...body].sort((a, b) => a.x - b.x);
    for (let i = 0; i < serazene.length;) {
      let j = i + 1;
      while (j < serazene.length && serazene[j].x - serazene[i].x < BLIZKO) j++;
      const skupina = serazene.slice(i, j);
      if (skupina.length > 1) {
        const spolecny = skupina.map(b => b.popisek).join('; ');
        skupina.forEach((b, k) => { b.posun = k; b.popisekSkupiny = spolecny; });
      }
      i = j;
    }
    const kroky = body.filter(b => b.druh === 'krok' || b.druh === 'konec');
    const ucinnost = body.find(b => b.druh === 'ucinnost');
    const posledniKrok = kroky.at(-1);
    const stav = [...p.udalosti].reverse().find(u => u.krok)?.krok;
    return {
      slug, nazev: p.nazev, cesta: popisekCesty(p.cesta), stav: stav ? popisekKroku(stav) : '', body,
      cara: kroky.length >= 2 ? { od: kroky[0].x, do: posledniKrok!.x } : null,
      caraBudouci: ucinnost && posledniKrok ? { od: posledniKrok.x, do: ucinnost.x } : null,
      drive: pocetDrive ? { pocet: pocetDrive, udalost: prvniDrive } : null,
      razeni: body.find(b => b.udalost !== null)?.datum ?? '9999',
    };
  });
  radky.sort((a, b) => a.razeni.localeCompare(b.razeni) || a.nazev.localeCompare(b.nazev, 'cs'));
  return { od: OSA_OD, do: konec, dnes: x(dnesIso), znacky, radky: radky.map(({ razeni, ...r }) => r) };
}
