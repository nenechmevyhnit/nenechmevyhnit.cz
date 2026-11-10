import { describe, it, expect } from 'vitest';
import { normalizuj, odpovida, jeAktivni, type PolozkaHledani, type Filtr } from '../../src/lib/hledani';

const p: PolozkaHledani = { slug: 'alfa', otevrena: true, stitky: ['dotace', 'eu-fondy'], text: normalizuj('Čapí Alfa zpráva úřadu OLAF') };
const prazdny: Filtr = { text: '', stitky: [], jenOtevrene: false };

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
  });
});
