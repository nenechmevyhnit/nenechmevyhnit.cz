import { expect, type Page } from '@playwright/test';

export const VELIKOSTI = [
  { width: 1256, height: 528 },
  { width: 1342, height: 565 },
  { width: 1342, height: 676 },
  { width: 1896, height: 868 },
  { width: 390, height: 700 },
];

export async function overBezPosouvani(page: Page) {
  const { svisle, vyska } = await page.evaluate(() => ({
    svisle: document.scrollingElement!.scrollHeight,
    vyska: window.innerHeight,
  }));
  expect(svisle, 'stránka se nesmí posouvat dolů').toBeLessThanOrEqual(vyska);
}
