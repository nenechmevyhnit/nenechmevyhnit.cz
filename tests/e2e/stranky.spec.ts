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
  await expect(page.locator('.v4-dlg-panel[data-sekce="stavy"] .slovnicek dt')).toHaveCount(9);
});

for (const [sirka, vyska] of [[1366, 768], [1256, 528], [990, 660], [390, 700]] as const) {
  test(`${sirka}×${vyska}: delší text v modalu Metodiky se neořízne, pokračuje do strany s nápovědou`, async ({ page }) => {
    await page.setViewportSize({ width: sirka, height: vyska });
    await page.goto('/metodika/');
    await page.locator('.v4-karta button[data-sekce]').first().click();
    const tlacitka = page.locator('.v4-dlg-menu button');
    const pocet = await tlacitka.count();
    for (let i = 0; i < pocet; i++) {
      const id = await tlacitka.nth(i).getAttribute('data-sekce');
      await tlacitka.nth(i).click();
      const panel = page.locator(`.v4-dlg-panel[data-sekce="${id}"]`);
      await expect(panel).toBeVisible();
      const { pretece, posuvny } = await panel.evaluate(p => ({ pretece: p.scrollWidth > p.clientWidth + 1, posuvny: ['auto', 'scroll'].includes(getComputedStyle(p).overflowX) }));
      if (pretece) {
        expect(posuvny, `oddíl ${id} přetéká, musí jít posunout do strany`).toBe(true);
        await expect(panel.locator('.posun-napoveda')).toBeVisible();
      } else {
        await expect(panel.locator('.posun-napoveda')).toBeHidden();
      }
    }
    // poslední položka slovníčku částek musí jít posunem zobrazit
    await page.locator('.v4-dlg-menu button[data-sekce="jazyk"]').click();
    const posledni = page.locator('.v4-dlg-panel[data-sekce="jazyk"] p').last();
    await posledni.scrollIntoViewIfNeeded();
    await expect(posledni).toBeInViewport();
  });
}

test('kolečko myši posouvá delší oddíl modalu do strany', async ({ page }) => {
  await page.goto('/metodika/#jazyk');
  const panel = page.locator('.v4-dlg-panel[data-sekce="jazyk"]');
  await expect(panel.locator('.posun-napoveda')).toBeVisible();
  const posun = () => panel.evaluate(p => p.scrollLeft);
  expect(await posun()).toBe(0);
  const b = (await panel.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.wheel(0, 400);
  await expect.poll(posun).toBeGreaterThan(100);
  // kolečko nad menu oddílů posouvá taky (celý modal je jedna plocha)
  const menu = (await page.locator('.v4-dlg-menu').boundingBox())!;
  await page.mouse.move(menu.x + menu.width / 2, menu.y + menu.height - 20);
  await page.mouse.wheel(0, -4000);
  await expect.poll(posun).toBe(0);
  // oddíl, který se vejde, kolečko nechá být
  await page.locator('.v4-dlg-menu button[data-sekce="strana"]').click();
  const kratky = page.locator('.v4-dlg-panel[data-sekce="strana"]');
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.wheel(0, 400);
  expect(await kratky.evaluate(p => p.scrollLeft)).toBe(0);
});

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test('menu ukazuje všechny odkazy na jednom řádku', async ({ page }) => {
    for (const cesta of ['/', '/metodika/']) {
      await page.goto(cesta);
      const odkazy = page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link');
      await expect(odkazy).toHaveCount(4);
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

test.describe('mobil 390×700: hlavní stránka', () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test('osa je zúžená: všechny pruhy jsou vidět bez posouvání do strany', async ({ page }) => {
    await page.goto('/');
    const graf = (await page.locator('#graf').boundingBox())!;
    for (const pruh of await page.locator('.radek:not([hidden]) .pruh').all()) {
      const b = (await pruh.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(graf.x - 1);
      expect(b.x + b.width).toBeLessThanOrEqual(graf.x + graf.width + 1);
    }
  });

  test('přepínač „jen neuzavřené“, počítadlo a Zrušit filtry jsou dostupné', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('jen neuzavřené')).toBeVisible();
    await expect(page.locator('.pocet:visible')).toBeVisible();
    await page.getByLabel('jen neuzavřené').check();
    await expect(page.locator('.f-zrusit:visible')).toBeVisible();
    const { svisle, vyska } = await page.evaluate(() => ({ svisle: document.scrollingElement!.scrollHeight, vyska: innerHeight }));
    expect(svisle).toBeLessThanOrEqual(vyska);
  });
});

test('Metodika vysvětluje vazby mezi kauzami v oddílu Co do archivu patří', async ({ page }) => {
  await page.goto('/metodika/');
  await page.locator('.v4-karta button[data-sekce="kriteria"]').click();
  const panel = page.locator('.v4-dlg-panel[data-sekce="kriteria"]');
  await expect(panel.getByRole('heading', { name: 'Vazby mezi kauzami' })).toBeVisible();
  await expect(panel).toContainText('Vazba sama o sobě neznamená vinu ani spoluodpovědnost.');
  await expect(panel).toContainText('Vztahy firem, osob a nástrojů mají navíc období');
});
