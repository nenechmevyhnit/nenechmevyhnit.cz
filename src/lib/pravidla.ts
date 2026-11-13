import type { PravidloZaznam } from './validace';
import { stavPravidla, popisekKroku } from './pravidla-stavy';
import type { Duvod } from './pravidla-slovnik';
import type { Pravidlo } from './schema-pravidla';

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

/** Důvody zařazení se nezapisují, plynou z bloků prospech a kontrolaMoci (spec kontroly moci, oddíl 6). */
export const duvodyPravidla = (p: Pick<Pravidlo, 'prospech' | 'kontrolaMoci'>): Duvod[] => [
  ...(p.prospech ? (['prospech'] as const) : []),
  ...(p.kontrolaMoci ? (['kontrola-moci'] as const) : []),
];
