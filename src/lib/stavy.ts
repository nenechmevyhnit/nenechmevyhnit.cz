export const STAVY = [
  'provereni', 'obvineni', 'obzaloba',
  'nepravomocne-odsouzen', 'pravomocne-odsouzen',
  'nepravomocne-zprosten', 'pravomocne-zprosten',
  'odlozeno', 'zastaveno', 'promlceno',
  'soudni-rizeni', 'uredni-zjisteni', 'jine',
] as const;

export type Stav = (typeof STAVY)[number];

/** Stav popisuje kauzu, ne osobu (obviněná může být i firma), proto podstatná jména, ne „odsouzen“. */
const POPISKY: Record<Stav, string> = {
  'provereni': 'Prověřování',
  'obvineni': 'Obvinění',
  'obzaloba': 'Obžaloba',
  'nepravomocne-odsouzen': 'Nepravomocné odsouzení',
  'pravomocne-odsouzen': 'Pravomocné odsouzení',
  'nepravomocne-zprosten': 'Nepravomocné zproštění',
  'pravomocne-zprosten': 'Pravomocné zproštění',
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

/** Druhý pád pro větu filtru „Ukázat kauzy ve stavu …“. */
const VE_STAVU: Record<Exclude<Stav, 'jine'>, string> = {
  'provereni': 'prověřování',
  'obvineni': 'obvinění',
  'obzaloba': 'obžaloby',
  'nepravomocne-odsouzen': 'nepravomocného odsouzení',
  'pravomocne-odsouzen': 'pravomocného odsouzení',
  'nepravomocne-zprosten': 'nepravomocného zproštění',
  'pravomocne-zprosten': 'pravomocného zproštění',
  'odlozeno': 'odložení',
  'zastaveno': 'zastavení',
  'promlceno': 'promlčení',
  'soudni-rizeni': 'soudního řízení',
  'uredni-zjisteni': 'úředního zjištění',
};

/** Volba filtru podle stavu: „ve stavu obžaloby“, u zbytkového stavu „s jiným stavem“. */
export function volbaStavu(s: Stav): string {
  return s === 'jine' ? 's jiným stavem' : `ve stavu ${VE_STAVU[s]}`;
}

/** U kterých neuzavřených kauz připomínáme presumpci neviny: trestní řízení, které pravomocně neskončilo.
 *  Audit, pokuta úřadu ani občanskoprávní spor o vině nerozhodují, tam věta nepatří. Zbytkový stav „jine“
 *  připomínku nechává, protože se pod ním může skrývat i trestní větev (například odložené prověřování). */
const S_PRESUMPCI: readonly Stav[] = ['provereni', 'obvineni', 'obzaloba', 'nepravomocne-odsouzen', 'nepravomocne-zprosten', 'jine'];
export const pripominaPresumpci = (s: Stav): boolean => S_PRESUMPCI.includes(s);
