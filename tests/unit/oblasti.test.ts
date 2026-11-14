import { describe, it, expect } from 'vitest';
import { kategorieStavu, spocitej, textPoctu, bezPripominek, sestavOblasti, skupinyHodnoceni } from '../../src/lib/oblasti';
import { overAdresar } from '../../src/lib/validace';
import { CESTY } from '../../src/lib/pravidla-slovnik';
import { oblastSchema } from '../../src/lib/schema-oblasti';
import { platnaOblast } from './ukazka';

describe('kategorie stavu a počty', () => {
  it('přijato, v projednávání, ukončeno', () => {
    expect(kategorieStavu('vyhlaseno')).toBe('prijato');
    expect(kategorieStavu('schvaleno')).toBe('prijato');
    expect(kategorieStavu('schvaleno-snemovnou')).toBe('projednava');
    expect(kategorieStavu('predlozeno')).toBe('projednava');
    for (const k of ['zamitnuto', 'stazeno', 'zruseno', 'zruseno-us'] as const) expect(kategorieStavu(k)).toBe('ukonceno');
  });
  it('spočítá a vypíše česky, ukončené jen nenulové', () => {
    expect(spocitej(['prijato', 'projednava', 'projednava'])).toEqual({ celkem: 3, prijato: 1, projednava: 2, ukonceno: 0 });
    expect(textPoctu({ celkem: 3, prijato: 1, projednava: 2, ukonceno: 0 })).toBe('3 změny · 1 přijata · 2 v projednávání');
    expect(textPoctu({ celkem: 1, prijato: 0, projednava: 0, ukonceno: 1 })).toBe('1 změna · 0 přijato · 0 v projednávání · 1 ukončena');
    expect(textPoctu({ celkem: 5, prijato: 2, projednava: 0, ukonceno: 3 })).toBe('5 změn · 2 přijaty · 0 v projednávání · 3 ukončeny');
  });
});

describe('bez připomínkového řízení', () => {
  it('podle cesty předložení', () => {
    const bez = CESTY.filter(bezPripominek);
    expect(bez).toEqual(['poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh']);
  });
});

describe('sestavOblasti (fixtures)', () => {
  const r = overAdresar('tests/fixtures/obsah');
  const oblasti = sestavOblasti(r.pravidla, r.oblasti);
  it('jen oblasti se změnami, v pořadí slovníku', () => {
    expect(oblasti.map(o => o.id)).toEqual(['dotace-stret-zajmu', 'zemedelstvi-potraviny', 'soudy-policie', 'kontrolni-urady']);
  });
  it('změny od nejnovější a počty', () => {
    const d = oblasti[0];
    expect(d.nazev).toBe('Dotace a střet zájmů');
    expect(d.zmeny.map(z => z.slug)).toEqual(['zakon-omega', 'pozmenovaci-sigma']);
    expect(textPoctu(d.pocty)).toBe('2 změny · 0 přijato · 1 v projednávání · 1 ukončena');
    expect(textPoctu(oblasti[1].pocty)).toBe('1 změna · 1 přijata · 0 v projednávání');
  });
  it('změna ve dvou oblastech je v obou', () => {
    expect(oblasti.find(o => o.id === 'kontrolni-urady')!.zmeny.map(z => z.slug)).toEqual(['zakon-omega']);
  });
  it('oblast bez souboru (koncepty) má data null a popisek ze slovníku', () => {
    const bez = sestavOblasti(r.pravidla, []);
    expect(bez[0].data).toBeNull();
    expect(bez[0].popisek).toBe('Kdo dostane peníze z dotací a kdo to hlídá');
  });
  it('prázdný archiv nemá žádnou oblast', () => expect(sestavOblasti([], [])).toEqual([]));
});

describe('skupinyHodnoceni', () => {
  it('pořadí vláda, instituce, odborníci; uvnitř od nejnovějšího; prázdná skupina chybí', () => {
    const data = oblastSchema.parse({
      ...platnaOblast(),
      hodnoceni: [
        { typ: 'odbornik', kdo: 'A', funkce: 'f', citace: 'c', datum: '2026-05-01', zdroje: [1] },
        { typ: 'vlada', kdo: 'V', funkce: 'f', citace: 'c', datum: '2026-04-01', zdroje: [1] },
        { typ: 'odbornik', kdo: 'B', funkce: 'f', citace: 'c', datum: '2026-06-01', zdroje: [1] },
      ],
    });
    const s = skupinyHodnoceni(data.hodnoceni);
    expect(s.map(x => x.nazev)).toEqual(['Stanovisko vlády', 'Odborníci']);
    expect(s[1].polozky.map(h => h.kdo)).toEqual(['B', 'A']);
  });
});
