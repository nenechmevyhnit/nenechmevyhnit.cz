import { describe, it, expect } from 'vitest';
import {
  souhrnKlubu, rozpisKlubu, nepritomni, skupinyPoslancu, hlasovaniPravidla, navazanaPravidla, vybranyKlub,
  popisekTypu, popisekVysledku, nadpisHlasovani, cisloHlasovani, odkazPsp, VETA_PROCEDURALNI,
} from '../../src/lib/hlasovani';
import { snimekSchema, type Snimek } from '../../src/lib/schema-hlasovani';
import { pravidloSchema } from '../../src/lib/schema-pravidla';
import type { PravidloZaznam } from '../../src/lib/validace';
import { platnePravidlo, platnySnimek } from './ukazka';

const snimek = (upravy: (x: any) => void = () => {}): Snimek => { const x: any = platnySnimek(); upravy(x); return snimekSchema.parse(x); };

describe('souhrnKlubu', () => {
  it('kluby podle počtu poslanců, při shodě podle názvu, nezařazení na konci', () => {
    expect(souhrnKlubu(snimek())).toEqual([
      { zkratka: 'ANO2011', popisek: 'ANO', slug: 'ano', celkem: 2, pro: 2, proti: 0, zdrzelNehlasoval: 0, omluven: 0, neprihlasen: 0 },
      { zkratka: 'ODS', popisek: 'ODS', slug: 'ods', celkem: 2, pro: 0, proti: 1, zdrzelNehlasoval: 0, omluven: 1, neprihlasen: 0 },
      { zkratka: null, popisek: 'Nezařazení', slug: 'nezarazeni', celkem: 1, pro: 0, proti: 0, zdrzelNehlasoval: 1, omluven: 0, neprihlasen: 0 },
    ]);
  });
  it('nezařazení jsou na konci, i když jich je nejvíc', () => {
    const s = snimek(x => { for (const p of x.poslanci) p.klub = null; x.poslanci[0].klub = 'ANO2011'; });
    expect(souhrnKlubu(s).map(k => k.slug)).toEqual(['ano', 'nezarazeni']);
  });
  it('zdržel se, nehlasoval i K se sčítají do jednoho sloupce', () => {
    const s = snimek(x => { x.poslanci[0].hlas = 'zdrzel'; x.poslanci[1].hlas = 'nehlasoval'; x.souhrn = { pro: 0, proti: 1, zdrzel: 1, nehlasoval: 2, prihlaseno: 4 }; });
    expect(souhrnKlubu(s)[0]).toMatchObject({ slug: 'ano', pro: 0, zdrzelNehlasoval: 2 });
  });
});

describe('rozpisKlubu', () => {
  const [ano, ods, nez] = souhrnKlubu(snimek());
  it('rozpis pro čtečky bez názvu klubu (ten je ve viditelném textu odkazu)', () => {
    expect(rozpisKlubu(ano)).toBe('2 pro, 0 proti');
    expect(rozpisKlubu(ods)).toBe('0 pro, 1 proti, 1 omluven');
    expect(rozpisKlubu(nez)).toBe('0 pro, 0 proti, 1 zdržel se nebo nehlasoval');
  });
  it('nepřítomné a nehlasující kategorie s nulou vynechá, pro a proti uvede vždy', () => {
    expect(rozpisKlubu({ ...nez, zdrzelNehlasoval: 0 })).toBe('0 pro, 0 proti');
    expect(rozpisKlubu({ ...ano, neprihlasen: 1 })).toBe('2 pro, 0 proti, 1 nepřihlášen');
  });
  it('skloňování', () => {
    expect(rozpisKlubu({ ...nez, zdrzelNehlasoval: 3, omluven: 2, neprihlasen: 5 }))
      .toBe('0 pro, 0 proti, 3 zdrželi se nebo nehlasovali, 2 omluveni, 5 nepřihlášeno');
    expect(rozpisKlubu({ ...nez, zdrzelNehlasoval: 5, neprihlasen: 1 }))
      .toBe('0 pro, 0 proti, 5 zdrželo se nebo nehlasovalo, 1 nepřihlášen');
  });
});

describe('skupiny a nepřítomní', () => {
  it('skupiny v pevném pořadí, prázdné vynechá', () =>
    expect(skupinyPoslancu(snimek().poslanci).map(g => [g.nadpis, g.poslanci.map(p => p.prijmeni)])).toEqual([
      ['Pro', ['Alfa', 'Beta']], ['Proti', ['Gama']], ['Zdržel se nebo nehlasoval', ['Delta']], ['Omluven', ['Epsilon']],
    ]));
  it('omluvení a nepřihlášení zvlášť', () => expect(nepritomni(snimek())).toEqual({ omluven: 1, neprihlasen: 0 }));
});

describe('hlasování pravidla a navázaná pravidla', () => {
  const s12 = snimek();
  const s3 = snimek(x => { x.schuze = 7; x.cislo = 3; x.datum = '2026-09-20'; });
  const snimky = new Map([['psp-10-5-12', s12], ['psp-10-7-3', s3]]);
  const udalosti = [
    { hlasovani: [{ id: 'psp-10-5-12', typ: 'proceduralni' as const, co: 'Pořad' }] },
    { hlasovani: [{ id: 'psp-10-7-3', typ: 'obsah' as const, co: 'Celek' }, { id: 'psp-10-9-9', typ: 'obsah' as const, co: 'Bez snímku' }] },
  ];
  it('od nejnovějšího, bez snímku vynechá', () =>
    expect(hlasovaniPravidla(udalosti, snimky).map(h => [h.id, h.typ, h.co])).toEqual([['psp-10-7-3', 'obsah', 'Celek'], ['psp-10-5-12', 'proceduralni', 'Pořad']]));
  it('pravidla navázaná na hlasování', () => {
    const z = (slug: string, nazev: string, hl: unknown[]): PravidloZaznam => ({ slug, telo: '', pravidlo: pravidloSchema.parse({
      ...platnePravidlo(), nazev, udalosti: [{ datum: '2026-06-10', krok: 'predlozeno', nazev: 'Návrh podán', popis: 'Fiktivní.', zdroje: [1], hlasovani: hl }],
    }) });
    const pravidla = [
      z('a', 'Novela A', [{ id: 'psp-10-5-12', typ: 'proceduralni', co: 'Pořad A' }]),
      z('b', 'Novela B', [{ id: 'psp-10-5-12', typ: 'proceduralni', co: 'Pořad B' }]),
      z('c', 'Novela C', []),
    ];
    expect(navazanaPravidla(pravidla, 'psp-10-5-12')).toEqual([
      { slug: 'a', nazev: 'Novela A', typ: 'proceduralni', co: 'Pořad A' },
      { slug: 'b', nazev: 'Novela B', typ: 'proceduralni', co: 'Pořad B' },
    ]);
  });
});

describe('vybranyKlub', () => {
  const SLUGY = ['ano', 'ods', 'nezarazeni'];
  it.each([['#ods', 'ods'], ['#ODS', 'ods'], ['ods', 'ods'], ['#nezarazeni', 'nezarazeni'], ['#neznamy', ''], ['#', ''], ['', ''], ['#%E0%A4%A', '']])(
    '%s → „%s“', (hash, cekam) => expect(vybranyKlub(hash, SLUGY)).toBe(cekam));
});

describe('popisky', () => {
  it('typ, výsledek, nadpis, číslo, odkaz', () => {
    expect(popisekTypu('proceduralni')).toBe('procedurální');
    expect(popisekTypu('obsah')).toBe('o obsahu');
    expect(popisekVysledku({ vysledek: 'prijato' })).toBe('Přijato');
    expect(popisekVysledku({ vysledek: 'zamitnuto' })).toBe('Zamítnuto');
    expect(nadpisHlasovani({ cislo: 311, schuze: 34 })).toBe('Hlasování č. 311, 34. schůze Poslanecké sněmovny');
    expect(cisloHlasovani('psp-10-34-311')).toBe('311');
    expect(odkazPsp({ idPsp: 88900 })).toBe('https://www.psp.cz/sqw/hlasy.sqw?g=88900');
    expect(VETA_PROCEDURALNI).toBe('Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.');
  });
});
