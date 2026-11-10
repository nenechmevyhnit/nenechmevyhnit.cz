import { readFileSync, writeFileSync } from 'node:fs';
import { overAdresar } from '../src/lib/validace';
import { doplnArchiv, ziskejArchiv } from '../src/lib/archiv';

const adresar = process.env.NV_OBSAH ?? 'obsah';
const { zaznamy, chyby } = overAdresar(adresar);
if (chyby.length) { console.error('Obsah má chyby, archivace se přeskočí.'); process.exit(1); }
let doplneno = 0;
for (const z of zaznamy) {
  const soubor = `${adresar}/kauzy/${z.slug}.md`;
  let text = readFileSync(soubor, 'utf8');
  for (const zdroj of z.kauza.zdroje.filter(x => !x.archiv)) {
    const archiv = await ziskejArchiv(zdroj.url);
    if (archiv) { text = doplnArchiv(text, zdroj.url, archiv); doplneno++; }
    await new Promise(r => setTimeout(r, 5000)); // šetrně k Wayback Machine
  }
  writeFileSync(soubor, text);
}
console.log(`Doplněno archivních kopií: ${doplneno}`);
