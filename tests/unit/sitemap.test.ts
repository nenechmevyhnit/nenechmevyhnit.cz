import { describe, it, expect } from 'vitest';
import { adresy, sitemapaXml } from '../../src/lib/sitemap';

describe('sitemapaXml', () => {
  it('vypíše adresu s lastmod', () => {
    const xml = sitemapaXml([{ cesta: '/kauzy/alfa/', zmeneno: '2026-11-09' }]);
    expect(xml).toContain('<loc>https://posudtesami.cz/kauzy/alfa/</loc>');
    expect(xml).toContain('<lastmod>2026-11-09</lastmod>');
  });

  it('bez data ověření lastmod vynechá, nikdy nevypíše null', () => {
    const xml = sitemapaXml([{ cesta: '/kauzy/alfa/' }]);
    expect(xml).toContain('<loc>https://posudtesami.cz/kauzy/alfa/</loc>');
    expect(xml).not.toContain('lastmod');
    expect(xml).not.toContain('null');
  });

  it('každá adresa končí lomítkem', () => {
    for (const z of adresy()) expect(z.cesta.endsWith('/'), z.cesta).toBe(true);
  });

  it('obsahuje titulní stránku, kauzy a statické stránky, ale ne 404', () => {
    const cesty = adresy().map(z => z.cesta);
    expect(cesty).toContain('/');
    expect(cesty).toContain('/metodika/');
    expect(cesty).toContain('/o-projektu/');
    expect(cesty.some(c => c.startsWith('/kauzy/'))).toBe(true);
    expect(cesty).not.toContain('/404/');
  });

  it('neobsahuje duplicitní adresy', () => {
    const cesty = adresy().map(z => z.cesta);
    expect(cesty.length).toBe(new Set(cesty).size);
  });
});
