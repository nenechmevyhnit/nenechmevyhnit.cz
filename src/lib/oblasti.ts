import { sklonuj } from './cestina';
import { UKONCUJICI, stavPravidla, type Krok } from './pravidla-stavy';
import { vynechaneKontroly, OBLASTI, oblast as popisOblasti, TYPY_HODNOCENI, popisekTypuHodnoceni, type Cesta, type Oblast, type TypHodnoceni } from './pravidla-slovnik';
import { seraditPravidla } from './pravidla';
import type { PravidloZaznam, OblastZaznam } from './validace';
import type { Hodnoceni, OblastData } from './schema-oblasti';

/** Odvozené hodnoty pohledu Oblasti (specifikace oblastí, oddíl 7.3). Nikam se nezapisují. Část se používá i v prohlížeči. */
export type KategorieStavu = 'prijato' | 'projednava' | 'ukonceno';
export const kategorieStavu = (k: Krok): KategorieStavu =>
  UKONCUJICI.includes(k) ? 'ukonceno' : k === 'vyhlaseno' || k === 'schvaleno' ? 'prijato' : 'projednava';

export type Pocty = { celkem: number; prijato: number; projednava: number; ukonceno: number };
export function spocitej(kategorie: readonly KategorieStavu[]): Pocty {
  const p: Pocty = { celkem: kategorie.length, prijato: 0, projednava: 0, ukonceno: 0 };
  for (const k of kategorie) p[k]++;
  return p;
}
/** „3 změny · 1 přijata · 2 v projednávání“; ukončené jen tehdy, když nějaké jsou. */
export function textPoctu(p: Pocty): string {
  return [
    sklonuj(p.celkem, ['změna', 'změny', 'změn']),
    sklonuj(p.prijato, ['přijata', 'přijaty', 'přijato']),
    `${p.projednava} v projednávání`,
    ...(p.ukonceno > 0 ? [sklonuj(p.ukonceno, ['ukončena', 'ukončeny', 'ukončeno'])] : []),
  ].join(' · ');
}

/** Cesta předložení vynechává meziresortní připomínkové řízení (popis procesu, ne hodnocení). */
export const bezPripominek = (c: Cesta): boolean => vynechaneKontroly(c).length > 0;

export type OblastDetail = { id: Oblast; nazev: string; popisek: string; data: OblastData | null; zmeny: PravidloZaznam[]; pocty: Pocty };
/** Oblasti, do kterých patří aspoň jedna změna, v pořadí slovníku. data = null jen v náhledu konceptů. */
export function sestavOblasti(pravidla: PravidloZaznam[], soubory: OblastZaznam[]): OblastDetail[] {
  const data = new Map<Oblast, OblastData>(soubory.map(s => [s.id, s.data] as const));
  return OBLASTI.flatMap(id => {
    const zmeny = seraditPravidla(pravidla.filter(z => z.pravidlo.oblasti?.includes(id)));
    if (zmeny.length === 0) return [];
    const { nazev, popisek } = popisOblasti(id);
    const pocty = spocitej(zmeny.map(z => kategorieStavu(stavPravidla(z.pravidlo.udalosti))));
    return [{ id, nazev, popisek, data: data.get(id) ?? null, zmeny, pocty }];
  });
}

export type SkupinaHodnoceni = { typ: TypHodnoceni; nazev: string; polozky: Hodnoceni[] };
export function skupinyHodnoceni(hodnoceni: readonly Hodnoceni[]): SkupinaHodnoceni[] {
  return TYPY_HODNOCENI
    .map(typ => ({ typ, nazev: popisekTypuHodnoceni(typ), polozky: hodnoceni.filter(h => h.typ === typ).sort((a, b) => b.datum.localeCompare(a.datum)) }))
    .filter(s => s.polozky.length > 0);
}
