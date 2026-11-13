import type { KauzaZaznam } from './validace';
import { rokDo } from './casova-osa';
import { castkaProRazeni, hlavniCastka } from './castky';

export type Filtr = {
  text: string; stitky: string[]; jenOtevrene: boolean;
  /** '' = bez omezení */
  stav: string; trvani: string; obdobi: string; castka: string;
};
export const PRAZDNY_FILTR: Readonly<Filtr> = { text: '', stitky: [], jenOtevrene: false, stav: '', trvani: '', obdobi: '', castka: '' };

export type PolozkaHledani = {
  slug: string; nazev: string; od: number; do: number | null; stav: string;
  /** datum poslední události (RRRR, RRRR-MM nebo RRRR-MM-DD) */
  posledni: string;
  otevrena: boolean; stitky: string[]; text: string;
  /** hlavní částka kauzy (jen pro pořadí), null = kauza bez částky */
  castka: number | null;
};

/** Skupiny podle doby trvání v celých letech (stejný výpočet jako popisek na ose). */
export const TRVANI = [
  { id: 'do-1', nazev: 'do 1 roku', min: 0, max: 1 },
  { id: '2-5', nazev: '2–5 let', min: 2, max: 5 },
  { id: '6-10', nazev: '6–10 let', min: 6, max: 10 },
  { id: 'nad-10', nazev: 'přes 10 let', min: 11, max: Infinity },
] as const;

/** Období, ve kterém kauza aspoň chvíli probíhala. */
export const OBDOBI = [
  { id: 'do-1999', nazev: 'do roku 1999', od: -Infinity, do: 1999 },
  { id: '2000-2009', nazev: 'v letech 2000–2009', od: 2000, do: 2009 },
  { id: '2010-2019', nazev: 'v letech 2010–2019', od: 2010, do: 2019 },
  { id: 'od-2020', nazev: 'od roku 2020', od: 2020, do: Infinity },
] as const;

/** Podle hlavní částky kauzy (eura a dolary přepočtené jen přibližně, viz castkaProRazeni). */
export const CASTKY = [
  { id: 'ano', nazev: 's uvedenou částkou', min: 0 },
  { id: 'nad-100m', nazev: 's částkou přes 100 mil. Kč', min: 100e6 },
  { id: 'nad-1mld', nazev: 's částkou přes 1 mld. Kč', min: 1e9 },
] as const;

export const RAZENI = [
  { id: 'zacatek', nazev: 'od nejstarší' },
  { id: 'novejsi', nazev: 'od nejnovější' },
  { id: 'aktivita', nazev: 'podle poslední události' },
  { id: 'delka', nazev: 'od nejdelší' },
  { id: 'castka', nazev: 'podle částky' },
  { id: 'nazev', nazev: 'podle názvu' },
] as const;

export function normalizuj(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function vytvorPolozku(z: KauzaZaznam): PolozkaHledani {
  const k = z.kauza;
  const text = [k.nazev, k.shrnuti, k.stitky.join(' '), ...k.udalosti.map(u => `${u.nazev} ${u.popis}`)].join(' ');
  const posledni = k.udalosti.map(u => u.datum).sort().at(-1) ?? String(k.od);
  const hlavni = hlavniCastka(k.castky);
  const castka = hlavni ? castkaProRazeni(hlavni) : null;
  return { slug: z.slug, nazev: k.nazev, od: k.od, do: k.do, stav: k.stav, posledni, otevrena: k.do === null, stitky: k.stitky, text: normalizuj(text), castka };
}

/** Délka kauzy v celých letech; otevřená kauza trvá do letoška. */
export function delkaLet(od: number, doRok: number | null, dnes: Date = new Date()): number {
  return Math.max(0, (doRok ?? rokDo(dnes)) - od);
}

export const slova = (t: string) => normalizuj(t).split(/\s+/).filter(Boolean);

export function odpovida(p: PolozkaHledani, f: Filtr, dnes: Date = new Date()): boolean {
  if (f.jenOtevrene && !p.otevrena) return false;
  if (f.stitky.length && !p.stitky.some(s => f.stitky.includes(s))) return false;
  if (f.stav && p.stav !== f.stav) return false;
  if (f.trvani) {
    const t = TRVANI.find(x => x.id === f.trvani);
    const n = delkaLet(p.od, p.do, dnes);
    if (t && (n < t.min || n > t.max)) return false;
  }
  if (f.obdobi) {
    const o = OBDOBI.find(x => x.id === f.obdobi);
    const konec = p.do ?? rokDo(dnes);
    if (o && (p.od > o.do || konec < o.od)) return false;
  }
  if (f.castka) {
    const c = CASTKY.find(x => x.id === f.castka);
    if (c && (p.castka === null || p.castka < c.min)) return false;
  }
  return slova(f.text).every(w => p.text.includes(w));
}

export function jeAktivni(f: Filtr): boolean {
  return f.jenOtevrene || f.stitky.length > 0 || slova(f.text).length > 0 || !!f.stav || !!f.trvani || !!f.obdobi || !!f.castka;
}

const podleNazvu = (a: PolozkaHledani, b: PolozkaHledani) => a.nazev.localeCompare(b.nazev, 'cs');

/** Vrátí nové pole seřazené podle zvoleného řazení (id z RAZENI); neznámé řazení = od nejstarší. */
export function seradit(polozky: PolozkaHledani[], razeni: string, dnes: Date = new Date()): PolozkaHledani[] {
  const r = [...polozky];
  switch (razeni) {
    case 'novejsi': return r.sort((a, b) => b.od - a.od || podleNazvu(a, b));
    case 'aktivita': return r.sort((a, b) => (a.posledni < b.posledni ? 1 : a.posledni > b.posledni ? -1 : podleNazvu(a, b)));
    case 'delka': return r.sort((a, b) => delkaLet(b.od, b.do, dnes) - delkaLet(a.od, a.do, dnes) || a.od - b.od || podleNazvu(a, b));
    case 'nazev': return r.sort(podleNazvu);
    case 'castka': return r.sort((a, b) => (b.castka ?? -1) - (a.castka ?? -1) || podleNazvu(a, b));
    default: return r.sort((a, b) => a.od - b.od || podleNazvu(a, b));
  }
}
