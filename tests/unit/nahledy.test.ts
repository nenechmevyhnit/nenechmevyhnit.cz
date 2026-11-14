import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { nactiKauzy } from '../../src/lib/kauzy';

describe('náhledové obrázky', () => {
  it('každá zveřejněná kauza má vlastní náhled', () => {
    const chybi = nactiKauzy()
      .map(z => `public/obrazky/nahledy/${z.slug}.png`)
      .filter(c => !existsSync(c));
    expect(chybi).toEqual([]);
  });

  it('náhledy nejsou prázdné soubory', () => {
    for (const z of nactiKauzy()) {
      expect(statSync(`public/obrazky/nahledy/${z.slug}.png`).size, z.slug).toBeGreaterThan(1000);
    }
  });

  it('záložní náhled pro stránky bez vlastního zůstal', () => {
    expect(existsSync('public/obrazky/nahled.png')).toBe(true);
  });
});
