import { test, expect, type Page } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const viditelne = (page: Page) => page.locator('.radek:not([hidden])');

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('hledání bez diakritiky i v událostech', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('zprava uradu olaf');
  await expect(viditelne(page)).toHaveCount(1);
  await expect(viditelne(page).locator('strong')).toHaveText('Testovací kauza Alfa');
  await expect(page.locator('.pocet:visible')).toHaveText('1 z 6 kauz');
});

test('štítky jako NEBO a zrušení filtrů', async ({ page }) => {
  await page.locator('.f-cipy button[data-stitek="offshore"]').click();
  await page.locator('.f-cipy button[data-stitek="dane"]').click();
  await expect(viditelne(page)).toHaveCount(2);
  const zrusit = page.locator('.f-zrusit:visible');
  await expect(zrusit).toBeVisible();
  await zrusit.click();
  await expect(viditelne(page)).toHaveCount(6);
  await expect(page.locator('.f-cipy button[aria-pressed="true"]')).toHaveCount(0);
});

test('jen neuzavřené', async ({ page }) => {
  await page.getByLabel('jen neuzavřené').check();
  await expect(viditelne(page)).toHaveCount(3);
});

test('prázdný výsledek a tlačítko v něm', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('nic takového neexistuje');
  await expect(page.locator('.prazdno')).toBeVisible();
  await page.locator('.prazdno [data-zrusit]').click();
  await expect(viditelne(page)).toHaveCount(6);
  await expect(page.getByRole('searchbox', { name: 'Hledat v kauzách' })).toHaveValue('');
});

test('zvláštní znaky v hledání nerozbijí stránku', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', e => chyby.push(e.message));
  for (const t of ['(', '+', '*', '\\', '"', '[a-z]']) {
    await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill(t);
  }
  expect(chyby).toEqual([]);
  await overBezPosouvani(page);
});

test('místo pro Zrušit filtry je rezervované (nic se neposune)', async ({ page }) => {
  const pred = await page.locator('.f-hledat').boundingBox();
  await page.locator('.f-cipy button[data-stitek="dotace"]').click();
  const po = await page.locator('.f-hledat').boundingBox();
  expect(po).toEqual(pred);
});

test('označený čip je vidět: modré pozadí a bílý text', async ({ page }) => {
  const cip = page.locator('.f-cipy button').first();
  await cip.click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  const { pozadi, barva } = await cip.evaluate(e => ({ pozadi: getComputedStyle(e).backgroundColor, barva: getComputedStyle(e).color }));
  expect(pozadi).toBe('rgb(40, 38, 97)');
  expect(barva).toBe('rgb(255, 255, 255)');
});

test('na počítači jsou počítadlo a Zrušit filtry v záhlaví osy, řádek filtrů nechávají čipům', async ({ page }) => {
  await expect(page.locator('.osa-roku .pocet')).toHaveText('6 kauz');
  await page.locator('.f-cipy button[data-stitek="offshore"]').click();
  await expect(page.locator('.osa-roku .pocet')).toHaveText('1 z 6 kauz');
  await expect(page.locator('.osa-roku .f-zrusit')).toBeVisible();
  await expect(page.locator('.filtry .pocet')).toBeHidden();
  await expect(page.locator('.filtry .f-zrusit')).toBeHidden();
  await page.locator('.osa-roku .f-zrusit').click();
  await expect(viditelne(page)).toHaveCount(6);
  await expect(page.locator('.osa-roku .f-zrusit')).toBeHidden();
});

test('další filtry: stav řízení, doba trvání a období', async ({ page }) => {
  await page.getByLabel('Stav').selectOption({ label: 've stavu obžaloby' });
  await expect(viditelne(page)).toHaveCount(1);
  await expect(viditelne(page).locator('strong')).toHaveText('Testovací kauza Žeta');
  await page.getByLabel('Stav').selectOption('');
  await page.getByLabel('Trvání').selectOption({ label: 'trvající přes 10 let' });
  await expect(viditelne(page)).toHaveCount(3);
  await page.getByLabel('Probíhala').selectOption({ label: 'probíhající do roku 1999' });
  await expect(viditelne(page)).toHaveCount(1);
  await expect(page.locator('.pocet:visible')).toHaveText('1 z 6 kauz');
  await page.locator('.f-zrusit:visible').click();
  await expect(viditelne(page)).toHaveCount(6);
  await expect(page.getByLabel('Trvání')).toHaveValue('');
  await expect(page.getByLabel('Probíhala')).toHaveValue('');
});

test('nabízí jen stavy, které v archivu jsou', async ({ page }) => {
  const stavy = await page.getByLabel('Stav').locator('option').allTextContents();
  expect(stavy).toContain('ve stavu obžaloby');
  expect(stavy).toContain('ve stavu pravomocného zproštění');
  expect(stavy).not.toContain('ve stavu promlčení');
});

test('řazení přeskládá řádky, zrušení filtrů řazení nemění', async ({ page }) => {
  await page.getByLabel('Řadit').selectOption({ label: 'od nejnovější' });
  await expect(viditelne(page).first().locator('strong')).toHaveText('Testovací kauza Žeta');
  await expect(viditelne(page).last().locator('strong')).toHaveText('Testovací kauza Beta');
  await page.getByLabel('Řadit').selectOption({ label: 'od nejdelší' });
  await expect(viditelne(page).first().locator('strong')).toHaveText('Testovací kauza Beta');
  await page.getByLabel('Řadit').selectOption({ label: 'od nejstarší' });
  await expect(viditelne(page).first().locator('strong')).toHaveText('Testovací kauza Beta');
  await expect(viditelne(page).nth(1).locator('strong')).toHaveText('Testovací kauza Alfa');
});

test.describe('témata, která se nevejdou do řádku', () => {
  test.use({ viewport: { width: 390, height: 700 } });
  test('schovají se pod „+N další“, vybrané téma zůstane vidět a nic se neposouvá do strany', async ({ page }) => {
    const cipy = page.locator('.f-cipy button[data-stitek]');
    const vice = page.locator('.f-cipy .f-vice');
    await expect(vice).toBeVisible();
    await expect(vice).toHaveAttribute('aria-expanded', 'false');
    const skryte = await cipy.evaluateAll(cs => cs.filter(c => (c as HTMLElement).hidden).length);
    expect(skryte).toBeGreaterThan(0);
    await expect(vice).toContainText(`+${skryte} dalš`);
    expect(await page.locator('.f-cipy').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);

    await vice.click();
    await expect(vice).toHaveAttribute('aria-expanded', 'true');
    await expect(vice).toHaveText('méně');
    for (const c of await cipy.all()) await expect(c).toBeVisible();

    // téma z konce abecedy vybrané v rozbaleném seznamu zůstane vidět i po sbalení
    const posledni = cipy.last();
    await posledni.click();
    await vice.click();
    await expect(posledni).toBeVisible();
    await expect(posledni).toHaveAttribute('aria-pressed', 'true');
  });
});

test('hledání řekne, když se hledaný text shoduje jen s textem kauzy, ne s názvem', async ({ page }) => {
  const hledat = page.getByRole('searchbox', { name: 'Hledat v kauzách' });
  await hledat.fill('dluhopisy');
  await expect(viditelne(page)).toHaveCount(1);
  await expect(viditelne(page).first()).toHaveAttribute('data-shoda-v-textu', '');
  await hledat.fill('delta');
  await expect(viditelne(page).first()).not.toHaveAttribute('data-shoda-v-textu');
});

test('prázdný výsledek neukazuje stránkování „0 z 0“', async ({ page }) => {
  await page.setViewportSize({ width: 1342, height: 565 });
  await page.goto('/');
  await page.addStyleTag({ content: '#graf { flex: none !important; height: 180px !important; }' });
  await page.evaluate(() => dispatchEvent(new Event('resize')));
  await expect(page.locator('.strankovani')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('nic takoveho neexistuje');
  await expect(page.locator('.prazdno')).toBeVisible();
  await expect(page.locator('.strankovani')).toBeHidden();
  await page.locator('.prazdno').getByRole('button', { name: 'Zrušit filtry' }).click();
  await expect(page.locator('.strankovani')).toBeVisible();
});
