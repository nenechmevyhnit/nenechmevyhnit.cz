import { test, expect } from '@playwright/test';
import { VELIKOSTI } from './pomocne';

// Delší texty v modalu nesmí být oříznuté: buď se vejdou, nebo pokračují ve sloupcích do strany.
for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: v žádné záložce detailu není oříznutý obsah`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/kauzy/zeta-stret/');
    for (const zalozka of ['Chronologie', 'Souvislosti', 'Stav a stanovisko', /^Zdroje/]) {
      await page.getByRole('tab', { name: zalozka }).click();
      const presah = await page.evaluate(() => {
        const panel = document.querySelector<HTMLElement>('#detail .m2-panel:not([hidden])')!;
        const spodek = panel.getBoundingClientRect().bottom;
        let max = 0;
        // obsah uvnitř boxu s vlastním svislým posuvníkem není oříznutý, jen se posouvá
        const vPosuvniku = (el: HTMLElement) => {
          for (let p = el.parentElement; p && p !== panel; p = p.parentElement) {
            const oy = getComputedStyle(p).overflowY;
            if ((oy === 'auto' || oy === 'scroll') && p.getBoundingClientRect().bottom <= spodek + 1) return true;
          }
          return false;
        };
        for (const el of panel.querySelectorAll<HTMLElement>('*')) {
          if (!el.getClientRects().length || el.closest('[hidden]') || vPosuvniku(el)) continue;
          for (const r of el.getClientRects()) max = Math.max(max, r.bottom - spodek);
        }
        return Math.round(max);
      });
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
    if (v.width > 760) expect(p.skryto, 'na počítači je shrnutí vidět celé').toBe(false);
    else if (p.skryto) expect(p.posuvnik, 'na mobilu se delší shrnutí dá posunout').toBe(true);
  });
}

test('záložky detailu nemají svislý posuvník', async ({ page }) => {
  await page.goto('/kauzy/zeta-stret/');
  const z = await page.locator('#detail .zalozky').evaluate(e => ({ vyska: e.scrollHeight, viditelna: e.clientHeight, oy: getComputedStyle(e).overflowY }));
  expect(z.oy === 'hidden' || z.vyska <= z.viditelna, `obsah záložek ${z.vyska} px > ${z.viditelna} px`).toBe(true);
});
