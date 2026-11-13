import { normalizuj, slova } from './hledani';
import { stavPravidla, vProjednavani } from './pravidla-stavy';
import { duvodyPravidla } from './pravidla';
import { kategorieStavu, bezPripominek, type KategorieStavu } from './oblasti';
import { popisekZnaku, popisekDruhuZnaku, upozornovatel, type Duvod, type Oblast } from './pravidla-slovnik';
import type { PravidloZaznam } from './validace';

export type PolozkaPravidla = {
  slug: string; text: string; stitky: string[]; projednava: boolean; duvody: Duvod[];
  oblasti: Oblast[]; kategorie: KategorieStavu; bezPripominek: boolean;
};
export type FiltrPravidel = { text: string; stitky: string[]; jenProjednavane: boolean; duvody: Duvod[]; jenBezPripominek: boolean };

/** Data pro filtr v prohlížeči (vkládají se do stránky jako JSON). Hledá se i v názvech štítků („střet zájmů“)
 *  v popiscích znaků kontroly moci („zpětná účinnost“, „soudy“) a v upozorněních (text i jméno toho, kdo upozornil). */
export function vytvorPolozkuPravidla(z: PravidloZaznam, nazvyStitku: ReadonlyMap<string, string> = new Map()): PolozkaPravidla {
  const p = z.pravidlo;
  const text = [
    p.nazev, p.shrnuti, p.predkladatel, p.stitky.join(' '), ...p.stitky.map(s => nazvyStitku.get(s) ?? ''),
    p.prospech?.proc.text ?? '',
    p.proVas?.text ?? '',
    ...(p.prospech?.retezec.map(k => k.text) ?? []),
    ...(p.kontrolaMoci?.znaky.flatMap(zn => [zn.text, popisekZnaku(zn), popisekDruhuZnaku(zn.druh)]) ?? []),
    ...(p.kontrolaMoci?.upozorneni.flatMap(u => [u.text, upozornovatel(u.kdo).nazev]) ?? []),
  ].join(' ');
  const stav = stavPravidla(p.udalosti);
  return {
    slug: z.slug, text: normalizuj(text), stitky: p.stitky, projednava: vProjednavani(stav), duvody: duvodyPravidla(p),
    oblasti: p.oblasti ?? [], kategorie: kategorieStavu(stav), bezPripominek: bezPripominek(p.cesta),
  };
}

export function odpovidaPravidlo(p: PolozkaPravidla, f: FiltrPravidel): boolean {
  if (!slova(f.text).every(w => p.text.includes(w))) return false;
  if (f.stitky.length && !f.stitky.some(s => p.stitky.includes(s))) return false;
  if (f.duvody.length && !f.duvody.some(d => p.duvody.includes(d))) return false;
  if (f.jenProjednavane && !p.projednava) return false;
  if (f.jenBezPripominek && !p.bezPripominek) return false;
  return true;
}
