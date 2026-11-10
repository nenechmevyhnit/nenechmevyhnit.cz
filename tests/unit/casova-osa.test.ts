import { describe, it, expect } from 'vitest';
import { rokCislo, naProcenta, rozsahText, delkaText, datumText, znackyOsy, rokDo } from '../../src/lib/casova-osa';

const DNES = new Date('2026-11-10T12:00:00');

describe('časová osa', () => {
  it('rokCislo podle přesnosti data', () => {
    expect(rokCislo('2008')).toBe(2008.5);
    expect(rokCislo('2008-01')).toBeCloseTo(2008 + 0.5 / 12);
    expect(rokCislo('2008-07-01')).toBeCloseTo(2008 + 6 / 12);
  });
  it('naProcenta ořízne rozsah', () => {
    expect(naProcenta(1980, 1980, 2026)).toBe(0);
    expect(naProcenta(2026, 1980, 2026)).toBe(100);
    expect(naProcenta(1970, 1980, 2026)).toBe(0);
    expect(naProcenta(2030, 1980, 2026)).toBe(100);
  });
  it('rozsahText', () => {
    expect(rozsahText(1982, 2018)).toBe('1982–2018');
    expect(rozsahText(2007, null)).toBe('2007 – dosud');
    expect(rozsahText(2012, 2012)).toBe('2012');
  });
  it('delkaText se skloňováním', () => {
    expect(delkaText(1982, 2018, DNES)).toBe('36 let');
    expect(delkaText(2007, null, DNES)).toBe('19 let a dál');
    expect(delkaText(2012, 2014, DNES)).toBe('2 roky');
    expect(delkaText(2013, 2014, DNES)).toBe('1 rok');
    expect(delkaText(2014, 2014, DNES)).toBe('méně než rok');
  });
  it('datumText', () => {
    expect(datumText('2010')).toBe('2010');
    expect(datumText('2008-03')).toBe('březen 2008');
    expect(datumText('2023-01-09')).toBe('9. 1. 2023');
  });
  it('značky osy po pěti letech včetně posledního roku', () => {
    const z = znackyOsy(1980, 2026);
    expect(z[0]).toEqual({ rok: 1980, hlavni: true });
    expect(z.find(x => x.rok === 1985)?.hlavni).toBe(false);
    expect(z.at(-1)).toEqual({ rok: 2026, hlavni: true });
    expect(z.filter(x => x.rok === 2025)).toHaveLength(1);
  });
  it('rokDo je aktuální rok', () => expect(rokDo(DNES)).toBe(2026));
});
