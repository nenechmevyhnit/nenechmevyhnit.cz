import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('přímá adresa otevře detail s vlastním náhledem', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const dlg = page.locator('dialog#detail');
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('#detail-nadpis')).toHaveText('Testovací kauza Alfa');
  // celý vzorec se vejde do 65 znaků, přípona „ — Posuďte sami“ už ne, a ta odpadá první
  await expect(page).toHaveTitle('Testovací kauza Alfa 2007–dosud: časová osa a zdroje');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://posudtesami.cz/kauzy/alfa-dotace/');
  await expect(page.locator('#graf')).toHaveAttribute('data-vybrano', 'alfa-dotace');
  await overBezPosouvani(page);
});

test('detail začíná záložkou Proč je to kauza s kritériem zařazení', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const tab = page.getByRole('tab').first();
  await expect(tab).toHaveText('Proč je to kauza');
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const panel = page.locator('.m2-panel[data-p="proc"]');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Fiktivní soud řeší, zda firma Alfa neměla na fiktivní dotaci pro malé podniky nárok.');
  const odkaz = panel.getByRole('link', { name: 'úřední řízení' });
  await expect(panel.locator('.kriterium')).toContainText('Zařazeno podle metodiky: úřední řízení');
  await expect(odkaz).toHaveAttribute('href', '/metodika/#kriteria');
  await panel.locator('a[data-zdroj="1"]').click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
});

test('odkaz na kritéria otevře v Metodice příslušnou část', async ({ page }) => {
  await page.goto('/metodika/#kriteria');
  const dlg = page.locator('.v4-dlg');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading', { level: 2 })).toHaveText('Co do archivu patří');
});

test('chronologie ukazuje poslední událost a listuje se', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Chronologie' }).click();
  const vid = page.locator('.udalosti-seznam > li:not([hidden])');
  await expect(vid).toHaveCount(1);
  await expect(vid.locator('h3')).toHaveText('Nepravomocné zproštění');
  await page.getByRole('button', { name: /předchozí/ }).click();
  await expect(vid.locator('h3')).toHaveText('Zpráva úřadu OLAF');
  await page.keyboard.press('ArrowRight');
  await expect(vid.locator('h3')).toHaveText('Nepravomocné zproštění');
  await page.locator('.mini-osa .bod').first().click();
  await expect(vid.locator('h3')).toHaveText('Vyčlenění firmy');
});

test('záložky a skok na zdroj', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await expect(page.locator('.m2-panel[data-p="souv"]')).toBeVisible();
  await page.locator('.m2-panel[data-p="souv"] a.pozn[data-zdroj="3"]').click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
  await expect(page.locator('#zdroj-3')).toHaveClass(/blik/);
  await expect(page).toHaveURL(/\/kauzy\/alfa-dotace\/$/);
});

test('zdroje: seznam se nepřelévá do strany a patička stojí pod ním', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: /Zdroje/ }).click();
  const seznam = page.locator('.m2-panel[data-p="zdroje"] ol.zdroje');
  const { sw, cw, oy } = await seznam.evaluate(e => ({ sw: e.scrollWidth, cw: e.clientWidth, oy: getComputedStyle(e).overflowY }));
  expect(sw).toBeLessThanOrEqual(cw + 1);
  expect(oy).toBe('auto');
  const paticka = page.locator('.m2-panel[data-p="zdroje"] .paticka-detailu');
  await expect(paticka.getByRole('link', { name: 'Nahlásit chybu' })).toBeInViewport();
  const s = (await seznam.boundingBox())!, p = (await paticka.boundingBox())!;
  expect(p.y).toBeGreaterThanOrEqual(s.y + s.height - 1);
});

test('filtr zdrojů ukáže jen vybranou skupinu, čísla zdrojů zůstanou a skok na zdroj filtr zruší', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: /Zdroje/ }).click();
  const filtr = page.getByRole('group', { name: 'Zobrazit zdroje' });
  await expect(filtr.getByRole('button')).toHaveText(['Vše 6', 'Soudy 1', 'Parlament 1', 'Úřady a registry 1', 'Média 2', 'Dotčená strana 1']);
  const viditelne = page.locator('ol.zdroje > li:visible');
  await filtr.getByRole('button', { name: /Média/ }).click();
  await expect(filtr.getByRole('button', { name: /Média/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(viditelne).toHaveCount(2);
  expect(await page.locator('#zdroj-3').evaluate(e => getComputedStyle(e, '::before').content)).toBe('"[3]"');
  await filtr.getByRole('button', { name: /Soudy/ }).click();
  await expect(viditelne).toHaveCount(1);
  await expect(page.locator('#zdroj-1')).toBeVisible();
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await page.locator('.m2-panel[data-p="souv"] a.pozn[data-zdroj="3"]').click();
  await expect(page.locator('#zdroj-3')).toBeVisible();
  await expect(filtr.getByRole('button', { name: /Vše/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(viditelne).toHaveCount(6);
});

test('stav a stanovisko', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Stav a stanovisko' }).click();
  await expect(page.locator('.stav-box .stav')).toHaveText('Soudní řízení');
  await expect(page.locator('.stav-box')).toContainText('Naposledy ověřeno 9. 11. 2026');
  await expect(page.locator('.stanovisko')).toContainText('Firma Alfa pochybení odmítá.');
});

test('presumpci neviny připomíná jen neuzavřená kauza v trestním řízení', async ({ page }) => {
  // obžaloba: trestní řízení, které pravomocně neskončilo
  await page.goto('/kauzy/zeta-stret/');
  await page.getByRole('tab', { name: 'Stav a stanovisko' }).click();
  await expect(page.locator('.stav-box')).toContainText('Dokud soud pravomocně nerozhodne, platí presumpce neviny.');
  // občanskoprávní spor a úřední zjištění o vině nerozhodují, i když kauza neskončila
  for (const slug of ['alfa-dotace', 'epsilon-fondy']) {
    await page.goto(`/kauzy/${slug}/`);
    await page.getByRole('tab', { name: 'Stav a stanovisko' }).click();
    await expect(page.locator('.stav-box .stav')).toBeVisible();
    await expect(page.locator('.stav-box')).not.toContainText('presumpce neviny');
  }
});

test('neexistující kauza vrátí stránku 404', async ({ page }) => {
  const odpoved = await page.goto('/kauzy/neexistuje/');
  expect(odpoved?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tahle stránka zapadla');
});

test('vyjádření dotčené strany je ve zdrojích označené jako stanovisko, ne jako primární zdroj', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: /^Zdroje/ }).click();
  await expect(page.locator('#zdroj-4 .druh')).toHaveText('stanovisko dotčené strany');
  await expect(page.locator('#zdroj-1 .druh')).toHaveText('primární');
  await expect(page.locator('#zdroj-2 .druh')).toHaveText('média');
});
