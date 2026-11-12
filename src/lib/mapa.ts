import type { KauzaZaznam } from './validace';
import type { Akter } from './schema';
import { STRED, popisekRole } from './role';
import { rozsahText } from './casova-osa';

export type OdkazZdroje = { vydavatel: string; titulek: string; datum: string; url: string };
export type TypUzlu = 'stred' | 'akter' | 'kauza';
/** hloubka: u aktéra nejdelší cesta ke středu, u středu a kauz 0 */
export type Uzel = { id: string; typ: TypUzlu; nazev: string; hloubka: number; slug?: string; od?: number; roky?: string };
export type DruhHrany = 'vztah' | 'akter' | 'stred' | 'navaznost';
/** U návaznosti je rodic kauza, na kterou se navazuje, a potomek navazující kauza.
 *  hlavni: hrana hlavního stromu, který určuje polohu uzlu (vedlejší hrany se jen kreslí). */
export type Hrana = {
  id: string; druh: DruhHrany; rodic: string; potomek: string; hlavni: boolean;
  roleText: string | null; obdobi: string | null; popis: string | null; zdroje: OdkazZdroje[];
};
export type Graf = { uzly: Uzel[]; hrany: Hrana[]; deti: Record<string, string[]> };

export const idAktera = (id: string): string => `a:${id}`;
export const idKauzy = (slug: string): string => `k:${slug}`;

const odkaz = (z: OdkazZdroje): OdkazZdroje => ({ vydavatel: z.vydavatel, titulek: z.titulek, datum: z.datum, url: z.url });

export function sestavGraf(zaznamy: KauzaZaznam[], akteri: Map<string, Akter>): Graf {
  // validace zaručuje, že nadřazení existují a vztahy netvoří kruh
  const hloubky = new Map<string, number>();
  const hloubka = (id: string): number => {
    if (id === STRED.id) return 0;
    if (!hloubky.has(id)) hloubky.set(id, 1 + Math.max(...akteri.get(id)!.vztahy.map(v => hloubka(v.nadrazeny))));
    return hloubky.get(id)!;
  };
  const uzelRodice = (id: string) => (id === STRED.id ? STRED.id : idAktera(id));

  // na mapu patří jen aktéři, kteří vedou ke kauze (přímo nebo přes podřízené aktéry)
  const pouziti = new Set<string>();
  const oznac = (id: string): void => {
    if (id === STRED.id || pouziti.has(id)) return;
    pouziti.add(id);
    akteri.get(id)!.vztahy.forEach(v => oznac(v.nadrazeny));
  };
  zaznamy.forEach(z => z.kauza.akteri.forEach(a => oznac(a.id)));

  const uzly: Uzel[] = [{ id: STRED.id, typ: 'stred', nazev: STRED.nazev, hloubka: 0 }];
  const hrany: Hrana[] = [];
  const pridej = (h: Omit<Hrana, 'id'>) => { hrany.push({ id: `h${hrany.length}`, ...h }); };
  const hlavniRodic = new Map<string, string>();

  for (const id of [...pouziti].sort()) {
    const a = akteri.get(id)!;
    uzly.push({ id: idAktera(id), typ: 'akter', nazev: a.nazev, hloubka: hloubka(id) });
    // hlavní rodič: nejhlubší nadřazený, při shodě ten s nejnovějším vztahem (aktuální stav)
    const hlavni = a.vztahy.reduce((m, v) => {
      const dv = hloubka(v.nadrazeny), dm = hloubka(m.nadrazeny);
      return dv > dm || (dv === dm && v.od > m.od) ? v : m;
    });
    hlavniRodic.set(idAktera(id), uzelRodice(hlavni.nadrazeny));
    for (const v of a.vztahy) pridej({
      druh: 'vztah', rodic: uzelRodice(v.nadrazeny), potomek: idAktera(id), hlavni: v === hlavni,
      roleText: popisekRole(v.role), obdobi: rozsahText(v.od, v.do), popis: v.popis, zdroje: v.zdroje.map(odkaz),
    });
  }

  const slugy = new Set(zaznamy.map(z => z.slug));
  for (const { slug, kauza: k } of zaznamy) {
    const uzel = idKauzy(slug);
    const zdroje = (ids: number[]) => ids.map(i => odkaz(k.zdroje.find(z => z.id === i)!));
    uzly.push({ id: uzel, typ: 'kauza', nazev: k.nazev, hloubka: 0, slug, od: k.od, roky: rozsahText(k.od, k.do) });
    if (k.akteri.length === 0) {
      hlavniRodic.set(uzel, STRED.id);
      pridej({ druh: 'stred', rodic: STRED.id, potomek: uzel, hlavni: true, roleText: null, obdobi: null, popis: null, zdroje: [] });
    }
    k.akteri.forEach((a, i) => {
      if (i === 0) hlavniRodic.set(uzel, idAktera(a.id));
      pridej({ druh: 'akter', rodic: idAktera(a.id), potomek: uzel, hlavni: i === 0, roleText: popisekRole(a.role), obdobi: null, popis: a.popis, zdroje: zdroje(a.zdroje) });
    });
  }
  for (const { slug, kauza: k } of zaznamy) for (const n of k.navazuje) {
    if (!slugy.has(n.kauza)) continue;
    pridej({
      druh: 'navaznost', rodic: idKauzy(n.kauza), potomek: idKauzy(slug), hlavni: false,
      roleText: popisekRole(n.role), obdobi: null, popis: n.popis, zdroje: n.zdroje.map(i => odkaz(k.zdroje.find(z => z.id === i)!)),
    });
  }

  // pořadí v hlavním stromu: aktéři podle nejstarší kauzy pod nimi, pak kauzy podle začátku
  const deti: Record<string, string[]> = {};
  for (const [u, r] of hlavniRodic) (deti[r] ??= []).push(u);
  const podle = new Map(uzly.map(u => [u.id, u]));
  const nejstarsi = new Map<string, number>();
  const prvniRok = (id: string): number => {
    const u = podle.get(id)!;
    if (u.typ === 'kauza') return u.od!;
    if (!nejstarsi.has(id)) nejstarsi.set(id, Math.min(Infinity, ...(deti[id] ?? []).map(prvniRok)));
    return nejstarsi.get(id)!;
  };
  const klic = (id: string) => { const u = podle.get(id)!; return [u.typ === 'kauza' ? 1 : 0, prvniRok(id), u.nazev] as const; };
  for (const seznam of Object.values(deti)) seznam.sort((a, b) => {
    const x = klic(a), y = klic(b);
    return x[0] - y[0] || (x[1] === y[1] ? 0 : x[1] < y[1] ? -1 : 1) || x[2].localeCompare(y[2], 'cs');
  });
  return { uzly, hrany, deti };
}

/** Uzly, které zůstanou vidět, když je vidět jen daná množina kauz (null = všechny).
 *  Aktér zůstane, jen když pod ním (přes jakoukoli hranu) zbyde kauza. Střed je vidět vždy. */
export function viditelneUzly(graf: Graf, viditelne: Iterable<string> | null): Set<string> {
  const kauzy = viditelne === null ? null : new Set([...viditelne].map(idKauzy));
  const rodice = new Map<string, string[]>();
  for (const h of graf.hrany) if (h.druh !== 'navaznost') {
    if (!rodice.has(h.potomek)) rodice.set(h.potomek, []);
    rodice.get(h.potomek)!.push(h.rodic);
  }
  const vysledek = new Set<string>([STRED.id]);
  const oznac = (id: string): void => {
    if (vysledek.has(id)) return;
    vysledek.add(id);
    (rodice.get(id) ?? []).forEach(oznac);
  };
  for (const u of graf.uzly) if (u.typ === 'kauza' && (kauzy === null || kauzy.has(u.id))) oznac(u.id);
  return vysledek;
}

/** Role a období se na mapě nepíšou (u uzlu s mnoha vazbami by se popisky překrývaly), ukazuje je karta
 *  vazeb (kartaUzlu, kartaHrany), proto stačí nízké řádky. Šířky sloupců se počítají z nejdelšího názvu
 *  (min* jsou spodní meze), aby mapa nebyla zbytečně široká. kmen: odsazení svislé čáry od rodiče. */
export const ROZMERY = {
  radek: 30, okraj: 16, vyskaUzlu: 20, mezera: 32, kmen: 14, oblouky: 130,
  minStred: 90, minAkter: 80, minKauza: 160, odsazeniTextu: 8,
} as const;
export type UmisteniUzlu = { id: string; typ: TypUzlu; nazev: string; x: number; y: number; w: number };
/** hlavni: čára hlavního stromu (lomená, plná); vedlejší vazby a návaznosti se kreslí obloukem a slaběji.
 *  dz: dráha pro klepnutí a najetí (u lomené čáry jen vodorovný úsek k potomkovi, kmen sdílí víc čar). */
export type Cara = { id: string; druh: DruhHrany; hlavni: boolean; d: string; dz: string };
export type Rozlozeni = { sirka: number; vyska: number; uzly: UmisteniUzlu[]; cary: Cara[] };

/** Odhad šířky názvu v px (písmo 13 px). Bez DOM, aby rozložení šlo spočítat při buildu i v prohlížeči;
 *  raději o kus víc než méně. */
export function sirkaNazvu(nazev: string, tucne = false): number {
  let w = 0;
  for (const z of nazev) w += z === ' ' ? 3.6 : z !== z.toLowerCase() ? 10 : 6.6;
  return Math.ceil(w * (tucne ? 1.08 : 1));
}

/** Vrstvy zleva doprava: střed → aktéři podle hloubky → sloupec kauz. Rodič stojí na řádku svého
 *  prvního potomka (strom se čte shora jako osnova, Babiš je vlevo nahoře), y uzlu je střed řádku. */
export function rozlozMapu(graf: Graf, viditelne: Iterable<string> | null): Rozlozeni {
  const R = ROZMERY;
  const vid = viditelneUzly(graf, viditelne);
  if (vid.size === 1) return { sirka: 0, vyska: 0, uzly: [], cary: [] };
  const podle = new Map(graf.uzly.map(u => [u.id, u]));
  const viditelneUzlyGrafu = graf.uzly.filter(u => vid.has(u.id));
  const maxHloubka = Math.max(0, ...viditelneUzlyGrafu.filter(u => u.typ === 'akter').map(u => u.hloubka));
  const pad = 2 * R.odsazeniTextu + 4;
  const sirkaSloupce = (min: number, uzly: Uzel[], tucne = false) => Math.max(min, ...uzly.map(u => sirkaNazvu(u.nazev, tucne) + pad));
  const sirky = [sirkaSloupce(R.minStred, viditelneUzlyGrafu.filter(u => u.typ === 'stred'), true)];
  for (let h = 1; h <= maxHloubka; h++) sirky.push(sirkaSloupce(R.minAkter, viditelneUzlyGrafu.filter(u => u.typ === 'akter' && u.hloubka === h)));
  const sirkaKauz = sirkaSloupce(R.minKauza, viditelneUzlyGrafu.filter(u => u.typ === 'kauza'));
  const sloupecX: number[] = [R.okraj];
  for (let h = 1; h <= maxHloubka; h++) sloupecX.push(sloupecX[h - 1] + sirky[h - 1] + R.mezera);
  const kauzyX = sloupecX[maxHloubka] + sirky[maxHloubka] + R.mezera;

  // každý list (kauza nebo aktér bez viditelných dětí) dostane řádek, rodič stojí na řádku prvního listu
  const prvni = new Map<string, number>();
  let radek = 0;
  const projdi = (id: string): void => {
    prvni.set(id, radek);
    const deti = (graf.deti[id] ?? []).filter(d => vid.has(d));
    if (deti.length === 0) { radek++; return; }
    deti.forEach(projdi);
  };
  projdi(STRED.id);

  const uzly: UmisteniUzlu[] = [...prvni].map(([id, r]) => {
    const u = podle.get(id)!;
    const x = u.typ === 'kauza' ? kauzyX : sloupecX[u.typ === 'stred' ? 0 : u.hloubka];
    const w = u.typ === 'kauza' ? sirkaKauz : sirky[u.typ === 'stred' ? 0 : u.hloubka];
    return { id, typ: u.typ, nazev: u.nazev, x, y: R.okraj + (r + 0.5) * R.radek, w };
  });
  const misto = new Map(uzly.map(u => [u.id, u]));
  const cary: Cara[] = [];
  const soubezne = new Map<string, number>(); // víc vedlejších vazeb mezi týmiž uzly: každá další čára o kus níž
  for (const h of graf.hrany) {
    const a = misto.get(h.rodic), b = misto.get(h.potomek);
    if (!a || !b) continue;
    if (h.druh === 'navaznost') {
      // vzdálenější kauzy mají širší oblouk, aby se oblouky do sebe vnořily a nesplývaly
      const x = kauzyX + sirkaKauz, ohyb = Math.min(R.oblouky - 50, 14 + Math.abs(b.y - a.y) / 10);
      const d = `M${x} ${a.y} C${x + ohyb} ${a.y} ${x + ohyb} ${b.y} ${x} ${b.y}`;
      cary.push({ id: h.id, druh: h.druh, hlavni: false, d, dz: d });
      continue;
    }
    const x1 = a.x + a.w, x2 = b.x;
    if (h.hlavni) {
      // lomená čára: od rodiče ke kmeni, po kmeni dolů a vodorovně k potomkovi (sourozenci sdílí kmen)
      const k = x1 + R.kmen, dy = b.y - a.y, r = Math.min(6, Math.abs(dy) / 2), s = Math.sign(dy);
      const d = dy === 0 ? `M${x1} ${a.y} H${x2}`
        : `M${x1} ${a.y} H${k - r} Q${k} ${a.y} ${k} ${a.y + s * r} V${b.y - s * r} Q${k} ${b.y} ${k + r} ${b.y} H${x2}`;
      cary.push({ id: h.id, druh: h.druh, hlavni: true, d, dz: dy === 0 ? d : `M${k} ${b.y} H${x2}` });
    } else {
      const klic = `${h.rodic}>${h.potomek}`, k = soubezne.get(klic) ?? 0;
      soubezne.set(klic, k + 1);
      const y1 = a.y + k * 5, y2 = b.y + k * 5, sx = (x1 + x2) / 2;
      const d = `M${x1} ${y1} C${sx} ${y1} ${sx} ${y2} ${x2} ${y2}`;
      cary.push({ id: h.id, druh: h.druh, hlavni: false, d, dz: d });
    }
  }
  // vedlejší vazby a návaznosti pod hlavní strom, aby přes ně byl strom čitelný
  cary.sort((a, b) => Number(a.hlavni) - Number(b.hlavni));
  return { sirka: kauzyX + sirkaKauz + R.oblouky, vyska: 2 * R.okraj + radek * R.radek, uzly, cary };
}

/** Co zvýraznit při najetí nebo fokusu: cesta ke středu (všemi vztahy), vše pod uzlem
 *  a u kauzy i kauzy, se kterými ji spojuje návaznost. Střed zvýrazní vše. */
export function zvyrazneni(graf: Graf, id: string): { uzly: Set<string>; hrany: Set<string> } {
  const uzly = new Set<string>([id]);
  const hrany = new Set<string>();
  if (id === STRED.id) {
    graf.uzly.forEach(u => uzly.add(u.id));
    graf.hrany.forEach(h => hrany.add(h.id));
    return { uzly, hrany };
  }
  const strom = graf.hrany.filter(h => h.druh !== 'navaznost');
  const nahoru = (u: string): void => strom.filter(h => h.potomek === u).forEach(h => {
    hrany.add(h.id);
    if (!uzly.has(h.rodic)) { uzly.add(h.rodic); nahoru(h.rodic); }
  });
  const dolu = (u: string): void => strom.filter(h => h.rodic === u).forEach(h => {
    hrany.add(h.id);
    if (!uzly.has(h.potomek)) { uzly.add(h.potomek); dolu(h.potomek); }
  });
  nahoru(id);
  dolu(id);
  for (const h of graf.hrany) if (h.druh === 'navaznost' && (h.rodic === id || h.potomek === id)) {
    hrany.add(h.id);
    uzly.add(h.rodic === id ? h.potomek : h.rodic);
  }
  return { uzly, hrany };
}

export type PolozkaKarty = { nazev: string; role: string | null };
export type SkupinaKarty = { nadpis: string; polozky: PolozkaKarty[]; dalsich: number };
/** Karta vazeb: co se ukáže v rohu mapy při najetí na uzel nebo čáru (místo popisků na mapě). */
export type Karta = { nazev: string; podnadpis: string | null; text: string | null; skupiny: SkupinaKarty[]; akce: string | null };

const roleHrany = (h: Hrana): string | null => [h.roleText, h.obdobi].filter(Boolean).join(' · ') || null;

/** Nadpis vazby ve směru čtení: od nadřazeného k podřízenému, u návaznosti od navazující kauzy. */
export function nadpisHrany(graf: Graf, id: string): string {
  const h = graf.hrany.find(x => x.id === id)!;
  const nazev = (u: string) => graf.uzly.find(x => x.id === u)!.nazev;
  return h.druh === 'navaznost' ? `${nazev(h.potomek)} → ${nazev(h.rodic)}` : `${nazev(h.rodic)} → ${nazev(h.potomek)}`;
}

/** Role více vazeb k témuž uzlu v jednom řádku: stejná role jednou, období za sebou
 *  („vlastní · 1999–2017, 2024–2026“), různé role oddělené středníkem. */
function roleVazeb(hrany: Hrana[]): string | null {
  const podleRole = new Map<string, string[]>();
  for (const h of hrany) {
    const klic = h.roleText ?? '';
    if (!podleRole.has(klic)) podleRole.set(klic, []);
    if (h.obdobi) podleRole.get(klic)!.push(h.obdobi);
  }
  return [...podleRole].map(([r, obdobi]) => [r, obdobi.join(', ')].filter(Boolean).join(' · ')).filter(Boolean).join('; ') || null;
}

/** Skupina karty: více vazeb k témuž uzlu je jedna položka, nejvýš max položek. */
function skupina(graf: Graf, nadpis: string, hrany: Hrana[], uzelVazby: (h: Hrana) => string, max: number): SkupinaKarty[] {
  const podle = new Map(graf.uzly.map(u => [u.id, u]));
  const polozky = new Map<string, Hrana[]>();
  for (const h of hrany) {
    const u = uzelVazby(h);
    if (!polozky.has(u)) polozky.set(u, []);
    polozky.get(u)!.push(h);
  }
  if (polozky.size === 0) return [];
  const vse = [...polozky].map(([u, hh]) => ({ nazev: podle.get(u)!.nazev, role: roleVazeb(hh) }));
  return [{ nadpis, polozky: vse.slice(0, max), dalsich: Math.max(0, vse.length - max) }];
}

export function kartaUzlu(graf: Graf, id: string, max = 8): Karta {
  const u = graf.uzly.find(x => x.id === id)!;
  const vstupni = graf.hrany.filter(h => h.potomek === id && h.druh !== 'navaznost');
  const vystupni = graf.hrany.filter(h => h.rodic === id && h.druh !== 'navaznost');
  if (u.typ === 'kauza') {
    const navazuje = graf.hrany.filter(h => h.druh === 'navaznost' && h.potomek === id);
    const navazujiNaNi = graf.hrany.filter(h => h.druh === 'navaznost' && h.rodic === id);
    const akteri = vstupni.filter(h => h.druh === 'akter');
    return {
      nazev: u.nazev, podnadpis: u.roky ?? null,
      text: akteri.length ? null : 'Kauza nemá uvedené další aktéry.',
      skupiny: [
        ...skupina(graf, 'Aktéři v kauze', akteri, h => h.rodic, max),
        ...skupina(graf, 'Navazuje na', navazuje, h => h.rodic, max),
        ...skupina(graf, 'Navazují na ni', navazujiNaNi, h => h.potomek, max),
      ],
      akce: 'Kliknutím otevřete detail kauzy.',
    };
  }
  // pod uzlem nejdřív děti hlavního stromu v jeho pořadí, pak ostatní podle abecedy
  const hl = graf.deti[id] ?? [];
  const nazev = (x: string) => graf.uzly.find(y => y.id === x)!.nazev;
  const poradi = (a: Hrana, b: Hrana) => {
    const i = hl.indexOf(a.potomek), j = hl.indexOf(b.potomek);
    return (i < 0 ? Infinity : i) - (j < 0 ? Infinity : j) || nazev(a.potomek).localeCompare(nazev(b.potomek), 'cs');
  };
  const dolu = vystupni.slice().sort(poradi);
  const nahoru = vstupni;
  return {
    nazev: u.nazev, podnadpis: null, text: null,
    skupiny: [
      ...skupina(graf, 'Nadřazení', nahoru, h => h.rodic, max),
      ...skupina(graf, 'Aktéři pod ním', dolu.filter(h => h.druh === 'vztah'), h => h.potomek, max),
      ...skupina(graf, u.typ === 'stred' ? 'Kauzy bez dalších aktérů' : 'V kauzách', dolu.filter(h => h.druh !== 'vztah'), h => h.potomek, max),
    ],
    akce: u.typ === 'stred' ? null : 'Kliknutím zobrazíte zdroje vazby.',
  };
}

/** Kauza, jejíž detail otevře klik na čáru: u vazby aktéra (nebo středu) na kauzu ta kauza, u návaznosti
 *  navazující kauza. Vazba mezi aktéry kauzu nemá. */
export function kauzaHrany(graf: Graf, id: string): string | null {
  const h = graf.hrany.find(x => x.id === id)!;
  return h.druh === 'vztah' ? null : h.potomek;
}

export function kartaHrany(graf: Graf, id: string): Karta {
  const h = graf.hrany.find(x => x.id === id)!;
  const kauza = kauzaHrany(graf, id);
  const akce = kauza ? `Kliknutím otevřete detail kauzy ${graf.uzly.find(u => u.id === kauza)!.nazev}.`
    : h.popis ? 'Kliknutím zobrazíte zdroje.' : null;
  return { nazev: nadpisHrany(graf, id), podnadpis: roleHrany(h), text: h.popis, skupiny: [], akce };
}

export type VazbyKauzy = {
  akteri: { nazev: string; roleText: string; popis: string; zdroje: number[] }[];
  navazuje: { slug: string; nazev: string; roleText: string; popis: string; zdroje: number[] }[];
  navazujiNaNi: { slug: string; nazev: string }[];
};

/** Blok „Aktéři a návaznosti“ v detailu kauzy (zdroje jsou id zdrojů téže kauzy). */
export function vazbyKauzy(zaznamy: KauzaZaznam[], akteri: Map<string, Akter>, slug: string): VazbyKauzy {
  const podleSlugu = new Map(zaznamy.map(z => [z.slug, z]));
  const k = podleSlugu.get(slug)?.kauza;
  if (!k) return { akteri: [], navazuje: [], navazujiNaNi: [] };
  return {
    akteri: k.akteri.filter(a => akteri.has(a.id)).map(a => ({ nazev: akteri.get(a.id)!.nazev, roleText: popisekRole(a.role), popis: a.popis, zdroje: a.zdroje })),
    navazuje: k.navazuje.filter(n => podleSlugu.has(n.kauza)).map(n => ({ slug: n.kauza, nazev: podleSlugu.get(n.kauza)!.kauza.nazev, roleText: popisekRole(n.role), popis: n.popis, zdroje: n.zdroje })),
    navazujiNaNi: zaznamy.filter(z => z.kauza.navazuje.some(n => n.kauza === slug)).map(z => ({ slug: z.slug, nazev: z.kauza.nazev })),
  };
}
