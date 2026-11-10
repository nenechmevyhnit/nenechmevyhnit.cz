import { test, expect } from '@playwright/test';
import { VELIKOSTI } from './pomocne';

// Delší texty v modalu nesmí být oříznuté: buď se vejdou, nebo pokračují ve sloupcích do strany.
for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: v žádné záložce detailu není oříznutý obsah`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/kauzy/zeta-stret/');
    for (const zalozka of ['Chronologie', 'Souvislosti', 'Stav a stanovisko', /^Zdroje/]) {
      await page.getByRole('tab', { name: zalozka }).click();
      const presah = await page.evaluate(() => {
        const panel = document.querySelector<HTMLElement>('#detail .m2-panel:not([hidden])')!;
        const spodek = panel.getBoundingClientRect().bottom;
        let max = 0;
        for (const el of panel.querySelectorAll<HTMLElement>('*')) {
          if (!el.getClientRects().length || el.closest('[hidden]')) continue;
          for (const r of el.getClientRects()) max = Math.max(max, r.bottom - spodek);
        }
        return Math.round(max);
      });
      expect(presah, `záložka ${zalozka}: obsah přesahuje spodek panelu o ${presah} px`).toBeLessThanOrEqual(1);
    }
    await page.getByRole('tab', { name: 'Stav a stanovisko' }).click();
    await expect(page.locator('.opravy')).toContainText('Fiktivní oprava');
  });
}
