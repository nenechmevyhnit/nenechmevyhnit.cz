import { normalizuj } from './hledani';
import { stavPravidla, vProjednavani } from './pravidla-stavy';
import type { PravidloZaznam } from './validace';

export type PolozkaPravidla = { slug: string; text: string; stitky: string[]; projednava: boolean };
export type FiltrPravidel = { text: string; stitky: string[]; jenProjednavane: boolean };

/** Data pro filtr v prohlížeči (vkládají se do stránky jako JSON). */
export function vytvorPolozkuPravidla(z: PravidloZaznam): PolozkaPravidla {
  const p = z.pravidlo;
  const text = [p.nazev, p.shrnuti, p.predkladatel, p.stitky.join(' '), ...p.prospech.retezec.map(k => k.text)].join(' ');
  return { slug: z.slug, text: normalizuj(text), stitky: p.stitky, projednava: vProjednavani(stavPravidla(p.udalosti)) };
}

export function odpovidaPravidlo(p: PolozkaPravidla, f: FiltrPravidel): boolean {
  const hledany = normalizuj(f.text.trim());
  if (hledany && !p.text.includes(hledany)) return false;
  if (f.stitky.length && !f.stitky.some(s => p.stitky.includes(s))) return false;
  if (f.jenProjednavane && !p.projednava) return false;
  return true;
}
