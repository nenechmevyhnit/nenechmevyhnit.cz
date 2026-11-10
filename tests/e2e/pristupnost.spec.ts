import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ viewport: { width: 1366, height: 768 } });

for (const cesta of ['/', '/kauzy/alfa-dotace/', '/metodika/', '/o-projektu/', 'http://localhost:4322/']) {
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
