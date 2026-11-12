import { overAdresar, type KauzaZaznam } from './validace';
import type { Akter } from './schema';
import { sestavGraf, type Graf } from './mapa';

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
export const nactiAktery = (): Map<string, Akter> => nacti().akteri;

const grafy = new WeakMap<object, Graf>();
export function nactiGraf(): Graf {
  const d = nacti();
  if (!grafy.has(d)) grafy.set(d, sestavGraf(d.zaznamy, d.akteri));
  return grafy.get(d)!;
}

/** Přepínač Osa | Mapa: ve veřejném buildu až s prvním ověřeným aktérem, v náhledu konceptů vždy. */
export const maMapu = (): boolean => nactiKauzy().length > 0 && (rezimKonceptu() || nactiAktery().size > 0);
