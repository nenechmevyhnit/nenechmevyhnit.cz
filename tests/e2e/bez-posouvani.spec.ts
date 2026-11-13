import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

for (const v of VELIKOSTI) {
  test.describe(`${v.width}×${v.height}`, () => {
    test.use({ viewport: v });
    for (const cesta of ['/', '/kauzy/alfa-dotace/', '/metodika/', '/o-projektu/', '/pravidla/', '/pravidla/zakon-omega/']) {
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
