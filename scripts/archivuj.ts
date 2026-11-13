import { readFileSync, writeFileSync } from 'node:fs';
import { overAdresar } from '../src/lib/validace';
import { doplnArchiv, ziskejArchiv } from '../src/lib/archiv';

const adresar = process.env.NV_OBSAH ?? 'obsah';
const { zaznamy, pravidla, chyby } = overAdresar(adresar);
if (chyby.length) { console.error('Obsah má chyby, archivace se přeskočí.'); process.exit(1); }
const soubory = [
  ...zaznamy.map(z => ({ soubor: `${adresar}/kauzy/${z.slug}.md`, zdroje: z.kauza.zdroje })),
  ...pravidla.map(z => ({ soubor: `${adresar}/pravidla/${z.slug}.md`, zdroje: z.pravidlo.zdroje })),
];
let doplneno = 0;
for (const { soubor, zdroje } of soubory) {
  let text = readFileSync(soubor, 'utf8');
  for (const zdroj of zdroje.filter(x => !x.archiv)) {
    const archiv = await ziskejArchiv(zdroj.url);
    if (archiv) { text = doplnArchiv(text, zdroj.url, archiv); doplneno++; }
    await new Promise(r => setTimeout(r, 5000)); // šetrně k Wayback Machine
  }
  writeFileSync(soubor, text);
}
console.log(`Doplněno archivních kopií: ${doplneno}`);
