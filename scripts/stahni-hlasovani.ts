import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { unzipSync } from 'fflate';
import {
  ChybaPsp, ROK_OBDOBI, bezDataStazeni, ctiUnl, dekodujUnl, idHlasovaniZPravidla, rozeberIdHlasovani,
  sestavSnimek, snimekNaYaml, type VstupPsp,
} from '../src/lib/psp-data';

/** Snímky hlasování z otevřených dat PSP pro všechna hlasování, na která odkazují události pravidel
 *  (spec hlasování, oddíl 5). Použití: npm run hlasovani -- [--znovu] [--obsah <adresář>] */
const OPENDATA = 'https://www.psp.cz/eknih/cdrom/opendata';
const argumenty = process.argv.slice(2);
const znovu = argumenty.includes('--znovu');
const iObsah = argumenty.indexOf('--obsah');
const adresar = iObsah >= 0 ? argumenty[iObsah + 1] : 'obsah';
if (!adresar || adresar.startsWith('--')) {
  console.error('Za --obsah chybí adresář obsahu.');
  process.exit(1);
}

// datum v UTC: kontrola obsahu v CI hlídá „stazeno“ (nesmí být v budoucnosti) podle UTC, místní datum by po půlnoci neprošlo
const dnes = new Date().toISOString().slice(0, 10);

async function stahniZip(soubor: string): Promise<Record<string, Uint8Array>> {
  const odpoved = await fetch(`${OPENDATA}/${soubor}`);
  if (!odpoved.ok) throw new Error(`Stažení ${soubor} selhalo: HTTP ${odpoved.status}`);
  return unzipSync(new Uint8Array(await odpoved.arrayBuffer()));
}

function tabulka(zip: Record<string, Uint8Array>, nazev: string): string[][] {
  const data = zip[nazev];
  if (!data) throw new Error(`V archivu chybí soubor ${nazev}`);
  return ctiUnl(dekodujUnl(data));
}

const slozkaPravidel = join(adresar, 'pravidla');
const slozkaHlasovani = join(adresar, 'hlasovani');
const ids = [...new Set((existsSync(slozkaPravidel) ? readdirSync(slozkaPravidel) : [])
  .filter(f => f.endsWith('.md'))
  .flatMap(f => idHlasovaniZPravidla(matter(readFileSync(join(slozkaPravidel, f), 'utf8')).data)))].sort();
const kZapsani = ids.filter(id => znovu || !existsSync(join(slozkaHlasovani, `${id}.yml`)));
if (kZapsani.length === 0) {
  console.log(`Všech ${ids.length} odkazovaných hlasování už má snímek v „${slozkaHlasovani}“.`);
  process.exit(0);
}

const poslanciZip = await stahniZip('poslanci.zip');
const spolecne = {
  osoby: tabulka(poslanciZip, 'osoby.unl'),
  poslanci: tabulka(poslanciZip, 'poslanec.unl'),
  organy: tabulka(poslanciZip, 'organy.unl'),
  zarazeni: tabulka(poslanciZip, 'zarazeni.unl'),
};
const vstupy = new Map<number, VstupPsp>();
mkdirSync(slozkaHlasovani, { recursive: true });
let chyb = 0;
for (const id of kZapsani) {
  try {
    const cil = rozeberIdHlasovani(id);
    const rok = ROK_OBDOBI[cil.obdobi];
    if (!rok) throw new ChybaPsp(`${id}: neznámý rok archivu pro ${cil.obdobi}. období (doplňte ROK_OBDOBI v src/lib/psp-data.ts)`);
    if (!vstupy.has(rok)) {
      const zip = await stahniZip(`hl-${rok}ps.zip`);
      vstupy.set(rok, {
        ...spolecne,
        hlasovani: tabulka(zip, `hl${rok}s.unl`),
        hlasy: tabulka(zip, `hl${rok}h1.unl`),
        omluvy: tabulka(zip, 'omluvy.unl'),
        zmatecne: tabulka(zip, 'zmatecne.unl'),
      });
    }
    const snimek = sestavSnimek(vstupy.get(rok)!, cil, dnes);
    const soubor = join(slozkaHlasovani, `${id}.yml`);
    const yaml = snimekNaYaml(snimek);
    if (existsSync(soubor) && bezDataStazeni(readFileSync(soubor, 'utf8')) === bezDataStazeni(yaml)) {
      console.log(`${id}: beze změny`);
      continue;
    }
    writeFileSync(soubor, yaml);
    console.log(`${id}: ${snimek.vysledek === 'prijato' ? 'přijato' : 'zamítnuto'} ${snimek.souhrn.pro} : ${snimek.souhrn.proti} → ${soubor}`);
  } catch (e) {
    if (!(e instanceof ChybaPsp)) throw e;
    chyb++;
    console.error(e.message);
  }
}
if (chyb) {
  console.error(`\n${chyb} z ${kZapsani.length} hlasování se nepodařilo zapsat.`);
  process.exit(1);
}
