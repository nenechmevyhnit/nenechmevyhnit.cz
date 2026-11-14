import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani, presahPanelu } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const OMEGA = 'Testovací novela zákona Omega s dlouhým názvem pro mobil';

test('přímá adresa otevře detail pravidla s vlastním náhledem', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  const dlg = page.locator('dialog#detail');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading', { level: 2 })).toHaveText(OMEGA);
  await expect(page).toHaveTitle(`${OMEGA} — Posuďte sami`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://posudtesami.cz/pravidla/zakon-omega/');
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
  await expect(panel.locator('.kriterium + .pr-proc')).toHaveCount(1);
  await expect(panel.locator('.pr-proc + .retezec')).toHaveCount(1);
  await expect(panel.locator('.kriterium + .retezec')).toHaveCount(0);
});

test('shrnutí „Proč by to prospělo“ má popisek a zdroj', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  const proc = page.locator('.m2-panel[data-p="prospech"] .pr-proc');
  await expect(proc).toContainText('Proč by to prospělo:');
  await expect(proc).toContainText('dlužníkem');
  await expect(proc.locator('.chip')).toHaveText(['2']);
});

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test('upozornění je vidět hned po otevření, hlavička je úsporná: pruhy fází a pod nimi poslední krok', async ({ page }) => {
    for (const slug of ['zakon-omega', 'pozmenovaci-sigma']) {
      await page.goto(`/pravidla/${slug}/`);
      await expect(page.locator('.m2-panel[data-p="prospech"] .kriterium')).toBeInViewport();
      // popisky fází by se na šířce telefonu lámaly uprostřed slova, proto jsou jen pruhy (čtečka má celý text)
      await expect(page.locator('.prubeh-detail li:not(.konec) .f-nazev').first()).toBeHidden();
      await expect(page.locator('.prubeh-detail li:not(.konec) .jen-ctecka').first()).toHaveText(/^: hotovo, /);
      expect(await page.locator('#detail-nadpis').evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeLessThanOrEqual(22);
      await expect(page.locator('.m2-hlava .planovano')).toBeHidden();
      await overBezPosouvani(page);
    }
    // schválený zákon: souhrn s posledním krokem a fází; zamítnutý návrh má místo souhrnu políčko ukončení
    await page.goto('/pravidla/zakon-omega/');
    const souhrn = page.locator('.m2-hlava .prubeh-souhrn');
    await expect(souhrn).toBeVisible();
    expect((await souhrn.textContent())!.replace(/\s+/g, ' ')).toBe('Schváleno Sněmovnou 20. 9. 2026 · fáze 2 z 5');
    await page.locator('.prubeh-detail [data-udalost="0"]').click();
    await expect(page.locator('.udalosti-seznam > li:not([hidden]) h3')).toHaveText('Návrh podán');
    await page.goto('/pravidla/pozmenovaci-sigma/');
    await expect(page.locator('.m2-hlava .prubeh-souhrn')).toHaveCount(0);
    await expect(page.locator('.prubeh-detail li.konec')).toBeVisible();
    await expect(page.locator('.prubeh-detail li.konec')).toContainText('Zamítnuto');
  });

  test('„Stav k“ je na mobilu v záložce Průběh nad cestou předložení', async ({ page }) => {
    await page.goto('/pravidla/zakon-omega/');
    await page.getByRole('tab', { name: 'Průběh' }).click();
    const stav = page.locator('.m2-panel[data-p="chrono"] .planovano-prubeh');
    await expect(stav).toBeVisible();
    expect((await stav.textContent())!.replace(/\s+/g, ' ')).toBe('Stav k 1. 11. 2026: Fiktivní senát návrh projedná na schůzi od 2. 12. 2099.1');
    const [s, c] = await Promise.all([stav.boundingBox(), page.locator('.m2-panel[data-p="chrono"] .cesta-box').boundingBox()]);
    expect(s!.y + s!.height).toBeLessThanOrEqual(c!.y);
    expect(await presahPanelu(page, true)).toBeLessThanOrEqual(1);
    await stav.locator('.chip').click();
    await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
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
  await expect(page).toHaveTitle('Změny pravidel — Posuďte sami');
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
      ['/pravidla/zakon-omega/', [...ZALOZKY, 'Kontrola moci', 'Hlasování (2)']],
      ['/pravidla/pozmenovaci-sigma/', [...ZALOZKY, 'Hlasování (1)']],
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

// Delší cesta předložení (vynechané kontroly, připojení) nesmí ubrat místo události ani se oříznout.
// Na Linuxu v CI se písmo láme jinak než ve Windows, proto test vyžaduje rezervu, ne jen hranici.
for (const v of [{ width: 390, height: 700 }, { width: 1256, height: 528 }]) {
  test(`${v.width}×${v.height}: dlouhá cesta předložení se posouvá ve vlastním boxu a událost má místo`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/pozmenovaci-sigma/');
    await page.getByRole('tab', { name: 'Průběh' }).click();
    const box = page.locator('.m2-panel[data-p="chrono"] .cesta-box');
    await box.evaluate(el => { for (let i = 1; i <= 12; i++) el.insertAdjacentHTML('beforeend', `<p>Doplněný řádek ${i} s delším textem o cestě předložení.</p>`); });
    expect(await box.evaluate(el => el.scrollHeight > el.clientHeight + 1)).toBe(true);
    await expect(box).toHaveAttribute('tabindex', '0');
    await expect(box).toHaveAccessibleName('Cesta předložení');
    expect(await presahPanelu(page, true)).toBeLessThanOrEqual(1);
    const volno = await page.locator('.udalosti-seznam > li:not([hidden]) .udalost-velka > div')
      .evaluate(d => d.getBoundingClientRect().height - d.querySelector('h3')!.getBoundingClientRect().height);
    expect(volno, 'pod nadpisem události zbývá místo aspoň na dva řádky textu').toBeGreaterThanOrEqual(40);
  });
}

test('pravidlo jen s kontrolou moci otevře záložku Kontrola moci: znaky, upozornění a odkaz na Metodiku', async ({ page }) => {
  await page.goto('/pravidla/usneseni-kappa/');
  await expect(page.getByRole('tab')).toHaveText(['Kontrola moci', 'Průběh', 'Výhrady a stanovisko', 'Zdroje (6)']);
  await expect(page.getByRole('tab', { name: 'Kontrola moci' })).toHaveAttribute('aria-selected', 'true');
  const panel = page.locator('.m2-panel[data-p="kontrola"]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.kriterium')).toContainText('Záznam upozornění institucí, ne hodnocení archivu.');
  await expect(panel.locator('.kriterium').getByRole('link')).toHaveAttribute('href', '/metodika/#kontrola-moci');
  await expect(panel.locator('.znaky > li')).toHaveCount(1);
  await expect(panel.locator('.znaky > li')).toContainText('soudy');
  await expect(panel.locator('.znaky > li')).toContainText('Usnesení by svěřilo výběr fiktivních soudců');
  await expect(panel.locator('.upozorneni > li')).toHaveCount(4);
  await expect(panel.locator('.upozorneni > li').first()).toContainText('Soudcovská unie ČR');
  await expect(panel.locator('.upozorneni > li').first()).toContainText('profesní organizace');
  await panel.locator('.upozorneni a[data-zdroj="2"]').first().click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
  await expect(page.locator('#zdroj-2')).toBeInViewport();
});

test('pravidlo s oběma důvody má obě záložky v pořadí Komu prospívá, Kontrola moci', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await expect(page.getByRole('tab')).toHaveText(['Komu prospívá', 'Kontrola moci', 'Průběh', 'Hlasování (2)', 'Výhrady a stanovisko', 'Zdroje (4)']);
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

test('Kontrola moci bez prospěchu ukáže související kauzy a Výhrady odkážou na Kontrolu moci', async ({ page }) => {
  await page.goto('/pravidla/usneseni-kappa/');
  const vazby = page.locator('.m2-panel[data-p="kontrola"] .vazby');
  await expect(vazby.getByRole('heading')).toHaveText('Související kauzy');
  await expect(vazby.getByRole('link', { name: 'Testovací kauza Žeta' })).toHaveAttribute('href', '/kauzy/zeta-stret/');
  await page.getByRole('tab', { name: 'Výhrady a stanovisko' }).click();
  await expect(page.locator('.m2-panel[data-p="vyhrady"]')).toContainText('Další výhrady institucí zatím nejsou zapsané. Upozornění ke kontrole moci jsou v záložce Kontrola moci.');
});

test('každé upozornění odkazuje na zdroj svého upozorňovatele', async ({ page }) => {
  await page.goto('/pravidla/usneseni-kappa/');
  const li = page.locator('.m2-panel[data-p="kontrola"] .upozorneni > li');
  await expect(li.nth(1).locator('a[data-zdroj]')).toHaveText(['4']);
  await expect(li.nth(2).locator('a[data-zdroj]')).toHaveText(['6']);
  await expect(li.nth(3).locator('a[data-zdroj]')).toHaveText(['5']);
});
