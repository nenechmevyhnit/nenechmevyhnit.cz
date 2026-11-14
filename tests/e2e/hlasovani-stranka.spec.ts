import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('stránka hlasování: nadpis, o čem, výsledek, zdroj a odkaz zpět', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-7-3/');
  await expect(page).toHaveTitle('Hlasování č. 3, 7. schůze Poslanecké sněmovny — Posuďte sami');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hlasování č. 3, 7. schůze Poslanecké sněmovny');
  await expect(page.locator('.hl-kdy')).toHaveText('20. 9. 2026, 14:30');
  await expect(page.locator('.hl-drobky a')).toHaveText(['Změny pravidel', 'Testovací novela zákona Omega s dlouhým názvem pro mobil']);
  await expect(page.locator('.hl-o-cem li')).toHaveCount(1);
  await expect(page.locator('.hl-o-cem li')).toContainText('o obsahu');
  await expect(page.locator('.hl-o-cem a')).toHaveAttribute('href', '/pravidla/zakon-omega/');
  await expect(page.locator('.hl-hlava .hl-proc')).toHaveCount(0);
  await expect(page.locator('.hl-hlava .hl-vysledek')).toHaveText('Přijato · 7 pro · 3 proti · 0 zdržel se · 0 nehlasoval · 1 omluven · 1 nepřihlášen · kvórum 6');
  await expect(page.getByRole('link', { name: 'Ověřit na psp.cz' })).toHaveAttribute('href', 'https://www.psp.cz/sqw/hlasy.sqw?g=90103');
  await expect(page.locator('.hl-zdroj')).toContainText('staženo 14. 11. 2026');
  await expect(page.getByRole('link', { name: 'Jak hlasování zapisujeme' })).toHaveAttribute('href', '/metodika/#hlasovani');
  await expect(page.getByRole('navigation', { name: 'Hlavní' }).locator('a[aria-current="page"]')).toHaveAttribute('href', '/pravidla/');
});

test('hlasování navázané na dvě pravidla: obě v „O čem“, drobečková navigace končí u části', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-5-12/');
  await expect(page.locator('.hl-o-cem li')).toHaveCount(2);
  await expect(page.locator('.hl-drobky a')).toHaveText(['Změny pravidel']);
  await expect(page.locator('.hl-hlava .hl-proc')).toHaveText('Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.');
});

test('výchozí filtr Všichni: poslanci podle hlasu s klubem u jména', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-5-12/');
  await expect(page.locator('.hl-tabulka a[aria-current="true"]')).toHaveText('Všichni (12)');
  const vsichni = page.locator('.hl-vsichni');
  await expect(vsichni).toBeVisible();
  await expect(vsichni.locator('.hl-skupina h3')).toHaveText(['Pro (5)', 'Proti (4)', 'Zdržel se nebo nehlasoval (1)', 'Omluven (1)', 'Nepřihlášen (1)']);
  await expect(vsichni.locator('.hl-skupina').first().locator('li').first()).toHaveText('Adam Alfa ANO');
  await expect(page.locator('.hl-klub:visible')).toHaveCount(0);
});

test('proklik na klub z detailu pravidla otevře stránku s vybraným klubem', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Hlasování (2)' }).click();
  await page.getByRole('link', { name: 'ODS: 1 pro, 2 proti', exact: true }).click();
  await expect(page).toHaveURL(/\/hlasovani\/psp-10-7-3\/#ods$/);
  const ods = page.locator('section#ods');
  await expect(ods).toBeVisible();
  await expect(ods.locator('li')).toHaveText(['Tomáš Théta', 'Ema Éta', 'Zita Zéta']);
  await expect(page.locator('.hl-klub:visible')).toHaveCount(1);
  await expect(page.locator('.hl-vsichni')).toBeHidden();
  await expect(page.locator('.hl-tabulka a[aria-current="true"]')).toHaveText('ODS (3)');
});

test('přepnutí filtru změní kotvu, Všichni ji zruší', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-5-12/#ano');
  await expect(page.locator('section#ano')).toBeVisible();
  await page.locator('.hl-tabulka').getByRole('link', { name: 'STAN (2)' }).click();
  await expect(page).toHaveURL(/#stan$/);
  await expect(page.locator('section#stan')).toBeVisible();
  await expect(page.locator('section#ano')).toBeHidden();
  await page.locator('.hl-tabulka').getByRole('link', { name: 'Všichni (12)' }).click();
  await expect(page).toHaveURL(/\/hlasovani\/psp-10-5-12\/$/);
  await expect(page.locator('.hl-vsichni')).toBeVisible();
});

test('Zpět po přepínání filtru vede na předchozí stránku, ne na předchozí klub', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.goto('/hlasovani/psp-10-5-12/#ano');
  await page.locator('.hl-tabulka').getByRole('link', { name: 'ODS (3)' }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/pravidla\/zakon-omega\/$/);
});

test('kotva velkými písmeny vybere klub, neznámá ukáže všechny', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-5-12/#ODS');
  await expect(page.locator('section#ods')).toBeVisible();
  await page.goto('/hlasovani/psp-10-5-12/#neznamy');
  await expect(page.locator('.hl-vsichni')).toBeVisible();
  await expect(page.locator('.hl-tabulka a[aria-current="true"]')).toHaveText('Všichni (12)');
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('všechny kluby jako oddíly, kotva ukáže klub', async ({ page }) => {
    await page.goto('/hlasovani/psp-10-5-12/#ods');
    await expect(page.locator('.hl-klub')).toHaveCount(5);
    for (const id of ['ano', 'ods', 'stan', 'pirati', 'nezarazeni']) await expect(page.locator(`section#${id}`)).toBeVisible();
    await expect(page.locator('.hl-vsichni')).toBeHidden();
    await expect(page.locator('section#ods')).toBeInViewport();
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: stránka hlasování se neposouvá a seznam poslanců má místo`, async ({ page }) => {
    await page.setViewportSize(v);
    for (const adresa of ['/hlasovani/psp-10-5-12/', '/hlasovani/psp-10-7-3/#ano']) {
      await page.goto(adresa);
      await overBezPosouvani(page);
      const vyska = await page.locator('.hl-poslanci').evaluate(e => e.clientHeight);
      expect(vyska, `${adresa}: seznam poslanců má jen ${vyska} px`).toBeGreaterThanOrEqual(100);
    }
  });
}

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });
  test('místo tabulky čipy klubů, filtr funguje', async ({ page }) => {
    await page.goto('/hlasovani/psp-10-5-12/');
    await expect(page.locator('.hl-tabulka')).toBeHidden();
    await page.locator('.hl-cipy').getByRole('link', { name: 'STAN (2)' }).click();
    await expect(page).toHaveURL(/#stan$/);
    await expect(page.locator('.hl-cipy a[aria-current="true"]')).toHaveText('STAN (2)');
    await expect(page.locator('section#stan')).toBeVisible();
  });
});
