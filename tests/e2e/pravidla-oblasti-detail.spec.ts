import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani, presahPanelu } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const dialog = (page: import('@playwright/test').Page) => page.locator('dialog#detail');

test('karta otevře detail oblasti bez načtení stránky, zavření vrátí přehled a fokus na kartu', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  await page.locator('.ob-karta[data-oblast="dotace-stret-zajmu"] a.ob-btn').click();
  await expect(dialog(page)).toBeVisible();
  await expect(page).toHaveURL(/\/pravidla\/oblasti\/dotace-stret-zajmu\/$/);
  await expect(page).toHaveTitle('Dotace a střet zájmů — Nenechme vyhnít');
  await expect(dialog(page).locator('.u2-nad')).toHaveText('Oblast');
  await expect(dialog(page).getByRole('heading', { level: 2 })).toHaveText('Dotace a střet zájmů');
  await expect(dialog(page).locator('.perex')).toContainText('K čemu to je:');
  await expect(dialog(page).locator('.ob-pocty-detail')).toHaveText('Od prosince 2025: 2 změny · 0 přijato · 1 v projednávání · 1 ukončena');
  await expect(dialog(page).getByRole('tab')).toHaveText(['Co se mění (2)', 'Jak to hodnotí (3)', 'Zdroje (4)']);
  await expect(dialog(page).locator('.ob-zmeny h4')).toHaveText(['Testovací novela zákona Omega s dlouhým názvem pro mobil', 'Testovací pozměňovací návrh Sigma']);
  const omega = dialog(page).locator('.ob-zmeny li[data-slug="zakon-omega"]');
  await expect(omega.locator('.stitek-bp')).toHaveText('bez připomínkového řízení');
  await expect(omega.locator('.pro-vas')).toContainText('Co by to znamenalo pro vás:');
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page.locator('.ob-karta[data-oblast="dotace-stret-zajmu"] a.ob-btn')).toBeFocused();
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
});

test('přímá adresa otevře přehled s dialogem oblasti; oblast bez hodnocení nemá jejich záložku', async ({ page }) => {
  await page.goto('/pravidla/oblasti/soudy-policie/');
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByRole('tab')).toHaveText(['Co se mění (1)', 'Zdroje (1)']);
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page.locator('.oblasti-pohled')).toBeVisible();
});

test('Jak to hodnotí: vláda, instituce, odborníci a věta o výběru citací', async ({ page }) => {
  await page.goto('/pravidla/oblasti/dotace-stret-zajmu/');
  await dialog(page).getByRole('tab', { name: 'Jak to hodnotí (3)' }).click();
  const panel = dialog(page).locator('.m2-panel[data-p="hodnoceni"]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.ob-skupina h4')).toHaveText(['Stanovisko vlády', 'Instituce', 'Odborníci']);
  await expect(panel.locator('.ob-skupina').first()).toContainText('Fiktivní ministr F, fiktivní ministr financí');
  await expect(panel.locator('.kriterium')).toContainText('Výběr citací podle metodiky, ne hodnocení archivu.');
  await expect(panel.getByRole('link', { name: 'Koho citujeme' })).toHaveAttribute('href', '/metodika/#oblasti');
  await expect(panel.locator('a[data-pravidlo="zakon-omega"]')).toHaveText('Testovací novela zákona Omega s dlouhým názvem pro mobil');
});

test('záložky jdou ovládat klávesnicí', async ({ page }) => {
  await page.goto('/pravidla/oblasti/dotace-stret-zajmu/');
  await dialog(page).getByRole('tab', { name: 'Jak to hodnotí (3)' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog(page).locator('.m2-panel[data-p="hodnoceni"]')).toBeVisible();
  await expect(dialog(page).locator('.m2-panel[data-p="zmeny"]')).toBeHidden();
});

test('Celý rozbor → otevře detail změny, Zpět vrátí oblast a další Zpět přehled', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.locator('.ob-karta[data-oblast="dotace-stret-zajmu"] a.ob-btn').click();
  await dialog(page).locator('.ob-zmeny li[data-slug="zakon-omega"] a.ob-rozbor').click();
  await expect(page).toHaveURL(/\/pravidla\/zakon-omega\/$/);
  await expect(dialog(page).getByRole('heading', { level: 2 })).toHaveText('Testovací novela zákona Omega s dlouhým názvem pro mobil');
  await page.goBack();
  await expect(page).toHaveURL(/\/pravidla\/oblasti\/dotace-stret-zajmu\/$/);
  await expect(dialog(page).getByRole('heading', { level: 2 })).toHaveText('Dotace a střet zájmů');
  await page.goBack();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(dialog(page)).toBeHidden();
});

test('zdroj u textu pro vás otevře rozbor změny na tomto zdroji', async ({ page }) => {
  await page.goto('/pravidla/oblasti/dotace-stret-zajmu/');
  await dialog(page).locator('.ob-zmeny li[data-slug="zakon-omega"] .pro-vas a.chip').first().click();
  await expect(page).toHaveURL(/\/pravidla\/zakon-omega\/$/);
  await expect(dialog(page).getByRole('tab', { name: /^Zdroje/ })).toHaveAttribute('aria-selected', 'true');
  await expect(dialog(page).locator('#zdroj-1')).toBeVisible();
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('karta vede na stránku oblasti se všemi částmi pod sebou a odtud na rozbor', async ({ page }) => {
    await page.goto('/pravidla/');
    await page.locator('.ob-karta[data-oblast="dotace-stret-zajmu"] a.ob-btn').click();
    await expect(page).toHaveURL(/\/pravidla\/oblasti\/dotace-stret-zajmu\/$/);
    for (const p of ['zmeny', 'hodnoceni', 'zdroje']) await expect(page.locator(`.m2-panel[data-p="${p}"]`)).toBeVisible();
    await page.locator('.ob-zmeny li[data-slug="zakon-omega"] a.ob-rozbor').click();
    await expect(page).toHaveURL(/\/pravidla\/zakon-omega\/$/);
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: detail oblasti se neposouvá a obsah záložek není oříznutý`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/oblasti/dotace-stret-zajmu/');
    await overBezPosouvani(page);
    for (const zalozka of [/^Co se mění/, /^Jak to hodnotí/, /^Zdroje/]) {
      await dialog(page).getByRole('tab', { name: zalozka }).click();
      const presah = await presahPanelu(page, true);
      expect(presah, `záložka ${zalozka}: obsah je oříznutý o ${presah} px`).toBeLessThanOrEqual(1);
    }
  });
}
