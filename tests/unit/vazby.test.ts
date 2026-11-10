import { describe, it, expect } from 'vitest';
import { overSlovnikAkteru, overVazby, overAdresar, type KauzaZaznam } from '../../src/lib/validace';
import { kauzaSchemaKoncepty } from '../../src/lib/schema';
import { platnaKauza, platnyAkter } from './ukazka';

const akter = (id: string, nadrazeny: string) => {
  const a = platnyAkter(); (a.vztahy as any)[0].nadrazeny = nadrazeny; return [id, a] as const;
};
const kauza = (slug: string, doplnek: Record<string, unknown> = {}): KauzaZaznam =>
  ({ slug, kauza: kauzaSchemaKoncepty.parse({ ...platnaKauza(), ...doplnek }), telo: '' });
const vazba = (id: string) => ({ id, role: 'prijemce-dotace', popis: 'Fiktivní vazba.', zdroje: [1] });
const navaznost = (k: string) => ({ kauza: k, role: 'vychazi-z', popis: 'Fiktivní návaznost.', zdroje: [1] });

describe('overSlovnikAkteru', () => {
  it('načte platné aktéry', () => {
    const r = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('a', 'babis'), akter('b', 'a')]));
    expect(r.chyby).toEqual([]);
    expect([...r.akteri.keys()]).toEqual(['a', 'b']);
  });
  it('prázdný soubor je prázdný slovník', () => expect(overSlovnikAkteru('akteri.yml', null).akteri.size).toBe(0));
  it('vyhrazené id babis', () => {
    const r = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('babis', 'babis')]));
    expect(r.chyby[0].zprava).toMatch(/vyhrazené pro střed mapy/);
  });
  it('neplatné id', () => expect(overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('Žluť', 'babis')])).chyby[0].zprava).toMatch(/jen malá písmena/));
  it('neexistující nadřazený', () => {
    const r = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('a', 'neni')]));
    expect(r.chyby[0].zprava).toMatch(/neexistujícího nadřazeného „neni“/);
  });
  it('kruh ve vztazích', () => {
    const r = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('a', 'b'), akter('b', 'a')]));
    expect(r.chyby.map(c => c.zprava).join(' ')).toMatch(/tvoří kruh: a → b → a/);
  });
  it('chyby schématu nesou id aktéra', () => {
    const r = overSlovnikAkteru('akteri.yml', { a: { ...platnyAkter(), druh: 'urad' } });
    expect(r.chyby[0].zprava).toMatch(/^a\.druh:/);
  });
  it('ve veřejném režimu vyžaduje ověření', () => {
    const data = { a: { ...platnyAkter(), overeno: null } };
    expect(overSlovnikAkteru('akteri.yml', data).chyby.length).toBeGreaterThan(0);
    expect(overSlovnikAkteru('akteri.yml', data, { koncepty: true }).chyby).toEqual([]);
  });
});

describe('overVazby', () => {
  const akteri = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('a', 'babis')])).akteri;
  it('platné vazby projdou beze změny', () => {
    const r = overVazby('obsah', [kauza('k1', { akteri: [vazba('a')] }), kauza('k2', { navazuje: [navaznost('k1')] })], akteri);
    expect(r.chyby).toEqual([]);
    expect(r.varovani).toEqual([]);
    expect(r.zaznamy[0].kauza.akteri).toHaveLength(1);
    expect(r.zaznamy[1].kauza.navazuje).toHaveLength(1);
  });
  it('veřejný build: neznámý aktér a kauza jsou varování a vazba se vynechá', () => {
    const r = overVazby('obsah', [kauza('k1', { akteri: [vazba('neni')], navazuje: [navaznost('chybi')] })], akteri);
    expect(r.chyby).toEqual([]);
    expect(r.varovani.map(v => v.zprava)).toEqual([
      'Neznámý aktér „neni“ (vazba se nezobrazí)',
      'Návaznost na neexistující kauzu „chybi“ (vazba se nezobrazí)',
    ]);
    expect(r.zaznamy[0].kauza.akteri).toEqual([]);
    expect(r.zaznamy[0].kauza.navazuje).toEqual([]);
    expect(r.varovani[0].soubor).toMatch(/kauzy[\\/]k1\.md$/);
  });
  it('koncepty: neznámý aktér a kauza jsou chyba', () => {
    const r = overVazby('obsah', [kauza('k1', { akteri: [vazba('neni')], navazuje: [navaznost('chybi')] })], akteri, { koncepty: true });
    expect(r.chyby.map(c => c.zprava)).toEqual(['Neznámý aktér „neni“', 'Návaznost na neexistující kauzu „chybi“']);
  });
  it('kauza nemůže navazovat sama na sebe', () => {
    const r = overVazby('obsah', [kauza('k1', { navazuje: [navaznost('k1')] })], akteri);
    expect(r.chyby[0].zprava).toBe('Kauza nemůže navazovat sama na sebe');
  });
});

describe('overAdresar s aktéry', () => {
  it('fiktivní obsah má aktéry a vazby bez chyb a varování', () => {
    const r = overAdresar('tests/fixtures/obsah');
    expect(r.chyby).toEqual([]);
    expect(r.varovani).toEqual([]);
    expect([...r.akteri.keys()].sort()).toEqual(['firma-alfa', 'fond-sigma', 'holding-omega']);
    const zeta = r.zaznamy.find(z => z.slug === 'zeta-stret')!;
    expect(zeta.kauza.akteri.map(a => a.id)).toEqual(['holding-omega', 'firma-alfa']);
    expect(zeta.kauza.navazuje.map(n => n.kauza)).toEqual(['alfa-dotace']);
  });
  it('archiv bez akteri.yml má prázdný slovník', () => expect(overAdresar('tests/fixtures/prazdny').akteri.size).toBe(0));
});
