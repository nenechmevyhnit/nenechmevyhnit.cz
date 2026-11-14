import { describe, it, expect } from 'vitest';
import { snimekSchema, nesouladySouctu, idSnimku, ID_HLASOVANI } from '../../src/lib/schema-hlasovani';
import { klub, KLUBY, NEZARAZENI } from '../../src/lib/hlasovani-kluby';
import { platnySnimek } from './ukazka';

const s = (upravy: (x: any) => void) => { const x: any = platnySnimek(); upravy(x); return x; };
const chyby = (data: unknown) => {
  const r = snimekSchema.safeParse(data);
  return r.success ? [] : r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
};
const p = (x: unknown) => snimekSchema.parse(x);

describe('snimekSchema', () => {
  it('přijme platný snímek', () => expect(chyby(platnySnimek())).toEqual([]));
  it('odmítne neznámý hlas', () => expect(chyby(s(x => { x.poslanci[0].hlas = 'ano'; })).join(' ')).toMatch(/^poslanci\.0\.hlas/));
  it('odmítne neznámé pole (snímek je strict)', () => expect(chyby(s(x => { x.poznamka = 'ručně'; })).length).toBeGreaterThan(0));
  it('odmítne čas v jiném tvaru', () => expect(chyby(s(x => { x.cas = '9:5'; })).join(' ')).toMatch(/HH:MM/));
  it('odmítne jinou komoru než psp', () => expect(chyby(s(x => { x.komora = 'senat'; })).length).toBeGreaterThan(0));
  it('převede datum z YAML (Date) na text', () =>
    expect(p(s(x => { x.datum = new Date('2026-06-12T00:00:00Z'); })).datum).toBe('2026-06-12'));
});

describe('nesouladySouctu', () => {
  it('platný snímek sedí', () => expect(nesouladySouctu(p(platnySnimek()))).toEqual([]));
  it('pro nesedí', () => expect(nesouladySouctu(p(s(x => { x.souhrn.pro = 3; })))).toEqual(['pro: jmenovitě 2, v souhrnu 3']));
  it('kód K se porovná se součtem zdržel se + nehlasoval', () =>
    expect(nesouladySouctu(p(s(x => { x.souhrn.zdrzel = 1; x.souhrn.nehlasoval = 0; })))).toEqual([]));
  it('kódy C a F se porovnají každý zvlášť', () =>
    expect(nesouladySouctu(p(s(x => { x.poslanci[2].hlas = 'zdrzel'; })))).toEqual([
      'zdrželi se: jmenovitě 1, v souhrnu 0',
      'nehlasovali: jmenovitě 0, v souhrnu 1',
    ]));
  it('nepřítomní = poslanci − přihlášení', () =>
    expect(nesouladySouctu(p(s(x => { x.souhrn.prihlaseno = 5; })))).toEqual(['nepřítomní (omluvení a nepřihlášení): jmenovitě 1, v souhrnu 0']));
});

describe('id hlasování', () => {
  it('sestaví id ze snímku', () => expect(idSnimku({ komora: 'psp', obdobi: 10, schuze: 34, cislo: 311 })).toBe('psp-10-34-311'));
  it('tvar id', () => {
    expect(ID_HLASOVANI.test('psp-10-34-311')).toBe(true);
    expect(ID_HLASOVANI.test('psp-10-34')).toBe(false);
    expect(ID_HLASOVANI.test('senat-1-2-3')).toBe(false);
  });
});

describe('slovník klubů', () => {
  it('najde klub podle zkratky PSP', () => expect(klub('ANO2011')).toEqual({ popisek: 'ANO', slug: 'ano' }));
  it('nezařazení mají klub null', () => expect(klub(null)).toBe(NEZARAZENI));
  it('neznámá zkratka ani vlastnost objektu není klub', () => {
    expect(klub('XYZ')).toBeUndefined();
    expect(klub('constructor')).toBeUndefined();
  });
  it('slugy jsou jedinečné, bez diakritiky a nekolidují s id na stránce', () => {
    const slugy = [...Object.values(KLUBY).map(k => k.slug), NEZARAZENI.slug];
    expect(new Set(slugy).size).toBe(slugy.length);
    for (const s of slugy) {
      expect(s).toMatch(/^[a-z0-9-]+$/);
      expect(['obsah', 'detail']).not.toContain(s);
    }
  });
});
