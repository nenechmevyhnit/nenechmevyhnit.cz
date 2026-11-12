import { describe, it, expect } from 'vitest';
import { normalizuj, odpovida, jeAktivni, seradit, delkaLet, PRAZDNY_FILTR, type PolozkaHledani, type Filtr } from '../../src/lib/hledani';

const DNES = new Date('2026-11-10T12:00:00');
const p: PolozkaHledani = {
  slug: 'alfa', nazev: 'Alfa', od: 2007, do: null, stav: 'obzaloba', posledni: '2026-03-05', castka: null,
  otevrena: true, stitky: ['dotace', 'eu-fondy'], text: normalizuj('Čapí Alfa zpráva úřadu OLAF'),
};
const prazdny: Filtr = { ...PRAZDNY_FILTR };
const sedi = (pol: PolozkaHledani, f: Partial<Filtr>) => odpovida(pol, { ...prazdny, ...f }, DNES);

describe('hledání', () => {
  it('normalizuje diakritiku a velikost písmen', () => expect(normalizuj('Čapí HNÍZDO')).toBe('capi hnizdo'));
  it('prázdný filtr pustí vše', () => expect(odpovida(p, prazdny)).toBe(true));
  it('hledá bez diakritiky', () => expect(odpovida(p, { ...prazdny, text: 'capi' })).toBe(true));
  it('všechna slova musí sedět', () => {
    expect(odpovida(p, { ...prazdny, text: 'alfa olaf' })).toBe(true);
    expect(odpovida(p, { ...prazdny, text: 'alfa beta' })).toBe(false);
  });
  it('štítky jako NEBO', () => {
    expect(odpovida(p, { ...prazdny, stitky: ['offshore', 'dotace'] })).toBe(true);
    expect(odpovida(p, { ...prazdny, stitky: ['offshore'] })).toBe(false);
  });
  it('jen neuzavřené', () => {
    expect(odpovida({ ...p, otevrena: false }, { ...prazdny, jenOtevrene: true })).toBe(false);
  });
  it.each(['(', '+', '*', '\\', '"', '[a-z]', '   '])('zvláštní znak %j nespadne', t => {
    expect(() => odpovida(p, { ...prazdny, text: t })).not.toThrow();
  });
  it('samé mezery = žádný text', () => expect(odpovida(p, { ...prazdny, text: '   ' })).toBe(true));
  it('jeAktivni', () => {
    expect(jeAktivni(prazdny)).toBe(false);
    expect(jeAktivni({ ...prazdny, text: '  ' })).toBe(false);
    expect(jeAktivni({ ...prazdny, jenOtevrene: true })).toBe(true);
    expect(jeAktivni({ ...prazdny, stav: 'obzaloba' })).toBe(true);
    expect(jeAktivni({ ...prazdny, trvani: 'nad-10' })).toBe(true);
    expect(jeAktivni({ ...prazdny, obdobi: 'od-2020' })).toBe(true);
  });
  it('stav řízení', () => {
    expect(sedi(p, { stav: 'obzaloba' })).toBe(true);
    expect(sedi(p, { stav: 'odlozeno' })).toBe(false);
  });
});

describe('doba trvání', () => {
  it('délka v letech, otevřená kauza do letoška', () => {
    expect(delkaLet(2007, null, DNES)).toBe(19);
    expect(delkaLet(2017, 2017, DNES)).toBe(0);
    expect(delkaLet(2016, 2018, DNES)).toBe(2);
  });
  it('rozdělení do skupin podle délky', () => {
    const k = (od: number, d: number | null) => ({ ...p, od, do: d });
    expect(sedi(k(2017, 2017), { trvani: 'do-1' })).toBe(true);
    expect(sedi(k(2017, 2018), { trvani: 'do-1' })).toBe(true);
    expect(sedi(k(2016, 2018), { trvani: '2-5' })).toBe(true);
    expect(sedi(k(2016, 2018), { trvani: 'do-1' })).toBe(false);
    expect(sedi(k(2010, 2020), { trvani: '6-10' })).toBe(true);
    expect(sedi(k(2007, null), { trvani: 'nad-10' })).toBe(true);
    expect(sedi(k(2007, null), { trvani: '6-10' })).toBe(false);
  });
});

describe('období', () => {
  const k = (od: number, d: number | null) => ({ ...p, od, do: d });
  it('kauza patří do období, ve kterém aspoň chvíli probíhala', () => {
    expect(sedi(k(1994, null), { obdobi: 'do-1999' })).toBe(true);
    expect(sedi(k(1994, null), { obdobi: '2010-2019' })).toBe(true);
    expect(sedi(k(2001, 2017), { obdobi: 'od-2020' })).toBe(false);
    expect(sedi(k(2017, 2022), { obdobi: 'od-2020' })).toBe(true);
    expect(sedi(k(2003, 2004), { obdobi: '2010-2019' })).toBe(false);
    expect(sedi(k(2009, 2010), { obdobi: '2000-2009' })).toBe(true);
  });
});

describe('filtr podle částky', () => {
  const s = (castka: number | null, f: string) => sedi({ ...p, castka }, { castka: f });
  it('jen s uvedenou částkou', () => { expect(s(31000, 'ano')).toBe(true); expect(s(null, 'ano')).toBe(false); });
  it('přes 100 mil. Kč', () => { expect(s(272e6, 'nad-100m')).toBe(true); expect(s(50e6, 'nad-100m')).toBe(false); });
  it('přes 1 mld. Kč', () => { expect(s(19e9, 'nad-1mld')).toBe(true); expect(s(272e6, 'nad-1mld')).toBe(false); expect(s(null, 'nad-1mld')).toBe(false); });
  it('filtr částky je aktivní filtr', () => expect(jeAktivni({ ...prazdny, castka: 'ano' })).toBe(true));
});

describe('řazení', () => {
  const a = { ...p, slug: 'a', nazev: 'Čapí hnízdo', od: 2007, do: null, posledni: '2026-08-31' };
  const b = { ...p, slug: 'b', nazev: 'Agrofert', od: 1994, do: null, posledni: '2023' };
  const c = { ...p, slug: 'c', nazev: 'Lety', od: 2016, do: 2018, posledni: '2018-06' };
  const slugy = (r: string) => seradit([a, b, c], r, DNES).map(x => x.slug);
  it('podle částky: největší první, kauzy bez částky na konec', () => {
    const s = seradit([{ ...a, castka: 50e6 }, { ...b, castka: null }, { ...c, castka: 19e9 }], 'castka', DNES).map(x => x.slug);
    expect(s).toEqual(['c', 'a', 'b']);
  });
  it('od nejstarší je výchozí', () => expect(slugy('zacatek')).toEqual(['b', 'a', 'c']));
  it('od nejnovější', () => expect(slugy('novejsi')).toEqual(['c', 'a', 'b']));
  it('podle poslední události', () => expect(slugy('aktivita')).toEqual(['a', 'b', 'c']));
  it('od nejdelší', () => expect(slugy('delka')).toEqual(['b', 'a', 'c']));
  it('podle názvu česky (Č po C)', () => expect(slugy('nazev')).toEqual(['b', 'a', 'c']));
  it('nemění vstupní pole', () => {
    const vstup = [a, b, c];
    seradit(vstup, 'novejsi', DNES);
    expect(vstup.map(x => x.slug)).toEqual(['a', 'b', 'c']);
  });
});
