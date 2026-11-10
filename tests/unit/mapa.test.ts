import { describe, it, expect } from 'vitest';
import { overAdresar } from '../../src/lib/validace';
import { sestavGraf, rozlozMapu, viditelneUzly, zvyrazneni, vazbyKauzy, idKauzy, idAktera, ROZMERY } from '../../src/lib/mapa';

const { zaznamy, akteri } = overAdresar('tests/fixtures/obsah');
const graf = sestavGraf(zaznamy, akteri);
const uzel = (id: string) => graf.uzly.find(u => u.id === id)!;

describe('sestavGraf', () => {
  it('střed, tři aktéři a šest kauz', () => {
    expect(graf.uzly).toHaveLength(10);
    expect(uzel('babis')).toMatchObject({ typ: 'stred', nazev: 'Andrej Babiš', hloubka: 0 });
  });
  it('hloubka aktéra je nejdelší cesta ke středu', () => {
    expect(uzel(idAktera('fond-sigma')).hloubka).toBe(1);
    expect(uzel(idAktera('holding-omega')).hloubka).toBe(2);
    expect(uzel(idAktera('firma-alfa')).hloubka).toBe(3);
  });
  it('hlavní strom: aktéři před kauzami, kauzy podle začátku', () => {
    expect(graf.deti['babis']).toEqual(['a:fond-sigma', 'k:beta-archiv', 'k:gama-offshore', 'k:delta-dluhopisy']);
    expect(graf.deti['a:fond-sigma']).toEqual(['a:holding-omega', 'k:epsilon-fondy']);
    expect(graf.deti['a:holding-omega']).toEqual(['a:firma-alfa', 'k:zeta-stret']);
    expect(graf.deti['a:firma-alfa']).toEqual(['k:alfa-dotace']);
  });
  it('hrany: čtyři vztahy, tři aktéři v kauzách, tři kauzy pod středem, dvě návaznosti', () => {
    const pocet = (d: string) => graf.hrany.filter(h => h.druh === d).length;
    expect([pocet('vztah'), pocet('akter'), pocet('stred'), pocet('navaznost')]).toEqual([4, 3, 3, 2]);
  });
  it('aktér s více vztahy: hlavní je ten k nejhlubšímu nadřazenému, oba mají roli a období', () => {
    const vztahy = graf.hrany.filter(h => h.druh === 'vztah' && h.potomek === 'a:holding-omega');
    expect(vztahy.map(h => [h.rodic, h.hlavni, h.roleText, h.obdobi])).toEqual([
      ['babis', false, 'vlastní', '1995–2017'],
      ['a:fond-sigma', true, 'vlastní', '2017 – dosud'],
    ]);
  });
  it('vazba aktéra v kauze nese popis a plné zdroje z kauzy', () => {
    const h = graf.hrany.find(h => h.druh === 'akter' && h.potomek === 'k:alfa-dotace')!;
    expect(h).toMatchObject({ rodic: 'a:firma-alfa', roleText: 'příjemce dotace', popis: 'Firma Alfa žádala o fiktivní dotaci pro malé podniky.' });
    expect(h.zdroje[0].url).toBe('https://example.com/alfa/clanek');
  });
  it('návaznost vede od kauzy, na kterou se navazuje, k navazující', () => {
    const h = graf.hrany.find(h => h.druh === 'navaznost' && h.potomek === 'k:zeta-stret')!;
    expect(h).toMatchObject({ rodic: 'k:alfa-dotace', roleText: 'související řízení', hlavni: false });
  });
  it('graf jde převést na JSON a zpět beze ztráty', () => expect(JSON.parse(JSON.stringify(graf))).toEqual(graf));
});

describe('viditelneUzly', () => {
  it('bez filtru je vidět vše', () => expect(viditelneUzly(graf, null).size).toBe(10));
  it('aktér zůstane, jen když pod ním zbyde kauza', () => {
    expect([...viditelneUzly(graf, ['epsilon-fondy'])].sort()).toEqual(['a:fond-sigma', 'babis', 'k:epsilon-fondy']);
  });
  it('prázdný filtr nechá jen střed', () => expect([...viditelneUzly(graf, [])]).toEqual(['babis']));
});

describe('rozlozMapu', () => {
  const r = rozlozMapu(graf, null);
  const m = (id: string) => r.uzly.find(u => u.id === id)!;
  it('sloupce podle hloubky a kauzy vpravo', () => {
    expect(m('babis').x).toBe(ROZMERY.okraj);
    expect(m('a:fond-sigma').x).toBe(ROZMERY.okraj + ROZMERY.stred + ROZMERY.mezera);
    const kauzyX = m('k:alfa-dotace').x;
    expect(new Set(r.uzly.filter(u => u.typ === 'kauza').map(u => u.x))).toEqual(new Set([kauzyX]));
    expect(kauzyX).toBe(ROZMERY.okraj + ROZMERY.stred + ROZMERY.mezera + 2 * (ROZMERY.akter + ROZMERY.mezera) + ROZMERY.akter + ROZMERY.mezera);
    expect(r.sirka).toBe(kauzyX + ROZMERY.kauza + ROZMERY.oblouky);
  });
  it('řádky v pořadí průchodu stromem, rodič uprostřed svých listů', () => {
    const poradi = r.uzly.filter(u => u.typ === 'kauza').sort((a, b) => a.y - b.y).map(u => u.id);
    expect(poradi).toEqual(['k:alfa-dotace', 'k:zeta-stret', 'k:epsilon-fondy', 'k:beta-archiv', 'k:gama-offshore', 'k:delta-dluhopisy']);
    expect(m('k:alfa-dotace').y).toBe(31);
    expect(m('a:holding-omega').y).toBe(46);
    expect(m('a:fond-sigma').y).toBe(61);
    expect(m('babis').y).toBe(106);
    expect(r.vyska).toBe(2 * 16 + 6 * 30);
  });
  it('každá hrana má čáru, popisek jen hrany s rolí', () => {
    expect(r.cary).toHaveLength(12);
    expect(r.cary.filter(c => c.druh === 'stred').every(c => c.popisek === null)).toBe(true);
    expect(r.cary.find(c => c.druh === 'vztah' && c.popisek?.includes('1995–2017'))?.popisek).toBe('vlastní · 1995–2017');
  });
  it('návaznost je oblouk napravo od sloupce kauz', () => {
    const c = r.cary.find(c => c.druh === 'navaznost')!;
    expect(c.d.startsWith(`M${m('k:alfa-dotace').x + ROZMERY.kauza} `)).toBe(true);
  });
  it('filtr přepočítá rozložení bez prázdných míst', () => {
    const f = rozlozMapu(graf, ['beta-archiv']);
    expect(f.uzly.map(u => u.id).sort()).toEqual(['babis', 'k:beta-archiv']);
    expect(f.cary).toHaveLength(1);
    expect(f.vyska).toBe(2 * 16 + 30);
  });
  it('nic viditelného = prázdné rozložení', () => expect(rozlozMapu(graf, [])).toEqual({ sirka: 0, vyska: 0, uzly: [], cary: [] }));
});

describe('zvyrazneni', () => {
  it('kauza: cesta ke středu přes všechny vztahy a navazující kauzy', () => {
    const z = zvyrazneni(graf, idKauzy('alfa-dotace'));
    expect([...z.uzly].sort()).toEqual(['a:firma-alfa', 'a:fond-sigma', 'a:holding-omega', 'babis', 'k:alfa-dotace', 'k:zeta-stret']);
    expect(z.hrany.size).toBe(6);
  });
  it('aktér: nadřazení i vše pod ním, ne sousední větve', () => {
    const z = zvyrazneni(graf, idAktera('holding-omega'));
    expect([...z.uzly].sort()).toEqual(['a:firma-alfa', 'a:fond-sigma', 'a:holding-omega', 'babis', 'k:alfa-dotace', 'k:zeta-stret']);
    expect(z.uzly.has('k:epsilon-fondy')).toBe(false);
  });
  it('střed zvýrazní vše', () => expect(zvyrazneni(graf, 'babis').uzly.size).toBe(10));
});

describe('vazbyKauzy', () => {
  it('aktéři, návaznosti a dopočítaný opačný směr', () => {
    expect(vazbyKauzy(zaznamy, akteri, 'zeta-stret')).toEqual({
      akteri: [{ nazev: 'Holding Omega', roleText: 'předmět kauzy', popis: 'Fiktivní úřad posuzuje střet zájmů u Holdingu Omega.', zdroje: [1] }],
      navazuje: [{ slug: 'alfa-dotace', nazev: 'Testovací kauza Alfa', roleText: 'související řízení', popis: 'Řízení se týká stejné fiktivní dotace jako kauza Alfa.', zdroje: [1] }],
      navazujiNaNi: [{ slug: 'epsilon-fondy', nazev: 'Testovací kauza Epsilon, delší název' }],
    });
  });
  it('kauza bez vazeb a neznámá kauza', () => {
    expect(vazbyKauzy(zaznamy, akteri, 'beta-archiv')).toEqual({ akteri: [], navazuje: [], navazujiNaNi: [] });
    expect(vazbyKauzy(zaznamy, akteri, 'neni')).toEqual({ akteri: [], navazuje: [], navazujiNaNi: [] });
  });
});
