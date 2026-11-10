// Fiktivní data jen pro testy. Neodkazují na skutečné osoby ani události.
export function platnaKauza(): Record<string, unknown> {
  return {
    typ: 'kauza',
    nazev: 'Testovací kauza Alfa',
    shrnuti: 'Fiktivní firma Alfa získala fiktivní dotaci.',
    od: 2010,
    do: null,
    stav: 'soudni-rizeni',
    stavPoznamka: 'Fiktivní stav.',
    stitky: ['dotace'],
    overeno: '2026-11-09',
    zdroje: [
      { id: 1, vydavatel: 'Fiktivní soud', titulek: 'Rozsudek', datum: '2012-01-09', druh: 'primarni', url: 'https://example.com/rozsudek' },
      { id: 2, vydavatel: 'Fiktivní deník', titulek: 'Článek', datum: '2011-05', druh: 'media', url: 'https://example.com/clanek' },
    ],
    udalosti: [
      { datum: '2010-03', nazev: 'Žádost o dotaci', popis: 'Firma Alfa žádá o dotaci.', zdroje: [2] },
      { datum: '2012-01-09', nazev: 'Rozsudek', popis: 'Soud rozhodl.', zdroje: [1] },
    ],
    stanovisko: { text: 'Firma Alfa pochybení odmítá.', zdroje: [2] },
    kriterium: 'uredni-rizeni',
    proc: { text: 'Fiktivní soud řeší, zda fiktivní dotace neměla být vyplacena.', zdroje: [1] },
  };
}
