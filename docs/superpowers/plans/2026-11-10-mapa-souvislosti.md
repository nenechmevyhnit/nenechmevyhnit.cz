# Mapa souvislostí: plán implementace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Druhý pohled na kauzy na hlavní stránce: mapa, která ukazuje doložené vazby kauz na A. Babiše přes aktéry (firmy, osoby, nástroje) a návaznosti mezi kauzami.

**Architecture:** Vazby jsou data. `obsah/akteri.yml` obsahuje slovník aktérů s doloženými vztahy a kauzy mají nová pole `akteri` a `navazuje`. Kontroluje je stejná validace jako zbytek obsahu. Čistá funkce `src/lib/mapa.ts` z nich sestaví graf a rozložení (sloupce zleva doprava) a `src/lib/mapa-html.ts` z nich vytvoří SVG a přístupný strom. Obojí běží při buildu i v prohlížeči (překreslení po filtru). Klientský skript `src/scripts/mapa.ts` řeší přepínač Osa | Mapa, zvýraznění, panel vazby a mobilní strom. S filtry a navigací mluví přes vlastní události `nv:*`.

**Tech Stack:** Astro 7 (statický výstup), TypeScript, zod 4 (`astro/zod`), Vitest 5, Playwright 1.65 + axe-core, bez frameworku a bez knihoven pro grafy.

**Spec:** `docs/superpowers/specs/2026-11-10-mapa-souvislosti-design.md` (navazuje na `docs/superpowers/specs/2026-11-10-nenechme-vyhnit-design.md`)

## Global Constraints

- Žádné svislé posouvání stránky, nikde: `document.scrollingElement.scrollHeight <= innerHeight` na 1256×528, 1342×565, 1342×676, 1896×868 a 390×700 (seznam `VELIKOSTI` v `tests/e2e/pomocne.ts`), i v pohledu mapy.
- Mobil = `@media (max-width: 760px)`, počítač = `(min-width: 761px)` (stejná hranice jako zbytek webu).
- Barvy jen z proměnných palety (`--modra`, `--inkoust`, `--linka`, `--meta`, `--plocha`, `--okr` pro fokus). Žádná červená. Všechny čáry jsou stejně silné, tloušťka ani velikost uzlu nevyjadřují počet kauz.
- Plné čáry = vztah aktéra a aktér v kauze, čárkované oblouky = návaznost.
- Každá vazba má roli ze slovníku `src/lib/role.ts`, `popis` nejvýš 200 znaků a aspoň jeden zdroj.
- Bez knihovny pro grafy, bez skriptů třetích stran a bez sledování. Klientský JS bez frameworku.
- Animace jen přes View Transitions. Při `prefers-reduced-motion: reduce` se vypínají.
- WCAG 2.1 AA, axe bez chyb `serious`/`critical`.
- Testovací data (`tests/fixtures`, `tests/unit/ukazka.ts`) jsou fiktivní a neodkazují na skutečné osoby ani firmy.
- `_koncepty/` se nikdy necommituje (je v `.gitignore`).
- Identifikátory a texty česky, bez diakritiky v identifikátorech (styl repozitáře). Commity česky, končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Střed mapy má vyhrazené id `babis` a popisek `Andrej Babiš`.

## Review Focus

1. **Vybraná kauza zmizí z filtru.** Zvýraznění se zruší bez chyby a po zrušení filtru se zase obnoví (test v Task 6).
2. **Zpět v prohlížeči po detailu otevřeném z mapy** vrátí `/?pohled=mapa` s viditelnou mapou, ne osu (test v Task 6).
3. **Změna šířky okna z počítače na mobil v pohledu mapy.** SVG zmizí, strom se objeví a rozbalení se nastaví podle hloubky (test v Task 7).
4. **Návrat z mapy na osu po filtrování.** Stránkování osy se přepočítá a ukazuje správný počet řádků (test v Task 5).
5. **Dlouhé názvy kauz (36 znaků) a aktérů** se vejdou do obdélníku uzlu (test v Task 5 přes `getBBox`).

---

### Task 0: Příprava větve

**Files:** žádné (jen git)

- [ ] **Step 1: Ověřit, že rozpracované stránkování osy je commitnuté**

Run: `git status --short`
Expected: žádné změněné soubory v `src/` ani `tests/`. Pokud tam jsou (stránkování: `src/lib/strankovani.ts`, `src/scripts/filtry.ts`…), **zastav se a zeptej se uživatele**, jestli je commitnout na `koncepty-v-aplikaci`. Tento plán s nimi počítá.

- [ ] **Step 2: Přenést větev `mapa-souvislosti` na aktuální `koncepty-v-aplikaci`**

```bash
git switch mapa-souvislosti
git rebase koncepty-v-aplikaci
```
Expected: `Successfully rebased`. Větev obsahuje jen commity se specifikací a tímto plánem.

- [ ] **Step 3: Výchozí stav testů**

Run: `npx vitest run` a `npm run e2e`
Expected: vše zelené. Pokud ne, zastav se a nahlas to, nejde o chybu tohoto plánu.

---

### Task 1: Slovník rolí a schéma vazeb

**Files:**
- Create: `src/lib/role.ts`
- Modify: `src/lib/schema.ts`
- Modify: `tests/unit/ukazka.ts`
- Test: `tests/unit/akteri.test.ts`

**Interfaces:**
- Produces:
  - `role.ts`: `ROLE_VZTAHU`, `ROLE_V_KAUZE`, `ROLE_NAVAZNOSTI`, `DRUHY_AKTERU` (const tuples), typy `RoleVztahu`, `RoleVKauze`, `RoleNavaznosti`, `Role`, `DruhAktera`, `popisekRole(r: Role): string`, `STRED: { id: 'babis'; nazev: 'Andrej Babiš' }`
  - `schema.ts`: `akterSchema`, `akterSchemaKoncepty`, typy `Akter`, `Vztah`; kauza má nová pole `akteri: { id; role: RoleVKauze; popis; zdroje: number[] }[]` a `navazuje: { kauza; role: RoleNavaznosti; popis; zdroje: number[] }[]` (výchozí `[]`)
  - `ukazka.ts`: `platnyAkter(): Record<string, unknown>`

- [ ] **Step 1: Napsat padající testy**

Do `tests/unit/ukazka.ts` přidej na konec:

```ts
export function platnyAkter(): Record<string, unknown> {
  return {
    nazev: 'Fiktivní firma Alfa',
    druh: 'firma',
    overeno: '2026-11-09',
    vztahy: [{
      nadrazeny: 'babis', role: 'vlastni', od: 2005, do: null,
      popis: 'Fiktivní osoba vlastní fiktivní firmu Alfa.',
      zdroje: [{ vydavatel: 'Fiktivní rejstřík', titulek: 'Výpis', datum: '2005-02-01', druh: 'primarni', url: 'https://example.com/vypis' }],
    }],
  };
}
```

Vytvoř `tests/unit/akteri.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { akterSchema, akterSchemaKoncepty, kauzaSchema } from '../../src/lib/schema';
import { popisekRole, ROLE_VZTAHU, ROLE_V_KAUZE, ROLE_NAVAZNOSTI, STRED } from '../../src/lib/role';
import { platnaKauza, platnyAkter } from './ukazka';

const chyby = (schema: { safeParse: (d: unknown) => any }, data: unknown): string[] => {
  const r = schema.safeParse(data);
  return r.success ? [] : r.error.issues.map((i: { message: string }) => i.message);
};
const sVztahem = (zmena: Record<string, unknown>) => {
  const a = platnyAkter(); (a.vztahy as any)[0] = { ...(a.vztahy as any)[0], ...zmena }; return a;
};

describe('slovník rolí', () => {
  it('každá role má lidský popisek', () => {
    for (const r of [...ROLE_VZTAHU, ...ROLE_V_KAUZE, ...ROLE_NAVAZNOSTI]) expect(popisekRole(r)).toMatch(/\S/);
    expect(popisekRole('prijemce-dotace')).toBe('příjemce dotace');
    expect(popisekRole('vychazi-z')).toBe('vychází z');
  });
  it('střed mapy', () => expect(STRED).toEqual({ id: 'babis', nazev: 'Andrej Babiš' }));
});

describe('akterSchema', () => {
  it('přijme platného aktéra', () => expect(chyby(akterSchema, platnyAkter())).toEqual([]));
  it('odmítne aktéra bez vztahů', () => expect(chyby(akterSchema, { ...platnyAkter(), vztahy: [] }).join(' ')).toMatch(/aspoň jeden vztah/));
  it('odmítne vztah bez zdroje', () => expect(chyby(akterSchema, sVztahem({ zdroje: [] })).join(' ')).toMatch(/Vztah musí mít aspoň jeden zdroj/));
  it('odmítne roli, která není pro vztah', () => expect(chyby(akterSchema, sVztahem({ role: 'prijemce-dotace' })).length).toBeGreaterThan(0));
  it('odmítne konec vztahu před začátkem', () => expect(chyby(akterSchema, sVztahem({ od: 2010, do: 2004 })).join(' ')).toMatch(/Rok konce vztahu 2004/));
  it('odmítne příliš dlouhý název', () => expect(chyby(akterSchema, { ...platnyAkter(), nazev: 'x'.repeat(29) }).join(' ')).toMatch(/28 znaků/));
  it('odmítne neznámý druh', () => expect(chyby(akterSchema, { ...platnyAkter(), druh: 'urad' }).length).toBeGreaterThan(0));
  it('odmítne popis delší než 200 znaků', () => expect(chyby(akterSchema, sVztahem({ popis: 'a'.repeat(201) })).join(' ')).toMatch(/200 znaků/));
  it('ve veřejném režimu vyžaduje ověření, v konceptech ne', () => {
    expect(chyby(akterSchema, { ...platnyAkter(), overeno: null }).length).toBeGreaterThan(0);
    expect(chyby(akterSchemaKoncepty, { ...platnyAkter(), overeno: null })).toEqual([]);
  });
});

describe('vazby v kauze', () => {
  const vazba = { id: 'firma-alfa', role: 'prijemce-dotace', popis: 'Firma Alfa žádala o dotaci.', zdroje: [2] };
  const navaznost = { kauza: 'jina-kauza', role: 'vychazi-z', popis: 'Vychází ze zjištění jiné kauzy.', zdroje: [1] };
  it('pole jsou nepovinná a mají výchozí prázdný seznam', () => {
    const k = kauzaSchema.parse(platnaKauza());
    expect(k.akteri).toEqual([]);
    expect(k.navazuje).toEqual([]);
  });
  it('přijme platnou vazbu i návaznost', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [vazba], navazuje: [navaznost] })).toEqual([]));
  it('odmítne vazbu bez zdroje', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [{ ...vazba, zdroje: [] }] }).join(' ')).toMatch(/Vazba na aktéra musí mít aspoň jeden zdroj/));
  it('odmítne odkaz na neexistující zdroj', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [{ ...vazba, zdroje: [9] }] }).join(' ')).toMatch(/Vazba na aktéra „firma-alfa“ odkazuje na neexistující zdroj 9/));
  it('odmítne roli vztahu u aktéra v kauze', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [{ ...vazba, role: 'vlastni' }] }).length).toBeGreaterThan(0));
  it('odmítne dvakrát téhož aktéra', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [vazba, vazba] }).join(' ')).toMatch(/je u kauzy uvedena dvakrát/));
  it('odmítne návaznost bez zdroje a s neznámou rolí', () => {
    expect(chyby(kauzaSchema, { ...platnaKauza(), navazuje: [{ ...navaznost, zdroje: [] }] }).join(' ')).toMatch(/Návaznost musí mít aspoň jeden zdroj/);
    expect(chyby(kauzaSchema, { ...platnaKauza(), navazuje: [{ ...navaznost, role: 'prijemce-dotace' }] }).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Spustit testy a ověřit, že padají**

Run: `npx vitest run tests/unit/akteri.test.ts`
Expected: FAIL (`Cannot find module '../../src/lib/role'`).

- [ ] **Step 3: Vytvořit `src/lib/role.ts`**

```ts
/** Role vazeb na mapě souvislostí (specifikace mapy, oddíl 3). Popisky sdílí web i Metodika. */
export const ROLE_VZTAHU = ['vlastni', 'zalozil', 'clen-rodiny', 'pracovni-vztah'] as const;
export const ROLE_V_KAUZE = ['prijemce-dotace', 'dodavatel-zakazky', 'ucastnik-rizeni', 'predmet-kauzy'] as const;
export const ROLE_NAVAZNOSTI = ['vychazi-z', 'souvisejici-rizeni', 'tataz-vec'] as const;
export const DRUHY_AKTERU = ['firma', 'osoba', 'nastroj'] as const;

export type RoleVztahu = (typeof ROLE_VZTAHU)[number];
export type RoleVKauze = (typeof ROLE_V_KAUZE)[number];
export type RoleNavaznosti = (typeof ROLE_NAVAZNOSTI)[number];
export type Role = RoleVztahu | RoleVKauze | RoleNavaznosti;
export type DruhAktera = (typeof DRUHY_AKTERU)[number];

const POPISKY: Record<Role, string> = {
  'vlastni': 'vlastní',
  'zalozil': 'založil',
  'clen-rodiny': 'člen rodiny',
  'pracovni-vztah': 'pracovní vztah',
  'prijemce-dotace': 'příjemce dotace',
  'dodavatel-zakazky': 'dodavatel zakázky',
  'ucastnik-rizeni': 'účastník řízení',
  'predmet-kauzy': 'předmět kauzy',
  'vychazi-z': 'vychází z',
  'souvisejici-rizeni': 'související řízení',
  'tataz-vec': 'táž věc',
};

export const popisekRole = (r: Role): string => POPISKY[r];

/** Střed mapy. Id je vyhrazené, ve slovníku aktérů být nesmí. */
export const STRED = { id: 'babis', nazev: 'Andrej Babiš' } as const;
```

- [ ] **Step 4: Rozšířit `src/lib/schema.ts`**

Nahoru k importům přidej:
```ts
import { ROLE_VZTAHU, ROLE_V_KAUZE, ROLE_NAVAZNOSTI, DRUHY_AKTERU } from './role';
```

Za definici `udalostSchema` přidej:
```ts
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
```

V objektu kauzy (`vytvorKauzaSchema`) přidej za řádek `proc: …`:
```ts
    akteri: z.array(vazbaAkteraSchema).default([]),
    navazuje: z.array(navaznostSchema).default([]),
```

V `superRefine` kauzy přidej hned za `over(k.proc.zdroje, 'Proč je to kauza');`:
```ts
    k.akteri.forEach(a => over(a.zdroje, `Vazba na aktéra „${a.id}“`));
    k.navazuje.forEach(n => over(n.zdroje, `Návaznost na „${n.kauza}“`));
    const dvakrat = (seznam: string[], co: string) => seznam
      .filter((x, i) => seznam.indexOf(x) !== i)
      .forEach(x => ctx.addIssue({ code: 'custom', message: `${co} „${x}“ je u kauzy uvedena dvakrát` }));
    dvakrat(k.akteri.map(a => a.id), 'Vazba na aktéra');
    dvakrat(k.navazuje.map(n => n.kauza), 'Návaznost na');
```

Na konec souboru (za `export type Udalost …`) přidej:
```ts
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
```

- [ ] **Step 5: Spustit testy**

Run: `npx vitest run`
Expected: PASS (nové i stávající testy).

- [ ] **Step 6: Commit**

```bash
git add src/lib/role.ts src/lib/schema.ts tests/unit/ukazka.ts tests/unit/akteri.test.ts
git commit -m "Mapa: slovník rolí a schéma aktérů a vazeb kauz" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Načtení aktérů a kontrola vazeb

**Files:**
- Modify: `src/lib/validace.ts`
- Modify: `src/lib/kauzy.ts`
- Modify: `scripts/over-obsah.ts`
- Create: `tests/fixtures/obsah/akteri.yml`
- Modify: `tests/fixtures/obsah/kauzy/alfa-dotace.md`, `zeta-stret.md`, `epsilon-fondy.md`
- Test: `tests/unit/vazby.test.ts`, `tests/unit/validace.test.ts`

**Interfaces:**
- Consumes: `akterSchema`, `akterSchemaKoncepty`, `Akter` (Task 1), `STRED` (Task 1)
- Produces:
  - `validace.ts`: `overSlovnikAkteru(soubor: string, data: unknown, rezim?: Rezim): { akteri: Map<string, Akter>; chyby: Chyba[] }`, `nactiSlovnikAkteru(adresar: string, rezim?: Rezim)` (stejný výstup), `overVazby(adresar: string, zaznamy: KauzaZaznam[], akteri: Map<string, Akter>, rezim?: Rezim): { zaznamy: KauzaZaznam[]; chyby: Chyba[]; varovani: Chyba[] }`; `overAdresar` navíc vrací `akteri: Map<string, Akter>` a `varovani: Chyba[]`
  - `kauzy.ts`: `nactiAktery(): Map<string, Akter>`
  - fiktivní aktéři `fond-sigma` (hloubka 1), `holding-omega` (hloubka 2: vztah k `babis` 1995–2017 a k `fond-sigma` od 2017), `firma-alfa` (hloubka 3); vazby: `alfa-dotace → firma-alfa`, `zeta-stret → holding-omega` + návaznost na `alfa-dotace`, `epsilon-fondy → fond-sigma` + návaznost na `zeta-stret`; `beta-archiv`, `gama-offshore`, `delta-dluhopisy` bez aktérů

- [ ] **Step 1: Napsat padající testy**

Vytvoř `tests/unit/vazby.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { overSlovnikAkteru, overVazby, overAdresar, type KauzaZaznam } from '../../src/lib/validace';
import { kauzaSchemaKoncepty } from '../../src/lib/schema';
import { platnaKauza, platnyAkter } from './ukazka';

const akter = (id: string, nadrazeny: string) => {
  const a = platnyAkter(); (a.vztahy as any)[0].nadrazeny = nadrazeny; return [id, a] as const;
};
const kauza = (slug: string, doplnek: Record<string, unknown> = {}): KauzaZaznam =>
  ({ slug, kauza: kauzaSchemaKoncepty.parse({ ...platnaKauza(), ...doplnek }), telo: '' });
const vazba = (id: string) => ({ id, role: 'prijemce-dotace', popis: 'Fiktivní vazba.', zdroje: [1] });
const navaznost = (k: string) => ({ kauza: k, role: 'vychazi-z', popis: 'Fiktivní návaznost.', zdroje: [1] });

describe('overSlovnikAkteru', () => {
  it('načte platné aktéry', () => {
    const r = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('a', 'babis'), akter('b', 'a')]));
    expect(r.chyby).toEqual([]);
    expect([...r.akteri.keys()]).toEqual(['a', 'b']);
  });
  it('prázdný soubor je prázdný slovník', () => expect(overSlovnikAkteru('akteri.yml', null).akteri.size).toBe(0));
  it('vyhrazené id babis', () => {
    const r = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('babis', 'babis')]));
    expect(r.chyby[0].zprava).toMatch(/vyhrazené pro střed mapy/);
  });
  it('neplatné id', () => expect(overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('Žluť', 'babis')])).chyby[0].zprava).toMatch(/jen malá písmena/));
  it('neexistující nadřazený', () => {
    const r = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('a', 'neni')]));
    expect(r.chyby[0].zprava).toMatch(/neexistujícího nadřazeného „neni“/);
  });
  it('kruh ve vztazích', () => {
    const r = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('a', 'b'), akter('b', 'a')]));
    expect(r.chyby.map(c => c.zprava).join(' ')).toMatch(/tvoří kruh: a → b → a/);
  });
  it('chyby schématu nesou id aktéra', () => {
    const r = overSlovnikAkteru('akteri.yml', { a: { ...platnyAkter(), druh: 'urad' } });
    expect(r.chyby[0].zprava).toMatch(/^a\.druh:/);
  });
  it('ve veřejném režimu vyžaduje ověření', () => {
    const data = { a: { ...platnyAkter(), overeno: null } };
    expect(overSlovnikAkteru('akteri.yml', data).chyby.length).toBeGreaterThan(0);
    expect(overSlovnikAkteru('akteri.yml', data, { koncepty: true }).chyby).toEqual([]);
  });
});

describe('overVazby', () => {
  const akteri = overSlovnikAkteru('akteri.yml', Object.fromEntries([akter('a', 'babis')])).akteri;
  it('platné vazby projdou beze změny', () => {
    const r = overVazby('obsah', [kauza('k1', { akteri: [vazba('a')] }), kauza('k2', { navazuje: [navaznost('k1')] })], akteri);
    expect(r.chyby).toEqual([]);
    expect(r.varovani).toEqual([]);
    expect(r.zaznamy[0].kauza.akteri).toHaveLength(1);
    expect(r.zaznamy[1].kauza.navazuje).toHaveLength(1);
  });
  it('veřejný build: neznámý aktér a kauza jsou varování a vazba se vynechá', () => {
    const r = overVazby('obsah', [kauza('k1', { akteri: [vazba('neni')], navazuje: [navaznost('chybi')] })], akteri);
    expect(r.chyby).toEqual([]);
    expect(r.varovani.map(v => v.zprava)).toEqual([
      'Neznámý aktér „neni“ (vazba se nezobrazí)',
      'Návaznost na neexistující kauzu „chybi“ (vazba se nezobrazí)',
    ]);
    expect(r.zaznamy[0].kauza.akteri).toEqual([]);
    expect(r.zaznamy[0].kauza.navazuje).toEqual([]);
    expect(r.varovani[0].soubor).toMatch(/kauzy[\\/]k1\.md$/);
  });
  it('koncepty: neznámý aktér a kauza jsou chyba', () => {
    const r = overVazby('obsah', [kauza('k1', { akteri: [vazba('neni')], navazuje: [navaznost('chybi')] })], akteri, { koncepty: true });
    expect(r.chyby.map(c => c.zprava)).toEqual(['Neznámý aktér „neni“', 'Návaznost na neexistující kauzu „chybi“']);
  });
  it('kauza nemůže navazovat sama na sebe', () => {
    const r = overVazby('obsah', [kauza('k1', { navazuje: [navaznost('k1')] })], akteri);
    expect(r.chyby[0].zprava).toBe('Kauza nemůže navazovat sama na sebe');
  });
});

describe('overAdresar s aktéry', () => {
  it('fiktivní obsah má aktéry a vazby bez chyb a varování', () => {
    const r = overAdresar('tests/fixtures/obsah');
    expect(r.chyby).toEqual([]);
    expect(r.varovani).toEqual([]);
    expect([...r.akteri.keys()].sort()).toEqual(['firma-alfa', 'fond-sigma', 'holding-omega']);
    const zeta = r.zaznamy.find(z => z.slug === 'zeta-stret')!;
    expect(zeta.kauza.akteri.map(a => a.id)).toEqual(['holding-omega']);
    expect(zeta.kauza.navazuje.map(n => n.kauza)).toEqual(['alfa-dotace']);
  });
  it('archiv bez akteri.yml má prázdný slovník', () => expect(overAdresar('tests/fixtures/prazdny').akteri.size).toBe(0));
});
```

- [ ] **Step 2: Spustit testy a ověřit, že padají**

Run: `npx vitest run tests/unit/vazby.test.ts`
Expected: FAIL (`overSlovnikAkteru is not a function` / chybí export).

- [ ] **Step 3: Rozšířit `src/lib/validace.ts`**

Uprav import schématu a přidej import role:
```ts
import { kauzaSchema, kauzaSchemaKoncepty, akterSchema, akterSchemaKoncepty, type Kauza, type Akter } from './schema';
import { STRED } from './role';
```

Za funkci `nactiSlovnikStitku` přidej:
```ts
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
```

Funkci `overAdresar` uprav takto (změněný podpis návratové hodnoty a konec funkce):
```ts
export function overAdresar(adresar: string, rezim: Rezim = {}): { zaznamy: KauzaZaznam[]; stitky: Map<string, string>; akteri: Map<string, Akter>; chyby: Chyba[]; varovani: Chyba[] } {
  const stitky = nactiSlovnikStitku(adresar);
  const slozka = join(adresar, 'kauzy');
  const soubory = existsSync(slozka) ? readdirSync(slozka).filter(f => f.endsWith('.md')).sort() : [];
  const nactene: KauzaZaznam[] = [];
  const chyby: Chyba[] = [];
  for (const f of soubory) {
    const soubor = join(slozka, f);
    const slug = basename(f, '.md');
    if (!/^[a-z0-9-]+$/.test(slug)) { chyby.push({ soubor, zprava: 'Název souboru smí obsahovat jen malá písmena bez diakritiky, číslice a pomlčky' }); continue; }
    const { data, content } = matter(readFileSync(soubor, 'utf8'));
    const r = overKauzu(soubor, data, content, new Set(stitky.keys()), rezim);
    chyby.push(...r.chyby);
    if (r.kauza) nactene.push({ slug, kauza: r.kauza, telo: content });
  }
  const slovnik = nactiSlovnikAkteru(adresar, rezim);
  chyby.push(...slovnik.chyby);
  const vazby = overVazby(adresar, nactene, slovnik.akteri, rezim);
  chyby.push(...vazby.chyby);
  const zaznamy = vazby.zaznamy;
  zaznamy.sort((a, b) => a.kauza.od - b.kauza.od || a.kauza.nazev.localeCompare(b.kauza.nazev, 'cs'));
  return { zaznamy, stitky, akteri: slovnik.akteri, chyby, varovani: vazby.varovani };
}
```

- [ ] **Step 4: `src/lib/kauzy.ts` a `scripts/over-obsah.ts`**

V `src/lib/kauzy.ts` přidej import a export:
```ts
import type { Akter } from './schema';
// …
export const nactiAktery = (): Map<string, Akter> => nacti().akteri;
```

V `scripts/over-obsah.ts` změň destrukturaci a za úspěšný výpis přidej varování:
```ts
const { zaznamy, chyby, varovani } = overAdresar(adresar);
// … (stávající kontrola chyb beze změny)
for (const v of varovani) console.warn(`  Varování: ${v.soubor}: ${v.zprava}`);
console.log(`Obsah v pořádku: ${sklonuj(zaznamy.length, ['kauza', 'kauzy', 'kauz'])} v „${adresar}“.`);
```

- [ ] **Step 5: Fiktivní aktéři a vazby v testovacím obsahu**

Vytvoř `tests/fixtures/obsah/akteri.yml`:
```yaml
# Fiktivní aktéři jen pro testy. Neodkazují na skutečné osoby ani firmy.
fond-sigma:
  nazev: Fond Sigma
  druh: nastroj
  overeno: 2026-11-09
  vztahy:
    - nadrazeny: babis
      role: zalozil
      od: 2017
      do: null
      popis: Fiktivní osoba založila Fond Sigma v roce 2017.
      zdroje:
        - { vydavatel: Fiktivní rejstřík, titulek: Zápis Fondu Sigma, datum: 2017-02-03, druh: primarni, url: "https://example.com/sigma/zapis" }
holding-omega:
  nazev: Holding Omega
  druh: firma
  overeno: 2026-11-09
  vztahy:
    - nadrazeny: babis
      role: vlastni
      od: 1995
      do: 2017
      popis: Fiktivní osoba vlastnila Holding Omega do roku 2017.
      zdroje:
        - { vydavatel: Fiktivní rejstřík, titulek: Výpis Holdingu Omega, datum: 2017-02-01, druh: primarni, url: "https://example.com/omega/vypis" }
    - nadrazeny: fond-sigma
      role: vlastni
      od: 2017
      do: null
      popis: Od roku 2017 vlastní Holding Omega Fond Sigma.
      zdroje:
        - { vydavatel: Fiktivní deník, titulek: Holding Omega přešel do fondu, datum: 2017-02-05, druh: media, url: "https://example.com/omega/fond" }
firma-alfa:
  nazev: Firma Alfa
  druh: firma
  overeno: 2026-11-09
  vztahy:
    - nadrazeny: holding-omega
      role: vlastni
      od: 2007
      do: null
      popis: Holding Omega vlastní Firmu Alfa od roku 2007.
      zdroje:
        - { vydavatel: Fiktivní rejstřík, titulek: Výpis Firmy Alfa, datum: 2008-01-10, druh: primarni, url: "https://example.com/omega/alfa" }
```

Na konec frontmatteru (na řádek před uzavírací `---`) přidej:

`tests/fixtures/obsah/kauzy/alfa-dotace.md`:
```yaml
akteri:
  - { id: firma-alfa, role: prijemce-dotace, popis: Firma Alfa žádala o fiktivní dotaci pro malé podniky., zdroje: [2] }
```

`tests/fixtures/obsah/kauzy/zeta-stret.md`:
```yaml
akteri:
  - { id: holding-omega, role: predmet-kauzy, popis: Fiktivní úřad posuzuje střet zájmů u Holdingu Omega., zdroje: [1] }
navazuje:
  - { kauza: alfa-dotace, role: souvisejici-rizeni, popis: Řízení se týká stejné fiktivní dotace jako kauza Alfa., zdroje: [1] }
```

`tests/fixtures/obsah/kauzy/epsilon-fondy.md`:
```yaml
akteri:
  - { id: fond-sigma, role: predmet-kauzy, popis: Kauza se týká vložení fiktivního holdingu do Fondu Sigma., zdroje: [1] }
navazuje:
  - { kauza: zeta-stret, role: souvisejici-rizeni, popis: Fiktivní komise v kauze Epsilon vychází ze spisu kauzy Žeta., zdroje: [2] }
```

- [ ] **Step 6: Spustit všechny unit testy**

Run: `npx vitest run`
Expected: PASS. Stávající `tests/unit/validace.test.ts` musí projít beze změny (počet 6 kauz, žádné chyby).

- [ ] **Step 7: Ověřit, že build a koncepty stále projdou**

Run: `npm run build:e2e` a `npx tsx _koncepty/over.ts`
Expected: build bez chyby. Kontrola konceptů vypíše stejný výstup jako před změnou (nová pole jsou nepovinná). Pro srovnání si `npx tsx _koncepty/over.ts` spusť i před Step 3.

- [ ] **Step 8: Commit**

```bash
git add src/lib/validace.ts src/lib/kauzy.ts scripts/over-obsah.ts tests/fixtures/obsah tests/unit/vazby.test.ts
git commit -m "Mapa: slovník aktérů a kontrola vazeb kauz (veřejně varování, v konceptech chyba)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Graf a rozložení mapy

**Files:**
- Create: `src/lib/mapa.ts`
- Test: `tests/unit/mapa.test.ts`

**Interfaces:**
- Consumes: `KauzaZaznam` (`validace.ts`), `Akter` (Task 1), `STRED`, `popisekRole` (Task 1), `rozsahText(od, do)` z `src/lib/casova-osa.ts` (vrací `"2004–2019"`, `"2017 – dosud"`)
- Produces (vše čisté funkce bez DOM, použitelné v prohlížeči):
  ```ts
  type OdkazZdroje = { vydavatel: string; titulek: string; datum: string; url: string };
  type TypUzlu = 'stred' | 'akter' | 'kauza';
  type Uzel = { id: string; typ: TypUzlu; nazev: string; hloubka: number; slug?: string; od?: number; roky?: string };
  type DruhHrany = 'vztah' | 'akter' | 'stred' | 'navaznost';
  type Hrana = { id: string; druh: DruhHrany; rodic: string; potomek: string; hlavni: boolean;
                 roleText: string | null; obdobi: string | null; popis: string | null; zdroje: OdkazZdroje[] };
  type Graf = { uzly: Uzel[]; hrany: Hrana[]; deti: Record<string, string[]> };
  idAktera(id: string): string        // 'a:<id>'
  idKauzy(slug: string): string       // 'k:<slug>'
  sestavGraf(zaznamy: KauzaZaznam[], akteri: Map<string, Akter>): Graf
  viditelneUzly(graf: Graf, viditelne: Iterable<string> | null): Set<string>   // viditelne = slugy kauz, null = všechny
  ROZMERY: { radek: 30; okraj: 16; vyskaUzlu: 22; stred: 120; akter: 200; kauza: 260; mezera: 36; oblouky: 130 }
  type UmisteniUzlu = { id: string; typ: TypUzlu; nazev: string; x: number; y: number; w: number };
  type Cara = { id: string; druh: DruhHrany; d: string; popisek: string | null; px: number; py: number };
  type Rozlozeni = { sirka: number; vyska: number; uzly: UmisteniUzlu[]; cary: Cara[] };
  rozlozMapu(graf: Graf, viditelne: Iterable<string> | null): Rozlozeni
  zvyrazneni(graf: Graf, id: string): { uzly: Set<string>; hrany: Set<string> }
  type VazbyKauzy = { akteri: { nazev: string; roleText: string; popis: string; zdroje: number[] }[];
                      navazuje: { slug: string; nazev: string; roleText: string; popis: string; zdroje: number[] }[];
                      navazujiNaNi: { slug: string; nazev: string }[] };
  vazbyKauzy(zaznamy: KauzaZaznam[], akteri: Map<string, Akter>, slug: string): VazbyKauzy
  ```
  Hrana `navaznost`: `rodic` = kauza, na kterou se navazuje, `potomek` = navazující kauza. Uzel `stred` má id `babis`.

- [ ] **Step 1: Napsat padající testy**

Vytvoř `tests/unit/mapa.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { overAdresar } from '../../src/lib/validace';
import { sestavGraf, rozlozMapu, viditelneUzly, zvyrazneni, vazbyKauzy, idKauzy, idAktera, ROZMERY } from '../../src/lib/mapa';

const { zaznamy, akteri } = overAdresar('tests/fixtures/obsah');
const graf = sestavGraf(zaznamy, akteri);
const uzel = (id: string) => graf.uzly.find(u => u.id === id)!;

describe('sestavGraf', () => {
  it('střed, tři aktéři a šest kauz', () => {
    expect(graf.uzly).toHaveLength(10);
    expect(uzel('babis')).toMatchObject({ typ: 'stred', nazev: 'Andrej Babiš', hloubka: 0 });
  });
  it('hloubka aktéra je nejdelší cesta ke středu', () => {
    expect(uzel(idAktera('fond-sigma')).hloubka).toBe(1);
    expect(uzel(idAktera('holding-omega')).hloubka).toBe(2);
    expect(uzel(idAktera('firma-alfa')).hloubka).toBe(3);
  });
  it('hlavní strom: aktéři před kauzami, kauzy podle začátku', () => {
    expect(graf.deti['babis']).toEqual(['a:fond-sigma', 'k:beta-archiv', 'k:gama-offshore', 'k:delta-dluhopisy']);
    expect(graf.deti['a:fond-sigma']).toEqual(['a:holding-omega', 'k:epsilon-fondy']);
    expect(graf.deti['a:holding-omega']).toEqual(['a:firma-alfa', 'k:zeta-stret']);
    expect(graf.deti['a:firma-alfa']).toEqual(['k:alfa-dotace']);
  });
  it('hrany: čtyři vztahy, tři aktéři v kauzách, tři kauzy pod středem, dvě návaznosti', () => {
    const pocet = (d: string) => graf.hrany.filter(h => h.druh === d).length;
    expect([pocet('vztah'), pocet('akter'), pocet('stred'), pocet('navaznost')]).toEqual([4, 3, 3, 2]);
  });
  it('aktér s více vztahy: hlavní je ten k nejhlubšímu nadřazenému, oba mají roli a období', () => {
    const vztahy = graf.hrany.filter(h => h.druh === 'vztah' && h.potomek === 'a:holding-omega');
    expect(vztahy.map(h => [h.rodic, h.hlavni, h.roleText, h.obdobi])).toEqual([
      ['babis', false, 'vlastní', '1995–2017'],
      ['a:fond-sigma', true, 'vlastní', '2017 – dosud'],
    ]);
  });
  it('vazba aktéra v kauze nese popis a plné zdroje z kauzy', () => {
    const h = graf.hrany.find(h => h.druh === 'akter' && h.potomek === 'k:alfa-dotace')!;
    expect(h).toMatchObject({ rodic: 'a:firma-alfa', roleText: 'příjemce dotace', popis: 'Firma Alfa žádala o fiktivní dotaci pro malé podniky.' });
    expect(h.zdroje[0].url).toBe('https://example.com/alfa/clanek');
  });
  it('návaznost vede od kauzy, na kterou se navazuje, k navazující', () => {
    const h = graf.hrany.find(h => h.druh === 'navaznost' && h.potomek === 'k:zeta-stret')!;
    expect(h).toMatchObject({ rodic: 'k:alfa-dotace', roleText: 'související řízení', hlavni: false });
  });
  it('graf jde převést na JSON a zpět beze ztráty', () => expect(JSON.parse(JSON.stringify(graf))).toEqual(graf));
});

describe('viditelneUzly', () => {
  it('bez filtru je vidět vše', () => expect(viditelneUzly(graf, null).size).toBe(10));
  it('aktér zůstane, jen když pod ním zbyde kauza', () => {
    expect([...viditelneUzly(graf, ['epsilon-fondy'])].sort()).toEqual(['a:fond-sigma', 'babis', 'k:epsilon-fondy']);
  });
  it('prázdný filtr nechá jen střed', () => expect([...viditelneUzly(graf, [])]).toEqual(['babis']));
});

describe('rozlozMapu', () => {
  const r = rozlozMapu(graf, null);
  const m = (id: string) => r.uzly.find(u => u.id === id)!;
  it('sloupce podle hloubky a kauzy vpravo', () => {
    expect(m('babis').x).toBe(ROZMERY.okraj);
    expect(m('a:fond-sigma').x).toBe(ROZMERY.okraj + ROZMERY.stred + ROZMERY.mezera);
    const kauzyX = m('k:alfa-dotace').x;
    expect(new Set(r.uzly.filter(u => u.typ === 'kauza').map(u => u.x))).toEqual(new Set([kauzyX]));
    expect(kauzyX).toBe(ROZMERY.okraj + ROZMERY.stred + ROZMERY.mezera + 2 * (ROZMERY.akter + ROZMERY.mezera) + ROZMERY.akter + ROZMERY.mezera);
    expect(r.sirka).toBe(kauzyX + ROZMERY.kauza + ROZMERY.oblouky);
  });
  it('řádky v pořadí průchodu stromem, rodič uprostřed svých listů', () => {
    const poradi = r.uzly.filter(u => u.typ === 'kauza').sort((a, b) => a.y - b.y).map(u => u.id);
    expect(poradi).toEqual(['k:alfa-dotace', 'k:zeta-stret', 'k:epsilon-fondy', 'k:beta-archiv', 'k:gama-offshore', 'k:delta-dluhopisy']);
    expect(m('k:alfa-dotace').y).toBe(31);
    expect(m('a:holding-omega').y).toBe(46);
    expect(m('a:fond-sigma').y).toBe(61);
    expect(m('babis').y).toBe(106);
    expect(r.vyska).toBe(2 * 16 + 6 * 30);
  });
  it('každá hrana má čáru, popisek jen hrany s rolí', () => {
    expect(r.cary).toHaveLength(12);
    expect(r.cary.filter(c => c.druh === 'stred').every(c => c.popisek === null)).toBe(true);
    expect(r.cary.find(c => c.druh === 'vztah' && c.popisek?.includes('1995–2017'))?.popisek).toBe('vlastní · 1995–2017');
  });
  it('návaznost je oblouk napravo od sloupce kauz', () => {
    const c = r.cary.find(c => c.druh === 'navaznost')!;
    expect(c.d.startsWith(`M${m('k:alfa-dotace').x + ROZMERY.kauza} `)).toBe(true);
  });
  it('filtr přepočítá rozložení bez prázdných míst', () => {
    const f = rozlozMapu(graf, ['beta-archiv']);
    expect(f.uzly.map(u => u.id)).toEqual(['babis', 'k:beta-archiv']);
    expect(f.cary).toHaveLength(1);
    expect(f.vyska).toBe(2 * 16 + 30);
  });
  it('nic viditelného = prázdné rozložení', () => expect(rozlozMapu(graf, [])).toEqual({ sirka: 0, vyska: 0, uzly: [], cary: [] }));
});

describe('zvyrazneni', () => {
  it('kauza: cesta ke středu přes všechny vztahy a navazující kauzy', () => {
    const z = zvyrazneni(graf, idKauzy('alfa-dotace'));
    expect([...z.uzly].sort()).toEqual(['a:firma-alfa', 'a:fond-sigma', 'a:holding-omega', 'babis', 'k:alfa-dotace', 'k:zeta-stret']);
    expect(z.hrany.size).toBe(6);
  });
  it('aktér: nadřazení i vše pod ním, ne sousední větve', () => {
    const z = zvyrazneni(graf, idAktera('holding-omega'));
    expect([...z.uzly].sort()).toEqual(['a:firma-alfa', 'a:fond-sigma', 'a:holding-omega', 'babis', 'k:alfa-dotace', 'k:zeta-stret']);
    expect(z.uzly.has('k:epsilon-fondy')).toBe(false);
  });
  it('střed zvýrazní vše', () => expect(zvyrazneni(graf, 'babis').uzly.size).toBe(10));
});

describe('vazbyKauzy', () => {
  it('aktéři, návaznosti a dopočítaný opačný směr', () => {
    expect(vazbyKauzy(zaznamy, akteri, 'zeta-stret')).toEqual({
      akteri: [{ nazev: 'Holding Omega', roleText: 'předmět kauzy', popis: 'Fiktivní úřad posuzuje střet zájmů u Holdingu Omega.', zdroje: [1] }],
      navazuje: [{ slug: 'alfa-dotace', nazev: 'Testovací kauza Alfa', roleText: 'související řízení', popis: 'Řízení se týká stejné fiktivní dotace jako kauza Alfa.', zdroje: [1] }],
      navazujiNaNi: [{ slug: 'epsilon-fondy', nazev: 'Testovací kauza Epsilon, delší název' }],
    });
  });
  it('kauza bez vazeb a neznámá kauza', () => {
    expect(vazbyKauzy(zaznamy, akteri, 'beta-archiv')).toEqual({ akteri: [], navazuje: [], navazujiNaNi: [] });
    expect(vazbyKauzy(zaznamy, akteri, 'neni')).toEqual({ akteri: [], navazuje: [], navazujiNaNi: [] });
  });
});
```

- [ ] **Step 2: Spustit testy a ověřit, že padají**

Run: `npx vitest run tests/unit/mapa.test.ts`
Expected: FAIL (`Cannot find module '../../src/lib/mapa'`).

- [ ] **Step 3: Vytvořit `src/lib/mapa.ts`**

```ts
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
    const hlavni = a.vztahy.reduce((m, v) => (hloubka(v.nadrazeny) > hloubka(m.nadrazeny) ? v : m));
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

export const ROZMERY = { radek: 30, okraj: 16, vyskaUzlu: 22, stred: 120, akter: 200, kauza: 260, mezera: 36, oblouky: 130 } as const;
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
  const cary: Cara[] = [];
  for (const h of graf.hrany) {
    const a = misto.get(h.rodic), b = misto.get(h.potomek);
    if (!a || !b) continue;
    const popisek = [h.roleText, h.obdobi].filter(Boolean).join(' · ') || null;
    if (h.druh === 'navaznost') {
      const x = kauzyX + R.kauza, ohyb = Math.min(40, 12 + Math.abs(b.y - a.y) / 8);
      cary.push({ id: h.id, druh: h.druh, d: `M${x} ${a.y} C${x + ohyb} ${a.y} ${x + ohyb} ${b.y} ${x} ${b.y}`, popisek, px: x + ohyb + 6, py: (a.y + b.y) / 2 + 4 });
    } else {
      const x1 = a.x + a.w, x2 = b.x, sx = (x1 + x2) / 2;
      cary.push({ id: h.id, druh: h.druh, d: `M${x1} ${a.y} C${sx} ${a.y} ${sx} ${b.y} ${x2} ${b.y}`, popisek, px: sx, py: (a.y + b.y) / 2 - 4 });
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
```

- [ ] **Step 4: Spustit testy**

Run: `npx vitest run tests/unit/mapa.test.ts`
Expected: PASS. Pokud nesedí přesné souřadnice y, nejdřív zkontroluj pořadí `graf.deti` (test „hlavní strom“). Souřadnice z něj přímo plynou.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mapa.ts tests/unit/mapa.test.ts
git commit -m "Mapa: graf vazeb, rozložení ve vrstvách, zvýraznění a vazby pro detail" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: SVG a strom jako HTML

**Files:**
- Modify: `src/lib/html.ts`
- Create: `src/lib/mapa-html.ts`
- Test: `tests/unit/mapa-html.test.ts`

**Interfaces:**
- Consumes: `Graf`, `Hrana`, `Rozlozeni`, `ROZMERY`, `rozlozMapu`, `sestavGraf` (Task 3), `STRED` (Task 1), `datumText(datum)` z `src/lib/casova-osa.ts`
- Produces:
  - `html.ts`: `escapujHtml(t: string): string`
  - `mapa-html.ts`: `svgMapy(r: Rozlozeni): string`, `stromMapy(graf: Graf): string`
  - Markup, na který spoléhají Task 5–7:
    - SVG `svg.mapa-svg[aria-hidden="true"]`, uzly `g.m-uzel.m-<typ>[data-uzel]` s `rect` a `text`, čáry `g.m-cara.m-<druh>[data-hrana]` s `path.m-viditelna` a `path.m-zasah`, popisky `text.m-popisek[data-hrana]`
    - strom `ul.strom > li.s-stred[data-uzel="babis"]`; položka aktéra `li.s-akter-polozka[data-uzel][data-hrana][data-hloubka]` (+ `data-hlavni` u hlavní hrany) s `button.s-akter` (má `aria-expanded` a `aria-controls`, jen když má podstrom `ul#s-pod-N`); položka kauzy `li.s-kauza[data-uzel][data-hrana][data-slug]` s `a[data-slug]`; `button.s-info[aria-controls="s-vazba-<hrana>"]` a `div.s-vazba#s-vazba-<hrana>[hidden]` (přímý potomek prvku s `data-hrana`); návaznost `div.s-navazuje[data-hrana]` v hlavní položce navazující kauzy

- [ ] **Step 1: Napsat padající testy**

Vytvoř `tests/unit/mapa-html.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { overAdresar } from '../../src/lib/validace';
import { sestavGraf, rozlozMapu } from '../../src/lib/mapa';
import { svgMapy, stromMapy } from '../../src/lib/mapa-html';
import { escapujHtml } from '../../src/lib/html';

const { zaznamy, akteri } = overAdresar('tests/fixtures/obsah');
const graf = sestavGraf(zaznamy, akteri);

describe('escapujHtml', () => {
  it('zneškodní znaky HTML', () => expect(escapujHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;'));
});

describe('svgMapy', () => {
  const svg = svgMapy(rozlozMapu(graf, null));
  it('je skryté pro čtečky a má rozměry rozložení', () => {
    expect(svg).toMatch(/^<svg class="mapa-svg"[^>]* aria-hidden="true"/);
    const r = rozlozMapu(graf, null);
    expect(svg).toContain(`viewBox="0 0 ${r.sirka} ${r.vyska}"`);
  });
  it('uzly, čáry a popisky nesou data-atributy', () => {
    expect(svg.match(/class="m-uzel m-kauza"/g)).toHaveLength(6);
    expect(svg.match(/class="m-uzel m-akter"/g)).toHaveLength(3);
    expect(svg).toContain('data-uzel="k:alfa-dotace"');
    expect(svg.match(/class="m-cara m-navaznost"/g)).toHaveLength(2);
    expect(svg).toContain('>vlastní · 1995–2017</text>');
  });
  it('escapuje názvy', () => {
    const r = { sirka: 100, vyska: 50, uzly: [{ id: 'k:x', typ: 'kauza' as const, nazev: '<script>', x: 0, y: 20, w: 50 }], cary: [] };
    expect(svgMapy(r)).toContain('&lt;script&gt;');
  });
  it('prázdné rozložení = prázdné SVG', () => expect(svgMapy(rozlozMapu(graf, []))).toBe('<svg class="mapa-svg" aria-hidden="true" focusable="false" width="0" height="0"></svg>'));
});

describe('stromMapy', () => {
  const html = stromMapy(graf);
  it('kořenem je střed', () => expect(html.startsWith('<ul class="strom"><li class="s-stred" data-uzel="babis"><span class="s-nazev">Andrej Babiš</span>')).toBe(true));
  it('aktér s podstromem má rozbalovací tlačítko a hloubku', () => {
    expect(html).toMatch(/<li class="s-akter-polozka" data-uzel="a:fond-sigma" data-hrana="h\d+" data-hlavni data-hloubka="1">/);
    expect(html).toMatch(/<button type="button" class="s-akter" aria-expanded="true" aria-controls="s-pod-\d+">Fond Sigma<\/button>/);
  });
  it('vedlejší vztah aktéra je jen odkazový řádek bez podstromu', () => {
    const vedlejsi = html.match(/<li class="s-akter-polozka" data-uzel="a:holding-omega" data-hrana="h\d+" data-hloubka="2">.*?<\/li>/)![0];
    expect(vedlejsi).toContain('<button type="button" class="s-akter">Holding Omega</button>');
    expect(vedlejsi).toContain('vlastní · 1995–2017');
    expect(vedlejsi).not.toContain('<ul id="s-pod');
  });
  it('kauza je odkaz s roky, rolí a vysvětlením vazby se zdrojem', () => {
    expect(html).toMatch(/<li class="s-kauza" data-uzel="k:alfa-dotace" data-hrana="(h\d+)" data-hlavni data-slug="alfa-dotace"><div class="s-radek"><a href="\/kauzy\/alfa-dotace\/" data-slug="alfa-dotace">Testovací kauza Alfa<\/a>/);
    expect(html).toContain('<span class="s-role">příjemce dotace</span>');
    expect(html).toMatch(/<div class="s-vazba" id="s-vazba-h\d+" hidden><p>Firma Alfa žádala o fiktivní dotaci pro malé podniky\.<\/p><ul class="s-zdroje"><li><a href="https:\/\/example\.com\/alfa\/clanek"/);
  });
  it('návaznost je u navazující kauzy jako odkaz', () => {
    expect(html).toMatch(/<div class="s-navazuje" data-hrana="h\d+">navazuje na: <a href="\/kauzy\/alfa-dotace\/" data-slug="alfa-dotace">Testovací kauza Alfa<\/a>/);
  });
  it('kauza bez aktérů visí pod středem bez role a bez ⓘ', () => {
    const beta = html.match(/<li class="s-kauza" data-uzel="k:beta-archiv".*?<\/li>/)![0];
    expect(beta).not.toContain('s-role');
    expect(beta).not.toContain('s-info');
  });
});
```

- [ ] **Step 2: Spustit testy a ověřit, že padají**

Run: `npx vitest run tests/unit/mapa-html.test.ts`
Expected: FAIL (chybí `escapujHtml` a modul `mapa-html`).

- [ ] **Step 3: `escapujHtml` v `src/lib/html.ts`**

Přidej na konec souboru:
```ts
/** Text bezpečný pro vložení do HTML i do hodnoty atributu v uvozovkách. */
export function escapujHtml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
```

- [ ] **Step 4: Vytvořit `src/lib/mapa-html.ts`**

```ts
import { escapujHtml as e } from './html';
import { ROZMERY, type Graf, type Hrana, type Rozlozeni } from './mapa';
import { STRED } from './role';
import { datumText } from './casova-osa';

/** Obrázek mapy. Je skrytý pro čtečky, ovládá se přes strom (stromMapy). */
export function svgMapy(r: Rozlozeni): string {
  if (r.uzly.length === 0) return '<svg class="mapa-svg" aria-hidden="true" focusable="false" width="0" height="0"></svg>';
  const v = ROZMERY.vyskaUzlu;
  const cary = r.cary.map(c =>
    `<g class="m-cara m-${c.druh}" data-hrana="${c.id}"><path class="m-viditelna" d="${c.d}"/><path class="m-zasah" d="${c.d}"/></g>`).join('');
  const uzly = r.uzly.map(u =>
    `<g class="m-uzel m-${u.typ}" data-uzel="${e(u.id)}" transform="translate(${u.x} ${u.y})"><rect x="0" y="${-v / 2}" width="${u.w}" height="${v}" rx="3"/><text x="8" y="4.5">${e(u.nazev)}</text></g>`).join('');
  const popisky = r.cary.filter(c => c.popisek).map(c =>
    `<text class="m-popisek" data-hrana="${c.id}" x="${c.px}" y="${c.py}"${c.druh === 'navaznost' ? '' : ' text-anchor="middle"'}>${e(c.popisek!)}</text>`).join('');
  return `<svg class="mapa-svg" xmlns="http://www.w3.org/2000/svg" width="${r.sirka}" height="${r.vyska}" viewBox="0 0 ${r.sirka} ${r.vyska}" aria-hidden="true" focusable="false">`
    + `<g class="m-cary">${cary}</g><g class="m-uzly">${uzly}</g><g class="m-popisky">${popisky}</g></svg>`;
}

/** Přístupná podoba mapy: vnořené seznamy. Na mobilu je vidět, na počítači je vizuálně skrytá,
 *  ale ovládá se přes ni klávesnicí a čte ji čtečka. Kauza je pod každým svým aktérem,
 *  podstrom aktéra jen pod hlavním nadřazeným (jinde je jen řádek s rolí a obdobím). */
export function stromMapy(graf: Graf): string {
  const podle = new Map(graf.uzly.map(u => [u.id, u]));
  const vychozi = new Map<string, Hrana[]>();
  const navaznosti = new Map<string, Hrana[]>();
  for (const h of graf.hrany) {
    const [mapa, klic] = h.druh === 'navaznost' ? [navaznosti, h.potomek] : [vychozi, h.rodic];
    if (!mapa.has(klic)) mapa.set(klic, []);
    mapa.get(klic)!.push(h);
  }
  const poradi = (rodic: string): Hrana[] => {
    const hl = graf.deti[rodic] ?? [];
    return (vychozi.get(rodic) ?? []).slice().sort((a, b) =>
      Number(!a.hlavni) - Number(!b.hlavni)
      || (a.hlavni ? hl.indexOf(a.potomek) - hl.indexOf(b.potomek) : 0)
      || podle.get(a.potomek)!.nazev.localeCompare(podle.get(b.potomek)!.nazev, 'cs'));
  };
  const role = (h: Hrana) => {
    const t = [h.roleText, h.obdobi].filter(Boolean).join(' · ');
    return t ? ` <span class="s-role">${e(t)}</span>` : '';
  };
  const info = (h: Hrana, nazev: string) => h.popis
    ? ` <button type="button" class="s-info" aria-expanded="false" aria-controls="s-vazba-${h.id}" aria-label="Vazba: ${e(nazev)}">ⓘ</button>` : '';
  const vazba = (h: Hrana) => h.popis
    ? `<div class="s-vazba" id="s-vazba-${h.id}" hidden><p>${e(h.popis)}</p><ul class="s-zdroje">${h.zdroje.map(z =>
      `<li><a href="${e(z.url)}" rel="noopener noreferrer" target="_blank">${e(z.vydavatel)}: ${e(z.titulek)} (${e(datumText(z.datum))})</a></li>`).join('')}</ul></div>` : '';
  let n = 0;
  const polozka = (h: Hrana): string => {
    const u = podle.get(h.potomek)!;
    const spol = `data-uzel="${e(u.id)}" data-hrana="${h.id}"${h.hlavni ? ' data-hlavni' : ''}`;
    if (u.typ === 'kauza') {
      const nav = h.hlavni ? (navaznosti.get(u.id) ?? []).map(x => {
        const cil = podle.get(x.rodic)!;
        return `<div class="s-navazuje" data-hrana="${x.id}">navazuje na: <a href="/kauzy/${e(cil.slug!)}/" data-slug="${e(cil.slug!)}">${e(cil.nazev)}</a>${role(x)}${info(x, cil.nazev)}${vazba(x)}</div>`;
      }).join('') : '';
      return `<li class="s-kauza" ${spol} data-slug="${e(u.slug!)}"><div class="s-radek"><a href="/kauzy/${e(u.slug!)}/" data-slug="${e(u.slug!)}">${e(u.nazev)}</a> <span class="s-roky">${e(u.roky!)}</span>${role(h)}${info(h, u.nazev)}</div>${vazba(h)}${nav}</li>`;
    }
    const pod = h.hlavni ? poradi(u.id).map(polozka).join('') : '';
    const idPod = `s-pod-${++n}`;
    const tlacitko = pod
      ? `<button type="button" class="s-akter" aria-expanded="true" aria-controls="${idPod}">${e(u.nazev)}</button>`
      : `<button type="button" class="s-akter">${e(u.nazev)}</button>`;
    return `<li class="s-akter-polozka" ${spol} data-hloubka="${u.hloubka}"><div class="s-radek">${tlacitko}${role(h)}${info(h, u.nazev)}</div>${vazba(h)}${pod ? `<ul id="${idPod}">${pod}</ul>` : ''}</li>`;
  };
  return `<ul class="strom"><li class="s-stred" data-uzel="${STRED.id}"><span class="s-nazev">${e(STRED.nazev)}</span><ul>${poradi(STRED.id).map(polozka).join('')}</ul></li></ul>`;
}
```

- [ ] **Step 5: Spustit testy**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/html.ts src/lib/mapa-html.ts tests/unit/mapa-html.test.ts
git commit -m "Mapa: SVG a přístupný strom jako HTML" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Mapa na hlavní stránce (přepínač, adresa, filtry)

**Files:**
- Create: `src/components/PrepinacPohledu.astro`, `src/components/Mapa.astro`, `src/scripts/mapa.ts`, `src/scripts/stav-filtru.ts`, `src/styles/mapa.css`
- Modify: `src/components/Osa.astro`, `src/components/Filtry.astro`, `src/components/HlavniStranka.astro`, `src/lib/kauzy.ts`, `src/scripts/filtry.ts`, `tests/unit/styly.test.ts`
- Test: `tests/e2e/mapa.spec.ts`

**Interfaces:**
- Consumes: `sestavGraf`, `rozlozMapu`, `viditelneUzly`, `Graf` (Task 3), `svgMapy`, `stromMapy` (Task 4), `nactiAktery` (Task 2), `jsonDoSkriptu` (`html.ts`)
- Produces:
  - `kauzy.ts`: `nactiGraf(): Graf`, `maMapu(): boolean`
  - `stav-filtru.ts`: `viditelneKauzy(): string[] | null`, `nastavViditelne(slugy: string[]): void` (vyšle `nv:filtr`)
  - `scripts/mapa.ts`: `type Pohled = 'osa' | 'mapa'`, `pohledZAdresy(): Pohled`, `nastavPohled(p: Pohled, o?: { zapsat?: boolean }): void` (vyšle `nv:pohled`), `inicializujMapu(): void`
  - DOM: `#graf[data-pohled]`, `.pohled button[data-pohled][aria-pressed]`, `.mapa` (uvnitř `#graf`), `.mapa-prazdno`, `.mapa-panel` (použije Task 6), `script#nv-mapa` (JSON grafu)
  - Události: `nv:filtr` (detail: `string[]` slugů), `nv:pohled` (detail: `Pohled`)

- [ ] **Step 1: Napsat padající e2e testy**

Vytvoř `tests/e2e/mapa.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const prepinac = (page: Page) => page.locator('.osa-roku .pohled');

test('přepínač ukáže mapu a zapíše pohled do adresy', async ({ page }) => {
  await page.goto('/');
  await expect(prepinac(page).getByRole('button', { name: 'Osa' })).toHaveAttribute('aria-pressed', 'true');
  await prepinac(page).getByRole('button', { name: 'Mapa' }).click();
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
  await expect(prepinac(page).getByRole('button', { name: 'Mapa' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.mapa-svg')).toBeVisible();
  await expect(page.locator('.radky')).toBeHidden();
  await expect(page.locator('.mapa-svg [data-uzel="babis"]')).toContainText('Andrej Babiš');
  await expect(page.locator('.mapa-svg .m-kauza')).toHaveCount(6);
  await expect(page.locator('.mapa-svg .m-akter')).toHaveCount(3);
  await prepinac(page).getByRole('button', { name: 'Osa' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.radky')).toBeVisible();
});

test('adresa ?pohled=mapa otevře rovnou mapu', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await expect(page.locator('#graf')).toHaveAttribute('data-pohled', 'mapa');
  await expect(page.locator('.mapa-svg')).toBeVisible();
});

test('filtr skryje kauzy i aktéry, kterým nezbyde kauza; prázdný výsledek má hlášku', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const hledat = page.getByRole('searchbox', { name: 'Hledat v kauzách' });
  await hledat.fill('Beta');
  await expect(page.locator('.mapa-svg .m-kauza')).toHaveCount(1);
  await expect(page.locator('.mapa-svg .m-akter')).toHaveCount(0);
  await expect(page.locator('.strom li[data-uzel="a:fond-sigma"]').first()).toBeHidden();
  await hledat.fill('nic takového neexistuje');
  await expect(page.locator('.mapa-prazdno')).toBeVisible();
  await hledat.fill('');
  await expect(page.locator('.mapa-svg .m-kauza')).toHaveCount(6);
});

test('návrat z mapy na osu po filtru: osa a stránkování sedí', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('Beta');
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('');
  await prepinac(page).getByRole('button', { name: 'Osa' }).click();
  await expect(page.locator('.radek:not([hidden])')).toHaveCount(6);
  await expect(page.locator('.strankovani')).toBeHidden();
});

test('názvy se vejdou do uzlů', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const pretekaji = await page.locator('.mapa-svg .m-uzel').evaluateAll(gs => gs
    .filter(g => (g.querySelector('text') as SVGTextElement).getBBox().width > Number(g.querySelector('rect')!.getAttribute('width')) - 8)
    .map(g => g.getAttribute('data-uzel')));
  expect(pretekaji).toEqual([]);
});

for (const v of VELIKOSTI) {
  test(`mapa ${v.width}×${v.height} se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/?pohled=mapa');
    await expect(page.locator('#graf')).toHaveAttribute('data-pohled', 'mapa');
    await overBezPosouvani(page);
  });
}

test('prázdný archiv nemá přepínač mapy', async ({ page }) => {
  await page.goto('http://localhost:4322/');
  await expect(page.locator('.pohled')).toHaveCount(0);
});
```

- [ ] **Step 2: Spustit a ověřit, že padají**

Run: `npm run build:e2e && npx playwright test tests/e2e/mapa.spec.ts`
Expected: FAIL (`.osa-roku .pohled` neexistuje).

- [ ] **Step 3: Sdílený stav filtru a úpravy `src/scripts/filtry.ts`**

Vytvoř `src/scripts/stav-filtru.ts`:
```ts
/** Výsledek filtrů sdílený mezi osou a mapou. null = filtr ještě neproběhl (vše viditelné). */
let viditelne: string[] | null = null;

export const viditelneKauzy = (): string[] | null => viditelne;

export function nastavViditelne(slugy: string[]): void {
  viditelne = slugy;
  document.dispatchEvent(new CustomEvent('nv:filtr', { detail: slugy }));
}
```

V `src/scripts/filtry.ts`:
1. Import: `import { nastavViditelne } from './stav-filtru';`
2. Za `let naStranku = Infinity; …` přidej `let posledniVysledek: string | null = null;`
3. Na konec funkce `proved` (za `vykresliStrankovani();`) přidej:
```ts
    // mapa se překresluje jen při změně výsledku, ne při listování stránkami
    const klic = shoda.map(p => p.slug).join(' ');
    if (klic !== posledniVysledek) { posledniVysledek = klic; nastavViditelne(shoda.map(p => p.slug)); }
```
4. Na začátek funkce `prepocitej` (před `const v = graf.clientHeight;`) přidej:
```ts
    // v pohledu mapy jsou řádky osy skryté, měřit se nedají
    if (graf.dataset.pohled === 'mapa') return;
```
5. Za řádek `new ResizeObserver(prepocitej).observe(graf);` přidej:
```ts
  // po návratu z mapy na osu přepočítat stránkování (velikost grafu se nezměnila, ResizeObserver mlčí)
  document.addEventListener('nv:pohled', () => { posledniVyska = -1; prepocitej(); });
```

- [ ] **Step 4: `src/lib/kauzy.ts`**

Přidej:
```ts
import { sestavGraf, type Graf } from './mapa';
// …
const grafy = new WeakMap<object, Graf>();
export function nactiGraf(): Graf {
  const d = nacti();
  if (!grafy.has(d)) grafy.set(d, sestavGraf(d.zaznamy, d.akteri));
  return grafy.get(d)!;
}

/** Přepínač Osa | Mapa: ve veřejném buildu až s prvním ověřeným aktérem, v náhledu konceptů vždy. */
export const maMapu = (): boolean => nactiKauzy().length > 0 && (rezimKonceptu() || nactiAktery().size > 0);
```

- [ ] **Step 5: Komponenty**

`src/components/PrepinacPohledu.astro`:
```astro
---
// Na počítači je v záhlaví osy, na mobilu v řádku filtrů (stejně jako počítadlo); CSS ukáže jen jeden.
---
<div class="pohled" role="group" aria-label="Zobrazení kauz">
  <button type="button" data-pohled="osa" aria-pressed="true">Osa</button>
  <button type="button" data-pohled="mapa" aria-pressed="false">Mapa</button>
</div>
```

`src/components/Mapa.astro`:
```astro
---
import { rozlozMapu, type Graf } from '../lib/mapa';
import { svgMapy, stromMapy } from '../lib/mapa-html';
import { jsonDoSkriptu } from '../lib/html';

interface Props { graf: Graf }
const { graf } = Astro.props;
---
<div class="mapa" role="region" aria-label="Mapa souvislostí">
  <p class="mapa-legenda" aria-hidden="true"><span class="l-plna"></span>aktér nebo vlastnictví <span class="l-carkovana"></span>návaznost mezi kauzami</p>
  <Fragment set:html={svgMapy(rozlozMapu(graf, null))} />
  <Fragment set:html={stromMapy(graf)} />
  <p class="mapa-prazdno" hidden>Žádná kauza neodpovídá filtru.</p>
  <div class="mapa-panel" role="dialog" aria-modal="false" aria-labelledby="mapa-panel-nadpis" hidden>
    <button type="button" class="mapa-panel-zavrit" aria-label="Zavřít">×</button>
    <h3 class="mapa-panel-nadpis" id="mapa-panel-nadpis"></h3>
    <div class="mapa-panel-obsah"></div>
  </div>
</div>
<script type="application/json" id="nv-mapa" set:html={jsonDoSkriptu(graf)}></script>
```

`src/components/Osa.astro`:
- import: `import PrepinacPohledu from './PrepinacPohledu.astro';`
- Props: `interface Props { zaznamy: KauzaZaznam[]; mapa?: boolean }` a `const { zaznamy, mapa = false } = Astro.props;`
- `<div class="graf" id="graf">` → `<div class="graf" id="graf" data-pohled="osa">`
- v `.nazev-sloupce` za tlačítko `f-zrusit` přidej `{mapa && <PrepinacPohledu />}`
- za `</nav>` stránkování (uvnitř `.graf-vnitrek`) přidej `<slot name="mapa" />`

`src/components/Filtry.astro`:
- import `PrepinacPohledu`, Props `{ zaznamy; stitky; mapa?: boolean }`, `const { zaznamy, stitky, mapa = false } = Astro.props;`
- v `<span class="vpravo">` za tlačítko `f-zrusit` přidej `{mapa && <PrepinacPohledu />}`

`src/components/HlavniStranka.astro`:
```astro
---
// k importům přidej:
import Mapa from './Mapa.astro';
import { nactiKauzy, nactiStitky, nactiGraf, maMapu } from '../lib/kauzy';
import '../styles/mapa.css';
// …
const mapa = maMapu();
---
<!-- místo stávajících <Filtry …/> a <Osa …/>: -->
  <Filtry zaznamy={zaznamy} stitky={stitky} mapa={mapa} />
  <Osa zaznamy={zaznamy} mapa={mapa}>{mapa && <Mapa slot="mapa" graf={nactiGraf()} />}</Osa>
<!-- … -->
<script>
  import { inicializujOsu } from '../scripts/osa';
  import { inicializujMapu } from '../scripts/mapa';
  import { inicializujNavigaci } from '../scripts/navigace';
  inicializujOsu();
  inicializujMapu();
  inicializujNavigaci();
</script>
```
(Pořadí je důležité: mapa musí poslouchat `nv:vyber` dřív, než navigace otevře detail z přímé adresy.)

- [ ] **Step 6: `src/scripts/mapa.ts` (přepínač a překreslení po filtru)**

```ts
import { rozlozMapu, viditelneUzly, type Graf } from '../lib/mapa';
import { svgMapy } from '../lib/mapa-html';
import { viditelneKauzy } from './stav-filtru';

export type Pohled = 'osa' | 'mapa';
const graf = () => document.getElementById('graf');

export const pohledZAdresy = (): Pohled => (new URLSearchParams(location.search).get('pohled') === 'mapa' ? 'mapa' : 'osa');

/** Přepne osu a mapu. Adresu mění bez nového záznamu v historii. */
export function nastavPohled(p: Pohled, { zapsat = true } = {}): void {
  const g = graf();
  if (!g?.querySelector('.mapa')) return;
  const proved = () => {
    g.dataset.pohled = p;
    document.querySelectorAll<HTMLButtonElement>('.pohled button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pohled === p)));
    document.dispatchEvent(new CustomEvent('nv:pohled', { detail: p }));
  };
  const sPohybem = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && sPohybem && document.body.classList.contains('nacteno') && g.dataset.pohled !== p) {
    const t = document.startViewTransition(proved);
    [t.ready, t.finished, t.updateCallbackDone].forEach(x => x.catch(() => {}));
  } else proved();
  if (zapsat) {
    const url = new URL(location.href);
    if (p === 'mapa') url.searchParams.set('pohled', 'mapa'); else url.searchParams.delete('pohled');
    url.searchParams.delete('vyber');
    history.replaceState(history.state, '', url.pathname + url.search);
  }
}

export function inicializujMapu(): void {
  const g = graf();
  const obal = g?.querySelector<HTMLElement>('.mapa');
  const data = document.getElementById('nv-mapa');
  if (!g || !obal || !data) return;
  const grafMapy: Graf = JSON.parse(data.textContent || '{}');
  const strom = obal.querySelector<HTMLElement>('.strom')!;
  const prazdno = obal.querySelector<HTMLElement>('.mapa-prazdno')!;
  let svg = obal.querySelector<SVGSVGElement>('.mapa-svg')!;

  /** Překreslí SVG podle výsledku filtrů a ve stromu skryje, co na mapě není. */
  const prekresli = () => {
    const kauzy = viditelneKauzy();
    const vid = viditelneUzly(grafMapy, kauzy);
    const docasny = document.createElement('div');
    docasny.innerHTML = svgMapy(rozlozMapu(grafMapy, kauzy));
    const novy = docasny.firstElementChild as SVGSVGElement;
    svg.replaceWith(novy);
    svg = novy;
    strom.querySelectorAll<HTMLElement>('li[data-uzel]').forEach(li => { li.hidden = !vid.has(li.dataset.uzel!); });
    prazdno.hidden = vid.size > 1;
  };

  document.querySelectorAll<HTMLButtonElement>('.pohled button').forEach(b =>
    b.addEventListener('click', () => nastavPohled(b.dataset.pohled as Pohled)));
  addEventListener('popstate', () => nastavPohled(pohledZAdresy(), { zapsat: false }));
  document.addEventListener('nv:filtr', prekresli);

  nastavPohled(pohledZAdresy(), { zapsat: false });
  prekresli();
}
```

- [ ] **Step 7: Styly `src/styles/mapa.css` a test stylů**

```css
/* Mapa souvislostí (specifikace mapy, oddíly 5 a 6). Barvy jen z palety, žádná červená,
   všechny čáry stejně silné. */
#graf[data-pohled="mapa"] .osa-roku .stitky,
#graf[data-pohled="mapa"] .radky,
#graf[data-pohled="mapa"] .pasmo,
#graf[data-pohled="mapa"] .pilulka,
#graf[data-pohled="mapa"] .strankovani { display: none !important; }
#graf:not([data-pohled="mapa"]) .mapa { display: none; }

.pohled { display: inline-flex; border: 1px solid var(--linka); flex: none; }
.pohled button { font: 500 12px var(--f-text); border: 0; background: var(--plocha); color: var(--inkoust); padding: 2px 9px; cursor: pointer; }
.pohled button[aria-pressed="true"] { background: var(--modra); color: #fff; }

.mapa { position: relative; flex: 1; min-height: 0; overflow: auto; padding: 4px 0 8px; }
.mapa-legenda { display: flex; align-items: center; gap: 6px; margin: 0 0 2px 16px; font: 11px var(--f-mono); color: var(--meta); }
.mapa-legenda .l-plna, .mapa-legenda .l-carkovana { display: inline-block; width: 22px; border-top: 1.5px solid var(--meta); margin-left: 8px; }
.mapa-legenda .l-plna { margin-left: 0; }
.mapa-legenda .l-carkovana { border-top-style: dashed; }
.mapa-prazdno { padding: 24px; color: var(--meta); }
.mapa-prazdno[hidden] { display: none; }

.mapa-svg { display: block; max-width: 100%; height: auto; font-family: var(--f-text); }
.mapa-svg text { font-size: 13px; fill: var(--inkoust); }
.mapa-svg .m-viditelna { fill: none; stroke: var(--meta); stroke-opacity: .55; stroke-width: 1.2; }
.mapa-svg .m-navaznost .m-viditelna { stroke-dasharray: 4 3; }
.mapa-svg .m-zasah { fill: none; stroke: transparent; stroke-width: 12; pointer-events: stroke; cursor: pointer; }
.mapa-svg .m-uzel { cursor: pointer; }
.mapa-svg .m-uzel rect { fill: var(--plocha); stroke: var(--linka); }
.mapa-svg .m-akter rect { stroke: var(--modra); }
.mapa-svg .m-stred { cursor: default; }
.mapa-svg .m-stred rect { fill: var(--modra); stroke: var(--modra); }
.mapa-svg .m-stred text { fill: #fff; font-weight: 600; }
.mapa-svg .m-popisek { display: none; font: 11px var(--f-mono); fill: var(--meta); paint-order: stroke; stroke: var(--plocha); stroke-width: 3px; pointer-events: none; }
```

V `tests/unit/styly.test.ts` přidej `'src/styles/mapa.css'` do pole `soubory`.

- [ ] **Step 8: Spustit testy**

Run: `npx vitest run && npm run build:e2e && npx playwright test tests/e2e/mapa.spec.ts tests/e2e/strankovani.spec.ts tests/e2e/filtry.spec.ts tests/e2e/bez-posouvani.spec.ts`
Expected: PASS. Pokud test „se neposouvá dolů“ selže na 390×700, příčinou je řádek filtrů s přepínačem, který se zalomil. Zmenši ho v `mapa.css` v `@media (max-width: 760px)` (`.pohled button { padding: 2px 6px; font-size: 11px; }`) a spusť test znovu.

- [ ] **Step 9: Commit**

```bash
git add src/components src/scripts/mapa.ts src/scripts/stav-filtru.ts src/scripts/filtry.ts src/lib/kauzy.ts src/styles/mapa.css tests/unit/styly.test.ts tests/e2e/mapa.spec.ts
git commit -m "Mapa: přepínač Osa | Mapa, pohled v adrese, překreslení podle filtrů" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Interakce na mapě (zvýraznění, panel, detail, klávesnice)

**Files:**
- Modify: `src/scripts/mapa.ts`, `src/scripts/navigace.ts`, `src/styles/mapa.css`
- Test: `tests/e2e/mapa.spec.ts`

**Interfaces:**
- Consumes: `zvyrazneni`, `idKauzy` (Task 3), `vyberKauzu(slug: string | null)` ze `src/scripts/osa.ts` (vysílá `nv:vyber` s detailem slug|null), markup z Task 4 a 5
- Produces:
  - Událost `nv:otevri` (detail: slug). `navigace.ts` na ni otevře detail. Vysílá ji mapa (a Task 8 detail).
  - Detail otevřený z mapy má adresu `/kauzy/<slug>/?pohled=mapa`, po zavření `/?pohled=mapa`.
  - `/?pohled=mapa&vyber=<slug>` vybere kauzu (zvýrazní ji na mapě i na ose).
  - Třídy v SVG: `svg.ztlumeno`, `.zvyrazneno` na `[data-uzel]`, `[data-hrana]` a `.m-popisek`, `.fokus` na uzlu.

- [ ] **Step 1: Přidat padající e2e testy do `tests/e2e/mapa.spec.ts`**

```ts
test('najetí na kauzu zvýrazní cestu ke středu a návaznosti, ostatní ztlumí', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]').hover();
  await expect(page.locator('.mapa-svg')).toHaveClass(/ztlumeno/);
  for (const u of ['k:alfa-dotace', 'a:firma-alfa', 'a:holding-omega', 'a:fond-sigma', 'babis', 'k:zeta-stret'])
    await expect(page.locator(`.mapa-svg [data-uzel="${u}"]`)).toHaveClass(/zvyrazneno/);
  await expect(page.locator('.mapa-svg [data-uzel="k:beta-archiv"]')).not.toHaveClass(/zvyrazneno/);
  await expect(page.locator('.mapa-svg .m-popisek.zvyrazneno').first()).toBeVisible();
});

test('klik na aktéra otevře panel s rolí, popisem a zdrojem; Esc ho zavře', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.mapa-svg [data-uzel="a:firma-alfa"]').click();
  const panel = page.locator('.mapa-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.mapa-panel-nadpis')).toHaveText('Holding Omega → Firma Alfa');
  await expect(panel).toContainText('Holding Omega vlastní Firmu Alfa od roku 2007.');
  await expect(panel.locator('.mapa-panel-obsah a')).toHaveAttribute('href', 'https://example.com/omega/alfa');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('klik na čáru návaznosti otevře její panel', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const id = await page.locator('.strom .s-navazuje').first().getAttribute('data-hrana');
  await page.locator(`.mapa-svg .m-cara[data-hrana="${id}"] .m-zasah`).dispatchEvent('click');
  await expect(page.locator('.mapa-panel')).toBeVisible();
  await expect(page.locator('.mapa-panel-nadpis')).toContainText('→');
});

test('klik na kauzu otevře detail, zavření vrátí mapu se zvýrazněnou kauzou', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page).toHaveURL(/\/kauzy\/alfa-dotace\/\?pohled=mapa$/);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
  await page.mouse.move(0, 0);
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/zvyrazneno/);
});

test('zpět v prohlížeči po detailu z mapy vrátí mapu', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog#detail')).toBeHidden();
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
  await expect(page.locator('.mapa-svg')).toBeVisible();
});

test('vybraná kauza zmizí z filtru: zvýraznění se zruší a po zrušení filtru vrátí', async ({ page }) => {
  await page.goto('/?pohled=mapa&vyber=alfa-dotace');
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/zvyrazneno/);
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('Beta');
  await expect(page.locator('.mapa-svg')).not.toHaveClass(/ztlumeno/);
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('');
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/zvyrazneno/);
});

test('klávesnice: fokus ve stromu zvýrazní uzel, Enter na kauze otevře detail', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await page.locator('.strom li[data-uzel="k:alfa-dotace"][data-hlavni] > .s-radek a').focus();
  await expect(page.locator('.mapa-svg [data-uzel="k:alfa-dotace"]')).toHaveClass(/fokus/);
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog#detail')).toBeVisible();
});

test('klávesnice: tlačítko aktéra ve stromu otevře panel a Esc vrátí fokus', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  const tlacitko = page.locator('.strom li[data-uzel="a:firma-alfa"][data-hlavni] > .s-radek .s-akter');
  await tlacitko.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mapa-panel')).toBeVisible();
  await expect(page.locator('.mapa-panel-zavrit')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(tlacitko).toBeFocused();
});
```

- [ ] **Step 2: Spustit a ověřit, že padají**

Run: `npm run build:e2e && npx playwright test tests/e2e/mapa.spec.ts`
Expected: nové testy FAIL (třída `ztlumeno` chybí, panel se neotevře), testy z Task 5 PASS.

- [ ] **Step 3: Rozšířit `src/scripts/mapa.ts`**

Importy na začátku souboru nahraď:
```ts
import { rozlozMapu, viditelneUzly, zvyrazneni, idKauzy, type Graf } from '../lib/mapa';
import { svgMapy } from '../lib/mapa-html';
import { viditelneKauzy } from './stav-filtru';
import { vyberKauzu } from './osa';

const mobil = () => matchMedia('(max-width: 760px)').matches;
```

V `inicializujMapu` za řádek `let svg = …` přidej:
```ts
  const panel = obal.querySelector<HTMLElement>('.mapa-panel')!;
  const panelNadpis = panel.querySelector<HTMLElement>('.mapa-panel-nadpis')!;
  const panelObsah = panel.querySelector<HTMLElement>('.mapa-panel-obsah')!;
  const hrany = new Map(grafMapy.hrany.map(h => [h.id, h]));
  const uzly = new Map(grafMapy.uzly.map(u => [u.id, u]));
  let vybrano: string | null = g.dataset.vybrano ? idKauzy(g.dataset.vybrano) : null;
  let otvirac: HTMLElement | null = null;

  const zvyrazni = (id: string | null) => {
    const z = id ? zvyrazneni(grafMapy, id) : null;
    svg.classList.toggle('ztlumeno', z !== null);
    svg.querySelectorAll<SVGElement>('[data-uzel]').forEach(el => el.classList.toggle('zvyrazneno', !!z?.uzly.has(el.dataset.uzel!)));
    svg.querySelectorAll<SVGElement>('[data-hrana]').forEach(el => el.classList.toggle('zvyrazneno', !!z?.hrany.has(el.dataset.hrana!)));
  };
  const nadpisHrany = (id: string) => {
    const h = hrany.get(id)!;
    const r = uzly.get(h.rodic)!.nazev, p = uzly.get(h.potomek)!.nazev;
    return h.druh === 'navaznost' ? `${p} → ${r}` : `${r} → ${p}`;
  };
  const hlavniHrana = (uzel: string) => strom.querySelector<HTMLElement>(`li[data-uzel="${CSS.escape(uzel)}"][data-hlavni]`)?.dataset.hrana;
  const zavriPanel = (vratitFokus = true) => {
    if (panel.hidden) return;
    panel.hidden = true;
    if (vratitFokus) otvirac?.focus();
    otvirac = null;
  };
  /** Panel s vysvětlením vazby u uzlu. Obsah je kopie skrytého .s-vazba ze stromu. */
  const otevriPanel = (hrana: string, odkud: HTMLElement | null) => {
    const zdroj = document.getElementById(`s-vazba-${hrana}`);
    if (!zdroj) return;
    panelNadpis.textContent = nadpisHrany(hrana);
    panelObsah.innerHTML = zdroj.innerHTML;
    const kotva = svg.querySelector(`[data-uzel="${CSS.escape(hrany.get(hrana)!.potomek)}"]`);
    if (kotva) {
      const r = kotva.getBoundingClientRect(), o = obal.getBoundingClientRect();
      panel.style.left = `${Math.max(8, Math.min(r.right - o.left + obal.scrollLeft + 8, obal.scrollWidth - 316))}px`;
      panel.style.top = `${r.top - o.top + obal.scrollTop}px`;
    }
    panel.hidden = false;
    otvirac = odkud;
    panel.querySelector<HTMLElement>('.mapa-panel-zavrit')!.focus();
  };
  const prepni = (b: HTMLButtonElement) => {
    const cil = document.getElementById(b.getAttribute('aria-controls')!);
    if (!cil) return;
    const otevrit = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(otevrit));
    cil.hidden = !otevrit;
  };
  const otevriKauzu = (slug: string) => document.dispatchEvent(new CustomEvent('nv:otevri', { detail: slug }));
```

Ve funkci `prekresli` přidej na konec (za `prazdno.hidden = …`):
```ts
    zavriPanel(false);
    zvyrazni(vybrano && vid.has(vybrano) ? vybrano : null);
```

Za řádek `document.addEventListener('nv:filtr', prekresli);` přidej:
```ts
  obal.addEventListener('click', e => {
    const t = e.target as Element;
    if (t.closest('.mapa-panel-zavrit')) { zavriPanel(); return; }
    const uzel = t.closest<SVGGElement>('.mapa-svg [data-uzel]');
    if (uzel) {
      const id = uzel.dataset.uzel!;
      if (id.startsWith('k:')) otevriKauzu(id.slice(2));
      else { const h = hlavniHrana(id); if (h) otevriPanel(h, null); }
      return;
    }
    const cara = t.closest<SVGGElement>('.mapa-svg .m-cara');
    if (cara) { if (hrany.get(cara.dataset.hrana!)?.popis) otevriPanel(cara.dataset.hrana!, null); return; }
    const odkaz = t.closest<HTMLAnchorElement>('.strom a[data-slug]');
    if (odkaz) {
      const me = e as MouseEvent;
      if (me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
      e.preventDefault();
      otevriKauzu(odkaz.dataset.slug!);
      return;
    }
    const tlacitko = t.closest<HTMLButtonElement>('.strom .s-info, .strom .s-akter');
    const nositel = tlacitko?.closest<HTMLElement>('[data-hrana]');
    if (!tlacitko || !nositel) return;
    if (!mobil()) { otevriPanel(nositel.dataset.hrana!, tlacitko); return; }
    // mobil: jméno aktéra rozbaluje větev, ⓘ (nebo jméno aktéra bez větve) ukáže vysvětlení pod řádkem
    if (tlacitko.classList.contains('s-akter') && tlacitko.hasAttribute('aria-expanded')) { prepni(tlacitko); return; }
    const i = tlacitko.classList.contains('s-info') ? tlacitko : nositel.querySelector<HTMLButtonElement>(':scope > .s-radek .s-info');
    if (i) prepni(i);
  });
  obal.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); e.stopPropagation(); zavriPanel(); }
  });
  obal.addEventListener('pointerover', e => {
    const u = (e.target as Element).closest<SVGGElement>('.mapa-svg [data-uzel]');
    if (u) zvyrazni(u.dataset.uzel!);
  });
  obal.addEventListener('pointerout', e => {
    if ((e.target as Element).closest('.mapa-svg [data-uzel]')) zvyrazni(vybrano);
  });
  strom.addEventListener('focusin', e => {
    const li = (e.target as Element).closest<HTMLElement>('li[data-uzel]');
    svg.querySelectorAll('.fokus').forEach(x => x.classList.remove('fokus'));
    if (!li) return;
    zvyrazni(li.dataset.uzel!);
    const u = svg.querySelector<SVGGElement>(`[data-uzel="${CSS.escape(li.dataset.uzel!)}"]`);
    if (u && !mobil()) { u.classList.add('fokus'); u.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  });
  strom.addEventListener('focusout', () => {
    svg.querySelectorAll('.fokus').forEach(x => x.classList.remove('fokus'));
    zvyrazni(vybrano);
  });
  document.addEventListener('nv:vyber', e => {
    const slug = (e as CustomEvent<string | null>).detail;
    vybrano = slug ? idKauzy(slug) : null;
    zvyrazni(vybrano);
  });
```

Úplně na konec `inicializujMapu` (za `prekresli();`) přidej:
```ts
  const vyber = new URLSearchParams(location.search).get('vyber');
  if (vyber && uzly.has(idKauzy(vyber))) vyberKauzu(vyber);
```

- [ ] **Step 4: `src/scripts/navigace.ts`**

Za `const dialog = …` přidej:
```ts
/** Detail otevřený z mapy si pohled pamatuje v adrese, aby se po zavření vrátil na mapu. */
const dotazPohledu = () => (document.getElementById('graf')?.dataset.pohled === 'mapa' ? '?pohled=mapa' : '');
```
Nahraď adresy v `history.pushState`:
- v `otevriDetail`: `` history.pushState({ slug }, '', `/kauzy/${slug}/${dotazPohledu()}`); ``
- v `zavriDetail`: `` history.pushState({}, '', `/${dotazPohledu()}`); ``
- v obsluze `close`: `` if (!zaviramZHistorie && location.pathname !== '/') history.pushState({}, '', `/${dotazPohledu()}`); ``

Na konec `inicializujNavigaci` přidej:
```ts
  // mapa a odkazy mezi kauzami v detailu otevírají kauzu stejnou cestou jako osa
  document.addEventListener('nv:otevri', e => { otevriDetail((e as CustomEvent<string>).detail); });
```

- [ ] **Step 5: Styly zvýraznění a panelu (do `src/styles/mapa.css`)**

```css
.mapa-svg.ztlumeno .m-uzel:not(.zvyrazneno),
.mapa-svg.ztlumeno .m-cara:not(.zvyrazneno) { opacity: .25; }
.mapa-svg .m-cara.zvyrazneno .m-viditelna { stroke: var(--modra); stroke-opacity: 1; }
.mapa-svg .m-popisek.zvyrazneno { display: inline; }
.mapa-svg .m-uzel.fokus rect { stroke: var(--okr); stroke-width: 3; }

.mapa-panel { position: absolute; z-index: 5; width: 300px; max-width: calc(100% - 16px); background: var(--plocha); border: 1px solid var(--linka); box-shadow: 0 6px 24px rgb(14 23 38 / .15); padding: 12px 14px; font-size: 14px; }
.mapa-panel[hidden] { display: none; }
.mapa-panel-nadpis { margin: 0 24px 6px 0; font-size: 15px; }
.mapa-panel-zavrit { position: absolute; top: 4px; right: 6px; border: 0; background: none; font-size: 20px; line-height: 1; padding: 4px; cursor: pointer; color: var(--inkoust); }
.mapa-panel p { margin: 0; }
.mapa-panel .s-zdroje { margin: 6px 0 0; padding-left: 18px; font-size: 13px; }

/* Strom je na počítači vizuálně skrytý: ovládá se přes něj klávesnicí a čte ho čtečka */
@media (min-width: 761px) {
  .mapa .strom { position: absolute; top: 0; left: 0; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
```

- [ ] **Step 6: Spustit testy**

Run: `npm run build:e2e && npx playwright test tests/e2e/mapa.spec.ts tests/e2e/navigace.spec.ts tests/e2e/detail.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/scripts/mapa.ts src/scripts/navigace.ts src/styles/mapa.css tests/e2e/mapa.spec.ts
git commit -m "Mapa: zvýraznění cesty, panel vazby se zdroji, otevření detailu a ovládání klávesnicí" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Mobilní strom

**Files:**
- Modify: `src/scripts/mapa.ts`, `src/styles/mapa.css`
- Test: `tests/e2e/mapa.spec.ts`

**Interfaces:**
- Consumes: markup stromu (Task 4), obsluha kliknutí s větví pro mobil (Task 6)
- Produces: na mobilu jsou přímí aktéři (`data-hloubka="1"`) rozbalení a hlubší sbalení, na počítači je rozbaleno vše; přepočítá se při změně šířky okna

- [ ] **Step 1: Přidat padající e2e testy**

```ts
test.describe('mobil', () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test('místo obrázku strom: přímí aktéři rozbalení, hlubší sbalení', async ({ page }) => {
    await page.goto('/?pohled=mapa');
    await expect(page.locator('.mapa-svg')).toBeHidden();
    await expect(page.locator('.strom')).toBeVisible();
    await expect(page.locator('.filtry .pohled').getByRole('button', { name: 'Mapa' })).toHaveAttribute('aria-pressed', 'true');
    const holding = page.locator('.strom li[data-uzel="a:holding-omega"][data-hlavni] > .s-radek .s-akter');
    await expect(page.locator('.strom li[data-uzel="a:fond-sigma"] > .s-radek .s-akter')).toHaveAttribute('aria-expanded', 'true');
    await expect(holding).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.strom li[data-uzel="a:firma-alfa"]')).toBeHidden();
    await holding.click();
    await expect(holding).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.strom li[data-uzel="a:firma-alfa"]')).toBeVisible();
  });

  test('ⓘ ukáže vysvětlení vazby pod řádkem, klepnutí na kauzu otevře detail', async ({ page }) => {
    await page.goto('/?pohled=mapa');
    const epsilon = page.locator('.strom li[data-uzel="k:epsilon-fondy"][data-hlavni]');
    await epsilon.locator(':scope > .s-radek .s-info').click();
    await expect(epsilon.locator(':scope > .s-vazba')).toBeVisible();
    await expect(epsilon.locator(':scope > .s-vazba')).toContainText('Kauza se týká vložení fiktivního holdingu do Fondu Sigma.');
    await epsilon.locator(':scope > .s-radek a').click();
    await expect(page.locator('dialog#detail')).toBeVisible();
  });
});

test('změna šířky okna z počítače na mobil v pohledu mapy', async ({ page }) => {
  await page.goto('/?pohled=mapa');
  await expect(page.locator('.mapa-svg')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 700 });
  await expect(page.locator('.mapa-svg')).toBeHidden();
  await expect(page.locator('.strom')).toBeVisible();
  await expect(page.locator('.strom li[data-uzel="a:holding-omega"][data-hlavni] > .s-radek .s-akter')).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(page.locator('.strom li[data-uzel="a:holding-omega"][data-hlavni] > .s-radek .s-akter')).toHaveAttribute('aria-expanded', 'true');
});
```

- [ ] **Step 2: Spustit a ověřit, že padají**

Run: `npm run build:e2e && npx playwright test tests/e2e/mapa.spec.ts -g "mobil|šířky"`
Expected: FAIL (SVG je na mobilu vidět, rozbalení se nemění).

- [ ] **Step 3: Rozbalení podle šířky v `src/scripts/mapa.ts`**

V `inicializujMapu` těsně před řádek `nastavPohled(pohledZAdresy(), { zapsat: false });` přidej:
```ts
  /** Na mobilu rozbalení jen přímí aktéři, na počítači vše (strom tam slouží klávesnici a čtečkám). */
  const nastavRozbaleni = () => strom.querySelectorAll<HTMLButtonElement>('.s-akter[aria-expanded]').forEach(b => {
    const otevrit = !mobil() || Number(b.closest<HTMLElement>('li')!.dataset.hloubka) <= 1;
    b.setAttribute('aria-expanded', String(otevrit));
    document.getElementById(b.getAttribute('aria-controls')!)!.hidden = !otevrit;
  });
  matchMedia('(max-width: 760px)').addEventListener('change', nastavRozbaleni);
  nastavRozbaleni();
```

- [ ] **Step 4: Styly stromu (do `src/styles/mapa.css`)**

```css
.mapa .strom, .mapa .strom ul { list-style: none; margin: 0; padding: 0; }
.mapa .strom ul { padding-left: 14px; margin-left: 6px; border-left: 1px solid var(--linka); }
.mapa .strom ul[hidden], .mapa .strom li[hidden], .mapa .strom .s-vazba[hidden] { display: none; }
.mapa .strom .s-stred > .s-nazev { display: block; padding: 6px 0; font-weight: 600; color: var(--modra); }
.mapa .strom .s-radek { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; padding: 5px 0; }
.mapa .strom .s-akter { font: 600 15px var(--f-text); color: var(--inkoust); border: 0; background: none; padding: 2px 0; text-align: left; cursor: pointer; }
.mapa .strom .s-akter[aria-expanded="false"]::before { content: "▸ "; }
.mapa .strom .s-akter[aria-expanded="true"]::before { content: "▾ "; }
.mapa .strom .s-kauza a { color: var(--inkoust); }
.mapa .strom .s-role, .mapa .strom .s-roky { font: 12px var(--f-mono); color: var(--meta); }
.mapa .strom .s-info { width: 24px; height: 24px; border: 1px solid var(--linka); border-radius: 50%; background: var(--plocha); font-size: 13px; line-height: 1; cursor: pointer; }
.mapa .strom .s-vazba { padding: 0 0 8px; font-size: 14px; }
.mapa .strom .s-vazba p { margin: 0; }
.mapa .strom .s-zdroje { margin: 4px 0 0; padding-left: 18px; font-size: 13px; }
.mapa .strom .s-navazuje { padding: 0 0 6px; font-size: 13px; }

@media (max-width: 760px) {
  .mapa .mapa-svg, .mapa .mapa-legenda { display: none; }
  .mapa .mapa-panel { display: none !important; }
  .mapa { padding: 4px 8px 8px; }
}
```

- [ ] **Step 5: Spustit testy**

Run: `npm run build:e2e && npx playwright test tests/e2e/mapa.spec.ts tests/e2e/bez-posouvani.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/mapa.ts src/styles/mapa.css tests/e2e/mapa.spec.ts
git commit -m "Mapa: rozbalovací strom na mobilu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Aktéři a návaznosti v detailu kauzy

**Files:**
- Modify: `src/components/Detail.astro`, `src/pages/kauzy/[slug].astro`, `src/scripts/detail.ts`, `src/scripts/navigace.ts`, `src/styles/mapa.css`
- Test: `tests/e2e/mapa.spec.ts`

**Interfaces:**
- Consumes: `vazbyKauzy`, `VazbyKauzy` (Task 3), `nactiKauzy`, `nactiAktery`, `maMapu` (Task 2, 5), `nastavPohled` (Task 5), `zavriDetail`, `otevriDetail` (`navigace.ts`), `vyberKauzu` (`osa.ts`), `nv:otevri` (Task 6)
- Produces: blok `section.vazby` v panelu `souv` s odkazy `a[data-kauza]` a `a.na-mapu[data-na-mapu]`; událost `nv:na-mapu` (detail: slug)

- [ ] **Step 1: Přidat padající e2e testy**

```ts
test('detail ukazuje aktéry a návaznosti a vede na mapu', async ({ page }) => {
  await page.goto('/kauzy/zeta-stret/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  const blok = page.locator('.m2-panel[data-p="souv"] .vazby');
  await expect(blok.getByRole('heading', { name: 'Aktéři a návaznosti' })).toBeVisible();
  await expect(blok).toContainText('Holding Omega, předmět kauzy: Fiktivní úřad posuzuje střet zájmů u Holdingu Omega.');
  await expect(blok).toContainText('Navazují na ni:');
  await blok.getByRole('link', { name: 'Ukázat na mapě →' }).click();
  await expect(page.locator('dialog#detail')).toBeHidden();
  await expect(page).toHaveURL(/\/\?pohled=mapa$/);
  await page.mouse.move(0, 0);
  await expect(page.locator('.mapa-svg [data-uzel="k:zeta-stret"]')).toHaveClass(/zvyrazneno/);
});

test('návaznost v detailu přejde na druhou kauzu, opačný směr je dopočítaný', async ({ page }) => {
  await page.goto('/kauzy/zeta-stret/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await page.locator('.vazby').getByRole('link', { name: 'Testovací kauza Alfa' }).click();
  await expect(page).toHaveURL(/\/kauzy\/alfa-dotace\/$/);
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Alfa');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await expect(page.locator('.vazby')).toContainText('Navazují na ni:');
  await expect(page.locator('.vazby').getByRole('link', { name: 'Testovací kauza Žeta' })).toBeVisible();
});

test('kauza bez vazeb nemá blok Aktéři a návaznosti', async ({ page }) => {
  await page.goto('/kauzy/beta-archiv/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await expect(page.locator('.vazby')).toHaveCount(0);
});

test('značka zdroje u vazby přepne na Zdroje', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await page.locator('.vazby a[data-zdroj="2"]').first().click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
});
```

- [ ] **Step 2: Spustit a ověřit, že padají**

Run: `npm run build:e2e && npx playwright test tests/e2e/mapa.spec.ts -g "detail|vazeb|značka"`
Expected: FAIL (`.vazby` neexistuje).

- [ ] **Step 3: `src/pages/kauzy/[slug].astro`**

```astro
---
import HlavniStranka from '../../components/HlavniStranka.astro';
import Detail from '../../components/Detail.astro';
import { nactiKauzy, nactiAktery, maMapu } from '../../lib/kauzy';
import { vazbyKauzy } from '../../lib/mapa';

export function getStaticPaths() {
  return nactiKauzy().map(z => ({ params: { slug: z.slug }, props: { zaznam: z } }));
}
const { zaznam } = Astro.props;
const vazby = vazbyKauzy(nactiKauzy(), nactiAktery(), zaznam.slug);
---
<HlavniStranka otevrena={zaznam}>
  <Detail slot="detail" zaznam={zaznam} vazby={vazby} naMapu={maMapu()} />
</HlavniStranka>
```

- [ ] **Step 4: `src/components/Detail.astro`**

Import a Props:
```ts
import type { VazbyKauzy } from '../lib/mapa';
interface Props { zaznam?: KauzaZaznam; vazby?: VazbyKauzy; naMapu?: boolean }
const { zaznam, vazby, naMapu = false } = Astro.props;
```
A pod definici `chipy` přidej:
```ts
const maVazby = !!vazby && (vazby.akteri.length + vazby.navazuje.length + vazby.navazujiNaNi.length) > 0;
```

Panel `souv` nahraď:
```astro
      <div class="m2-panel" data-p="souv" role="tabpanel" hidden>
        {rozdelOdstavce(zaznam.telo).map(o => <p set:html={odstavecNaHtml(o)}></p>)}
        {maVazby && vazby && (
          <section class="vazby" aria-labelledby="vazby-nadpis">
            <h3 id="vazby-nadpis">Aktéři a návaznosti</h3>
            <ul>
              {vazby.akteri.map(a => <li><strong>{a.nazev}</strong>, {a.roleText}: {a.popis}<span class="chipy" set:html={chipy(a.zdroje)}></span></li>)}
              {vazby.navazuje.map(n => <li><em>Navazuje na:</em> <a href={`/kauzy/${n.slug}/`} data-kauza={n.slug}>{n.nazev}</a> ({n.roleText}): {n.popis}<span class="chipy" set:html={chipy(n.zdroje)}></span></li>)}
              {vazby.navazujiNaNi.length > 0 && <li><em>Navazují na ni:</em> {vazby.navazujiNaNi.map((n, i) => <>{i > 0 && ', '}<a href={`/kauzy/${n.slug}/`} data-kauza={n.slug}>{n.nazev}</a></>)}</li>}
            </ul>
            {naMapu && <a class="na-mapu" href={`/?pohled=mapa&vyber=${zaznam.slug}`} data-na-mapu={zaznam.slug}>Ukázat na mapě →</a>}
          </section>
        )}
      </div>
```

- [ ] **Step 5: `src/scripts/detail.ts` a `src/scripts/navigace.ts`**

V `detail.ts` v obsluze `dlg.addEventListener('click', e => { … })` přidej na začátek těla:
```ts
    const jina = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-kauza]');
    if (jina) { e.preventDefault(); e.stopImmediatePropagation(); document.dispatchEvent(new CustomEvent('nv:otevri', { detail: jina.dataset.kauza })); return; }
    const naMapu = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-na-mapu]');
    if (naMapu) { e.preventDefault(); e.stopImmediatePropagation(); document.dispatchEvent(new CustomEvent('nv:na-mapu', { detail: naMapu.dataset.naMapu })); return; }
```
(`inicializujDetail` se volá při každém načtení kauzy do téhož `<dialog>`, takže posluchačů `click` přibývá. `stopImmediatePropagation` zajistí, že se kauza otevře jen jednou.)

V `navigace.ts` přidej import `import { nastavPohled } from './mapa';` a na konec `inicializujNavigaci`:
```ts
  // „Ukázat na mapě“ z detailu: přepnout na mapu, zavřít detail (adresa /?pohled=mapa) a nechat kauzu vybranou
  document.addEventListener('nv:na-mapu', e => {
    const slug = (e as CustomEvent<string>).detail;
    nastavPohled('mapa', { zapsat: false });
    zavriDetail();
    vyberKauzu(slug);
  });
```

- [ ] **Step 6: Styly bloku (do `src/styles/mapa.css`)**

```css
.m2-panel .vazby { margin-top: 16px; break-inside: avoid-column; }
.m2-panel .vazby h3 { margin: 0 0 6px; font: 600 12px var(--f-mono); text-transform: uppercase; letter-spacing: .08em; color: var(--meta); }
.m2-panel .vazby ul { margin: 0; padding-left: 18px; }
.m2-panel .vazby li { margin: 0 0 6px; }
.m2-panel .vazby .na-mapu { display: inline-block; margin-top: 4px; font-weight: 600; color: var(--modra); }
```

- [ ] **Step 7: Spustit testy**

Run: `npm run build:e2e && npx playwright test tests/e2e/mapa.spec.ts tests/e2e/detail.spec.ts tests/e2e/modal-obsah.spec.ts tests/e2e/navigace.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/Detail.astro src/pages/kauzy/[slug].astro src/scripts/detail.ts src/scripts/navigace.ts src/styles/mapa.css tests/e2e/mapa.spec.ts
git commit -m "Detail: aktéři a návaznosti s odkazem na mapu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Metodika a přístupnost

**Files:**
- Modify: `src/data/metodika.ts`, `tests/e2e/stranky.spec.ts`, `tests/e2e/pristupnost.spec.ts`, `docs/superpowers/specs/2026-11-10-nenechme-vyhnit-design.md`

**Interfaces:**
- Consumes: nic nového
- Produces: sekce Metodiky `id: "vazby"` hned za sekcí `kriteria`

- [ ] **Step 1: Upravit testy (padající)**

V `tests/e2e/stranky.spec.ts`:
- `['/metodika/', 'Jak archiv vedeme', 7]` → `['/metodika/', 'Jak archiv vedeme', 8]`
- v testu „každou kartu Metodiky jde otevřít“ `for (let i = 0; i < 7; i++)` → `for (let i = 0; i < 8; i++)`

V `tests/e2e/pristupnost.spec.ts` přidej do pole cest `'/?pohled=mapa'`:
```ts
for (const cesta of ['/', '/?pohled=mapa', '/kauzy/alfa-dotace/', '/metodika/', '/o-projektu/', 'http://localhost:4322/']) {
```

Run: `npm run build:e2e && npx playwright test tests/e2e/stranky.spec.ts`
Expected: FAIL (7 karet místo 8).

- [ ] **Step 2: Nová sekce v `src/data/metodika.ts`**

Vlož do pole `sekce` hned za objekt s `id: "kriteria"`:
```ts
    {
      id: "vazby",
      nadpis: "Vazby mezi kauzami",
      shrnuti: "Mapa ukazuje, přes koho a co kauzy souvisejí. Každá vazba má roli, období a zdroj a sama o sobě neznamená vinu.",
      html: `<p>Kauzy lze kromě časové osy zobrazit jako <strong>mapu souvislostí</strong>. Ukazuje, přes které firmy, osoby a nástroje (například svěřenské fondy) jsou kauzy spojené s Andrejem Babišem a které kauzy na sebe přímo navazují.</p>
<ul><li>Každá vazba má <strong>roli</strong> z pevného seznamu (například <em>vlastní</em>, <em>příjemce dotace</em>, <em>vychází z</em>), <strong>období</strong>, kdy platila, a <strong>zdroj</strong>. Bez zdroje se web nesestaví.</li>
<li>Aktérem může být firma nebo nástroj, které Andrej Babiš nebo jeho firmy ovládaly, a to jen pro období, kdy je ovládaly. Osoba jen tehdy, když je veřejně činná nebo už byla jmenována ve zveřejněných kauzách v souvislosti s řízením.</li>
<li>Úřady a instituce aktéry nejsou.</li>
<li><strong>Vazba sama o sobě neznamená vinu ani spoluodpovědnost.</strong> Říká jen, že dvě věci spolu doloženě souvisejí.</li></ul>
<p>Vazby ověřuje člověk stejně jako ostatní obsah kauzy.</p>`,
    },
```

- [ ] **Step 2b: Kontrolní seznam před spuštěním**

V `docs/superpowers/specs/2026-11-10-nenechme-vyhnit-design.md`, oddíl 11 „Podmínky spuštění“, přidej odrážku:
```markdown
- před zveřejněním mapy souvislostí: každá osoba-aktér splňuje pravidlo z `2026-11-10-mapa-souvislosti-design.md`, oddíl 3 (veřejně činná, nebo už jmenovaná ve zveřejněných kauzách v souvislosti s řízením).
```

- [ ] **Step 3: Spustit testy stránek, přístupnosti a posouvání**

Run: `npm run build:e2e && npx playwright test tests/e2e/stranky.spec.ts tests/e2e/pristupnost.spec.ts tests/e2e/bez-posouvani.spec.ts`
Expected: PASS.

Pokud `/metodika/` na některé velikosti selže v testu posouvání (9 buněk mřížky místo 8), **nepřidávej samostatnou kartu**. Text dej do sekce `kriteria`: na konec jejího `html` připoj `<h3 id="vazby">Vazby mezi kauzami</h3>` a tentýž obsah, vrať počty v `stranky.spec.ts` na 7 a v hlášení úkolu uveď, že se oddíl vešel jen jako podsekce.

- [ ] **Step 4: Commit**

```bash
git add src/data/metodika.ts tests/e2e/stranky.spec.ts tests/e2e/pristupnost.spec.ts docs/superpowers/specs/2026-11-10-nenechme-vyhnit-design.md
git commit -m "Metodika: oddíl Vazby mezi kauzami; kontrola přístupnosti mapy" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Celková kontrola**

Run: `npx vitest run && npm run e2e`
Expected: vše zelené.

---

### Task 10: Vazby v konceptech (lokálně, necommituje se)

**Files (vše v gitignorovaném `_koncepty/`):**
- Create: `_koncepty/obsah/akteri.yml`, `_koncepty/brief-vazby.md`
- Modify: `_koncepty/obsah/kauzy/*.md` (20 konceptů)
- Modify: paměť `C:\Users\reath\.claude\projects\c--Users-reath-Projects-NenechmeVyhnit\memory\kauzy-po-davkach.md`

**Interfaces:**
- Consumes: schéma a validace z Task 1–2, náhled `npm run koncepty`

- [ ] **Step 1: Brief pro vyplňování vazeb `_koncepty/brief-vazby.md`**

```markdown
# Brief: vazby kauz pro mapu souvislostí

Pravidla: docs/superpowers/specs/2026-11-10-mapa-souvislosti-design.md (oddíly 2–4) a role v src/lib/role.ts.

1. Aktér smí být: firma nebo nástroj (svěřenský fond) ovládané A. Babišem nebo jeho firmami, a jen pro období ovládání;
   osoba jen veřejně činná nebo už jmenovaná ve zveřejněných kauzách v souvislosti s řízením. Úřady a instituce nikdy.
2. Každý vztah aktéra (akteri.yml) má nadřazeného (babis nebo jiný aktér), roli z ROLE_VZTAHU, od/do, jednu větu popisu
   (≤ 200 znaků, bez hodnocení) a zdroj (obchodní rejstřík, rozhodnutí úřadu, seriózní médium). overeno: null.
3. Aktér v kauze (pole akteri v kauze): role z ROLE_V_KAUZE, věta popisu, zdroje = id zdrojů téže kauzy.
   První uvedený aktér určuje, pod kým kauza na mapě visí: dej na první místo toho nejbližšího (např. Penam, ne Agrofert).
4. Návaznost (pole navazuje): jen když ji zdroj kauzy výslovně dokládá (např. „navazuje na audit EK“). Role z ROLE_NAVAZNOSTI.
5. Bez zdroje vazbu nepiš. Pochybnost zapiš do oddílu „K ověření“ v rešeršním souboru kauzy.
6. Kontrola: npx tsx _koncepty/over.ts (žádné chyby), náhled npm run koncepty → Mapa.
```

- [ ] **Step 2: Doplnit vazby do 20 konceptů**

Postup: pro každý koncept v `_koncepty/obsah/kauzy/` přečti jeho zdroje a oddíl Souvislosti v `_koncepty/rešerše-10-kauz.md`, resp. `_koncepty/rešerše-11-20/`, a podle briefu doplň `akteri`, `navazuje` a nové aktéry do `_koncepty/obsah/akteri.yml`. Zdroj pro vztah aktéra, který kauza nemá (např. vlastnictví Agrofertu), dohledej v obchodním rejstříku nebo v seriózním médiu a zapiš ho přímo k vztahu ve slovníku. Doporučeno: 4 paralelní agenti po 5 konceptech se stejným briefem. Slovník aktérů skládá jeden (koordinátor), aby nevznikly duplicitní id.

Kandidáti z rešerší (každého je třeba doložit, seznam není závazný): `agrofert`, `ab-private-trust` (svěřenské fondy), `penam`, `pekarna-zelena-louka`, `uniles`, `farma-capi-hnizdo`, `synbiol`, `scp-bigaud`; návaznosti, které rešerše výslovně zmiňují: vymáhání zemědělských dotací → audit EK a RSVP Trust; syn a Krym → Čapí hnízdo.

- [ ] **Step 3: Kontrola**

Run: `npx tsx _koncepty/over.ts`
Expected: stejný počet platných kauz jako před úkolem a žádné chyby.

Run: `npm run koncepty` a otevři `http://localhost:4400/?pohled=mapa`
Expected: mapa s aktéry, kliknutí na čáru ukáže vysvětlení se zdrojem.

- [ ] **Step 4: Aktualizovat paměť**

Do `kauzy-po-davkach.md` v oddílu **How to apply** připiš: „Od 10. 11. 2026 vyplňují agenti u každé kauzy i vazby pro mapu (`akteri`, `navazuje`) a nové aktéry do `_koncepty/obsah/akteri.yml` podle `_koncepty/brief-vazby.md`.“

- [ ] **Step 5: Ověřit, že nic z `_koncepty/` není v gitu**

Run: `git status --short`
Expected: žádný řádek se `_koncepty/`.
