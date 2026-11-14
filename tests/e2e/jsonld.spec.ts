import { test, expect, type Page } from '@playwright/test';

const data = async (page: Page) =>
  (await page.locator('script[type="application/ld+json"]').allTextContents()).map(t => JSON.parse(t));

test('titulní stránka nese platný WebSite', async ({ page }) => {
  await page.goto('/');
  const d = await data(page);
  expect(d).toHaveLength(1);
  expect(d[0]['@type']).toBe('WebSite');
});

test('stránka kauzy nese platný Article s citacemi a drobečky', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const [d] = await data(page);
  expect(d['@type']).toBe('Article');
  expect(d.headline).toBe('Testovací kauza Alfa');
  expect(d.citation.length).toBeGreaterThan(0);
  expect(d.breadcrumb.itemListElement).toHaveLength(3);
  expect(d.datePublished).toBeUndefined();
});

test('stránka kauzy má vlastní náhledový obrázek s rozměry', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const obsah = (vlastnost: string) => page.locator(`meta[property="${vlastnost}"]`).getAttribute('content');
  expect(await obsah('og:image')).toBe('https://posudtesami.cz/obrazky/nahledy/alfa-dotace.png');
  expect(await obsah('og:image:width')).toBe('1200');
  expect(await obsah('og:image:height')).toBe('630');
  expect(await obsah('og:image:alt')).toContain('Testovací kauza Alfa');
});

test('titulní stránka má záložní náhled', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('meta[property="og:image"]').getAttribute('content'))
    .toBe('https://posudtesami.cz/obrazky/nahled.png');
});
