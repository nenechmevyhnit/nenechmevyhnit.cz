import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

for (const v of VELIKOSTI) {
  test.describe(`${v.width}×${v.height}`, () => {
    test.use({ viewport: v });
    for (const cesta of ['/', '/kauzy/alfa-dotace/', '/metodika/', '/o-projektu/']) {
      test(`${cesta} se neposouvá dolů`, async ({ page }) => {
        await page.goto(cesta);
        await overBezPosouvani(page);
      });
    }
    test('celá osa je vidět', async ({ page }) => {
      await page.goto('/');
      const graf = await page.locator('#graf').boundingBox();
      expect(graf!.y + graf!.height).toBeLessThanOrEqual(v.height);
      const posledni = await page.locator('.radek').last().boundingBox();
      expect(posledni!.y + posledni!.height).toBeLessThanOrEqual(graf!.y + graf!.height + 1);
    });
  });
}

test('15 kauz: stránka se neposouvá, posouvá se jen seznam v ose', async ({ page }) => {
  await page.setViewportSize({ width: 1342, height: 565 });
  await page.goto('/');
  await page.evaluate(() => {
    const radky = document.querySelector('.radky')!;
    const vzor = [...document.querySelectorAll('.radek')];
    for (let i = 0; i < 9; i++) {
      const kopie = vzor[i % vzor.length].cloneNode(true) as HTMLElement;
      kopie.dataset.slug = `kopie-${i}`;
      kopie.style.setProperty('view-transition-name', `r-kopie-${i}`);
      radky.insertBefore(kopie, radky.querySelector('.prazdno'));
    }
  });
  await overBezPosouvani(page);
  const { vnitrni, vyska } = await page.evaluate(() => {
    const r = document.querySelector('.radky') as HTMLElement;
    return { vnitrni: r.scrollHeight, vyska: r.clientHeight };
  });
  expect(vnitrni).toBeGreaterThan(vyska);
});
