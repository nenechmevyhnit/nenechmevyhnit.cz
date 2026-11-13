/** Slovníky části „Změny pravidel“ (specifikace 2026-11-13, oddíl 5, a specifikace kontroly moci, oddíl 3 a 5).
 *  Popisky sdílí web i Metodika. */
export const DRUHY_PRAVIDEL = ['zakon', 'narizeni-vlady', 'vyhlaska', 'pravidla-programu', 'usneseni-vlady', 'pokyn-ministerstva'] as const;
export type DruhPravidla = (typeof DRUHY_PRAVIDEL)[number];

export const CESTY = [
  'vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh',
  'narizeni-vlady', 'vyhlaska-ministerstva', 'pravidla-programu', 'usneseni-vlady', 'pokyn-ministerstva',
] as const;
export type Cesta = (typeof CESTY)[number];

const CESTY_DRUHU: Record<DruhPravidla, readonly Cesta[]> = {
  zakon: ['vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh'],
  'narizeni-vlady': ['narizeni-vlady'],
  vyhlaska: ['vyhlaska-ministerstva'],
  'pravidla-programu': ['pravidla-programu'],
  'usneseni-vlady': ['usneseni-vlady'],
  'pokyn-ministerstva': ['pokyn-ministerstva'],
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
  'usneseni-vlady': 'Usnesení vlády',
  'pokyn-ministerstva': 'Pokyn ministerstva',
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

/** Důvody zařazení (specifikace kontroly moci, oddíl 2). Neukládají se, odvozují se z bloků prospech a kontrolaMoci. */
export const DUVODY = ['prospech', 'kontrola-moci'] as const;
export type Duvod = (typeof DUVODY)[number];
const POPISKY_DUVODU: Record<Duvod, string> = { prospech: 'Prospěch', 'kontrola-moci': 'Kontrola moci' };
export const popisekDuvodu = (d: Duvod): string => POPISKY_DUVODU[d];

/** Věcné znaky dopadu na kontrolu moci: jeden institucionální, ostatní procedurální. */
export const DRUHY_ZNAKU = ['instituce', 'prilepek', 'legislativni-nouze', 'prvni-cteni', 'zpetna-ucinnost'] as const;
export type DruhZnaku = (typeof DRUHY_ZNAKU)[number];
const POPISKY_ZNAKU: Record<DruhZnaku, string> = {
  instituce: 'mění kontrolní instituci',
  prilepek: 'přílepek',
  'legislativni-nouze': 'legislativní nouze',
  'prvni-cteni': 'schválení v prvním čtení',
  'zpetna-ucinnost': 'zpětná účinnost',
};
export const popisekDruhuZnaku = (d: DruhZnaku): string => POPISKY_ZNAKU[d];

export const KONTROLNI_INSTITUCE = [
  'soudy', 'statni-zastupitelstvi', 'nku', 'uohs', 'ombudsman', 'policie', 'media-verejne-sluzby',
  'dohled-strany', 'cnb', 'pristup-k-informacim', 'registr-smluv',
] as const;
export type KontrolniInstituce = (typeof KONTROLNI_INSTITUCE)[number];
/** Krátký popisek se vejde do řádku přehledu, plný je pro Metodiku. */
const POPISKY_INSTITUCI: Record<KontrolniInstituce, { kratce: string; plne: string }> = {
  soudy: { kratce: 'soudy', plne: 'soudy' },
  'statni-zastupitelstvi': { kratce: 'státní zastupitelství', plne: 'státní zastupitelství' },
  nku: { kratce: 'NKÚ', plne: 'Nejvyšší kontrolní úřad' },
  uohs: { kratce: 'ÚOHS', plne: 'Úřad pro ochranu hospodářské soutěže' },
  ombudsman: { kratce: 'ombudsman', plne: 'veřejný ochránce práv' },
  policie: { kratce: 'policie a GIBS', plne: 'policie a Generální inspekce bezpečnostních sborů' },
  'media-verejne-sluzby': { kratce: 'ČT a ČRo', plne: 'Česká televize a Český rozhlas' },
  'dohled-strany': { kratce: 'dohled nad financováním stran', plne: 'Úřad pro dohled nad hospodařením politických stran a politických hnutí' },
  cnb: { kratce: 'ČNB', plne: 'Česká národní banka' },
  'pristup-k-informacim': { kratce: 'přístup k informacím', plne: 'svobodný přístup k informacím' },
  'registr-smluv': { kratce: 'registr smluv', plne: 'registr smluv' },
};
export const popisekInstituce = (i: KontrolniInstituce, delka: 'kratce' | 'plne' = 'kratce'): string => POPISKY_INSTITUCI[i][delka];
export const popisekZnaku = (z: { druh: DruhZnaku; instituce?: KontrolniInstituce }): string =>
  z.druh === 'instituce' && z.instituce ? popisekInstituce(z.instituce) : popisekDruhuZnaku(z.druh);

/** Kdo smí upozornit na znak (podmínka 4 testu). Uzavřený seznam: rozšíření je změna metodiky a jde přes PR se zdůvodněním. */
export type TypUpozornovatele = 'instituce' | 'profesni-organizace';
const UPOZORNOVATELE_DATA = {
  'ustavni-soud': { nazev: 'Ústavní soud', typ: 'instituce' },
  'legislativni-rada-vlady': { nazev: 'Legislativní rada vlády', typ: 'instituce' },
  ombudsman: { nazev: 'Veřejný ochránce práv', typ: 'instituce' },
  nku: { nazev: 'Nejvyšší kontrolní úřad', typ: 'instituce' },
  'evropska-komise': { nazev: 'Evropská komise', typ: 'instituce' },
  'benatska-komise': { nazev: 'Benátská komise', typ: 'instituce' },
  'nejvyssi-soud': { nazev: 'Nejvyšší soud', typ: 'instituce' },
  'nejvyssi-statni-zastupitelstvi': { nazev: 'Nejvyšší státní zastupitelství', typ: 'instituce' },
  'legislativni-odbor-snemovny': { nazev: 'Legislativní odbor Kanceláře Poslanecké sněmovny', typ: 'instituce' },
  'soudcovska-unie': { nazev: 'Soudcovská unie ČR', typ: 'profesni-organizace' },
  'unie-statnich-zastupcu': { nazev: 'Unie státních zástupců ČR', typ: 'profesni-organizace' },
  'ceska-advokatni-komora': { nazev: 'Česká advokátní komora', typ: 'profesni-organizace' },
  'syndikat-novinaru': { nazev: 'Syndikát novinářů ČR', typ: 'profesni-organizace' },
} as const satisfies Record<string, { nazev: string; typ: TypUpozornovatele }>;
export type Upozornovatel = keyof typeof UPOZORNOVATELE_DATA;
export const UPOZORNOVATELE = Object.keys(UPOZORNOVATELE_DATA) as [Upozornovatel, ...Upozornovatel[]];
export const upozornovatel = (id: Upozornovatel): { nazev: string; typ: TypUpozornovatele } => UPOZORNOVATELE_DATA[id];
const POPISKY_TYPU: Record<TypUpozornovatele, string> = { instituce: 'instituce', 'profesni-organizace': 'profesní organizace' };
export const popisekTypuUpozornovatele = (t: TypUpozornovatele): string => POPISKY_TYPU[t];
