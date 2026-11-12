import { describe, it, expect } from 'vitest';
import { overAdresar } from '../../src/lib/validace';
import { sestavGraf, rozlozMapu, viditelneUzly, zvyrazneni, vazbyKauzy, idKauzy, idAktera, ROZMERY, sirkaNazvu, kartaUzlu, kartaHrany, kauzaHrany, nadpisHrany, type Karta } from '../../src/lib/mapa';

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
  it('hrany: pět vztahů, čtyři aktéři v kauzách, tři kauzy pod středem, dvě návaznosti', () => {
    const pocet = (d: string) => graf.hrany.filter(h => h.druh === d).length;
    expect([pocet('vztah'), pocet('akter'), pocet('stred'), pocet('navaznost')]).toEqual([5, 4, 3, 2]);
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
  it('sloupce podle hloubky a kauzy vpravo, šířka sloupce podle nejdelšího názvu', () => {
    expect(m('babis').x).toBe(ROZMERY.okraj);
    expect(m('a:fond-sigma').x).toBe(ROZMERY.okraj + m('babis').w + ROZMERY.mezera);
    expect(m('a:holding-omega').x).toBe(m('a:fond-sigma').x + m('a:fond-sigma').w + ROZMERY.mezera);
    expect(m('a:firma-alfa').x).toBe(m('a:holding-omega').x + m('a:holding-omega').w + ROZMERY.mezera);
    const kauzy = r.uzly.filter(u => u.typ === 'kauza');
    const kauzyX = m('k:alfa-dotace').x;
    expect(new Set(kauzy.map(u => u.x))).toEqual(new Set([kauzyX]));
    expect(kauzyX).toBe(m('a:firma-alfa').x + m('a:firma-alfa').w + ROZMERY.mezera);
    expect(new Set(kauzy.map(u => u.w)).size).toBe(1);
    expect(m('k:alfa-dotace').w).toBeGreaterThanOrEqual(Math.max(...kauzy.map(u => sirkaNazvu(u.nazev))) + 2 * ROZMERY.odsazeniTextu);
    expect(m('a:fond-sigma').w).toBeGreaterThanOrEqual(ROZMERY.minAkter);
    expect(r.sirka).toBe(kauzyX + m('k:alfa-dotace').w + ROZMERY.oblouky);
  });
  it('odhad šířky názvu: velká písmena širší, mezery užší, tučné písmo širší', () => {
    expect(sirkaNazvu('AAAA')).toBeGreaterThan(sirkaNazvu('aaaa'));
    expect(sirkaNazvu('a a')).toBeLessThan(sirkaNazvu('aaa'));
    expect(sirkaNazvu('Andrej Babiš', true)).toBeGreaterThan(sirkaNazvu('Andrej Babiš'));
  });
  it('řádky v pořadí průchodu stromem, rodič na řádku prvního potomka', () => {
    const poradi = r.uzly.filter(u => u.typ === 'kauza').sort((a, b) => a.y - b.y).map(u => u.id);
    expect(poradi).toEqual(['k:alfa-dotace', 'k:zeta-stret', 'k:epsilon-fondy', 'k:beta-archiv', 'k:gama-offshore', 'k:delta-dluhopisy']);
    const radek = (n: number) => ROZMERY.okraj + n * ROZMERY.radek;
    expect(m('k:alfa-dotace').y).toBe(radek(0.5));
    expect(m('k:zeta-stret').y).toBe(radek(1.5));
    for (const u of ['babis', 'a:fond-sigma', 'a:holding-omega', 'a:firma-alfa']) expect(m(u).y).toBe(radek(0.5));
    expect(r.vyska).toBe(2 * ROZMERY.okraj + 6 * ROZMERY.radek);
  });
  it('každá hrana má čáru', () => expect(r.cary.map(c => c.id).sort()).toEqual(graf.hrany.map(h => h.id).sort()));
  it('hlavní strom je z lomených čar se sdíleným kmenem, vedlejší vazby jsou oblouky pod ním', () => {
    const hlavni = r.cary.filter(c => c.hlavni);
    expect(hlavni.map(c => c.id).sort()).toEqual(graf.hrany.filter(h => h.hlavni).map(h => h.id).sort());
    const kBete = hlavni.find(c => c.id === graf.hrany.find(h => h.potomek === 'k:beta-archiv')!.id)!;
    const kmen = m('babis').x + m('babis').w + ROZMERY.kmen;
    expect(kBete.d).toContain(` V`);
    expect(kBete.d.endsWith(`H${m('k:beta-archiv').x}`)).toBe(true);
    // klepnout jde jen na vodorovný úsek k potomkovi, kmen sdílí víc čar
    expect(kBete.dz).toBe(`M${kmen} ${m('k:beta-archiv').y} H${m('k:beta-archiv').x}`);
    expect(r.cary.filter(c => !c.hlavni).every(c => c.d.includes(' C'))).toBe(true);
    const prvniHlavni = r.cary.findIndex(c => c.hlavni);
    expect(r.cary.slice(prvniHlavni).every(c => c.hlavni)).toBe(true);
  });
  it('mezi uzly sousedních řádků zůstává mezera', () => expect(ROZMERY.radek - ROZMERY.vyskaUzlu).toBeGreaterThanOrEqual(8));
  it('návaznost je oblouk napravo od sloupce kauz', () => {
    const c = r.cary.find(c => c.druh === 'navaznost')!;
    expect(c.d.startsWith(`M${m('k:alfa-dotace').x + m('k:alfa-dotace').w} `)).toBe(true);
    expect(c.hlavni).toBe(false);
  });
  it('filtr přepočítá rozložení bez prázdných míst', () => {
    const f = rozlozMapu(graf, ['beta-archiv']);
    expect(f.uzly.map(u => u.id).sort()).toEqual(['babis', 'k:beta-archiv']);
    expect(f.cary).toHaveLength(1);
    expect(f.vyska).toBe(2 * ROZMERY.okraj + ROZMERY.radek);
  });
  it('nic viditelného = prázdné rozložení', () => expect(rozlozMapu(graf, [])).toEqual({ sirka: 0, vyska: 0, uzly: [], cary: [] }));
});

describe('karta vazeb', () => {
  const nazvy = (k: Karta) => k.skupiny.map(s => [s.nadpis, s.polozky.map(p => `${p.nazev}: ${p.role}`)]);
  it('kauza: aktéři s rolí, návaznosti oběma směry, roky v podnadpisu', () => {
    const k = kartaUzlu(graf, 'k:zeta-stret');
    expect(k.nazev).toBe('Testovací kauza Žeta');
    expect(k.podnadpis).toBe('2018 – dosud');
    expect(nazvy(k)).toEqual([
      ['Aktéři v kauze', ['Holding Omega: předmět kauzy', 'Firma Alfa: účastník řízení']],
      ['Navazuje na', ['Testovací kauza Alfa: související řízení']],
      ['Navazují na ni', ['Testovací kauza Epsilon, delší název: související řízení']],
    ]);
    expect(k.akce).toContain('detail kauzy');
  });
  it('kauza bez aktérů to řekne větou', () => {
    const k = kartaUzlu(graf, 'k:beta-archiv');
    expect(k.text).toBe('Kauza nemá uvedené další aktéry.');
    expect(k.skupiny).toEqual([]);
  });
  it('aktér: víc vazeb k témuž uzlu je jeden řádek se stejnou rolí jednou a obdobími za sebou', () => {
    expect(nazvy(kartaUzlu(graf, 'a:firma-alfa'))).toEqual([
      ['Nadřazení', ['Holding Omega: vlastní · 2007–2012, 2015 – dosud']],
      ['V kauzách', ['Testovací kauza Alfa: příjemce dotace', 'Testovací kauza Žeta: účastník řízení']],
    ]);
  });
  it('aktér: nadřazení, aktéři pod ním a kauzy zvlášť', () => {
    expect(kartaUzlu(graf, 'a:holding-omega').skupiny.map(s => s.nadpis)).toEqual(['Nadřazení', 'Aktéři pod ním', 'V kauzách']);
  });
  it('střed: přímí aktéři a kauzy bez dalších aktérů, bez akce na klik', () => {
    const k = kartaUzlu(graf, 'babis');
    expect(k.skupiny.map(s => [s.nadpis, s.polozky.length])).toEqual([['Aktéři pod ním', 2], ['Kauzy bez dalších aktérů', 3]]);
    expect(k.akce).toBeNull();
  });
  it('dlouhý seznam se zkrátí a řekne, kolik zbývá', () => {
    const s = kartaUzlu(graf, 'babis', 2).skupiny[1];
    expect([s.polozky.length, s.dalsich]).toEqual([2, 1]);
  });
  it('čára: nadpis ve směru čtení, role a věta popisu', () => {
    const h = graf.hrany.find(x => x.druh === 'navaznost' && x.potomek === 'k:epsilon-fondy')!;
    expect(kartaHrany(graf, h.id)).toMatchObject({
      nazev: 'Testovací kauza Epsilon, delší název → Testovací kauza Žeta', podnadpis: 'související řízení',
      text: 'Fiktivní komise v kauze Epsilon vychází ze spisu kauzy Žeta.',
    });
    expect(kartaHrany(graf, h.id).akce).toBe('Kliknutím otevřete detail kauzy Testovací kauza Epsilon, delší název.');
    const v = graf.hrany.find(x => x.druh === 'vztah' && x.potomek === 'a:holding-omega' && x.rodic === 'babis')!;
    expect(nadpisHrany(graf, v.id)).toBe('Andrej Babiš → Holding Omega');
    expect(kartaHrany(graf, v.id).akce).toBe('Kliknutím zobrazíte zdroje.');
  });
  it('klik na čáru: kauza vazby aktéra nebo středu, u návaznosti navazující kauza, u vazby mezi aktéry nic', () => {
    const najdi = (f: (h: (typeof graf.hrany)[number]) => boolean) => graf.hrany.find(f)!.id;
    expect(kauzaHrany(graf, najdi(h => h.druh === 'akter' && h.potomek === 'k:zeta-stret'))).toBe('k:zeta-stret');
    expect(kauzaHrany(graf, najdi(h => h.druh === 'stred' && h.potomek === 'k:beta-archiv'))).toBe('k:beta-archiv');
    expect(kauzaHrany(graf, najdi(h => h.druh === 'navaznost' && h.potomek === 'k:epsilon-fondy'))).toBe('k:epsilon-fondy');
    expect(kauzaHrany(graf, najdi(h => h.druh === 'vztah'))).toBeNull();
  });
});

describe('zvyrazneni', () => {
  it('kauza: cesta ke středu přes všechny vztahy a navazující kauzy', () => {
    const z = zvyrazneni(graf, idKauzy('alfa-dotace'));
    expect([...z.uzly].sort()).toEqual(['a:firma-alfa', 'a:fond-sigma', 'a:holding-omega', 'babis', 'k:alfa-dotace', 'k:zeta-stret']);
    expect(z.hrany.size).toBe(7);
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
      akteri: [
        { nazev: 'Holding Omega', roleText: 'předmět kauzy', popis: 'Fiktivní úřad posuzuje střet zájmů u Holdingu Omega.', zdroje: [1] },
        { nazev: 'Firma Alfa', roleText: 'účastník řízení', popis: 'Firma Alfa je v řízení vedlejším účastníkem.', zdroje: [2] },
      ],
      navazuje: [{ slug: 'alfa-dotace', nazev: 'Testovací kauza Alfa', roleText: 'související řízení', popis: 'Řízení se týká stejné fiktivní dotace jako kauza Alfa.', zdroje: [1] }],
      navazujiNaNi: [{ slug: 'epsilon-fondy', nazev: 'Testovací kauza Epsilon, delší název' }],
    });
  });
  it('kauza bez vazeb a neznámá kauza', () => {
    expect(vazbyKauzy(zaznamy, akteri, 'beta-archiv')).toEqual({ akteri: [], navazuje: [], navazujiNaNi: [] });
    expect(vazbyKauzy(zaznamy, akteri, 'neni')).toEqual({ akteri: [], navazuje: [], navazujiNaNi: [] });
  });
});

describe('více vazeb mezi týmiž uzly a více aktérů u kauzy', () => {
  const r = rozlozMapu(graf, null);
  it('dva vztahy ke stejnému nadřazenému: hlavní je ten novější a čáry se nepřekrývají', () => {
    const vztahy = graf.hrany.filter(h => h.druh === 'vztah' && h.potomek === 'a:firma-alfa');
    expect(vztahy.map(h => [h.obdobi, h.hlavni])).toEqual([['2007–2012', false], ['2015 – dosud', true]]);
    const d = vztahy.map(h => r.cary.find(c => c.id === h.id)!.d);
    expect(d[0]).not.toBe(d[1]);
  });
  it('kauza se dvěma aktéry je na mapě jednou a vedou k ní dvě čáry od aktérů', () => {
    expect(r.uzly.filter(u => u.id === 'k:zeta-stret')).toHaveLength(1);
    const kZete = graf.hrany.filter(h => h.druh === 'akter' && h.potomek === 'k:zeta-stret').map(h => h.id);
    expect(r.cary.filter(c => kZete.includes(c.id))).toHaveLength(2);
    expect(graf.hrany.filter(h => h.druh === 'akter' && h.potomek === 'k:zeta-stret').map(h => [h.rodic, h.hlavni]))
      .toEqual([['a:holding-omega', true], ['a:firma-alfa', false]]);
  });
});
