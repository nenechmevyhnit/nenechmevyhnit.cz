import { z } from 'astro/zod';
import { datumPresne, text } from './schema';

/** Hlas poslance ve snímku. Převod z kódů PSP je v psp-data.ts (spec hlasování, oddíl 3). */
export const HLASY = ['pro', 'proti', 'zdrzel', 'nehlasoval', 'zdrzel-nehlasoval', 'omluven', 'neprihlasen'] as const;
export type Hlas = (typeof HLASY)[number];

/** proceduralni: o pořadu, lhůtách nebo způsobu projednání; obsah: o návrhu samotném nebo o jeho znění. */
export const TYPY_HLASOVANI = ['proceduralni', 'obsah'] as const;
export type TypHlasovani = (typeof TYPY_HLASOVANI)[number];

/** psp-<období>-<schůze>-<číslo hlasování na schůzi> */
export const ID_HLASOVANI = /^psp-(\d+)-(\d+)-(\d+)$/;

const pocet = z.number().int().nonnegative();

/** Snímek jednoho hlasování, který vyrábí scripts/stahni-hlasovani.ts (spec hlasování, oddíl 4). */
export const snimekSchema = z.object({
  komora: z.literal('psp'),
  obdobi: z.number().int().positive(),
  schuze: z.number().int().positive(),
  cislo: z.number().int().positive(),
  idPsp: z.number().int().positive(),
  datum: datumPresne,
  cas: z.string().regex(/^\d{2}:\d{2}$/, 'Čas musí být ve tvaru HH:MM'),
  nazevPsp: z.string(),
  vysledek: z.enum(['prijato', 'zamitnuto']),
  kvorum: pocet,
  souhrn: z.object({ pro: pocet, proti: pocet, zdrzel: pocet, nehlasoval: pocet, prihlaseno: pocet }).strict(),
  kluby: z.record(z.string(), text()),
  poslanci: z.array(z.object({
    id: z.number().int().positive(),
    jmeno: text(),
    prijmeni: text(),
    klub: z.string().nullable(),
    hlas: z.enum(HLASY),
  }).strict()).min(1, 'Snímek musí mít aspoň jednoho poslance'),
  stazeno: datumPresne,
}).strict();

export type Snimek = z.infer<typeof snimekSchema>;
export type PoslanecVHlasovani = Snimek['poslanci'][number];

export const idSnimku = (s: Pick<Snimek, 'komora' | 'obdobi' | 'schuze' | 'cislo'>): string =>
  `${s.komora}-${s.obdobi}-${s.schuze}-${s.cislo}`;

/** Součty jmenovitých hlasů proti souhrnu PSP (spec hlasování, oddíl 6). Vrací popisy nesouladů, prázdné pole = sedí. */
export function nesouladySouctu(s: Pick<Snimek, 'souhrn' | 'poslanci'>): string[] {
  const n = (h: Hlas) => s.poslanci.filter(p => p.hlas === h).length;
  const chyby: string[] = [];
  const porovnej = (co: string, jmenovite: number, souhrn: number) => {
    if (jmenovite !== souhrn) chyby.push(`${co}: jmenovitě ${jmenovite}, v souhrnu ${souhrn}`);
  };
  porovnej('pro', n('pro'), s.souhrn.pro);
  porovnej('proti', n('proti'), s.souhrn.proti);
  porovnej('zdrželi se nebo nehlasovali', n('zdrzel') + n('nehlasoval') + n('zdrzel-nehlasoval'), s.souhrn.zdrzel + s.souhrn.nehlasoval);
  // Data, která rozlišují kódy C a F (a nemají K), musí sedět i každý zvlášť.
  if (n('zdrzel-nehlasoval') === 0 && n('zdrzel') + n('nehlasoval') > 0) {
    porovnej('zdrželi se', n('zdrzel'), s.souhrn.zdrzel);
    porovnej('nehlasovali', n('nehlasoval'), s.souhrn.nehlasoval);
  }
  porovnej('nepřítomní (omluvení a nepřihlášení)', n('omluven') + n('neprihlasen'), s.poslanci.length - s.souhrn.prihlaseno);
  return chyby;
}
