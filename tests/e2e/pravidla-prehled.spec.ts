import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

const NAZVY = ['Testovací novela zákona Omega s dlouhým názvem pro mobil', 'Testovací pozměňovací návrh Sigma', 'Testovací nařízení Tau', 'Testovací usnesení vlády Kappa'];

test('menu vede na zákony a nařízení a přehled je seřazený od nejnovější změny', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: 'Zákony a nařízení' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page).toHaveTitle('Zákony a nařízení — Posuďte sami');
  await page.getByRole('button', { name: 'Seznam' }).click();
  await expect(page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: 'Zákony a nařízení' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Komu prospívají nová pravidla?');
  await expect(page.locator('.pr-radek .pr-nazev strong')).toHaveText(NAZVY);
  const prvni = page.locator('.pr-radek').first();
  await expect(prvni).toContainText('Poslanecký návrh zákona');
  await expect(prvni).toContainText('Schváleno Sněmovnou');
  await expect(prvni).toContainText('Andrej Babiš, Agrofert');
  await expect(prvni).toContainText('prospěch pravděpodobný');
});

test('řádek ukazuje průběh projednávání', async ({ page }) => {
  await page.goto('/pravidla/?pohled=seznam');
  const omega = page.locator('.pr-radek[data-slug="zakon-omega"] .prubeh');
  await expect(omega.locator('li:not(.konec)')).toHaveCount(5);
  await expect(omega.locator('li.hotovo')).toHaveCount(2);
  await expect(page.locator('.pr-radek[data-slug="pozmenovaci-sigma"] .prubeh li.konec')).toContainText('Zamítnuto');
  await expect(page.locator('.pr-radek[data-slug="narizeni-tau"] .prubeh li.hotovo')).toHaveCount(3);
});

test('filtry: hledání bez diakritiky, štítek, jen v projednávání, zrušení a prázdný stav', async ({ page }) => {
  await page.goto('/pravidla/?pohled=seznam');
  const viditelne = page.locator('.pr-radek:not([hidden])');
  const hledat = page.getByRole('searchbox', { name: 'Hledat v zákonech a nařízeních' });
  await expect(page.locator('.pr-hlava .pocet')).toHaveText('4 změny');
  await hledat.fill('lhutu k vymahani');
  await expect(viditelne).toHaveCount(1);
  await expect(page.locator('.pr-hlava .pocet')).toHaveText('1 z 4');
  await page.locator('.pr-hlava .f-zrusit').click();
  await expect(viditelne).toHaveCount(4);
  await expect(hledat).toHaveValue('');
  await page.locator('.pr-filtry [data-stitek="eu-fondy"]').click();
  await expect(viditelne).toHaveCount(1);
  await expect(viditelne.first()).toHaveAttribute('data-slug', 'narizeni-tau');
  await page.locator('.pr-filtry [data-stitek="eu-fondy"]').click();
  await page.getByLabel('jen v projednávání').check();
  await expect(viditelne).toHaveCount(1);
  await expect(viditelne.first()).toHaveAttribute('data-slug', 'zakon-omega');
  await hledat.fill('nic takoveho neexistuje');
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeVisible();
  await page.locator('.pravidla-seznam .prazdno [data-zrusit]').click();
  await expect(viditelne).toHaveCount(4);
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeHidden();
});

test('řádek označí důvody zařazení textem, bez prázdných oddělovačů', async ({ page }) => {
  await page.goto('/pravidla/?pohled=seznam');
  const omega = page.locator('.pr-radek[data-slug="zakon-omega"] .pr-nazev small');
  await expect(omega).toContainText('prospěch pravděpodobný');
  await expect(omega).toContainText('Kontrola moci: zpětná účinnost');
  const kappa = page.locator('.pr-radek[data-slug="usneseni-kappa"] .pr-nazev small');
  await expect(kappa).toHaveText('Usnesení vlády · Vyhlášeno · Kontrola moci: soudy');
  await expect(kappa).not.toContainText('prospěch');
  await expect(page.locator('.pr-radek[data-slug="narizeni-tau"] .pr-nazev small')).not.toContainText('Kontrola moci');
});

test('řádek s prospěchem ukazuje shrnutí „proč“, řádek jen s kontrolou moci ne', async ({ page }) => {
  await page.goto('/pravidla/?pohled=seznam');
  await expect(page.locator('.pr-radek[data-slug="zakon-omega"] .pr-proc-radek')).toHaveText(/dlužníkem/);
  await expect(page.locator('.pr-radek[data-slug="usneseni-kappa"] .pr-proc-radek')).toHaveCount(0);
});

test('na počítači je dlouhé shrnutí oříznuté v jednom řádku třemi tečkami', async ({ page }) => {
  await page.goto('/pravidla/?pohled=seznam');
  const proc = page.locator('.pr-radek[data-slug="zakon-omega"] .pr-proc-radek');
  const m = await proc.evaluate(e => {
    const cs = getComputedStyle(e);
    return { sirka: e.scrollWidth > e.clientWidth, whiteSpace: cs.whiteSpace, overflow: cs.overflow, textOverflow: cs.textOverflow, vyska: e.getBoundingClientRect().height, radek: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4 };
  });
  expect(m.sirka).toBe(true);
  expect(m.whiteSpace).toBe('nowrap');
  expect(m.overflow).toBe('hidden');
  expect(m.textOverflow).toBe('ellipsis');
  expect(m.vyska).toBeLessThanOrEqual(m.radek + 1);
  await overBezPosouvani(page);
});

test('filtr důvodu: každý čip zvlášť, oba, kombinace se štítkem a zrušení', async ({ page }) => {
  await page.goto('/pravidla/?pohled=seznam');
  const viditelne = page.locator('.pr-radek:not([hidden])');
  const prospech = page.locator('.pr-filtry [data-duvod="prospech"]');
  const kontrola = page.locator('.pr-filtry [data-duvod="kontrola-moci"]');
  await expect(prospech).toHaveText('Prospěch');
  await expect(kontrola).toHaveText('Kontrola moci');
  await kontrola.click();
  await expect(kontrola).toHaveAttribute('aria-pressed', 'true');
  await expect(viditelne).toHaveCount(2);
  await expect(page.locator('.pr-hlava .pocet')).toHaveText('2 z 4');
  await prospech.click();
  await expect(viditelne).toHaveCount(4);
  await kontrola.click();
  await expect(viditelne).toHaveCount(3);
  await page.locator('.pr-filtry [data-stitek="soudy"]').click();
  await expect(viditelne).toHaveCount(0);
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeVisible();
  await page.locator('.pr-hlava .f-zrusit').click();
  await expect(viditelne).toHaveCount(4);
  await expect(prospech).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.pr-hlava .f-zrusit')).toBeHidden();
});

test('Zrušit filtry je na počítači v záhlaví seznamu jen při aktivním filtru a řádek filtrů se neposune', async ({ page }) => {
  await page.goto('/pravidla/?pohled=seznam');
  const zrusit = page.locator('.pr-hlava .f-zrusit');
  const hledat = page.locator('.pr-filtry .f-hledat');
  const pred = await hledat.boundingBox();
  await expect(zrusit).toBeHidden();
  await expect(page.locator('.pr-filtry > .vpravo')).toBeHidden();
  await page.locator('.pr-filtry [data-stitek="dotace"]').click();
  await expect(zrusit).toBeVisible();
  expect(await hledat.boundingBox()).toEqual(pred);
});

test('věta pod filtry: druh, stav a řazení', async ({ page }) => {
  await page.goto('/pravidla/');
  const viditelne = page.locator('.pr-radek:not([hidden])');
  await page.getByLabel('Druh').selectOption({ label: 'typu nařízení vlády' });
  await expect(viditelne).toHaveCount(1);
  await expect(viditelne.first()).toHaveAttribute('data-slug', 'narizeni-tau');
  await expect(page.locator('.pr-hlava .f-zrusit')).toBeVisible();
  await page.locator('.pr-hlava .f-zrusit').click();
  await expect(page.getByLabel('Druh')).toHaveValue('');
  await page.getByLabel('Stav').selectOption({ label: 've stavu zamítnuto' });
  await expect(viditelne).toHaveCount(1);
  await expect(viditelne.first()).toHaveAttribute('data-slug', 'pozmenovaci-sigma');
  await page.locator('.pr-hlava .f-zrusit').click();
  await page.getByLabel('Řadit').selectOption({ label: 'podle názvu' });
  const nazvy = await page.locator('.pr-radek .pr-nazev strong').allTextContents();
  expect(nazvy).toEqual([...nazvy].sort((a, b) => a.localeCompare(b, 'cs')));
});

test('úvod, filtry a rámeček seznamu jsou na stejném místě jako na stránce kauz', async ({ page }) => {
  const mista = async () => page.evaluate(() => Object.fromEntries(['.hero h1', '.u2-pod', '.filtry', '.graf, .pravidla-obal', '.strankovani:not([hidden]), .osa-roku, .pr-hlava']
    .map(s => { const b = document.querySelector(s)!.getBoundingClientRect(); return [s.split(',')[0], [Math.round(b.top), Math.round(b.height)]]; })));
  for (const v of [{ width: 1366, height: 768 }, { width: 1896, height: 868 }, { width: 1256, height: 528 }]) {
    await page.setViewportSize(v);
    await page.goto('/');
    const kauzy = await mista();
    await page.goto('/pravidla/');
    expect(await mista(), `${v.width}×${v.height}`).toEqual(kauzy);
  }
});

test('řádek na počítači nabízí „Detail →“', async ({ page }) => {
  await page.goto('/pravidla/?pohled=seznam');
  await expect(page.locator('.pr-radek').first().locator('.otevrit')).toHaveText('Detail →');
});

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test('řádek ukazuje stav, komu a závěr jako text a bez posouvání stránky', async ({ page }) => {
    await page.goto('/pravidla/?pohled=seznam');
    const prvni = page.locator('.pr-radek').first();
    const text = await prvni.evaluate(e => (e as HTMLElement).innerText);
    expect(text).toContain('prospěch pravděpodobný');
    expect(text).toContain('Schváleno Sněmovnou');
    expect(text).toContain('Andrej Babiš, Agrofert');
    await overBezPosouvani(page);
  });

  test('dlouhé shrnutí „proč“ je oříznuté na dva řádky a stránka se neposouvá', async ({ page }) => {
    await page.goto('/pravidla/?pohled=seznam');
    const proc = page.locator('.pr-radek[data-slug="zakon-omega"] .pr-proc-radek');
    const m = await proc.evaluate(e => {
      const cs = getComputedStyle(e) as CSSStyleDeclaration & { webkitLineClamp: string };
      return { clamp: cs.webkitLineClamp || cs.getPropertyValue('line-clamp'), preteka: e.scrollHeight > e.clientHeight, vyska: e.getBoundingClientRect().height, radek: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4 };
    });
    expect(m.clamp).toBe('2');
    expect(m.preteka).toBe(true);
    expect(m.vyska).toBeLessThanOrEqual(2 * m.radek + 1);
    await overBezPosouvani(page);
  });

  test('řádek jen s kontrolou moci ukazuje důvod jako text', async ({ page }) => {
    await page.goto('/pravidla/?pohled=seznam');
    const text = await page.locator('.pr-radek[data-slug="usneseni-kappa"]').evaluate(e => (e as HTMLElement).innerText);
    expect(text).toContain('Kontrola moci: soudy');
    await overBezPosouvani(page);
  });

  test('témata, která se nevejdou, schovají se pod „+N další“, důvody zůstanou vidět a nic se neposouvá do strany', async ({ page }) => {
    await page.goto('/pravidla/');
    const cipy = page.locator('.pr-filtry .f-cipy button[data-stitek]');
    const vice = page.locator('.pr-filtry .f-cipy .f-vice');
    await expect(vice).toBeVisible();
    // tlačítko „+N další“ je celé vidět, nic ho neořízne
    const [vb, ob] = [await vice.boundingBox(), await page.locator('.pr-filtry .f-cipy').boundingBox()];
    expect(vb!.x + vb!.width).toBeLessThanOrEqual(ob!.x + ob!.width + 1);
    const vsechny = page.locator('.pr-filtry .f-cipy button[data-stitek], .pr-filtry .f-cipy button[data-duvod]');
    const skryte = await vsechny.evaluateAll(cs => cs.filter(c => (c as HTMLElement).hidden).length);
    expect(skryte).toBeGreaterThan(0);
    await expect(vice).toContainText(`+${skryte} dalš`);
    expect(await page.locator('.pr-filtry .f-cipy').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    await vice.click();
    await expect(vice).toHaveText('méně');
    for (const c of await vsechny.all()) await expect(c).toBeVisible();
    const posledni = cipy.last();
    await posledni.click();
    await vice.click();
    await expect(posledni).toBeVisible();
    await expect(posledni).toHaveAttribute('aria-pressed', 'true');
    await overBezPosouvani(page);
  });

  test('názvy fází průběhu se v řádku nezkracují třemi tečkami', async ({ page }) => {
    await page.goto('/pravidla/?pohled=seznam');
    const oriznute = await page.locator('.pr-radek .prubeh .f-nazev').evaluateAll(a => a.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
    expect(oriznute).toEqual([]);
    expect(await page.locator('.pr-radek .prubeh .f-nazev').first().evaluate(e => getComputedStyle(e).textOverflow)).not.toBe('ellipsis');
  });
});

test('prázdný archiv nemá položku menu ani stránku pravidel', async ({ page }) => {
  await page.goto('http://localhost:4322/');
  await expect(page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: /Zákony|pravidel|Pravidla/ })).toHaveCount(0);
  const odpoved = await page.goto('http://localhost:4322/pravidla/');
  expect(odpoved?.status()).toBe(404);
});

test('témata na počítači v jednom řádku bez posuvníku', async ({ page }) => {
  await page.goto('/pravidla/');
  const cipy = page.locator('.pr-filtry .f-cipy');
  expect(await cipy.evaluate(e => getComputedStyle(e).overflowX)).toBe('hidden');
  expect(await cipy.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
});

test('nízké okno: změny se stránkují místo posouvání seznamu, otevřená změna přepne na svou stránku', async ({ page }) => {
  await page.setViewportSize({ width: 1256, height: 528 });
  await page.goto('/pravidla/');
  const seznam = page.locator('.pravidla-seznam');
  const strankovani = page.locator('.pravidla-obal .strankovani');
  await expect(strankovani).toBeVisible();
  expect(await seznam.evaluate(e => e.scrollHeight <= e.clientHeight + 1)).toBe(true);
  const naStranku = await page.locator('.pr-radek:not([hidden])').count();
  expect(naStranku).toBeGreaterThan(0);
  expect(naStranku).toBeLessThan(4);
  await expect(strankovani.locator('.s-rozsah')).toHaveText(`1–${naStranku} z 4`);
  await strankovani.locator('.s-dalsi').click();
  await expect(page.locator('.pr-radek[data-slug="zakon-omega"]')).toBeHidden();
  await strankovani.locator('button[data-strana="1"]').click();
  await expect(page.locator('.pr-radek[data-slug="zakon-omega"]')).toBeVisible();
  // změna z poslední stránky otevřená rovnou z adresy
  await page.goto('/pravidla/usneseni-kappa/');
  await page.locator('#detail .zavrit').click();
  await expect(page.locator('.pr-radek[data-slug="usneseni-kappa"]')).toBeVisible();
  await overBezPosouvani(page);
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: přehled se neposouvá dolů a poslední řádek jde zobrazit`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/?pohled=seznam');
    await overBezPosouvani(page);
    const dalsi = page.locator('.pravidla-obal .strankovani .s-dalsi');
    while (await dalsi.isVisible() && await dalsi.isEnabled()) await dalsi.click();
    const posledni = page.locator('.pr-radek').last();
    await expect(posledni).toBeInViewport();
    await overBezPosouvani(page);
  });
}
