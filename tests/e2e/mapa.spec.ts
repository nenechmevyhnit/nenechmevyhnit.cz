import { test, expect, type Page } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const prepinac = (page: Page) => page.locator('.osa-roku .pohled');

test('přepínač ukáže mapu a zapíše pohled do adresy', async ({ page }) => {
  await page.goto('/');
  await expect(prepinac(page).getByRole('button', { name: 'Osa' })).toHaveAttribute('aria-pressed', 'true');
  await prepinac(page).getByRole('button', { name: 'Mapa' }).click();
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
  await expect(prepinac(page).getByRole('button', { name: 'Mapa' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.mapa-svg')).toBeVisible();
  await expect(page.locator('.radky')).toBeHidden();
  await expect(page.locator('.mapa-svg [data-uzel="babis"]')).toContainText('Andrej Babiš');
  await expect(page.locator('.mapa-svg .m-kauza')).toHaveCount(6);
  await expect(page.locator('.mapa-svg .m-akter')).toHaveCount(3);
  await prepinac(page).getByRole('button', { name: 'Osa' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.radky')).toBeVisible();
});

test('adresa ?pohled=mapa otevře rovnou mapu', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await expect(page.locator('#graf')).toHaveAttribute('data-pohled', 'mapa');
  await expect(page.locator('.mapa-svg')).toBeVisible();
});

test('filtr skryje kauzy i aktéry, kterým nezbyde kauza; prázdný výsledek má hlášku', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const hledat = page.getByRole('searchbox', { name: 'Hledat v kauzách' });
  await hledat.fill('Beta');
  await expect(page.locator('.mapa-svg .m-kauza')).toHaveCount(1);
  await expect(page.locator('.mapa-svg .m-akter')).toHaveCount(0);
  await expect(page.locator('.strom li[data-uzel="a:fond-sigma"]').first()).toBeHidden();
  await hledat.fill('nic takového neexistuje');
  await expect(page.locator('.mapa-prazdno')).toBeVisible();
  await hledat.fill('');
  await expect(page.locator('.mapa-svg .m-kauza')).toHaveCount(6);
});

test('návrat z mapy na osu po filtru: osa a stránkování sedí', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('Beta');
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('');
  await prepinac(page).getByRole('button', { name: 'Osa' }).click();
  await expect(page.locator('.radek:not([hidden])')).toHaveCount(6);
  await expect(page.locator('.strankovani')).toBeHidden();
});

test('názvy se vejdou do uzlů', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await expect(page.locator('.mapa-svg')).toBeVisible();
  const pretekaji = await page.locator('.mapa-svg .m-uzel').evaluateAll(gs => gs
    .filter(g => (g.querySelector('text') as SVGTextElement).getBBox().width > Number(g.querySelector('rect')!.getAttribute('width')) - 8)
    .map(g => g.getAttribute('data-uzel')));
  expect(pretekaji).toEqual([]);
});

for (const v of VELIKOSTI) {
  test(`mapa ${v.width}×${v.height} se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/?pohled=mapa');
    await expect(page.locator('#graf')).toHaveAttribute('data-pohled', 'mapa');
    await overBezPosouvani(page);
  });
}

test('prázdný archiv nemá přepínač mapy', async ({ page }) => {
  await page.goto('http://localhost:4322/');
  await expect(page.locator('.pohled')).toHaveCount(0);
});
