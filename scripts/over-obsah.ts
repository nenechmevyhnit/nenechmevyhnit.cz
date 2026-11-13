import { overAdresar } from '../src/lib/validace';
import { sklonuj } from '../src/lib/cestina';

const adresar = process.env.NV_OBSAH ?? 'obsah';
const { zaznamy, pravidla, chyby, varovani } = overAdresar(adresar);
if (chyby.length) {
  console.error(`\nObsah v „${adresar}“ má ${sklonuj(chyby.length, ['chybu', 'chyby', 'chyb'])}:\n`);
  for (const c of chyby) console.error(`  ${c.soubor}: ${c.zprava}`);
  console.error('\nWeb se nesestaví, dokud chyby neopravíte.\n');
  process.exit(1);
}
for (const v of varovani) console.warn(`  Varování: ${v.soubor}: ${v.zprava}`);
console.log(`Obsah v pořádku: ${sklonuj(zaznamy.length, ['kauza', 'kauzy', 'kauz'])} a ${sklonuj(pravidla.length, ['pravidlo', 'pravidla', 'pravidel'])} v „${adresar}“.`);
