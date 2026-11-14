import { describe, it, expect } from 'vitest';
import { WEB, titulek, MAX_TITULEK, MAX_POPIS, titulekKauzy, popisKratky } from '../../src/lib/web';
import { nactiKauzy, nactiPravidla, nactiOblasti, nactiHlasovani } from '../../src/lib/kauzy';
import { nadpisHlasovani } from '../../src/lib/hlasovani';

describe('web', () => {
  it('drží název a doménu projektu', () => {
    expect(WEB.nazev).toBe('Posuďte sami');
    expect(WEB.domena).toBe('https://posudtesami.cz');
  });

  it('skládá titulek stránky s příponou názvu webu', () => {
    expect(titulek('Metodika')).toBe('Metodika — Posuďte sami');
  });

  it('u dlouhého názvu obětuje příponu, ne obsah titulku', () => {
    // název pravidla smí mít 60 znaků, s příponou by titulek přetekl limit;
    // v takovém případě je užitečnější celý název než jméno webu
    const dlouhy = 'PGRLF: podpora pojištění pro velké zemědělské podniky';
    expect(titulek(dlouhy)).toBe(dlouhy);
    expect(titulek(dlouhy).length).toBeLessThanOrEqual(MAX_TITULEK);
  });
});

describe('délka titulků skutečného obsahu', () => {
  const vsechny = (): string[] => [
    titulek('Archiv kauz Andreje Babiše'),
    titulek('Metodika'),
    titulek('O projektu'),
    titulek('Zákony a nařízení'),
    titulek('Stránka neexistuje'),
    ...nactiKauzy().map(z => titulekKauzy(z.kauza.nazev, z.kauza.od, z.kauza.do)),
    ...nactiPravidla().map(z => titulek(z.pravidlo.nazev)),
    ...nactiOblasti().map(o => titulek(o.nazev)),
    ...[...nactiHlasovani().values()].map(s => titulek(nadpisHlasovani(s))),
  ];

  it('žádný titulek stránky nepřeteče limit', () => {
    const dlouhe = vsechny().filter(t => t.length > MAX_TITULEK).map(t => `${t.length}: ${t}`);
    expect(dlouhe).toEqual([]);
  });
});

describe('titulekKauzy', () => {
  it('uzavřená kauza má v titulku rozsah let', () => {
    expect(titulekKauzy('Čapí hnízdo', 2007, 2026))
      .toBe('Čapí hnízdo 2007–2026: časová osa a zdroje — Posuďte sami');
  });

  it('jednoletá kauza má jen jeden rok', () => {
    expect(titulekKauzy('Omluva Filipové', 2024, 2024))
      .toBe('Omluva Filipové 2024: časová osa a zdroje — Posuďte sami');
  });

  it('neuzavřená kauza (do: null) píše „dosud“, nikdy null', () => {
    const t = titulekKauzy('Testovací kauza Alfa', 2007, null);
    expect(t).toContain('2007–dosud');
    expect(t).not.toContain('null');
  });

  it('dlouhý název spadne na kratší variantu a drží limit', () => {
    const nazev = 'A'.repeat(36); // horní hranice názvu kauzy podle schema.ts
    const t = titulekKauzy(nazev, 2007, null);
    expect(t.length).toBeLessThanOrEqual(MAX_TITULEK);
    expect(t).toContain(nazev);
    expect(t).toContain('Posuďte sami');
  });
});

describe('popisKratky', () => {
  it('krátký text nechá být', () => {
    expect(popisKratky('Krátké shrnutí.')).toBe('Krátké shrnutí.');
  });

  it('dlouhý text zkrátí na hranici slova a doplní výpustku', () => {
    const dlouhy = 'Fiktivní firma Alfa získala fiktivní dotaci padesát milionů korun pro malé podniky, přestože podle fiktivního městského soudu podmínky programu nesplňovala ani zdaleka.';
    const k = popisKratky(dlouhy);
    expect(k.length).toBeLessThanOrEqual(MAX_POPIS + 1);
    expect(k.endsWith('…')).toBe(true);
    expect(k).not.toMatch(/\s…$/);
    expect(dlouhy.startsWith(k.slice(0, -1))).toBe(true);
  });
});
