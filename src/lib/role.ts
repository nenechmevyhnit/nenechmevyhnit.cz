/** Role vazeb na mapě souvislostí (specifikace mapy, oddíl 3). Popisky sdílí web i Metodika. */
export const ROLE_VZTAHU = ['vlastni', 'zalozil', 'clen-rodiny', 'pracovni-vztah'] as const;
export const ROLE_V_KAUZE = ['prijemce-dotace', 'dodavatel-zakazky', 'ucastnik-rizeni', 'predmet-kauzy'] as const;
export const ROLE_NAVAZNOSTI = ['vychazi-z', 'souvisejici-rizeni', 'tataz-vec'] as const;
export const DRUHY_AKTERU = ['firma', 'osoba', 'nastroj'] as const;

export type RoleVztahu = (typeof ROLE_VZTAHU)[number];
export type RoleVKauze = (typeof ROLE_V_KAUZE)[number];
export type RoleNavaznosti = (typeof ROLE_NAVAZNOSTI)[number];
export type Role = RoleVztahu | RoleVKauze | RoleNavaznosti;
export type DruhAktera = (typeof DRUHY_AKTERU)[number];

const POPISKY: Record<Role, string> = {
  'vlastni': 'vlastní',
  'zalozil': 'založil',
  'clen-rodiny': 'člen rodiny',
  'pracovni-vztah': 'pracovní vztah',
  'prijemce-dotace': 'příjemce dotace',
  'dodavatel-zakazky': 'dodavatel zakázky',
  'ucastnik-rizeni': 'účastník řízení',
  'predmet-kauzy': 'předmět kauzy',
  'vychazi-z': 'vychází z',
  'souvisejici-rizeni': 'související řízení',
  'tataz-vec': 'táž věc',
};

export const popisekRole = (r: Role): string => POPISKY[r];

/** Střed mapy. Id je vyhrazené, ve slovníku aktérů být nesmí. */
export const STRED = { id: 'babis', nazev: 'Andrej Babiš' } as const;
