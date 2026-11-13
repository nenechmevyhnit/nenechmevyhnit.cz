import type { PravidloZaznam } from './validace';
import { stavPravidla, popisekKroku } from './pravidla-stavy';

/** Události jdou chronologicky (hlídá schéma), poslední je tedy nejnovější. */
export const posledniDatum = (z: PravidloZaznam): string => z.pravidlo.udalosti[z.pravidlo.udalosti.length - 1].datum;

export function seraditPravidla(p: PravidloZaznam[]): PravidloZaznam[] {
  return [...p].sort((a, b) => posledniDatum(b).localeCompare(posledniDatum(a)) || a.pravidlo.nazev.localeCompare(b.pravidlo.nazev, 'cs'));
}

export type SouvisejiciPravidlo = { slug: string; nazev: string; popis: string; stav: string };

/** „Související změny pravidel“ v detailu kauzy: sestaví se zpětně z polí `kauzy` všech pravidel. */
export function pravidlaKauzy(pravidla: PravidloZaznam[], slug: string): SouvisejiciPravidlo[] {
  return pravidla.flatMap(z => z.pravidlo.kauzy
    .filter(k => k.kauza === slug)
    .map(k => ({ slug: z.slug, nazev: z.pravidlo.nazev, popis: k.popis, stav: popisekKroku(stavPravidla(z.pravidlo.udalosti)) })));
}
