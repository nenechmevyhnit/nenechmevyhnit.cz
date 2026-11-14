import { existsSync, readdirSync } from 'node:fs';
import { basename } from 'node:path';
import { overAdresar, type KauzaZaznam, type PravidloZaznam } from './validace';
import type { Akter } from './schema';
import type { Snimek } from './schema-hlasovani';
import { sestavGraf, type Graf } from './mapa';
import { pravidlaKauzy, type SouvisejiciPravidlo } from './pravidla';
import { sestavOblasti, type OblastDetail } from './oblasti';

/** Lokální náhled neověřených konceptů (npm run koncepty). Veřejný build ho nikdy nezapíná. */
export const rezimKonceptu = (): boolean => process.env.NV_KONCEPTY === 'ano';

/** Náhled konceptů nevidí zveřejněné kauzy (leží v obsah/kauzy), pravidla v konceptech na ně ale odkazují. */
function slugyZverejnenychKauz(): string[] {
  const slozka = 'obsah/kauzy';
  return existsSync(slozka) ? readdirSync(slozka).filter(f => f.endsWith('.md')).map(f => basename(f, '.md')) : [];
}

let mezipamet: ReturnType<typeof overAdresar> | undefined;

function nacti() {
  // ve vývoji se obsah čte pokaždé znovu, aby se úpravy kauz projevily bez restartu serveru
  if (!mezipamet || import.meta.env.DEV) {
    const koncepty = rezimKonceptu();
    mezipamet = overAdresar(process.env.NV_OBSAH ?? 'obsah', { koncepty, znameKauzy: koncepty ? slugyZverejnenychKauz() : undefined });
    if (mezipamet.chyby.length) {
      throw new Error('Chybný obsah:\n' + mezipamet.chyby.map(c => `  ${c.soubor}: ${c.zprava}`).join('\n'));
    }
  }
  return mezipamet;
}

export const nactiKauzy = (): KauzaZaznam[] => nacti().zaznamy;
export const nactiStitky = (): Map<string, string> => nacti().stitky;
export const nactiAktery = (): Map<string, Akter> => nacti().akteri;
export const nactiPravidla = (): PravidloZaznam[] => nacti().pravidla;
/** Snímky hlasování, na které odkazuje aspoň jedno pravidlo (klíč je id hlasování, např. psp-10-34-311). */
export const nactiHlasovani = (): Map<string, Snimek> => nacti().hlasovani;
/** Oblasti se změnami pravidel pro pohled Oblasti a stránky /pravidla/oblasti/<id>/. */
export const nactiOblasti = (): OblastDetail[] => { const d = nacti(); return sestavOblasti(d.pravidla, d.oblasti); };
/** Stránka a položka menu „Zákony a nařízení“: ve veřejném buildu až s prvním ověřeným pravidlem, v náhledu konceptů vždy. */
export const maPravidla = (): boolean => rezimKonceptu() || nactiPravidla().length > 0;
export const souvisejiciPravidla = (slug: string): SouvisejiciPravidlo[] => pravidlaKauzy(nactiPravidla(), slug);

const grafy = new WeakMap<object, Graf>();
export function nactiGraf(): Graf {
  const d = nacti();
  if (!grafy.has(d)) grafy.set(d, sestavGraf(d.zaznamy, d.akteri));
  return grafy.get(d)!;
}

/** Přepínač Osa | Mapa: ve veřejném buildu až s prvním ověřeným aktérem, v náhledu konceptů vždy. */
export const maMapu = (): boolean => nactiKauzy().length > 0 && (rezimKonceptu() || nactiAktery().size > 0);
