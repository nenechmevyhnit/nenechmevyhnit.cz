// Vygeneruje public/obrazky/nahled.png (1200×630) pro náhled při sdílení odkazu.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Písma vložíme jako data: URL, stránka ze setContent nesmí číst soubory z disku.
const fonty = readFileSync('src/styles/fonty.css', 'utf8').replace(/url\(\/fonty\/([^)]+)\)/g, (_, f) => `url(data:font/woff2;base64,${readFileSync('public/fonty/' + f).toString('base64')})`);
const html = `<!doctype html><html lang="cs"><head><meta charset="utf-8"><style>${fonty}
body{margin:0;width:1200px;height:630px;background:#F5F5F8;font-family:"Redaction 10",Georgia,serif;color:#16153A;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;border-top:14px solid #DB1F2D}
.nad{font:600 26px "JetBrains Mono",monospace;color:#DB1F2D;letter-spacing:.06em;text-transform:uppercase}
h1{font-size:96px;line-height:1;margin:18px 0 22px}
p{font-size:34px;color:#33325A;margin:0;max-width:880px}
.pruhy{margin-top:42px;display:grid;gap:12px;width:620px}.pruhy i{display:block;height:14px;background:#282661;border-radius:2px}
</style></head><body><div class="nad">Archiv kauz Andreje Babiše</div><h1>Posuďte sami</h1><p>Kauzy přehledně, s daty a zdroji.</p>
<div class="pruhy"><i style="width:85%"></i><i style="width:45%;margin-left:55%"></i><i style="width:25%;margin-left:70%"></i></div></body></html>`;
const prohlizec = await chromium.launch();
const stranka = await prohlizec.newPage({ viewport: { width: 1200, height: 630 } });
await stranka.setContent(html, { waitUntil: 'networkidle' });
await stranka.evaluate(() => document.fonts.ready);
await stranka.screenshot({ path: 'public/obrazky/nahled.png' });
await prohlizec.close();
console.log('Hotovo: public/obrazky/nahled.png');
