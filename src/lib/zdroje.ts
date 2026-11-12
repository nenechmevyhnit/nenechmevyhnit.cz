/** Druhy zdrojů. „stanovisko“ = vyjádření dotčené strany (Babiše, jeho firem, hnutí): dokládá jen to, co strana tvrdí,
 *  ne fakta, a proto nepodkládá kritérium zařazení (viz schema.ts). */
export const DRUHY_ZDROJU = ['primarni', 'media', 'stanovisko'] as const;
export type DruhZdroje = (typeof DRUHY_ZDROJU)[number];

const POPISKY: Record<DruhZdroje, string> = {
  primarni: 'primární',
  media: 'média',
  stanovisko: 'stanovisko dotčené strany',
};

export const popisekDruhu = (d: DruhZdroje): string => POPISKY[d];

/** Skupiny zdrojů pro filtr v detailu kauzy. Primární zdroje se dělí podle vydavatele, aby šlo vybrat třeba jen soudy;
 *  data k tomu nepotřebují nové pole. Výroční zprávy a jiné dokumenty firem (vydavatel „…, a.s.“) mají vlastní skupinu,
 *  aby se nepletly s úřady. Co se nepozná jinak, patří k úřadům a registrům. */
export const SKUPINY_ZDROJU = ['soud', 'parlament', 'urad', 'firma', 'media', 'stanovisko'] as const;
export type SkupinaZdroje = (typeof SKUPINY_ZDROJU)[number];

const POPISKY_SKUPIN: Record<SkupinaZdroje, string> = {
  soud: 'Soudy',
  parlament: 'Parlament',
  urad: 'Úřady a registry',
  firma: 'Firemní dokumenty',
  media: 'Média',
  stanovisko: 'Dotčená strana',
};

export const popisekSkupiny = (s: SkupinaZdroje): string => POPISKY_SKUPIN[s];

export function skupinaZdroje(z: { druh: DruhZdroje; vydavatel: string; titulek: string }): SkupinaZdroje {
  if (z.druh !== 'primarni') return z.druh;
  // parlament dřív než soud: usnesení Evropského parlamentu vyšlé v Úředním věstníku je parlamentní dokument
  if (/sněmovn|parlament|senát|sbírka zákonů/i.test(z.vydavatel)) return 'parlament';
  if (/soud|tribunál/i.test(z.vydavatel)) return 'soud';
  // Úřední věstník EU otiskuje i žaloby a usnesení Tribunálu (věc T-…)
  if (/úřední věstník/i.test(z.vydavatel) && /tribunál|soudní dvůr|\bvěc[i]? T-|věci T-/i.test(z.titulek)) return 'soud';
  if (/,\s*(a\.\s?s\.|s\.\s?r\.\s?o\.|SE)(\s|\(|$)/.test(z.vydavatel) || /výroční zpráva/i.test(z.titulek)) return 'firma';
  return 'urad';
}
