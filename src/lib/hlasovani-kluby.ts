export type Klub = { popisek: string; slug: string };

/** Poslanecké kluby podle zkratky v otevřených datech PSP (organy.unl, orgány typu 1). Popisek je krátký tvar
 *  pro web, slug je kotva na stránce hlasování (#ano). Neznámá zkratka je chyba buildu (spec hlasování, oddíl 4). */
export const KLUBY: Record<string, Klub> = {
  ANO2011: { popisek: 'ANO', slug: 'ano' },
  SPD: { popisek: 'SPD', slug: 'spd' },
  MS: { popisek: 'Motoristé', slug: 'motoriste' },
  ODS: { popisek: 'ODS', slug: 'ods' },
  STAN: { popisek: 'STAN', slug: 'stan' },
  'Piráti': { popisek: 'Piráti', slug: 'pirati' },
  'KDU-ČSL': { popisek: 'KDU-ČSL', slug: 'kdu-csl' },
  TOP09: { popisek: 'TOP 09', slug: 'top-09' },
};

/** Poslanec bez klubu má ve snímku klub null. */
export const NEZARAZENI = { popisek: 'Nezařazení', slug: 'nezarazeni' } as const;

export const klub = (zkratka: string | null): Klub | undefined =>
  zkratka === null ? NEZARAZENI : Object.hasOwn(KLUBY, zkratka) ? KLUBY[zkratka] : undefined;
