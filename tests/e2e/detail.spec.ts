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

test('detail začíná záložkou Proč je to kauza s kritériem zařazení', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const tab = page.getByRole('tab').first();
  await expect(tab).toHaveText('Proč je to kauza');
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const panel = page.locator('.m2-panel[data-p="proc"]');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Fiktivní soud řeší, zda firma Alfa neměla na fiktivní dotaci pro malé podniky nárok.');
  const odkaz = panel.getByRole('link', { name: 'úřední řízení' });
  await expect(panel.locator('.kriterium')).toContainText('Zařazeno podle metodiky: úřední řízení');
  await expect(odkaz).toHaveAttribute('href', '/metodika/#kriteria');
  await panel.locator('a[data-zdroj="1"]').click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
});

test('odkaz na kritéria otevře v Metodice příslušnou část', async ({ page }) => {
  await page.goto('/metodika/#kriteria');
  const dlg = page.locator('.v4-dlg');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading', { level: 2 })).toHaveText('Co do archivu patří');
});

test('chronologie ukazuje poslední událost a listuje se', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Chronologie' }).click();
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tahle stránka vyhnila');
});

test('vyjádření dotčené strany je ve zdrojích označené jako stanovisko, ne jako primární zdroj', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: /^Zdroje/ }).click();
  await expect(page.locator('#zdroj-4 .druh')).toHaveText('stanovisko dotčené strany');
  await expect(page.locator('#zdroj-1 .druh')).toHaveText('primární');
  await expect(page.locator('#zdroj-2 .druh')).toHaveText('média');
});
