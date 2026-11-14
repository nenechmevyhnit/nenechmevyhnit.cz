import { describe, it, expect } from 'vitest';
import { pocetNaStranku, pocetStranek, cislaStranek } from '../../src/lib/strankovani';

describe('stránkování', () => {
  it('na stránku se vejde tolik řádků, kolik dovolí výška', () => {
    expect(pocetNaStranku(580, 34, Infinity)).toBe(17);
    expect(pocetNaStranku(580, 34)).toBe(10);
    expect(pocetNaStranku(200, 34)).toBe(5);
    expect(pocetNaStranku(33.6, 34)).toBe(1);
    expect(pocetNaStranku(0, 34)).toBe(1);
    expect(pocetNaStranku(100, 0)).toBe(1);
  });
  it('počet stránek', () => {
    expect(pocetStranek(0, 17)).toBe(1);
    expect(pocetStranek(17, 17)).toBe(1);
    expect(pocetStranek(18, 17)).toBe(2);
    expect(pocetStranek(200, 17)).toBe(12);
  });
  it('čísla stránek: málo stránek bez mezer', () => {
    expect(cislaStranek(1, 1)).toEqual([1]);
    expect(cislaStranek(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('čísla stránek: mezery (null) u dlouhého seznamu, nejvýš 7 položek', () => {
    expect(cislaStranek(1, 12)).toEqual([1, 2, 3, 4, 5, null, 12]);
    expect(cislaStranek(4, 12)).toEqual([1, 2, 3, 4, 5, null, 12]);
    expect(cislaStranek(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
    expect(cislaStranek(9, 12)).toEqual([1, null, 8, 9, 10, 11, 12]);
    expect(cislaStranek(12, 12)).toEqual([1, null, 8, 9, 10, 11, 12]);
  });
  it('čísla stránek na mobilu: nejvýš 5 položek, první, aktuální a poslední stránka jsou vždy vidět', () => {
    expect(cislaStranek(2, 4, 5)).toEqual([1, 2, 3, 4]);
    expect(cislaStranek(3, 5, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(cislaStranek(1, 12, 5)).toEqual([1, 2, 3, null, 12]);
    expect(cislaStranek(3, 12, 5)).toEqual([1, 2, 3, null, 12]);
    expect(cislaStranek(4, 12, 5)).toEqual([1, null, 4, null, 12]);
    expect(cislaStranek(9, 12, 5)).toEqual([1, null, 9, null, 12]);
    expect(cislaStranek(10, 12, 5)).toEqual([1, null, 10, 11, 12]);
    expect(cislaStranek(12, 12, 5)).toEqual([1, null, 10, 11, 12]);
  });
});
