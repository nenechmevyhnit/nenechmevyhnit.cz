import { z } from 'astro/zod';
import { STAVY } from './stavy';
import { KRITERIA } from './kriteria';

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
  druh: z.enum(['primarni', 'media']),
  url: odkazHttp('Odkaz zdroje'),
  archiv: odkazHttp('Archivní odkaz').optional(),
}).strict();

export const udalostSchema = z.object({
  datum,
  nazev: text(),
  popis: text(),
  zdroje: odkazy('Událost'),
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
