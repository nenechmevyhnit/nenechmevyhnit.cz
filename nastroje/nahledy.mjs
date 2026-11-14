// Náhledové obrázky kauz pro sdílení na sítích (1200 × 630).
// Renderuje Chromium z Playwrightu, který už je v devDependencies — kvůli náhledům
// nepřidáváme žádnou závislost. Satori by nešel: v repozitáři jsou jen woff2 fonty.
// Spuštění: npm run nahledy. Výstup se commituje, nasazení nic negeneruje.
//
// Stránka se neservíruje přes setContent, ale na vlastním fiktivním originu: v about:blank
// by se relativní adresa /fonty/… nerozlišila a náhledy by vyšly v náhradním písmu.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { nactiKauzy } from '../src/lib/kauzy.ts';
import { WEB } from '../src/lib/web.ts';
import { rozsahText, datumText } from '../src/lib/casova-osa.ts';
import { sklonuj } from '../src/lib/cestina.ts';

const SIRKA = 1200;
const VYSKA = 630;
const VYSTUP = 'public/obrazky/nahledy';
const ORIGIN = 'http://nahled.test';

const escapuj = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const stranka = (kauza) => `<!doctype html>
<html lang="cs"><head><meta charset="utf-8">
<link rel="stylesheet" href="/styly/fonty.css">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: ${SIRKA}px; height: ${VYSKA}px; padding: 72px; background: #FBF9F4; color: #16130F;
         font-family: "Redaction 10", Georgia, serif; display: flex; flex-direction: column; justify-content: space-between; }
  .nad { font: 600 22px ui-monospace, monospace; color: #DB1F2D; letter-spacing: .06em; text-transform: uppercase; }
  h1 { font-family: "Redaction 50", Georgia, serif; font-weight: 700; font-size: 82px; line-height: 1.02; letter-spacing: -0.02em; }
  .roky { font-size: 30px; color: #5B544B; margin-top: 20px; }
  .pata { display: flex; justify-content: space-between; align-items: baseline; font-size: 26px; color: #5B544B; }
  .pata strong { font-family: "Redaction 35", Georgia, serif; font-size: 32px; color: #16130F; }
</style></head>
<body>
  <p class="nad">Archiv kauz Andreje Babiše</p>
  <div>
    <h1>${escapuj(kauza.nazev)}</h1>
    <p class="roky">${escapuj(rozsahText(kauza.od, kauza.do))}</p>
  </div>
  <p class="pata"><strong>${escapuj(WEB.nazev)}</strong><span>${escapuj(sklonuj(kauza.zdroje.length, ['zdroj', 'zdroje', 'zdrojů']))} · ověřeno ${escapuj(kauza.overeno ? datumText(kauza.overeno) : '—')}</span></p>
</body></html>`;

const prohlizec = await chromium.launch();
const list = await prohlizec.newPage({ viewport: { width: SIRKA, height: VYSKA }, deviceScaleFactor: 1 });

let html = '';
await list.route(`${ORIGIN}/**`, (route) => {
  const { pathname } = new URL(route.request().url());
  if (pathname === '/') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
  // fonty.css leží v src/styles, písma v public/fonty
  if (pathname === '/styly/fonty.css') return route.fulfill({ path: 'src/styles/fonty.css', contentType: 'text/css' });
  return route.fulfill({ path: 'public' + pathname });
});

mkdirSync(VYSTUP, { recursive: true });

for (const { slug, kauza } of nactiKauzy()) {
  html = stranka(kauza);
  await list.goto(`${ORIGIN}/`, { waitUntil: 'load' });
  await list.evaluate(() => document.fonts.ready);
  writeFileSync(`${VYSTUP}/${slug}.png`, await list.screenshot({ type: 'png' }));
  console.log(`${VYSTUP}/${slug}.png`);
}

await prohlizec.close();
