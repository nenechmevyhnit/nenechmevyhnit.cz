import { test, expect, type Page } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const viditelne = (page: Page) => page.locator('.radek:not([hidden])');
const slugy = (page: Page) => viditelne(page).evaluateAll(r => r.map(x => (x as HTMLElement).dataset.slug!));

/** Zmenší osu, aby se 6 testovacích kauz nevešlo na jednu stránku (jako by kauz bylo mnoho). */
async function zmensiOsu(page: Page, vyska = 200) {
  await page.addStyleTag({ content: `#graf { flex: none !important; height: ${vyska}px !important; }` });
  await expect(page.locator('.strankovani')).toBeVisible();
}

test('když se všechny kauzy vejdou, stránkování není vidět', async ({ page }) => {
  await page.goto('/');
  await expect(viditelne(page)).toHaveCount(6);
  await expect(page.locator('.strankovani')).toBeHidden();
});

test('kauzy se rozdělí na stránky, seznam se neposouvá a nic nechybí', async ({ page }) => {
  await page.goto('/');
  await zmensiOsu(page);
  const naStranku = await viditelne(page).count();
  expect(naStranku).toBeGreaterThan(0);
  expect(naStranku).toBeLessThan(6);
  const { vnitrni, vyska } = await page.evaluate(() => {
    const r = document.querySelector('.radky') as HTMLElement;
    return { vnitrni: r.scrollHeight, vyska: r.clientHeight };
  });
  expect(vnitrni).toBeLessThanOrEqual(vyska);
  await expect(page.locator('.strankovani .s-rozsah')).toHaveText(`1–${naStranku} z 6`);
  await expect(page.getByRole('button', { name: 'Předchozí stránka' })).toBeDisabled();

  const videne: string[] = [];
  for (let i = 0; i < 6; i++) {
    videne.push(...await slugy(page));
    const dalsi = page.getByRole('button', { name: 'Další stránka' });
    if (await dalsi.isDisabled()) break;
    await dalsi.click();
  }
  expect(new Set(videne).size).toBe(6);
  expect(videne).toHaveLength(6);
  await overBezPosouvani(page);
});

test('číslo stránky přepne stránku a označí ji', async ({ page }) => {
  await page.goto('/');
  await zmensiOsu(page);
  const prvni = await slugy(page);
  await page.locator('.strankovani .s-cisla button', { hasText: '2' }).click();
  await expect(page.locator('.strankovani [aria-current="page"]')).toHaveText('2');
  expect(await slugy(page)).not.toEqual(prvni);
});

test('změna filtru vrátí stránkování na první stránku', async ({ page }) => {
  await page.goto('/');
  await zmensiOsu(page);
  await page.getByRole('button', { name: 'Další stránka' }).click();
  await page.getByLabel('Řadit').selectOption({ label: 'od nejnovější' });
  await expect(page.locator('.strankovani [aria-current="page"]')).toHaveText('1');
  await expect(viditelne(page).first().locator('strong')).toHaveText('Testovací kauza Žeta');
});

test('otevřená kauza je na ose vidět, i když není na první stránce', async ({ page }) => {
  // výchozí řazení: Beta 1982, Alfa 2007, Gama 2009, Delta 2012, Epsilon 2017, Žeta 2018
  await page.goto('/kauzy/zeta-stret/');
  await zmensiOsu(page);
  await expect(page.locator('.radek.vybrany')).toBeVisible();
});

test('řádky jedné stránky jsou stejně vysoké', async ({ page }) => {
  await page.goto('/');
  await zmensiOsu(page);
  const vysky = await viditelne(page).evaluateAll(r => r.map(x => Math.round(x.getBoundingClientRect().height)));
  expect(new Set(vysky).size).toBe(1);
});

test('označené pásmo vybrané kauzy končí nad lištou stránkování', async ({ page }) => {
  await page.goto('/kauzy/zeta-stret/');
  await zmensiOsu(page);
  await page.keyboard.press('Escape');
  const pasmo = (await page.locator('.pasmo').boundingBox())!;
  const lista = (await page.locator('.strankovani').boundingBox())!;
  expect(pasmo.y + pasmo.height).toBeLessThanOrEqual(lista.y + 1);
});
