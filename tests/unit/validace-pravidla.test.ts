import { describe, it, expect } from 'vitest';
import { overPravidlo, overVazbyPravidel, overAdresar, type PravidloZaznam } from '../../src/lib/validace';
import { pravidloSchema } from '../../src/lib/schema-pravidla';
import { pravidlaKauzy, seraditPravidla } from '../../src/lib/pravidla';
import { platnePravidlo } from './ukazka';

const STITKY = new Set(['dotace']);
const zaznam = (slug: string, upravy: Record<string, unknown> = {}): PravidloZaznam =>
  ({ slug, pravidlo: pravidloSchema.parse({ ...platnePravidlo(), ...upravy }), telo: '' });

describe('overPravidlo', () => {
  it('platné pravidlo bez chyb', () => {
    const r = overPravidlo('p.md', platnePravidlo(), '', STITKY);
    expect(r.chyby).toEqual([]);
    expect(r.pravidlo?.nazev).toBe('Testovací novela Omega');
  });
  it('neznámý štítek', () => {
    const r = overPravidlo('p.md', { ...platnePravidlo(), stitky: ['neznamy'] }, '', STITKY);
    expect(r.chyby[0].zprava).toMatch(/Neznámý štítek „neznamy“/);
  });
  it('odstavec souvislostí bez poznámky a poznámka na neexistující zdroj', () => {
    const r = overPravidlo('p.md', platnePravidlo(), 'S poznámkou.[^1]\n\nBez poznámky.\n\nŠpatně.[^8]', STITKY);
    const t = r.chyby.map(c => c.zprava).join(' ');
    expect(t).toMatch(/Odstavec 2 souvislostí nemá poznámku/);
    expect(t).toMatch(/Poznámka \[\^8\] odkazuje na neexistující zdroj/);
  });
  it('chyba schématu nese cestu k poli a název souboru', () => {
    const r = overPravidlo('obsah/pravidla/x.md', { ...platnePravidlo(), druh: 'zakonik' }, '', STITKY);
    expect(r.chyby[0].zprava).toMatch(/^druh:/);
    expect(r.chyby.every(c => c.soubor === 'obsah/pravidla/x.md')).toBe(true);
  });
  it('v režimu konceptů smí chybět ověření', () => {
    const p = { ...platnePravidlo(), overeno: null };
    expect(overPravidlo('p.md', p, '', STITKY).chyby.length).toBeGreaterThan(0);
    expect(overPravidlo('p.md', p, '', STITKY, { koncepty: true }).chyby).toEqual([]);
  });
});

describe('overVazbyPravidel', () => {
  const sVazbou = () => zaznam('novela-x', { kauzy: [{ kauza: 'kauza-a', popis: 'Souvisí.', zdroje: [2] }] });
  it('vazba na existující kauzu zůstane', () => {
    const r = overVazbyPravidel('obsah', [sVazbou()], new Set(['kauza-a']));
    expect(r.chyby).toEqual([]);
    expect(r.varovani).toEqual([]);
    expect(r.pravidla[0].pravidlo.kauzy).toHaveLength(1);
  });
  it('veřejný build neznámou kauzu vynechá s varováním', () => {
    const r = overVazbyPravidel('obsah', [sVazbou()], new Set());
    expect(r.chyby).toEqual([]);
    expect(r.varovani[0].zprava).toMatch(/Vazba na neexistující kauzu „kauza-a“ \(vazba se nezobrazí\)/);
    expect(r.pravidla[0].pravidlo.kauzy).toEqual([]);
  });
  it('režim konceptů hlásí neznámou kauzu jako chybu', () => {
    const r = overVazbyPravidel('obsah', [sVazbou()], new Set(), { koncepty: true });
    expect(r.chyby[0].zprava).toMatch(/Vazba na neexistující kauzu „kauza-a“/);
  });
  it('v režimu konceptů projde kauza ze zveřejněného archivu', () => {
    const r = overVazbyPravidel('obsah', [sVazbou()], new Set(), { koncepty: true, znameKauzy: ['kauza-a'] });
    expect(r.chyby).toEqual([]);
    expect(r.pravidla[0].pravidlo.kauzy).toHaveLength(1);
  });
  it('slug shodný s kauzou je chyba', () => {
    const r = overVazbyPravidel('obsah', [zaznam('kauza-a')], new Set(['kauza-a']));
    expect(r.chyby[0].zprava).toMatch(/Slug „kauza-a“ už používá kauza/);
  });
});

describe('overAdresar s pravidly', () => {
  it('načte fiktivní pravidla seřazená od nejnovější události', () => {
    const r = overAdresar('tests/fixtures/obsah');
    expect(r.chyby).toEqual([]);
    expect(r.pravidla.map(p => p.slug)).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau', 'usneseni-kappa']);
    expect(r.zaznamy).toHaveLength(6);
  });
  it('prázdný archiv nemá pravidla', () => {
    const r = overAdresar('tests/fixtures/prazdny');
    expect(r.chyby).toEqual([]);
    expect(r.pravidla).toEqual([]);
  });
});

describe('řazení a zpětné vazby', () => {
  it('stejné datum řadí podle názvu', () => {
    const a = zaznam('a', { nazev: 'Beta' }), b = zaznam('b', { nazev: 'Alfa' });
    expect(seraditPravidla([a, b]).map(z => z.slug)).toEqual(['b', 'a']);
  });
  it('kauza zná pravidla, která na ni odkazují', () => {
    const r = overAdresar('tests/fixtures/obsah');
    expect(pravidlaKauzy(r.pravidla, 'zeta-stret')).toEqual([{
      slug: 'zakon-omega',
      nazev: 'Testovací novela zákona Omega s dlouhým názvem pro mobil',
      popis: 'Zkrácení lhůty by se dotklo fiktivního řízení Žeta.',
      stav: 'Schváleno Sněmovnou',
    }, {
      slug: 'usneseni-kappa',
      nazev: 'Testovací usnesení vlády Kappa',
      popis: 'Fiktivní výběr soudců by se dotkl fiktivního řízení Žeta.',
      stav: 'Vyhlášeno',
    }]);
    expect(pravidlaKauzy(r.pravidla, 'alfa-dotace')).toEqual([]);
  });
});
