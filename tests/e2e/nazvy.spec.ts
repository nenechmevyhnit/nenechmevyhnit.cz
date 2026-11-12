import { test, expect } from '@playwright/test';
import { VELIKOSTI } from './pomocne';

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: názvy kauz na ose nejsou uříznuté`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/');
    const urizle = await page.locator('.radek .nazev strong').evaluateAll(els =>
      els.filter(e => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1
        || getComputedStyle(e).textOverflow === 'ellipsis').map(e => e.textContent));
    expect(urizle).toEqual([]);
  });
}

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: celý text řádku osy (název, stav, zdroje, částka) je vidět`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const orizle = await page.locator('.radek:not([hidden]) .radek-btn').evaluateAll(els =>
      els.filter(e => e.scrollHeight > e.clientHeight + 1).map(e => e.querySelector('strong')?.textContent));
    expect(orizle).toEqual([]);
  });
}
