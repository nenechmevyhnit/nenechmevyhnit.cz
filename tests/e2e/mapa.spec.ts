import { test, expect, type Page } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const prepinac = (page: Page) => page.locator('.osa-roku .pohled');

test('přepínač ukáže mapu a zapíše pohled do adresy', async ({ page }) => {
  await page.goto('/');
  await expect(prepinac(page).getByRole('button', { name: 'Osa' })).toHaveAttribute('aria-pressed', 'true');
  await prepinac(page).getByRole('button', { name: 'Mapa' }).click();
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
  await expect(prepinac(page).getByRole('button', { name: 'Mapa' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.mapa-svg')).toBeVisible();
  await expect(page.locator('.radky')).toBeHidden();
  await expect(page.locator('.mapa-svg [data-uzel="babis"]')).toContainText('Andrej Babiš');
  await expect(page.locator('.mapa-svg .m-kauza')).toHaveCount(6);
  await expect(page.locator('.mapa-svg .m-akter')).toHaveCount(3);
  await prepinac(page).getByRole('button', { name: 'Osa' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.radky')).toBeVisible();
});

test('adresa ?pohled=mapa otevře rovnou mapu', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await expect(page.locator('#graf')).toHaveAttribute('data-pohled', 'mapa');
  await expect(page.locator('.mapa-svg')).toBeVisible();
});

test('filtr skryje kauzy i aktéry, kterým nezbyde kauza; prázdný výsledek má hlášku', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const hledat = page.getByRole('searchbox', { name: 'Hledat v kauzách' });
  await hledat.fill('Beta');
  await expect(page.locator('.mapa-svg .m-kauza')).toHaveCount(1);
  await expect(page.locator('.mapa-svg .m-akter')).toHaveCount(0);
  await expect(page.locator('.strom li[data-uzel="a:fond-sigma"]').first()).toBeHidden();
  await hledat.fill('nic takového neexistuje');
  await expect(page.locator('.mapa-prazdno')).toBeVisible();
  await hledat.fill('');
  await expect(page.locator('.mapa-svg .m-kauza')).toHaveCount(6);
});

test('návrat z mapy na osu po filtru: osa a stránkování sedí', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('Beta');
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('');
  await prepinac(page).getByRole('button', { name: 'Osa' }).click();
  await expect(page.locator('.radek:not([hidden])')).toHaveCount(6);
  await expect(page.locator('.strankovani')).toBeHidden();
});

test('názvy se vejdou do uzlů', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await expect(page.locator('.mapa-svg')).toBeVisible();
  const pretekaji = await page.locator('.mapa-svg .m-uzel').evaluateAll(gs => gs
    .filter(g => (g.querySelector('text') as SVGTextElement).getBBox().width > Number(g.querySelector('rect')!.getAttribute('width')) - 8)
    .map(g => g.getAttribute('data-uzel')));
  expect(pretekaji).toEqual([]);
});

for (const v of VELIKOSTI) {
  test(`mapa ${v.width}×${v.height} se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/?pohled=mapa');
    await expect(page.locator('#graf')).toHaveAttribute('data-pohled', 'mapa');
    await overBezPosouvani(page);
  });
}

test('prázdný archiv nemá přepínač mapy', async ({ page }) => {
  await page.goto('http://localhost:4322/');
  await expect(page.locator('.pohled')).toHaveCount(0);
});

test('najetí na kauzu zvýrazní cestu ke středu a návaznosti, ostatní ztlumí', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]').hover();
  await expect(page.locator('.mapa-svg')).toHaveClass(/ztlumeno/);
  for (const u of ['k:alfa-dotace', 'a:firma-alfa', 'a:holding-omega', 'a:fond-sigma', 'babis', 'k:zeta-stret'])
    await expect(page.locator(`.mapa-svg [data-uzel="${u}"]`)).toHaveClass(/zvyrazneno/);
  await expect(page.locator('.mapa-svg [data-uzel="k:beta-archiv"]')).not.toHaveClass(/zvyrazneno/);
  await expect(page.locator('.mapa-svg .m-popisek.zvyrazneno').first()).toBeVisible();
});

test('klik na aktéra otevře panel s rolí, popisem a zdrojem; Esc ho zavře', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.mapa-svg [data-uzel="a:firma-alfa"]').click();
  const panel = page.locator('.mapa-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.mapa-panel-nadpis')).toHaveText('Holding Omega → Firma Alfa');
  await expect(panel).toContainText('Holding Omega vlastní Firmu Alfa od roku 2007.');
  await expect(panel.locator('.mapa-panel-obsah a')).toHaveAttribute('href', 'https://example.com/omega/alfa');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('klik na čáru návaznosti otevře její panel', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const id = await page.locator('.strom .s-navazuje').first().getAttribute('data-hrana');
  await page.locator(`.mapa-svg .m-cara[data-hrana="${id}"] .m-zasah`).dispatchEvent('click');
  await expect(page.locator('.mapa-panel')).toBeVisible();
  await expect(page.locator('.mapa-panel-nadpis')).toContainText('→');
});

test('klik na kauzu otevře detail, zavření vrátí mapu se zvýrazněnou kauzou', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page).toHaveURL(/\/kauzy\/alfa-dotace\/\?pohled=mapa$/);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
  await page.mouse.move(0, 0);
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/zvyrazneno/);
});

test('zpět v prohlížeči po detailu z mapy vrátí mapu', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog#detail')).toBeHidden();
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
  await expect(page.locator('.mapa-svg')).toBeVisible();
});

test('vybraná kauza zmizí z filtru: zvýraznění se zruší a po zrušení filtru vrátí', async ({ page }) => {
  await page.goto('/?pohled=mapa&vyber=alfa-dotace');
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/zvyrazneno/);
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('Beta');
  await expect(page.locator('.mapa-svg')).not.toHaveClass(/ztlumeno/);
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('');
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/zvyrazneno/);
});

test('klávesnice: fokus ve stromu zvýrazní uzel, Enter na kauze otevře detail', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.strom li[data-uzel="k:alfa-dotace"][data-hlavni] > .s-radek a').focus();
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/fokus/);
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog#detail')).toBeVisible();
});

test('klávesnice: tlačítko aktéra ve stromu otevře panel a Esc vrátí fokus', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const tlacitko = page.locator('.strom li[data-uzel="a:firma-alfa"][data-hlavni] > .s-radek .s-akter');
  await tlacitko.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mapa-panel')).toBeVisible();
  await expect(page.locator('.mapa-panel-zavrit')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(tlacitko).toBeFocused();
});
