import { overAdresar, type KauzaZaznam } from './validace';

let mezipamet: ReturnType<typeof overAdresar> | undefined;

function nacti() {
  if (!mezipamet) {
    mezipamet = overAdresar(process.env.NV_OBSAH ?? 'obsah');
    if (mezipamet.chyby.length) {
      throw new Error('Chybný obsah:\n' + mezipamet.chyby.map(c => `  ${c.soubor}: ${c.zprava}`).join('\n'));
    }
  }
  return mezipamet;
}

export const nactiKauzy = (): KauzaZaznam[] => nacti().zaznamy;
export const nactiStitky = (): Map<string, string> => nacti().stitky;
