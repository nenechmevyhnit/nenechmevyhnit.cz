import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test('s omezeným pohybem nejsou žádné animace', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await page.goto('/');
  const animace = await page.evaluate(() => document.getAnimations().length);
  expect(animace).toBe(0);
  await expect(page.locator('body')).toHaveClass(/nacteno/);
  await ctx.close();
});

test('bez omezení pruhy při načtení dorůstají', async ({ page }) => {
  await page.goto('/');
  const jmena = await page.evaluate(() => document.getAnimations().map(a => (a as CSSAnimation).animationName));
  expect(jmena).toContain('nv-narust');
});
