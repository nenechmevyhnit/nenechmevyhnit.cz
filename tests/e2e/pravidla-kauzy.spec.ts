import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test('kauza ukazuje související změny pravidel a vede na ně', async ({ page }) => {
  await page.goto('/kauzy/zeta-stret/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  const sekce = page.locator('.m2-panel[data-p="souv"] .souvisejici-pravidla');
  await expect(sekce.getByRole('heading')).toHaveText('Související zákony a nařízení');
  await expect(sekce).toContainText('Schváleno Sněmovnou');
  await expect(sekce).toContainText('Zkrácení lhůty by se dotklo fiktivního řízení Žeta.');
  await sekce.getByRole('link', { name: 'Testovací novela zákona Omega s dlouhým názvem pro mobil' }).click();
  await expect(page).toHaveURL(/\/pravidla\/zakon-omega\/$/);
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací novela zákona Omega s dlouhým názvem pro mobil');
});

test('z pravidla se jde na kauzu', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.locator('.m2-panel[data-p="prospech"]').getByRole('link', { name: 'Testovací kauza Žeta' }).click();
  await expect(page).toHaveURL(/\/kauzy\/zeta-stret\/$/);
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Žeta');
});

test('kauza bez souvisejících pravidel sekci nemá', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await expect(page.locator('.souvisejici-pravidla')).toHaveCount(0);
});

test('přechod mezi kauzami bez načtení stránky přenese i související pravidla', async ({ page }) => {
  // na alfa-dotace navazuje v testovacích datech jen zeta-stret („Navazují na ni“)
  await page.goto('/kauzy/alfa-dotace/');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await page.locator('.m2-panel[data-p="souv"] a[data-kauza="zeta-stret"]').click();
  await expect(page).toHaveURL(/\/kauzy\/zeta-stret\/$/);
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await expect(page.locator('.m2-panel[data-p="souv"] .souvisejici-pravidla')).toBeVisible();
});
