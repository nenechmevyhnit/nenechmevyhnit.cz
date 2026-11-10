import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

for (const [cesta, nadpis, karet] of [['/metodika/', 'Jak archiv vedeme', 7], ['/o-projektu/', 'Kdo, proč a jak', 7]] as const) {
  test(`${cesta}: karty, modal s plným zněním, bez posouvání`, async ({ page }) => {
    await page.goto(cesta);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(nadpis);
    await expect(page.locator('.v4-karta:not(.v4-cta)')).toHaveCount(karet);
    await overBezPosouvani(page);
    await page.locator('.v4-karta button[data-sekce]').nth(1).click();
    const dlg = page.locator('dialog.v4-dlg');
    await expect(dlg).toBeVisible();
    await expect(dlg.locator('.v4-dlg-panel:not([hidden])')).toHaveCount(1);
    await dlg.locator('.v4-dlg-menu button').first().click();
    await expect(dlg.locator('.v4-dlg-menu button').first()).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Escape');
    await expect(dlg).not.toBeVisible();
  });
}

test('Metodika obsahuje slovníček stavů', async ({ page }) => {
  await page.goto('/metodika/');
  await page.locator('.v4-karta button[data-sekce="stavy"]').click();
  await expect(page.locator('.slovnicek dt')).toHaveCount(9);
});

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test('menu ukazuje všechny tři odkazy na jednom řádku', async ({ page }) => {
    for (const cesta of ['/', '/metodika/']) {
      await page.goto(cesta);
      const odkazy = page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link');
      await expect(odkazy).toHaveCount(3);
      for (const o of await odkazy.all()) await expect(o).toBeVisible();
      const vysky = await odkazy.evaluateAll(a => a.map(x => x.getBoundingClientRect().height));
      expect(Math.max(...vysky), 'odkaz se nesmí zalomit').toBeLessThan(30);
    }
  });

  test('každou kartu Metodiky jde otevřít', async ({ page }) => {
    await page.goto('/metodika/');
    const karty = page.locator('.v4-karta:not(.v4-cta)');
    for (let i = 0; i < 7; i++) {
      await karty.nth(i).click({ position: { x: 20, y: 20 } });
      await expect(page.locator('dialog.v4-dlg')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('dialog.v4-dlg')).not.toBeVisible();
    }
  });
});
