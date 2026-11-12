import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test('klik na řádek otevře detail bez načtení stránky', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => ((window as any).__znacka = 'stejna-stranka'));
  await page.locator('.radek[data-slug="gama-offshore"] a.radek-btn').click();
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Gama');
  await expect(page).toHaveURL(/\/kauzy\/gama-offshore\/$/);
  expect(await page.evaluate(() => (window as any).__znacka)).toBe('stejna-stranka');
  await expect(page.locator('#graf')).toHaveAttribute('data-vybrano', 'gama-offshore');
});

test('zavření vrátí adresu na / a zruší výběr na ose', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await expect(page.locator('dialog#detail')).not.toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#graf')).not.toHaveAttribute('data-vybrano');
  await expect(page.locator('.radek.vybrany')).toHaveCount(0);
  await expect(page.locator('.pasmo')).toBeHidden();
});

test('Escape i Zpět po zavření detailu zruší výběr na ose', async ({ page }) => {
  await page.goto('/');
  await page.locator('.radek[data-slug="beta-archiv"] a.radek-btn').click();
  await expect(page.locator('#graf')).toHaveAttribute('data-vybrano', 'beta-archiv');
  await page.keyboard.press('Escape');
  await expect(page.locator('#graf')).not.toHaveAttribute('data-vybrano');
  await page.locator('.radek[data-slug="beta-archiv"] a.radek-btn').click();
  await expect(page.locator('#graf')).toHaveAttribute('data-vybrano', 'beta-archiv');
  await page.goBack();
  await expect(page.locator('dialog#detail')).not.toBeVisible();
  await expect(page.locator('#graf')).not.toHaveAttribute('data-vybrano');
});

test('tlačítko Zpět zavře detail, Vpřed ho znovu otevře', async ({ page }) => {
  await page.goto('/');
  await page.locator('.radek[data-slug="beta-archiv"] a.radek-btn').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog#detail')).not.toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Beta');
});

test('přepnutí na jinou kauzu z otevřeného detailu přes Zpět', async ({ page }) => {
  await page.goto('/');
  await page.locator('.radek[data-slug="beta-archiv"] a.radek-btn').click();
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await page.locator('.radek[data-slug="delta-dluhopisy"] a.radek-btn').click();
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Delta');
  await page.goBack(); // na /
  await page.goBack(); // na beta
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Beta');
});
