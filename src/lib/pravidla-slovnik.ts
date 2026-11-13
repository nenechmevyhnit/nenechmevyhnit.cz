/** Slovníky části „Změny pravidel“ (specifikace 2026-11-13, oddíl 5). Popisky sdílí web i Metodika. */
export const DRUHY_PRAVIDEL = ['zakon', 'narizeni-vlady', 'vyhlaska', 'pravidla-programu'] as const;
export type DruhPravidla = (typeof DRUHY_PRAVIDEL)[number];

export const CESTY = [
  'vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh',
  'narizeni-vlady', 'vyhlaska-ministerstva', 'pravidla-programu',
] as const;
export type Cesta = (typeof CESTY)[number];

const CESTY_DRUHU: Record<DruhPravidla, readonly Cesta[]> = {
  zakon: ['vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh'],
  'narizeni-vlady': ['narizeni-vlady'],
  vyhlaska: ['vyhlaska-ministerstva'],
  'pravidla-programu': ['pravidla-programu'],
};
export const cestyProDruh = (d: DruhPravidla): readonly Cesta[] => CESTY_DRUHU[d];

const POPISKY_CEST: Record<Cesta, string> = {
  'vladni-navrh': 'Vládní návrh zákona',
  'poslanecky-navrh': 'Poslanecký návrh zákona',
  'senatni-navrh': 'Senátní návrh zákona',
  'pozmenovaci-navrh': 'Pozměňovací návrh',
  'narizeni-vlady': 'Nařízení vlády',
  'vyhlaska-ministerstva': 'Vyhláška ministerstva',
  'pravidla-programu': 'Pravidla dotačního programu',
};
export const popisekCesty = (c: Cesta): string => POPISKY_CEST[c];

/** Kontroly legislativního procesu, které cesta předložení vynechává (jednací řád Sněmovny,
 *  Legislativní pravidla vlády). Je to popis procesu, ne hodnocení. */
const BEZ_PRIPOMINEK = ['bez meziresortního připomínkového řízení', 'bez hodnocení dopadů regulace (RIA)'];
export function vynechaneKontroly(c: Cesta): string[] {
  if (c === 'poslanecky-navrh' || c === 'senatni-navrh') return [...BEZ_PRIPOMINEK];
  if (c === 'pozmenovaci-navrh') return [...BEZ_PRIPOMINEK, 'bez stanoviska vlády', 'bez prvního čtení'];
  return [];
}

export const KOMU = ['babis', 'agrofert'] as const;
export type Komu = (typeof KOMU)[number];
const POPISKY_KOMU: Record<Komu, string> = { babis: 'Andrej Babiš', agrofert: 'Agrofert' };
/** Vždy v pořadí Babiš, Agrofert, bez ohledu na pořadí v souboru. */
export const popisekKomu = (k: readonly Komu[]): string => KOMU.filter(x => k.includes(x)).map(x => POPISKY_KOMU[x]).join(', ');

export const ZAVERY = ['dolozen', 'pravdepodobny'] as const;
export type Zaver = (typeof ZAVERY)[number];
const POPISKY_ZAVERU: Record<Zaver, string> = { dolozen: 'prospěch doložen', pravdepodobny: 'prospěch pravděpodobný' };
export const popisekZaveru = (z: Zaver): string => POPISKY_ZAVERU[z];
