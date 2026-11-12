import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import { kauzaSchema, kauzaSchemaKoncepty, akterSchema, akterSchemaKoncepty, type Kauza, type Akter } from './schema';
import { STRED } from './role';
import { rozdelOdstavce, poznamkyVOdstavci } from './souvislosti';

export type Chyba = { soubor: string; zprava: string };
export type KauzaZaznam = { slug: string; kauza: Kauza; telo: string };
/** koncepty: lokální náhled neověřených konceptů (smí chybět overeno). Nikdy pro veřejný web. */
export type Rezim = { koncepty?: boolean };

export function overKauzu(soubor: string, data: unknown, telo: string, stitky: Set<string>, rezim: Rezim = {}): { kauza?: Kauza; chyby: Chyba[] } {
  const chyby: Chyba[] = [];
  const r = (rezim.koncepty ? kauzaSchemaKoncepty : kauzaSchema).safeParse(data);
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

/** Slovník aktérů (akteri.yml): každý aktér projde schématem, nadřazení existují a vztahy netvoří kruh,
 *  takže od každého aktéra vede cesta ke středu mapy. */
export function overSlovnikAkteru(soubor: string, data: unknown, rezim: Rezim = {}): { akteri: Map<string, Akter>; chyby: Chyba[] } {
  const akteri = new Map<string, Akter>();
  const chyby: Chyba[] = [];
  if (data === null || data === undefined) return { akteri, chyby };
  if (typeof data !== 'object' || Array.isArray(data)) return { akteri, chyby: [{ soubor, zprava: 'Slovník aktérů musí být mapa „id: aktér“' }] };
  const schema = rezim.koncepty ? akterSchemaKoncepty : akterSchema;
  for (const [id, hodnota] of Object.entries(data)) {
    if (!/^[a-z0-9-]+$/.test(id)) { chyby.push({ soubor, zprava: `Id aktéra „${id}“ smí obsahovat jen malá písmena bez diakritiky, číslice a pomlčky` }); continue; }
    if (id === STRED.id) { chyby.push({ soubor, zprava: `Id „${STRED.id}“ je vyhrazené pro střed mapy` }); continue; }
    const r = schema.safeParse(hodnota);
    if (!r.success) { for (const i of r.error.issues) chyby.push({ soubor, zprava: `${id}.${i.path.join('.')}: ${i.message}` }); continue; }
    akteri.set(id, r.data);
  }
  for (const [id, a] of akteri) for (const v of a.vztahy)
    if (v.nadrazeny !== STRED.id && !akteri.has(v.nadrazeny)) chyby.push({ soubor, zprava: `${id}: vztah odkazuje na neexistujícího nadřazeného „${v.nadrazeny}“` });
  const stav = new Map<string, 'probiha' | 'hotovo'>();
  const projdi = (id: string, cesta: string[]): void => {
    if (!akteri.has(id) || stav.get(id) === 'hotovo') return;
    if (stav.get(id) === 'probiha') { chyby.push({ soubor, zprava: `Vztahy aktérů tvoří kruh: ${[...cesta.slice(cesta.indexOf(id)), id].join(' → ')}` }); return; }
    stav.set(id, 'probiha');
    for (const v of akteri.get(id)!.vztahy) projdi(v.nadrazeny, [...cesta, id]);
    stav.set(id, 'hotovo');
  };
  for (const id of akteri.keys()) projdi(id, []);
  return chyby.length ? { akteri: new Map(), chyby } : { akteri, chyby };
}

export function nactiSlovnikAkteru(adresar: string, rezim: Rezim = {}): { akteri: Map<string, Akter>; chyby: Chyba[] } {
  const soubor = join(adresar, 'akteri.yml');
  if (!existsSync(soubor)) return { akteri: new Map(), chyby: [] };
  return overSlovnikAkteru(soubor, parseYaml(readFileSync(soubor, 'utf8')), rezim);
}

/** Odkazy kauz na aktéry a jiné kauzy. Veřejný build (i CI) nevidí _koncepty/, a proto neexistující odkaz
 *  jen vynechá s varováním. Ověřená kauza tak nečeká na neověřenou. V režimu konceptů je to chyba (překlep). */
export function overVazby(adresar: string, zaznamy: KauzaZaznam[], akteri: Map<string, Akter>, rezim: Rezim = {}): { zaznamy: KauzaZaznam[]; chyby: Chyba[]; varovani: Chyba[] } {
  const chyby: Chyba[] = [];
  const varovani: Chyba[] = [];
  const slugy = new Set(zaznamy.map(z => z.slug));
  const nahlas = (soubor: string, zprava: string) => {
    if (rezim.koncepty) chyby.push({ soubor, zprava });
    else varovani.push({ soubor, zprava: `${zprava} (vazba se nezobrazí)` });
  };
  const vysledek = zaznamy.map(z => {
    const soubor = join(adresar, 'kauzy', `${z.slug}.md`);
    const akteriKauzy = z.kauza.akteri.filter(a => {
      if (akteri.has(a.id)) return true;
      nahlas(soubor, `Neznámý aktér „${a.id}“`);
      return false;
    });
    const navazuje = z.kauza.navazuje.filter(n => {
      if (n.kauza === z.slug) { chyby.push({ soubor, zprava: 'Kauza nemůže navazovat sama na sebe' }); return false; }
      if (slugy.has(n.kauza)) return true;
      nahlas(soubor, `Návaznost na neexistující kauzu „${n.kauza}“`);
      return false;
    });
    return { ...z, kauza: { ...z.kauza, akteri: akteriKauzy, navazuje } };
  });
  return { zaznamy: vysledek, chyby, varovani };
}

export function overAdresar(adresar: string, rezim: Rezim = {}): { zaznamy: KauzaZaznam[]; stitky: Map<string, string>; akteri: Map<string, Akter>; chyby: Chyba[]; varovani: Chyba[] } {
  const stitky = nactiSlovnikStitku(adresar);
  const slozka = join(adresar, 'kauzy');
  const soubory = existsSync(slozka) ? readdirSync(slozka).filter(f => f.endsWith('.md')).sort() : [];
  const nactene: KauzaZaznam[] = [];
  const chyby: Chyba[] = [];
  for (const f of soubory) {
    const soubor = join(slozka, f);
    const slug = basename(f, '.md');
    if (!/^[a-z0-9-]+$/.test(slug)) { chyby.push({ soubor, zprava: 'Název souboru smí obsahovat jen malá písmena bez diakritiky, číslice a pomlčky' }); continue; }
    const { data, content } = matter(readFileSync(soubor, 'utf8'));
    const r = overKauzu(soubor, data, content, new Set(stitky.keys()), rezim);
    chyby.push(...r.chyby);
    if (r.kauza) nactene.push({ slug, kauza: r.kauza, telo: content });
  }
  const slovnik = nactiSlovnikAkteru(adresar, rezim);
  chyby.push(...slovnik.chyby);
  const vazby = overVazby(adresar, nactene, slovnik.akteri, rezim);
  chyby.push(...vazby.chyby);
  const zaznamy = vazby.zaznamy;
  zaznamy.sort((a, b) => a.kauza.od - b.kauza.od || a.kauza.nazev.localeCompare(b.kauza.nazev, 'cs'));
  return { zaznamy, stitky, akteri: slovnik.akteri, chyby, varovani: vazby.varovani };
}
