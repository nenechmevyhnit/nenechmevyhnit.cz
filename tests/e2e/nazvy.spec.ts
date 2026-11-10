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
