import { z } from 'astro/zod';
import { naText, existujeDatum, datum, datumPresne, text, odkazy, idTvar, popisVazby, zdrojSchema, udalostSchema } from './schema';
import { KROKY, krokyProDruh } from './pravidla-stavy';
import { DRUHY_PRAVIDEL, CESTY, KOMU, ZAVERY, DRUHY_ZNAKU, KONTROLNI_INSTITUCE, UPOZORNOVATELE, OBLASTI, cestyProDruh } from './pravidla-slovnik';

/** Účinnost je jediné datum pravidla, které smí ležet v budoucnosti. */
const ucinnost = z.preprocess(naText, z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Účinnost musí být ve tvaru RRRR-MM-DD')
  .refine(existujeDatum, 'Datum účinnosti neexistuje'));
const sZdroji = (co: string) => z.object({ text: text(), zdroje: odkazy(co) }).strict();
const proVasSchema = z.object({
  text: text().max(400, 'Text „Co by to znamenalo pro vás“ smí mít nejvýš 400 znaků'),
  zdroje: odkazy('Co by to znamenalo pro vás'),
}).strict();

export const udalostPravidlaSchema = udalostSchema.extend({ krok: z.enum(KROKY).optional() }).strict();
const krokRetezceSchema = z.object({ text: text(), odhad: z.boolean().default(false), zdroje: odkazy('Krok řetězce') }).strict();
const znakSchema = z.object({
  druh: z.enum(DRUHY_ZNAKU),
  instituce: z.enum(KONTROLNI_INSTITUCE).optional(),
  text: text(),
  zdroje: odkazy('Znak'),
}).strict();
const upozorneniSchema = z.object({ kdo: z.enum(UPOZORNOVATELE), text: text(), zdroje: odkazy('Upozornění') }).strict();

/** koncepty = true: lokální náhled neověřených konceptů, smí chybět datum ověření (overeno: null). */
const vytvorPravidloSchema = (koncepty: boolean) => z
  .object({
    nazev: text().max(60, 'Název pravidla smí mít nejvýš 60 znaků'),
    shrnuti: text().max(320),
    druh: z.enum(DRUHY_PRAVIDEL),
    cesta: z.enum(CESTY),
    predkladatel: text(),
    oznaceni: text().optional(),
    pripojenoK: z.object({ nazev: text(), zdroje: odkazy('Připojení k zákonu') }).strict().optional(),
    ucinnostOd: ucinnost.optional(),
    stitky: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
    /** Oblasti státu (specifikace oblastí, oddíl 7.1). Ve schématu nepovinné, povinnost hlídá overOblasti (validace.ts). */
    oblasti: z.array(z.enum(OBLASTI)).min(1, 'Seznam oblastí nesmí být prázdný').optional(),
    proVas: proVasSchema.optional(),
    overeno: koncepty ? datumPresne.nullable().default(null) : datumPresne,
    zdroje: z.array(zdrojSchema).min(1, 'Pravidlo musí mít aspoň jeden zdroj'),
    udalosti: z.array(udalostPravidlaSchema).min(1, 'Pravidlo musí mít aspoň jednu událost'),
    /** Nejbližší naplánovaný krok, který ještě neproběhl. Text smí obsahovat budoucí termín, stavK (kdy byl
     *  stav zjištěn) ne. Po proběhnutí se krok zapíše jako událost a pole se smaže nebo přepíše dalším krokem. */
    planovano: z.object({ stavK: datumPresne, text: text(), zdroje: odkazy('Plánovaný krok') }).strict().optional(),
    prospech: z.object({
      komu: z.array(z.enum(KOMU)).min(1, 'Řetězec musí vést aspoň k jednomu z: babis, agrofert'),
      zaver: z.enum(ZAVERY),
      /** Krátké shrnutí, proč by změna prospěla (1–2 věty se zdrojem), obdoba „Proč je to kauza“ u kauz. */
      proc: z.object({ text: text().max(280, 'Shrnutí „proč“ smí mít nejvýš 280 znaků'), zdroje: odkazy('Shrnutí „proč“') }).strict(),
      retezec: z.array(krokRetezceSchema).min(2, 'Řetězec prospěchu musí mít aspoň 2 kroky'),
      dalsiDotceni: sZdroji('Další dotčení').optional(),
    }).strict().optional(),
    kontrolaMoci: z.object({
      znaky: z.array(znakSchema).min(1, 'Kontrola moci musí mít aspoň jeden znak'),
      upozorneni: z.array(upozorneniSchema).min(1, 'Kontrola moci musí mít aspoň jedno upozornění instituce nebo profesní organizace'),
    }).strict().optional(),
    vyhrady: z.array(z.object({ kdo: text(), text: text(), zdroje: odkazy('Výhrada') }).strict()).default([]),
    stanovisko: sZdroji('Stanovisko'),
    kauzy: z.array(z.object({ kauza: idTvar, popis: popisVazby, zdroje: odkazy('Vazba na kauzu') }).strict()).default([]),
    opravy: z.array(z.object({ datum: datumPresne, popis: text() }).strict()).default([]),
  })
  .strict()
  .superRefine((p, ctx) => {
    const chyba = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = new Set<number>();
    for (const zd of p.zdroje) {
      if (ids.has(zd.id)) chyba(`Duplicitní id zdroje ${zd.id}`);
      ids.add(zd.id);
    }
    const over = (cisla: number[], kde: string) => {
      for (const c of cisla) if (!ids.has(c)) chyba(`${kde} odkazuje na neexistující zdroj ${c}`);
    };
    p.udalosti.forEach((u, i) => over(u.zdroje, `Událost ${i + 1} („${u.nazev}“)`));
    if (p.planovano) over(p.planovano.zdroje, 'Plánovaný krok');
    over(p.stanovisko.zdroje, 'Stanovisko');
    if (p.pripojenoK) over(p.pripojenoK.zdroje, 'Připojení k zákonu');
    p.vyhrady.forEach(v => over(v.zdroje, `Výhrada („${v.kdo}“)`));
    p.kauzy.forEach(k => over(k.zdroje, `Vazba na kauzu „${k.kauza}“`));

    // Oblasti a text pro čtenáře (specifikace oblastí, oddíl 7.3). Jejich povinnost hlídá overOblasti
    // napříč změnami (přechodně: všechny zveřejněné změny, nebo žádná).
    if (p.proVas) over(p.proVas.zdroje, 'Co by to znamenalo pro vás');
    if (p.oblasti && new Set(p.oblasti).size !== p.oblasti.length) chyba('Pole oblasti obsahuje stejnou oblast dvakrát');

    if (!p.prospech && !p.kontrolaMoci) chyba('Záznam musí mít aspoň jeden důvod zařazení: prospech nebo kontrolaMoci');

    // Prospěch: odkazy a závěr řetězce (spec pravidel, oddíl 4)
    if (p.prospech) {
      over(p.prospech.proc.zdroje, 'Shrnutí „proč“');
      p.prospech.retezec.forEach((k, i) => over(k.zdroje, `Krok řetězce ${i + 1}`));
      if (p.prospech.dalsiDotceni) over(p.prospech.dalsiDotceni.zdroje, 'Další dotčení');
      const odhadu = p.prospech.retezec.filter(k => k.odhad).length;
      if (p.prospech.zaver === 'dolozen' && odhadu > 0) chyba('Závěr „prospěch doložen“ nesmí mít krok s odhadem (použijte zaver: pravdepodobny)');
      if (p.prospech.zaver === 'pravdepodobny' && odhadu === 0) chyba('Závěr „prospěch pravděpodobný“ vyžaduje aspoň jeden krok s odhadem (jinak zaver: dolozen)');
      const prvni = p.prospech.retezec[0];
      if (prvni && !p.zdroje.some(zd => zd.druh === 'primarni' && prvni.zdroje.includes(zd.id)))
        chyba('První krok řetězce (co pravidlo mění) musí mít primární zdroj, tedy text předpisu');
      if (new Set(p.prospech.komu).size !== p.prospech.komu.length) chyba('Pole komu obsahuje stejnou hodnotu dvakrát');
    }

    // Dopad na kontrolu moci (spec kontroly moci, oddíl 6)
    if (p.kontrolaMoci) {
      p.kontrolaMoci.znaky.forEach((zn, i) => {
        over(zn.zdroje, `Znak ${i + 1}`);
        if (!p.zdroje.some(zd => zd.druh === 'primarni' && zn.zdroje.includes(zd.id))) chyba(`Znak ${i + 1} musí mít primární zdroj, tedy text předpisu`);
        if (zn.druh === 'instituce' && !zn.instituce) chyba(`Znak ${i + 1} mění instituci nebo pravidla státu, musí je uvést (instituce)`);
        if (zn.druh !== 'instituce' && zn.instituce) chyba(`Znak ${i + 1}: instituce patří jen ke znaku druhu „instituce“`);
      });
      p.kontrolaMoci.znaky.map(zn => (zn.instituce ? `${zn.druh}/${zn.instituce}` : zn.druh))
        .filter((x, i, a) => a.indexOf(x) !== i)
        .forEach(x => chyba(`Znak „${x}“ je uveden dvakrát`));
      p.kontrolaMoci.upozorneni.forEach(u => over(u.zdroje, `Upozornění („${u.kdo}“)`));
    }

    // Cesta předložení a kroky projednávání
    if (!cestyProDruh(p.druh).includes(p.cesta)) chyba(`Cesta „${p.cesta}“ nepatří k druhu „${p.druh}“`);
    if (p.cesta === 'pozmenovaci-navrh' && !p.pripojenoK) chyba('Pozměňovací návrh musí uvést, ke kterému zákonu byl připojen (pripojenoK)');
    if (p.cesta !== 'pozmenovaci-navrh' && p.pripojenoK) chyba('pripojenoK patří jen k pozměňovacímu návrhu');
    if (!p.udalosti.some(u => u.krok)) chyba('Aspoň jedna událost musí mít krok projednávání (krok)');
    const povolene = krokyProDruh(p.druh);
    p.udalosti.forEach(u => {
      if (u.krok && !povolene.includes(u.krok)) chyba(`Krok „${u.krok}“ u události „${u.nazev}“ nepatří k druhu „${p.druh}“`);
    });

    // Chronologie stejně jako u kauz
    for (let i = 1; i < p.udalosti.length; i++) {
      const a = p.udalosti[i - 1].datum, b = p.udalosti[i].datum, n = Math.min(a.length, b.length);
      if (a.slice(0, n) > b.slice(0, n)) chyba(`Události nejsou v časovém pořadí: „${p.udalosti[i].nazev}“ (${b}) následuje po ${a}`);
    }
    p.kauzy.map(k => k.kauza)
      .filter((x, i, a) => a.indexOf(x) !== i)
      .forEach(x => chyba(`Vazba na kauzu „${x}“ je uvedena dvakrát`));
  });

export const pravidloSchema = vytvorPravidloSchema(false);
export const pravidloSchemaKoncepty = vytvorPravidloSchema(true);

export type Pravidlo = z.infer<typeof pravidloSchemaKoncepty>;
export type UdalostPravidla = Pravidlo['udalosti'][number];
