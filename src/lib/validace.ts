import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import { kauzaSchema, kauzaSchemaKoncepty, akterSchema, akterSchemaKoncepty, type Kauza, type Akter } from './schema';
import { pravidloSchema, pravidloSchemaKoncepty, type Pravidlo } from './schema-pravidla';
import { oblastSchema, oblastSchemaKoncepty, type OblastData } from './schema-oblasti';
import { OBLASTI, type Oblast } from './pravidla-slovnik';
import { seraditPravidla } from './pravidla';
import { STRED } from './role';
import { rozdelOdstavce, poznamkyVOdstavci } from './souvislosti';

export type Chyba = { soubor: string; zprava: string };
export type KauzaZaznam = { slug: string; kauza: Kauza; telo: string };
export type PravidloZaznam = { slug: string; pravidlo: Pravidlo; telo: string };
export type OblastZaznam = { id: Oblast; data: OblastData };
/** koncepty: lokální náhled neověřených konceptů (smí chybět overeno). Nikdy pro veřejný web.
 *  znameKauzy: slugy kauz mimo načítaný adresář (náhled konceptů nevidí zveřejněné kauzy, pravidla na ně ale odkazují). */
export type Rezim = { koncepty?: boolean; znameKauzy?: Iterable<string> };

export function overKauzu(soubor: string, data: unknown, telo: string, stitky: Set<string>, rezim: Rezim = {}): { kauza?: Kauza; chyby: Chyba[] } {
  const chyby: Chyba[] = [];
  const r = (rezim.koncepty ? kauzaSchemaKoncepty : kauzaSchema).safeParse(data);
  if (!r.success) {
    for (const i of r.error.issues) chyby.push({ soubor, zprava: `${i.path.join('.') || 'kauza'}: ${i.message}` });
    return { chyby };
  }
  const k = r.data;
  for (const s of k.stitky) if (!stitky.has(s)) chyby.push({ soubor, zprava: `Neznámý štítek „${s}“ (doplňte ho do stitky.yml)` });
  chyby.push(...overSouvislosti(soubor, telo, new Set(k.zdroje.map(z => z.id))));
  return chyby.length ? { chyby } : { kauza: k, chyby };
}

function overSouvislosti(soubor: string, telo: string, ids: Set<number>): Chyba[] {
  const chyby: Chyba[] = [];
  rozdelOdstavce(telo).forEach((o, i) => {
    const p = poznamkyVOdstavci(o);
    if (p.length === 0) chyby.push({ soubor, zprava: `Odstavec ${i + 1} souvislostí nemá poznámku se zdrojem [^n]` });
    for (const n of p) if (!ids.has(n)) chyby.push({ soubor, zprava: `Poznámka [^${n}] odkazuje na neexistující zdroj` });
  });
  return chyby;
}

export function overPravidlo(soubor: string, data: unknown, telo: string, stitky: Set<string>, rezim: Rezim = {}): { pravidlo?: Pravidlo; chyby: Chyba[] } {
  const chyby: Chyba[] = [];
  const r = (rezim.koncepty ? pravidloSchemaKoncepty : pravidloSchema).safeParse(data);
  if (!r.success) {
    for (const i of r.error.issues) chyby.push({ soubor, zprava: `${i.path.join('.') || 'pravidlo'}: ${i.message}` });
    return { chyby };
  }
  const p = r.data;
  for (const s of p.stitky) if (!stitky.has(s)) chyby.push({ soubor, zprava: `Neznámý štítek „${s}“ (doplňte ho do stitky.yml)` });
  chyby.push(...overSouvislosti(soubor, telo, new Set(p.zdroje.map(z => z.id))));
  return chyby.length ? { chyby } : { pravidlo: p, chyby };
}

/** Vazby pravidel na kauzy. Stejně jako overVazby: veřejný build neexistující kauzu vynechá s varováním,
 *  v režimu konceptů je to chyba. Slug pravidla se nesmí shodovat se slugem kauzy. */
export function overVazbyPravidel(adresar: string, pravidla: PravidloZaznam[], slugyKauz: Set<string>, rezim: Rezim = {}): { pravidla: PravidloZaznam[]; chyby: Chyba[]; varovani: Chyba[] } {
  const chyby: Chyba[] = [];
  const varovani: Chyba[] = [];
  const zname = new Set([...slugyKauz, ...(rezim.znameKauzy ?? [])]);
  const vysledek = pravidla.map(z => {
    const soubor = join(adresar, 'pravidla', `${z.slug}.md`);
    if (zname.has(z.slug)) chyby.push({ soubor, zprava: `Slug „${z.slug}“ už používá kauza; pravidlo musí mít jiný název souboru` });
    if (z.slug === 'oblasti') chyby.push({ soubor, zprava: 'Slug „oblasti“ je vyhrazený pro stránky oblastí (/pravidla/oblasti/); pravidlo musí mít jiný název souboru' });
    const kauzy = z.pravidlo.kauzy.filter(k => {
      if (zname.has(k.kauza)) return true;
      const zprava = `Vazba na neexistující kauzu „${k.kauza}“`;
      if (rezim.koncepty) chyby.push({ soubor, zprava });
      else varovani.push({ soubor, zprava: `${zprava} (vazba se nezobrazí)` });
      return false;
    });
    return { ...z, pravidlo: { ...z.pravidlo, kauzy } };
  });
  return { pravidla: vysledek, chyby, varovani };
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

/** Soubory oblastí (specifikace oblastí, oddíl 7.2 a 7.3). Oblast s aspoň jednou změnou musí mít soubor s úvodem.
 *  Odkaz hodnocení na neexistující změnu veřejný build vynechá s varováním (změna může být zatím jen v konceptech),
 *  odkaz na změnu z jiné oblasti je vždy chyba. */
export function overOblasti(adresar: string, soubory: { slug: string; soubor: string; data: unknown }[], pravidla: PravidloZaznam[], rezim: Rezim = {}): { oblasti: OblastZaznam[]; chyby: Chyba[]; varovani: Chyba[] } {
  const chyby: Chyba[] = [];
  const varovani: Chyba[] = [];
  const nactene = new Map<Oblast, OblastData>();
  const schema = rezim.koncepty ? oblastSchemaKoncepty : oblastSchema;
  for (const s of soubory) {
    if (!(OBLASTI as readonly string[]).includes(s.slug)) { chyby.push({ soubor: s.soubor, zprava: `Neznámá oblast „${s.slug}“ (oblasti jsou ve slovníku src/lib/pravidla-slovnik.ts)` }); continue; }
    const r = schema.safeParse(s.data);
    if (!r.success) { for (const i of r.error.issues) chyby.push({ soubor: s.soubor, zprava: `${i.path.join('.') || 'oblast'}: ${i.message}` }); continue; }
    const id = s.slug as Oblast;
    const hodnoceni = r.data.hodnoceni.map((h, i) => ({
      ...h,
      pravidla: h.pravidla.filter((slug, j) => {
        const z = pravidla.find(p => p.slug === slug);
        const kde = `Hodnocení ${i + 1} („${h.kdo}“)`;
        if (h.pravidla.indexOf(slug) !== j) { chyby.push({ soubor: s.soubor, zprava: `${kde} uvádí změnu „${slug}“ dvakrát` }); return false; }
        if (!z) {
          const zprava = `${kde} odkazuje na neexistující změnu „${slug}“`;
          if (rezim.koncepty) chyby.push({ soubor: s.soubor, zprava });
          else varovani.push({ soubor: s.soubor, zprava: `${zprava} (odkaz se nezobrazí)` });
          return false;
        }
        if (!z.pravidlo.oblasti?.includes(id)) { chyby.push({ soubor: s.soubor, zprava: `${kde} odkazuje na změnu „${slug}“, která do oblasti nepatří` }); return false; }
        return true;
      }),
    }));
    nactene.set(id, { ...r.data, hodnoceni });
  }
  // Přechodné pravidlo (14. 11. 2026): oblasti a proVas mají všechny zveřejněné změny, nebo žádná. Dokud je
  // nemá žádná, pohled Oblasti se nezobrazí; jakmile je dostane jedna, musí je mít všechny (spec oblastí, 7.3).
  const zapnuto = pravidla.some(z => z.pravidlo.oblasti || z.pravidlo.proVas);
  if (!rezim.koncepty && !zapnuto && pravidla.length > 0)
    varovani.push({ soubor: join(adresar, 'pravidla'), zprava: 'Žádná změna zatím nemá oblasti ani text „Co by to znamenalo pro vás“, pohled Oblasti se nezobrazí' });
  for (const z of pravidla) {
    const soubor = join(adresar, 'pravidla', `${z.slug}.md`);
    if (rezim.koncepty) {
      if (!z.pravidlo.oblasti) varovani.push({ soubor, zprava: 'Změna zatím nemá oblasti (v pohledu Oblasti se nezobrazí)' });
      if (!z.pravidlo.proVas) varovani.push({ soubor, zprava: 'Změna zatím nemá text „Co by to znamenalo pro vás“' });
    } else if (zapnuto) {
      if (!z.pravidlo.oblasti) chyby.push({ soubor, zprava: 'Změna musí patřit aspoň do jedné oblasti (oblasti)' });
      if (!z.pravidlo.proVas) chyby.push({ soubor, zprava: 'Změna musí mít text „Co by to znamenalo pro vás“ (proVas)' });
    }
  }
  for (const id of OBLASTI) {
    if (nactene.has(id) || !pravidla.some(z => z.pravidlo.oblasti?.includes(id))) continue;
    const soubor = join(adresar, 'oblasti', `${id}.md`);
    const zprava = `Oblast „${id}“ má zveřejněné změny, ale chybí soubor ${soubor} s úvodem`;
    if (rezim.koncepty) varovani.push({ soubor, zprava });
    else chyby.push({ soubor, zprava });
  }
  return { oblasti: OBLASTI.filter(id => nactene.has(id)).map(id => ({ id, data: nactene.get(id)! })), chyby, varovani };
}

type SouborObsahu = { slug: string; soubor: string; data: unknown; content: string };

function nactiSlozku(adresar: string, nazev: string, chyby: Chyba[]): SouborObsahu[] {
  const slozka = join(adresar, nazev);
  const soubory = existsSync(slozka) ? readdirSync(slozka).filter(f => f.endsWith('.md')).sort() : [];
  const vysledek: SouborObsahu[] = [];
  for (const f of soubory) {
    const soubor = join(slozka, f);
    const slug = basename(f, '.md');
    if (!/^[a-z0-9-]+$/.test(slug)) { chyby.push({ soubor, zprava: 'Název souboru smí obsahovat jen malá písmena bez diakritiky, číslice a pomlčky' }); continue; }
    const { data, content } = matter(readFileSync(soubor, 'utf8'));
    vysledek.push({ slug, soubor, data, content });
  }
  return vysledek;
}

export function overAdresar(adresar: string, rezim: Rezim = {}): { zaznamy: KauzaZaznam[]; pravidla: PravidloZaznam[]; oblasti: OblastZaznam[]; stitky: Map<string, string>; akteri: Map<string, Akter>; chyby: Chyba[]; varovani: Chyba[] } {
  const stitky = nactiSlovnikStitku(adresar);
  const sadaStitku = new Set(stitky.keys());
  const chyby: Chyba[] = [];
  const nactene: KauzaZaznam[] = [];
  for (const s of nactiSlozku(adresar, 'kauzy', chyby)) {
    const r = overKauzu(s.soubor, s.data, s.content, sadaStitku, rezim);
    chyby.push(...r.chyby);
    if (r.kauza) nactene.push({ slug: s.slug, kauza: r.kauza, telo: s.content });
  }
  const slovnik = nactiSlovnikAkteru(adresar, rezim);
  chyby.push(...slovnik.chyby);
  const vazby = overVazby(adresar, nactene, slovnik.akteri, rezim);
  chyby.push(...vazby.chyby);
  const zaznamy = vazby.zaznamy;
  zaznamy.sort((a, b) => a.kauza.od - b.kauza.od || a.kauza.nazev.localeCompare(b.kauza.nazev, 'cs'));

  const nactenaPravidla: PravidloZaznam[] = [];
  for (const s of nactiSlozku(adresar, 'pravidla', chyby)) {
    const r = overPravidlo(s.soubor, s.data, s.content, sadaStitku, rezim);
    chyby.push(...r.chyby);
    if (r.pravidlo) nactenaPravidla.push({ slug: s.slug, pravidlo: r.pravidlo, telo: s.content });
  }
  const vazbyPravidel = overVazbyPravidel(adresar, nactenaPravidla, new Set(zaznamy.map(z => z.slug)), rezim);
  chyby.push(...vazbyPravidel.chyby);
  const ob = overOblasti(adresar, nactiSlozku(adresar, 'oblasti', chyby), vazbyPravidel.pravidla, rezim);
  chyby.push(...ob.chyby);

  return {
    zaznamy,
    pravidla: seraditPravidla(vazbyPravidel.pravidla),
    oblasti: ob.oblasti,
    stitky,
    akteri: slovnik.akteri,
    chyby,
    varovani: [...vazby.varovani, ...vazbyPravidel.varovani, ...ob.varovani],
  };
}
