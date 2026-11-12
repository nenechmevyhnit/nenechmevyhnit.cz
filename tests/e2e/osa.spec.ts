import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('osa vykreslí kauzy seřazené podle začátku', async ({ page }) => {
  await page.goto('/');
  const radky = page.locator('.radek');
  await expect(radky).toHaveCount(6);
  await expect(radky.first().locator('strong')).toHaveText('Testovací kauza Beta');
  await expect(radky.first().locator('.popisek')).toContainText('1982–2018');
  await expect(radky.first().locator('.popisek')).toContainText('36 let');
  await expect(page.locator('.radek[data-slug="alfa-dotace"] .popisek')).toContainText('2007 – dosud');
  await expect(page.locator('.radek[data-slug="alfa-dotace"] .pruh')).toHaveClass(/otevrena/);
  await expect(page.locator('.radek[data-slug="alfa-dotace"] .pruh i')).toHaveCount(4);
});

test('úvod U2 a portrét', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Za půl roku si to nikdo nebude pamatovat.');
  await expect(page.locator('.portret img')).toHaveAttribute('src', '/obrazky/portret.webp');
  await overBezPosouvani(page);
});

test('řádek je odkaz na stránku kauzy (funguje i bez JS)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.radek[data-slug="alfa-dotace"] a.radek-btn')).toHaveAttribute('href', '/kauzy/alfa-dotace/');
});

test('prázdný archiv ukáže hlášku a stránka se neposouvá', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', e => chyby.push(e.message));
  await page.goto('http://localhost:4322/');
  await expect(page.locator('.archiv-prazdny')).toContainText('Archiv se připravuje');
  await expect(page.locator('.radek')).toHaveCount(0);
  expect(chyby).toEqual([]);
  await overBezPosouvani(page);
});
