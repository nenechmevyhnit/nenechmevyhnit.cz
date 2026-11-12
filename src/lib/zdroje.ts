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
