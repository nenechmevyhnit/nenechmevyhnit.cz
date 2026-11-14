import { normalizuj, slova } from './hledani';
import { stavPravidla, vProjednavani } from './pravidla-stavy';
import { duvodyPravidla } from './pravidla';
import { kategorieStavu, bezPripominek, type KategorieStavu } from './oblasti';
import { popisekZnaku, popisekDruhuZnaku, upozornovatel, type Duvod, type Oblast, type Cesta } from './pravidla-slovnik';
import type { Krok } from './pravidla-stavy';
import type { PravidloZaznam } from './validace';

export type PolozkaPravidla = {
  slug: string; nazev: string; text: string; stitky: string[]; projednava: boolean; duvody: Duvod[];
  oblasti: Oblast[]; kategorie: KategorieStavu; bezPripominek: boolean;
  cesta: Cesta; stav: Krok; prvni: string; posledni: string;
};
/** `cesta` a `stav` prázdné = bez omezení. */
export type FiltrPravidel = { text: string; stitky: string[]; jenProjednavane: boolean; duvody: Duvod[]; jenBezPripominek?: boolean; cesta?: Cesta | ''; stav?: Krok | '' };

/** Řazení přehledu; první je výchozí a odpovídá pořadí ze serveru (seraditPravidla). */
export const RAZENI_PRAVIDEL = [
  { id: 'aktivita', nazev: 'podle poslední události' },
  { id: 'novejsi', nazev: 'od nejnovější' },
  { id: 'starsi', nazev: 'od nejstarší' },
  { id: 'nazev', nazev: 'podle názvu' },
] as const;

export function seraditPolozkyPravidel(polozky: readonly PolozkaPravidla[], razeni: string): PolozkaPravidla[] {
  const r = [...polozky];
  const podleNazvu = (a: PolozkaPravidla, b: PolozkaPravidla) => a.nazev.localeCompare(b.nazev, 'cs');
  switch (razeni) {
    case 'novejsi': return r.sort((a, b) => b.prvni.localeCompare(a.prvni) || podleNazvu(a, b));
    case 'starsi': return r.sort((a, b) => a.prvni.localeCompare(b.prvni) || podleNazvu(a, b));
    case 'nazev': return r.sort(podleNazvu);
    default: return r.sort((a, b) => b.posledni.localeCompare(a.posledni) || podleNazvu(a, b));
  }
}

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
    slug: z.slug, nazev: p.nazev, text: normalizuj(text), stitky: p.stitky, projednava: vProjednavani(stav), duvody: duvodyPravidla(p),
    oblasti: p.oblasti ?? [], kategorie: kategorieStavu(stav), bezPripominek: bezPripominek(p.cesta),
    cesta: p.cesta, stav, prvni: p.udalosti[0].datum, posledni: p.udalosti[p.udalosti.length - 1].datum,
  };
}

export function odpovidaPravidlo(p: PolozkaPravidla, f: FiltrPravidel): boolean {
  if (!slova(f.text).every(w => p.text.includes(w))) return false;
  if (f.stitky.length && !f.stitky.some(s => p.stitky.includes(s))) return false;
  if (f.duvody.length && !f.duvody.some(d => p.duvody.includes(d))) return false;
  if (f.jenProjednavane && !p.projednava) return false;
  if (f.jenBezPripominek && !p.bezPripominek) return false;
  if (f.cesta && p.cesta !== f.cesta) return false;
  if (f.stav && p.stav !== f.stav) return false;
  return true;
}
