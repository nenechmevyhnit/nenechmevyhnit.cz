/** Kritéria zařazení kauzy do archivu (Metodika, oddíl „Co do archivu patří“). */
export const KRITERIA = ['uredni-rizeni', 'uredni-zjisteni', 'dve-redakce'] as const;
export type Kriterium = (typeof KRITERIA)[number];

const POPISKY: Record<Kriterium, string> = {
  'uredni-rizeni': 'úřední řízení',
  'uredni-zjisteni': 'úřední zjištění',
  'dve-redakce': 'doložení dvěma nezávislými redakcemi',
};

export const popisekKriteria = (k: Kriterium): string => POPISKY[k];
