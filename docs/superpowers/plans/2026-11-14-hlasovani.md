# Hlasování u zákonů a nařízení: plán implementace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** U změn pravidel ukázat, jak hlasovaly poslanecké kluby (záložka v detailu pravidla) a jednotliví poslanci (statická stránka `/hlasovani/<id>/` s filtrem klubu), z otevřených dat PSP.

**Architecture:** Veřejný skript stáhne otevřená data PSP a pro každé hlasování, na které odkazuje událost pravidla, zapíše snímek `obsah/hlasovani/<id>.yml`. Build snímky validuje (schéma, součty, kluby, vazby na pravidla) a vyrobí z nich záložku „Hlasování (N)“ v detailu pravidla a stránku hlasování. Čisté funkce (čtení PSP, souhrny, filtr) jsou v `src/lib/` a testují se bez sítě.

**Tech Stack:** Astro 7 (statický build), TypeScript, `astro/zod`, `yaml`, `gray-matter`, `fflate` (nová vývojová závislost na rozbalení ZIP), Vitest, Playwright, axe.

**Spec:** `docs/superpowers/specs/2026-11-14-hlasovani-design.md`

## Global Constraints

- Pracovní složka: worktree `C:\Users\reath\Projects\NenechmeVyhnit-hlasovani`, větev `hlasovani`. Nesahat na hlavní složku `NenechmeVyhnit`, ostatní worktree ani na `_koncepty/`.
- Texty pro čtenáře česky se správnou diakritikou, bez hodnotících přívlastků.
- **Žádné svislé posouvání stránky** na velikostech 1256×528, 1342×565, 1342×676, 1896×868 a 390×700 (`VELIKOSTI` v `tests/e2e/pomocne.ts`). Co se nevejde, pokračuje do sloupců a posouvá se do strany.
- **Bez stranických barev** a bez zelené pro „pro“ a červené pro „proti“. Používat jen proměnné palety (`--modra`, `--inkoust`, `--linka`, `--meta`, `--text2`, `--plocha`).
- Id hlasování: `psp-<období>-<schůze>-<číslo>` (regulární výraz `^psp-(\d+)-(\d+)-(\d+)$`).
- Popis hlasování `co`: nejvýš 200 znaků. Typ: `proceduralni` | `obsah`.
- Pevná věta u procedurálního hlasování, doslova: „Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.“
- Snímky `obsah/hlasovani/*.yml` vyrábí jen skript, ručně se neupravují. Fixtures v `tests/fixtures/obsah/hlasovani/` jsou ruční a fiktivní.
- Testovací data jsou fiktivní (vymyšlená jména), skutečné osoby jen v `obsah/`.
- Styly záložky i stránky jen v novém `src/styles/hlasovani.css`. `DetailPravidla.astro` dostane jen položku záložky, panel a řádek v události (soubor mění i souběžné větve).
- **Vitest** spouštět z PowerShellu s cestou s velkým `C:` (z Bash s `/c/...` padá na dvou instancích modulu):
  `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run <soubor>`
- **Playwright** jen přes necommitovaný `playwright.hlasovani.config.ts` (port 4351, vznikne v Tasku 6) z PowerShellu. Před během zkontrolovat porty `netstat -ano | findstr ":4351 :4322"`. Cizí servery nezastavovat.
- Commity: identita repozitáře je nastavená („Posuďte sami“). Každá zpráva končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `git add` vždy s výčtem souborů, nikdy `-A` (necommitovaný config Playwrightu).

## Review Focus

- Detail pravidla otevřený ze seznamu `/pravidla/` (obsah dialogu stáhne skript z `/pravidla/<slug>/`) musí mít záložku Hlasování se styly, ne jen při přímém načtení adresy pravidla. Test je v Tasku 6.
- Kotva v jiném tvaru (`#ODS`, neznámá `#xyz`, prázdná, rozbitá `%E0%A4%A`) musí vybrat klub bez ohledu na velikost písmen, nebo „Všichni“. Nikdy nesmí zůstat prázdný seznam. Testy jsou v Tasku 5 (unit) a Tasku 7 (e2e).
- Na malém okně (1256×528, 390×700) nesmí seznam poslanců splasknout na nulovou výšku, i když `overBezPosouvani` projde (tělo má `overflow: hidden`). Test „aspoň 100 px“ je v Tasku 7.
- Opakované spuštění skriptu na nezměněných datech nesmí vyrobit diff (liší se jen `stazeno`). Unit test je v Tasku 2, ruční ověření v Tasku 3.
- Poslanec, který v den hlasování přestoupil mezi kluby (zařazení má přesnost na hodinu), musí mít klub platný v okamžiku hlasování. Unit test je v Tasku 2.

---

### Task 1: Příprava worktree, slovník klubů a schéma snímku

**Files:**
- Create: `src/lib/hlasovani-kluby.ts`
- Create: `src/lib/schema-hlasovani.ts`
- Modify: `tests/unit/ukazka.ts` (přidat `platnySnimek()`)
- Test: `tests/unit/schema-hlasovani.test.ts`

**Interfaces:**
- Consumes: `datumPresne`, `text` z `src/lib/schema.ts`.
- Produces:
  - `KLUBY: Record<string, { popisek: string; slug: string }>`, `NEZARAZENI: { popisek: 'Nezařazení'; slug: 'nezarazeni' }`, `klub(zkratka: string | null): { popisek: string; slug: string } | undefined`
  - `HLASY` (tuple), `type Hlas`, `TYPY_HLASOVANI`, `type TypHlasovani`, `ID_HLASOVANI: RegExp`
  - `snimekSchema`, `type Snimek`, `type PoslanecVHlasovani`
  - `idSnimku(s: Pick<Snimek, 'komora' | 'obdobi' | 'schuze' | 'cislo'>): string`
  - `nesouladySouctu(s: Pick<Snimek, 'souhrn' | 'poslanci'>): string[]`
  - v `tests/unit/ukazka.ts`: `platnySnimek(): Record<string, unknown>`

- [ ] **Step 1: Závislosti ve worktree**

Worktree je čerstvý a nemá `node_modules`. Nainstalovat vlastní (žádná junction na hlavní složku, při mazání worktree by ji git smazal):

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npm ci
```
Expected: instalace bez chyb.

- [ ] **Step 2: Fiktivní snímek pro testy**

Do `tests/unit/ukazka.ts` přidat na konec:

```ts
/** Fiktivní snímek hlasování: 5 poslanců, 2 kluby a jeden nezařazený. Souhrn sedí se jmenovitými hlasy. */
export function platnySnimek(): Record<string, unknown> {
  return {
    komora: 'psp', obdobi: 10, schuze: 5, cislo: 12, idPsp: 90012,
    datum: '2026-06-12', cas: '10:05', nazevPsp: 'Pořad schůze',
    vysledek: 'prijato', kvorum: 3,
    souhrn: { pro: 2, proti: 1, zdrzel: 0, nehlasoval: 1, prihlaseno: 4 },
    kluby: { ANO2011: 'Fiktivní klub ANO', ODS: 'Fiktivní klub ODS' },
    poslanci: [
      { id: 1, jmeno: 'Adam', prijmeni: 'Alfa', klub: 'ANO2011', hlas: 'pro' },
      { id: 2, jmeno: 'Bára', prijmeni: 'Beta', klub: 'ANO2011', hlas: 'pro' },
      { id: 4, jmeno: 'Dana', prijmeni: 'Delta', klub: null, hlas: 'zdrzel-nehlasoval' },
      { id: 5, jmeno: 'Emil', prijmeni: 'Epsilon', klub: 'ODS', hlas: 'omluven' },
      { id: 3, jmeno: 'Cyril', prijmeni: 'Gama', klub: 'ODS', hlas: 'proti' },
    ],
    stazeno: '2026-11-14',
  };
}
```

- [ ] **Step 3: Napsat padající testy**

`tests/unit/schema-hlasovani.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { snimekSchema, nesouladySouctu, idSnimku, ID_HLASOVANI } from '../../src/lib/schema-hlasovani';
import { klub, KLUBY, NEZARAZENI } from '../../src/lib/hlasovani-kluby';
import { platnySnimek } from './ukazka';

const s = (upravy: (x: any) => void) => { const x: any = platnySnimek(); upravy(x); return x; };
const chyby = (data: unknown) => {
  const r = snimekSchema.safeParse(data);
  return r.success ? [] : r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
};
const p = (x: unknown) => snimekSchema.parse(x);

describe('snimekSchema', () => {
  it('přijme platný snímek', () => expect(chyby(platnySnimek())).toEqual([]));
  it('odmítne neznámý hlas', () => expect(chyby(s(x => { x.poslanci[0].hlas = 'ano'; })).join(' ')).toMatch(/^poslanci\.0\.hlas/));
  it('odmítne neznámé pole (snímek je strict)', () => expect(chyby(s(x => { x.poznamka = 'ručně'; })).length).toBeGreaterThan(0));
  it('odmítne čas v jiném tvaru', () => expect(chyby(s(x => { x.cas = '9:5'; })).join(' ')).toMatch(/HH:MM/));
  it('odmítne jinou komoru než psp', () => expect(chyby(s(x => { x.komora = 'senat'; })).length).toBeGreaterThan(0));
  it('převede datum z YAML (Date) na text', () =>
    expect(p(s(x => { x.datum = new Date('2026-06-12T00:00:00Z'); })).datum).toBe('2026-06-12'));
});

describe('nesouladySouctu', () => {
  it('platný snímek sedí', () => expect(nesouladySouctu(p(platnySnimek()))).toEqual([]));
  it('pro nesedí', () => expect(nesouladySouctu(p(s(x => { x.souhrn.pro = 3; })))).toEqual(['pro: jmenovitě 2, v souhrnu 3']));
  it('kód K se porovná se součtem zdržel se + nehlasoval', () =>
    expect(nesouladySouctu(p(s(x => { x.souhrn.zdrzel = 1; x.souhrn.nehlasoval = 0; })))).toEqual([]));
  it('kódy C a F se porovnají každý zvlášť', () =>
    expect(nesouladySouctu(p(s(x => { x.poslanci[2].hlas = 'zdrzel'; })))).toEqual([
      'zdrželi se: jmenovitě 1, v souhrnu 0',
      'nehlasovali: jmenovitě 0, v souhrnu 1',
    ]));
  it('nepřítomní = poslanci − přihlášení', () =>
    expect(nesouladySouctu(p(s(x => { x.souhrn.prihlaseno = 5; })))).toEqual(['nepřítomní (omluvení a nepřihlášení): jmenovitě 1, v souhrnu 0']));
});

describe('id hlasování', () => {
  it('sestaví id ze snímku', () => expect(idSnimku({ komora: 'psp', obdobi: 10, schuze: 34, cislo: 311 })).toBe('psp-10-34-311'));
  it('tvar id', () => {
    expect(ID_HLASOVANI.test('psp-10-34-311')).toBe(true);
    expect(ID_HLASOVANI.test('psp-10-34')).toBe(false);
    expect(ID_HLASOVANI.test('senat-1-2-3')).toBe(false);
  });
});

describe('slovník klubů', () => {
  it('najde klub podle zkratky PSP', () => expect(klub('ANO2011')).toEqual({ popisek: 'ANO', slug: 'ano' }));
  it('nezařazení mají klub null', () => expect(klub(null)).toBe(NEZARAZENI));
  it('neznámá zkratka ani vlastnost objektu není klub', () => {
    expect(klub('XYZ')).toBeUndefined();
    expect(klub('constructor')).toBeUndefined();
  });
  it('slugy jsou jedinečné, bez diakritiky a nekolidují s id na stránce', () => {
    const slugy = [...Object.values(KLUBY).map(k => k.slug), NEZARAZENI.slug];
    expect(new Set(slugy).size).toBe(slugy.length);
    for (const s of slugy) {
      expect(s).toMatch(/^[a-z0-9-]+$/);
      expect(['obsah', 'detail']).not.toContain(s);
    }
  });
});
```

- [ ] **Step 4: Ověřit, že testy padají**

Run: `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run tests/unit/schema-hlasovani.test.ts`
Expected: FAIL, moduly `schema-hlasovani` a `hlasovani-kluby` neexistují.

- [ ] **Step 5: Slovník klubů**

`src/lib/hlasovani-kluby.ts`:

```ts
export type Klub = { popisek: string; slug: string };

/** Poslanecké kluby podle zkratky v otevřených datech PSP (organy.unl, orgány typu 1). Popisek je krátký tvar
 *  pro web, slug je kotva na stránce hlasování (#ano). Neznámá zkratka je chyba buildu (spec hlasování, oddíl 4). */
export const KLUBY: Record<string, Klub> = {
  ANO2011: { popisek: 'ANO', slug: 'ano' },
  SPD: { popisek: 'SPD', slug: 'spd' },
  MS: { popisek: 'Motoristé', slug: 'motoriste' },
  ODS: { popisek: 'ODS', slug: 'ods' },
  STAN: { popisek: 'STAN', slug: 'stan' },
  'Piráti': { popisek: 'Piráti', slug: 'pirati' },
  'KDU-ČSL': { popisek: 'KDU-ČSL', slug: 'kdu-csl' },
  TOP09: { popisek: 'TOP 09', slug: 'top-09' },
};

/** Poslanec bez klubu má ve snímku klub null. */
export const NEZARAZENI = { popisek: 'Nezařazení', slug: 'nezarazeni' } as const;

export const klub = (zkratka: string | null): Klub | undefined =>
  zkratka === null ? NEZARAZENI : Object.hasOwn(KLUBY, zkratka) ? KLUBY[zkratka] : undefined;
```

- [ ] **Step 6: Schéma snímku a součty**

`src/lib/schema-hlasovani.ts`:

```ts
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
```

- [ ] **Step 7: Ověřit, že testy projdou**

Run: `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run tests/unit/schema-hlasovani.test.ts`
Expected: PASS (všechny testy).

- [ ] **Step 8: Commit**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
git add src/lib/hlasovani-kluby.ts src/lib/schema-hlasovani.ts tests/unit/schema-hlasovani.test.ts tests/unit/ukazka.ts
git commit -F - <<'EOF'
Hlasování: schéma snímku, součty a slovník klubů

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 2: Čtení otevřených dat PSP a sestavení snímku

**Files:**
- Create: `src/lib/psp-data.ts`
- Test: `tests/unit/psp-data.test.ts`

**Interfaces:**
- Consumes: `idSnimku`, `nesouladySouctu`, `snimekSchema`, `ID_HLASOVANI`, `type Hlas`, `type Snimek` (Task 1).
- Produces:
  - `class ChybaPsp extends Error`
  - `ROK_OBDOBI: Readonly<Record<number, number>>` (`{ 10: 2025 }`)
  - `type CilHlasovani = { obdobi: number; schuze: number; cislo: number }`
  - `type VstupPsp = { hlasovani; hlasy; omluvy; zmatecne; osoby; poslanci; organy; zarazeni }` (každé `string[][]`)
  - `dekodujUnl(data: Uint8Array): string`, `ctiUnl(text: string): string[][]`, `datumZPsp(d: string): string`
  - `hlasZKodu(kod: string, omluven: boolean): Hlas`
  - `klubVDobe(idOsoba: string, okamzik: string, kluby: ReadonlyMap<string, string>, clenstvi: string[][]): string | null`
  - `sestavSnimek(v: VstupPsp, cil: CilHlasovani, stazeno: string): Snimek`
  - `snimekNaYaml(s: Snimek): string`, `bezDataStazeni(yaml: string): string`
  - `idHlasovaniZPravidla(data: unknown): string[]`, `rozeberIdHlasovani(id: string): CilHlasovani`

Sloupce tabulek PSP (oddělené `|`, řádek končí `|`):
- `hl2025s.unl`: 0 id_hlasovani, 1 id_organ, 2 schuze, 3 cislo, 4 bod, 5 datum `DD.MM.RRRR`, 6 cas `HH:MM`, 7 pro, 8 proti, 9 zdrzel, 10 nehlasoval, 11 prihlaseno, 12 kvorum, 13 druh (`N` běžné), 14 vysledek (`A` přijato, `R` zamítnuto), 15 nazev_dlouhy, 16 nazev_kratky
- `hl2025h1.unl`: 0 id_poslanec, 1 id_hlasovani, 2 kód hlasu
- `omluvy.unl`: 0 id_organ, 1 id_poslanec, 2 den `DD.MM.RRRR`, 3 od `HH:MM` (prázdné = od začátku dne), 4 do (prázdné = do konce dne)
- `zmatecne.unl`: 0 id_hlasovani
- `osoby.unl`: 0 id_osoba, 1 titul před, 2 příjmení, 3 jméno, …
- `poslanec.unl`: 0 id_poslanec, 1 id_osoba, 2 id_kraj, 3 id_kandidatka, 4 id_obdobi (= id orgánu Sněmovny), …
- `organy.unl`: 0 id_organ, 1 nadřazený orgán, 2 typ orgánu (`1` klub, `11` Sněmovna), 3 zkratka (`PSP10`, `ANO2011`…), 4 název, …
- `zarazeni.unl`: 0 id_osoba, 1 id orgánu, 2 cl_funkce (`0` členství), 3 od `RRRR-MM-DD HH`, 4 do (prázdné = trvá), …

Ověřeno na skutečných datech 14. 11. 2026: hlasování 88616 (34. schůze, č. 32) má A=96, B=63, K=14, @=27 a souhrn 96 | 63 | 5 | 9 | přihlášeno 173.

- [ ] **Step 1: Napsat padající testy**

`tests/unit/psp-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parse as parseYaml } from 'yaml';
import {
  ChybaPsp, ctiUnl, dekodujUnl, datumZPsp, hlasZKodu, klubVDobe, sestavSnimek, snimekNaYaml, bezDataStazeni,
  idHlasovaniZPravidla, rozeberIdHlasovani, type VstupPsp,
} from '../../src/lib/psp-data';
import { snimekSchema } from '../../src/lib/schema-hlasovani';

const ORGAN = '174';
const CIL = { obdobi: 10, schuze: 34, cislo: 311 };
const KLUBY = new Map([['1750', 'ANO2011'], ['1751', 'ODS']]);

/** Syntetická data PSP: 200 poslanců (id_poslanec 1001–1200, id_osoba 1–200), osoby 1–120 v klubu ANO2011,
 *  121–190 v ODS, 191–200 bez klubu. Souhrn hlasování se dopočítá z kódů (K se počítá jako „zdržel se“). */
function vstup(kody: string[] = Array(200).fill('A'), upravy: Partial<VstupPsp> = {}): VstupPsp {
  const n = Array.from({ length: 200 }, (_, i) => i + 1);
  const pocet = (...k: string[]) => String(kody.filter(x => k.includes(x)).length);
  return {
    hlasovani: [['88000', ORGAN, '34', '311', '0', '03.11.2026', '17:14', pocet('A'), pocet('B', 'N'), pocet('C', 'K'), pocet('F'),
      String(200 - Number(pocet('@', 'M'))), '79', 'N', 'A', 'Pořad schůze', '']],
    hlasy: n.map(i => [String(1000 + i), '88000', kody[i - 1]]),
    omluvy: [],
    zmatecne: [],
    osoby: n.map(i => [String(i), '', `Příjmení${String(i).padStart(3, '0')}`, `Jméno${i}`, '', '01.01.1970', 'M', '', '']),
    poslanci: n.map(i => [String(1000 + i), String(i), '1', '1', ORGAN]),
    organy: [[ORGAN, '', '11', 'PSP10', 'Poslanecká sněmovna'], ['1750', ORGAN, '1', 'ANO2011', 'Poslanecký klub ANO 2011'], ['1751', ORGAN, '1', 'ODS', 'Poslanecký klub ODS']],
    zarazeni: n.filter(i => i <= 190).map(i => [String(i), i <= 120 ? '1750' : '1751', '0', '2025-10-08 00', '']),
    ...upravy,
  };
}
const kody = (zmeny: Record<number, string>) => Array.from({ length: 200 }, (_, i) => zmeny[i] ?? 'A');

describe('čtení souborů PSP', () => {
  it('rozdělí řádky a sloupce, zahodí koncové svislítko a prázdné řádky', () =>
    expect(ctiUnl('1|a|b||\r\n\n2|c|d|e|\n')).toEqual([['1', 'a', 'b', ''], ['2', 'c', 'd', 'e']]));
  it('dekóduje windows-1250', () =>
    expect(dekodujUnl(Uint8Array.from([0x50, 0xf8, 0xed, 0x6b, 0x6c, 0x61, 0x64]))).toBe('Příklad'));
  it('převede datum DD.MM.RRRR', () => {
    expect(datumZPsp('03.11.2026')).toBe('2026-11-03');
    expect(() => datumZPsp('3. 11. 2026')).toThrow(ChybaPsp);
  });
});

describe('hlasZKodu', () => {
  it.each([['A', 'pro'], ['B', 'proti'], ['N', 'proti'], ['C', 'zdrzel'], ['F', 'nehlasoval'], ['K', 'zdrzel-nehlasoval'], ['M', 'omluven']])(
    'kód %s → %s', (kod, hlas) => expect(hlasZKodu(kod, false)).toBe(hlas));
  it('@ s omluvou je omluven, bez ní nepřihlášen', () => {
    expect(hlasZKodu('@', true)).toBe('omluven');
    expect(hlasZKodu('@', false)).toBe('neprihlasen');
  });
  it('neznámý kód (W, před složením slibu) je chyba', () => expect(() => hlasZKodu('W', false)).toThrow(/Neznámý kód hlasu „W“/));
});

describe('klubVDobe', () => {
  const clenstvi = [
    ['7', '1750', '0', '2025-10-08 00', '2026-11-03 12'],
    ['7', '1751', '0', '2026-11-03 12', ''],
    ['8', '1750', '0', '2025-10-08 00', '2026-11-03 18'],
  ];
  it('přestup před hlasováním ve stejný den: platí nový klub', () => expect(klubVDobe('7', '2026-11-03 17:14', KLUBY, clenstvi)).toBe('ODS'));
  it('odchod až po hlasování: platí starý klub', () => expect(klubVDobe('8', '2026-11-03 17:14', KLUBY, clenstvi)).toBe('ANO2011'));
  it('po odchodu bez nového klubu: nezařazený', () => expect(klubVDobe('8', '2026-11-04 09:00', KLUBY, clenstvi)).toBeNull());
  it('bez členství: nezařazený', () => expect(klubVDobe('9', '2026-11-03 17:14', KLUBY, clenstvi)).toBeNull());
});

describe('sestavSnimek', () => {
  it('sestaví snímek se souhrnem, kluby a poslanci seřazenými podle české abecedy', () => {
    const s = sestavSnimek(vstup(), CIL, '2026-11-14');
    expect(snimekSchema.parse(s)).toEqual(s);
    expect(s).toMatchObject({ komora: 'psp', obdobi: 10, schuze: 34, cislo: 311, idPsp: 88000, datum: '2026-11-03', cas: '17:14',
      nazevPsp: 'Pořad schůze', vysledek: 'prijato', kvorum: 79, stazeno: '2026-11-14' });
    expect(s.souhrn).toEqual({ pro: 200, proti: 0, zdrzel: 0, nehlasoval: 0, prihlaseno: 200 });
    expect(s.kluby).toEqual({ ANO2011: 'Poslanecký klub ANO 2011', ODS: 'Poslanecký klub ODS' });
    expect(s.poslanci).toHaveLength(200);
    expect(s.poslanci[0]).toEqual({ id: 1, jmeno: 'Jméno1', prijmeni: 'Příjmení001', klub: 'ANO2011', hlas: 'pro' });
    expect(s.poslanci.find(p => p.id === 195)?.klub).toBeNull();
  });
  it('česká abeceda: Ch až za H, Č za C', () => {
    const v = vstup();
    v.osoby[0][2] = 'Chalupa'; v.osoby[1][2] = 'Hora'; v.osoby[2][2] = 'Čáp'; v.osoby[3][2] = 'Cyril';
    const jmena = sestavSnimek(v, CIL, '2026-11-14').poslanci.slice(0, 4).map(p => p.prijmeni);
    expect(jmena).toEqual(['Cyril', 'Čáp', 'Hora', 'Chalupa']);
  });
  it('nepřihlášený s omluvou na čas hlasování je omluven, s omluvou na jiný čas nepřihlášen', () => {
    const v = vstup(kody({ 0: '@', 1: '@', 2: '@' }), {
      omluvy: [[ORGAN, '1001', '03.11.2026', '16:00', '17:30'], [ORGAN, '1002', '03.11.2026', '', ''], [ORGAN, '1003', '03.11.2026', '09:00', '12:00']],
    });
    const hlas = (id: number) => sestavSnimek(v, CIL, '2026-11-14').poslanci.find(p => p.id === id)?.hlas;
    expect([hlas(1), hlas(2), hlas(3)]).toEqual(['omluven', 'omluven', 'neprihlasen']);
  });
  it('K se ve snímku zachová a součty sedí', () => {
    const s = sestavSnimek(vstup(kody({ 0: 'K', 1: 'B' })), CIL, '2026-11-14');
    expect(s.poslanci.filter(p => p.hlas === 'zdrzel-nehlasoval')).toHaveLength(1);
    expect(s.souhrn).toMatchObject({ pro: 198, proti: 1, zdrzel: 1 });
  });
  it.each([
    ['hlasování neexistuje', vstup(), { ...CIL, cislo: 999 }, /hlasování v datech PSP není/],
    ['jiné volební období', vstup(), { ...CIL, obdobi: 9 }, /nepatří do 9\. volebního období/],
    ['zmatečné', vstup(undefined, { zmatecne: [['88000']] }), CIL, /zmatečné/],
    ['ruční hlasování', (() => { const v = vstup(); v.hlasovani[0][13] = 'R'; return v; })(), CIL, /nejde o běžné hlasování/],
    ['neznámý výsledek', (() => { const v = vstup(); v.hlasovani[0][14] = 'X'; return v; })(), CIL, /neznámý výsledek hlasování „X“/],
    ['méně než 200 hlasů', (() => { const v = vstup(); v.hlasy.pop(); return v; })(), CIL, /199 jmenovitých hlasů místo 200/],
    ['neznámý kód hlasu', vstup(kody({ 5: 'W' })), CIL, /Neznámý kód hlasu „W“/],
    ['nesedící součty', (() => { const v = vstup(); v.hlasovani[0][7] = '199'; return v; })(), CIL, /součty nesedí \(pro: jmenovitě 200, v souhrnu 199/],
  ] as const)('chyba: %s', (_, v, cil, hlaska) => expect(() => sestavSnimek(v, cil, '2026-11-14')).toThrow(hlaska));
});

describe('YAML snímku', () => {
  const s = sestavSnimek(vstup(kody({ 0: 'B' })), CIL, '2026-11-14');
  const yaml = snimekNaYaml(s);
  it('po načtení vrátí stejný snímek', () => expect(snimekSchema.parse(parseYaml(yaml))).toEqual(s));
  it('hlavička říká, že soubor vyrábí skript, a obsahuje odkaz k ověření', () => {
    expect(yaml.startsWith('# Vygenerováno skriptem scripts/stahni-hlasovani.ts z otevřených dat PSP. Ručně neupravovat.\n# Ověřit: https://www.psp.cz/sqw/hlasy.sqw?g=88000\n')).toBe(true);
  });
  it('poslanec je na jednom řádku', () => expect(yaml).toMatch(/^ {2}- \{ id: 1, jmeno: Jméno1, prijmeni: Příjmení001, klub: ANO2011, hlas: proti \}$/m));
  it('čas je v uvozovkách', () => expect(yaml).toMatch(/^cas: '17:14'$/m));
  it('dva snímky lišící se jen datem stažení jsou stejné', () =>
    expect(bezDataStazeni(snimekNaYaml({ ...s, stazeno: '2026-11-20' }))).toBe(bezDataStazeni(yaml)));
  it('jiná data se liší', () =>
    expect(bezDataStazeni(snimekNaYaml({ ...s, kvorum: 80 }))).not.toBe(bezDataStazeni(yaml)));
});

describe('id hlasování v pravidlech', () => {
  it('sebere id ze všech událostí', () => expect(idHlasovaniZPravidla({
    udalosti: [{ hlasovani: [{ id: 'psp-10-34-32' }] }, { nazev: 'bez hlasování' }, { hlasovani: [{ id: 'psp-10-34-311' }, { id: 5 }] }],
  })).toEqual(['psp-10-34-32', 'psp-10-34-311']));
  it('bez událostí nic', () => {
    expect(idHlasovaniZPravidla({})).toEqual([]);
    expect(idHlasovaniZPravidla(null)).toEqual([]);
  });
  it('rozebere id', () => expect(rozeberIdHlasovani('psp-10-34-311')).toEqual({ obdobi: 10, schuze: 34, cislo: 311 }));
  it('id v jiném tvaru je chyba', () => expect(() => rozeberIdHlasovani('senat-1-2-3')).toThrow(ChybaPsp));
});
```

- [ ] **Step 2: Ověřit, že testy padají**

Run: `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run tests/unit/psp-data.test.ts`
Expected: FAIL, modul `psp-data` neexistuje.

- [ ] **Step 3: Implementace**

`src/lib/psp-data.ts`:

```ts
import { Document, isMap, isScalar, isSeq } from 'yaml';
import { idSnimku, nesouladySouctu, ID_HLASOVANI, type Hlas, type Snimek } from './schema-hlasovani';

/** Chyba v datech PSP nebo v požadovaném hlasování. Skript ji vypíše a snímek nezapíše. */
export class ChybaPsp extends Error {}

/** Rok v názvu archivu hl-<rok>ps.zip podle volebního období. */
export const ROK_OBDOBI: Readonly<Record<number, number>> = { 10: 2025 };

export type CilHlasovani = { obdobi: number; schuze: number; cislo: number };

/** Tabulky otevřených dat PSP jako řádky rozdělené na sloupce (viz ctiUnl). */
export type VstupPsp = {
  hlasovani: string[][]; // hl<rok>s.unl
  hlasy: string[][];     // hl<rok>h1.unl
  omluvy: string[][];    // omluvy.unl
  zmatecne: string[][];  // zmatecne.unl
  osoby: string[][];     // osoby.unl
  poslanci: string[][];  // poslanec.unl
  organy: string[][];    // organy.unl
  zarazeni: string[][];  // zarazeni.unl
};

/** Soubory otevřených dat PSP jsou v kódování windows-1250. */
export const dekodujUnl = (data: Uint8Array): string => new TextDecoder('windows-1250').decode(data);

/** Řádky .unl: sloupce oddělené svislítkem, řádek končí svislítkem. Prázdné řádky vynechá. */
export function ctiUnl(text: string): string[][] {
  return text.split(/\r?\n/).filter(r => r.trim() !== '').map(r => {
    const sloupce = r.split('|').map(s => s.trim());
    if (sloupce.length > 1 && sloupce[sloupce.length - 1] === '') sloupce.pop();
    return sloupce;
  });
}

export function datumZPsp(d: string): string {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d);
  if (!m) throw new ChybaPsp(`Neznámý tvar data „${d}“ (čekám DD.MM.RRRR)`);
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Převod kódu hlasu PSP (spec hlasování, oddíl 3). Nepřihlášený (@) s omluvou na čas hlasování je omluven. */
export function hlasZKodu(kod: string, omluven: boolean): Hlas {
  switch (kod) {
    case 'A': return 'pro';
    case 'B': case 'N': return 'proti';
    case 'C': return 'zdrzel';
    case 'F': return 'nehlasoval';
    case 'K': return 'zdrzel-nehlasoval';
    case 'M': return 'omluven';
    case '@': return omluven ? 'omluven' : 'neprihlasen';
    default: throw new ChybaPsp(`Neznámý kód hlasu „${kod}“`);
  }
}

/** Zařazení má přesnost na hodinu ('RRRR-MM-DD HH'), okamžik hlasování na minutu ('RRRR-MM-DD HH:MM'). */
const naMinuty = (t: string): string => (t.length === 13 ? `${t}:00` : t);

/** Zkratka klubu, jehož byl poslanec členem v okamžiku hlasování, nebo null (nezařazený).
 *  kluby: id orgánu → zkratka; clenstvi: řádky zarazeni.unl. */
export function klubVDobe(idOsoba: string, okamzik: string, kluby: ReadonlyMap<string, string>, clenstvi: string[][]): string | null {
  let platne: string[] | undefined;
  for (const z of clenstvi) {
    if (z[0] !== idOsoba || z[2] !== '0' || !kluby.has(z[1])) continue;
    const od = naMinuty(z[3]);
    const doKdy = z[4] ? naMinuty(z[4]) : '';
    if (od > okamzik || (doKdy !== '' && okamzik >= doKdy)) continue;
    if (!platne || od > naMinuty(platne[3])) platne = z;
  }
  return platne ? kluby.get(platne[1])! : null;
}

const abeceda = new Intl.Collator('cs');
type Razeni = { prijmeni: string; jmeno: string; id: number };
const poradiPoslancu = (a: Razeni, b: Razeni): number =>
  abeceda.compare(a.prijmeni, b.prijmeni) || abeceda.compare(a.jmeno, b.jmeno) || a.id - b.id;

/** Snímek jednoho hlasování z tabulek PSP (spec hlasování, oddíly 3–5). Při jakékoli nesrovnalosti vyhodí ChybaPsp. */
export function sestavSnimek(v: VstupPsp, cil: CilHlasovani, stazeno: string): Snimek {
  const id = idSnimku({ komora: 'psp', ...cil });
  const radky = v.hlasovani.filter(r => Number(r[2]) === cil.schuze && Number(r[3]) === cil.cislo);
  if (radky.length === 0) throw new ChybaPsp(`${id}: hlasování v datech PSP není`);
  if (radky.length > 1) throw new ChybaPsp(`${id}: v datech PSP je víc hlasování se stejnou schůzí a číslem`);
  const h = radky[0];
  const idHlasovani = h[0];
  const idOrganu = h[1];
  if (v.organy.find(o => o[0] === idOrganu)?.[3] !== `PSP${cil.obdobi}`) throw new ChybaPsp(`${id}: hlasování nepatří do ${cil.obdobi}. volebního období`);
  if (v.zmatecne.some(z => z[0] === idHlasovani)) throw new ChybaPsp(`${id}: hlasování je prohlášené za zmatečné`);
  if (h[13] !== 'N') throw new ChybaPsp(`${id}: nejde o běžné hlasování (druh „${h[13]}“), jmenovité hlasy chybí`);
  const vysledek = h[14] === 'A' ? 'prijato' : h[14] === 'R' ? 'zamitnuto' : undefined;
  if (!vysledek) throw new ChybaPsp(`${id}: neznámý výsledek hlasování „${h[14]}“`);
  const datum = datumZPsp(h[5]);
  const cas = h[6];
  const okamzik = `${datum} ${cas}`;

  const klubyObdobi = v.organy.filter(o => o[1] === idOrganu && o[2] === '1');
  const kluby = new Map(klubyObdobi.map(o => [o[0], o[3]] as const));
  const nazvyKlubu = new Map(klubyObdobi.map(o => [o[3], o[4]] as const));
  const clenstvi = v.zarazeni.filter(z => z[2] === '0' && kluby.has(z[1]));
  const osobaPoslance = new Map(v.poslanci.map(p => [p[0], p[1]] as const));
  const osoby = new Map(v.osoby.map(o => [o[0], o] as const));

  const hlasy = v.hlasy.filter(r => r[1] === idHlasovani);
  if (hlasy.length !== 200) throw new ChybaPsp(`${id}: v datech je ${hlasy.length} jmenovitých hlasů místo 200`);
  const omluven = (idPoslance: string) => v.omluvy.some(o => o[0] === idOrganu && o[1] === idPoslance && o[2] === h[5]
    && (!o[3] || o[3] <= cas) && (!o[4] || cas <= o[4]));
  const poslanci = hlasy.map(r => {
    const idPoslance = r[0];
    const idOsoba = osobaPoslance.get(idPoslance);
    const osoba = idOsoba === undefined ? undefined : osoby.get(idOsoba);
    if (idOsoba === undefined || !osoba) throw new ChybaPsp(`${id}: poslanec ${idPoslance} chybí v poslanci.zip`);
    return {
      id: Number(idOsoba),
      jmeno: osoba[3],
      prijmeni: osoba[2],
      klub: klubVDobe(idOsoba, okamzik, kluby, clenstvi),
      hlas: hlasZKodu(r[2], omluven(idPoslance)),
    };
  }).sort(poradiPoslancu);

  const pouziteKluby = [...new Set(poslanci.flatMap(p => (p.klub === null ? [] : [p.klub])))].sort();
  const snimek: Snimek = {
    komora: 'psp', obdobi: cil.obdobi, schuze: cil.schuze, cislo: cil.cislo, idPsp: Number(idHlasovani),
    datum, cas, nazevPsp: h[15] || h[16] || '', vysledek, kvorum: Number(h[12]),
    souhrn: { pro: Number(h[7]), proti: Number(h[8]), zdrzel: Number(h[9]), nehlasoval: Number(h[10]), prihlaseno: Number(h[11]) },
    kluby: Object.fromEntries(pouziteKluby.map(k => [k, nazvyKlubu.get(k)!])),
    poslanci,
    stazeno,
  };
  const nesoulad = nesouladySouctu(snimek);
  if (nesoulad.length) throw new ChybaPsp(`${id}: součty nesedí (${nesoulad.join('; ')})`);
  return snimek;
}

/** YAML snímku: hlavička s upozorněním a odkazem k ověření (lychee ho v CI zkontroluje), poslanec na jednom řádku. */
export function snimekNaYaml(s: Snimek): string {
  const doc = new Document(s);
  doc.commentBefore = ` Vygenerováno skriptem scripts/stahni-hlasovani.ts z otevřených dat PSP. Ručně neupravovat.\n Ověřit: https://www.psp.cz/sqw/hlasy.sqw?g=${s.idPsp}`;
  // čas v uvozovkách: parser YAML 1.1 (gray-matter) by 17:14 přečetl jako šedesátkové číslo
  const cas = doc.get('cas', true);
  if (isScalar(cas)) cas.type = 'QUOTE_SINGLE';
  const souhrn = doc.get('souhrn', true);
  if (isMap(souhrn)) souhrn.flow = true;
  const poslanci = doc.get('poslanci', true);
  if (isSeq(poslanci)) for (const p of poslanci.items) if (isMap(p)) p.flow = true;
  return doc.toString({ lineWidth: 0 });
}

/** Pro porovnání starého a nového snímku: samotné datum stažení není změna dat. */
export const bezDataStazeni = (yaml: string): string => yaml.replace(/^stazeno: .*$/m, '');

/** Id hlasování ze všech událostí pravidla (front matter načtený gray-matter, bez validace schématem). */
export function idHlasovaniZPravidla(data: unknown): string[] {
  const udalosti = (data as { udalosti?: unknown } | null)?.udalosti;
  if (!Array.isArray(udalosti)) return [];
  return udalosti.flatMap(u => {
    const hl = (u as { hlasovani?: unknown } | null)?.hlasovani;
    if (!Array.isArray(hl)) return [];
    return hl.flatMap(x => {
      const id = (x as { id?: unknown } | null)?.id;
      return typeof id === 'string' ? [id] : [];
    });
  });
}

export function rozeberIdHlasovani(id: string): CilHlasovani {
  const m = ID_HLASOVANI.exec(id);
  if (!m) throw new ChybaPsp(`Id hlasování „${id}“ nemá tvar psp-<období>-<schůze>-<číslo>`);
  return { obdobi: Number(m[1]), schuze: Number(m[2]), cislo: Number(m[3]) };
}
```

- [ ] **Step 4: Ověřit, že testy projdou**

Run: `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run tests/unit/psp-data.test.ts`
Expected: PASS. Kdyby test „poslanec je na jednom řádku“ padal kvůli jinému formátu flow mapy (např. bez mezer u závorek), upravit volby `doc.toString` (`flowCollectionPadding: true`), ne test.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
git add src/lib/psp-data.ts tests/unit/psp-data.test.ts
git commit -F - <<'EOF'
Hlasování: čtení otevřených dat PSP a sestavení snímku

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Skript `npm run hlasovani`

**Files:**
- Create: `scripts/stahni-hlasovani.ts`
- Modify: `package.json` (skript `hlasovani`, vývojová závislost `fflate`), `package-lock.json`

**Interfaces:**
- Consumes: z `src/lib/psp-data.ts` (Task 2) `ChybaPsp`, `ROK_OBDOBI`, `bezDataStazeni`, `ctiUnl`, `dekodujUnl`, `idHlasovaniZPravidla`, `rozeberIdHlasovani`, `sestavSnimek`, `snimekNaYaml`, `type VstupPsp`.
- Produces: příkaz `npm run hlasovani [-- --znovu] [-- --obsah <adresář>]`, který zapisuje `<obsah>/hlasovani/<id>.yml`.

- [ ] **Step 1: Závislost a příkaz**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npm install --save-dev fflate
```
Do `package.json` do `scripts` za `"over"` přidat:

```json
    "hlasovani": "tsx scripts/stahni-hlasovani.ts",
```

- [ ] **Step 2: Skript**

`scripts/stahni-hlasovani.ts`:

```ts
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { unzipSync } from 'fflate';
import {
  ChybaPsp, ROK_OBDOBI, bezDataStazeni, ctiUnl, dekodujUnl, idHlasovaniZPravidla, rozeberIdHlasovani,
  sestavSnimek, snimekNaYaml, type VstupPsp,
} from '../src/lib/psp-data';

/** Snímky hlasování z otevřených dat PSP pro všechna hlasování, na která odkazují události pravidel
 *  (spec hlasování, oddíl 5). Použití: npm run hlasovani [-- --znovu] [-- --obsah <adresář>] */
const OPENDATA = 'https://www.psp.cz/eknih/cdrom/opendata';
const argumenty = process.argv.slice(2);
const znovu = argumenty.includes('--znovu');
const iObsah = argumenty.indexOf('--obsah');
const adresar = iObsah >= 0 ? argumenty[iObsah + 1] : 'obsah';
if (!adresar || adresar.startsWith('--')) {
  console.error('Za --obsah chybí adresář obsahu.');
  process.exit(1);
}

const d = new Date();
const dnes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function stahniZip(soubor: string): Promise<Record<string, Uint8Array>> {
  const odpoved = await fetch(`${OPENDATA}/${soubor}`);
  if (!odpoved.ok) throw new Error(`Stažení ${soubor} selhalo: HTTP ${odpoved.status}`);
  return unzipSync(new Uint8Array(await odpoved.arrayBuffer()));
}

function tabulka(zip: Record<string, Uint8Array>, nazev: string): string[][] {
  const data = zip[nazev];
  if (!data) throw new Error(`V archivu chybí soubor ${nazev}`);
  return ctiUnl(dekodujUnl(data));
}

const slozkaPravidel = join(adresar, 'pravidla');
const slozkaHlasovani = join(adresar, 'hlasovani');
const ids = [...new Set((existsSync(slozkaPravidel) ? readdirSync(slozkaPravidel) : [])
  .filter(f => f.endsWith('.md'))
  .flatMap(f => idHlasovaniZPravidla(matter(readFileSync(join(slozkaPravidel, f), 'utf8')).data)))].sort();
const kZapsani = ids.filter(id => znovu || !existsSync(join(slozkaHlasovani, `${id}.yml`)));
if (kZapsani.length === 0) {
  console.log(`Všech ${ids.length} odkazovaných hlasování už má snímek v „${slozkaHlasovani}“.`);
  process.exit(0);
}

const poslanciZip = await stahniZip('poslanci.zip');
const spolecne = {
  osoby: tabulka(poslanciZip, 'osoby.unl'),
  poslanci: tabulka(poslanciZip, 'poslanec.unl'),
  organy: tabulka(poslanciZip, 'organy.unl'),
  zarazeni: tabulka(poslanciZip, 'zarazeni.unl'),
};
const vstupy = new Map<number, VstupPsp>();
mkdirSync(slozkaHlasovani, { recursive: true });
let chyb = 0;
for (const id of kZapsani) {
  try {
    const cil = rozeberIdHlasovani(id);
    const rok = ROK_OBDOBI[cil.obdobi];
    if (!rok) throw new ChybaPsp(`${id}: neznámý rok archivu pro ${cil.obdobi}. období (doplňte ROK_OBDOBI v src/lib/psp-data.ts)`);
    if (!vstupy.has(rok)) {
      const zip = await stahniZip(`hl-${rok}ps.zip`);
      vstupy.set(rok, {
        ...spolecne,
        hlasovani: tabulka(zip, `hl${rok}s.unl`),
        hlasy: tabulka(zip, `hl${rok}h1.unl`),
        omluvy: tabulka(zip, 'omluvy.unl'),
        zmatecne: tabulka(zip, 'zmatecne.unl'),
      });
    }
    const snimek = sestavSnimek(vstupy.get(rok)!, cil, dnes);
    const soubor = join(slozkaHlasovani, `${id}.yml`);
    const yaml = snimekNaYaml(snimek);
    if (existsSync(soubor) && bezDataStazeni(readFileSync(soubor, 'utf8')) === bezDataStazeni(yaml)) {
      console.log(`${id}: beze změny`);
      continue;
    }
    writeFileSync(soubor, yaml);
    console.log(`${id}: ${snimek.vysledek === 'prijato' ? 'přijato' : 'zamítnuto'} ${snimek.souhrn.pro} : ${snimek.souhrn.proti} → ${soubor}`);
  } catch (e) {
    if (!(e instanceof ChybaPsp)) throw e;
    chyb++;
    console.error(e.message);
  }
}
if (chyb) {
  console.error(`\n${chyb} z ${kZapsani.length} hlasování se nepodařilo zapsat.`);
  process.exit(1);
}
```

- [ ] **Step 3: Ruční ověření na skutečných datech (síť, psp.cz)**

Bash (data i výstup jen v dočasné složce mimo repozitář):

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
T=$(mktemp -d) && mkdir -p "$T/pravidla"
printf -- '---\nudalosti:\n  - hlasovani: [{ id: psp-10-34-32 }]\n---\n' > "$T/pravidla/zkouska.md"
npm run hlasovani -- --obsah "$T"
head -16 "$T/hlasovani/psp-10-34-32.yml"; grep -c '^  - {' "$T/hlasovani/psp-10-34-32.yml"
npm run hlasovani -- --obsah "$T" --znovu
```
Expected:
- první běh vypíše `psp-10-34-32: přijato 96 : 63 → …`,
- hlavička obsahuje `# Ověřit: https://www.psp.cz/sqw/hlasy.sqw?g=88616`, `souhrn: { pro: 96, proti: 63, zdrzel: 5, nehlasoval: 9, prihlaseno: 173 }`, `kvorum: 87`, `datum: 2026-10-13`,
- `grep -c` vypíše `200`,
- druhý běh s `--znovu` vypíše `psp-10-34-32: beze změny`.

Kontrola neexistujícího hlasování (skript musí skončit chybou s kódem 1):

```bash
printf -- '---\nudalosti:\n  - hlasovani: [{ id: psp-10-34-99999 }]\n---\n' > "$T/pravidla/zkouska.md"
npm run hlasovani -- --obsah "$T"; echo "kód: $?"
```
Expected: `psp-10-34-99999: hlasování v datech PSP není`, `kód: 1`.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
git add scripts/stahni-hlasovani.ts package.json package-lock.json
git commit -F - <<'EOF'
Hlasování: skript npm run hlasovani stahuje snímky z otevřených dat PSP

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Pole `hlasovani` u události a kontroly při buildu

**Files:**
- Modify: `src/lib/schema-pravidla.ts` (pole `hlasovani` v `udalostPravidlaSchema`, kontrola duplicit v `superRefine`)
- Create: `src/lib/validace-hlasovani.ts`
- Modify: `src/lib/validace.ts` (`overAdresar` načte a ověří snímky, vrátí `hlasovani`)
- Modify: `src/lib/kauzy.ts` (`nactiHlasovani`)
- Modify: `scripts/over-obsah.ts` (počet hlasování ve výpisu)
- Test: `tests/unit/schema-pravidla.test.ts` (nový `describe`), `tests/unit/validace-hlasovani.test.ts`

**Interfaces:**
- Consumes: `snimekSchema`, `nesouladySouctu`, `idSnimku`, `TYPY_HLASOVANI`, `ID_HLASOVANI`, `type Snimek` (Task 1), `klub` (Task 1).
- Produces:
  - `UdalostPravidla['hlasovani']: { id: string; typ: TypHlasovani; co: string }[]` (výchozí `[]`)
  - `overSnimek(soubor: string, data: unknown): { snimek?: Snimek; chyby: Chyba[] }`
  - `nactiSnimky(adresar: string): { snimky: Map<string, Snimek>; chyby: Chyba[] }`
  - `overHlasovaniPravidel(adresar: string, pravidla: PravidloZaznam[], snimky: Map<string, Snimek>): { chyby: Chyba[]; varovani: Chyba[]; odkazovane: Set<string> }`
  - `overAdresar(...)` vrací navíc `hlasovani: Map<string, Snimek>` (jen odkazované snímky)
  - `nactiHlasovani(): Map<string, Snimek>` v `src/lib/kauzy.ts`

- [ ] **Step 1: Padající testy schématu pravidla**

Na konec `tests/unit/schema-pravidla.test.ts` přidat (pomocné `chyby`, `cesty`, `s` v souboru už jsou):

```ts
describe('hlasování u události', () => {
  const HL = { id: 'psp-10-34-311', typ: 'proceduralni', co: 'Návrh zařadit bod na pořad schůze' };
  const sHl = (hl: unknown[]) => s(p => { p.udalosti[0].hlasovani = hl; });
  it('bez hlasování je pole prázdné', () => expect(pravidloSchema.parse(platnePravidlo()).udalosti[0].hlasovani).toEqual([]));
  it('přijme platné hlasování', () => expect(chyby(sHl([HL]))).toEqual([]));
  it('odmítne id v jiném tvaru', () => expect(chyby(sHl([{ ...HL, id: 'psp-10-34' }])).join(' ')).toMatch(/psp-<období>-<schůze>-<číslo>/));
  it('odmítne neznámý typ', () => expect(cesty(sHl([{ ...HL, typ: 'jine' }]))).toEqual(['udalosti.0.hlasovani.0.typ']));
  it('odmítne popis „co“ delší než 200 znaků', () => expect(chyby(sHl([{ ...HL, co: 'x'.repeat(201) }])).join(' ')).toMatch(/nejvýš 200 znaků/));
  it('odmítne stejné hlasování u pravidla dvakrát', () =>
    expect(chyby(sHl([HL, HL])).join(' ')).toMatch(/Hlasování „psp-10-34-311“ je u pravidla uvedeno dvakrát/));
});
```

- [ ] **Step 2: Padající testy kontrol**

`tests/unit/validace-hlasovani.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { overSnimek, overHlasovaniPravidel } from '../../src/lib/validace-hlasovani';
import { overAdresar, type PravidloZaznam } from '../../src/lib/validace';
import { pravidloSchema } from '../../src/lib/schema-pravidla';
import { snimekSchema, type Snimek } from '../../src/lib/schema-hlasovani';
import { platnePravidlo, platnySnimek } from './ukazka';

const SOUBOR = join('obsah', 'hlasovani', 'psp-10-5-12.yml');
const HL = { id: 'psp-10-5-12', typ: 'proceduralni', co: 'Fiktivní návrh na pořad schůze' };
const udalost = (hlasovani: unknown[], datum = '2026-06-10') =>
  ({ datum, krok: 'predlozeno', nazev: 'Návrh podán', popis: 'Fiktivní poslanci podali návrh.', zdroje: [1], hlasovani });
const pravidlo = (slug: string, hlasovani: unknown[], datum?: string): PravidloZaznam =>
  ({ slug, telo: '', pravidlo: pravidloSchema.parse({ ...platnePravidlo(), udalosti: [udalost(hlasovani, datum)] }) });
const snimky = (): Map<string, Snimek> => new Map([['psp-10-5-12', snimekSchema.parse(platnySnimek())]]);

describe('overSnimek', () => {
  it('platný snímek', () => {
    const r = overSnimek(SOUBOR, platnySnimek());
    expect(r.chyby).toEqual([]);
    expect(r.snimek?.cislo).toBe(12);
  });
  it('název souboru musí odpovídat hlasování', () =>
    expect(overSnimek(join('obsah', 'hlasovani', 'psp-10-5-13.yml'), platnySnimek()).chyby[0].zprava).toMatch(/neodpovídá hlasování \(psp-10-5-12\)/));
  it('nesedící součty', () =>
    expect(overSnimek(SOUBOR, { ...platnySnimek(), souhrn: { pro: 3, proti: 1, zdrzel: 0, nehlasoval: 1, prihlaseno: 4 } }).chyby.map(c => c.zprava))
      .toEqual(['Součty nesedí: pro: jmenovitě 2, v souhrnu 3']));
  it('neznámý klub se nahlásí jednou, i když ho má víc poslanců', () => {
    const x: any = platnySnimek();
    x.kluby.XYZ = 'Fiktivní klub';
    x.poslanci[0].klub = 'XYZ';
    x.poslanci[1].klub = 'XYZ';
    expect(overSnimek(SOUBOR, x).chyby.map(c => c.zprava)).toEqual(['Neznámý klub „XYZ“ (doplňte klub do src/lib/hlasovani-kluby.ts)']);
  });
  it('klub poslance chybí v seznamu klubů snímku', () => {
    const x: any = platnySnimek();
    delete x.kluby.ODS;
    expect(overSnimek(SOUBOR, x).chyby.map(c => c.zprava)).toEqual(['Klub „ODS“ chybí v seznamu klubů hlasování']);
  });
  it('chyba schématu nese cestu k poli', () =>
    expect(overSnimek(SOUBOR, { ...platnySnimek(), vysledek: 'ano' }).chyby[0].zprava).toMatch(/^vysledek:/));
});

describe('overHlasovaniPravidel', () => {
  it('odkaz na existující snímek: bez chyb, snímek je odkazovaný', () => {
    const r = overHlasovaniPravidel('obsah', [pravidlo('a', [HL])], snimky());
    expect(r.chyby).toEqual([]);
    expect(r.varovani).toEqual([]);
    expect([...r.odkazovane]).toEqual(['psp-10-5-12']);
  });
  it('chybějící snímek radí spustit skript', () => {
    const r = overHlasovaniPravidel('obsah', [pravidlo('a', [{ ...HL, id: 'psp-10-5-99' }])], snimky());
    expect(r.chyby).toHaveLength(1);
    expect(r.chyby[0].zprava).toMatch(/^Hlasování „psp-10-5-99“ nemá snímek .*\(spusťte npm run hlasovani\)$/);
    expect(r.chyby[0].soubor).toBe(join('obsah', 'pravidla', 'a.md'));
  });
  it('hlasování dřív než událost', () =>
    expect(overHlasovaniPravidel('obsah', [pravidlo('a', [HL], '2026-06-13')], snimky()).chyby[0].zprava)
      .toBe('Hlasování „psp-10-5-12“ (2026-06-12) je dřív než událost „Návrh podán“ (2026-06-13)'));
  it('událost s přesností na měsíc: hlasování ve stejném měsíci projde, v předchozím ne', () => {
    expect(overHlasovaniPravidel('obsah', [pravidlo('a', [HL], '2026-06')], snimky()).chyby).toEqual([]);
    expect(overHlasovaniPravidel('obsah', [pravidlo('a', [HL], '2026-07')], snimky()).chyby).toHaveLength(1);
  });
  it('dvě pravidla s různým typem téhož hlasování', () =>
    expect(overHlasovaniPravidel('obsah', [pravidlo('a', [HL]), pravidlo('b', [{ ...HL, typ: 'obsah' }])], snimky()).chyby.map(c => c.zprava))
      .toEqual(['Hlasování „psp-10-5-12“ má typ „obsah“, ale pravidlo „a“ mu dává „proceduralni“']));
  it('snímek bez odkazu je jen varování', () => {
    const r = overHlasovaniPravidel('obsah', [], snimky());
    expect(r.chyby).toEqual([]);
    expect(r.varovani.map(v => v.zprava)).toEqual(['Na hlasování neodkazuje žádné pravidlo (stránka se nevygeneruje)']);
  });
});

describe('overAdresar s hlasováním', () => {
  const adresar = () => {
    const d = mkdtempSync(join(tmpdir(), 'nv-hl-'));
    mkdirSync(join(d, 'pravidla'));
    mkdirSync(join(d, 'hlasovani'));
    writeFileSync(join(d, 'stitky.yml'), 'dotace: Dotace\n');
    return d;
  };
  const zapisPravidlo = (d: string, hlasovani: unknown[]) =>
    writeFileSync(join(d, 'pravidla', 'novela-a.md'), `---\n${stringify({ ...platnePravidlo(), udalosti: [udalost(hlasovani)] })}---\n`);

  it('vrátí jen odkazované snímky, neodkazovaný nahlásí varováním', () => {
    const d = adresar();
    zapisPravidlo(d, [HL]);
    writeFileSync(join(d, 'hlasovani', 'psp-10-5-12.yml'), stringify(platnySnimek()));
    writeFileSync(join(d, 'hlasovani', 'psp-10-5-13.yml'), stringify({ ...platnySnimek(), cislo: 13 }));
    const r = overAdresar(d);
    expect(r.chyby).toEqual([]);
    expect([...r.hlasovani.keys()]).toEqual(['psp-10-5-12']);
    expect(r.varovani.map(v => v.zprava)).toContain('Na hlasování neodkazuje žádné pravidlo (stránka se nevygeneruje)');
  });
  it('chybějící snímek je chyba buildu', () => {
    const d = adresar();
    zapisPravidlo(d, [HL]);
    expect(overAdresar(d).chyby.map(c => c.zprava).join(' ')).toMatch(/spusťte npm run hlasovani/);
  });
  it('nečitelný YAML snímku je chyba, ne pád', () => {
    const d = adresar();
    writeFileSync(join(d, 'hlasovani', 'psp-10-5-12.yml'), 'komora: [psp\n');
    expect(overAdresar(d).chyby[0].zprava).toMatch(/^Snímek hlasování nejde přečíst/);
  });
  it('archiv bez složky hlasovani nemá hlasování', () => {
    const r = overAdresar('tests/fixtures/prazdny');
    expect(r.chyby).toEqual([]);
    expect(r.hlasovani.size).toBe(0);
  });
});
```

- [ ] **Step 3: Ověřit, že testy padají**

Run: `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run tests/unit/schema-pravidla.test.ts tests/unit/validace-hlasovani.test.ts`
Expected: FAIL (modul `validace-hlasovani` neexistuje, schéma pole `hlasovani` nezná).

- [ ] **Step 4: Schéma pravidla**

V `src/lib/schema-pravidla.ts`:

Import doplnit pod stávající importy:

```ts
import { TYPY_HLASOVANI, ID_HLASOVANI } from './schema-hlasovani';
```

Řádek `export const udalostPravidlaSchema = udalostSchema.extend({ krok: z.enum(KROKY).optional() }).strict();` nahradit:

```ts
/** Hlasování k události (spec hlasování, oddíl 4). Snímek dat je v obsah/hlasovani/<id>.yml. */
const hlasovaniUdalostiSchema = z.object({
  id: z.string().regex(ID_HLASOVANI, 'Id hlasování musí mít tvar psp-<období>-<schůze>-<číslo>'),
  typ: z.enum(TYPY_HLASOVANI),
  co: text().max(200, 'Popis hlasování „co“ smí mít nejvýš 200 znaků'),
}).strict();

export const udalostPravidlaSchema = udalostSchema.extend({
  krok: z.enum(KROKY).optional(),
  hlasovani: z.array(hlasovaniUdalostiSchema).default([]),
}).strict();
```

V `superRefine` hned za blok `p.kauzy.map(k => k.kauza)…forEach(x => chyba(\`Vazba na kauzu „${x}“ je uvedena dvakrát\`));` přidat:

```ts
    p.udalosti.flatMap(u => u.hlasovani.map(h => h.id))
      .filter((x, i, a) => a.indexOf(x) !== i)
      .forEach(x => chyba(`Hlasování „${x}“ je u pravidla uvedeno dvakrát`));
```

- [ ] **Step 5: Kontroly snímků a vazeb**

`src/lib/validace-hlasovani.ts`:

```ts
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { snimekSchema, nesouladySouctu, idSnimku, type Snimek } from './schema-hlasovani';
import { klub } from './hlasovani-kluby';
import type { Chyba, PravidloZaznam } from './validace';

/** Jeden snímek hlasování: schéma, název souboru, součty a kluby (spec hlasování, oddíl 6). */
export function overSnimek(soubor: string, data: unknown): { snimek?: Snimek; chyby: Chyba[] } {
  const r = snimekSchema.safeParse(data);
  if (!r.success) return { chyby: r.error.issues.map(i => ({ soubor, zprava: `${i.path.join('.') || 'hlasování'}: ${i.message}` })) };
  const s = r.data;
  const zpravy = new Set<string>();
  if (idSnimku(s) !== basename(soubor, '.yml')) zpravy.add(`Název souboru neodpovídá hlasování (${idSnimku(s)})`);
  for (const n of nesouladySouctu(s)) zpravy.add(`Součty nesedí: ${n}`);
  for (const p of s.poslanci) {
    if (p.klub === null) continue;
    if (!klub(p.klub)) zpravy.add(`Neznámý klub „${p.klub}“ (doplňte klub do src/lib/hlasovani-kluby.ts)`);
    else if (!Object.hasOwn(s.kluby, p.klub)) zpravy.add(`Klub „${p.klub}“ chybí v seznamu klubů hlasování`);
  }
  const chyby = [...zpravy].map(zprava => ({ soubor, zprava }));
  return chyby.length ? { chyby } : { snimek: s, chyby };
}

export function nactiSnimky(adresar: string): { snimky: Map<string, Snimek>; chyby: Chyba[] } {
  const slozka = join(adresar, 'hlasovani');
  const snimky = new Map<string, Snimek>();
  const chyby: Chyba[] = [];
  if (!existsSync(slozka)) return { snimky, chyby };
  for (const f of readdirSync(slozka).filter(f => f.endsWith('.yml')).sort()) {
    const soubor = join(slozka, f);
    let data: unknown;
    try { data = parseYaml(readFileSync(soubor, 'utf8')); } catch (e) {
      chyby.push({ soubor, zprava: `Snímek hlasování nejde přečíst: ${(e as Error).message}` });
      continue;
    }
    const r = overSnimek(soubor, data);
    chyby.push(...r.chyby);
    if (r.snimek) snimky.set(basename(f, '.yml'), r.snimek);
  }
  return { snimky, chyby };
}

/** Odkazy událostí pravidel na snímky (spec hlasování, oddíl 6). */
export function overHlasovaniPravidel(adresar: string, pravidla: PravidloZaznam[], snimky: Map<string, Snimek>): { chyby: Chyba[]; varovani: Chyba[]; odkazovane: Set<string> } {
  const chyby: Chyba[] = [];
  const varovani: Chyba[] = [];
  const odkazovane = new Set<string>();
  const typy = new Map<string, { typ: string; slug: string }>();
  for (const z of pravidla) {
    const soubor = join(adresar, 'pravidla', `${z.slug}.md`);
    for (const u of z.pravidlo.udalosti) for (const h of u.hlasovani) {
      odkazovane.add(h.id);
      const s = snimky.get(h.id);
      if (!s) {
        chyby.push({ soubor, zprava: `Hlasování „${h.id}“ nemá snímek v ${join(adresar, 'hlasovani')} (spusťte npm run hlasovani)` });
        continue;
      }
      if (s.datum.slice(0, u.datum.length) < u.datum) chyby.push({ soubor, zprava: `Hlasování „${h.id}“ (${s.datum}) je dřív než událost „${u.nazev}“ (${u.datum})` });
      const prvni = typy.get(h.id);
      if (!prvni) typy.set(h.id, { typ: h.typ, slug: z.slug });
      else if (prvni.typ !== h.typ) chyby.push({ soubor, zprava: `Hlasování „${h.id}“ má typ „${h.typ}“, ale pravidlo „${prvni.slug}“ mu dává „${prvni.typ}“` });
    }
  }
  for (const id of snimky.keys()) {
    if (!odkazovane.has(id)) varovani.push({ soubor: join(adresar, 'hlasovani', `${id}.yml`), zprava: 'Na hlasování neodkazuje žádné pravidlo (stránka se nevygeneruje)' });
  }
  return { chyby, varovani, odkazovane };
}
```

- [ ] **Step 6: Napojení do `overAdresar`, `kauzy.ts` a `over-obsah.ts`**

`src/lib/validace.ts`:
- import doplnit: `import { nactiSnimky, overHlasovaniPravidel } from './validace-hlasovani';` a `import type { Snimek } from './schema-hlasovani';`
- návratový typ `overAdresar` rozšířit o `hlasovani: Map<string, Snimek>`:

```ts
export function overAdresar(adresar: string, rezim: Rezim = {}): { zaznamy: KauzaZaznam[]; pravidla: PravidloZaznam[]; hlasovani: Map<string, Snimek>; stitky: Map<string, string>; akteri: Map<string, Akter>; chyby: Chyba[]; varovani: Chyba[] } {
```
- za řádek `chyby.push(...vazbyPravidel.chyby);` přidat:

```ts
  const snimky = nactiSnimky(adresar);
  chyby.push(...snimky.chyby);
  const odkazy = overHlasovaniPravidel(adresar, vazbyPravidel.pravidla, snimky.snimky);
  chyby.push(...odkazy.chyby);
```
- do vráceného objektu přidat `hlasovani: new Map([...snimky.snimky].filter(([id]) => odkazy.odkazovane.has(id))),` a `varovani` rozšířit: `varovani: [...vazby.varovani, ...vazbyPravidel.varovani, ...odkazy.varovani],`

`src/lib/kauzy.ts`: import `import type { Snimek } from './schema-hlasovani';` a pod `nactiPravidla` přidat:

```ts
/** Snímky hlasování, na které odkazuje aspoň jedno pravidlo (klíč je id hlasování, např. psp-10-34-311). */
export const nactiHlasovani = (): Map<string, Snimek> => nacti().hlasovani;
```

`scripts/over-obsah.ts`: destrukturovat i `hlasovani` a poslední výpis nahradit:

```ts
console.log(`Obsah v pořádku: ${sklonuj(zaznamy.length, ['kauza', 'kauzy', 'kauz'])}, ${sklonuj(pravidla.length, ['pravidlo', 'pravidla', 'pravidel'])} a ${sklonuj(hlasovani.size, ['hlasování', 'hlasování', 'hlasování'])} v „${adresar}“.`);
```

- [ ] **Step 7: Ověřit testy a skutečný obsah**

Run: `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run`
Expected: PASS celé sady (nové i stávající testy).

Run (Bash): `cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani && npm run over`
Expected: `Obsah v pořádku: … kauz, 4 pravidla a 0 hlasování v „obsah“.`

- [ ] **Step 8: Commit**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
git add src/lib/schema-pravidla.ts src/lib/validace-hlasovani.ts src/lib/validace.ts src/lib/kauzy.ts scripts/over-obsah.ts tests/unit/schema-pravidla.test.ts tests/unit/validace-hlasovani.test.ts
git commit -F - <<'EOF'
Hlasování: pole hlasovani u události a kontroly snímků při buildu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Odvozené hodnoty pro web

**Files:**
- Create: `src/lib/hlasovani.ts`
- Test: `tests/unit/hlasovani.test.ts`

**Interfaces:**
- Consumes: `type Snimek`, `type PoslanecVHlasovani`, `type Hlas`, `type TypHlasovani` (Task 1), `klub`, `NEZARAZENI` (Task 1), `sklonuj` (`src/lib/cestina.ts`), `type PravidloZaznam` (`src/lib/validace.ts`).
- Produces:
  - `VETA_PROCEDURALNI: string`, `popisekTypu(t: TypHlasovani): string`, `popisekVysledku(s: Pick<Snimek, 'vysledek'>): string`
  - `nadpisHlasovani(s: Pick<Snimek, 'cislo' | 'schuze'>): string`, `cisloHlasovani(id: string): string`, `odkazPsp(s: Pick<Snimek, 'idPsp'>): string`
  - `type SouhrnKlubu = { zkratka: string | null; popisek: string; slug: string; celkem: number; pro: number; proti: number; zdrzelNehlasoval: number; omluven: number; neprihlasen: number }`
  - `souhrnKlubu(s: Snimek): SouhrnKlubu[]`, `vetaKlubu(k: SouhrnKlubu): string`, `nepritomni(s: Snimek): { omluven: number; neprihlasen: number }`
  - `SKUPINY_HLASU: readonly { hlas: Hlas; nadpis: string }[]`, `skupinyPoslancu(p: PoslanecVHlasovani[]): { hlas: Hlas; nadpis: string; poslanci: PoslanecVHlasovani[] }[]`
  - `type HlasovaniPravidla = { id: string; typ: TypHlasovani; co: string; snimek: Snimek }`, `hlasovaniPravidla(udalosti, snimky): HlasovaniPravidla[]`
  - `type NavazanePravidlo = { slug: string; nazev: string; typ: TypHlasovani; co: string }`, `navazanaPravidla(pravidla: PravidloZaznam[], id: string): NavazanePravidlo[]`
  - `vybranyKlub(hash: string, slugy: readonly string[]): string`

- [ ] **Step 1: Napsat padající testy**

`tests/unit/hlasovani.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  souhrnKlubu, vetaKlubu, nepritomni, skupinyPoslancu, hlasovaniPravidla, navazanaPravidla, vybranyKlub,
  popisekTypu, popisekVysledku, nadpisHlasovani, cisloHlasovani, odkazPsp, VETA_PROCEDURALNI,
} from '../../src/lib/hlasovani';
import { snimekSchema, type Snimek } from '../../src/lib/schema-hlasovani';
import { pravidloSchema } from '../../src/lib/schema-pravidla';
import type { PravidloZaznam } from '../../src/lib/validace';
import { platnePravidlo, platnySnimek } from './ukazka';

const snimek = (upravy: (x: any) => void = () => {}): Snimek => { const x: any = platnySnimek(); upravy(x); return snimekSchema.parse(x); };

describe('souhrnKlubu', () => {
  it('kluby podle počtu poslanců, při shodě podle názvu, nezařazení na konci', () => {
    expect(souhrnKlubu(snimek())).toEqual([
      { zkratka: 'ANO2011', popisek: 'ANO', slug: 'ano', celkem: 2, pro: 2, proti: 0, zdrzelNehlasoval: 0, omluven: 0, neprihlasen: 0 },
      { zkratka: 'ODS', popisek: 'ODS', slug: 'ods', celkem: 2, pro: 0, proti: 1, zdrzelNehlasoval: 0, omluven: 1, neprihlasen: 0 },
      { zkratka: null, popisek: 'Nezařazení', slug: 'nezarazeni', celkem: 1, pro: 0, proti: 0, zdrzelNehlasoval: 1, omluven: 0, neprihlasen: 0 },
    ]);
  });
  it('nezařazení jsou na konci, i když jich je nejvíc', () => {
    const s = snimek(x => { for (const p of x.poslanci) p.klub = null; x.poslanci[0].klub = 'ANO2011'; });
    expect(souhrnKlubu(s).map(k => k.slug)).toEqual(['ano', 'nezarazeni']);
  });
  it('zdržel se, nehlasoval i K se sčítají do jednoho sloupce', () => {
    const s = snimek(x => { x.poslanci[0].hlas = 'zdrzel'; x.poslanci[1].hlas = 'nehlasoval'; x.souhrn = { pro: 0, proti: 1, zdrzel: 1, nehlasoval: 2, prihlaseno: 4 }; });
    expect(souhrnKlubu(s)[0]).toMatchObject({ slug: 'ano', pro: 0, zdrzelNehlasoval: 2 });
  });
});

describe('vetaKlubu', () => {
  const [ano, ods, nez] = souhrnKlubu(snimek());
  it('celá věta pro čtečky', () => {
    expect(vetaKlubu(ano)).toBe('ANO: 2 pro, 0 proti');
    expect(vetaKlubu(ods)).toBe('ODS: 0 pro, 1 proti, 1 omluven');
    expect(vetaKlubu(nez)).toBe('Nezařazení: 0 pro, 0 proti, 1 zdržel se nebo nehlasoval');
  });
  it('skloňování', () => {
    expect(vetaKlubu({ ...nez, zdrzelNehlasoval: 3, omluven: 2, neprihlasen: 5 }))
      .toBe('Nezařazení: 0 pro, 0 proti, 3 zdrželi se nebo nehlasovali, 2 omluveni, 5 nepřihlášeno');
    expect(vetaKlubu({ ...nez, zdrzelNehlasoval: 5, neprihlasen: 1 }))
      .toBe('Nezařazení: 0 pro, 0 proti, 5 zdrželo se nebo nehlasovalo, 1 nepřihlášen');
  });
});

describe('skupiny a nepřítomní', () => {
  it('skupiny v pevném pořadí, prázdné vynechá', () =>
    expect(skupinyPoslancu(snimek().poslanci).map(g => [g.nadpis, g.poslanci.map(p => p.prijmeni)])).toEqual([
      ['Pro', ['Alfa', 'Beta']], ['Proti', ['Gama']], ['Zdržel se nebo nehlasoval', ['Delta']], ['Omluven', ['Epsilon']],
    ]));
  it('omluvení a nepřihlášení zvlášť', () => expect(nepritomni(snimek())).toEqual({ omluven: 1, neprihlasen: 0 }));
});

describe('hlasování pravidla a navázaná pravidla', () => {
  const s12 = snimek();
  const s3 = snimek(x => { x.schuze = 7; x.cislo = 3; x.datum = '2026-09-20'; });
  const snimky = new Map([['psp-10-5-12', s12], ['psp-10-7-3', s3]]);
  const udalosti = [
    { hlasovani: [{ id: 'psp-10-5-12', typ: 'proceduralni' as const, co: 'Pořad' }] },
    { hlasovani: [{ id: 'psp-10-7-3', typ: 'obsah' as const, co: 'Celek' }, { id: 'psp-10-9-9', typ: 'obsah' as const, co: 'Bez snímku' }] },
  ];
  it('od nejnovějšího, bez snímku vynechá', () =>
    expect(hlasovaniPravidla(udalosti, snimky).map(h => [h.id, h.typ, h.co])).toEqual([['psp-10-7-3', 'obsah', 'Celek'], ['psp-10-5-12', 'proceduralni', 'Pořad']]));
  it('pravidla navázaná na hlasování', () => {
    const z = (slug: string, nazev: string, hl: unknown[]): PravidloZaznam => ({ slug, telo: '', pravidlo: pravidloSchema.parse({
      ...platnePravidlo(), nazev, udalosti: [{ datum: '2026-06-10', krok: 'predlozeno', nazev: 'Návrh podán', popis: 'Fiktivní.', zdroje: [1], hlasovani: hl }],
    }) });
    const pravidla = [
      z('a', 'Novela A', [{ id: 'psp-10-5-12', typ: 'proceduralni', co: 'Pořad A' }]),
      z('b', 'Novela B', [{ id: 'psp-10-5-12', typ: 'proceduralni', co: 'Pořad B' }]),
      z('c', 'Novela C', []),
    ];
    expect(navazanaPravidla(pravidla, 'psp-10-5-12')).toEqual([
      { slug: 'a', nazev: 'Novela A', typ: 'proceduralni', co: 'Pořad A' },
      { slug: 'b', nazev: 'Novela B', typ: 'proceduralni', co: 'Pořad B' },
    ]);
  });
});

describe('vybranyKlub', () => {
  const SLUGY = ['ano', 'ods', 'nezarazeni'];
  it.each([['#ods', 'ods'], ['#ODS', 'ods'], ['ods', 'ods'], ['#nezarazeni', 'nezarazeni'], ['#neznamy', ''], ['#', ''], ['', ''], ['#%E0%A4%A', '']])(
    '%s → „%s“', (hash, cekam) => expect(vybranyKlub(hash, SLUGY)).toBe(cekam));
});

describe('popisky', () => {
  it('typ, výsledek, nadpis, číslo, odkaz', () => {
    expect(popisekTypu('proceduralni')).toBe('procedurální');
    expect(popisekTypu('obsah')).toBe('o obsahu');
    expect(popisekVysledku({ vysledek: 'prijato' })).toBe('Přijato');
    expect(popisekVysledku({ vysledek: 'zamitnuto' })).toBe('Zamítnuto');
    expect(nadpisHlasovani({ cislo: 311, schuze: 34 })).toBe('Hlasování č. 311, 34. schůze Poslanecké sněmovny');
    expect(cisloHlasovani('psp-10-34-311')).toBe('311');
    expect(odkazPsp({ idPsp: 88900 })).toBe('https://www.psp.cz/sqw/hlasy.sqw?g=88900');
    expect(VETA_PROCEDURALNI).toBe('Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.');
  });
});
```

- [ ] **Step 2: Ověřit, že testy padají**

Run: `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run tests/unit/hlasovani.test.ts`
Expected: FAIL, modul `hlasovani` neexistuje.

- [ ] **Step 3: Implementace**

`src/lib/hlasovani.ts`:

```ts
import type { Hlas, PoslanecVHlasovani, Snimek, TypHlasovani } from './schema-hlasovani';
import type { PravidloZaznam } from './validace';
import { klub, NEZARAZENI } from './hlasovani-kluby';
import { sklonuj } from './cestina';

export const VETA_PROCEDURALNI = 'Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.';
export const popisekTypu = (t: TypHlasovani): string => (t === 'proceduralni' ? 'procedurální' : 'o obsahu');
export const popisekVysledku = (s: Pick<Snimek, 'vysledek'>): string => (s.vysledek === 'prijato' ? 'Přijato' : 'Zamítnuto');
export const nadpisHlasovani = (s: Pick<Snimek, 'cislo' | 'schuze'>): string => `Hlasování č. ${s.cislo}, ${s.schuze}. schůze Poslanecké sněmovny`;
export const cisloHlasovani = (id: string): string => id.slice(id.lastIndexOf('-') + 1);
export const odkazPsp = (s: Pick<Snimek, 'idPsp'>): string => `https://www.psp.cz/sqw/hlasy.sqw?g=${s.idPsp}`;

export type SouhrnKlubu = {
  zkratka: string | null; popisek: string; slug: string;
  celkem: number; pro: number; proti: number; zdrzelNehlasoval: number; omluven: number; neprihlasen: number;
};

/** Rozpis podle klubů: podle počtu poslanců v hlasování, při shodě podle názvu, nezařazení vždy na konci. */
export function souhrnKlubu(s: Snimek): SouhrnKlubu[] {
  const kluby = new Map<string | null, SouhrnKlubu>();
  for (const p of s.poslanci) {
    let k = kluby.get(p.klub);
    if (!k) {
      const info = klub(p.klub) ?? NEZARAZENI; // neznámou zkratku odmítne validace snímku
      k = { zkratka: p.klub, popisek: info.popisek, slug: info.slug, celkem: 0, pro: 0, proti: 0, zdrzelNehlasoval: 0, omluven: 0, neprihlasen: 0 };
      kluby.set(p.klub, k);
    }
    k.celkem++;
    if (p.hlas === 'pro') k.pro++;
    else if (p.hlas === 'proti') k.proti++;
    else if (p.hlas === 'omluven') k.omluven++;
    else if (p.hlas === 'neprihlasen') k.neprihlasen++;
    else k.zdrzelNehlasoval++;
  }
  return [...kluby.values()].sort((a, b) =>
    Number(a.zkratka === null) - Number(b.zkratka === null) || b.celkem - a.celkem || a.popisek.localeCompare(b.popisek, 'cs'));
}

/** Věta pro čtečky obrazovky, např. „ANO: 62 pro, 0 proti, 3 zdrželi se nebo nehlasovali, 1 omluven“. */
export function vetaKlubu(k: SouhrnKlubu): string {
  const casti = [`${k.pro} pro`, `${k.proti} proti`];
  if (k.zdrzelNehlasoval) casti.push(sklonuj(k.zdrzelNehlasoval, ['zdržel se nebo nehlasoval', 'zdrželi se nebo nehlasovali', 'zdrželo se nebo nehlasovalo']));
  if (k.omluven) casti.push(sklonuj(k.omluven, ['omluven', 'omluveni', 'omluveno']));
  if (k.neprihlasen) casti.push(sklonuj(k.neprihlasen, ['nepřihlášen', 'nepřihlášeni', 'nepřihlášeno']));
  return `${k.popisek}: ${casti.join(', ')}`;
}

export const nepritomni = (s: Snimek): { omluven: number; neprihlasen: number } => ({
  omluven: s.poslanci.filter(p => p.hlas === 'omluven').length,
  neprihlasen: s.poslanci.filter(p => p.hlas === 'neprihlasen').length,
});

/** Skupiny seznamu poslanců v pevném pořadí. */
export const SKUPINY_HLASU: readonly { hlas: Hlas; nadpis: string }[] = [
  { hlas: 'pro', nadpis: 'Pro' },
  { hlas: 'proti', nadpis: 'Proti' },
  { hlas: 'zdrzel', nadpis: 'Zdržel se' },
  { hlas: 'nehlasoval', nadpis: 'Nehlasoval' },
  { hlas: 'zdrzel-nehlasoval', nadpis: 'Zdržel se nebo nehlasoval' },
  { hlas: 'omluven', nadpis: 'Omluven' },
  { hlas: 'neprihlasen', nadpis: 'Nepřihlášen' },
];

/** Poslanci rozdělení podle hlasu (pořadí uvnitř skupiny zachová ze snímku). Prázdné skupiny vynechá. */
export function skupinyPoslancu(poslanci: PoslanecVHlasovani[]): { hlas: Hlas; nadpis: string; poslanci: PoslanecVHlasovani[] }[] {
  return SKUPINY_HLASU.map(g => ({ ...g, poslanci: poslanci.filter(p => p.hlas === g.hlas) })).filter(g => g.poslanci.length > 0);
}

type OdkazNaHlasovani = { id: string; typ: TypHlasovani; co: string };
export type HlasovaniPravidla = OdkazNaHlasovani & { snimek: Snimek };

/** Hlasování pravidla od nejnovějšího (spec hlasování, oddíl 7). Odkaz bez snímku vynechá (veřejný build ho odmítne). */
export function hlasovaniPravidla(udalosti: { hlasovani: OdkazNaHlasovani[] }[], snimky: ReadonlyMap<string, Snimek>): HlasovaniPravidla[] {
  return udalosti
    .flatMap(u => u.hlasovani.flatMap(h => { const snimek = snimky.get(h.id); return snimek ? [{ ...h, snimek }] : []; }))
    .sort((a, b) => `${b.snimek.datum} ${b.snimek.cas}`.localeCompare(`${a.snimek.datum} ${a.snimek.cas}`) || b.snimek.cislo - a.snimek.cislo);
}

export type NavazanePravidlo = { slug: string; nazev: string; typ: TypHlasovani; co: string };

export function navazanaPravidla(pravidla: PravidloZaznam[], id: string): NavazanePravidlo[] {
  return pravidla.flatMap(z => z.pravidlo.udalosti.flatMap(u => u.hlasovani
    .filter(h => h.id === id)
    .map(h => ({ slug: z.slug, nazev: z.pravidlo.nazev, typ: h.typ, co: h.co }))));
}

/** Vybraný klub z kotvy adresy (#ano, bez ohledu na velikost písmen). Neznámá, prázdná nebo rozbitá kotva = všichni (''). */
export function vybranyKlub(hash: string, slugy: readonly string[]): string {
  let s: string;
  try { s = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase(); } catch { return ''; }
  return slugy.includes(s) ? s : '';
}
```

- [ ] **Step 4: Ověřit, že testy projdou**

Run: `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run tests/unit/hlasovani.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
git add src/lib/hlasovani.ts tests/unit/hlasovani.test.ts
git commit -F - <<'EOF'
Hlasování: souhrny podle klubů, skupiny poslanců a výběr klubu z kotvy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: Záložka Hlasování v detailu pravidla

**Files:**
- Create (necommitovat): `playwright.hlasovani.config.ts`
- Create: `tests/fixtures/obsah/hlasovani/psp-10-5-12.yml`, `tests/fixtures/obsah/hlasovani/psp-10-7-3.yml`
- Modify: `tests/fixtures/obsah/pravidla/zakon-omega.md`, `tests/fixtures/obsah/pravidla/pozmenovaci-sigma.md` (pole `hlasovani` u událostí)
- Create: `src/components/ZalozkaHlasovani.astro`, `src/styles/hlasovani.css`
- Modify: `src/components/DetailPravidla.astro`
- Test: `tests/e2e/hlasovani-detail.spec.ts`; upravit `tests/e2e/pravidla-detail.spec.ts`

**Interfaces:**
- Consumes: `nactiHlasovani` (Task 4), `hlasovaniPravidla`, `souhrnKlubu`, `vetaKlubu`, `popisekTypu`, `popisekVysledku`, `cisloHlasovani`, `VETA_PROCEDURALNI`, `type HlasovaniPravidla` (Task 5), `datumText` (`src/lib/casova-osa.ts`).
- Produces: panel `.m2-panel[data-p="hlasovani"]` s bloky `.hl-blok` (`.hl-meta`, `.hl-co`, `.hl-vysledek`, `.hl-kluby a`, `.hl-pata`, `.hl-proc`), řádek `.hl-odkazy` v události Průběhu, třídy v `src/styles/hlasovani.css` (Task 7 je rozšíří).

- [ ] **Step 1: Config Playwrightu pro tento worktree (necommitovat)**

`playwright.hlasovani.config.ts` v kořeni worktree:

```ts
import { defineConfig, devices } from '@playwright/test';

// Jen pro worktree hlasovani: jiné relace drží porty 4321 a 4400. Prázdný archiv testy volají natvrdo na 4322.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4351', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'npx serve dist-e2e -l 4351 --no-clipboard', port: 4351, reuseExistingServer: false },
    { command: 'npx serve dist-prazdny -l 4322 --no-clipboard', port: 4322, reuseExistingServer: true },
  ],
});
```

- [ ] **Step 2: Fiktivní snímky**

`tests/fixtures/obsah/hlasovani/psp-10-5-12.yml`:

```yaml
# Fiktivní hlasování jen pro testy (12 vymyšlených poslanců).
komora: psp
obdobi: 10
schuze: 5
cislo: 12
idPsp: 90012
datum: 2026-06-12
cas: '10:05'
nazevPsp: Pořad schůze
vysledek: prijato
kvorum: 6
souhrn: { pro: 5, proti: 4, zdrzel: 1, nehlasoval: 0, prihlaseno: 10 }
kluby:
  ANO2011: Fiktivní klub ANO
  ODS: Fiktivní klub ODS
  STAN: Fiktivní klub STAN
  Piráti: Fiktivní klub Piráti
poslanci:
  - { id: 1, jmeno: Adam, prijmeni: Alfa, klub: ANO2011, hlas: pro }
  - { id: 2, jmeno: Bára, prijmeni: Beta, klub: ANO2011, hlas: pro }
  - { id: 4, jmeno: Dan, prijmeni: Delta, klub: ANO2011, hlas: pro }
  - { id: 5, jmeno: Eva, prijmeni: Epsilon, klub: ANO2011, hlas: omluven }
  - { id: 7, jmeno: Ema, prijmeni: Éta, klub: ODS, hlas: proti }
  - { id: 3, jmeno: Gustav, prijmeni: Gama, klub: ANO2011, hlas: pro }
  - { id: 12, jmeno: Chrudoš, prijmeni: Chí, klub: null, hlas: pro }
  - { id: 9, jmeno: Ivo, prijmeni: Ióta, klub: STAN, hlas: proti }
  - { id: 10, jmeno: Karel, prijmeni: Kappa, klub: STAN, hlas: neprihlasen }
  - { id: 11, jmeno: Lea, prijmeni: Lambda, klub: Piráti, hlas: proti }
  - { id: 8, jmeno: Tomáš, prijmeni: Théta, klub: ODS, hlas: zdrzel-nehlasoval }
  - { id: 6, jmeno: Zita, prijmeni: Zéta, klub: ODS, hlas: proti }
stazeno: 2026-11-14
```

`tests/fixtures/obsah/hlasovani/psp-10-7-3.yml`:

```yaml
# Fiktivní hlasování jen pro testy (12 vymyšlených poslanců).
komora: psp
obdobi: 10
schuze: 7
cislo: 3
idPsp: 90103
datum: 2026-09-20
cas: '14:30'
nazevPsp: Návrh zákona
vysledek: prijato
kvorum: 6
souhrn: { pro: 7, proti: 3, zdrzel: 0, nehlasoval: 0, prihlaseno: 10 }
kluby:
  ANO2011: Fiktivní klub ANO
  ODS: Fiktivní klub ODS
  STAN: Fiktivní klub STAN
  Piráti: Fiktivní klub Piráti
poslanci:
  - { id: 1, jmeno: Adam, prijmeni: Alfa, klub: ANO2011, hlas: pro }
  - { id: 2, jmeno: Bára, prijmeni: Beta, klub: ANO2011, hlas: pro }
  - { id: 4, jmeno: Dan, prijmeni: Delta, klub: ANO2011, hlas: pro }
  - { id: 5, jmeno: Eva, prijmeni: Epsilon, klub: ANO2011, hlas: pro }
  - { id: 7, jmeno: Ema, prijmeni: Éta, klub: ODS, hlas: proti }
  - { id: 3, jmeno: Gustav, prijmeni: Gama, klub: ANO2011, hlas: pro }
  - { id: 12, jmeno: Chrudoš, prijmeni: Chí, klub: null, hlas: pro }
  - { id: 9, jmeno: Ivo, prijmeni: Ióta, klub: STAN, hlas: proti }
  - { id: 10, jmeno: Karel, prijmeni: Kappa, klub: STAN, hlas: omluven }
  - { id: 11, jmeno: Lea, prijmeni: Lambda, klub: Piráti, hlas: neprihlasen }
  - { id: 8, jmeno: Tomáš, prijmeni: Théta, klub: ODS, hlas: pro }
  - { id: 6, jmeno: Zita, prijmeni: Zéta, klub: ODS, hlas: proti }
stazeno: 2026-11-14
```

Kontrola součtů: psp-10-5-12 pro 5 (Alfa, Beta, Delta, Gama, Chí), proti 4, K 1, nepřítomní 2 = 12 − 10. psp-10-7-3 pro 7, proti 3, nepřítomní 2.

- [ ] **Step 3: Hlasování u fiktivních pravidel**

`tests/fixtures/obsah/pravidla/zakon-omega.md`: obě události nahradit:

```yaml
udalosti:
  - { datum: 2026-06-10, krok: predlozeno, nazev: Návrh podán, popis: Fiktivní poslanci podali návrh., zdroje: [1], hlasovani: [{ id: psp-10-5-12, typ: proceduralni, co: Fiktivní návrh zařadit první čtení na pořad schůze }] }
  - { datum: 2026-09-20, krok: schvaleno-snemovnou, nazev: Schváleno Sněmovnou, popis: Fiktivní sněmovna návrh schválila., zdroje: [1], hlasovani: [{ id: psp-10-7-3, typ: obsah, co: Fiktivní návrh zákona jako celek ve třetím čtení }] }
```

`tests/fixtures/obsah/pravidla/pozmenovaci-sigma.md`: třetí událost (2026-05-14) nahradit:

```yaml
  - { datum: 2026-05-14, krok: zamitnuto, nazev: Návrh zamítnut, popis: Fiktivní sněmovna návrh nepřijala., zdroje: [1], hlasovani: [{ id: psp-10-5-12, typ: proceduralni, co: Fiktivní návrh zařadit první čtení na pořad schůze }] }
```

Ověřit validaci fixtures (Bash): `cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani && NV_OBSAH=tests/fixtures/obsah npm run over`
Expected: `Obsah v pořádku: 6 kauz, 4 pravidla a 2 hlasování v „tests/fixtures/obsah“.`

- [ ] **Step 4: Napsat padající e2e testy**

`tests/e2e/hlasovani-detail.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test('záložka Hlasování: za Průběhem, bloky od nejnovějšího, výsledek a kluby', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await expect(page.getByRole('tab')).toHaveText(['Komu prospívá', 'Kontrola moci', 'Průběh', 'Hlasování (2)', 'Výhrady a stanovisko', 'Zdroje (4)']);
  await page.getByRole('tab', { name: 'Hlasování (2)' }).click();
  const bloky = page.locator('.m2-panel[data-p="hlasovani"] .hl-blok');
  await expect(bloky).toHaveCount(2);
  await expect(bloky.nth(0).locator('.hl-meta')).toHaveText('20. 9. 2026 · hlasování č. 3 · o obsahu');
  await expect(bloky.nth(0).locator('.hl-co')).toHaveText('Fiktivní návrh zákona jako celek ve třetím čtení');
  await expect(bloky.nth(0).locator('.hl-vysledek')).toHaveText('Přijato 7 : 3');
  await expect(bloky.nth(0).locator('.hl-kluby a')).toHaveText(['ANO 5 : 0', 'ODS 1 : 2', 'STAN 0 : 1', 'Piráti 0 : 0', 'Nezařazení 1 : 0']);
  await expect(bloky.nth(0).locator('.hl-proc')).toHaveCount(0);
  await expect(bloky.nth(1).locator('.hl-meta')).toHaveText('12. 6. 2026 · hlasování č. 12 · procedurální');
  await expect(bloky.nth(1).locator('.hl-kluby a')).toHaveText(['ANO 4 : 0', 'ODS 0 : 2', 'STAN 0 : 1', 'Piráti 0 : 1', 'Nezařazení 1 : 0']);
  await expect(bloky.nth(1).locator('.hl-proc')).toHaveText('Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.');
});

test('klub má pro čtečky celou větu a vede na stránku hlasování s kotvou', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Hlasování (2)' }).click();
  const panel = page.locator('.m2-panel[data-p="hlasovani"]');
  await expect(panel.getByRole('link', { name: 'ANO: 4 pro, 0 proti, 1 omluven', exact: true })).toHaveAttribute('href', '/hlasovani/psp-10-5-12/#ano');
  await expect(panel.getByRole('link', { name: 'ODS: 0 pro, 2 proti, 1 zdržel se nebo nehlasoval', exact: true })).toHaveAttribute('href', '/hlasovani/psp-10-5-12/#ods');
  await expect(panel.getByRole('link', { name: 'Všichni poslanci →' }).first()).toHaveAttribute('href', '/hlasovani/psp-10-7-3/');
});

test('Průběh: událost s hlasováním má řádek s odkazem na stránku hlasování', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const udalost = page.locator('.udalosti-seznam > li:not([hidden])');
  await expect(udalost.locator('h3')).toHaveText('Schváleno Sněmovnou');
  await expect(udalost.locator('.hl-odkazy')).toHaveText('Hlasování: č. 3');
  await expect(udalost.locator('.hl-odkazy a')).toHaveAttribute('href', '/hlasovani/psp-10-7-3/');
});

test('pravidlo bez hlasování záložku nemá', async ({ page }) => {
  await page.goto('/pravidla/narizeni-tau/');
  await expect(page.getByRole('tab', { name: /Hlasování/ })).toHaveCount(0);
});

test('detail otevřený ze seznamu (obsah načtený skriptem) má záložku Hlasování se styly', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.locator('.pr-radek[data-slug="zakon-omega"] .pr-btn').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.getByRole('tab', { name: 'Hlasování (2)' }).click();
  const kluby = page.locator('.m2-panel[data-p="hlasovani"] .hl-kluby').first();
  await expect(kluby).toBeVisible();
  expect(await kluby.evaluate(e => getComputedStyle(e).display)).toBe('flex');
});
```

V `tests/e2e/pravidla-detail.spec.ts`:
- v testu „pravidlo s oběma důvody…“ změnit očekávané záložky na `['Komu prospívá', 'Kontrola moci', 'Průběh', 'Hlasování (2)', 'Výhrady a stanovisko', 'Zdroje (4)']`,
- v testu „v žádné záložce detailu pravidla není oříznutý obsah“ změnit dva řádky seznamu na:

```ts
      ['/pravidla/zakon-omega/', [...ZALOZKY, 'Kontrola moci', 'Hlasování (2)']],
      ['/pravidla/pozmenovaci-sigma/', [...ZALOZKY, 'Hlasování (1)']],
```

- [ ] **Step 5: Ověřit, že testy padají**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; netstat -ano | findstr ":4351 :4322"; npm run build:e2e; if ($?) { npx playwright test -c playwright.hlasovani.config.ts tests/e2e/hlasovani-detail.spec.ts }
```
Expected: build projde, testy FAIL (záložka Hlasování neexistuje).

- [ ] **Step 6: Komponenta záložky**

`src/components/ZalozkaHlasovani.astro`:

```astro
---
import type { HlasovaniPravidla } from '../lib/hlasovani';
import { souhrnKlubu, vetaKlubu, popisekTypu, popisekVysledku, VETA_PROCEDURALNI } from '../lib/hlasovani';
import { datumText } from '../lib/casova-osa';
import '../styles/hlasovani.css';

interface Props { hlasovani: HlasovaniPravidla[] }
const { hlasovani } = Astro.props;
---
<h3 class="panel-nadpis">Hlasování</h3>{/* jen bez JavaScriptu, kdy jsou všechny části pod sebou */}
<ol class="hl-seznam">
  {hlasovani.map(h => (
    <li class="hl-blok" data-hlasovani={h.id}>
      <p class="hl-meta">{datumText(h.snimek.datum)} · hlasování č. {h.snimek.cislo} · <span class="hl-typ">{popisekTypu(h.typ)}</span></p>
      <p class="hl-co">{h.co}</p>
      <p class="hl-vysledek"><strong>{popisekVysledku(h.snimek)} {h.snimek.souhrn.pro} : {h.snimek.souhrn.proti}</strong></p>
      <ul class="hl-kluby" aria-label="Jak hlasovaly kluby">
        {souhrnKlubu(h.snimek).map(k => (
          <li><a href={`/hlasovani/${h.id}/#${k.slug}`} aria-label={vetaKlubu(k)}>{k.popisek} <span class="hl-cisla">{k.pro} : {k.proti}</span></a></li>
        ))}
      </ul>
      <p class="hl-pata"><span class="hl-legenda">pro : proti</span> · <a href={`/hlasovani/${h.id}/`}>Všichni poslanci →</a></p>
      {h.typ === 'proceduralni' && <p class="hl-proc">{VETA_PROCEDURALNI}</p>}
    </li>
  ))}
</ol>
```

- [ ] **Step 7: Úpravy `DetailPravidla.astro`**

Importy (k ostatním na začátku frontmatteru):

```ts
import ZalozkaHlasovani from './ZalozkaHlasovani.astro';
import { nactiHlasovani } from '../lib/kauzy';
import { hlasovaniPravidla, cisloHlasovani } from '../lib/hlasovani';
```
(Řádek `import { nactiKauzy } from '../lib/kauzy';` sloučit na `import { nactiKauzy, nactiHlasovani } from '../lib/kauzy';`.)

Pod `const kontroly = …` přidat:

```ts
const hlasovani = p ? hlasovaniPravidla(p.udalosti, nactiHlasovani()) : [];
```

V poli `zalozky` za `{ id: 'chrono', nazev: 'Průběh' },` přidat:

```ts
  ...(hlasovani.length > 0 ? [{ id: 'hlasovani', nazev: `Hlasování (${hlasovani.length})` }] : []),
```

V události Průběhu nahradit řádek:

```astro
                <div><h3>{u.nazev}</h3><p>{u.popis}</p><div>Zdroje:<span class="chipy" set:html={chipy(u.zdroje)}></span></div></div>
```
tímto:

```astro
                <div><h3>{u.nazev}</h3><p>{u.popis}</p><div>Zdroje:<span class="chipy" set:html={chipy(u.zdroje)}></span></div>{u.hlasovani.length > 0 && <div class="hl-odkazy">Hlasování: {u.hlasovani.map((h, j) => <>{j > 0 && ' · '}<a href={`/hlasovani/${h.id}/`}>č. {cisloHlasovani(h.id)}</a></>)}</div>}</div>
```

Před `<div class="m2-panel" data-p="vyhrady" role="tabpanel" hidden={prvni !== 'vyhrady'}>` vložit:

```astro
      {hlasovani.length > 0 && (
        <div class="m2-panel" data-p="hlasovani" role="tabpanel" hidden={prvni !== 'hlasovani'}>
          <ZalozkaHlasovani hlasovani={hlasovani} />
        </div>
      )}
```

- [ ] **Step 8: Styly záložky**

`src/styles/hlasovani.css`:

```css
/* Hlasování: záložka v detailu pravidla a stránka hlasování (spec hlasování, oddíl 7).
   Bez stranických barev; „pro“ a „proti“ nerozlišuje zelená ani červená, hlas pro návrh není hodnocení. */

/* záložka v detailu pravidla: co se nevejde na výšku, pokračuje do sloupců a posouvá se do strany (jako Zdroje) */
.pravidlo .m2-panel[data-p="hlasovani"] { overflow-x: auto; overflow-y: hidden; column-width: 320px; column-gap: 32px; column-fill: auto; }
.hl-seznam { list-style: none; margin: 0; padding: 0; }
.hl-blok { break-inside: avoid; margin: 0 0 14px; padding: 0 0 14px; border-bottom: 1px dashed var(--linka); }
.hl-meta { margin: 0; font: 12px/1.5 var(--f-mono); color: var(--meta); }
.hl-typ { border: 1px solid var(--inkoust); padding: 0 5px; color: var(--inkoust); white-space: nowrap; }
.hl-co { margin: 4px 0; font-size: 15px; }
.hl-vysledek { margin: 0 0 6px; font-size: 15px; }
.hl-kluby { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 0 0 6px; padding: 0; }
.hl-kluby a { display: inline-block; border: 1px solid var(--linka); background: var(--plocha); padding: 2px 8px; font-size: 13px; color: var(--inkoust); text-decoration: none; }
.hl-kluby a:hover { border-color: var(--modra); }
.hl-cisla { font-family: var(--f-mono); }
.hl-pata { margin: 0; font-size: 13px; color: var(--meta); }
.hl-pata a, .hl-odkazy a { color: var(--modra); }
.hl-proc { margin: 6px 0 0; font-size: 13px; font-style: italic; color: var(--text2); }
.hl-odkazy { margin-top: 6px; font-size: 14px; }
@media (max-width: 760px) {
  .pravidlo .m2-panel[data-p="hlasovani"] { column-width: 260px; }
}
```

- [ ] **Step 9: Ověřit, že testy projdou**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npm run build:e2e; if ($?) { npx playwright test -c playwright.hlasovani.config.ts tests/e2e/hlasovani-detail.spec.ts tests/e2e/pravidla-detail.spec.ts tests/e2e/pravidla-osa.spec.ts tests/e2e/pristupnost.spec.ts }
```
Expected: PASS. Pokud padá test oříznutí na 390×700 nebo 1256×528, upravit jen `hlasovani.css` (menší písmo, užší `column-width`), ne test. Pokud padá jen známý nestabilní `bez-posouvani.spec.ts:23` (padá i na main), poznamenat a pokračovat.

Run: `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run`
Expected: PASS (fixtures se změnily, unit testy nad `tests/fixtures/obsah` musí projít dál).

- [ ] **Step 10: Commit**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
git add src/components/ZalozkaHlasovani.astro src/components/DetailPravidla.astro src/styles/hlasovani.css tests/fixtures/obsah/hlasovani tests/fixtures/obsah/pravidla/zakon-omega.md tests/fixtures/obsah/pravidla/pozmenovaci-sigma.md tests/e2e/hlasovani-detail.spec.ts tests/e2e/pravidla-detail.spec.ts
git commit -F - <<'EOF'
Detail pravidla: záložka Hlasování s rozpisem podle klubů a odkaz z Průběhu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Stránka hlasování s filtrem klubu

**Files:**
- Create: `src/pages/hlasovani/[id].astro`
- Create: `src/scripts/hlasovani-filtr.ts`
- Modify: `src/styles/hlasovani.css` (styly stránky)
- Test: `tests/e2e/hlasovani-stranka.spec.ts`; doplnit adresy do `tests/e2e/bez-posouvani.spec.ts` a `tests/e2e/pristupnost.spec.ts`

**Interfaces:**
- Consumes: `nactiHlasovani`, `nactiPravidla` (`src/lib/kauzy.ts`), z `src/lib/hlasovani.ts` (Task 5) `souhrnKlubu`, `skupinyPoslancu`, `navazanaPravidla`, `popisekTypu`, `popisekVysledku`, `nadpisHlasovani`, `odkazPsp`, `nepritomni`, `vybranyKlub`, `VETA_PROCEDURALNI`; `klub` (Task 1); `datumText`; `oznacNacteno` (`src/scripts/nacteno.ts`); `Zaklad.astro`, `PatickaRadek.astro`.
- Produces: stránky `/hlasovani/<id>/` (třídy `.hl-stranka`, `.hl-drobky`, `.hl-hlava`, `.hl-kdy`, `.hl-o-cem`, `.hl-tabulka`, `.hl-cipy`, `.hl-poslanci`, `.hl-legenda-text`, `.hl-vsichni`, `section.hl-klub#<slug>`, `.hl-skupina`, `.hl-u-jmena`, `.hl-zdroj`), funkce `inicializujFiltrHlasovani(): void`.

- [ ] **Step 1: Napsat padající e2e testy**

`tests/e2e/hlasovani-stranka.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('stránka hlasování: nadpis, o čem, výsledek, zdroj a odkaz zpět', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-7-3/');
  await expect(page).toHaveTitle('Hlasování č. 3, 7. schůze Poslanecké sněmovny — Posuďte sami');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hlasování č. 3, 7. schůze Poslanecké sněmovny');
  await expect(page.locator('.hl-kdy')).toHaveText('20. 9. 2026, 14:30');
  await expect(page.locator('.hl-drobky a')).toHaveText(['Změny pravidel', 'Testovací novela zákona Omega s dlouhým názvem pro mobil']);
  await expect(page.locator('.hl-o-cem li')).toHaveCount(1);
  await expect(page.locator('.hl-o-cem li')).toContainText('o obsahu');
  await expect(page.locator('.hl-o-cem a')).toHaveAttribute('href', '/pravidla/zakon-omega/');
  await expect(page.locator('.hl-hlava .hl-proc')).toHaveCount(0);
  await expect(page.locator('.hl-hlava .hl-vysledek')).toHaveText('Přijato · 7 pro · 3 proti · 0 zdržel se · 0 nehlasoval · 1 omluven · 1 nepřihlášen · kvórum 6');
  await expect(page.getByRole('link', { name: 'Ověřit na psp.cz' })).toHaveAttribute('href', 'https://www.psp.cz/sqw/hlasy.sqw?g=90103');
  await expect(page.locator('.hl-zdroj')).toContainText('staženo 14. 11. 2026');
  await expect(page.getByRole('link', { name: 'Jak hlasování zapisujeme' })).toHaveAttribute('href', '/metodika/#hlasovani');
  await expect(page.getByRole('navigation', { name: 'Hlavní' }).locator('a[aria-current="page"]')).toHaveAttribute('href', '/pravidla/');
});

test('hlasování navázané na dvě pravidla: obě v „O čem“, drobečková navigace končí u části', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-5-12/');
  await expect(page.locator('.hl-o-cem li')).toHaveCount(2);
  await expect(page.locator('.hl-drobky a')).toHaveText(['Změny pravidel']);
  await expect(page.locator('.hl-hlava .hl-proc')).toHaveText('Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.');
});

test('výchozí filtr Všichni: poslanci podle hlasu s klubem u jména', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-5-12/');
  await expect(page.locator('.hl-tabulka a[aria-current="true"]')).toHaveText('Všichni (12)');
  const vsichni = page.locator('.hl-vsichni');
  await expect(vsichni).toBeVisible();
  await expect(vsichni.locator('.hl-skupina h3')).toHaveText(['Pro (5)', 'Proti (4)', 'Zdržel se nebo nehlasoval (1)', 'Omluven (1)', 'Nepřihlášen (1)']);
  await expect(vsichni.locator('.hl-skupina').first().locator('li').first()).toHaveText('Adam Alfa ANO');
  await expect(page.locator('.hl-klub:visible')).toHaveCount(0);
});

test('proklik na klub z detailu pravidla otevře stránku s vybraným klubem', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Hlasování (2)' }).click();
  await page.getByRole('link', { name: 'ODS: 1 pro, 2 proti', exact: true }).click();
  await expect(page).toHaveURL(/\/hlasovani\/psp-10-7-3\/#ods$/);
  const ods = page.locator('section#ods');
  await expect(ods).toBeVisible();
  await expect(ods.locator('li')).toHaveText(['Tomáš Théta', 'Ema Éta', 'Zita Zéta']);
  await expect(page.locator('.hl-klub:visible')).toHaveCount(1);
  await expect(page.locator('.hl-vsichni')).toBeHidden();
  await expect(page.locator('.hl-tabulka a[aria-current="true"]')).toHaveText('ODS (3)');
});

test('přepnutí filtru změní kotvu, Všichni ji zruší', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-5-12/#ano');
  await expect(page.locator('section#ano')).toBeVisible();
  await page.locator('.hl-tabulka').getByRole('link', { name: 'STAN (2)' }).click();
  await expect(page).toHaveURL(/#stan$/);
  await expect(page.locator('section#stan')).toBeVisible();
  await expect(page.locator('section#ano')).toBeHidden();
  await page.locator('.hl-tabulka').getByRole('link', { name: 'Všichni (12)' }).click();
  await expect(page).toHaveURL(/\/hlasovani\/psp-10-5-12\/$/);
  await expect(page.locator('.hl-vsichni')).toBeVisible();
});

test('Zpět po přepínání filtru vede na předchozí stránku, ne na předchozí klub', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.goto('/hlasovani/psp-10-5-12/#ano');
  await page.locator('.hl-tabulka').getByRole('link', { name: 'ODS (3)' }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/pravidla\/zakon-omega\/$/);
});

test('kotva velkými písmeny vybere klub, neznámá ukáže všechny', async ({ page }) => {
  await page.goto('/hlasovani/psp-10-5-12/#ODS');
  await expect(page.locator('section#ods')).toBeVisible();
  await page.goto('/hlasovani/psp-10-5-12/#neznamy');
  await expect(page.locator('.hl-vsichni')).toBeVisible();
  await expect(page.locator('.hl-tabulka a[aria-current="true"]')).toHaveText('Všichni (12)');
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('všechny kluby jako oddíly, kotva ukáže klub', async ({ page }) => {
    await page.goto('/hlasovani/psp-10-5-12/#ods');
    await expect(page.locator('.hl-klub')).toHaveCount(5);
    for (const id of ['ano', 'ods', 'stan', 'pirati', 'nezarazeni']) await expect(page.locator(`section#${id}`)).toBeVisible();
    await expect(page.locator('.hl-vsichni')).toBeHidden();
    await expect(page.locator('section#ods')).toBeInViewport();
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: stránka hlasování se neposouvá a seznam poslanců má místo`, async ({ page }) => {
    await page.setViewportSize(v);
    for (const adresa of ['/hlasovani/psp-10-5-12/', '/hlasovani/psp-10-7-3/#ano']) {
      await page.goto(adresa);
      await overBezPosouvani(page);
      const vyska = await page.locator('.hl-poslanci').evaluate(e => e.clientHeight);
      expect(vyska, `${adresa}: seznam poslanců má jen ${vyska} px`).toBeGreaterThanOrEqual(100);
    }
  });
}

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });
  test('místo tabulky čipy klubů, filtr funguje', async ({ page }) => {
    await page.goto('/hlasovani/psp-10-5-12/');
    await expect(page.locator('.hl-tabulka')).toBeHidden();
    await page.locator('.hl-cipy').getByRole('link', { name: 'STAN (2)' }).click();
    await expect(page).toHaveURL(/#stan$/);
    await expect(page.locator('.hl-cipy a[aria-current="true"]')).toHaveText('STAN (2)');
    await expect(page.locator('section#stan')).toBeVisible();
  });
});
```

Do `tests/e2e/bez-posouvani.spec.ts` přidat do pole cest `'/hlasovani/psp-10-5-12/'`. Do `tests/e2e/pristupnost.spec.ts` přidat do pole cest `'/hlasovani/psp-10-5-12/'` a `'/hlasovani/psp-10-7-3/#ods'`.

- [ ] **Step 2: Ověřit, že testy padají**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npm run build:e2e; if ($?) { npx playwright test -c playwright.hlasovani.config.ts tests/e2e/hlasovani-stranka.spec.ts }
```
Expected: FAIL (stránka `/hlasovani/…` neexistuje, 404).

- [ ] **Step 3: Skript filtru**

`src/scripts/hlasovani-filtr.ts`:

```ts
import { vybranyKlub } from '../lib/hlasovani';

/** Filtr klubu na stránce hlasování (spec hlasování, oddíl 7). Vybraný klub nese kotva adresy (#ano). Přepnutí ji mění
 *  přes replaceState, takže odkaz jde sdílet a Zpět vede na předchozí stránku. Bez skriptu jsou vidět oddíly všech klubů. */
export function inicializujFiltrHlasovani(): void {
  const stranka = document.querySelector<HTMLElement>('.hl-stranka');
  if (!stranka) return;
  const sekce = [...stranka.querySelectorAll<HTMLElement>('.hl-klub')];
  const slugy = sekce.map(s => s.id);
  const vsichni = stranka.querySelector<HTMLElement>('.hl-vsichni');
  const seznam = stranka.querySelector<HTMLElement>('.hl-poslanci');
  const odkazy = [...stranka.querySelectorAll<HTMLAnchorElement>('a[data-klub]')];
  const nastav = (slug: string) => {
    if (vsichni) vsichni.hidden = slug !== '';
    sekce.forEach(s => { s.hidden = s.id !== slug; });
    odkazy.forEach(a => a.setAttribute('aria-current', String((a.dataset.klub ?? '') === slug)));
    if (seznam) seznam.scrollLeft = 0;
  };
  stranka.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-klub]');
    if (!a) return;
    e.preventDefault();
    const slug = a.dataset.klub ?? '';
    history.replaceState(history.state, '', slug ? `#${slug}` : location.pathname + location.search);
    nastav(slug);
  });
  addEventListener('hashchange', () => nastav(vybranyKlub(location.hash, slugy)));
  nastav(vybranyKlub(location.hash, slugy));
}
```

- [ ] **Step 4: Stránka**

`src/pages/hlasovani/[id].astro`:

```astro
---
import Zaklad from '../../layouts/Zaklad.astro';
import PatickaRadek from '../../components/PatickaRadek.astro';
import { nactiHlasovani, nactiPravidla } from '../../lib/kauzy';
import {
  souhrnKlubu, skupinyPoslancu, navazanaPravidla, popisekTypu, popisekVysledku, nadpisHlasovani, odkazPsp, nepritomni, VETA_PROCEDURALNI,
} from '../../lib/hlasovani';
import { klub } from '../../lib/hlasovani-kluby';
import { datumText } from '../../lib/casova-osa';
import type { Snimek } from '../../lib/schema-hlasovani';
import '../../styles/hlavni.css';
import '../../styles/hlasovani.css';

// Stránka vznikne jen pro snímky, na které odkazuje aspoň jedno pravidlo (nactiHlasovani je už takto vyfiltruje).
export function getStaticPaths() {
  return [...nactiHlasovani()].map(([id, snimek]) => ({ params: { id }, props: { id, snimek } }));
}
interface Props { id: string; snimek: Snimek }
const { id, snimek: s } = Astro.props;
const pravidla = navazanaPravidla(nactiPravidla(), id);
const kluby = souhrnKlubu(s);
const nadpis = nadpisHlasovani(s);
const { omluven, neprihlasen } = nepritomni(s);
const popis = `${popisekVysledku(s)} ${s.souhrn.pro} : ${s.souhrn.proti}. ${pravidla.map(p => p.co).join(' ')}`;
const filtr = [
  { slug: '', popisek: `Všichni (${s.poslanci.length})`, href: '#' },
  ...kluby.map(k => ({ slug: k.slug, popisek: `${k.popisek} (${k.celkem})`, href: `#${k.slug}` })),
];
---
<Zaklad titulek={`${nadpis} — Posuďte sami`} popis={popis} cesta={`/hlasovani/${id}/`} styly="hlavni" aktivni="pravidla">
  <main class="hl-stranka">
    <nav class="hl-drobky" aria-label="Drobečková navigace">
      <a href="/pravidla/">Změny pravidel</a>
      {pravidla.length === 1 && <> › <a href={`/pravidla/${pravidla[0].slug}/`}>{pravidla[0].nazev}</a></>}
      {' › '}<span aria-current="page">Hlasování č. {s.cislo}</span>
    </nav>
    <header class="hl-hlava">
      <h1>{nadpis}</h1>
      <p class="hl-kdy">{datumText(s.datum)}, {s.cas}</p>
      <ul class="hl-o-cem" aria-label="O čem se hlasovalo">
        {pravidla.map(p => <li><span class="hl-typ">{popisekTypu(p.typ)}</span> {p.co} <a href={`/pravidla/${p.slug}/`}>← {p.nazev}</a></li>)}
      </ul>
      {pravidla.some(p => p.typ === 'proceduralni') && <p class="hl-proc">{VETA_PROCEDURALNI}</p>}
      <p class="hl-vysledek"><strong>{popisekVysledku(s)}</strong> · {s.souhrn.pro} pro · {s.souhrn.proti} proti · {s.souhrn.zdrzel} zdržel se · {s.souhrn.nehlasoval} nehlasoval · {omluven} omluven · {neprihlasen} nepřihlášen · kvórum {s.kvorum}</p>
    </header>
    <div class="hl-telo">
      <div class="hl-tabulka-obal">
        <table class="hl-tabulka">
          <caption class="jen-ctecka">Jak hlasovaly kluby</caption>
          <thead><tr><th scope="col">Klub</th><th scope="col">pro</th><th scope="col">proti</th><th scope="col">zdržel se nebo nehlasoval</th><th scope="col">nepřítomen</th></tr></thead>
          <tbody>
            <tr>
              <th scope="row"><a href="#" data-klub="" aria-current="true">Všichni ({s.poslanci.length})</a></th>
              <td>{s.souhrn.pro}</td><td>{s.souhrn.proti}</td><td>{s.souhrn.zdrzel + s.souhrn.nehlasoval}</td><td>{omluven + neprihlasen}</td>
            </tr>
            {kluby.map(k => (
              <tr>
                <th scope="row"><a href={`#${k.slug}`} data-klub={k.slug} aria-current="false">{k.popisek} ({k.celkem})</a></th>
                <td>{k.pro}</td><td>{k.proti}</td><td>{k.zdrzelNehlasoval}</td><td>{k.omluven + k.neprihlasen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav class="hl-cipy" aria-label="Filtr klubu">
        {filtr.map(f => <a href={f.href} data-klub={f.slug} aria-current={String(f.slug === '')}>{f.popisek}</a>)}
      </nav>
      <div class="hl-poslanci" role="region" tabindex="0" aria-label="Poslanci podle hlasu">
        <p class="hl-legenda-text">„Zdržel se nebo nehlasoval“: data PSP u jednotlivých poslanců tyto dvě možnosti nerozlišují, souhrn je uvádí zvlášť. Omluven: nepřihlášen s omluvou z jednání. Nepřihlášen: bez omluvy. <a href="/metodika/#hlasovani">Jak hlasování zapisujeme</a></p>
        <div class="hl-vsichni">
          <h2 class="jen-ctecka">Všichni poslanci</h2>
          {skupinyPoslancu(s.poslanci).map(g => (
            <div class="hl-skupina">
              <h3>{g.nadpis} ({g.poslanci.length})</h3>
              <ul>{g.poslanci.map(p => <li>{p.jmeno} {p.prijmeni} <span class="hl-u-jmena">{klub(p.klub)?.popisek}</span></li>)}</ul>
            </div>
          ))}
        </div>
        {kluby.map(k => (
          <section class="hl-klub" id={k.slug} aria-labelledby={`klub-${k.slug}`} hidden>
            <h2 id={`klub-${k.slug}`}>{k.popisek}</h2>
            {skupinyPoslancu(s.poslanci.filter(p => p.klub === k.zkratka)).map(g => (
              <div class="hl-skupina">
                <h3>{g.nadpis} ({g.poslanci.length})</h3>
                <ul>{g.poslanci.map(p => <li>{p.jmeno} {p.prijmeni}</li>)}</ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
    <p class="hl-zdroj">Otevřená data Poslanecké sněmovny, staženo {datumText(s.stazeno)} · <a href={odkazPsp(s)}>Ověřit na psp.cz</a></p>
  </main>
  <PatickaRadek />
</Zaklad>
<script>
  import { inicializujFiltrHlasovani } from '../../scripts/hlasovani-filtr';
  import { oznacNacteno } from '../../scripts/nacteno';
  inicializujFiltrHlasovani();
  oznacNacteno(0);
</script>
```

- [ ] **Step 5: Styly stránky**

Na konec `src/styles/hlasovani.css` přidat:

```css
/* stránka /hlasovani/<id>/: vyplní výšku okna, seznam poslanců pokračuje do sloupců a posouvá se do strany */
.hl-stranka { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; padding: 10px 0 6px; }
.hl-drobky { flex: none; font: 12px var(--f-mono); color: var(--meta); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hl-drobky a { color: var(--modra); }
.hl-hlava { flex: none; }
.hl-hlava h1 { margin: 0; font: 800 clamp(22px, 2.4vw, 32px)/1.1 var(--f-nadpis); }
.hl-kdy { margin: 2px 0 6px; font: 13px var(--f-mono); color: var(--meta); }
.hl-o-cem { list-style: none; margin: 0 0 4px; padding: 0; font-size: 15px; }
.hl-o-cem a { color: var(--modra); }
.hl-hlava .hl-vysledek { margin: 4px 0 0; font-size: 14px; }
.hl-telo { flex: 1; min-height: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0 24px; padding: 10px 14px; background: var(--plocha); border: 1px solid var(--linka); }
.hl-tabulka-obal { min-height: 0; overflow-y: auto; }
.hl-tabulka { border-collapse: collapse; font-size: 13px; }
.hl-tabulka th, .hl-tabulka td { padding: 3px 8px; border-bottom: 1px solid var(--linka); text-align: right; font: 13px var(--f-mono); }
.hl-tabulka thead th { color: var(--meta); font-size: 11px; vertical-align: bottom; }
.hl-tabulka th[scope="row"], .hl-tabulka thead th:first-child { text-align: left; font-family: var(--f-text); }
.hl-tabulka tbody tr { position: relative; }
.hl-tabulka tbody a { color: var(--inkoust); text-decoration: none; }
.hl-tabulka tbody a::after { content: ""; position: absolute; inset: 0; } /* klikne se na celý řádek */
.hl-tabulka tbody tr:hover, .hl-tabulka tbody tr:has(a[aria-current="true"]) { background: color-mix(in srgb, var(--modra) 8%, var(--plocha)); }
.hl-tabulka a[aria-current="true"] { font-weight: 700; }
.hl-cipy { display: none; }
.hl-poslanci { min-height: 0; overflow-x: auto; overflow-y: hidden; column-width: 190px; column-gap: 24px; column-fill: auto; font-size: 14px; }
.hl-legenda-text { margin: 0 0 8px; font-size: 12px; color: var(--meta); break-inside: avoid; }
.hl-legenda-text a { color: var(--modra); }
.hl-poslanci h2 { margin: 0 0 4px; font: 700 15px var(--f-nadpis); break-after: avoid; }
.hl-skupina h3 { margin: 6px 0 2px; font: 600 12px var(--f-mono); color: var(--meta); break-after: avoid; }
.hl-skupina ul { list-style: none; margin: 0; padding: 0; }
.hl-skupina li { break-inside: avoid; line-height: 1.45; }
.hl-u-jmena { margin-left: 4px; font: 11px var(--f-mono); color: var(--meta); }
/* bez JavaScriptu: oddíly všech klubů pod sebou (kotva #ano na ně posune), přehled „Všichni“ se nezobrazí */
html:not(.js) .hl-klub[hidden] { display: block; }
html:not(.js) .hl-vsichni { display: none; }
.hl-zdroj { flex: none; margin: 0; font-size: 12px; color: var(--meta); }
.hl-zdroj a { color: var(--modra); }
@media (max-width: 760px) {
  .hl-stranka { gap: 6px; padding-top: 6px; }
  .hl-hlava h1 { font-size: 20px; }
  .hl-o-cem, .hl-hlava .hl-vysledek, .hl-hlava .hl-proc { font-size: 13px; }
  .hl-telo { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); padding: 8px 10px; }
  .hl-tabulka-obal { display: none; }
  .hl-cipy { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: thin; padding-bottom: 4px; margin-bottom: 6px; }
  .hl-cipy a { flex: none; border: 1px solid var(--linka); padding: 3px 10px; font-size: 13px; color: var(--inkoust); text-decoration: none; }
  .hl-cipy a[aria-current="true"] { border-color: var(--modra); background: var(--modra); color: #fff; }
}
```

- [ ] **Step 6: Ověřit, že testy projdou**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npm run build:e2e; if ($?) { npx playwright test -c playwright.hlasovani.config.ts tests/e2e/hlasovani-stranka.spec.ts tests/e2e/bez-posouvani.spec.ts tests/e2e/pristupnost.spec.ts }
```
Expected: PASS. Když test „seznam poslanců má místo“ padá, zmenšit hlavičku jen v CSS (písmo, mezery, `-webkit-line-clamp` u `.hl-o-cem li` na 2 řádky s plným textem v `title`). Obsah ze stránky neodebírat a podmínku testu nesnižovat.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
git add "src/pages/hlasovani/[id].astro" src/scripts/hlasovani-filtr.ts src/styles/hlasovani.css tests/e2e/hlasovani-stranka.spec.ts tests/e2e/bez-posouvani.spec.ts tests/e2e/pristupnost.spec.ts
git commit -F - <<'EOF'
Stránka hlasování: rozpis podle klubů a poslanci s filtrem klubu v kotvě adresy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 8: Metodika, kontrola odkazů v CI a hlídání stylů

**Files:**
- Modify: `src/data/metodika.ts` (pododdíl `#hlasovani` v sekci `pravidla`)
- Modify: `.github/workflows/kontrola.yml` (lychee i pro `obsah/hlasovani/*.yml`)
- Modify: `tests/unit/styly.test.ts` (hlídat i `hlasovani.css`)
- Test: `tests/e2e/stranky.spec.ts`

**Interfaces:**
- Consumes: kotva `/metodika/#hlasovani` (odkazuje na ni stránka hlasování z Tasku 7), mechanismus kotev pododdílů v `src/scripts/karty.ts` (už funguje pro `#kontrola-moci`).
- Produces: `<h3 id="hlasovani">` a `<dl class="slovnicek hl-slovnicek">` v panelu Metodiky „Změny pravidel“.

- [ ] **Step 1: Napsat padající test a upravit stávající**

V `tests/e2e/stranky.spec.ts`:
- v testu „/metodika/#pravidla otevře oddíl Změny pravidel“ změnit `panel.locator('.slovnicek dt')` na `panel.locator('.slovnicek:not(.hl-slovnicek) dt')` (nový slovníček je ve stejném panelu),
- přidat test:

```ts
test('/metodika/#hlasovani otevře oddíl Změny pravidel na pododdílu Hlasování', async ({ page }) => {
  await page.goto('/metodika/#hlasovani');
  const panel = page.locator('.v4-dlg-panel[data-sekce="pravidla"]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('#hlasovani')).toHaveText('Hlasování');
  await expect(panel).toContainText('Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu');
  await expect(panel.locator('.hl-slovnicek dt')).toHaveText(['zdržel se nebo nehlasoval', 'omluven', 'nepřihlášen']);
  await expect(panel).toContainText('jak hlasovali jednotliví členové vlády, se nezveřejňuje');
});
```

V `tests/unit/styly.test.ts` přidat `'src/styles/hlasovani.css'` do pole `soubory`.

- [ ] **Step 2: Ověřit, že nový test padá**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npm run build:e2e; if ($?) { npx playwright test -c playwright.hlasovani.config.ts tests/e2e/stranky.spec.ts }
```
Expected: nový test FAIL (`#hlasovani` neexistuje), ostatní PASS.

- [ ] **Step 3: Text Metodiky**

V `src/data/metodika.ts` v řetězci `html` sekce `pravidla` vložit hned před `<h3 id="vyhrady">Výhrady a jazyk</h3>`:

```html
<h3 id="hlasovani">Hlasování</h3>
<p>U zákonů projednávaných ve Sněmovně zapisujeme, jak hlasovaly poslanecké kluby a jednotliví poslanci. Zapisujeme <strong>hlasování o obsahu</strong> (zamítnutí nebo propuštění v 1. čtení, přikázání výboru, schválení ve 3. čtení, hlasování o vetu prezidenta nebo o návrhu Senátu, u pozměňovacího návrhu hlasování o něm) a <strong>procedurální hlasování</strong>, která rozhodla o osudu návrhu: zařazení na pořad, vyřazení nebo přesunutí bodu, zkrácení lhůt nebo schválení už v 1. čtení. Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu, a vždy ho tak označujeme. Hlasování vybíráme, nezapisujeme automaticky každé hlasování k tisku.</p>
<p>Údaje pocházejí z <a href="https://www.psp.cz/sqw/hp.sqw?k=1300">otevřených dat Poslanecké sněmovny</a>. Stahuje je veřejný skript <code>scripts/stahni-hlasovani.ts</code>. U každého hlasování uvádíme datum stažení a odkaz na jeho stránku na psp.cz, kde lze čísla ověřit. Klub poslance je ten, ve kterém byl v den hlasování.</p>
<dl class="slovnicek hl-slovnicek">
<dt>zdržel se nebo nehlasoval</dt><dd>Poslanec byl přihlášen, ale nehlasoval pro ani proti. Data PSP u jednotlivých poslanců tyto dvě možnosti nerozlišují, souhrn hlasování je uvádí zvlášť.</dd>
<dt>omluven</dt><dd>Poslanec nebyl přihlášen a na dobu hlasování měl omluvu z jednání.</dd>
<dt>nepřihlášen</dt><dd>Poslanec nebyl přihlášen a omluvu v evidenci neměl.</dd>
</dl>
<p>U nařízení vlády, usnesení vlády, pravidel dotačních programů a pokynů ministerstev hlasování neuvádíme: jak hlasovali jednotliví členové vlády, se nezveřejňuje, a o pravidlech programů a pokynech se nehlasuje vůbec.</p>
```

- [ ] **Step 4: Kontrola odkazů v CI**

V `.github/workflows/kontrola.yml` v kroku `Změněné kauzy a pravidla` (id `zmeny`) doplnit do `git diff` cestu `'obsah/hlasovani/*.yml'`:

```yaml
      - name: Změněné kauzy, pravidla a hlasování
        id: zmeny
        run: echo "soubory=$(git diff --name-only --diff-filter=AM origin/main...HEAD -- 'obsah/kauzy/*.md' 'obsah/pravidla/*.md' 'obsah/hlasovani/*.yml' | tr '\n' ' ')" >> "$GITHUB_OUTPUT"
      - name: Kontrola odkazů ve změněných kauzách, pravidlech a hlasováních
```
(Druhý řádek je jen nový název následujícího kroku s lychee, jeho obsah se nemění.)

- [ ] **Step 5: Ověřit testy**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run tests/unit/styly.test.ts; npm run build:e2e; if ($?) { npx playwright test -c playwright.hlasovani.config.ts tests/e2e/stranky.spec.ts }
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
git add src/data/metodika.ts .github/workflows/kontrola.yml tests/unit/styly.test.ts tests/e2e/stranky.spec.ts
git commit -F - <<'EOF'
Metodika: pododdíl Hlasování; CI kontroluje odkazy i ve snímcích hlasování

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 9: Hlasování k tisku 221 a celkové ověření

**Files:**
- Modify: `obsah/pravidla/novela-stretu-zajmu-2026.md` (pole `hlasovani` ve dvou událostech)
- Create (skriptem): `obsah/hlasovani/psp-10-34-32.yml`, `psp-10-34-311.yml`, `psp-10-34-328.yml`, `psp-10-34-385.yml`

**Interfaces:**
- Consumes: celý řetězec z Tasků 1–8.
- Produces: první skutečná hlasování na webu.

- [ ] **Step 1: Hlasování u událostí**

V `obsah/pravidla/novela-stretu-zajmu-2026.md` u události `datum: 2026-10-13` (`nazev: 1. čtení zařazeno na 34. schůzi`) přidat pod `zdroje: [23, 24]`:

```yaml
    hlasovani:
      - id: psp-10-34-32
        typ: proceduralni
        co: 'Návrh R. Králíčka (ANO) na pořadí bodů 34. schůze, který určil i pořadí 1. čtení tisku 221'
```

U události `datum: 2026-11-03` (`nazev: Návrhy na vyřazení z pořadu zamítnuty`) přidat pod `zdroje: [25, 26, 27, 28]`:

```yaml
    hlasovani:
      - id: psp-10-34-311
        typ: proceduralni
        co: 'Návrh T. Malé (ANO) zařadit 1. čtení jako poslední bod jednacího dne'
      - id: psp-10-34-328
        typ: proceduralni
        co: 'Návrh Z. Hřiba (Piráti) a V. Rakušana (STAN) vyřadit 1. čtení tisku 221 z pořadu schůze'
      - id: psp-10-34-385
        typ: proceduralni
        co: 'Návrh I. Bartoše (Piráti) vyřadit 1. čtení tisku 221 z pořadu schůze'
```

Kopii v `_koncepty/obsah/pravidla/` **neměnit** (spec, oddíl 8: větve `zmeny-pravidel` a `oblasti` mají striktní schéma bez pole `hlasovani`). Doplní se po sloučení do main.

- [ ] **Step 2: Stáhnout snímky**

Run (Bash): `cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani && npm run hlasovani`
Expected, čtyři řádky:
```
psp-10-34-311: přijato 86 : 69 → obsah/hlasovani/psp-10-34-311.yml
psp-10-34-32: přijato 96 : 63 → obsah/hlasovani/psp-10-34-32.yml
psp-10-34-328: zamítnuto 72 : 86 → obsah/hlasovani/psp-10-34-328.yml
psp-10-34-385: zamítnuto 58 : 79 → obsah/hlasovani/psp-10-34-385.yml
```

- [ ] **Step 3: Kontrola proti psp.cz a textu událostí**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
for f in obsah/hlasovani/*.yml; do echo "$f"; grep -E '^(# Ověřit|datum|cas|vysledek|kvorum|souhrn):?' "$f"; grep -c '^  - {' "$f"; done
```
Expected: kvóra 87 (č. 32), 79 (č. 311), 80 (č. 328), 74 (č. 385). Data 13. 10., 3. 11., 3. 11. a 4. 11. 2026. U každého 200 poslanců. Výsledky odpovídají textu událostí v pravidle (96 : 63, 86 : 69, 72 : 86, 58 : 79). Ručně otevřít aspoň jeden odkaz `# Ověřit:` (skill `/browse`) a porovnat rozpis klubů na psp.cz s tabulkou na stránce hlasování z kroku 5.

- [ ] **Step 4: Validace a produkční build**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
npm run over && npx astro build && ls dist/hlasovani/
```
Expected: `Obsah v pořádku: … kauz, 4 pravidla a 4 hlasování v „obsah“.`, build bez chyb, `dist/hlasovani/` obsahuje čtyři složky `psp-10-34-*`.

- [ ] **Step 5: Vizuální kontrola**

Servírovat produkční build na volném portu (Bash, na pozadí): `cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani && npx serve dist -l 4352 --no-clipboard`. Skillem `/browse` udělat snímky obrazovky na 1342×565 a 390×700:
- `http://localhost:4352/pravidla/novela-stretu-zajmu-2026/` se záložkou „Hlasování (4)“,
- `http://localhost:4352/hlasovani/psp-10-34-328/#ano`.

Zkontrolovat: nic se svisle neposouvá, kluby se zalamují, seznam poslanců pokračuje do strany, žádné stranické barvy. Pak server zastavit.

- [ ] **Step 6: Celá sada testů**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-hlasovani'; npx vitest run; npm run build:e2e; if ($?) { npx playwright test -c playwright.hlasovani.config.ts }
```
Expected: všechny testy PASS. Jediná povolená výjimka je známý nestabilní `bez-posouvani.spec.ts:23`, který padá i na main. Pokud selže, spustit ho znovu samostatně a výsledek uvést.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/reath/Projects/NenechmeVyhnit-hlasovani
git add obsah/pravidla/novela-stretu-zajmu-2026.md obsah/hlasovani
git commit -F - <<'EOF'
Tisk 221: čtyři procedurální hlasování o pořadu 34. schůze s rozpisem podle klubů

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

Push a PR až na pokyn uživatele (PR zakládá uživatel).
