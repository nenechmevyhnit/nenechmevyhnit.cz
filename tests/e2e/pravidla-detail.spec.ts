import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const OMEGA = 'Testovací novela zákona Omega s dlouhým názvem pro mobil';

test('přímá adresa otevře detail pravidla s vlastním náhledem', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  const dlg = page.locator('dialog#detail');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading', { level: 2 })).toHaveText(OMEGA);
  await expect(page).toHaveTitle(`${OMEGA} — Nenechme vyhnít`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://nenechmevyhnit.cz/pravidla/zakon-omega/');
  await expect(dlg.locator('.m2-hlava .roky')).toHaveText('Poslanecký návrh zákona · Schváleno Sněmovnou');
  await expect(page.locator('.pr-radek[data-slug="zakon-omega"]')).toHaveClass(/vybrany/);
  await overBezPosouvani(page);
});

test('první záložka Komu prospívá: závěr, řetězec s odhadem, související kauza', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  const tab = page.getByRole('tab').first();
  await expect(tab).toHaveText('Komu prospívá');
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const panel = page.locator('.m2-panel[data-p="prospech"]');
  await expect(panel.locator('.pr-zaver')).toHaveText(/prospěch pravděpodobný: Andrej Babiš, Agrofert/);
  await expect(panel.locator('.retezec > li')).toHaveCount(3);
  await expect(panel.locator('.retezec > li').nth(2).locator('.odhad')).toHaveText('odhad');
  await expect(panel.locator('.retezec > li').nth(0).locator('.odhad')).toHaveCount(0);
  await expect(panel.getByRole('link', { name: 'Testovací kauza Žeta' })).toHaveAttribute('href', '/kauzy/zeta-stret/');
  await expect(panel.getByRole('link', { name: 'Jak rozbor děláme' })).toHaveAttribute('href', '/metodika/#pravidla');
});

test('záložka Průběh: cesta předložení, vynechané kontroly a listování', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const panel = page.locator('.m2-panel[data-p="chrono"]');
  await expect(panel.locator('.cesta-box')).toContainText('Předkládá: fiktivní poslanci A, B a C.');
  await expect(panel.locator('.vynechano li')).toHaveText(['neprošel meziresortním připomínkovým řízením', 'bez hodnocení dopadů regulace (RIA)']);
  const aktualni = panel.locator('.udalosti-seznam > li:not([hidden]) h3');
  await expect(aktualni).toHaveText('Schváleno Sněmovnou');
  await page.keyboard.press('ArrowLeft');
  await expect(aktualni).toHaveText('Návrh podán');
});

test('klik na krok průběhu v hlavičce ukáže jeho událost', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.locator('.prubeh-detail [data-udalost="0"]').click();
  await expect(page.locator('.m2-panel[data-p="chrono"]')).toBeVisible();
  await expect(page.locator('.udalosti-seznam > li:not([hidden]) h3')).toHaveText('Návrh podán');
});

test('pozměňovací návrh: k čemu byl připojen a ukončení průběhu', async ({ page }) => {
  await page.goto('/pravidla/pozmenovaci-sigma/');
  await expect(page.locator('.prubeh-detail li.konec')).toContainText('Zamítnuto');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const panel = page.locator('.m2-panel[data-p="chrono"]');
  await expect(panel.locator('.cesta-box')).toContainText('Připojeno k: Fiktivní novela zákona o fiktivních dotacích');
  await expect(panel.locator('.vynechano li')).toHaveCount(4);
});

test('výhrady, stanovisko a přechod na zdroj', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Výhrady a stanovisko' }).click();
  const panel = page.locator('.m2-panel[data-p="vyhrady"]');
  await expect(panel.locator('.vyhrady')).toContainText('Fiktivní legislativní rada');
  await expect(panel.locator('.stanovisko')).toContainText('Předkladatel tvrdí, že novela nevznikla kvůli konkrétní firmě.');
  await expect(panel.locator('.overeno')).toContainText('Naposledy ověřeno');
  await panel.locator('.stanovisko a[data-zdroj="3"]').click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
  await expect(page.locator('#zdroj-3')).toBeInViewport();
  await expect(page.getByRole('link', { name: 'Historie změn tohoto pravidla' })).toHaveAttribute('href', /\/commits\/main\/obsah\/pravidla\/zakon-omega\.md$/);
});

test('pravidlo bez výhrad to věcně uvede', async ({ page }) => {
  await page.goto('/pravidla/narizeni-tau/');
  await page.getByRole('tab', { name: 'Výhrady a stanovisko' }).click();
  await expect(page.locator('.m2-panel[data-p="vyhrady"]')).toContainText('Výhrady institucí zatím nejsou zapsané.');
});

test('záložka Souvislosti jen u pravidla s textem', async ({ page }) => {
  await page.goto('/pravidla/narizeni-tau/');
  await expect(page.getByRole('tab', { name: 'Souvislosti' })).toHaveCount(1);
  await page.goto('/pravidla/zakon-omega/');
  await expect(page.getByRole('tab', { name: 'Souvislosti' })).toHaveCount(0);
});

test('z přehledu se detail otevře bez načtení stránky a zavřením se adresa vrátí', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  await page.locator('.pr-radek[data-slug="narizeni-tau"] a.pr-btn').click();
  await expect(page).toHaveURL(/\/pravidla\/narizeni-tau\/$/);
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací nařízení Tau');
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page).toHaveTitle('Změny pravidel — Nenechme vyhnít');
  await expect(page.locator('.pr-radek.vybrany')).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/pravidla\/narizeni-tau\/$/);
  await expect(page.locator('dialog#detail')).toBeVisible();
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('detail ukáže všechny části pod sebou', async ({ page }) => {
    await page.goto('/pravidla/zakon-omega/');
    for (const p of ['prospech', 'chrono', 'vyhrady', 'zdroje']) await expect(page.locator(`.m2-panel[data-p="${p}"]`)).toBeVisible();
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: detail pravidla se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/zakon-omega/');
    await overBezPosouvani(page);
  });
}
