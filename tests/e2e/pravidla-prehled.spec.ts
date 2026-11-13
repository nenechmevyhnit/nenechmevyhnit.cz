import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

const NAZVY = ['Testovací novela zákona Omega s dlouhým názvem pro mobil', 'Testovací pozměňovací návrh Sigma', 'Testovací nařízení Tau', 'Testovací usnesení vlády Kappa'];

test('menu vede na změny pravidel a přehled je seřazený od nejnovější změny', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: 'Změny pravidel' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page).toHaveTitle('Změny pravidel — Posuďte sami');
  await expect(page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: 'Změny pravidel' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Které změny pravidel prospívají Babišovi a Agrofertu nebo mění kontrolu moci');
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
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 4 z 4');
  await hledat.fill('lhutu k vymahani');
  await expect(viditelne).toHaveCount(1);
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 1 z 4');
  await page.locator('.pr-filtry .f-zrusit').click();
  await expect(viditelne).toHaveCount(4);
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
  await expect(viditelne).toHaveCount(4);
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeHidden();
});

test('řádek označí důvody zařazení textem, bez prázdných oddělovačů', async ({ page }) => {
  await page.goto('/pravidla/');
  const omega = page.locator('.pr-radek[data-slug="zakon-omega"] .pr-nazev small');
  await expect(omega).toContainText('prospěch pravděpodobný');
  await expect(omega).toContainText('Kontrola moci: zpětná účinnost');
  const kappa = page.locator('.pr-radek[data-slug="usneseni-kappa"] .pr-nazev small');
  await expect(kappa).toHaveText('Usnesení vlády · Vyhlášeno · Kontrola moci: soudy');
  await expect(kappa).not.toContainText('prospěch');
  await expect(page.locator('.pr-radek[data-slug="narizeni-tau"] .pr-nazev small')).not.toContainText('Kontrola moci');
});

test('filtr důvodu: každý čip zvlášť, oba, kombinace se štítkem a zrušení', async ({ page }) => {
  await page.goto('/pravidla/');
  const viditelne = page.locator('.pr-radek:not([hidden])');
  const prospech = page.locator('.pr-filtry [data-duvod="prospech"]');
  const kontrola = page.locator('.pr-filtry [data-duvod="kontrola-moci"]');
  await expect(prospech).toHaveText('Prospěch');
  await expect(kontrola).toHaveText('Kontrola moci');
  await kontrola.click();
  await expect(kontrola).toHaveAttribute('aria-pressed', 'true');
  await expect(viditelne).toHaveCount(2);
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 2 z 4');
  await prospech.click();
  await expect(viditelne).toHaveCount(4);
  await kontrola.click();
  await expect(viditelne).toHaveCount(3);
  await page.locator('.pr-filtry [data-stitek="soudy"]').click();
  await expect(viditelne).toHaveCount(0);
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeVisible();
  await page.locator('.pr-filtry .f-zrusit').click();
  await expect(viditelne).toHaveCount(4);
  await expect(prospech).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.pr-filtry .f-zrusit')).toBeHidden();
});

test('Zrušit filtry má rezervované místo, dokud filtr nic neomezuje, a do té doby není ani v tabulátoru', async ({ page }) => {
  await page.goto('/pravidla/');
  const zrusit = page.locator('.pr-filtry .f-zrusit');
  const hledat = page.locator('.pr-filtry .f-hledat');
  const pred = await hledat.boundingBox();
  await expect(zrusit).toBeHidden();
  expect(await zrusit.evaluate(e => getComputedStyle(e).visibility)).toBe('hidden');
  expect((await zrusit.boundingBox())!.width).toBeGreaterThan(0);
  await page.locator('.pr-filtry [data-stitek="dotace"]').click();
  await expect(zrusit).toBeVisible();
  expect(await hledat.boundingBox()).toEqual(pred);
});

test('řádek na počítači nabízí „Detail →“', async ({ page }) => {
  await page.goto('/pravidla/');
  await expect(page.locator('.pr-radek').first().locator('.otevrit')).toHaveText('Detail →');
});

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test('řádek ukazuje stav, komu a závěr jako text a bez posouvání stránky', async ({ page }) => {
    await page.goto('/pravidla/');
    const prvni = page.locator('.pr-radek').first();
    const text = await prvni.evaluate(e => (e as HTMLElement).innerText);
    expect(text).toContain('prospěch pravděpodobný');
    expect(text).toContain('Schváleno Sněmovnou');
    expect(text).toContain('Andrej Babiš, Agrofert');
    await overBezPosouvani(page);
  });

  test('řádek jen s kontrolou moci ukazuje důvod jako text', async ({ page }) => {
    await page.goto('/pravidla/');
    const text = await page.locator('.pr-radek[data-slug="usneseni-kappa"]').evaluate(e => (e as HTMLElement).innerText);
    expect(text).toContain('Kontrola moci: soudy');
    await overBezPosouvani(page);
  });

  test('názvy fází průběhu se v řádku nezkracují třemi tečkami', async ({ page }) => {
    await page.goto('/pravidla/');
    const oriznute = await page.locator('.pr-radek .prubeh .f-nazev').evaluateAll(a => a.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
    expect(oriznute).toEqual([]);
    expect(await page.locator('.pr-radek .prubeh .f-nazev').first().evaluate(e => getComputedStyle(e).textOverflow)).not.toBe('ellipsis');
  });
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
