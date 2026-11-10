export const STAVY = [
  'provereni', 'obvineni', 'obzaloba',
  'nepravomocne-odsouzen', 'pravomocne-odsouzen',
  'nepravomocne-zprosten', 'pravomocne-zprosten',
  'odlozeno', 'zastaveno', 'promlceno',
  'soudni-rizeni', 'uredni-zjisteni', 'jine',
] as const;

export type Stav = (typeof STAVY)[number];

const POPISKY: Record<Stav, string> = {
  'provereni': 'Prověřování',
  'obvineni': 'Obvinění',
  'obzaloba': 'Obžaloba',
  'nepravomocne-odsouzen': 'Nepravomocně odsouzen',
  'pravomocne-odsouzen': 'Pravomocně odsouzen',
  'nepravomocne-zprosten': 'Nepravomocně zproštěn',
  'pravomocne-zprosten': 'Pravomocně zproštěn',
  'odlozeno': 'Odloženo',
  'zastaveno': 'Zastaveno',
  'promlceno': 'Promlčeno',
  'soudni-rizeni': 'Soudní řízení',
  'uredni-zjisteni': 'Úřední zjištění',
  'jine': 'Jiné',
};

export function popisekStavu(s: Stav): string {
  return POPISKY[s];
}
