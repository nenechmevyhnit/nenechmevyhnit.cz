/** Jediné místo s údaji o webu. Název ani doménu nikam nepiš ručně:
 *  tests/unit/kostra.test.ts hlídá, že se nevrátí starý název projektu. */
export const WEB = {
  nazev: 'Posuďte sami',
  domena: 'https://posudtesami.cz',
  popis: 'Archiv kauz Andreje Babiše přehledně, s daty a zdroji. Každé tvrzení má zdroj, každá kauza stanovisko dotčené strany.',
} as const;

/** Titulek stránky: „<co> — Posuďte sami“. */
export const titulek = (co: string): string => `${co} — ${WEB.nazev}`;
