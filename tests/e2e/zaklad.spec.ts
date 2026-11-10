import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test('hlavička, jazyk a žádné cizí požadavky', async ({ page }) => {
  const cizi: string[] = [];
  page.on('request', r => { if (!r.url().startsWith('http://localhost')) cizi.push(r.url()); });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await expect(page.getByRole('link', { name: 'Nenechme vyhnít' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Metodika' })).toHaveAttribute('href', '/metodika/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://nenechmevyhnit.cz/obrazky/nahled.png');
  expect(cizi).toEqual([]);
  await overBezPosouvani(page);
});
