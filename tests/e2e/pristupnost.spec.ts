import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ viewport: { width: 1366, height: 768 } });

for (const cesta of ['/', '/?pohled=mapa', '/?pohled=mapa&vyber=alfa-dotace', '/kauzy/alfa-dotace/', '/metodika/', '/o-projektu/', '/pravidla/', '/pravidla/?pohled=seznam', '/pravidla/?pohled=osa', '/pravidla/zakon-omega/', '/pravidla/pozmenovaci-sigma/', '/pravidla/usneseni-kappa/', '/pravidla/oblasti/dotace-stret-zajmu/', '/hlasovani/psp-10-5-12/', '/hlasovani/psp-10-7-3/#ods', 'http://localhost:4322/']) {
  test(`${cesta} bez závažných chyb přístupnosti`, async ({ page }) => {
    await page.goto(cesta);
    // kontrast měříme až po doběhnutí úvodních animací (prvky během nich prolínají z průhlednosti)
    await expect(page.locator('body')).toHaveClass(/nacteno/, { timeout: 5000 });
    await page.waitForTimeout(400);
    const vysledek = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const zavazne = vysledek.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(zavazne.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('ovládání klávesnicí: Tab dojde na řádek osy a Enter otevře detail', async ({ page }) => {
  await page.goto('/');
  await page.locator('.radek a.radek-btn').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog#detail')).not.toBeVisible();
});

test('hlavní stránka má oblast main a nadpisy oddílů pro čtečky', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('main').getByRole('heading', { level: 2, name: 'Kauzy' })).toHaveCount(1);
  await expect(page.getByRole('main').locator('#graf')).toHaveCount(1);
});

test('plocha mapy jde posouvat z klávesnice', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await expect(page.locator('.mapa-plocha')).toHaveAttribute('tabindex', '0');
});

test('zavření detailu otevřeného přímo z adresy vrátí fokus na řádek kauzy', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog#detail')).not.toBeVisible();
  await expect(page.locator('.radek[data-slug="alfa-dotace"] a.radek-btn')).toBeFocused();
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('stránka kauzy ukáže celý obsah pod sebou', async ({ page }) => {
    await page.goto('/kauzy/alfa-dotace/');
    const dlg = page.locator('dialog#detail');
    await expect(dlg).toBeVisible();
    await expect(dlg.getByRole('heading', { level: 2 })).toHaveText('Testovací kauza Alfa');
    for (const nadpis of ['Proč je to kauza', 'Chronologie', 'Souvislosti', 'Stav a stanovisko']) {
      await expect(dlg.getByRole('heading', { level: 3, name: nadpis, exact: true })).toBeVisible();
    }
    await expect(dlg.locator('.stanovisko')).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Kauzy', exact: true })).toBeVisible();
  });
});
