import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('přepínač Seznam · Časová osa a adresa ?pohled=osa', async ({ page }) => {
  await page.goto('/pravidla/');
  const prepinac = page.getByRole('group', { name: 'Zobrazení změn pravidel' });
  await expect(prepinac.getByRole('button', { name: 'Seznam' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.osa-pravidel')).toBeHidden();
  await prepinac.getByRole('button', { name: 'Časová osa' }).click();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await expect(page.locator('.pravidla-obal')).toBeHidden();
  await prepinac.getByRole('button', { name: 'Seznam' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page.locator('.pravidla-obal')).toBeVisible();
});

test('přímá adresa ?pohled=osa otevře osu: řádky, body, dnes, legenda, dříve', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const osa = page.locator('.osa-pravidel');
  await expect(osa).toBeVisible();
  await expect(osa.locator('.op-radek')).toHaveCount(4);
  // řazení podle první kreslené události od 1. 12. 2025: Kappa 12. 1., Tau 1. 2., Sigma 2. 4., Omega 10. 6. 2026
  const slugy = await osa.locator('.op-radek').evaluateAll(r => r.map(e => (e as HTMLElement).dataset.slug));
  expect(slugy).toEqual(['usneseni-kappa', 'narizeni-tau', 'pozmenovaci-sigma', 'zakon-omega']);
  await expect(osa.locator('.op-dnes-popisek')).toHaveText('dnes');
  // srozumitelné i bez znalosti legislativy: věta nad osou a legenda obyčejnými slovy včetně čar
  await expect(osa.locator('.op-uvod')).toContainText('Každý řádek je jedna změna pravidel.');
  await expect(osa.locator('.op-uvod')).toContainText('Po kliknutí na bod uvidíte podrobnosti a zdroje.');
  await expect(osa.locator('.op-legenda')).toContainText('krok schvalování (návrh, hlasování, podpis)');
  await expect(osa.locator('.op-legenda')).toContainText('konec: zamítnuto, staženo nebo zrušeno');
  await expect(osa.locator('.op-legenda')).toContainText('jiná událost, třeba stanovisko úřadu nebo rozhodnutí soudu');
  await expect(osa.locator('.op-legenda')).toContainText('doba projednávání');
  await expect(osa.locator('.op-legenda')).toContainText('kdy má změna začít platit');
  await expect(osa.locator('.op-legenda .op-vzor')).toHaveCount(2);
  const sigma = osa.locator('.op-radek[data-slug="pozmenovaci-sigma"]');
  await expect(sigma.locator('.op-bod.konec')).toHaveCount(1);
  await expect(sigma.locator('.op-drive')).toHaveText('◀ 1 starší');
  // pod názvem je nejdřív stav, potom druh předpisu
  await expect(sigma.locator('.op-nazev small')).toHaveText('Zamítnuto · pozměňovací návrh');
  await expect(sigma.locator('.op-drive')).toHaveAttribute('aria-label', /^1 starší: .+, 1 událost před prosincem 2025$/);
  const omega = osa.locator('.op-radek[data-slug="zakon-omega"]');
  await expect(omega.locator('a.op-bod.krok')).toHaveCount(2);
  await expect(omega.locator('.op-cara:not(.budouci)')).toHaveCount(1);
});

test('fokus na krajní body (i ◇ účinnosti) ukáže popisek s názvem pravidla celý v okně', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const body = page.locator('.op-radek .op-bod');
  const xy = await body.evaluateAll(l => l.map(e => e.getBoundingClientRect().left));
  const cile = [xy.indexOf(Math.min(...xy)), xy.indexOf(Math.max(...xy))];
  expect(await body.nth(cile[1]).evaluate(e => e.classList.contains('ucinnost'))).toBe(true);
  for (const i of cile) {
    await body.nth(i).focus();
    const popisek = page.locator('.op-popisek');
    await expect(popisek).toBeVisible();
    await expect(popisek).toHaveText(/\d{4} · (.+ · )?Testovací /);
    const nazev = await body.nth(i).evaluate(e => e.closest('.op-radek')!.querySelector('.op-nazev strong')!.textContent!);
    await expect(popisek).toContainText(nazev);
    const box = (await popisek.boundingBox())!;
    const okno = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(okno.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('.op-popisek')).toBeHidden();
});

test('popisek jde najet myší a zůstane, po odjetí zmizí', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const bod = page.locator('.op-radek a.op-bod').first();
  await bod.hover();
  const popisek = page.locator('.op-popisek');
  await expect(popisek).toBeVisible();
  const box = (await popisek.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  // po opuštění bodu popisek zůstává (hoverable), na popisku samotném nezmizí
  await page.waitForTimeout(400);
  await expect(popisek).toBeVisible();
  // odjezd mimo osu: na legendu pod plochou (cíl vychází z rozložení, ne z pevné souřadnice)
  const legenda = (await page.locator('.op-legenda').boundingBox())!;
  await page.mouse.move(legenda.x + legenda.width - 4, legenda.y + legenda.height / 2, { steps: 5 });
  await expect(popisek).toBeHidden();
});

test('popisek bodu: „datum · krok nebo název · název pravidla“, u skupiny název jednou na konci', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const texty = await page.locator('.op-radek[data-slug="zakon-omega"] .op-bod').evaluateAll(l => l.map(e => (e as HTMLElement).dataset.popisek!));
  expect(texty.length).toBeGreaterThan(1);
  for (const t of texty) expect(t).toMatch(/ · Testovací novela zákona Omega s dlouhým názvem pro mobil$/);
  expect(texty.some(t => /^\d+\. \d+\. \d{4} · [^;]+ · Testovací/.test(t))).toBe(true);
});

test('body a značka „dříve“ otevírají dialog (aria-haspopup)', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const odkazy = page.locator('.op-radek a.op-bod, .op-radek a.op-drive');
  const n = await odkazy.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) await expect(odkazy.nth(i)).toHaveAttribute('aria-haspopup', 'dialog');
});

test('body mají přístupný název s názvem pravidla a datem', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const bod = page.locator('.op-radek[data-slug="zakon-omega"] a.op-bod').first();
  await expect(bod).toHaveAttribute('aria-label', /^Testovací novela zákona Omega s dlouhým názvem pro mobil: \d+\. \d+\. 2026 · /);
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('není přepínač ani osa, seznam je vidět', async ({ page }) => {
    await page.goto('/pravidla/?pohled=osa');
    await expect(page.locator('.pr-pohled')).toBeHidden();
    await expect(page.locator('.osa-pravidel')).toBeHidden();
    await expect(page.locator('.pravidla-obal')).toBeVisible();
  });
});

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });
  test('osa se posouvá do strany, názvy zůstávají vlevo a je vidět dnes', async ({ page }) => {
    await page.goto('/pravidla/?pohled=osa');
    const plocha = page.locator('.op-plocha');
    expect(await plocha.evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true);
    await expect(page.locator('.op-dnes').first()).toBeInViewport();
    const nazev = page.locator('.op-radek .op-nazev').first();
    expect(await nazev.evaluate(e => getComputedStyle(e).position)).toBe('sticky');
    await overBezPosouvani(page);
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: osa se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/?pohled=osa');
    await expect(page.locator('.osa-pravidel')).toBeVisible();
    await overBezPosouvani(page);
    if (v.width > 1000) expect(await page.locator('.op-plocha').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  });
}

test('klik na bod otevře Průběh na dané události, zavření vrátí osu a fokus', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  const bod = page.locator('.op-radek[data-slug="zakon-omega"] a.op-bod.krok').nth(1);
  const index = await bod.getAttribute('data-udalost');
  await bod.click();
  await expect(page).toHaveURL(new RegExp(`/pravidla/zakon-omega/\\?udalost=${index}&pohled=osa$`));
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Průběh' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`.udalosti-seznam > li[data-i="${index}"]`)).toBeVisible();
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await expect(page.locator('.op-radek[data-slug="zakon-omega"] .op-nazev')).toBeFocused();
});

test('přímá adresa ?udalost= otevře detail na události', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/?udalost=1');
  await expect(page.getByRole('tab', { name: 'Průběh' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.udalosti-seznam > li[data-i="1"]')).toBeVisible();
});

test('neplatné ?udalost= otevře detail normálně a bez chyby', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', e => chyby.push(e.message));
  for (const u of ['-1', '99', 'abc']) {
    await page.goto(`/pravidla/zakon-omega/?udalost=${u}`);
    await expect(page.locator('dialog#detail')).toBeVisible();
    await expect(page.getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
  }
  // 99: Průběh ukazuje výchozí událost, stejnou jako bez ?udalost=
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const vychozi = await page.locator('.udalosti-seznam > li[data-i]:visible').evaluateAll(l => l.map(e => (e as HTMLElement).dataset.i));
  await page.goto('/pravidla/zakon-omega/?udalost=99');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const neplatne = await page.locator('.udalosti-seznam > li[data-i]:visible').evaluateAll(l => l.map(e => (e as HTMLElement).dataset.i));
  expect(vychozi.length).toBeGreaterThan(0);
  expect(neplatne).toEqual(vychozi);
  expect(chyby).toEqual([]);
});

test('značka „dříve“ otevře první starší událost', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.locator('.op-radek[data-slug="pozmenovaci-sigma"] .op-drive').click();
  await expect(page).toHaveURL(/\/pravidla\/pozmenovaci-sigma\/\?udalost=0&pohled=osa$/);
  await expect(page.locator('.udalosti-seznam > li[data-i="0"]')).toBeVisible();
});

test('klik na název řádku osy otevře detail', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  await page.locator('.op-radek[data-slug="narizeni-tau"] .op-nazev').click();
  await expect(page).toHaveURL(/\/pravidla\/narizeni-tau\/\?pohled=osa$/);
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací nařízení Tau');
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
});

test('zpět v prohlížeči po otevření z osy vrátí osu', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  await page.locator('.op-radek[data-slug="zakon-omega"] a.op-bod').first().click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog#detail')).toBeHidden();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
});

test('Zpět a Vpřed po otevření bodu z osy obnoví událost', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  const bod = page.locator('.op-radek[data-slug="zakon-omega"] a.op-bod.krok').nth(1);
  const index = await bod.getAttribute('data-udalost');
  await bod.click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog#detail')).toBeHidden();
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/pravidla/zakon-omega/\\?udalost=${index}&pohled=osa$`));
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page.locator(`.udalosti-seznam > li[data-i="${index}"]`)).toBeVisible();
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
});

test('klávesnice: Enter na bodu osy otevře Průběh na události bez načtení stránky', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  const bod = page.locator('.op-radek[data-slug="zakon-omega"] a.op-bod.krok').nth(1);
  const index = await bod.getAttribute('data-udalost');
  await bod.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/pravidla/zakon-omega/\\?udalost=${index}&pohled=osa$`));
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Průběh' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`.udalosti-seznam > li[data-i="${index}"]`)).toBeVisible();
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
});

test('filtry skrývají řádky osy, počítadlo a prázdný stav platí i pro osu', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const radky = page.locator('.op-radek:not([hidden])');
  await expect(radky).toHaveCount(4);
  await page.getByRole('searchbox', { name: 'Hledat ve změnách pravidel' }).fill('lhutu k vymahani');
  await expect(radky).toHaveCount(1);
  await expect(radky.first()).toHaveAttribute('data-slug', 'zakon-omega');
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 1 z 4');
  await page.getByRole('searchbox', { name: 'Hledat ve změnách pravidel' }).fill('nic takoveho neexistuje');
  await expect(page.locator('.op-prazdno')).toBeVisible();
  await page.locator('.op-prazdno [data-zrusit]').click();
  await expect(radky).toHaveCount(4);
  await expect(page.locator('.op-prazdno')).toBeHidden();
});

test('Seznam → Osa → Seznam zachová filtr i počítadlo', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.locator('.pr-filtry [data-stitek="soudy"]').click();
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 1 z 4');
  await page.getByRole('button', { name: 'Časová osa' }).click();
  await expect(page.locator('.op-radek:not([hidden])')).toHaveCount(1);
  await page.getByRole('button', { name: 'Seznam' }).click();
  await expect(page.locator('.pr-radek:not([hidden])')).toHaveCount(1);
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 1 z 4');
});

test('Zpět po přepnutí na osu vrátí seznam a /pravidla/ (a naopak osu)', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  await page.locator('.pr-radek[data-slug="zakon-omega"] a.pr-btn').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await page.getByRole('button', { name: 'Časová osa' }).click();
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page.locator('dialog#detail')).toBeHidden();
  await expect(page.locator('.pravidla-obal')).toBeVisible();
  await expect(page.locator('.osa-pravidel')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Seznam' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
});

test('Zpět po přepnutí ze seznamu zpět na osu obnoví osu', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  await page.locator('.op-radek[data-slug="zakon-omega"] .op-nazev').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await page.getByRole('button', { name: 'Seznam' }).click();
  await expect(page.locator('.pravidla-obal')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('dialog#detail')).toBeHidden();
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await expect(page.locator('.pravidla-obal')).toBeHidden();
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
});

test('přímá adresa detailu s ?pohled=osa: osa na pozadí, zavření vrátí /pravidla/?pohled=osa', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/?udalost=1&pohled=osa');
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page.locator('.udalosti-seznam > li[data-i="1"]')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.pohledPravidel)).toBe('osa');
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await expect(page.locator('.op-radek[data-slug="zakon-omega"] .op-nazev')).toBeFocused();
});

test('přímé načtení ?udalost= ponechá událost ve stavu historie', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/?udalost=1');
  expect(await page.evaluate(() => history.state)).toEqual({ slug: 'zakon-omega', udalost: 1 });
  await page.goto('/pravidla/zakon-omega/');
  expect(await page.evaluate(() => history.state)).toEqual({ slug: 'zakon-omega' });
});

test('prázdný stav filtru je nahoře a skryje prázdnou osu i legendu', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.getByRole('searchbox', { name: 'Hledat ve změnách pravidel' }).fill('nic takoveho neexistuje');
  const prazdno = page.locator('.op-prazdno');
  await expect(prazdno).toBeVisible();
  await expect(page.locator('.op-plocha')).toBeHidden();
  await expect(page.locator('.op-legenda')).toBeHidden();
  const osa = (await page.locator('.osa-pravidel').boundingBox())!;
  const hlaska = (await prazdno.boundingBox())!;
  expect(hlaska.y - osa.y).toBeLessThan(40);
  await overBezPosouvani(page);
});

test('fokus názvu řádku má okraj uvnitř buňky (neořízne ho plocha ani další řádek)', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const nazev = page.locator('.op-radek .op-nazev').first();
  await nazev.focus();
  const [odsazeni, sirka] = await nazev.evaluate(e => { const c = getComputedStyle(e); return [parseFloat(c.outlineOffset), parseFloat(c.outlineWidth)]; });
  expect(odsazeni).toBeLessThanOrEqual(-sirka);
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: značky měsíců, „dnes“ a „dříve“ se nepřekrývají`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/?pohled=osa');
    await expect(page.locator('.osa-pravidel')).toBeVisible();
    const kolize = await page.evaluate(() => {
      const r = (e: Element) => e.getBoundingClientRect();
      const protne = (a: DOMRect, b: DOMRect) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      const chyby: string[] = [];
      const znacky = [...document.querySelectorAll('.op-znacka')].map(r);
      for (let i = 1; i < znacky.length; i++) if (znacky[i - 1].right > znacky[i].left) chyby.push(`značky ${i - 1}/${i}`);
      const dnes = r(document.querySelector('.op-dnes-popisek')!);
      znacky.forEach((z, i) => { if (protne(z, dnes)) chyby.push(`dnes/značka ${i}`); });
      document.querySelectorAll('.op-radek').forEach(radek => {
        const drive = radek.querySelector('.op-drive');
        if (!drive) return;
        radek.querySelectorAll('.op-bod').forEach(b => { if (protne(r(drive), r(b))) chyby.push('dříve/bod'); });
      });
      return chyby;
    });
    expect(kolize).toEqual([]);
  });
}

test('delší rozsah než 20 měsíců: plocha se posouvá do strany a značky se nepřekrývají', async ({ page }) => {
  await page.setViewportSize({ width: 1256, height: 528 });
  await page.goto('/pravidla/?pohled=osa');
  const nastavMesice = (n: number) => page.evaluate(m => {
    const osa = document.querySelector<HTMLElement>('.osa-pravidel')!;
    osa.style.setProperty('--mesicu', String(m));
    osa.querySelector('.op-mesice')!.innerHTML = Array.from({ length: m }, (_, i) =>
      `<span class="op-znacka${i % 12 === 1 ? ' rok' : ''}" style="left:${(i * 100) / m}%">${i === 0 ? 'pro' : i % 12 === 1 ? '2026' : 'úno'}</span>`).join('');
  }, n);
  const plocha = page.locator('.op-plocha');
  const preklad = () => page.evaluate(() => {
    const z = [...document.querySelectorAll('.op-znacka')].map(e => e.getBoundingClientRect());
    return z.some((a, i) => i > 0 && z[i - 1].right > a.left);
  });
  // 20 měsíců se vejde bez posouvání
  await nastavMesice(20);
  expect(await plocha.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  expect(await preklad()).toBe(false);
  // 28 měsíců (rozsah do 2028) se posouvá a značky se nestlačí
  await nastavMesice(28);
  expect(await plocha.evaluate(e => e.scrollWidth > e.clientWidth + 1)).toBe(true);
  expect(await preklad()).toBe(false);
  await overBezPosouvani(page);
});
