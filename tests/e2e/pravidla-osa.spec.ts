import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('přepínač Seznam · Časová osa a adresa ?pohled=osa', async ({ page }) => {
  await page.goto('/pravidla/');
  const prepinac = page.getByRole('group', { name: 'Zobrazení změn pravidel' });
  await expect(prepinac.getByRole('button', { name: 'Seznam' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.osa-pravidel')).toBeHidden();
  await prepinac.getByRole('button', { name: 'Časová osa' }).click();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await expect(page.locator('.pravidla-obal')).toBeHidden();
  await prepinac.getByRole('button', { name: 'Seznam' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page.locator('.pravidla-obal')).toBeVisible();
});

test('přímá adresa ?pohled=osa otevře osu: řádky, body, dnes, legenda, dříve', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const osa = page.locator('.osa-pravidel');
  await expect(osa).toBeVisible();
  await expect(osa.locator('.op-radek')).toHaveCount(4);
  // řazení podle první kreslené události od 1. 12. 2025: Kappa 12. 1., Tau 1. 2., Sigma 2. 4., Omega 10. 6. 2026
  const slugy = await osa.locator('.op-radek').evaluateAll(r => r.map(e => (e as HTMLElement).dataset.slug));
  expect(slugy).toEqual(['usneseni-kappa', 'narizeni-tau', 'pozmenovaci-sigma', 'zakon-omega']);
  await expect(osa.locator('.op-dnes-popisek')).toHaveText('dnes');
  await expect(osa.locator('.op-legenda')).toContainText('krok projednávání');
  await expect(osa.locator('.op-legenda')).toContainText('ukončující krok');
  await expect(osa.locator('.op-legenda')).toContainText('ostatní událost');
  await expect(osa.locator('.op-legenda')).toContainText('budoucí účinnost');
  const sigma = osa.locator('.op-radek[data-slug="pozmenovaci-sigma"]');
  await expect(sigma.locator('.op-bod.konec')).toHaveCount(1);
  await expect(sigma.locator('.op-drive')).toHaveText('◀ dříve (1)');
  const omega = osa.locator('.op-radek[data-slug="zakon-omega"]');
  await expect(omega.locator('a.op-bod.krok')).toHaveCount(2);
  await expect(omega.locator('.op-cara:not(.budouci)')).toHaveCount(1);
});

test('fokus na bod ukáže popisek, který je celý v okně', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const body = page.locator('.op-radek a.op-bod');
  const n = await body.count();
  for (const i of [0, n - 1]) {
    await body.nth(i).focus();
    const popisek = page.locator('.op-popisek');
    await expect(popisek).toBeVisible();
    await expect(popisek).toHaveText(/\d{4} · /);
    const box = (await popisek.boundingBox())!;
    const okno = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(okno.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('.op-popisek')).toBeHidden();
});

test('popisek jde najet myší a zůstane, po odjetí zmizí', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const bod = page.locator('.op-radek a.op-bod').first();
  await bod.hover();
  const popisek = page.locator('.op-popisek');
  await expect(popisek).toBeVisible();
  const box = (await popisek.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  await page.waitForTimeout(400);
  await expect(popisek).toBeVisible();
  await page.mouse.move(box.x + box.width / 2, 400, { steps: 5 });
  await expect(popisek).toBeHidden();
});

test('body mají přístupný název s názvem pravidla a datem', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const bod = page.locator('.op-radek[data-slug="zakon-omega"] a.op-bod').first();
  await expect(bod).toHaveAttribute('aria-label', /^Testovací novela zákona Omega s dlouhým názvem pro mobil: \d+\. \d+\. 2026 · /);
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('není přepínač ani osa, seznam je vidět', async ({ page }) => {
    await page.goto('/pravidla/?pohled=osa');
    await expect(page.locator('.pr-pohled')).toBeHidden();
    await expect(page.locator('.osa-pravidel')).toBeHidden();
    await expect(page.locator('.pravidla-obal')).toBeVisible();
  });
});

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });
  test('osa se posouvá do strany, názvy zůstávají vlevo a je vidět dnes', async ({ page }) => {
    await page.goto('/pravidla/?pohled=osa');
    const plocha = page.locator('.op-plocha');
    expect(await plocha.evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true);
    await expect(page.locator('.op-dnes').first()).toBeInViewport();
    const nazev = page.locator('.op-radek .op-nazev').first();
    expect(await nazev.evaluate(e => getComputedStyle(e).position)).toBe('sticky');
    await overBezPosouvani(page);
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: osa se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/?pohled=osa');
    await expect(page.locator('.osa-pravidel')).toBeVisible();
    await overBezPosouvani(page);
    if (v.width > 1000) expect(await page.locator('.op-plocha').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  });
}
