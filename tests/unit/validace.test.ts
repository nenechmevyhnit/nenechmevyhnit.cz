import { describe, it, expect } from 'vitest';
import { overKauzu, overAdresar } from '../../src/lib/validace';
import { platnaKauza } from './ukazka';

const STITKY = new Set(['dotace', 'soudy']);

describe('overKauzu', () => {
  it('platná kauza bez chyb', () => {
    expect(overKauzu('a.md', platnaKauza(), 'Odstavec.[^1]', STITKY).chyby).toEqual([]);
  });
  it('neznámý štítek', () => {
    const r = overKauzu('a.md', { ...platnaKauza(), stitky: ['neznamy'] }, 'O.[^1]', STITKY);
    expect(r.chyby[0].zprava).toMatch(/Neznámý štítek „neznamy“/);
  });
  it('odstavec bez poznámky', () => {
    const r = overKauzu('a.md', platnaKauza(), 'S poznámkou.[^1]\n\nBez poznámky.', STITKY);
    expect(r.chyby.map(c => c.zprava).join(' ')).toMatch(/Odstavec 2 souvislostí nemá poznámku/);
  });
  it('poznámka na neexistující zdroj', () => {
    const r = overKauzu('a.md', platnaKauza(), 'Text.[^8]', STITKY);
    expect(r.chyby[0].zprava).toMatch(/Poznámka \[\^8\] odkazuje na neexistující zdroj/);
  });
  it('chyby nesou název souboru', () => {
    const r = overKauzu('obsah/kauzy/x.md', { ...platnaKauza(), stav: 'spatne' }, '', STITKY);
    expect(r.chyby.every(c => c.soubor === 'obsah/kauzy/x.md')).toBe(true);
  });
});

describe('overAdresar', () => {
  it('načte fiktivní obsah bez chyb, seřazený podle začátku', () => {
    const r = overAdresar('tests/fixtures/obsah');
    expect(r.chyby).toEqual([]);
    expect(r.zaznamy).toHaveLength(6);
    expect(r.zaznamy[0].slug).toBe('beta-archiv');
    expect(r.stitky.get('eu-fondy')).toBe('EU fondy');
  });
  it('prázdný archiv je platný', () => {
    const r = overAdresar('tests/fixtures/prazdny');
    expect(r.chyby).toEqual([]);
    expect(r.zaznamy).toEqual([]);
  });
  it('neplatný název souboru je chyba', () => {
    expect(overAdresar('tests/fixtures/obsah').zaznamy.every(z => /^[a-z0-9-]+$/.test(z.slug))).toBe(true);
  });
});

describe('režim konceptů', () => {
  const bezOvereni = () => { const k = platnaKauza(); k.overeno = null; return k; };
  it('bez režimu konceptů je chybějící ověření chyba', () => {
    expect(overKauzu('a.md', bezOvereni(), '', STITKY).chyby.length).toBeGreaterThan(0);
  });
  it('v režimu konceptů smí ověření chybět', () => {
    const r = overKauzu('a.md', bezOvereni(), '', STITKY, { koncepty: true });
    expect(r.chyby).toEqual([]);
    expect(r.kauza?.overeno).toBeNull();
  });
  it('v režimu konceptů platí ostatní pravidla dál', () => {
    const r = overKauzu('a.md', { ...bezOvereni(), stanovisko: undefined }, '', STITKY, { koncepty: true });
    expect(r.chyby.length).toBeGreaterThan(0);
  });
  it('v režimu konceptů zůstává vyplněné ověření', () => {
    expect(overKauzu('a.md', platnaKauza(), '', STITKY, { koncepty: true }).kauza?.overeno).toBe('2026-11-09');
  });
});
