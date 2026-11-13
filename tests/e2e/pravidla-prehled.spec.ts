import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

const NAZVY = ['Testovací novela zákona Omega s dlouhým názvem pro mobil', 'Testovací pozměňovací návrh Sigma', 'Testovací nařízení Tau'];

test('menu vede na změny pravidel a přehled je seřazený od nejnovější změny', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: 'Změny pravidel' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page).toHaveTitle('Změny pravidel — Nenechme vyhnít');
  await expect(page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: 'Změny pravidel' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Které změny pravidel prospívají Babišovi a Agrofertu');
  await expect(page.locator('.pr-radek .pr-nazev strong')).toHaveText(NAZVY);
  const prvni = page.locator('.pr-radek').first();
  await expect(prvni).toContainText('Poslanecký návrh zákona');
  await expect(prvni).toContainText('Schváleno Sněmovnou');
  await expect(prvni).toContainText('Andrej Babiš, Agrofert');
  await expect(prvni).toContainText('prospěch pravděpodobný');
});

test('řádek ukazuje průběh projednávání', async ({ page }) => {
  await page.goto('/pravidla/');
  const omega = page.locator('.pr-radek[data-slug="zakon-omega"] .prubeh');
  await expect(omega.locator('li:not(.konec)')).toHaveCount(5);
  await expect(omega.locator('li.hotovo')).toHaveCount(2);
  await expect(page.locator('.pr-radek[data-slug="pozmenovaci-sigma"] .prubeh li.konec')).toContainText('Zamítnuto');
  await expect(page.locator('.pr-radek[data-slug="narizeni-tau"] .prubeh li.hotovo')).toHaveCount(3);
});

test('filtry: hledání bez diakritiky, štítek, jen v projednávání, zrušení a prázdný stav', async ({ page }) => {
  await page.goto('/pravidla/');
  const viditelne = page.locator('.pr-radek:not([hidden])');
  const hledat = page.getByRole('searchbox', { name: 'Hledat ve změnách pravidel' });
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 3 z 3');
  await hledat.fill('lhutu k vymahani');
  await expect(viditelne).toHaveCount(1);
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 1 z 3');
  await page.locator('.pr-filtry .f-zrusit').click();
  await expect(viditelne).toHaveCount(3);
  await expect(hledat).toHaveValue('');
  await page.locator('.pr-filtry [data-stitek="eu-fondy"]').click();
  await expect(viditelne).toHaveCount(1);
  await expect(viditelne.first()).toHaveAttribute('data-slug', 'narizeni-tau');
  await page.locator('.pr-filtry [data-stitek="eu-fondy"]').click();
  await page.getByLabel('jen v projednávání').check();
  await expect(viditelne).toHaveCount(1);
  await expect(viditelne.first()).toHaveAttribute('data-slug', 'zakon-omega');
  await hledat.fill('nic takoveho neexistuje');
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeVisible();
  await page.locator('.pravidla-seznam .prazdno [data-zrusit]').click();
  await expect(viditelne).toHaveCount(3);
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeHidden();
});

test('prázdný archiv nemá položku menu ani stránku pravidel', async ({ page }) => {
  await page.goto('http://localhost:4322/');
  await expect(page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: /pravidel|Pravidla/ })).toHaveCount(0);
  const odpoved = await page.goto('http://localhost:4322/pravidla/');
  expect(odpoved?.status()).toBe(404);
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: přehled se neposouvá dolů a poslední řádek jde zobrazit`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/');
    await overBezPosouvani(page);
    const posledni = page.locator('.pr-radek').last();
    await posledni.scrollIntoViewIfNeeded();
    await expect(posledni).toBeInViewport();
  });
}
