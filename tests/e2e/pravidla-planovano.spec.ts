import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test('plánovaný krok stojí v hlavičce pod průběhem i se stavem a zdrojem', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  const pl = page.locator('dialog#detail .m2-hlava .prubeh + .planovano');
  await expect(pl).toBeVisible();
  // datumText odděluje části data pevnou mezerou, proto se mezery před porovnáním sjednotí
  const text = (await pl.textContent())!.replace(/\s+/g, ' ');
  expect(text).toBe('Stav k 1. 11. 2026: Fiktivní senát návrh projedná na schůzi od 2. 12. 2099.1');
  await expect(pl.locator('.chip')).toHaveAttribute('href', '#zdroj-1');
});

test('pravidlo bez plánovaného kroku blok nemá', async ({ page }) => {
  await page.goto('/pravidla/narizeni-tau/');
  await expect(page.locator('dialog#detail .m2-hlava')).toBeVisible();
  await expect(page.locator('dialog#detail .planovano')).toHaveCount(0);
});
