import { normalizuj, slova } from './hledani';
import { stavPravidla, vProjednavani } from './pravidla-stavy';
import { duvodyPravidla } from './pravidla';
import { popisekZnaku, popisekDruhuZnaku, type Duvod } from './pravidla-slovnik';
import type { PravidloZaznam } from './validace';

export type PolozkaPravidla = { slug: string; text: string; stitky: string[]; projednava: boolean; duvody: Duvod[] };
export type FiltrPravidel = { text: string; stitky: string[]; jenProjednavane: boolean; duvody: Duvod[] };

/** Data pro filtr v prohlížeči (vkládají se do stránky jako JSON). Hledá se i v názvech štítků („střet zájmů“)
 *  a v popiscích znaků kontroly moci („zpětná účinnost“, „soudy“). */
export function vytvorPolozkuPravidla(z: PravidloZaznam, nazvyStitku: ReadonlyMap<string, string> = new Map()): PolozkaPravidla {
  const p = z.pravidlo;
  const text = [
    p.nazev, p.shrnuti, p.predkladatel, p.stitky.join(' '), ...p.stitky.map(s => nazvyStitku.get(s) ?? ''),
    ...(p.prospech?.retezec.map(k => k.text) ?? []),
    ...(p.kontrolaMoci?.znaky.flatMap(zn => [zn.text, popisekZnaku(zn), popisekDruhuZnaku(zn.druh)]) ?? []),
  ].join(' ');
  return { slug: z.slug, text: normalizuj(text), stitky: p.stitky, projednava: vProjednavani(stavPravidla(p.udalosti)), duvody: duvodyPravidla(p) };
}

export function odpovidaPravidlo(p: PolozkaPravidla, f: FiltrPravidel): boolean {
  if (!slova(f.text).every(w => p.text.includes(w))) return false;
  if (f.stitky.length && !f.stitky.some(s => p.stitky.includes(s))) return false;
  if (f.duvody.length && !f.duvody.some(d => p.duvody.includes(d))) return false;
  if (f.jenProjednavane && !p.projednava) return false;
  return true;
}
