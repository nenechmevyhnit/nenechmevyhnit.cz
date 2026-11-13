import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani, presahPanelu } from './pomocne';

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

test('upozornění „Závěr je rozbor archivu“ stojí hned pod závěrem, před řetězcem', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  const panel = page.locator('.m2-panel[data-p="prospech"]');
  await expect(panel.locator('.pr-zaver + .kriterium')).toContainText('Závěr je rozbor archivu podle metodiky, ne úřední zjištění.');
  await expect(panel.locator('.kriterium + .retezec')).toHaveCount(1);
});

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test('upozornění je vidět hned po otevření a názvy fází v hlavičce nejsou zkrácené', async ({ page }) => {
    for (const slug of ['zakon-omega', 'pozmenovaci-sigma']) {
      await page.goto(`/pravidla/${slug}/`);
      await expect(page.locator('.m2-panel[data-p="prospech"] .kriterium')).toBeInViewport();
      const oriznute = await page.locator('.prubeh-detail .f-nazev').evaluateAll(a => a.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
      expect(oriznute, slug).toEqual([]);
      await overBezPosouvani(page);
    }
  });
});

test('záložka Průběh: cesta předložení, vynechané kontroly a listování', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const panel = page.locator('.m2-panel[data-p="chrono"]');
  await expect(panel.locator('.cesta-box')).toContainText('Předkládá: fiktivní poslanci A, B a C.');
  await expect(panel.locator('.vynechano li')).toHaveText(['bez meziresortního připomínkového řízení', 'bez hodnocení dopadů regulace (RIA)']);
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

  test('detail jen s kontrolou moci ukáže všechny své části pod sebou', async ({ page }) => {
    await page.goto('/pravidla/usneseni-kappa/');
    for (const p of ['kontrola', 'chrono', 'vyhrady', 'zdroje']) await expect(page.locator(`.m2-panel[data-p="${p}"]`)).toBeVisible();
    await expect(page.locator('.m2-panel[data-p="prospech"]')).toHaveCount(0);
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: detail pravidla se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    for (const adresa of ['/pravidla/zakon-omega/', '/pravidla/usneseni-kappa/']) {
      await page.goto(adresa);
      await overBezPosouvani(page);
    }
  });
}

// Delší texty v detailu pravidla nesmí být oříznuté: buď se vejdou, nebo pokračují ve sloupcích do strany.
const ZALOZKY = ['Komu prospívá', 'Průběh', 'Výhrady a stanovisko', /^Zdroje/];
const ZALOZKY_KAPPA = ['Kontrola moci', 'Průběh', 'Výhrady a stanovisko', /^Zdroje/];
for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: v žádné záložce detailu pravidla není oříznutý obsah`, async ({ page }) => {
    await page.setViewportSize(v);
    for (const [adresa, zalozky] of [
      ['/pravidla/zakon-omega/', [...ZALOZKY, 'Kontrola moci']],
      ['/pravidla/pozmenovaci-sigma/', ZALOZKY],
      ['/pravidla/narizeni-tau/', [...ZALOZKY, 'Souvislosti']],
      ['/pravidla/usneseni-kappa/', ZALOZKY_KAPPA],
    ] as const) {
      await page.goto(adresa);
      for (const zalozka of zalozky) {
        await page.getByRole('tab', { name: zalozka }).click();
        const presah = await presahPanelu(page, true);
        expect(presah, `${adresa}, záložka ${zalozka}: obsah je oříznutý o ${presah} px`).toBeLessThanOrEqual(1);
      }
    }
  });
}

test('pravidlo jen s kontrolou moci otevře záložku Kontrola moci: znaky, upozornění a odkaz na Metodiku', async ({ page }) => {
  await page.goto('/pravidla/usneseni-kappa/');
  await expect(page.getByRole('tab')).toHaveText(['Kontrola moci', 'Průběh', 'Výhrady a stanovisko', 'Zdroje (3)']);
  await expect(page.getByRole('tab', { name: 'Kontrola moci' })).toHaveAttribute('aria-selected', 'true');
  const panel = page.locator('.m2-panel[data-p="kontrola"]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.kriterium')).toContainText('Záznam upozornění institucí, ne hodnocení archivu.');
  await expect(panel.locator('.kriterium').getByRole('link')).toHaveAttribute('href', '/metodika/#kontrola-moci');
  await expect(panel.locator('.znaky > li')).toHaveCount(1);
  await expect(panel.locator('.znaky > li')).toContainText('soudy');
  await expect(panel.locator('.znaky > li')).toContainText('Usnesení by svěřilo výběr fiktivních soudců');
  await expect(panel.locator('.upozorneni > li')).toContainText('Soudcovská unie ČR');
  await expect(panel.locator('.upozorneni > li')).toContainText('profesní organizace');
  await panel.locator('.upozorneni a[data-zdroj="2"]').click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
  await expect(page.locator('#zdroj-2')).toBeInViewport();
});

test('pravidlo s oběma důvody má obě záložky v pořadí Komu prospívá, Kontrola moci', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await expect(page.getByRole('tab')).toHaveText(['Komu prospívá', 'Kontrola moci', 'Průběh', 'Výhrady a stanovisko', 'Zdroje (4)']);
  await expect(page.getByRole('tab', { name: 'Komu prospívá' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Kontrola moci' }).click();
  await expect(page.locator('.m2-panel[data-p="kontrola"] .znaky > li')).toContainText('zpětná účinnost');
  await expect(page.locator('.m2-panel[data-p="kontrola"] .upozorneni > li')).toContainText('Legislativní rada vlády');
});

test('pravidlo jen s prospěchem záložku Kontrola moci nemá', async ({ page }) => {
  await page.goto('/pravidla/narizeni-tau/');
  await expect(page.getByRole('tab', { name: 'Kontrola moci' })).toHaveCount(0);
});

test('přechod bez načtení z pravidla s prospěchem na pravidlo jen s kontrolou moci otevře Kontrolu moci', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await page.locator('.pr-radek[data-slug="usneseni-kappa"] a.pr-btn').click();
  await expect(page).toHaveURL(/\/pravidla\/usneseni-kappa\/$/);
  await expect(page.getByRole('tab', { name: 'Kontrola moci' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.m2-panel[data-p="kontrola"]')).toBeVisible();
});

test('Průběh usnesení vlády: cesta bez vynechaných kontrol', async ({ page }) => {
  await page.goto('/pravidla/usneseni-kappa/');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const panel = page.locator('.m2-panel[data-p="chrono"]');
  await expect(panel.locator('.cesta-box')).toContainText('Usnesení vlády');
  await expect(panel.locator('.vynechano')).toHaveCount(0);
});