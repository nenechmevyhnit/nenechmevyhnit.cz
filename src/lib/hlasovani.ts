import type { Hlas, PoslanecVHlasovani, Snimek, TypHlasovani } from './schema-hlasovani';
import type { PravidloZaznam } from './validace';
import { klub, NEZARAZENI } from './hlasovani-kluby';
import { sklonuj } from './cestina';

export const VETA_PROCEDURALNI = 'Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.';
export const popisekTypu = (t: TypHlasovani): string => (t === 'proceduralni' ? 'procedurální' : 'o obsahu');
export const popisekVysledku = (s: Pick<Snimek, 'vysledek'>): string => (s.vysledek === 'prijato' ? 'Přijato' : 'Zamítnuto');
export const nadpisHlasovani = (s: Pick<Snimek, 'cislo' | 'schuze'>): string => `Hlasování č. ${s.cislo}, ${s.schuze}. schůze Poslanecké sněmovny`;
export const cisloHlasovani = (id: string): string => id.slice(id.lastIndexOf('-') + 1);
export const odkazPsp = (s: Pick<Snimek, 'idPsp'>): string => `https://www.psp.cz/sqw/hlasy.sqw?g=${s.idPsp}`;

export type SouhrnKlubu = {
  zkratka: string | null; popisek: string; slug: string;
  celkem: number; pro: number; proti: number; zdrzelNehlasoval: number; omluven: number; neprihlasen: number;
};

/** Rozpis podle klubů: podle počtu poslanců v hlasování, při shodě podle názvu, nezařazení vždy na konci. */
export function souhrnKlubu(s: Snimek): SouhrnKlubu[] {
  const kluby = new Map<string | null, SouhrnKlubu>();
  for (const p of s.poslanci) {
    let k = kluby.get(p.klub);
    if (!k) {
      const info = klub(p.klub) ?? NEZARAZENI; // neznámou zkratku odmítne validace snímku
      k = { zkratka: p.klub, popisek: info.popisek, slug: info.slug, celkem: 0, pro: 0, proti: 0, zdrzelNehlasoval: 0, omluven: 0, neprihlasen: 0 };
      kluby.set(p.klub, k);
    }
    k.celkem++;
    if (p.hlas === 'pro') k.pro++;
    else if (p.hlas === 'proti') k.proti++;
    else if (p.hlas === 'omluven') k.omluven++;
    else if (p.hlas === 'neprihlasen') k.neprihlasen++;
    else k.zdrzelNehlasoval++;
  }
  return [...kluby.values()].sort((a, b) =>
    Number(a.zkratka === null) - Number(b.zkratka === null) || b.celkem - a.celkem || a.popisek.localeCompare(b.popisek, 'cs'));
}

/** Rozpis hlasů klubu pro čtečky obrazovky bez názvu klubu, např. „62 pro, 0 proti, 3 zdrželi se nebo nehlasovali, 1 omluven“.
 *  Odkaz klubu ho připojí skrytý za viditelný text, takže přístupný název začíná tím, co je vidět (WCAG 2.5.3). */
export function rozpisKlubu(k: SouhrnKlubu): string {
  const casti = [`${k.pro} pro`, `${k.proti} proti`];
  if (k.zdrzelNehlasoval) casti.push(sklonuj(k.zdrzelNehlasoval, ['zdržel se nebo nehlasoval', 'zdrželi se nebo nehlasovali', 'zdrželo se nebo nehlasovalo']));
  if (k.omluven) casti.push(sklonuj(k.omluven, ['omluven', 'omluveni', 'omluveno']));
  if (k.neprihlasen) casti.push(sklonuj(k.neprihlasen, ['nepřihlášen', 'nepřihlášeni', 'nepřihlášeno']));
  return casti.join(', ');
}

export const nepritomni = (s: Snimek): { omluven: number; neprihlasen: number } => ({
  omluven: s.poslanci.filter(p => p.hlas === 'omluven').length,
  neprihlasen: s.poslanci.filter(p => p.hlas === 'neprihlasen').length,
});

/** Skupiny seznamu poslanců v pevném pořadí. */
export const SKUPINY_HLASU: readonly { hlas: Hlas; nadpis: string }[] = [
  { hlas: 'pro', nadpis: 'Pro' },
  { hlas: 'proti', nadpis: 'Proti' },
  { hlas: 'zdrzel', nadpis: 'Zdržel se' },
  { hlas: 'nehlasoval', nadpis: 'Nehlasoval' },
  { hlas: 'zdrzel-nehlasoval', nadpis: 'Zdržel se nebo nehlasoval' },
  { hlas: 'omluven', nadpis: 'Omluven' },
  { hlas: 'neprihlasen', nadpis: 'Nepřihlášen' },
];

/** Poslanci rozdělení podle hlasu (pořadí uvnitř skupiny zachová ze snímku). Prázdné skupiny vynechá. */
export function skupinyPoslancu(poslanci: PoslanecVHlasovani[]): { hlas: Hlas; nadpis: string; poslanci: PoslanecVHlasovani[] }[] {
  return SKUPINY_HLASU.map(g => ({ ...g, poslanci: poslanci.filter(p => p.hlas === g.hlas) })).filter(g => g.poslanci.length > 0);
}

type OdkazNaHlasovani = { id: string; typ: TypHlasovani; co: string };
export type HlasovaniPravidla = OdkazNaHlasovani & { snimek: Snimek };

/** Hlasování pravidla od nejnovějšího (spec hlasování, oddíl 7). Odkaz bez snímku vynechá (veřejný build ho odmítne). */
export function hlasovaniPravidla(udalosti: { hlasovani: OdkazNaHlasovani[] }[], snimky: ReadonlyMap<string, Snimek>): HlasovaniPravidla[] {
  return udalosti
    .flatMap(u => u.hlasovani.flatMap(h => { const snimek = snimky.get(h.id); return snimek ? [{ ...h, snimek }] : []; }))
    .sort((a, b) => `${b.snimek.datum} ${b.snimek.cas}`.localeCompare(`${a.snimek.datum} ${a.snimek.cas}`) || b.snimek.cislo - a.snimek.cislo);
}

export type NavazanePravidlo = { slug: string; nazev: string; typ: TypHlasovani; co: string };

export function navazanaPravidla(pravidla: PravidloZaznam[], id: string): NavazanePravidlo[] {
  return pravidla.flatMap(z => z.pravidlo.udalosti.flatMap(u => u.hlasovani
    .filter(h => h.id === id)
    .map(h => ({ slug: z.slug, nazev: z.pravidlo.nazev, typ: h.typ, co: h.co }))));
}

/** Vybraný klub z kotvy adresy (#ano, bez ohledu na velikost písmen). Neznámá, prázdná nebo rozbitá kotva = všichni (''). */
export function vybranyKlub(hash: string, slugy: readonly string[]): string {
  let s: string;
  try { s = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase(); } catch { return ''; }
  return slugy.includes(s) ? s : '';
}
