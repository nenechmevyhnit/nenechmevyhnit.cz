import { describe, it, expect } from 'vitest';
import { oblastSchema, oblastSchemaKoncepty } from '../../src/lib/schema-oblasti';
import { overOblasti, overAdresar, type PravidloZaznam } from '../../src/lib/validace';
import { pravidloSchema, pravidloSchemaKoncepty } from '../../src/lib/schema-pravidla';
import { platnaOblast, platnePravidlo } from './ukazka';

const chyby = (data: unknown, schema = oblastSchema) => {
  const r = schema.safeParse(data);
  return r.success ? [] : r.error.issues.map(i => i.message);
};
const o = (upravy: (x: any) => void) => { const x: any = platnaOblast(); upravy(x); return x; };
const zaznam = (slug: string, oblasti: string[]): PravidloZaznam =>
  ({ slug, pravidlo: pravidloSchema.parse({ ...platnePravidlo(), oblasti }), telo: '' });
const soubor = (slug: string, data: unknown = platnaOblast()) => ({ slug, soubor: `obsah/oblasti/${slug}.md`, data });
const zpravy = (x: { zprava: string }[]) => x.map(c => c.zprava).join(' | ');

describe('oblastSchema', () => {
  it('přijme platnou oblast a doplní výchozí hodnoty', () => {
    expect(chyby(platnaOblast())).toEqual([]);
    expect(oblastSchema.parse(o(x => { delete x.hodnoceni; })).hodnoceni).toEqual([]);
    expect(oblastSchema.parse(platnaOblast()).hodnoceni[0].pravidla).toEqual([]);
  });
  it('limity délky textů', () => {
    expect(chyby(o(x => { x.uvod.text = 'x'.repeat(401); })).join(' ')).toMatch(/Úvod oblasti smí mít nejvýš 400 znaků/);
    expect(chyby(o(x => { x.hodnoceni[0].citace = 'x'.repeat(501); })).join(' ')).toMatch(/Citace smí mít nejvýš 500 znaků/);
  });
  it('odkazy na zdroje musí existovat', () => {
    expect(chyby(o(x => { x.uvod.zdroje = [7]; })).join(' ')).toMatch(/Úvod oblasti odkazuje na neexistující zdroj 7/);
    expect(chyby(o(x => { x.hodnoceni[1].zdroje = [8]; })).join(' ')).toMatch(/Hodnocení 2 \(„Fiktivní odbornice E“\) odkazuje na neexistující zdroj 8/);
    expect(chyby(o(x => { x.zdroje[1].id = 1; })).join(' ')).toMatch(/Duplicitní id zdroje 1/);
  });
  it('vláda a odborník musí mít funkci, instituce ne', () => {
    expect(chyby(o(x => { delete x.hodnoceni[1].funkce; })).join(' ')).toMatch(/Hodnocení 2 .* musí uvést funkci/);
    expect(chyby(o(x => { x.hodnoceni.push({ typ: 'instituce', kdo: 'Fiktivní úřad', citace: 'Text.', datum: '2026-07-01', zdroje: [1] }); }))).toEqual([]);
  });
  it('hodnocení bez stanoviska vlády je chyba, oblast bez hodnocení ne', () => {
    expect(chyby(o(x => { x.hodnoceni.shift(); })).join(' ')).toMatch(/aspoň jedno stanovisko vlády/);
    expect(chyby(o(x => { x.hodnoceni = []; }))).toEqual([]);
  });
  it('neznámý typ hodnocení a neznámý klíč', () => {
    expect(chyby(o(x => { x.hodnoceni[0].typ = 'opozice'; })).length).toBeGreaterThan(0);
    expect(chyby(o(x => { x.nazev = 'Navíc'; })).length).toBeGreaterThan(0);
  });
  it('v režimu konceptů smí chybět ověření', () => {
    expect(chyby(o(x => { x.overeno = null; })).length).toBeGreaterThan(0);
    expect(chyby(o(x => { x.overeno = null; }), oblastSchemaKoncepty)).toEqual([]);
  });
});

describe('overOblasti', () => {
  it('neznámá oblast podle názvu souboru je chyba', () => {
    const r = overOblasti('obsah', [soubor('neznama')], []);
    expect(zpravy(r.chyby)).toMatch(/Neznámá oblast „neznama“/);
  });
  it('chyba schématu nese cestu k poli a soubor', () => {
    const r = overOblasti('obsah', [soubor('dotace-stret-zajmu', o(x => { delete x.uvod; }))], []);
    expect(r.chyby[0].soubor).toBe('obsah/oblasti/dotace-stret-zajmu.md');
    expect(r.chyby[0].zprava).toMatch(/^uvod:/);
  });
  it('oblast se zveřejněnou změnou musí mít soubor', () => {
    const r = overOblasti('obsah', [], [zaznam('novela-x', ['soudy-policie'])]);
    expect(zpravy(r.chyby)).toMatch(/Oblast „soudy-policie“ má zveřejněné změny, ale chybí soubor/);
  });
  it('v režimu konceptů chybějící soubor oblasti jen varuje', () => {
    const r = overOblasti('obsah', [], [zaznam('novela-x', ['soudy-policie'])], { koncepty: true });
    expect(r.chyby).toEqual([]);
    expect(zpravy(r.varovani)).toMatch(/chybí soubor/);
  });
  it('hodnocení odkazuje na změnu z jiné oblasti: vždy chyba', () => {
    const r = overOblasti('obsah', [soubor('dotace-stret-zajmu')], [zaznam('novela-x', ['soudy-policie'])]);
    expect(zpravy(r.chyby)).toMatch(/„novela-x“, která do oblasti nepatří/);
  });
  it('hodnocení odkazuje na neexistující změnu: veřejný build vynechá s varováním, koncepty chyba', () => {
    const verejny = overOblasti('obsah', [soubor('dotace-stret-zajmu')], [zaznam('jina', ['dotace-stret-zajmu'])]);
    expect(verejny.chyby).toEqual([]);
    expect(zpravy(verejny.varovani)).toMatch(/neexistující změnu „novela-x“/);
    expect(verejny.oblasti[0].data.hodnoceni[1].pravidla).toEqual([]);
    const koncepty = overOblasti('obsah', [soubor('dotace-stret-zajmu')], [zaznam('jina', ['dotace-stret-zajmu'])], { koncepty: true });
    expect(zpravy(koncepty.chyby)).toMatch(/neexistující změnu „novela-x“/);
  });
  it('platná oblast s odkazem na vlastní změnu projde, výsledek je v pořadí slovníku', () => {
    const r = overOblasti('obsah', [soubor('soudy-policie', o(x => { x.hodnoceni = []; })), soubor('dotace-stret-zajmu')],
      [zaznam('novela-x', ['dotace-stret-zajmu']), zaznam('jina', ['soudy-policie'])]);
    expect(r.chyby).toEqual([]);
    expect(r.oblasti.map(x => x.id)).toEqual(['dotace-stret-zajmu', 'soudy-policie']);
  });
  it('koncepty: změna bez oblasti nebo bez proVas varuje', () => {
    const p: PravidloZaznam = { slug: 'rozpracovana', pravidlo: pravidloSchemaKoncepty.parse({ ...platnePravidlo(), oblasti: undefined, proVas: undefined }), telo: '' };
    const r = overOblasti('obsah', [], [p], { koncepty: true });
    expect(zpravy(r.varovani)).toMatch(/nemá oblasti/);
    expect(zpravy(r.varovani)).toMatch(/nemá text „Co by to znamenalo pro vás“/);
  });
});

describe('overAdresar s oblastmi', () => {
  it('fixtures: čtyři oblasti bez chyb', () => {
    const r = overAdresar('tests/fixtures/obsah');
    expect(r.chyby).toEqual([]);
    expect(r.oblasti.map(x => x.id)).toEqual(['dotace-stret-zajmu', 'zemedelstvi-potraviny', 'soudy-policie', 'kontrolni-urady']);
  });
  it('prázdný archiv nemá oblasti', () => expect(overAdresar('tests/fixtures/prazdny').oblasti).toEqual([]));
});
