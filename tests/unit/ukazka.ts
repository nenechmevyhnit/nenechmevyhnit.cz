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

export function platnyAkter(): Record<string, unknown> {
  return {
    nazev: 'Fiktivní firma Alfa',
    druh: 'firma',
    overeno: '2026-11-09',
    vztahy: [{
      nadrazeny: 'babis', role: 'vlastni', od: 2005, do: null,
      popis: 'Fiktivní osoba vlastní fiktivní firmu Alfa.',
      zdroje: [{ vydavatel: 'Fiktivní rejstřík', titulek: 'Výpis', datum: '2005-02-01', druh: 'primarni', url: 'https://example.com/vypis' }],
    }],
  };
}

export function platnePravidlo(): Record<string, unknown> {
  return {
    nazev: 'Testovací novela Omega',
    shrnuti: 'Fiktivní novela by zkrátila fiktivní lhůtu k vymáhání fiktivních dotací.',
    druh: 'zakon',
    cesta: 'poslanecky-navrh',
    predkladatel: 'fiktivní poslanci A a B',
    stitky: ['dotace'],
    overeno: '2026-11-09',
    zdroje: [
      { id: 1, vydavatel: 'Fiktivní sněmovna', titulek: 'Fiktivní tisk 1', datum: '2026-06-10', druh: 'primarni', url: 'https://example.com/tisk' },
      { id: 2, vydavatel: 'Fiktivní deník', titulek: 'Fond vymáhá dotace', datum: '2026-06-12', druh: 'media', url: 'https://example.com/clanek' },
      { id: 3, vydavatel: 'Fiktivní poslanec A', titulek: 'Prohlášení', datum: '2026-06-15', druh: 'stanovisko', url: 'https://example.com/prohlaseni' },
    ],
    udalosti: [{ datum: '2026-06-10', krok: 'predlozeno', nazev: 'Návrh podán', popis: 'Fiktivní poslanci podali návrh.', zdroje: [1] }],
    prospech: {
      komu: ['agrofert'],
      zaver: 'dolozen',
      proc: { text: 'Kratší lhůta by fiktivní firmě usnadnila obranu proti vymáhání dotací.', zdroje: [2] },
      retezec: [
        { text: 'Novela by zkrátila fiktivní lhůtu z deseti na čtyři roky.', zdroje: [1] },
        { text: 'Fiktivní fond vymáhá po fiktivní firmě dotace.', zdroje: [2] },
      ],
    },
    stanovisko: { text: 'Předkladatel souvislost s firmou odmítá.', zdroje: [3] },
  };
}

/** Platné pravidlo jen s důvodem „kontrola moci“ (usnesení vlády, bez prospěchu). */
export function platnePravidloKontrolaMoci(): Record<string, unknown> {
  const p = platnePravidlo();
  delete p.prospech;
  return {
    ...p,
    nazev: 'Testovací usnesení Kappa',
    druh: 'usneseni-vlady',
    cesta: 'usneseni-vlady',
    predkladatel: 'Fiktivní ministr spravedlnosti',
    udalosti: [{ datum: '2026-01-12', krok: 'schvaleno', nazev: 'Vláda schválila usnesení', popis: 'Fiktivní vláda usnesení přijala.', zdroje: [1] }],
    kontrolaMoci: {
      znaky: [{ druh: 'instituce', instituce: 'soudy', text: 'Usnesení by svěřilo výběr fiktivních soudců ministrovi.', zdroje: [1] }],
      upozorneni: [{ kdo: 'soudcovska-unie', text: 'Unie upozornila na zásah do výběru soudců.', zdroje: [2] }],
    },
  };
}
