import { overAdresar, type KauzaZaznam } from './validace';

/** Lokální náhled neověřených konceptů (npm run koncepty). Veřejný build ho nikdy nezapíná. */
export const rezimKonceptu = (): boolean => process.env.NV_KONCEPTY === 'ano';

let mezipamet: ReturnType<typeof overAdresar> | undefined;

function nacti() {
  // ve vývoji se obsah čte pokaždé znovu, aby se úpravy kauz projevily bez restartu serveru
  if (!mezipamet || import.meta.env.DEV) {
    mezipamet = overAdresar(process.env.NV_OBSAH ?? 'obsah', { koncepty: rezimKonceptu() });
    if (mezipamet.chyby.length) {
      throw new Error('Chybný obsah:\n' + mezipamet.chyby.map(c => `  ${c.soubor}: ${c.zprava}`).join('\n'));
    }
  }
  return mezipamet;
}

export const nactiKauzy = (): KauzaZaznam[] => nacti().zaznamy;
export const nactiStitky = (): Map<string, string> => nacti().stitky;
