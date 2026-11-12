import { z } from 'astro/zod';
import { STAVY } from './stavy';
import { KRITERIA } from './kriteria';
import { DRUHY_ZDROJU } from './zdroje';
import { ROLE_VZTAHU, ROLE_V_KAUZE, ROLE_NAVAZNOSTI, DRUHY_AKTERU } from './role';
import { DRUHY_CASTEK, MENY, PRESNOSTI } from './castky';

const naText = (v: unknown) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === 'number' ? String(v) : v;

/** Existuje takové kalendářní datum? (RRRR, RRRR-MM nebo RRRR-MM-DD) */
export function existujeDatum(d: string): boolean {
  const [r, m, den] = d.split('-').map(Number);
  if (m === undefined) return true;
  if (m < 1 || m > 12) return false;
  if (den === undefined) return true;
  const dt = new Date(Date.UTC(r, m - 1, den));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === den;
}

/** Leží datum (s libovolnou přesností) po dnešku? Porovnává se se stejně přesnou částí dnešního data. */
export function jeVBudoucnosti(d: string, dnes: Date = new Date()): boolean {
  const iso = `${dnes.getFullYear()}-${String(dnes.getMonth() + 1).padStart(2, '0')}-${String(dnes.getDate()).padStart(2, '0')}`;
  return d > iso.slice(0, d.length);
}

const kontrolaData = (tvar: RegExp, hlaska: string) =>
  z.preprocess(naText, z.string()
    .regex(tvar, hlaska)
    .superRefine((d, ctx) => {
      if (!existujeDatum(d)) ctx.addIssue({ code: 'custom', message: `${d} je neexistující datum` });
      else if (jeVBudoucnosti(d)) ctx.addIssue({ code: 'custom', message: `Datum ${d} leží v budoucnosti` });
    }));
const datum = kontrolaData(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Datum musí být ve tvaru RRRR, RRRR-MM nebo RRRR-MM-DD');
const datumPresne = kontrolaData(/^\d{4}-\d{2}-\d{2}$/, 'Datum musí být ve tvaru RRRR-MM-DD');
const text = () => z.string().trim().min(1, 'Text nesmí být prázdný');
const odkazHttp = (co: string) => z.string().url().regex(/^https?:\/\//, `${co} musí začínat http:// nebo https://`);
const odkazy = (co: string) => z.array(z.number().int().positive()).min(1, `${co} musí mít aspoň jeden zdroj`);

export const zdrojSchema = z.object({
  id: z.number().int().positive(),
  vydavatel: z.string().trim().min(1, 'Zdroj musí mít vydavatele'),
  titulek: text(),
  datum,
  druh: z.enum(DRUHY_ZDROJU),
  url: odkazHttp('Odkaz zdroje'),
  archiv: odkazHttp('Archivní odkaz').optional(),
}).strict();

export const udalostSchema = z.object({
  datum,
  nazev: text(),
  popis: text(),
  zdroje: odkazy('Událost'),
}).strict();

const idTvar = z.string().regex(/^[a-z0-9-]+$/, 'Id smí obsahovat jen malá písmena bez diakritiky, číslice a pomlčky');
const popisVazby = text().max(200, 'Popis vazby smí mít nejvýš 200 znaků (jedna věta)');
const rok = z.number().int().min(1950).max(2100);

export const vazbaAkteraSchema = z.object({
  id: idTvar,
  role: z.enum(ROLE_V_KAUZE),
  popis: popisVazby,
  zdroje: odkazy('Vazba na aktéra'),
}).strict();

export const navaznostSchema = z.object({
  kauza: idTvar,
  role: z.enum(ROLE_NAVAZNOSTI),
  popis: popisVazby,
  zdroje: odkazy('Návaznost'),
}).strict();

/** Částka, o kterou v kauze jde. Druh říká, co číslo znamená (dotace, pokuta, objem…), škodu tvrdí jen druhy skoda-*. */
export const castkaSchema = z.object({
  castka: z.number().int().positive('Částka musí být kladné celé číslo'),
  mena: z.enum(MENY).default('CZK'),
  presnost: z.enum(PRESNOSTI).optional(),
  druh: z.enum(DRUHY_CASTEK),
  popis: text().max(80, 'Popis částky smí mít nejvýš 80 znaků'),
  zdroje: odkazy('Částka'),
}).strict();

export function rokZData(d: string): number {
  return Number(d.slice(0, 4));
}

/** koncepty = true: lokální náhled neověřených konceptů, smí chybět datum ověření (overeno: null). */
const vytvorKauzaSchema = (koncepty: boolean) => z
  .object({
    typ: z.enum(['kauza']).default('kauza'),
    nazev: text().max(36, 'Název smí mít nejvýš 36 znaků, aby byl na ose celý vidět (podrobnosti patří do shrnutí)'),
    shrnuti: text().max(320),
    od: z.number().int().min(1950).max(2100),
    do: z.number().int().min(1950).max(2100).nullable(),
    stav: z.enum(STAVY),
    stavPoznamka: z.string().optional(),
    stitky: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
    overeno: koncepty ? datumPresne.nullable().default(null) : datumPresne,
    zdroje: z.array(zdrojSchema).min(1, 'Kauza musí mít aspoň jeden zdroj'),
    udalosti: z.array(udalostSchema).min(1, 'Kauza musí mít aspoň jednu událost'),
    stanovisko: z.object({ text: text(), zdroje: odkazy('Stanovisko') }).strict(),
    kriterium: z.enum(KRITERIA),
    proc: z.object({ text: text(), zdroje: odkazy('Proč je to kauza') }).strict(),
    akteri: z.array(vazbaAkteraSchema).default([]),
    navazuje: z.array(navaznostSchema).default([]),
    /** na ose se ukáže první částka, která není objem (viz hlavniCastka) */
    castky: z.array(castkaSchema).max(3, 'Kauza smí mít nejvýš 3 částky').default([]),
    opravy: z.array(z.object({ datum: datumPresne, popis: text() }).strict()).default([]),
  })
  .strict()
  .superRefine((k, ctx) => {
    const ids = new Set<number>();
    for (const z of k.zdroje) {
      if (ids.has(z.id)) ctx.addIssue({ code: 'custom', message: `Duplicitní id zdroje ${z.id}` });
      ids.add(z.id);
    }
    const over = (cisla: number[], kde: string) => {
      for (const c of cisla) if (!ids.has(c)) ctx.addIssue({ code: 'custom', message: `${kde} odkazuje na neexistující zdroj ${c}` });
    };
    k.udalosti.forEach((u, i) => over(u.zdroje, `Událost ${i + 1} („${u.nazev}“)`));
    over(k.stanovisko.zdroje, 'Stanovisko');
    over(k.proc.zdroje, 'Proč je to kauza');
    k.akteri.forEach(a => over(a.zdroje, `Vazba na aktéra „${a.id}“`));
    k.navazuje.forEach(n => over(n.zdroje, `Návaznost na „${n.kauza}“`));
    k.castky.forEach(c => over(c.zdroje, `Částka „${c.popis}“`));
    const dvakrat = (seznam: string[], co: string) => seznam
      .filter((x, i) => seznam.indexOf(x) !== i)
      .forEach(x => ctx.addIssue({ code: 'custom', message: `${co} „${x}“ je u kauzy uvedena dvakrát` }));
    dvakrat(k.akteri.map(a => a.id), 'Vazba na aktéra');
    dvakrat(k.navazuje.map(n => n.kauza), 'Návaznost na');
    // kritérium zařazení musí podložit zdroje uvedené u „Proč je to kauza“
    const zdrojeProc = k.zdroje.filter(z => k.proc.zdroje.includes(z.id));
    if (k.kriterium !== 'dve-redakce' && !zdrojeProc.some(z => z.druh === 'primarni'))
      ctx.addIssue({ code: 'custom', message: 'Kritérium úřední řízení / úřední zjištění vyžaduje u „Proč je to kauza“ aspoň jeden primární zdroj' });
    if (k.kriterium === 'dve-redakce' && new Set(zdrojeProc.filter(z => z.druh === 'media').map(z => z.vydavatel.trim().toLowerCase())).size < 2)
      ctx.addIssue({ code: 'custom', message: 'Kritérium dvě redakce vyžaduje u „Proč je to kauza“ dva mediální zdroje od různých vydavatelů' });
    if (k.do !== null && k.do < k.od) ctx.addIssue({ code: 'custom', message: `Rok konce ${k.do} je dřív než rok začátku ${k.od}` });
    if (k.stav === 'jine' && !k.stavPoznamka) ctx.addIssue({ code: 'custom', message: 'Stav "jine" vyžaduje vyplněnou poznámku ke stavu (stavPoznamka)' });
    const konec = k.do ?? new Date().getFullYear();
    // Chronologie počítá s událostmi od nejstarší po nejnovější
    for (let i = 1; i < k.udalosti.length; i++) {
      const a = k.udalosti[i - 1].datum, b = k.udalosti[i].datum, n = Math.min(a.length, b.length);
      if (a.slice(0, n) > b.slice(0, n)) ctx.addIssue({ code: 'custom', message: `Události nejsou v časovém pořadí: „${k.udalosti[i].nazev}“ (${b}) následuje po ${a}` });
    }
    k.udalosti.forEach(u => {
      const r = rokZData(u.datum);
      if (r < k.od || r > konec) ctx.addIssue({ code: 'custom', message: `Událost „${u.nazev}“ (${u.datum}) leží mimo rozsah kauzy ${k.od}–${k.do ?? 'dosud'}` });
    });
  });

export const kauzaSchema = vytvorKauzaSchema(false);
export const kauzaSchemaKoncepty = vytvorKauzaSchema(true);

export type Kauza = z.infer<typeof kauzaSchemaKoncepty>;
export type Zdroj = Kauza['zdroje'][number];
export type Udalost = Kauza['udalosti'][number];

const vztahSchema = z.object({
  nadrazeny: idTvar,
  role: z.enum(ROLE_VZTAHU),
  od: rok,
  do: rok.nullable(),
  popis: popisVazby,
  zdroje: z.array(zdrojSchema.omit({ id: true })).min(1, 'Vztah musí mít aspoň jeden zdroj'),
}).strict().superRefine((v, ctx) => {
  if (v.do !== null && v.do < v.od) ctx.addIssue({ code: 'custom', message: `Rok konce vztahu ${v.do} je dřív než rok začátku ${v.od}` });
});

/** koncepty = true: aktér zatím jen v _koncepty/obsah/akteri.yml, smí chybět datum ověření. */
const vytvorAkterSchema = (koncepty: boolean) => z.object({
  nazev: text().max(28, 'Název aktéra smí mít nejvýš 28 znaků, aby se vešel do mapy'),
  druh: z.enum(DRUHY_AKTERU),
  overeno: koncepty ? datumPresne.nullable().default(null) : datumPresne,
  vztahy: z.array(vztahSchema).min(1, 'Aktér musí mít aspoň jeden vztah'),
}).strict();

export const akterSchema = vytvorAkterSchema(false);
export const akterSchemaKoncepty = vytvorAkterSchema(true);
export type Akter = z.infer<typeof akterSchemaKoncepty>;
export type Vztah = Akter['vztahy'][number];
