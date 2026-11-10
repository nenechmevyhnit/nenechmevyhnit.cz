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
  await expect(panel.locator('.mapa-panel-role')).toHaveText('vlastní · 2015 – dosud');
  await expect(panel).toContainText('Holding Omega znovu vlastní Firmu Alfa od roku 2015.');
  await expect(panel.locator('.mapa-panel-obsah a')).toHaveAttribute('href', 'https://example.com/omega/alfa-2015');
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
  // Epsilon je pod přímým aktérem (rozbalená větev); hlubší větve jsou sbalené
  await page.locator('.strom li[data-uzel="k:epsilon-fondy"][data-hlavni] > .s-radek a').focus();
  await expect(page.locator('.mapa-svg [data-uzel="k:epsilon-fondy"]')).toHaveClass(/fokus/);
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog#detail')).toBeVisible();
});

test('klávesnice: ⓘ ve stromu otevře panel (ohlášený jako dialog) a Esc vrátí fokus', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const tlacitko = page.locator('.strom li[data-uzel="a:fond-sigma"][data-hlavni] > .s-radek .s-info');
  await expect(tlacitko).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(tlacitko).not.toHaveAttribute('aria-expanded', /.*/);
  await tlacitko.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mapa-panel')).toBeVisible();
  await expect(page.locator('.mapa-panel-zavrit')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(tlacitko).toBeFocused();
});

test.describe('mobil', () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test('místo obrázku strom: přímí aktéři rozbalení, hlubší sbalení', async ({ page }) => {
    await page.goto('/?pohled=mapa');
    await expect(page.locator('.mapa-svg')).toBeHidden();
    await expect(page.locator('.strom')).toBeVisible();
    await expect(page.locator('.filtry .pohled').getByRole('button', { name: 'Mapa' })).toHaveAttribute('aria-pressed', 'true');
    const holding = page.locator('.strom li[data-uzel="a:holding-omega"][data-hlavni] > .s-radek .s-akter');
    await expect(page.locator('.strom li[data-uzel="a:fond-sigma"] > .s-radek .s-akter')).toHaveAttribute('aria-expanded', 'true');
    await expect(holding).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.strom li[data-uzel="a:firma-alfa"][data-hlavni]')).toBeHidden();
    await holding.click();
    await expect(holding).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.strom li[data-uzel="a:firma-alfa"][data-hlavni]')).toBeVisible();
  });

  test('ⓘ ukáže vysvětlení vazby pod řádkem, klepnutí na kauzu otevře detail', async ({ page }) => {
    await page.goto('/?pohled=mapa');
    const epsilon = page.locator('.strom li[data-uzel="k:epsilon-fondy"][data-hlavni]');
    await epsilon.locator(':scope > .s-radek .s-info').click();
    await expect(epsilon.locator(':scope > .s-vazba')).toBeVisible();
    await expect(epsilon.locator(':scope > .s-vazba')).toContainText('Kauza se týká vložení fiktivního holdingu do Fondu Sigma.');
    await epsilon.locator(':scope > .s-radek a').click();
    await expect(page.locator('dialog#detail')).toBeVisible();
  });
});

test('změna šířky okna z počítače na mobil v pohledu mapy', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await expect(page.locator('.mapa-svg')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 700 });
  await expect(page.locator('.mapa-svg')).toBeHidden();
  await expect(page.locator('.strom')).toBeVisible();
  await expect(page.locator('.strom li[data-uzel="a:holding-omega"][data-hlavni] > .s-radek .s-akter')).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(page.locator('.mapa-svg')).toBeVisible();
  await expect(page.locator('.strom .s-info').first()).toHaveAttribute('aria-haspopup', 'dialog');
});

test('detail ukazuje aktéry a návaznosti a vede na mapu', async ({ page }) => {
  await page.goto('/kauzy/zeta-stret/');
  // až po úvodní animaci: přepnutí pohledu pak běží přes View Transition
  await page.waitForFunction(() => document.body.classList.contains('nacteno'));
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  const blok = page.locator('.m2-panel[data-p="souv"] .vazby');
  await expect(blok.getByRole('heading', { name: 'Aktéři a návaznosti' })).toBeVisible();
  await expect(blok).toContainText('Holding Omega, předmět kauzy: Fiktivní úřad posuzuje střet zájmů u Holdingu Omega.');
  await expect(blok).toContainText('Navazují na ni:');
  await blok.getByRole('link', { name: 'Ukázat na mapě →' }).click();
  await expect(page.locator('dialog#detail')).toBeHidden();
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
  await page.mouse.move(0, 0);
  await expect(page.locator('.mapa-svg [data-uzel="k:zeta-stret"]')).toHaveClass(/zvyrazneno/);
});

test('návaznost v detailu přejde na druhou kauzu, opačný směr je dopočítaný', async ({ page }) => {
  await page.goto('/kauzy/zeta-stret/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await page.locator('.vazby').getByRole('link', { name: 'Testovací kauza Alfa' }).click();
  await expect(page).toHaveURL(/\/kauzy\/alfa-dotace\/$/);
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Alfa');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await expect(page.locator('.vazby')).toContainText('Navazují na ni:');
  await expect(page.locator('.vazby').getByRole('link', { name: 'Testovací kauza Žeta' })).toBeVisible();
});

test('kauza bez vazeb nemá blok Aktéři a návaznosti', async ({ page }) => {
  await page.goto('/kauzy/beta-archiv/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await expect(page.locator('.vazby')).toHaveCount(0);
});

test('značka zdroje u vazby přepne na Zdroje', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await page.locator('.vazby a[data-zdroj="2"]').first().click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
});

test('trvalý výběr kauzy zvýrazní cestu, ale zbytek mapy neztlumí', async ({ page }) => {
  await page.goto('/?pohled=mapa&vyber=alfa-dotace');
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/zvyrazneno/);
  await expect(page.locator('.mapa-svg')).not.toHaveClass(/ztlumeno/);
});

test('jméno aktéra ve stromu na počítači rozbaluje a sbaluje větev', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const fond = page.locator('.strom li[data-uzel="a:fond-sigma"] > .s-radek .s-akter');
  await expect(fond).toHaveAttribute('aria-expanded', 'true');
  await fond.focus();
  await page.keyboard.press('Enter');
  await expect(fond).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.mapa-panel')).toBeHidden();
});

test('na počítači jsou hlubší větve stromu sbalené (méně zastávek klávesy Tab) a mapu jde přeskočit', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await expect(page.locator('.strom li[data-uzel="a:holding-omega"][data-hlavni] > .s-radek .s-akter')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.mapa-preskocit')).toHaveAttribute('href', '#mapa-konec');
});

test('fokus na odkazu „navazuje na“ zvýrazní cílovou kauzu, fokus na ⓘ čáru vazby', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const zeta = page.locator('.strom li[data-uzel="k:zeta-stret"][data-hlavni]');
  await page.locator('.strom li[data-uzel="a:holding-omega"][data-hlavni] > .s-radek .s-akter').focus();
  await page.keyboard.press('Enter');
  const nav = zeta.locator('.s-navazuje').first();
  await nav.locator('a[data-slug]').focus();
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/fokus/);
  await expect(page.locator('.mapa-svg [data-uzel="k:zeta-stret"]')).not.toHaveClass(/fokus/);
  const hrana = await nav.getAttribute('data-hrana');
  await nav.locator('.s-info').focus();
  await expect(page.locator(`.mapa-svg .m-cara[data-hrana="${hrana}"]`)).toHaveClass(/fokus/);
});

test('mapa se nezmenšuje, při nedostatku místa se posouvá do strany', async ({ page }) => {
  await page.setViewportSize({ width: 1256, height: 528 });
  await page.goto('/?pohled=mapa');
  const { vykreslena, prirozena } = await page.locator('.mapa-svg').evaluate(s => ({
    vykreslena: Math.round(s.getBoundingClientRect().width), prirozena: Number(s.getAttribute('width')),
  }));
  expect(vykreslena).toBe(prirozena);
  await overBezPosouvani(page);
});
