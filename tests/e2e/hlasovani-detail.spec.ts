import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test('záložka Hlasování: za Průběhem, bloky od nejnovějšího, výsledek a kluby', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await expect(page.getByRole('tab')).toHaveText(['Komu prospívá', 'Kontrola moci', 'Průběh', 'Hlasování (2)', 'Výhrady a stanovisko', 'Zdroje (4)']);
  await page.getByRole('tab', { name: 'Hlasování (2)' }).click();
  const bloky = page.locator('.m2-panel[data-p="hlasovani"] .hl-blok');
  await expect(bloky).toHaveCount(2);
  await expect(bloky.nth(0).locator('.hl-meta')).toHaveText('20. 9. 2026 · hlasování č. 3 · o obsahu');
  await expect(bloky.nth(0).locator('.hl-co')).toHaveText('Fiktivní návrh zákona jako celek ve třetím čtení');
  await expect(bloky.nth(0).locator('.hl-vysledek')).toHaveText('Přijato 7 : 3');
  await expect(bloky.nth(0).locator('.hl-kluby a')).toHaveText(['ANO 5 : 0', 'ODS 1 : 2', 'STAN 0 : 1', 'Piráti 0 : 0', 'Nezařazení 1 : 0']);
  await expect(bloky.nth(0).locator('.hl-proc')).toHaveCount(0);
  await expect(bloky.nth(1).locator('.hl-meta')).toHaveText('12. 6. 2026 · hlasování č. 12 · procedurální');
  await expect(bloky.nth(1).locator('.hl-kluby a')).toHaveText(['ANO 4 : 0', 'ODS 0 : 2', 'STAN 0 : 1', 'Piráti 0 : 1', 'Nezařazení 1 : 0']);
  await expect(bloky.nth(1).locator('.hl-proc')).toHaveText('Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.');
});

test('klub má pro čtečky celou větu a vede na stránku hlasování s kotvou', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Hlasování (2)' }).click();
  const panel = page.locator('.m2-panel[data-p="hlasovani"]');
  await expect(panel.getByRole('link', { name: 'ANO: 4 pro, 0 proti, 1 omluven', exact: true })).toHaveAttribute('href', '/hlasovani/psp-10-5-12/#ano');
  await expect(panel.getByRole('link', { name: 'ODS: 0 pro, 2 proti, 1 zdržel se nebo nehlasoval', exact: true })).toHaveAttribute('href', '/hlasovani/psp-10-5-12/#ods');
  await expect(panel.getByRole('link', { name: 'Všichni poslanci →' }).first()).toHaveAttribute('href', '/hlasovani/psp-10-7-3/');
});

test('Průběh: událost s hlasováním má řádek s odkazem na stránku hlasování', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const udalost = page.locator('.udalosti-seznam > li:not([hidden])');
  await expect(udalost.locator('h3')).toHaveText('Schváleno Sněmovnou');
  await expect(udalost.locator('.hl-odkazy')).toHaveText('Hlasování: č. 3');
  await expect(udalost.locator('.hl-odkazy a')).toHaveAttribute('href', '/hlasovani/psp-10-7-3/');
});

test('pravidlo bez hlasování záložku nemá', async ({ page }) => {
  await page.goto('/pravidla/narizeni-tau/');
  await expect(page.getByRole('tab', { name: /Hlasování/ })).toHaveCount(0);
});

test('detail otevřený ze seznamu (obsah načtený skriptem) má záložku Hlasování se styly', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.locator('.pr-radek[data-slug="zakon-omega"] .pr-btn').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.getByRole('tab', { name: 'Hlasování (2)' }).click();
  const kluby = page.locator('.m2-panel[data-p="hlasovani"] .hl-kluby').first();
  await expect(kluby).toBeVisible();
  expect(await kluby.evaluate(e => getComputedStyle(e).display)).toBe('flex');
});
