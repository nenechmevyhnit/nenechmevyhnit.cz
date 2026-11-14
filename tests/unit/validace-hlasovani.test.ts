import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { overSnimek, overHlasovaniPravidel } from '../../src/lib/validace-hlasovani';
import { overAdresar, type PravidloZaznam } from '../../src/lib/validace';
import { pravidloSchema } from '../../src/lib/schema-pravidla';
import { snimekSchema, type Snimek } from '../../src/lib/schema-hlasovani';
import { platnePravidlo, platnySnimek } from './ukazka';

const SOUBOR = join('obsah', 'hlasovani', 'psp-10-5-12.yml');
const HL = { id: 'psp-10-5-12', typ: 'proceduralni', co: 'Fiktivní návrh na pořad schůze' };
const udalost = (hlasovani: unknown[], datum = '2026-06-10') =>
  ({ datum, krok: 'predlozeno', nazev: 'Návrh podán', popis: 'Fiktivní poslanci podali návrh.', zdroje: [1], hlasovani });
const pravidlo = (slug: string, hlasovani: unknown[], datum?: string): PravidloZaznam =>
  ({ slug, telo: '', pravidlo: pravidloSchema.parse({ ...platnePravidlo(), udalosti: [udalost(hlasovani, datum)] }) });
const snimky = (): Map<string, Snimek> => new Map([['psp-10-5-12', snimekSchema.parse(platnySnimek())]]);

describe('overSnimek', () => {
  it('platný snímek', () => {
    const r = overSnimek(SOUBOR, platnySnimek());
    expect(r.chyby).toEqual([]);
    expect(r.snimek?.cislo).toBe(12);
  });
  it('název souboru musí odpovídat hlasování', () =>
    expect(overSnimek(join('obsah', 'hlasovani', 'psp-10-5-13.yml'), platnySnimek()).chyby[0].zprava).toMatch(/neodpovídá hlasování \(psp-10-5-12\)/));
  it('nesedící součty', () =>
    expect(overSnimek(SOUBOR, { ...platnySnimek(), souhrn: { pro: 3, proti: 1, zdrzel: 0, nehlasoval: 1, prihlaseno: 4 } }).chyby.map(c => c.zprava))
      .toEqual(['Součty nesedí: pro: jmenovitě 2, v souhrnu 3']));
  it('neznámý klub se nahlásí jednou, i když ho má víc poslanců', () => {
    const x: any = platnySnimek();
    x.kluby.XYZ = 'Fiktivní klub';
    x.poslanci[0].klub = 'XYZ';
    x.poslanci[1].klub = 'XYZ';
    expect(overSnimek(SOUBOR, x).chyby.map(c => c.zprava)).toEqual(['Neznámý klub „XYZ“ (doplňte klub do src/lib/hlasovani-kluby.ts)']);
  });
  it('klub poslance chybí v seznamu klubů snímku', () => {
    const x: any = platnySnimek();
    delete x.kluby.ODS;
    expect(overSnimek(SOUBOR, x).chyby.map(c => c.zprava)).toEqual(['Klub „ODS“ chybí v seznamu klubů hlasování']);
  });
  it('chyba schématu nese cestu k poli', () =>
    expect(overSnimek(SOUBOR, { ...platnySnimek(), vysledek: 'ano' }).chyby[0].zprava).toMatch(/^vysledek:/));
});

describe('overHlasovaniPravidel', () => {
  it('odkaz na existující snímek: bez chyb, snímek je odkazovaný', () => {
    const r = overHlasovaniPravidel('obsah', [pravidlo('a', [HL])], snimky());
    expect(r.chyby).toEqual([]);
    expect(r.varovani).toEqual([]);
    expect([...r.odkazovane]).toEqual(['psp-10-5-12']);
  });
  it('chybějící snímek radí spustit skript', () => {
    const r = overHlasovaniPravidel('obsah', [pravidlo('a', [{ ...HL, id: 'psp-10-5-99' }])], snimky());
    expect(r.chyby).toHaveLength(1);
    expect(r.chyby[0].zprava).toMatch(/^Hlasování „psp-10-5-99“ nemá snímek .*\(spusťte npm run hlasovani\)$/);
    expect(r.chyby[0].soubor).toBe(join('obsah', 'pravidla', 'a.md'));
  });
  it('hlasování dřív než událost', () =>
    expect(overHlasovaniPravidel('obsah', [pravidlo('a', [HL], '2026-06-13')], snimky()).chyby[0].zprava)
      .toBe('Hlasování „psp-10-5-12“ (2026-06-12) je dřív než událost „Návrh podán“ (2026-06-13)'));
  it('událost s přesností na měsíc: hlasování ve stejném měsíci projde, v předchozím ne', () => {
    expect(overHlasovaniPravidel('obsah', [pravidlo('a', [HL], '2026-06')], snimky()).chyby).toEqual([]);
    expect(overHlasovaniPravidel('obsah', [pravidlo('a', [HL], '2026-07')], snimky()).chyby).toHaveLength(1);
  });
  it('dvě pravidla s různým typem téhož hlasování', () =>
    expect(overHlasovaniPravidel('obsah', [pravidlo('a', [HL]), pravidlo('b', [{ ...HL, typ: 'obsah' }])], snimky()).chyby.map(c => c.zprava))
      .toEqual(['Hlasování „psp-10-5-12“ má typ „obsah“, ale pravidlo „a“ mu dává „proceduralni“']));
  it('neplatný snímek nehlásí zároveň chybějící snímek', () => {
    const r = overHlasovaniPravidel('obsah', [pravidlo('a', [HL])], new Map(), new Set(['psp-10-5-12']));
    expect(r.chyby).toEqual([]);
    expect(r.odkazovane.has('psp-10-5-12')).toBe(true);
  });
  it('snímek bez odkazu je jen varování', () => {
    const r = overHlasovaniPravidel('obsah', [], snimky());
    expect(r.chyby).toEqual([]);
    expect(r.varovani.map(v => v.zprava)).toEqual(['Na hlasování neodkazuje žádné pravidlo (stránka se nevygeneruje)']);
  });
});

describe('overAdresar s hlasováním', () => {
  const adresar = () => {
    const d = mkdtempSync(join(tmpdir(), 'nv-hl-'));
    mkdirSync(join(d, 'pravidla'));
    mkdirSync(join(d, 'hlasovani'));
    writeFileSync(join(d, 'stitky.yml'), 'dotace: Dotace\n');
    return d;
  };
  // bez oblastí a textu pro vás (smějí chybět u všech změn najednou), ať test nepotřebuje soubory oblastí
  const zapisPravidlo = (d: string, hlasovani: unknown[]) => {
    const p = platnePravidlo();
    delete p.oblasti;
    delete p.proVas;
    writeFileSync(join(d, 'pravidla', 'novela-a.md'), `---\n${stringify({ ...p, udalosti: [udalost(hlasovani)] })}---\n`);
  };

  it('vrátí jen odkazované snímky, neodkazovaný nahlásí varováním', () => {
    const d = adresar();
    zapisPravidlo(d, [HL]);
    writeFileSync(join(d, 'hlasovani', 'psp-10-5-12.yml'), stringify(platnySnimek()));
    writeFileSync(join(d, 'hlasovani', 'psp-10-5-13.yml'), stringify({ ...platnySnimek(), cislo: 13 }));
    const r = overAdresar(d);
    expect(r.chyby).toEqual([]);
    expect([...r.hlasovani.keys()]).toEqual(['psp-10-5-12']);
    expect(r.varovani.map(v => v.zprava)).toContain('Na hlasování neodkazuje žádné pravidlo (stránka se nevygeneruje)');
  });
  it('neplatný snímek hlásí jen vlastní chybu, ne radu spustit skript', () => {
    const d = adresar();
    zapisPravidlo(d, [HL]);
    writeFileSync(join(d, 'hlasovani', 'psp-10-5-12.yml'), stringify({ ...platnySnimek(), vysledek: 'ano' }));
    const zpravy = overAdresar(d).chyby.map(c => c.zprava);
    expect(zpravy.some(z => /^vysledek:/.test(z))).toBe(true);
    expect(zpravy.join(' ')).not.toMatch(/spusťte npm run hlasovani/);
  });
  it('chybějící snímek je chyba buildu', () => {
    const d = adresar();
    zapisPravidlo(d, [HL]);
    expect(overAdresar(d).chyby.map(c => c.zprava).join(' ')).toMatch(/spusťte npm run hlasovani/);
  });
  it('nečitelný YAML snímku je chyba, ne pád', () => {
    const d = adresar();
    writeFileSync(join(d, 'hlasovani', 'psp-10-5-12.yml'), 'komora: [psp\n');
    expect(overAdresar(d).chyby[0].zprava).toMatch(/^Snímek hlasování nejde přečíst/);
  });
  it('archiv bez složky hlasovani nemá hlasování', () => {
    const r = overAdresar('tests/fixtures/prazdny');
    expect(r.chyby).toEqual([]);
    expect(r.hlasovani.size).toBe(0);
  });
});
