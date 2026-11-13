import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

for (const [cesta, nadpis, karet] of [['/metodika/', 'Jak archiv vedeme', 8], ['/o-projektu/', 'Kdo, proč a jak', 7]] as const) {
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

test('/metodika/#pravidla otevře oddíl Změny pravidel', async ({ page }) => {
  await page.goto('/metodika/#pravidla');
  const panel = page.locator('.v4-dlg-panel[data-sekce="pravidla"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('Změny pravidel');
  await expect(panel).toContainText('Závěr je rozbor archivu, ne úřední zjištění.');
  await expect(panel.locator('.slovnicek dt')).toHaveText(['prospěch doložen', 'prospěch pravděpodobný']);
});

test('Metodika a O projektu mluví o prospěchu neutrálně, jako o výsledku rozboru', async ({ page }) => {
  await page.goto('/metodika/');
  await expect(page.locator('.v4-karta:has(button[data-sekce="pravidla"])')).toContainText('u kterých rozbor archivu ukazuje prospěch pro Andreje Babiše nebo Agrofert');
  await expect(page.locator('body')).not.toContainText('ze kterých mají prospěch');
  await page.goto('/o-projektu/');
  await page.locator('.v4-karta button[data-sekce="proc"]').click();
  await expect(page.locator('.v4-dlg-panel[data-sekce="proc"]')).toContainText('u kterých rozbor archivu ukazuje prospěch pro Andreje Babiše nebo Agrofert');
});

test('bez pravidel Metodika ani O projektu o oddílu Změny pravidel nemluví', async ({ page }) => {
  await page.goto('http://localhost:4322/metodika/');
  await expect(page.locator('.v4-karta:not(.v4-cta)')).toHaveCount(7);
  await expect(page.locator('[data-sekce="pravidla"]')).toHaveCount(0);
  await page.locator('.v4-karta button[data-sekce="kriteria"]').click();
  const panel = page.locator('.v4-dlg-panel[data-sekce="kriteria"]');
  await expect(panel).toContainText('Kroky vlády jako celku zatím nezařazujeme.');
  await expect(panel).not.toContainText('vlastní část archivu');
  await page.goto('http://localhost:4322/o-projektu/');
  await expect(page.locator('.v4-karta:not(.v4-cta)')).toHaveCount(7);
  await page.locator('.v4-karta button[data-sekce="proc"]').click();
  await expect(page.locator('.v4-dlg-panel[data-sekce="proc"]')).not.toContainText('změny pravidel');
});

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

  test('hlavička se čtyřmi odkazy nepřetéká na žádné šířce telefonu ani malého okna', async ({ page }) => {
    for (const sirka of [320, 360, 390, 428, 430, 760]) {
      await page.setViewportSize({ width: sirka, height: 700 });
      for (const cesta of ['/', '/pravidla/', '/metodika/']) {
        await page.goto(cesta);
        const { sw, iw, odkazy } = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          iw: window.innerWidth,
          odkazy: [...document.querySelectorAll('nav[aria-label="Hlavní"] a')].map(a => {
            const r = a.getBoundingClientRect();
            return { levy: r.left, prave: r.right, vyska: r.height, pismo: parseFloat(getComputedStyle(a).fontSize) };
          }),
        }));
        expect(sw, `${cesta} ${sirka}: stránka se posouvá do strany`).toBeLessThanOrEqual(iw);
        expect(odkazy, `${cesta} ${sirka}: menu nemá čtyři odkazy`).toHaveLength(4);
        for (const o of odkazy) {
          expect(o.levy, `${cesta} ${sirka}: odkaz menu začíná mimo okno`).toBeGreaterThanOrEqual(0);
          expect(o.prave, `${cesta} ${sirka}: odkaz menu přesahuje okno`).toBeLessThanOrEqual(iw);
          expect(o.vyska, `${cesta} ${sirka}: odkaz se zalomil`).toBeLessThan(30);
          expect(o.pismo, `${cesta} ${sirka}: písmo odkazu je příliš malé`).toBeGreaterThanOrEqual(12);
        }
      }
    }
  });

  test('tříodkazová hlavička (bez pravidel) má na 390 px značku 16 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto('http://localhost:4322/');
    await expect(page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link')).toHaveCount(3);
    expect(await page.locator('.top .brand').evaluate(b => getComputedStyle(b).fontSize)).toBe('16px');
  });

  test('každou kartu Metodiky jde otevřít', async ({ page }) => {
    await page.goto('/metodika/');
    const karty = page.locator('.v4-karta:not(.v4-cta)');
    const pocet = await karty.count();
    expect(pocet).toBe(8);
    for (let i = 0; i < pocet; i++) {
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
