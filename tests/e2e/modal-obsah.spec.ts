import { test, expect } from '@playwright/test';
import { VELIKOSTI, presahPanelu } from './pomocne';

// Delší texty v modalu nesmí být oříznuté: buď se vejdou, nebo pokračují ve sloupcích do strany.
for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: v žádné záložce detailu není oříznutý obsah`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/kauzy/zeta-stret/');
    for (const zalozka of ['Proč je to kauza', 'Chronologie', 'Souvislosti', 'Stav a stanovisko', /^Zdroje/]) {
      await page.getByRole('tab', { name: zalozka }).click();
      const presah = await presahPanelu(page);
      expect(presah, `záložka ${zalozka}: obsah přesahuje spodek panelu o ${presah} px`).toBeLessThanOrEqual(1);
    }
    await page.getByRole('tab', { name: 'Stav a stanovisko' }).click();
    await expect(page.locator('.opravy')).toContainText('Fiktivní oprava');
  });
}

// Stav a stanovisko stojí vedle sebe a nadpis stanoviska se nikdy neodtrhne od jeho textu.
for (const v of VELIKOSTI.filter(v => v.width > 760)) {
  test(`${v.width}×${v.height}: stanovisko je vedle stavu a nadpis drží u textu`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/kauzy/zeta-stret/');
    await page.getByRole('tab', { name: 'Stav a stanovisko' }).click();
    const r = await page.evaluate(() => {
      const box = document.querySelector('#detail .stav-box')!.getBoundingClientRect();
      const st = document.querySelector('#detail .stanovisko')!.getBoundingClientRect();
      const h4 = document.querySelector('#detail .stanovisko h4')!.getBoundingClientRect();
      const prvni = document.querySelector('#detail .stanovisko p')!.getClientRects()[0];
      return { box, st, h4, prvni };
    });
    expect(r.st.left, 'stanovisko začíná vpravo od stavu').toBeGreaterThan(r.box.right);
    expect(Math.abs(r.st.top - r.box.top), 'stav a stanovisko začínají ve stejné výšce').toBeLessThan(4);
    expect(Math.abs(r.prvni.left - r.h4.left), 'text stanoviska je pod nadpisem').toBeLessThan(40);
    expect(r.prvni.top).toBeGreaterThanOrEqual(r.h4.bottom - 1);
  });
}

// Shrnutí v hlavičce detailu se nikdy neusekne trojtečkou; na počítači se vejde celé (max. 320 znaků).
for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: shrnutí v detailu není useknuté`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/kauzy/zeta-stret/');
    const p = await page.locator('#detail .perex').evaluate(e => ({
      skryto: e.scrollHeight > e.clientHeight + 1,
      posuvnik: ['auto', 'scroll'].includes(getComputedStyle(e).overflowY),
      zkraceno: getComputedStyle(e).webkitLineClamp !== 'none' && getComputedStyle(e).webkitLineClamp !== '',
    }));
    expect(p.zkraceno, 'shrnutí se nesmí zkracovat trojtečkou').toBe(false);
    const vice = page.locator('#detail .perex-vice');
    if (v.width > 760) {
      expect(p.skryto, 'na počítači je shrnutí vidět celé').toBe(false);
      await expect(vice).toBeHidden();
    } else if (p.skryto) {
      // na mobilu je delší shrnutí zkrácené na tři řádky a tlačítko ho rozbalí celé
      await expect(vice).toBeVisible();
      await vice.click();
      await expect(vice).toHaveAttribute('aria-expanded', 'true');
      const poRozbaleni = await page.locator('#detail .perex').evaluate(e => e.scrollHeight <= e.clientHeight + 1);
      expect(poRozbaleni, 'po rozbalení je vidět celé shrnutí').toBe(true);
    }
  });
}

// Záložky, které se na mobilu nevejdou, se posouvají a okraj, za kterým pokračují, se vytrácí.
test('mobil: záložky detailu naznačí, že pokračují, a vybraná je celá vidět', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/kauzy/zeta-stret/');
  const lista = page.locator('#detail .zalozky');
  await expect(lista).toHaveClass(/mizi-vpravo/);
  await page.getByRole('tab', { name: /^Zdroje/ }).click();
  const tab = await page.getByRole('tab', { name: /^Zdroje/ }).boundingBox();
  const okno = await lista.boundingBox();
  expect(tab!.x + tab!.width).toBeLessThanOrEqual(okno!.x + okno!.width + 1);
  await expect(lista).toHaveClass(/mizi-vlevo/);
});

test('záložky detailu nemají svislý posuvník', async ({ page }) => {
  await page.goto('/kauzy/zeta-stret/');
  const z = await page.locator('#detail .zalozky').evaluate(e => ({ vyska: e.scrollHeight, viditelna: e.clientHeight, oy: getComputedStyle(e).overflowY }));
  expect(z.oy === 'hidden' || z.vyska <= z.viditelna, `obsah záložek ${z.vyska} px > ${z.viditelna} px`).toBe(true);
});

// Mobil: hlavička detailu (shrnutí, částky, mini-osa) zabere většinu výšky telefonu. Celý modal se proto posouvá
// dolů, každá záložka má přirozenou výšku (nic se neořízne, nic nemá vlastní posuvník) a zavírací tlačítko
// i lišta záložek zůstanou při posouvání vidět.
for (const v of [{ width: 375, height: 667 }, { width: 320, height: 568 }]) {
  test(`mobil ${v.width}×${v.height}: detail se posouvá dolů a žádná záložka není useknutá`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/kauzy/alfa-dotace/');
    const dlg = page.locator('dialog#detail');
    expect(await dlg.evaluate(d => getComputedStyle(d).overflowY)).toBe('auto');
    for (const zalozka of ['Proč je to kauza', 'Chronologie', 'Souvislosti', 'Stav a stanovisko', /^Zdroje/]) {
      await page.getByRole('tab', { name: zalozka }).click();
      const panel = page.locator('#detail .m2-panel:not([hidden])');
      const p = await panel.evaluate(el => {
        const vnitrni = [el, ...el.querySelectorAll<HTMLElement>('*')].filter(x =>
          x.scrollHeight > x.clientHeight + 1 && getComputedStyle(x).overflowY !== 'visible');
        return { sw: el.scrollWidth, cw: el.clientWidth, vnitrni: vnitrni.map(x => x.className || x.tagName) };
      });
      expect(p.vnitrni, `záložka ${zalozka}: nic se nesmí posouvat (ani ořezat) uvnitř panelu`).toEqual([]);
      expect(p.sw, `záložka ${zalozka}: panel se nesmí posouvat do strany`).toBeLessThanOrEqual(p.cw);
      // konec záložky jde posunem modalu zobrazit, zavírací tlačítko a lišta záložek zůstanou vidět
      await dlg.evaluate(d => { d.scrollTop = d.scrollHeight; });
      await expect(panel.locator(':scope > *:not(.panel-nadpis)').last()).toBeInViewport();
      await expect(page.getByRole('button', { name: 'Zavřít detail' })).toBeInViewport();
      await expect(page.getByRole('tab', { name: zalozka })).toBeInViewport();
      await dlg.evaluate(d => { d.scrollTop = 0; });
    }
  });
}

test('mobil: přepnutí záložky dole v dlouhém obsahu ukáže začátek nové záložky', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: /^Zdroje/ }).click();
  await page.locator('dialog#detail').evaluate(d => { d.scrollTop = d.scrollHeight; });
  await page.getByRole('tab', { name: 'Proč je to kauza' }).click();
  await expect(page.locator('#detail .proc-text')).toBeInViewport();
});

for (const v of [{ width: 390, height: 700 }, { width: 320, height: 568 }, { width: 1366, height: 768 }]) {
  test(`${v.width}×${v.height}: popisek vybrané události nepřesahuje okraj detailu`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/kauzy/zeta-stret/');
    const body = page.locator('#detail .mini-osa .bod');
    for (const i of [0, await body.count() - 1]) {
      await body.nth(i).click();
      await expect.poll(() => page.locator('#detail .vybrany-popis').evaluate(p => {
        const r = p.getBoundingClientRect(), d = p.closest('dialog')!.getBoundingClientRect();
        return r.left >= d.left && r.right <= d.right;
      })).toBe(true);
    }
  });
}
