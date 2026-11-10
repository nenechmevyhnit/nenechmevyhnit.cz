import { z } from 'astro/zod';
import { STAVY } from './stavy';

const naText = (v: unknown) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === 'number' ? String(v) : v;

const datum = z.preprocess(naText, z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Datum musí být ve tvaru RRRR, RRRR-MM nebo RRRR-MM-DD'));
const datumPresne = z.preprocess(naText, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum musí být ve tvaru RRRR-MM-DD'));
const odkazy = (co: string) => z.array(z.number().int().positive()).min(1, `${co} musí mít aspoň jeden zdroj`);

export const zdrojSchema = z.object({
  id: z.number().int().positive(),
  vydavatel: z.string().min(1, 'Zdroj musí mít vydavatele'),
  titulek: z.string().min(1),
  datum,
  druh: z.enum(['primarni', 'media']),
  url: z.string().url().regex(/^https?:\/\//, 'Odkaz zdroje musí začínat http:// nebo https://'),
  archiv: z.string().url().optional(),
});

export const udalostSchema = z.object({
  datum,
  nazev: z.string().min(1),
  popis: z.string().min(1),
  zdroje: odkazy('Událost'),
});

export function rokZData(d: string): number {
  return Number(d.slice(0, 4));
}

export const kauzaSchema = z
  .object({
    typ: z.enum(['kauza']).default('kauza'),
    nazev: z.string().min(1),
    shrnuti: z.string().min(1).max(320),
    od: z.number().int().min(1950).max(2100),
    do: z.number().int().min(1950).max(2100).nullable(),
    stav: z.enum(STAVY),
    stavPoznamka: z.string().optional(),
    stitky: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
    overeno: datumPresne,
    zdroje: z.array(zdrojSchema).min(1, 'Kauza musí mít aspoň jeden zdroj'),
    udalosti: z.array(udalostSchema).min(1, 'Kauza musí mít aspoň jednu událost'),
    stanovisko: z.object({ text: z.string().min(1), zdroje: odkazy('Stanovisko') }),
    opravy: z.array(z.object({ datum: datumPresne, popis: z.string().min(1) })).default([]),
  })
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
    if (k.do !== null && k.do < k.od) ctx.addIssue({ code: 'custom', message: `Rok konce ${k.do} je dřív než rok začátku ${k.od}` });
    if (k.stav === 'jine' && !k.stavPoznamka) ctx.addIssue({ code: 'custom', message: 'Stav "jine" vyžaduje vyplněnou poznámku ke stavu (stavPoznamka)' });
    const konec = k.do ?? new Date().getFullYear();
    k.udalosti.forEach(u => {
      const r = rokZData(u.datum);
      if (r < k.od || r > konec) ctx.addIssue({ code: 'custom', message: `Událost „${u.nazev}“ (${u.datum}) leží mimo rozsah kauzy ${k.od}–${k.do ?? 'dosud'}` });
    });
  });

export type Kauza = z.infer<typeof kauzaSchema>;
export type Zdroj = Kauza['zdroje'][number];
export type Udalost = Kauza['udalosti'][number];
