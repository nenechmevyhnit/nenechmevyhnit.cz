import { describe, it, expect } from 'vitest';
import { osaPravidel, OSA_OD } from '../../src/lib/osa-pravidel';

const DNES = new Date('2026-11-13T12:00:00Z');
type U = { datum: string; krok?: any; nazev: string };
const z = (slug: string, nazev: string, udalosti: U[], ucinnostOd?: string, cesta: any = 'poslanecky-navrh') =>
  ({ slug, pravidlo: { nazev, cesta, udalosti, ...(ucinnostOd ? { ucinnostOd } : {}) } });

describe('osaPravidel', () => {
  it('rozsah začíná 1. 12. 2025 a končí dneškem s okrajem, bez budoucí účinnosti', () => {
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03-01', krok: 'predlozeno', nazev: 'Podáno' }])], DNES);
    expect(o.od).toBe(OSA_OD);
    expect(o.do).toBe('2026-11-13');
    expect(o.dnes).toBeGreaterThan(90);
    expect(o.dnes).toBeLessThan(100);
  });
  it('rozsah sahá k nejzazší budoucí účinnosti a „dnes“ je uvnitř', () => {
    const o = osaPravidel([
      z('a', 'A', [{ datum: '2026-03-01', krok: 'predlozeno', nazev: 'Podáno' }], '2027-07-01'),
      z('b', 'B', [{ datum: '2026-04-01', krok: 'predlozeno', nazev: 'Podáno' }], '2027-01-01'),
    ], DNES);
    expect(o.do).toBe('2027-07-01');
    expect(o.dnes).toBeGreaterThan(50);
    expect(o.dnes).toBeLessThan(70);
    const a = o.radky.find(r => r.slug === 'a')!;
    const ucinnost = a.body.find(b => b.druh === 'ucinnost')!;
    expect(ucinnost.udalost).toBeNull();
    expect(ucinnost.popisek).toBe('Účinnost od 1. 7. 2027');
    expect(ucinnost.x).toBeGreaterThan(95);
    expect(ucinnost.x).toBeLessThanOrEqual(100);
  });
  it('značky po měsících: první je běžný prosinec, letopočet nese jen leden', () => {
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03-01', krok: 'predlozeno', nazev: 'Podáno' }])], DNES);
    expect(o.znacky[0]).toEqual({ x: 0, text: 'pro', rok: false });
    expect(o.znacky[1]).toMatchObject({ text: '2026', rok: true });
    expect(o.znacky[2]).toMatchObject({ text: 'úno', rok: false });
    expect(o.znacky).toHaveLength(12);
  });
  it('druh bodu podle kroku, popisky, index události', () => {
    const o = osaPravidel([z('a', 'Novela A', [
      { datum: '2026-03-01', krok: 'predlozeno', nazev: 'Návrh podán' },
      { datum: '2026-04-01', nazev: 'Článek v médiích' },
      { datum: '2026-05-14', krok: 'zamitnuto', nazev: 'Zamítnuto' },
    ])], DNES);
    const [b0, b1, b2] = o.radky[0].body;
    expect(b0).toMatchObject({ druh: 'krok', datum: '2026-03-01', popisek: '1. 3. 2026 · Předloženo', udalost: 0, posun: 0, popisekSkupiny: null });
    expect(b1).toMatchObject({ druh: 'udalost', popisek: '1. 4. 2026 · Článek v médiích', udalost: 1 });
    expect(b2).toMatchObject({ druh: 'konec', popisek: '14. 5. 2026 · Zamítnuto', udalost: 2 });
    expect(b0.x).toBeLessThan(b1.x);
    expect(b1.x).toBeLessThan(b2.x);
    expect(o.radky[0].cesta).toBe('Poslanecký návrh zákona');
    expect(o.radky[0].stav).toBe('Zamítnuto');
  });
  it('plná čára mezi prvním a posledním krokem, přerušovaná k budoucí účinnosti', () => {
    const o = osaPravidel([z('a', 'A', [
      { datum: '2026-01-10', nazev: 'Událost' },
      { datum: '2026-03-01', krok: 'predlozeno', nazev: 'Podáno' },
      { datum: '2026-09-20', krok: 'schvaleno-snemovnou', nazev: 'Sněmovna' },
    ], '2027-01-01')], DNES);
    const r = o.radky[0];
    const kroky = r.body.filter(b => b.druh === 'krok');
    expect(r.cara).toEqual({ od: kroky[0].x, do: kroky[1].x });
    expect(r.caraBudouci).toEqual({ od: kroky[1].x, do: r.body.find(b => b.druh === 'ucinnost')!.x });
  });
  it('jediný krok nemá plnou čáru, účinnost v minulosti se nekreslí', () => {
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03-01', krok: 'vyhlaseno', nazev: 'Vyhlášeno' }], '2026-04-01', 'narizeni-vlady')], DNES);
    expect(o.radky[0].cara).toBeNull();
    expect(o.radky[0].caraBudouci).toBeNull();
    expect(o.radky[0].body.map(b => b.druh)).toEqual(['krok']);
  });
  it('události před 1. 12. 2025 se nekreslí, značka „dříve“ nese počet a index první', () => {
    const o = osaPravidel([z('a', 'A', [
      { datum: '2025-06-23', nazev: 'Rozhodnutí soudu' },
      { datum: '2025-11', nazev: 'Listopad' },
      { datum: '2026-04-29', krok: 'pripominkove-rizeni', nazev: 'Připomínky' },
    ], undefined, 'vladni-navrh')], DNES);
    expect(o.radky[0].drive).toEqual({ pocet: 2, udalost: 0 });
    expect(o.radky[0].body).toHaveLength(1);
    expect(o.radky[0].body[0].udalost).toBe(2);
  });
  it('neúplné datum leží uprostřed období', () => {
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03', nazev: 'Březen' }, { datum: '2026-03-01', krok: 'predlozeno', nazev: 'P' }, { datum: '2026-03-31', krok: 'schvaleno-snemovnou', nazev: 'S' }])], DNES);
    const [mesic, prvni, posledni] = o.radky[0].body;
    expect(mesic.x).toBeGreaterThan(prvni.x);
    expect(mesic.x).toBeLessThan(posledni.x);
  });
  it('body ve stejný den dostanou posun a společný popisek', () => {
    const o = osaPravidel([z('a', 'A', [
      { datum: '2026-10-26', nazev: 'Vláda schválila' },
      { datum: '2026-10-26', krok: 'predlozeno', nazev: 'Podáno' },
    ])], DNES);
    const [b0, b1] = o.radky[0].body;
    expect(b0.x).toBe(b1.x);
    expect([b0.posun, b1.posun]).toEqual([0, 1]);
    expect(b0.popisekSkupiny).toBe('26. 10. 2026 · Vláda schválila; 26. 10. 2026 · Předloženo');
    expect(b1.popisekSkupiny).toBe(b0.popisekSkupiny);
  });
  it('body několik dní od sebe se také posunou a sdílejí popisek, vzdálené ne', () => {
    const o = osaPravidel([z('a', 'A', [
      { datum: '2026-10-26', nazev: 'První' },
      { datum: '2026-10-28', krok: 'predlozeno', nazev: 'Podáno' },
      { datum: '2026-03-01', nazev: 'Daleko' },
    ])], DNES);
    const [b0, b1, b2] = o.radky[0].body;
    expect(b1.x - b0.x).toBeLessThan(1);
    expect([b0.posun, b1.posun]).toEqual([0, 1]);
    expect(b0.popisekSkupiny).toBe('26. 10. 2026 · První; 28. 10. 2026 · Předloženo');
    expect(b1.popisekSkupiny).toBe(b0.popisekSkupiny);
    expect(b2).toMatchObject({ posun: 0, popisekSkupiny: null });
  });
  it('účinnost přesně dnes se nekreslí jako budoucí (místní datum, ne UTC)', () => {
    const pulnoc = new Date(2026, 10, 13, 0, 30); // místní půlnoc: v UTC je to kolem půlnoci ještě 12. 11.
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03-01', krok: 'predlozeno', nazev: 'P' }], '2026-11-13')], pulnoc);
    expect(o.do).toBe('2026-11-13');
    expect(o.radky[0].body.map(b => b.druh)).toEqual(['krok']);
    expect(o.radky[0].caraBudouci).toBeNull();
  });
  it('dlouhý rozsah (do 2028) má značky všech měsíců i letopočty 2027 a 2028', () => {
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03-01', krok: 'predlozeno', nazev: 'P' }], '2028-03-01')], DNES);
    const texty = o.znacky.map(m => m.text);
    expect(texty.filter(t => /^\d{4}$/.test(t))).toEqual(['2026', '2027', '2028']);
    expect(o.znacky.length).toBe(28);
  });
  it('řádky podle první události od 1. 12. 2025, při shodě podle názvu', () => {
    const o = osaPravidel([
      z('c', 'Čtvrtý', [{ datum: '2026-05-01', krok: 'predlozeno', nazev: 'P' }]),
      z('b', 'Beta', [{ datum: '2026-02-01', krok: 'predlozeno', nazev: 'P' }]),
      z('a', 'Alfa', [{ datum: '2025-01-01', nazev: 'Dávno' }, { datum: '2026-02-01', krok: 'predlozeno', nazev: 'P' }]),
      z('d', 'Delta', [{ datum: '2026-01-15', krok: 'predlozeno', nazev: 'P' }]),
    ], DNES);
    expect(o.radky.map(r => r.slug)).toEqual(['d', 'a', 'b', 'c']);
  });
  it('prázdný vstup dá osu bez řádků', () => {
    const o = osaPravidel([], DNES);
    expect(o.radky).toEqual([]);
    expect(o.znacky.length).toBeGreaterThan(0);
  });
});
