import { expect, type Page } from '@playwright/test';

export const VELIKOSTI = [
  { width: 1256, height: 528 },
  { width: 1342, height: 565 },
  { width: 1342, height: 676 },
  { width: 1896, height: 868 },
  { width: 390, height: 700 },
];

/** Počítač: všechno se vejde na výšku okna, stránka se svisle neposouvá. */
export const POCITACE = VELIKOSTI.filter(v => v.width > 760);

/** Telefony: stránka se posouvá dolů, nikdy do strany. 360 px je nejběžnější Android, 375 × 667 iPhone SE
 *  (a zhruba výška, která na iPhonu zbude v Safari s lištami), 320 px nejužší displej, se kterým počítáme. */
export const MOBILY = [
  { width: 390, height: 700 },
  { width: 375, height: 667 },
  { width: 360, height: 640 },
  { width: 320, height: 568 },
];

export async function overBezPosouvani(page: Page) {
  const { svisle, vyska } = await page.evaluate(() => ({
    svisle: document.scrollingElement!.scrollHeight,
    vyska: window.innerHeight,
  }));
  expect(svisle, 'stránka se nesmí posouvat dolů').toBeLessThanOrEqual(vyska);
}

/** O kolik px přesahuje obsah právě zobrazeného panelu detailu jeho spodek (nebo spodek oříznutého kontejneru uvnitř panelu). */
export async function presahPanelu(page: Page, hlidatKontejnery = false): Promise<number> {
  return page.evaluate((kontejnery) => {
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
    // kontejner uvnitř panelu s overflow: hidden obsah nesmí useknout
    const useknuti = (el: HTMLElement, r: DOMRect) => {
      let m = -Infinity;
      for (let p = el.parentElement; p && p !== panel; p = p.parentElement) {
        if (getComputedStyle(p).overflowY === 'hidden') m = Math.max(m, r.bottom - p.getBoundingClientRect().bottom);
      }
      return m;
    };
    for (const el of panel.querySelectorAll<HTMLElement>('*')) {
      if (!el.getClientRects().length || el.closest('[hidden]') || vPosuvniku(el)) continue;
      for (const r of el.getClientRects()) {
        max = Math.max(max, r.bottom - spodek);
        if (kontejnery) max = Math.max(max, useknuti(el, r));
      }
    }
    return Math.round(max);
  }, hlidatKontejnery);
}

export async function overBezPosouvaniDoStrany(page: Page) {
  const { sirka, okno } = await page.evaluate(() => ({
    sirka: document.scrollingElement!.scrollWidth,
    okno: window.innerWidth,
  }));
  expect(sirka, 'stránka se nesmí posouvat do strany').toBeLessThanOrEqual(okno);
}
