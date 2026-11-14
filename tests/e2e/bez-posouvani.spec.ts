import { test, expect } from '@playwright/test';
import { POCITACE, MOBILY, overBezPosouvani, overBezPosouvaniDoStrany } from './pomocne';

const STRANKY = ['/', '/kauzy/alfa-dotace/', '/metodika/', '/o-projektu/'];

for (const v of POCITACE) {
  test.describe(`${v.width}×${v.height}`, () => {
    test.use({ viewport: v });
    for (const cesta of STRANKY) {
      test(`${cesta} se neposouvá dolů`, async ({ page }) => {
        await page.goto(cesta);
        await overBezPosouvani(page);
      });
    }
    test('celá osa je vidět', async ({ page }) => {
      await page.goto('/');
      const graf = await page.locator('#graf').boundingBox();
      expect(graf!.y + graf!.height).toBeLessThanOrEqual(v.height);
      const posledni = await page.locator('.radek:not([hidden])').last().boundingBox();
      expect(posledni!.y + posledni!.height).toBeLessThanOrEqual(graf!.y + graf!.height + 1);
    });
  });
}

// Na mobilu se stránka posouvá dolů (na výšku telefonu se osa ani detail nevejdou), do strany nikdy.
for (const v of MOBILY) {
  test.describe(`mobil ${v.width}×${v.height}`, () => {
    test.use({ viewport: v });
    for (const cesta of STRANKY) {
      test(`${cesta} se neposouvá do strany`, async ({ page }) => {
        await page.goto(cesta);
        await page.evaluate(() => document.fonts.ready);
        await overBezPosouvaniDoStrany(page);
        const detail = page.locator('dialog#detail[open]');
        if (await detail.count()) {
          const d = await detail.evaluate(e => ({ sw: e.scrollWidth, cw: e.clientWidth }));
          expect(d.sw, 'detail kauzy se nesmí posouvat do strany').toBeLessThanOrEqual(d.cw);
        }
      });
    }
    test('všechny kauzy na stránce osy jsou vidět celé, bez vnitřního posuvníku', async ({ page }) => {
      await page.goto('/');
      const radky = await page.locator('#graf .radky').evaluate(e => ({ sh: e.scrollHeight, ch: e.clientHeight }));
      expect(radky.sh).toBeLessThanOrEqual(radky.ch + 1);
      await expect(page.locator('.radek:not([hidden])')).toHaveCount(6);
    });
  });
}

test('mnoho kauz: stránka ani seznam v ose se neposouvají, kauzy jsou na stránkách', async ({ page }) => {
  await page.setViewportSize({ width: 1342, height: 565 });
  await page.goto('/');
  await page.addStyleTag({ content: '#graf { flex: none !important; height: 180px !important; }' });
  await expect(page.locator('.strankovani')).toBeVisible();
  await overBezPosouvani(page);
  const { vnitrni, vyska } = await page.evaluate(() => {
    const r = document.querySelector('.radky') as HTMLElement;
    return { vnitrni: r.scrollHeight, vyska: r.clientHeight };
  });
  expect(vnitrni).toBeLessThanOrEqual(vyska);
});
