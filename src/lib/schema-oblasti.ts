import { z } from 'astro/zod';
import { datum, datumPresne, text, odkazy, idTvar, zdrojSchema } from './schema';
import { TYPY_HODNOCENI } from './pravidla-slovnik';

/** Citace v „Jak to hodnotí“ (specifikace oblastí, oddíl 5 a 7.2). */
const hodnoceniSchema = z.object({
  typ: z.enum(TYPY_HODNOCENI),
  kdo: text(),
  funkce: text().optional(),
  citace: text().max(500, 'Citace smí mít nejvýš 500 znaků'),
  datum,
  zdroje: odkazy('Hodnocení'),
  /** Slugy změn v této oblasti, ke kterým se citace vztahuje. */
  pravidla: z.array(idTvar).default([]),
}).strict();

/** koncepty = true: lokální náhled, smí chybět datum ověření. */
const vytvorOblastSchema = (koncepty: boolean) => z
  .object({
    uvod: z.object({ text: text().max(400, 'Úvod oblasti smí mít nejvýš 400 znaků'), zdroje: odkazy('Úvod oblasti') }).strict(),
    hodnoceni: z.array(hodnoceniSchema).default([]),
    zdroje: z.array(zdrojSchema).min(1, 'Oblast musí mít aspoň jeden zdroj'),
    overeno: koncepty ? datumPresne.nullable().default(null) : datumPresne,
  })
  .strict()
  .superRefine((o, ctx) => {
    const chyba = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = new Set<number>();
    for (const zd of o.zdroje) {
      if (ids.has(zd.id)) chyba(`Duplicitní id zdroje ${zd.id}`);
      ids.add(zd.id);
    }
    const over = (cisla: number[], kde: string) => {
      for (const c of cisla) if (!ids.has(c)) chyba(`${kde} odkazuje na neexistující zdroj ${c}`);
    };
    over(o.uvod.zdroje, 'Úvod oblasti');
    o.hodnoceni.forEach((h, i) => {
      over(h.zdroje, `Hodnocení ${i + 1} („${h.kdo}“)`);
      if ((h.typ === 'vlada' || h.typ === 'odbornik') && !h.funkce) chyba(`Hodnocení ${i + 1} („${h.kdo}“) musí uvést funkci (funkce)`);
    });
    if (o.hodnoceni.length > 0 && !o.hodnoceni.some(h => h.typ === 'vlada'))
      chyba('Oblast s hodnoceními musí mít aspoň jedno stanovisko vlády (typ: vlada); když vláda nereagovala, citujte účel z důvodové zprávy');
  });

export const oblastSchema = vytvorOblastSchema(false);
export const oblastSchemaKoncepty = vytvorOblastSchema(true);
export type OblastData = z.infer<typeof oblastSchemaKoncepty>;
export type Hodnoceni = OblastData['hodnoceni'][number];
