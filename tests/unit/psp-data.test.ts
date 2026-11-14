import { describe, it, expect } from 'vitest';
import { parse as parseYaml } from 'yaml';
import {
  ChybaPsp, ctiUnl, dekodujUnl, datumZPsp, hlasZKodu, klubVDobe, sestavSnimek, snimekNaYaml, bezDataStazeni,
  idHlasovaniZPravidla, rozeberIdHlasovani, type VstupPsp,
} from '../../src/lib/psp-data';
import { snimekSchema } from '../../src/lib/schema-hlasovani';

const ORGAN = '174';
const CIL = { obdobi: 10, schuze: 34, cislo: 311 };
const KLUBY = new Map([['1750', 'ANO2011'], ['1751', 'ODS']]);

/** Syntetická data PSP: 200 poslanců (id_poslanec 1001–1200, id_osoba 1–200), osoby 1–120 v klubu ANO2011,
 *  121–190 v ODS, 191–200 bez klubu. Souhrn hlasování se dopočítá z kódů (K se počítá jako „zdržel se“). */
function vstup(kody: string[] = Array(200).fill('A'), upravy: Partial<VstupPsp> = {}): VstupPsp {
  const n = Array.from({ length: 200 }, (_, i) => i + 1);
  const pocet = (...k: string[]) => String(kody.filter(x => k.includes(x)).length);
  return {
    hlasovani: [['88000', ORGAN, '34', '311', '0', '03.11.2026', '17:14', pocet('A'), pocet('B', 'N'), pocet('C', 'K'), pocet('F'),
      String(200 - Number(pocet('@', 'M'))), '79', 'N', 'A', 'Pořad schůze', '']],
    hlasy: n.map(i => [String(1000 + i), '88000', kody[i - 1]]),
    omluvy: [],
    zmatecne: [],
    osoby: n.map(i => [String(i), '', `Příjmení${String(i).padStart(3, '0')}`, `Jméno${i}`, '', '01.01.1970', 'M', '', '']),
    poslanci: n.map(i => [String(1000 + i), String(i), '1', '1', ORGAN]),
    organy: [[ORGAN, '', '11', 'PSP10', 'Poslanecká sněmovna'], ['1750', ORGAN, '1', 'ANO2011', 'Poslanecký klub ANO 2011'], ['1751', ORGAN, '1', 'ODS', 'Poslanecký klub ODS']],
    zarazeni: n.filter(i => i <= 190).map(i => [String(i), i <= 120 ? '1750' : '1751', '0', '2025-10-08 00', '']),
    ...upravy,
  };
}
const kody = (zmeny: Record<number, string>) => Array.from({ length: 200 }, (_, i) => zmeny[i] ?? 'A');

describe('čtení souborů PSP', () => {
  it('rozdělí řádky a sloupce, zahodí koncové svislítko a prázdné řádky', () =>
    expect(ctiUnl('1|a|b||\r\n\n2|c|d|e|\n')).toEqual([['1', 'a', 'b', ''], ['2', 'c', 'd', 'e']]));
  it('dekóduje windows-1250', () =>
    expect(dekodujUnl(Uint8Array.from([0x50, 0xf8, 0xed, 0x6b, 0x6c, 0x61, 0x64]))).toBe('Příklad'));
  it('převede datum DD.MM.RRRR', () => {
    expect(datumZPsp('03.11.2026')).toBe('2026-11-03');
    expect(() => datumZPsp('3. 11. 2026')).toThrow(ChybaPsp);
  });
});

describe('hlasZKodu', () => {
  it.each([['A', 'pro'], ['B', 'proti'], ['N', 'proti'], ['C', 'zdrzel'], ['F', 'nehlasoval'], ['K', 'zdrzel-nehlasoval'], ['M', 'omluven']])(
    'kód %s → %s', (kod, hlas) => expect(hlasZKodu(kod, false)).toBe(hlas));
  it('@ s omluvou je omluven, bez ní nepřihlášen', () => {
    expect(hlasZKodu('@', true)).toBe('omluven');
    expect(hlasZKodu('@', false)).toBe('neprihlasen');
  });
  it('neznámý kód (W, před složením slibu) je chyba', () => expect(() => hlasZKodu('W', false)).toThrow(/Neznámý kód hlasu „W“/));
});

describe('klubVDobe', () => {
  const clenstvi = [
    ['7', '1750', '0', '2025-10-08 00', '2026-11-03 12'],
    ['7', '1751', '0', '2026-11-03 12', ''],
    ['8', '1750', '0', '2025-10-08 00', '2026-11-03 18'],
  ];
  it('přestup před hlasováním ve stejný den: platí nový klub', () => expect(klubVDobe('7', '2026-11-03 17:14', KLUBY, clenstvi)).toBe('ODS'));
  it('odchod až po hlasování: platí starý klub', () => expect(klubVDobe('8', '2026-11-03 17:14', KLUBY, clenstvi)).toBe('ANO2011'));
  it('po odchodu bez nového klubu: nezařazený', () => expect(klubVDobe('8', '2026-11-04 09:00', KLUBY, clenstvi)).toBeNull());
  it('bez členství: nezařazený', () => expect(klubVDobe('9', '2026-11-03 17:14', KLUBY, clenstvi)).toBeNull());
});

describe('sestavSnimek', () => {
  it('sestaví snímek se souhrnem, kluby a poslanci seřazenými podle české abecedy', () => {
    const s = sestavSnimek(vstup(), CIL, '2026-11-14');
    expect(snimekSchema.parse(s)).toEqual(s);
    expect(s).toMatchObject({ komora: 'psp', obdobi: 10, schuze: 34, cislo: 311, idPsp: 88000, datum: '2026-11-03', cas: '17:14',
      nazevPsp: 'Pořad schůze', vysledek: 'prijato', kvorum: 79, stazeno: '2026-11-14' });
    expect(s.souhrn).toEqual({ pro: 200, proti: 0, zdrzel: 0, nehlasoval: 0, prihlaseno: 200 });
    expect(s.kluby).toEqual({ ANO2011: 'Poslanecký klub ANO 2011', ODS: 'Poslanecký klub ODS' });
    expect(s.poslanci).toHaveLength(200);
    expect(s.poslanci[0]).toEqual({ id: 1, jmeno: 'Jméno1', prijmeni: 'Příjmení001', klub: 'ANO2011', hlas: 'pro' });
    expect(s.poslanci.find(p => p.id === 195)?.klub).toBeNull();
  });
  it('pseudoklub Nezařaz z dat PSP znamená bez klubu, ne klub', () => {
    const v = vstup();
    v.organy.push(['1894', ORGAN, '1', 'Nezařaz', 'Nezařazení']);
    v.zarazeni = v.zarazeni.filter(z => z[0] !== '5').concat([
      ['5', '1750', '0', '2025-10-08 00', '2026-11-01 00'],
      ['5', '1894', '0', '2026-11-01 00', ''],
    ]);
    const s = sestavSnimek(v, CIL, '2026-11-14');
    expect(s.poslanci.find(p => p.id === 5)?.klub).toBeNull();
    expect(s.kluby).not.toHaveProperty('Nezařaz');
  });
  it('česká abeceda: Ch až za H, Č za C', () => {
    const v = vstup();
    v.osoby[0][2] = 'Chalupa'; v.osoby[1][2] = 'Hora'; v.osoby[2][2] = 'Čáp'; v.osoby[3][2] = 'Cyril';
    const jmena = sestavSnimek(v, CIL, '2026-11-14').poslanci.slice(0, 4).map(p => p.prijmeni);
    expect(jmena).toEqual(['Cyril', 'Čáp', 'Hora', 'Chalupa']);
  });
  it('nepřihlášený s omluvou na čas hlasování je omluven, s omluvou na jiný čas nepřihlášen', () => {
    const v = vstup(kody({ 0: '@', 1: '@', 2: '@' }), {
      omluvy: [[ORGAN, '1001', '03.11.2026', '16:00', '17:30'], [ORGAN, '1002', '03.11.2026', '', ''], [ORGAN, '1003', '03.11.2026', '09:00', '12:00']],
    });
    const hlas = (id: number) => sestavSnimek(v, CIL, '2026-11-14').poslanci.find(p => p.id === id)?.hlas;
    expect([hlas(1), hlas(2), hlas(3)]).toEqual(['omluven', 'omluven', 'neprihlasen']);
  });
  it('K se ve snímku zachová a součty sedí', () => {
    const s = sestavSnimek(vstup(kody({ 0: 'K', 1: 'B' })), CIL, '2026-11-14');
    expect(s.poslanci.filter(p => p.hlas === 'zdrzel-nehlasoval')).toHaveLength(1);
    expect(s.souhrn).toMatchObject({ pro: 198, proti: 1, zdrzel: 1 });
  });
  it.each([
    ['hlasování neexistuje', vstup(), { ...CIL, cislo: 999 }, /hlasování v datech PSP není/],
    ['jiné volební období', vstup(), { ...CIL, obdobi: 9 }, /nepatří do 9\. volebního období/],
    ['zmatečné', vstup(undefined, { zmatecne: [['88000']] }), CIL, /zmatečné/],
    ['ruční hlasování', (() => { const v = vstup(); v.hlasovani[0][13] = 'R'; return v; })(), CIL, /nejde o běžné hlasování/],
    ['neznámý výsledek', (() => { const v = vstup(); v.hlasovani[0][14] = 'X'; return v; })(), CIL, /neznámý výsledek hlasování „X“/],
    ['méně než 200 hlasů', (() => { const v = vstup(); v.hlasy.pop(); return v; })(), CIL, /199 jmenovitých hlasů místo 200/],
    ['neznámý kód hlasu', vstup(kody({ 5: 'W' })), CIL, /Neznámý kód hlasu „W“/],
    ['nesedící součty', (() => { const v = vstup(); v.hlasovani[0][7] = '199'; return v; })(), CIL, /součty nesedí \(pro: jmenovitě 200, v souhrnu 199/],
  ])('chyba: %s', (_, v, cil, hlaska) => expect(() => sestavSnimek(v, cil, '2026-11-14')).toThrow(hlaska));
});

describe('YAML snímku', () => {
  const s = sestavSnimek(vstup(kody({ 0: 'B' })), CIL, '2026-11-14');
  const yaml = snimekNaYaml(s);
  it('po načtení vrátí stejný snímek', () => expect(snimekSchema.parse(parseYaml(yaml))).toEqual(s));
  it('hlavička říká, že soubor vyrábí skript, a obsahuje odkaz k ověření', () => {
    expect(yaml.startsWith('# Vygenerováno skriptem scripts/stahni-hlasovani.ts z otevřených dat PSP. Ručně neupravovat.\n# Ověřit: https://www.psp.cz/sqw/hlasy.sqw?g=88000\n')).toBe(true);
  });
  it('poslanec je na jednom řádku', () => expect(yaml).toMatch(/^ {2}- \{ id: 1, jmeno: Jméno1, prijmeni: Příjmení001, klub: ANO2011, hlas: proti \}$/m));
  it('čas je v uvozovkách', () => expect(yaml).toMatch(/^cas: '17:14'$/m));
  it('dva snímky lišící se jen datem stažení jsou stejné', () =>
    expect(bezDataStazeni(snimekNaYaml({ ...s, stazeno: '2026-11-20' }))).toBe(bezDataStazeni(yaml)));
  it('jiná data se liší', () =>
    expect(bezDataStazeni(snimekNaYaml({ ...s, kvorum: 80 }))).not.toBe(bezDataStazeni(yaml)));
});

describe('id hlasování v pravidlech', () => {
  it('sebere id ze všech událostí', () => expect(idHlasovaniZPravidla({
    udalosti: [{ hlasovani: [{ id: 'psp-10-34-32' }] }, { nazev: 'bez hlasování' }, { hlasovani: [{ id: 'psp-10-34-311' }, { id: 5 }] }],
  })).toEqual(['psp-10-34-32', 'psp-10-34-311']));
  it('bez událostí nic', () => {
    expect(idHlasovaniZPravidla({})).toEqual([]);
    expect(idHlasovaniZPravidla(null)).toEqual([]);
  });
  it('rozebere id', () => expect(rozeberIdHlasovani('psp-10-34-311')).toEqual({ obdobi: 10, schuze: 34, cislo: 311 }));
  it('id v jiném tvaru je chyba', () => expect(() => rozeberIdHlasovani('senat-1-2-3')).toThrow(ChybaPsp));
});
