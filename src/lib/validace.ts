import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import { kauzaSchema, type Kauza } from './schema';
import { rozdelOdstavce, poznamkyVOdstavci } from './souvislosti';

export type Chyba = { soubor: string; zprava: string };
export type KauzaZaznam = { slug: string; kauza: Kauza; telo: string };

export function overKauzu(soubor: string, data: unknown, telo: string, stitky: Set<string>): { kauza?: Kauza; chyby: Chyba[] } {
  const chyby: Chyba[] = [];
  const r = kauzaSchema.safeParse(data);
  if (!r.success) {
    for (const i of r.error.issues) chyby.push({ soubor, zprava: `${i.path.join('.') || 'kauza'}: ${i.message}` });
    return { chyby };
  }
  const k = r.data;
  for (const s of k.stitky) if (!stitky.has(s)) chyby.push({ soubor, zprava: `Neznámý štítek „${s}“ (doplňte ho do stitky.yml)` });
  const ids = new Set(k.zdroje.map(z => z.id));
  rozdelOdstavce(telo).forEach((o, i) => {
    const p = poznamkyVOdstavci(o);
    if (p.length === 0) chyby.push({ soubor, zprava: `Odstavec ${i + 1} souvislostí nemá poznámku se zdrojem [^n]` });
    for (const n of p) if (!ids.has(n)) chyby.push({ soubor, zprava: `Poznámka [^${n}] odkazuje na neexistující zdroj` });
  });
  return chyby.length ? { chyby } : { kauza: k, chyby };
}

export function nactiSlovnikStitku(adresar: string): Map<string, string> {
  const cesta = join(adresar, 'stitky.yml');
  if (!existsSync(cesta)) return new Map();
  const data = parseYaml(readFileSync(cesta, 'utf8')) ?? {};
  return new Map(Object.entries(data).map(([k, v]) => [k, String(v)]));
}

export function overAdresar(adresar: string): { zaznamy: KauzaZaznam[]; stitky: Map<string, string>; chyby: Chyba[] } {
  const stitky = nactiSlovnikStitku(adresar);
  const slozka = join(adresar, 'kauzy');
  const soubory = existsSync(slozka) ? readdirSync(slozka).filter(f => f.endsWith('.md')).sort() : [];
  const zaznamy: KauzaZaznam[] = [];
  const chyby: Chyba[] = [];
  for (const f of soubory) {
    const soubor = join(slozka, f);
    const slug = basename(f, '.md');
    if (!/^[a-z0-9-]+$/.test(slug)) { chyby.push({ soubor, zprava: 'Název souboru smí obsahovat jen malá písmena bez diakritiky, číslice a pomlčky' }); continue; }
    const { data, content } = matter(readFileSync(soubor, 'utf8'));
    const r = overKauzu(soubor, data, content, new Set(stitky.keys()));
    chyby.push(...r.chyby);
    if (r.kauza) zaznamy.push({ slug, kauza: r.kauza, telo: content });
  }
  zaznamy.sort((a, b) => a.kauza.od - b.kauza.od || a.kauza.nazev.localeCompare(b.kauza.nazev, 'cs'));
  return { zaznamy, stitky, chyby };
}
