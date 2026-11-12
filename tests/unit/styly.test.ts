import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const soubory = ['src/styles/fonty.css', 'src/styles/hlavni.css', 'src/styles/stranky.css', 'src/styles/upravy.css', 'src/styles/mapa.css'];

describe('styly', () => {
  it.each(soubory)('%s existuje a nenačítá nic z cizích serverů', s => {
    expect(existsSync(s)).toBe(true);
    const css = readFileSync(s, 'utf8');
    expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic|@import\s+url\(\s*["']?https?:/);
  });
  it('fonty.css definuje Redaction i rozpadlé řezy titulku a odkazuje na lokální soubory', () => {
    const css = readFileSync('src/styles/fonty.css', 'utf8');
    expect(css).toContain('"Redaction 10"');
    for (const rodina of ['Redaction 20', 'Redaction 35', 'Redaction 50', 'Redaction 70']) expect(css).toContain(`"${rodina}"`);
    expect(css).not.toContain('JetBrains Mono');
    for (const m of css.matchAll(/url\(([^)]+)\)/g)) {
      const cesta = m[1].replace(/["']/g, '');
      expect(cesta.startsWith('/fonty/')).toBe(true);
      expect(existsSync('public' + cesta)).toBe(true);
    }
  });
  it('portrét a náhled existují', () => {
    expect(existsSync('public/obrazky/portret.webp')).toBe(true);
    expect(existsSync('public/obrazky/nahled.png')).toBe(true);
  });
});
