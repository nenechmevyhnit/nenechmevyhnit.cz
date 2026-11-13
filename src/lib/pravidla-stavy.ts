import type { DruhPravidla } from './pravidla-slovnik';

/** Kroky projednávání (specifikace 2026-11-13, oddíl 5). Stav pravidla je krok poslední události, která ho má. */
export const KROKY = [
  'pripominkove-rizeni', 'predlozeno', 'schvaleno-snemovnou', 'schvaleno-senatem', 'vraceno-senatem',
  'vetovano', 'podepsano', 'schvaleno', 'vyhlaseno', 'zamitnuto', 'stazeno', 'zruseno', 'zruseno-us',
] as const;
export type Krok = (typeof KROKY)[number];

const KROKY_ZAKONA: readonly Krok[] = [
  'pripominkove-rizeni', 'predlozeno', 'schvaleno-snemovnou', 'schvaleno-senatem', 'vraceno-senatem',
  'vetovano', 'podepsano', 'vyhlaseno', 'zamitnuto', 'stazeno', 'zruseno-us',
];
const KROKY_OSTATNI: readonly Krok[] = ['pripominkove-rizeni', 'schvaleno', 'vyhlaseno', 'zruseno', 'zruseno-us'];
export const krokyProDruh = (d: DruhPravidla): readonly Krok[] => (d === 'zakon' ? KROKY_ZAKONA : KROKY_OSTATNI);

export const UKONCUJICI: readonly Krok[] = ['zamitnuto', 'stazeno', 'zruseno', 'zruseno-us'];
const VRACENI: readonly Krok[] = ['vraceno-senatem', 'vetovano'];

const POPISKY: Record<Krok, string> = {
  'pripominkove-rizeni': 'Připomínkové řízení',
  predlozeno: 'Předloženo',
  'schvaleno-snemovnou': 'Schváleno Sněmovnou',
  'schvaleno-senatem': 'Schváleno Senátem',
  'vraceno-senatem': 'Vráceno Senátem',
  vetovano: 'Vráceno prezidentem',
  podepsano: 'Podepsáno prezidentem',
  schvaleno: 'Schváleno',
  vyhlaseno: 'Vyhlášeno',
  zamitnuto: 'Zamítnuto',
  stazeno: 'Staženo',
  zruseno: 'Zrušeno',
  'zruseno-us': 'Zrušeno Ústavním soudem',
};
export const popisekKroku = (k: Krok): string => POPISKY[k];

/** Schéma zaručuje aspoň jednu událost s krokem; výjimka značí chybu programu, ne obsahu. */
export function stavPravidla(udalosti: readonly { krok?: Krok }[]): Krok {
  for (let i = udalosti.length - 1; i >= 0; i--) {
    const k = udalosti[i].krok;
    if (k) return k;
  }
  throw new Error('Pravidlo nemá žádnou událost s krokem projednávání');
}

export const vProjednavani = (s: Krok): boolean => s !== 'vyhlaseno' && !UKONCUJICI.includes(s);

export type Faze = { id: string; nazev: string; datum: string | null; udalost: number | null; poznamka: string | null; hotovo: boolean };

const FAZE_ZAKONA: { id: string; nazev: string; kroky: readonly Krok[] }[] = [
  { id: 'podano', nazev: 'Podáno', kroky: ['predlozeno'] },
  { id: 'snemovna', nazev: 'Sněmovna', kroky: ['schvaleno-snemovnou'] },
  { id: 'senat', nazev: 'Senát', kroky: ['schvaleno-senatem', 'vraceno-senatem'] },
  { id: 'podpis', nazev: 'Podpis', kroky: ['podepsano', 'vetovano'] },
  { id: 'vyhlaseno', nazev: 'Vyhlášeno', kroky: ['vyhlaseno'] },
];
const FAZE_OSTATNI: typeof FAZE_ZAKONA = [
  { id: 'pripominky', nazev: 'Připomínky', kroky: ['pripominkove-rizeni'] },
  { id: 'schvaleno', nazev: 'Schváleno', kroky: ['schvaleno'] },
  { id: 'vyhlaseno', nazev: 'Vyhlášeno', kroky: ['vyhlaseno'] },
];

/** Fáze pro ukazatel průběhu. Fáze bere poslední událost, jejíž krok k ní patří. Vrácení (Senát, veto)
 *  fázi nedokončí, jen ji označí poznámkou; Sněmovna pak hlasuje znovu a její fáze dostane novější datum. */
export function prubeh(druh: DruhPravidla, udalosti: readonly { datum: string; krok?: Krok }[]): { faze: Faze[]; konec: { krok: Krok; datum: string; udalost: number } | null } {
  const faze = (druh === 'zakon' ? FAZE_ZAKONA : FAZE_OSTATNI).map(f => {
    let i = -1;
    udalosti.forEach((u, j) => { if (u.krok && f.kroky.includes(u.krok)) i = j; });
    const krok = i >= 0 ? udalosti[i].krok! : null;
    const vraceno = krok !== null && VRACENI.includes(krok);
    return {
      id: f.id,
      nazev: f.nazev,
      datum: i >= 0 ? udalosti[i].datum : null,
      udalost: i >= 0 ? i : null,
      poznamka: vraceno ? POPISKY[krok!] : null,
      hotovo: krok !== null && !vraceno,
    };
  });
  let konec: { krok: Krok; datum: string; udalost: number } | null = null;
  udalosti.forEach((u, j) => { if (u.krok && UKONCUJICI.includes(u.krok)) konec = { krok: u.krok, datum: u.datum, udalost: j }; });
  return { faze, konec };
}
