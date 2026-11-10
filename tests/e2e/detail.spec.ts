import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('přímá adresa otevře detail s vlastním náhledem', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const dlg = page.locator('dialog#detail');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading', { level: 2 })).toHaveText('Testovací kauza Alfa');
  await expect(page).toHaveTitle('Testovací kauza Alfa — Nenechme vyhnít');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://nenechmevyhnit.cz/kauzy/alfa-dotace/');
  await expect(page.locator('#graf')).toHaveAttribute('data-vybrano', 'alfa-dotace');
  await overBezPosouvani(page);
});

test('chronologie ukazuje poslední událost a listuje se', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const vid = page.locator('.udalosti-seznam > li:not([hidden])');
  await expect(vid).toHaveCount(1);
  await expect(vid.locator('h3')).toHaveText('Nepravomocné zproštění');
  await page.getByRole('button', { name: /předchozí/ }).click();
  await expect(vid.locator('h3')).toHaveText('Zpráva úřadu OLAF');
  await page.keyboard.press('ArrowRight');
  await expect(vid.locator('h3')).toHaveText('Nepravomocné zproštění');
  await page.locator('.mini-osa .bod').first().click();
  await expect(vid.locator('h3')).toHaveText('Vyčlenění firmy');
});

test('záložky a skok na zdroj', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await expect(page.locator('.m2-panel[data-p="souv"]')).toBeVisible();
  await page.locator('.m2-panel[data-p="souv"] a.pozn[data-zdroj="3"]').click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
  await expect(page.locator('#zdroj-3')).toHaveClass(/blik/);
  await expect(page).toHaveURL(/\/kauzy\/alfa-dotace\/$/);
});

test('stav a stanovisko', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Stav a stanovisko' }).click();
  await expect(page.locator('.stav-box .stav')).toHaveText('Soudní řízení');
  await expect(page.locator('.stav-box')).toContainText('Naposledy ověřeno 9. 11. 2026');
  await expect(page.locator('.stanovisko')).toContainText('Firma Alfa pochybení odmítá.');
});

test('neexistující kauza vrátí stránku 404', async ({ page }) => {
  const odpoved = await page.goto('/kauzy/neexistuje/');
  expect(odpoved?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tahle stránka neexistuje');
});
