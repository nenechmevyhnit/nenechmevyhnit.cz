import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

const OBLASTI = ['Dotace a střet zájmů', 'Zemědělství a potraviny', 'Soudy, státní zastupitelství a policie', 'Kontrolní úřady'];

test('výchozí pohled jsou oblasti v pořadí slovníku s popisky a počty', async ({ page }) => {
  await page.goto('/pravidla/');
  await expect(page.locator('.oblasti-pohled')).toBeVisible();
  await expect(page.locator('.pravidla-obal')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Oblasti' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.ob-karta strong')).toHaveText(OBLASTI);
  const dotace = page.locator('.ob-karta[data-oblast="dotace-stret-zajmu"]');
  await expect(dotace.locator('.ob-popisek')).toHaveText('Kdo dostane peníze z dotací a kdo to hlídá');
  await expect(dotace.locator('.ob-pocty')).toHaveText('2 změny · 0 přijato · 1 v projednávání · 1 ukončena');
  await expect(page.locator('.ob-karta[data-oblast="zemedelstvi-potraviny"] .ob-pocty')).toHaveText('1 změna · 1 přijata · 0 v projednávání');
  await expect(dotace.locator('a.ob-btn')).toHaveAttribute('href', '/pravidla/oblasti/dotace-stret-zajmu/');
});

test('přepínač tří pohledů zapisuje adresu a přímá adresa otevře pohled', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.getByRole('button', { name: 'Seznam' }).click();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=seznam$/);
  await expect(page.locator('.pravidla-obal')).toBeVisible();
  await expect(page.locator('.oblasti-pohled')).toBeHidden();
  await page.getByRole('button', { name: 'Časová osa' }).click();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await page.getByRole('button', { name: 'Oblasti' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page.locator('.oblasti-pohled')).toBeVisible();
  await page.goto('/pravidla/?pohled=seznam');
  await expect(page.locator('.pravidla-obal')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seznam' })).toHaveAttribute('aria-pressed', 'true');
});

test('filtr skryje kartu bez odpovídajících změn a přepočítá počty', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.locator('.pr-filtry [data-stitek="soudy"]').click();
  await expect(page.locator('.ob-karta:not([hidden])')).toHaveCount(1);
  await expect(page.locator('.ob-karta:not([hidden])')).toHaveAttribute('data-oblast', 'soudy-policie');
  await page.locator('.pr-filtry .f-zrusit').click();
  await page.getByRole('searchbox', { name: 'Hledat ve změnách pravidel' }).fill('lhutu k vymahani');
  await expect(page.locator('.ob-karta:not([hidden])')).toHaveCount(2);
  await expect(page.locator('.ob-karta[data-oblast="dotace-stret-zajmu"] .ob-pocty')).toHaveText('1 změna · 0 přijato · 1 v projednávání');
});

test('filtr, který nic nenajde, ukáže prázdný stav oblastí a jde zrušit', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.getByRole('searchbox', { name: 'Hledat ve změnách pravidel' }).fill('xyzneexistuje');
  await expect(page.locator('.ob-prazdno')).toBeVisible();
  await page.locator('.ob-prazdno [data-zrusit]').click();
  await expect(page.locator('.ob-karta:not([hidden])')).toHaveCount(4);
  await expect(page.locator('.ob-prazdno')).toBeHidden();
});

test('čip bez připomínkového řízení filtruje a seznam ukazuje štítek', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.locator('.pr-filtry [data-bez-pripominek]').click();
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 2 z 4');
  await expect(page.locator('.ob-karta:not([hidden])')).toHaveCount(2);
  await page.getByRole('button', { name: 'Seznam' }).click();
  await expect(page.locator('.pr-radek:not([hidden])')).toHaveCount(2);
  await expect(page.locator('.pr-radek[data-slug="zakon-omega"] .stitek-bp')).toHaveText('bez připomínkového řízení');
  await expect(page.locator('.pr-radek[data-slug="narizeni-tau"] .stitek-bp')).toHaveCount(0);
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('přehled ukáže oblasti bez přepínače, seznam je skrytý', async ({ page }) => {
    await page.goto('/pravidla/');
    await expect(page.locator('.oblasti-pohled')).toBeVisible();
    await expect(page.locator('.ob-karta')).toHaveCount(4);
    await expect(page.locator('.pravidla-obal')).toBeHidden();
    await expect(page.locator('.pr-pohled')).toBeHidden();
    await expect(page.locator('.pr-filtry')).toBeHidden();
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: pohled Oblasti se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/');
    await overBezPosouvani(page);
  });
}
