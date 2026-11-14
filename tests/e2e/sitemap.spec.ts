import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Adresy, které build skutečně vytvořil: každý index.html (404.html se nejmenuje index.html). */
function postaveneAdresy(slozka: string): string[] {
  const najdi = (cesta: string): string[] => readdirSync(cesta, { withFileTypes: true }).flatMap(d => {
    const plna = join(cesta, d.name);
    if (d.isDirectory()) return najdi(plna);
    return d.name === 'index.html' ? [plna] : [];
  });
  return najdi(slozka)
    .map(f => f.slice(slozka.length + 1).split(sep).slice(0, -1).join('/'))
    .map(c => (c === '' ? '/' : `/${c}/`))
    .sort();
}

const vSitemape = (xml: string): string[] =>
  [...xml.matchAll(/<loc>https:\/\/posudtesami\.cz([^<]*)<\/loc>/g)].map(m => m[1]).sort();

test('sitemapa nabízí právě ty adresy, které build vytvořil', async ({ request }) => {
  const odpoved = await request.get('/sitemap.xml');
  expect(odpoved.status()).toBe(200);
  // content-type nastavuje statický server, ne náš endpoint: serve i GitHub Pages
  // posílají pro .xml buď application/xml, nebo text/xml — obojí je správně
  expect(odpoved.headers()['content-type']).toMatch(/xml/);
  expect(vSitemape(await odpoved.text())).toEqual(postaveneAdresy('dist-e2e'));
});

test('každá adresa ze sitemapy odpovídá 200', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const cesta of vSitemape(xml)) {
    expect((await request.get(cesta)).status(), cesta).toBe(200);
  }
});

test('robots.txt se servíruje a odkazuje na sitemapu', async ({ request }) => {
  const odpoved = await request.get('/robots.txt');
  expect(odpoved.status()).toBe(200);
  expect(await odpoved.text()).toContain('Sitemap: https://posudtesami.cz/sitemap.xml');
});

test('prázdný obsah: sitemapa existuje, má jen titulní a statické stránky', async ({ request }) => {
  const odpoved = await request.get('http://localhost:4322/sitemap.xml');
  expect(odpoved.status()).toBe(200);
  const cesty = vSitemape(await odpoved.text());
  expect(cesty).toContain('/');
  expect(cesty).toContain('/metodika/');
  expect(cesty.some(c => c.startsWith('/kauzy/'))).toBe(false);
  expect(cesty.some(c => c.startsWith('/pravidla/'))).toBe(false);
});
