import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { snimekSchema, nesouladySouctu, idSnimku, type Snimek } from './schema-hlasovani';
import { klub } from './hlasovani-kluby';
import type { Chyba, PravidloZaznam } from './validace';

/** Jeden snímek hlasování: schéma, název souboru, součty a kluby (spec hlasování, oddíl 6). */
export function overSnimek(soubor: string, data: unknown): { snimek?: Snimek; chyby: Chyba[] } {
  const r = snimekSchema.safeParse(data);
  if (!r.success) return { chyby: r.error.issues.map(i => ({ soubor, zprava: `${i.path.join('.') || 'hlasování'}: ${i.message}` })) };
  const s = r.data;
  const zpravy = new Set<string>();
  if (idSnimku(s) !== basename(soubor, '.yml')) zpravy.add(`Název souboru neodpovídá hlasování (${idSnimku(s)})`);
  for (const n of nesouladySouctu(s)) zpravy.add(`Součty nesedí: ${n}`);
  for (const p of s.poslanci) {
    if (p.klub === null) continue;
    if (!klub(p.klub)) zpravy.add(`Neznámý klub „${p.klub}“ (doplňte klub do src/lib/hlasovani-kluby.ts)`);
    else if (!Object.hasOwn(s.kluby, p.klub)) zpravy.add(`Klub „${p.klub}“ chybí v seznamu klubů hlasování`);
  }
  const chyby = [...zpravy].map(zprava => ({ soubor, zprava }));
  return chyby.length ? { chyby } : { snimek: s, chyby };
}

export function nactiSnimky(adresar: string): { snimky: Map<string, Snimek>; chyby: Chyba[] } {
  const slozka = join(adresar, 'hlasovani');
  const snimky = new Map<string, Snimek>();
  const chyby: Chyba[] = [];
  if (!existsSync(slozka)) return { snimky, chyby };
  for (const f of readdirSync(slozka).filter(f => f.endsWith('.yml')).sort()) {
    const soubor = join(slozka, f);
    let data: unknown;
    try { data = parseYaml(readFileSync(soubor, 'utf8')); } catch (e) {
      chyby.push({ soubor, zprava: `Snímek hlasování nejde přečíst: ${(e as Error).message}` });
      continue;
    }
    const r = overSnimek(soubor, data);
    chyby.push(...r.chyby);
    if (r.snimek) snimky.set(basename(f, '.yml'), r.snimek);
  }
  return { snimky, chyby };
}

/** Odkazy událostí pravidel na snímky (spec hlasování, oddíl 6). */
export function overHlasovaniPravidel(adresar: string, pravidla: PravidloZaznam[], snimky: Map<string, Snimek>): { chyby: Chyba[]; varovani: Chyba[]; odkazovane: Set<string> } {
  const chyby: Chyba[] = [];
  const varovani: Chyba[] = [];
  const odkazovane = new Set<string>();
  const typy = new Map<string, { typ: string; slug: string }>();
  for (const z of pravidla) {
    const soubor = join(adresar, 'pravidla', `${z.slug}.md`);
    for (const u of z.pravidlo.udalosti) for (const h of u.hlasovani) {
      odkazovane.add(h.id);
      const s = snimky.get(h.id);
      if (!s) {
        chyby.push({ soubor, zprava: `Hlasování „${h.id}“ nemá snímek v ${join(adresar, 'hlasovani')} (spusťte npm run hlasovani)` });
        continue;
      }
      if (s.datum.slice(0, u.datum.length) < u.datum) chyby.push({ soubor, zprava: `Hlasování „${h.id}“ (${s.datum}) je dřív než událost „${u.nazev}“ (${u.datum})` });
      const prvni = typy.get(h.id);
      if (!prvni) typy.set(h.id, { typ: h.typ, slug: z.slug });
      else if (prvni.typ !== h.typ) chyby.push({ soubor, zprava: `Hlasování „${h.id}“ má typ „${h.typ}“, ale pravidlo „${prvni.slug}“ mu dává „${prvni.typ}“` });
    }
  }
  for (const id of snimky.keys()) {
    if (!odkazovane.has(id)) varovani.push({ soubor: join(adresar, 'hlasovani', `${id}.yml`), zprava: 'Na hlasování neodkazuje žádné pravidlo (stránka se nevygeneruje)' });
  }
  return { chyby, varovani, odkazovane };
}
