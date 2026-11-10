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

/** radek: mezi uzly zbývá místo na popisek role nad uzlem (mezery mezi sloupci jsou na popisky úzké) */
export const ROZMERY = { radek: 40, okraj: 16, vyskaUzlu: 22, stred: 120, akter: 200, kauza: 260, mezera: 36, oblouky: 150 } as const;
export type UmisteniUzlu = { id: string; typ: TypUzlu; nazev: string; x: number; y: number; w: number };
export type Cara = { id: string; druh: DruhHrany; d: string; popisek: string | null; px: number; py: number };
export type Rozlozeni = { sirka: number; vyska: number; uzly: UmisteniUzlu[]; cary: Cara[] };

/** Vrstvy zleva doprava: střed → aktéři podle hloubky → sloupec kauz. y uzlu je střed jeho řádku. */
export function rozlozMapu(graf: Graf, viditelne: Iterable<string> | null): Rozlozeni {
  const R = ROZMERY;
  const vid = viditelneUzly(graf, viditelne);
  if (vid.size === 1) return { sirka: 0, vyska: 0, uzly: [], cary: [] };
  const podle = new Map(graf.uzly.map(u => [u.id, u]));
  const maxHloubka = Math.max(0, ...graf.uzly.filter(u => u.typ === 'akter' && vid.has(u.id)).map(u => u.hloubka));
  const sloupecX = (h: number) => (h === 0 ? R.okraj : R.okraj + R.stred + R.mezera + (h - 1) * (R.akter + R.mezera));
  const kauzyX = sloupecX(maxHloubka) + (maxHloubka === 0 ? R.stred : R.akter) + R.mezera;

  // každý list (kauza nebo aktér bez viditelných dětí) dostane řádek, rodič je uprostřed svých listů
  const rozsah = new Map<string, [number, number]>();
  let radek = 0;
  const projdi = (id: string): void => {
    const deti = (graf.deti[id] ?? []).filter(d => vid.has(d));
    if (deti.length === 0) { rozsah.set(id, [radek, radek]); radek++; return; }
    deti.forEach(projdi);
    rozsah.set(id, [rozsah.get(deti[0])![0], rozsah.get(deti[deti.length - 1])![1]]);
  };
  projdi(STRED.id);

  const uzly: UmisteniUzlu[] = [...rozsah].map(([id, [a, b]]) => {
    const u = podle.get(id)!;
    const x = u.typ === 'stred' ? sloupecX(0) : u.typ === 'akter' ? sloupecX(u.hloubka) : kauzyX;
    const w = u.typ === 'stred' ? R.stred : u.typ === 'akter' ? R.akter : R.kauza;
    return { id, typ: u.typ, nazev: u.nazev, x, y: R.okraj + ((a + b) / 2 + 0.5) * R.radek, w };
  });
  const misto = new Map(uzly.map(u => [u.id, u]));
  // popisek stromové hrany je u uzlu potomka: první (hlavní) nad ním, další pod ním
  const poradiPopisku = new Map<string, number>();
  const vstupy = new Map<string, Hrana[]>();
  for (const h of graf.hrany) if (h.druh !== 'navaznost' && misto.has(h.rodic) && misto.has(h.potomek)) {
    if (!vstupy.has(h.potomek)) vstupy.set(h.potomek, []);
    vstupy.get(h.potomek)!.push(h);
  }
  for (const seznam of vstupy.values()) seznam.sort((a, b) => Number(b.hlavni) - Number(a.hlavni)).forEach((h, i) => poradiPopisku.set(h.id, i));
  const cary: Cara[] = [];
  const soubezne = new Map<string, number>(); // víc vazeb mezi týmiž uzly: každá další čára o kus níž
  for (const h of graf.hrany) {
    const a = misto.get(h.rodic), b = misto.get(h.potomek);
    if (!a || !b) continue;
    const popisek = [h.roleText, h.obdobi].filter(Boolean).join(' · ') || null;
    if (h.druh === 'navaznost') {
      const x = kauzyX + R.kauza, ohyb = Math.min(40, 12 + Math.abs(b.y - a.y) / 8);
      cary.push({ id: h.id, druh: h.druh, d: `M${x} ${a.y} C${x + ohyb} ${a.y} ${x + ohyb} ${b.y} ${x} ${b.y}`, popisek, px: x + ohyb + 6, py: (a.y + b.y) / 2 + 4 });
    } else {
      const x1 = a.x + a.w, x2 = b.x, sx = (x1 + x2) / 2, i = poradiPopisku.get(h.id) ?? 0;
      const py = i === 0 ? b.y - R.vyskaUzlu / 2 - 3 : b.y + R.vyskaUzlu / 2 + 11 + (i - 1) * 12;
      const klic = `${h.rodic}>${h.potomek}`, k = soubezne.get(klic) ?? 0;
      soubezne.set(klic, k + 1);
      const y1 = a.y + k * 5, y2 = b.y + k * 5;
      cary.push({ id: h.id, druh: h.druh, d: `M${x1} ${y1} C${sx} ${y1} ${sx} ${y2} ${x2} ${y2}`, popisek, px: b.x + 4, py });
    }
  }
  return { sirka: kauzyX + R.kauza + R.oblouky, vyska: 2 * R.okraj + radek * R.radek, uzly, cary };
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
