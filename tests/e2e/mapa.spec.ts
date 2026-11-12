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
  // role a období ukazuje karta vazeb (na mapě popisky nejsou)
  const karta = page.locator('.mapa-karta');
  await expect(karta).toBeVisible();
  await expect(karta).toHaveAttribute('aria-hidden', 'true');
  await expect(karta.locator('.k-nadpis')).toHaveText('Testovací kauza Alfa');
  await expect(karta).toContainText('Aktéři v kauze');
  await expect(karta).toContainText('příjemce dotace');
  // kauzy jsou vpravo, karta proto vlevo, aby je nezakryla
  await expect(karta).toHaveClass(/vlevo/);
  await page.mouse.move(0, 0);
  await expect(karta).toBeHidden();
  await expect(page.locator('.mapa-svg')).not.toHaveClass(/ztlumeno/);
});

test('najetí na aktéra ukáže jeho kartu, karta je naproti uzlu, najetí na čáru ukáže kartu té vazby', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const karta = page.locator('.mapa-karta');
  await page.locator('.mapa-svg [data-uzel="a:firma-alfa"]').hover();
  await expect(karta.locator('.k-nadpis')).toHaveText('Firma Alfa');
  await expect(karta).toContainText('vlastní · 2007–2012, 2015 – dosud');
  // Babiš je vlevo, karta proto vpravo
  await page.locator('.mapa-svg [data-uzel="babis"]').hover();
  await expect(karta.locator('.k-nadpis')).toHaveText('Andrej Babiš');
  await expect(karta).not.toHaveClass(/vlevo/);
  const id = await page.locator('.strom .s-navazuje').first().getAttribute('data-hrana');
  // bod uprostřed oblouku (střed jeho obdélníku na čáře neleží)
  const bod = await page.locator(`.mapa-svg .m-cara[data-hrana="${id}"] .m-zasah`).evaluate((c: SVGPathElement) => {
    const p = c.getPointAtLength(c.getTotalLength() / 2), m = c.getScreenCTM()!;
    return { x: p.x * m.a + m.e, y: p.y * m.d + m.f };
  });
  await page.mouse.move(bod.x, bod.y);
  await expect(karta.locator('.k-nadpis')).toContainText('→');
  await expect(page.locator(`.mapa-svg .m-cara[data-hrana="${id}"]`)).toHaveClass(/zvyrazneno/);
  await expect(page.locator('.mapa-svg .m-cara.zvyrazneno')).toHaveCount(1);
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

test('klik na čáru ke kauze otevře detail kauzy, klik na vazbu mezi aktéry panel se zdroji', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  // návaznost: detail navazující kauzy (ta, pod kterou je ve stromu „navazuje na“)
  const nav = page.locator('.strom li.s-kauza[data-hlavni]:has(> .s-navazuje)').first();
  const slug = await nav.getAttribute('data-slug');
  const id = await nav.locator(':scope > .s-navazuje').first().getAttribute('data-hrana');
  await page.locator(`.mapa-svg .m-cara[data-hrana="${id}"] .m-zasah`).dispatchEvent('click');
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page).toHaveURL(`/kauzy/${slug}/?pohled=mapa`);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog#detail')).toBeHidden();
  // čára aktéra ke kauze
  const kAlfe = await page.locator('.strom li[data-uzel="k:alfa-dotace"][data-hlavni]').getAttribute('data-hrana');
  await page.locator(`.mapa-svg .m-cara[data-hrana="${kAlfe}"] .m-zasah`).dispatchEvent('click');
  await expect(page).toHaveURL(/\/kauzy\/alfa-dotace\/\?pohled=mapa$/);
  await page.keyboard.press('Escape');
  // vazba mezi aktéry
  const vztah = await page.locator('.strom li[data-uzel="a:firma-alfa"][data-hlavni]').getAttribute('data-hrana');
  await page.locator(`.mapa-svg .m-cara[data-hrana="${vztah}"] .m-zasah`).dispatchEvent('click');
  await expect(page.locator('.mapa-panel')).toBeVisible();
  await expect(page.locator('.mapa-panel-nadpis')).toHaveText('Holding Omega → Firma Alfa');
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
  await expect(page.locator('.mapa-karta .k-nadpis')).toHaveText('Testovací kauza Epsilon, delší název');
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

test('mapa, která se vejde, má 100 % a rozměry SVG odpovídají měřítku', async ({ page }) => {
  await page.setViewportSize({ width: 1256, height: 528 });
  await page.goto('/?pohled=mapa');
  await expect(page.locator('.mapa-procenta')).toHaveText('100 %');
  const { vykreslena, prirozena } = await page.locator('.mapa-svg').evaluate(s => ({
    vykreslena: Math.round(s.getBoundingClientRect().width), prirozena: Math.round((s as SVGSVGElement).viewBox.baseVal.width),
  }));
  expect(vykreslena).toBe(prirozena);
  await overBezPosouvani(page);
});

const sirkaSvg = (page: Page) => page.locator('.mapa-svg').evaluate(s => Math.round(s.getBoundingClientRect().width));

test('tlačítka měřítka přiblíží, oddálí, vrátí 100 % a ukážou celou mapu', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const puvodni = await sirkaSvg(page);
  await page.getByRole('button', { name: 'Přiblížit' }).click();
  await expect(page.locator('.mapa-procenta')).toHaveText('125 %');
  expect(await sirkaSvg(page)).toBe(Math.round(puvodni * 1.25));
  await page.getByRole('button', { name: 'Oddálit' }).click();
  await page.getByRole('button', { name: 'Oddálit' }).click();
  await expect(page.locator('.mapa-procenta')).toHaveText('80 %');
  await page.getByRole('button', { name: /^Původní velikost, nyní 80 %$/ }).click();
  await expect(page.locator('.mapa-procenta')).toHaveText('100 %');
  await page.getByRole('button', { name: 'Celá mapa' }).click();
  const { sirka, vyska, plochaW, plochaH } = await page.evaluate(() => {
    const s = document.querySelector('.mapa-svg')!.getBoundingClientRect(), p = document.querySelector('.mapa-plocha')!;
    return { sirka: s.width, vyska: s.height, plochaW: p.clientWidth, plochaH: p.clientHeight };
  });
  expect(sirka).toBeLessThanOrEqual(plochaW);
  expect(vyska).toBeLessThanOrEqual(plochaH);
});

test('Ctrl + kolečko přiblíží mapu, samotné kolečko ne', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const box = (await page.locator('.mapa-plocha').boundingBox())!;
  await page.mouse.move(box.x + 200, box.y + 100);
  await page.mouse.wheel(0, 100);
  await expect(page.locator('.mapa-procenta')).toHaveText('100 %');
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -200);
  await page.keyboard.up('Control');
  await expect(page.locator('.mapa-procenta')).not.toHaveText('100 %');
  expect(await sirkaSvg(page)).toBeGreaterThan(0);
});

test('tažení myší posouvá plochu a po tažení se kauza neotevře', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Přiblížit' }).click();
  const plocha = page.locator('.mapa-plocha');
  const kauza = (await page.locator('.mapa-svg [data-uzel="k:zeta-stret"] rect').boundingBox())!;
  await page.mouse.move(kauza.x + 20, kauza.y + 8);
  await page.mouse.down();
  await page.mouse.move(kauza.x - 120, kauza.y - 60, { steps: 6 });
  await page.mouse.up();
  const posun = await plocha.evaluate(p => ({ x: p.scrollLeft, y: p.scrollTop }));
  expect(posun.x + posun.y).toBeGreaterThan(0);
  await expect(page.locator('dialog#detail')).toBeHidden();
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
});

test('velká plocha přes celé okno; Esc ji vrátí a přepnutí na osu ji zruší', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const tlacitko = page.getByRole('button', { name: 'Zvětšit plochu' });
  await tlacitko.click();
  await expect(page.locator('#graf')).toHaveClass(/velka-plocha/);
  await expect(page.getByRole('button', { name: 'Zmenšit plochu' })).toHaveAttribute('aria-pressed', 'true');
  await overBezPosouvani(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#graf')).not.toHaveClass(/velka-plocha/);
  await page.getByRole('button', { name: 'Zvětšit plochu' }).click();
  await prepinac(page).getByRole('button', { name: 'Osa' }).click();
  await expect(page.locator('#graf')).not.toHaveClass(/velka-plocha/);
});

test('v přehledu klik na prázdné místo přiblíží na 100 %, tažení ne', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Oddálit' }).click();
  await expect(page.locator('.mapa-procenta')).toHaveText('51 %');
  await expect(page.locator('.mapa-plocha')).toHaveClass(/prehled/);
  const box = (await page.locator('.mapa-plocha').boundingBox())!;
  const x = box.x + box.width - 20, y = box.y + box.height - 20;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 80, y - 40, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator('.mapa-procenta')).toHaveText('51 %');
  await page.mouse.click(x, y);
  await expect(page.locator('.mapa-procenta')).toHaveText('100 %');
});

test('široké okno: karta po najetí i panel po kliknutí nalevo vedle mapy', async ({ page }) => {
  await page.setViewportSize({ width: 1896, height: 868 });
  await page.goto('/?pohled=mapa');
  const graf = (await page.locator('#graf').boundingBox())!;
  await page.locator('.mapa-svg [data-uzel="a:firma-alfa"]').hover();
  const karta = page.locator('.mapa-karta');
  await expect(karta).toHaveClass(/venku/);
  const k = (await karta.boundingBox())!;
  expect(k.x + k.width).toBeLessThanOrEqual(graf.x);
  await page.locator('.mapa-svg [data-uzel="a:firma-alfa"]').click();
  const panel = page.locator('.mapa-panel');
  await expect(panel).toHaveClass(/venku/);
  const p = (await panel.boundingBox())!;
  expect(p.x + p.width).toBeLessThanOrEqual(graf.x);
  await expect(karta).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  // přes celé okno už vedle mapy místo není: karta je zpět v rohu plochy
  await page.getByRole('button', { name: 'Zvětšit plochu' }).click();
  await page.locator('.mapa-svg [data-uzel="a:firma-alfa"]').hover();
  await expect(karta).toBeVisible();
  await expect(karta).not.toHaveClass(/venku/);
});
