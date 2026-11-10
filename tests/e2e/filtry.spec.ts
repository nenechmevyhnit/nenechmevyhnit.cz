import { test, expect, type Page } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const viditelne = (page: Page) => page.locator('.radek:not([hidden])');

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('hledání bez diakritiky i v událostech', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('zprava uradu olaf');
  await expect(viditelne(page)).toHaveCount(1);
  await expect(viditelne(page).locator('strong')).toHaveText('Testovací kauza Alfa');
  await expect(page.locator('#pocet')).toHaveText('Zobrazeno 1 z 6 kauz');
});

test('štítky jako NEBO a zrušení filtrů', async ({ page }) => {
  await page.locator('.f-cipy button[data-stitek="offshore"]').click();
  await page.locator('.f-cipy button[data-stitek="dane"]').click();
  await expect(viditelne(page)).toHaveCount(2);
  const zrusit = page.locator('.f-zrusit');
  await expect(zrusit).toBeVisible();
  await zrusit.click();
  await expect(viditelne(page)).toHaveCount(6);
  await expect(page.locator('.f-cipy button[aria-pressed="true"]')).toHaveCount(0);
});

test('jen neuzavřené', async ({ page }) => {
  await page.getByLabel('jen neuzavřené').check();
  await expect(viditelne(page)).toHaveCount(3);
});

test('prázdný výsledek a tlačítko v něm', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('nic takového neexistuje');
  await expect(page.locator('.prazdno')).toBeVisible();
  await page.locator('.prazdno [data-zrusit]').click();
  await expect(viditelne(page)).toHaveCount(6);
  await expect(page.getByRole('searchbox', { name: 'Hledat v kauzách' })).toHaveValue('');
});

test('zvláštní znaky v hledání nerozbijí stránku', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', e => chyby.push(e.message));
  for (const t of ['(', '+', '*', '\\', '"', '[a-z]']) {
    await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill(t);
  }
  expect(chyby).toEqual([]);
  await overBezPosouvani(page);
});

test('místo pro Zrušit filtry je rezervované (nic se neposune)', async ({ page }) => {
  const pred = await page.locator('.f-hledat').boundingBox();
  await page.locator('.f-cipy button[data-stitek="dotace"]').click();
  const po = await page.locator('.f-hledat').boundingBox();
  expect(po).toEqual(pred);
});
