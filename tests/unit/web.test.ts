import { describe, it, expect } from 'vitest';
import { WEB, titulek } from '../../src/lib/web';

describe('web', () => {
  it('drží název a doménu projektu', () => {
    expect(WEB.nazev).toBe('Posuďte sami');
    expect(WEB.domena).toBe('https://posudtesami.cz');
  });

  it('skládá titulek stránky s příponou názvu webu', () => {
    expect(titulek('Metodika')).toBe('Metodika — Posuďte sami');
  });
});
