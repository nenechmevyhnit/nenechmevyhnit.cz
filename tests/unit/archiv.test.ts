import { describe, it, expect, vi } from 'vitest';
import { doplnArchiv, ziskejArchiv } from '../../src/lib/archiv';

const BLOK = `zdroje:
  - id: 1
    url: https://example.com/a
    druh: media
  - id: 2
    url: "https://example.com/b"
    archiv: https://web.archive.org/x/b
`;
const RADEK = `zdroje:
  - { id: 1, vydavatel: X, url: "https://example.com/a", druh: media }
`;

describe('doplnArchiv', () => {
  it('blokový zápis: vloží řádek se stejným odsazením', () => {
    const v = doplnArchiv(BLOK, 'https://example.com/a', 'https://web.archive.org/web/2026/https://example.com/a');
    expect(v).toContain('    url: https://example.com/a\n    archiv: https://web.archive.org/web/2026/https://example.com/a\n    druh: media');
  });
  it('existující archiv nemění', () => {
    expect(doplnArchiv(BLOK, 'https://example.com/b', 'https://jiny')).toBe(BLOK);
  });
  it('řádkový zápis: doplní klíč do objektu', () => {
    const v = doplnArchiv(RADEK, 'https://example.com/a', 'https://web.archive.org/web/2026/a');
    expect(v).toContain('url: "https://example.com/a", archiv: "https://web.archive.org/web/2026/a", druh: media');
  });
  it('neznámá URL nic nezmění', () => expect(doplnArchiv(BLOK, 'https://jine.cz', 'x')).toBe(BLOK));
});

describe('ziskejArchiv', () => {
  it('vrátí adresu snímku z odpovědi Save Page Now', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, url: 'https://web.archive.org/web/20261110120000/https://example.com/a', headers: new Headers() });
    expect(await ziskejArchiv('https://example.com/a', f as any)).toBe('https://web.archive.org/web/20261110120000/https://example.com/a');
  });
  it('při chybě vrátí null', async () => {
    const f = vi.fn().mockRejectedValue(new Error('síť'));
    expect(await ziskejArchiv('https://example.com/a', f as any)).toBeNull();
  });
});
