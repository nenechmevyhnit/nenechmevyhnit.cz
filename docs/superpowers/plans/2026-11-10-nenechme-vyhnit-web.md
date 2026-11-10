# Nenechme vyhnít — plán implementace webu v1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postavit statický web Nenechme vyhnít (osa kauz, detail kauzy, Metodika, O projektu) s validací obsahu, testy a připravenou automatizací. Zatím s fiktivními testovacími daty a bez veřejného spuštění.

**Architecture:** Astro generuje statické stránky. Obsah kauz jsou Markdown soubory ve složce `obsah/kauzy/`, které před buildem načítá a kontroluje vlastní validátor (Zod + kontroly napříč poli). Při chybě build selže. Stránky renderuje Astro, chování (výběr, filtry, modal, přechody mezi kauzami přes History API) zajišťují malé TypeScript moduly bez frameworku. Vzhled se přebírá z odsouhlasených prototypů v `design/03-detail/`: komponenty kopírují jejich DOM a CSS se z nich vytáhne skriptem.

**Tech Stack:** Node 24, Astro 7.x, TypeScript, Zod (přes `astro/zod`), gray-matter, yaml, Vitest 5, Playwright 1.65 + @axe-core/playwright, tsx, cross-env, serve, GitHub Actions, lychee.

**Spec:** `docs/superpowers/specs/2026-11-10-nenechme-vyhnit-design.md`

## Global Constraints

- Veškeré texty webu česky, s úplnou diakritikou. Identifikátory v kódu česky bez diakritiky.
- Commity pouze s lokální identitou `Nenechme vyhnít <354814288+nenechmevyhnit@users.noreply.github.com>`. Nikdy osobní jméno ani e-mail. Push jen přes remote `origin` (SSH alias `github-nenechme`). Nepoužívat `gh` CLI, je přihlášené osobním účtem.
- `_koncepty/` a `design/` se nikdy necommitují (jsou v `.gitignore`). Testovací data jsou **fiktivní** (vymyšlené firmy, zdroje na `example.com`), nikdy tvrzení o skutečných osobách.
- Barvy T2: pozadí `#F5F5F8`, plochy `#FFFFFF`, modrá `#282661`, text `#16153A` / `#33325A`, linky `#D3D3E2`, popisky `#5C5B7A`, „dosud“ `#8F8DC4`. Červená `#DB1F2D` jen ve značce, linkách hlavičky a nadtitulcích, nikdy ve stavu kauzy.
- Písma Redaction 10 a JetBrains Mono jsou hostovaná lokálně v `public/fonty/`. Žádné požadavky na Google Fonts ani jiné třetí strany za běhu. Žádná analytika ani cookies.
- Žádné svislé posouvání stránky na vnitřních velikostech okna 1256×528, 1342×565, 1342×676, 1896×868 a 390×700. Do strany se smí posouvat jen osa a delší texty v modalech.
- `prefers-reduced-motion: reduce` vypíná všechny animace.
- Web běží na `https://nenechmevyhnit.cz`, `trailingSlash: 'always'`, stránky kauz na `/kauzy/<slug>/`.
- Validace obsahu je povinná součást `npm run build`. Build s chybným obsahem musí skončit nenulovým kódem.

## Review Focus

- **Prázdný archiv** (0 kauz, stav před spuštěním): stránka se vykreslí s hláškou „Archiv se připravuje“, bez chyb v konzoli a bez svislého posouvání. Test v úloze 9.
- **Zvláštní znaky v hledání** (`(`, `+`, `*`, `\`, uvozovky, samé mezery): hledání nespadne a chová se jako obyčejný text. Test v úloze 7.
- **Tlačítko Zpět v prohlížeči po otevření detailu:** zavře modal a vrátí adresu na `/`. Další Zpět/Vpřed kauzu znovu otevře. Test v úloze 11.
- **Duplicitní `id` zdroje, nebo odkaz na neexistující zdroj** (v události, stanovisku i v poznámce `[^n]`): build selže se srozumitelnou hláškou s názvem souboru. Test v úloze 4.
- **Víc kauz, než se vejde** (15 a víc řádků): stránka se pořád neposouvá dolů, posouvá se jen seznam uvnitř osy. Test v úloze 14.

---

## Struktura souborů

```
astro.config.mjs              konfigurace (site, trailingSlash, outDir z NV_VYSTUP)
package.json, tsconfig.json, vitest.config.ts, playwright.config.ts, lychee.toml
obsah/stitky.yml              slovník štítků (id: název)
obsah/kauzy/.gitkeep          skutečné kauzy (zatím prázdné)
public/CNAME                  nenechmevyhnit.cz
public/fonty/*.woff2          lokální písma
public/obrazky/portret.webp   portrét (výřez, CC0)
public/obrazky/nahled.png     náhled pro sdílení 1200×630
nastroje/stahni-fonty.mjs     jednorázové stažení písem + vygenerování src/styles/fonty.css
nastroje/vytahni-css.py       převzetí CSS z prototypů
nastroje/vyrez_portretu.py    výřez portrétu (přesun z design/nastroje)
nastroje/nahled.mjs           vygenerování náhledového obrázku
scripts/over-obsah.ts         CLI validace obsahu (součást build)
scripts/archivuj.ts           doplnění archivních kopií zdrojů (týdenní běh)
src/lib/cestina.ts            skloňování (let, zdrojů)
src/lib/stavy.ts              výčet stavů + popisky
src/lib/schema.ts             Zod schéma kauzy + kontroly napříč poli
src/lib/souvislosti.ts        odstavce a poznámky [^n] → HTML
src/lib/validace.ts           overKauzu(), overAdresar()
src/lib/kauzy.ts              nactiKauzy(), nactiStitky() pro stránky
src/lib/casova-osa.ts         výpočty pozic, textů rozsahu a délky, dat
src/lib/hledani.ts            normalizace, položky a shoda s filtrem
src/lib/archiv.ts             doplnArchiv() pro úpravu Markdownu
src/styles/fonty.css          @font-face (generuje nastroj)
src/styles/hlavni.css         CSS hlavní stránky (vytaženo z prototypu)
src/styles/stranky.css        CSS Metodiky a O projektu (vytaženo z prototypu)
src/styles/upravy.css         doplňky pro produkční markup
src/layouts/Zaklad.astro      <head>, meta/OG, písma, obal stránky
src/components/Hlavicka.astro, PatickaRadek.astro, Uvod.astro, Filtry.astro,
               Osa.astro, Detail.astro, Portret.astro, HlavniStranka.astro,
               KartyStranky.astro
src/data/metodika.ts, src/data/o-projektu.ts   texty stránek
src/pages/index.astro, kauzy/[slug].astro, metodika.astro, o-projektu.astro, 404.astro
src/scripts/osa.ts, filtry.ts, detail.ts, navigace.ts, karty.ts
tests/unit/*.test.ts          Vitest
tests/e2e/*.spec.ts           Playwright
tests/fixtures/obsah/         fiktivní kauzy pro testy
tests/fixtures/prazdny/       prázdný archiv
.github/workflows/kontrola.yml, nasazeni.yml, tydenni.yml
.github/ISSUE_TEMPLATE/nova-kauza.yml, oprava.yml, PULL_REQUEST_TEMPLATE.md
docs/spusteni.md              kontrolní seznam před spuštěním
```

---

### Task 1: Kostra projektu

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/pages/index.astro` (dočasná), `obsah/stitky.yml`, `obsah/kauzy/.gitkeep`, `public/CNAME`, `tests/unit/kostra.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: npm skripty `dev`, `over`, `build`, `build:e2e`, `test`, `e2e`. Proměnné prostředí `NV_OBSAH` (cesta ke složce s obsahem, výchozí `obsah`) a `NV_VYSTUP` (výstupní složka buildu, výchozí `dist`).

- [ ] **Step 1: Ověřit identitu gitu (pojistka anonymity)**

Run: `git config user.name; git config user.email; git config user.useConfigOnly`
Expected: `Nenechme vyhnít`, `354814288+nenechmevyhnit@users.noreply.github.com`, `true`. Pokud ne, ZASTAVIT a nic necommitovat.

- [ ] **Step 2: Vytvořit `package.json`**

```json
{
  "name": "nenechmevyhnit",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "cross-env NV_OBSAH=tests/fixtures/obsah astro dev",
    "over": "tsx scripts/over-obsah.ts",
    "build": "npm run over && astro build",
    "build:e2e": "cross-env NV_OBSAH=tests/fixtures/obsah NV_VYSTUP=dist-e2e astro build && cross-env NV_OBSAH=tests/fixtures/prazdny NV_VYSTUP=dist-prazdny astro build",
    "test": "vitest run",
    "e2e": "npm run build:e2e && playwright test"
  }
}
```

- [ ] **Step 3: Nainstalovat závislosti**

Run:
```bash
npm install astro@^7 gray-matter@^4 yaml@^2
npm install -D typescript vitest@^5 @playwright/test@^1.65 @axe-core/playwright@^4 tsx@^4 cross-env@^10 serve@^14
npx playwright install chromium
```
Expected: instalace bez chyb.

- [ ] **Step 4: Vytvořit konfigurace**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nenechmevyhnit.cz',
  trailingSlash: 'always',
  outDir: process.env.NV_VYSTUP ?? 'dist',
  build: { format: 'directory' },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": ["src", "scripts", "tests", "nastroje"],
  "exclude": ["dist", "dist-e2e", "dist-prazdny", "design"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
```

`obsah/stitky.yml` (výchozí slovník, rozšiřuje se s obsahem):
```yaml
dotace: dotace
eu-fondy: EU fondy
stret-zajmu: střet zájmů
offshore: offshore
dane: daně
stb: StB
```

`public/CNAME`:
```
nenechmevyhnit.cz
```

Prázdný soubor `obsah/kauzy/.gitkeep`.

Dočasná `src/pages/index.astro`:
```astro
---
---
<html lang="cs"><head><meta charset="utf-8"><title>Nenechme vyhnít</title></head><body><p>Kostra</p></body></html>
```

- [ ] **Step 5: Doplnit `.gitignore`**

Připsat na konec:
```
dist-e2e/
dist-prazdny/
test-results/
playwright-report/
```

- [ ] **Step 6: Napsat kontrolní test**

`tests/unit/kostra.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('kostra', () => {
  it('CNAME obsahuje doménu', () => {
    expect(readFileSync('public/CNAME', 'utf8').trim()).toBe('nenechmevyhnit.cz');
  });
});
```

- [ ] **Step 7: Spustit test a build**

Run: `npm test` → Expected: 1 passed.
Run: `npx astro build` → Expected: `dist/index.html` existuje. (`npm run build` zatím selže, `over` přijde v úloze 4.)

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts .gitignore obsah public/CNAME src/pages/index.astro tests/unit/kostra.test.ts
git commit -m "Kostra projektu: Astro, Vitest, Playwright, slovník štítků"
```

---

### Task 2: Stavy, čeština a schéma kauzy

**Files:**
- Create: `src/lib/cestina.ts`, `src/lib/stavy.ts`, `src/lib/schema.ts`
- Test: `tests/unit/cestina.test.ts`, `tests/unit/schema.test.ts`, `tests/unit/ukazka.ts`

**Interfaces:**
- Produces:
  - `sklonuj(n: number, tvary: [string, string, string]): string` (vrací např. `"5 let"`)
  - `STAVY` (readonly tuple), `type Stav`, `popisekStavu(s: Stav): string`
  - `kauzaSchema` (Zod), `type Kauza = z.infer<typeof kauzaSchema>`, `type Zdroj`, `type Udalost`
  - `rokZData(datum: string): number`
  - `tests/unit/ukazka.ts`: `platnaKauza(): Record<string, unknown>` (fiktivní platná data pro testy)

- [ ] **Step 1: Napsat failující testy**

`tests/unit/ukazka.ts`:
```ts
// Fiktivní data jen pro testy. Neodkazují na skutečné osoby ani události.
export function platnaKauza(): Record<string, unknown> {
  return {
    typ: 'kauza',
    nazev: 'Testovací kauza Alfa',
    shrnuti: 'Fiktivní firma Alfa získala fiktivní dotaci.',
    od: 2010,
    do: null,
    stav: 'soudni-rizeni',
    stavPoznamka: 'Fiktivní stav.',
    stitky: ['dotace'],
    overeno: '2026-11-12',
    zdroje: [
      { id: 1, vydavatel: 'Fiktivní soud', titulek: 'Rozsudek', datum: '2012-01-09', druh: 'primarni', url: 'https://example.com/rozsudek' },
      { id: 2, vydavatel: 'Fiktivní deník', titulek: 'Článek', datum: '2011-05', druh: 'media', url: 'https://example.com/clanek' },
    ],
    udalosti: [
      { datum: '2010-03', nazev: 'Žádost o dotaci', popis: 'Firma Alfa žádá o dotaci.', zdroje: [2] },
      { datum: '2012-01-09', nazev: 'Rozsudek', popis: 'Soud rozhodl.', zdroje: [1] },
    ],
    stanovisko: { text: 'Firma Alfa pochybení odmítá.', zdroje: [2] },
  };
}
```

`tests/unit/cestina.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sklonuj } from '../../src/lib/cestina';

const LET: [string, string, string] = ['rok', 'roky', 'let'];

describe('sklonuj', () => {
  it.each([[1, '1 rok'], [2, '2 roky'], [4, '4 roky'], [5, '5 let'], [12, '12 let'], [0, '0 let']])('%i → %s', (n, ocekavano) => {
    expect(sklonuj(n, LET)).toBe(ocekavano);
  });
});
```

`tests/unit/schema.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { kauzaSchema, rokZData } from '../../src/lib/schema';
import { popisekStavu, STAVY } from '../../src/lib/stavy';
import { platnaKauza } from './ukazka';

const chyby = (data: unknown) => {
  const r = kauzaSchema.safeParse(data);
  return r.success ? [] : r.error.issues.map(i => i.message);
};

describe('kauzaSchema', () => {
  it('přijme platnou kauzu', () => expect(chyby(platnaKauza())).toEqual([]));

  it('převede datum z YAML (Date) na text', () => {
    const k = { ...platnaKauza(), overeno: new Date('2026-11-12T00:00:00Z') };
    const r = kauzaSchema.parse(k);
    expect(r.overeno).toBe('2026-11-12');
  });

  it('odmítne neznámý stav', () => expect(chyby({ ...platnaKauza(), stav: 'vinen' }).length).toBeGreaterThan(0));
  it('odmítne kauzu bez zdrojů', () => expect(chyby({ ...platnaKauza(), zdroje: [] }).length).toBeGreaterThan(0));
  it('odmítne událost bez zdroje', () => {
    const k = platnaKauza(); (k.udalosti as any)[0].zdroje = [];
    expect(chyby(k).join(' ')).toMatch(/aspoň jeden zdroj/);
  });
  it('odmítne chybějící stanovisko', () => {
    const k = platnaKauza(); delete k.stanovisko;
    expect(chyby(k).length).toBeGreaterThan(0);
  });
  it('odmítne chybějící datum ověření', () => {
    const k = platnaKauza(); delete k.overeno;
    expect(chyby(k).length).toBeGreaterThan(0);
  });
  it('odmítne duplicitní id zdroje', () => {
    const k = platnaKauza(); (k.zdroje as any)[1].id = 1;
    expect(chyby(k).join(' ')).toMatch(/Duplicitní id zdroje 1/);
  });
  it('odmítne odkaz události na neexistující zdroj', () => {
    const k = platnaKauza(); (k.udalosti as any)[0].zdroje = [7];
    expect(chyby(k).join(' ')).toMatch(/neexistující zdroj 7/);
  });
  it('odmítne odkaz stanoviska na neexistující zdroj', () => {
    const k = platnaKauza(); (k.stanovisko as any).zdroje = [9];
    expect(chyby(k).join(' ')).toMatch(/neexistující zdroj 9/);
  });
  it('odmítne do < od', () => expect(chyby({ ...platnaKauza(), do: 2005 }).join(' ')).toMatch(/Rok konce/));
  it('stav "jine" vyžaduje poznámku', () => {
    const k = { ...platnaKauza(), stav: 'jine' }; delete (k as any).stavPoznamka;
    expect(chyby(k).join(' ')).toMatch(/poznámk/);
  });
  it('odmítne událost mimo rozsah kauzy', () => {
    const k = { ...platnaKauza(), do: 2011 };
    expect(chyby(k).join(' ')).toMatch(/mimo rozsah/);
  });
  it('odmítne zdroj bez URL', () => {
    const k = platnaKauza(); delete (k.zdroje as any)[0].url;
    expect(chyby(k).length).toBeGreaterThan(0);
  });
  it('odmítne zdroj s jiným než http(s) odkazem', () => {
    const k = platnaKauza(); (k.zdroje as any)[0].url = 'ftp://example.com/x';
    expect(chyby(k).length).toBeGreaterThan(0);
  });
});

describe('rokZData a stavy', () => {
  it('rokZData', () => {
    expect(rokZData('2008')).toBe(2008);
    expect(rokZData('2008-03')).toBe(2008);
    expect(rokZData('2008-03-15')).toBe(2008);
  });
  it('každý stav má popisek', () => {
    for (const s of STAVY) expect(popisekStavu(s).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Spustit testy, ověřit selhání**

Run: `npm test` → Expected: FAIL (moduly neexistují).

- [ ] **Step 3: Implementovat**

`src/lib/cestina.ts`:
```ts
/** Vrátí "n tvar" podle českého skloňování: 1 → tvary[0], 2–4 → tvary[1], ostatní → tvary[2]. */
export function sklonuj(n: number, tvary: [string, string, string]): string {
  const tvar = n === 1 ? tvary[0] : n >= 2 && n <= 4 ? tvary[1] : tvary[2];
  return `${n} ${tvar}`;
}
```

`src/lib/stavy.ts`:
```ts
export const STAVY = [
  'provereni', 'obvineni', 'obzaloba',
  'nepravomocne-odsouzen', 'pravomocne-odsouzen',
  'nepravomocne-zprosten', 'pravomocne-zprosten',
  'odlozeno', 'zastaveno', 'promlceno',
  'soudni-rizeni', 'uredni-zjisteni', 'jine',
] as const;

export type Stav = (typeof STAVY)[number];

const POPISKY: Record<Stav, string> = {
  'provereni': 'Prověřování',
  'obvineni': 'Obvinění',
  'obzaloba': 'Obžaloba',
  'nepravomocne-odsouzen': 'Nepravomocně odsouzen',
  'pravomocne-odsouzen': 'Pravomocně odsouzen',
  'nepravomocne-zprosten': 'Nepravomocně zproštěn',
  'pravomocne-zprosten': 'Pravomocně zproštěn',
  'odlozeno': 'Odloženo',
  'zastaveno': 'Zastaveno',
  'promlceno': 'Promlčeno',
  'soudni-rizeni': 'Soudní řízení',
  'uredni-zjisteni': 'Úřední zjištění',
  'jine': 'Jiné',
};

export function popisekStavu(s: Stav): string {
  return POPISKY[s];
}
```

`src/lib/schema.ts`:
```ts
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
    if (k.stav === 'jine' && !k.stavPoznamka) ctx.addIssue({ code: 'custom', message: 'Stav "jine" vyžaduje vyplněnou stavPoznamka' });
    const konec = k.do ?? new Date().getFullYear();
    k.udalosti.forEach(u => {
      const r = rokZData(u.datum);
      if (r < k.od || r > konec) ctx.addIssue({ code: 'custom', message: `Událost „${u.nazev}“ (${u.datum}) leží mimo rozsah kauzy ${k.od}–${k.do ?? 'dosud'}` });
    });
  });

export type Kauza = z.infer<typeof kauzaSchema>;
export type Zdroj = Kauza['zdroje'][number];
export type Udalost = Kauza['udalosti'][number];
```

- [ ] **Step 4: Spustit testy**

Run: `npm test` → Expected: PASS (všechny testy v `cestina` a `schema`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cestina.ts src/lib/stavy.ts src/lib/schema.ts tests/unit/
git commit -m "Schéma kauzy se stavy řízení a kontrolami zdrojů"
```

---

### Task 3: Souvislosti a poznámky ke zdrojům

**Files:**
- Create: `src/lib/souvislosti.ts`
- Test: `tests/unit/souvislosti.test.ts`

**Interfaces:**
- Produces:
  - `rozdelOdstavce(telo: string): string[]`
  - `poznamkyVOdstavci(odstavec: string): number[]`
  - `odstavecNaHtml(odstavec: string): string`. Escapuje HTML, převádí `**tučně**`, `*kurzíva*` a `[^n]` → `<sup><a class="pozn" href="#zdroj-n" data-zdroj="n">[n]</a></sup>`.

- [ ] **Step 1: Napsat failující test**

`tests/unit/souvislosti.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { rozdelOdstavce, poznamkyVOdstavci, odstavecNaHtml } from '../../src/lib/souvislosti';

describe('souvislosti', () => {
  it('rozdělí tělo na odstavce podle prázdných řádků', () => {
    expect(rozdelOdstavce('\nPrvní.[^1]\n\n\nDruhý\nřádek.[^2]\n')).toEqual(['První.[^1]', 'Druhý\nřádek.[^2]']);
  });
  it('prázdné tělo nemá odstavce', () => expect(rozdelOdstavce('  \n ')).toEqual([]));
  it('najde čísla poznámek', () => expect(poznamkyVOdstavci('A.[^1] B.[^12][^3]')).toEqual([1, 12, 3]));
  it('převede poznámku na odkaz na zdroj', () => {
    expect(odstavecNaHtml('Text.[^4]')).toBe('Text.<sup><a class="pozn" href="#zdroj-4" data-zdroj="4">[4]</a></sup>');
  });
  it('escapuje HTML a zachová tučné a kurzívu', () => {
    expect(odstavecNaHtml('<b>x</b> **tučně** a *kurzíva* & "uvozovky"'))
      .toBe('&lt;b&gt;x&lt;/b&gt; <strong>tučně</strong> a <em>kurzíva</em> &amp; &quot;uvozovky&quot;');
  });
});
```

- [ ] **Step 2: Spustit, ověřit selhání**

Run: `npx vitest run tests/unit/souvislosti.test.ts` → Expected: FAIL.

- [ ] **Step 3: Implementovat**

`src/lib/souvislosti.ts`:
```ts
const POZNAMKA = /\[\^(\d+)\]/g;

export function rozdelOdstavce(telo: string): string[] {
  return telo.trim() === '' ? [] : telo.trim().split(/\n\s*\n/).map(o => o.trim()).filter(Boolean);
}

export function poznamkyVOdstavci(odstavec: string): number[] {
  return [...odstavec.matchAll(POZNAMKA)].map(m => Number(m[1]));
}

const escapuj = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function odstavecNaHtml(odstavec: string): string {
  return escapuj(odstavec)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(POZNAMKA, (_, n) => `<sup><a class="pozn" href="#zdroj-${n}" data-zdroj="${n}">[${n}]</a></sup>`);
}
```

- [ ] **Step 4: Spustit testy**

Run: `npx vitest run tests/unit/souvislosti.test.ts` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/souvislosti.ts tests/unit/souvislosti.test.ts
git commit -m "Souvislosti: odstavce a poznámky odkazující na zdroje"
```

---

### Task 4: Validátor obsahu a testovací data

**Files:**
- Create: `src/lib/validace.ts`, `scripts/over-obsah.ts`, `tests/fixtures/obsah/stitky.yml`, `tests/fixtures/obsah/kauzy/*.md` (6 souborů), `tests/fixtures/prazdny/stitky.yml`, `tests/fixtures/prazdny/kauzy/.gitkeep`
- Test: `tests/unit/validace.test.ts`

**Interfaces:**
- Consumes: `kauzaSchema`, `Kauza` (Task 2), `rozdelOdstavce`, `poznamkyVOdstavci` (Task 3)
- Produces:
  - `type Chyba = { soubor: string; zprava: string }`
  - `type KauzaZaznam = { slug: string; kauza: Kauza; telo: string }`
  - `overKauzu(soubor: string, data: unknown, telo: string, stitky: Set<string>): { kauza?: Kauza; chyby: Chyba[] }`
  - `nactiSlovnikStitku(adresar: string): Map<string, string>`
  - `overAdresar(adresar: string): { zaznamy: KauzaZaznam[]; stitky: Map<string, string>; chyby: Chyba[] }`

- [ ] **Step 1: Vytvořit fiktivní testovací obsah**

`tests/fixtures/obsah/stitky.yml`:
```yaml
dotace: dotace
eu-fondy: EU fondy
stret-zajmu: střet zájmů
offshore: offshore
dane: daně
soudy: soudy
```

`tests/fixtures/prazdny/stitky.yml`: stejný obsah. `tests/fixtures/prazdny/kauzy/.gitkeep`: prázdný.

Šest souborů v `tests/fixtures/obsah/kauzy/`. Všechny jsou fiktivní, se zdroji na `example.com`. Tvar ukazuje první soubor, ostatní mají jinou kombinaci roků, stavů a štítků, aby testy pokryly uzavřené i neuzavřené kauzy.

`tests/fixtures/obsah/kauzy/alfa-dotace.md`:
```markdown
---
nazev: Testovací kauza Alfa
shrnuti: Fiktivní firma Alfa získala fiktivní dotaci 50 milionů pro malé podniky.
od: 2007
do: null
stav: soudni-rizeni
stavPoznamka: Fiktivní odvolací soud vrátil věc k novému projednání.
stitky: [dotace, eu-fondy]
overeno: 2026-11-12
zdroje:
  - { id: 1, vydavatel: Fiktivní městský soud, titulek: Rozsudek ve věci Alfa, datum: 2023-01-09, druh: primarni, url: "https://example.com/alfa/rozsudek" }
  - { id: 2, vydavatel: Fiktivní deník, titulek: Jak Alfa získala dotaci, datum: 2016-02-15, druh: media, url: "https://example.com/alfa/clanek" }
  - { id: 3, vydavatel: Fiktivní rozhlas, titulek: Alfa olaf vyšetřování, datum: 2017-12-21, druh: media, url: "https://example.com/alfa/olaf" }
udalosti:
  - { datum: 2007-12, nazev: Vyčlenění firmy, popis: Firma Alfa byla vyčleněna z holdingu., zdroje: [2] }
  - { datum: 2008-03, nazev: Žádost o dotaci, popis: Alfa žádá o dotaci pro malé podniky., zdroje: [2] }
  - { datum: 2017-12, nazev: Zpráva úřadu OLAF, popis: Fiktivní úřad uvádí pochybení., zdroje: [3] }
  - { datum: 2023-01-09, nazev: Nepravomocné zproštění, popis: Soud zprostil obžalované., zdroje: [1] }
stanovisko: { text: Firma Alfa pochybení odmítá., zdroje: [2] }
---
Firma Alfa byla původně součástí holdingu.[^2]

Klíčovou otázkou je, zda bylo vyčlenění účelové.[^1][^3]
```

Další soubory (stejná struktura, vlastní fiktivní texty a zdroje na `example.com/<slug>/…`):

| soubor | nazev | od | do | stav | stitky |
|---|---|---|---|---|---|
| `beta-archiv.md` | Testovací kauza Beta | 1982 | 2018 | `pravomocne-zprosten` | `[soudy]` |
| `gama-offshore.md` | Testovací kauza Gama | 2009 | 2021 | `zastaveno` | `[offshore]` |
| `delta-dluhopisy.md` | Testovací kauza Delta | 2012 | 2014 | `uredni-zjisteni` | `[dane]` |
| `epsilon-fondy.md` | Testovací kauza Epsilon s velmi dlouhým názvem, který se nevejde | 2017 | `null` | `uredni-zjisteni` | `[stret-zajmu]` |
| `zeta-stret.md` | Testovací kauza Žeta | 2018 | `null` | `obzaloba` | `[stret-zajmu, eu-fondy]` |

Každý soubor má aspoň 2 zdroje, 2 události v rozsahu `od`–`do`, stanovisko a 1–2 odstavce s poznámkami `[^n]`.

- [ ] **Step 2: Napsat failující test**

`tests/unit/validace.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { overKauzu, overAdresar } from '../../src/lib/validace';
import { platnaKauza } from './ukazka';

const STITKY = new Set(['dotace', 'soudy']);

describe('overKauzu', () => {
  it('platná kauza bez chyb', () => {
    expect(overKauzu('a.md', platnaKauza(), 'Odstavec.[^1]', STITKY).chyby).toEqual([]);
  });
  it('neznámý štítek', () => {
    const r = overKauzu('a.md', { ...platnaKauza(), stitky: ['neznamy'] }, 'O.[^1]', STITKY);
    expect(r.chyby[0].zprava).toMatch(/Neznámý štítek „neznamy“/);
  });
  it('odstavec bez poznámky', () => {
    const r = overKauzu('a.md', platnaKauza(), 'S poznámkou.[^1]\n\nBez poznámky.', STITKY);
    expect(r.chyby.map(c => c.zprava).join(' ')).toMatch(/Odstavec 2 souvislostí nemá poznámku/);
  });
  it('poznámka na neexistující zdroj', () => {
    const r = overKauzu('a.md', platnaKauza(), 'Text.[^8]', STITKY);
    expect(r.chyby[0].zprava).toMatch(/Poznámka \[\^8\] odkazuje na neexistující zdroj/);
  });
  it('chyby nesou název souboru', () => {
    const r = overKauzu('obsah/kauzy/x.md', { ...platnaKauza(), stav: 'spatne' }, '', STITKY);
    expect(r.chyby.every(c => c.soubor === 'obsah/kauzy/x.md')).toBe(true);
  });
});

describe('overAdresar', () => {
  it('načte fiktivní obsah bez chyb, seřazený podle začátku', () => {
    const r = overAdresar('tests/fixtures/obsah');
    expect(r.chyby).toEqual([]);
    expect(r.zaznamy).toHaveLength(6);
    expect(r.zaznamy[0].slug).toBe('beta-archiv');
    expect(r.stitky.get('eu-fondy')).toBe('EU fondy');
  });
  it('prázdný archiv je platný', () => {
    const r = overAdresar('tests/fixtures/prazdny');
    expect(r.chyby).toEqual([]);
    expect(r.zaznamy).toEqual([]);
  });
  it('neplatný název souboru je chyba', () => {
    expect(overAdresar('tests/fixtures/obsah').zaznamy.every(z => /^[a-z0-9-]+$/.test(z.slug))).toBe(true);
  });
});
```

- [ ] **Step 3: Spustit, ověřit selhání**

Run: `npx vitest run tests/unit/validace.test.ts` → Expected: FAIL.

- [ ] **Step 4: Implementovat validátor a CLI**

`src/lib/validace.ts`:
```ts
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import { kauzaSchema, type Kauza } from './schema';
import { rozdelOdstavce, poznamkyVOdstavci } from './souvislosti';

export type Chyba = { soubor: string; zprava: string };
export type KauzaZaznam = { slug: string; kauza: Kauza; telo: string };

export function overKauzu(soubor: string, data: unknown, telo: string, stitky: Set<string>): { kauza?: Kauza; chyby: Chyba[] } {
  const chyby: Chyba[] = [];
  const r = kauzaSchema.safeParse(data);
  if (!r.success) {
    for (const i of r.error.issues) chyby.push({ soubor, zprava: `${i.path.join('.') || 'kauza'}: ${i.message}` });
    return { chyby };
  }
  const k = r.data;
  for (const s of k.stitky) if (!stitky.has(s)) chyby.push({ soubor, zprava: `Neznámý štítek „${s}“ (doplňte ho do stitky.yml)` });
  const ids = new Set(k.zdroje.map(z => z.id));
  rozdelOdstavce(telo).forEach((o, i) => {
    const p = poznamkyVOdstavci(o);
    if (p.length === 0) chyby.push({ soubor, zprava: `Odstavec ${i + 1} souvislostí nemá poznámku se zdrojem [^n]` });
    for (const n of p) if (!ids.has(n)) chyby.push({ soubor, zprava: `Poznámka [^${n}] odkazuje na neexistující zdroj` });
  });
  return chyby.length ? { chyby } : { kauza: k, chyby };
}

export function nactiSlovnikStitku(adresar: string): Map<string, string> {
  const cesta = join(adresar, 'stitky.yml');
  if (!existsSync(cesta)) return new Map();
  const data = parseYaml(readFileSync(cesta, 'utf8')) ?? {};
  return new Map(Object.entries(data).map(([k, v]) => [k, String(v)]));
}

export function overAdresar(adresar: string): { zaznamy: KauzaZaznam[]; stitky: Map<string, string>; chyby: Chyba[] } {
  const stitky = nactiSlovnikStitku(adresar);
  const slozka = join(adresar, 'kauzy');
  const soubory = existsSync(slozka) ? readdirSync(slozka).filter(f => f.endsWith('.md')).sort() : [];
  const zaznamy: KauzaZaznam[] = [];
  const chyby: Chyba[] = [];
  for (const f of soubory) {
    const soubor = join(slozka, f);
    const slug = basename(f, '.md');
    if (!/^[a-z0-9-]+$/.test(slug)) { chyby.push({ soubor, zprava: 'Název souboru smí obsahovat jen malá písmena bez diakritiky, číslice a pomlčky' }); continue; }
    const { data, content } = matter(readFileSync(soubor, 'utf8'));
    const r = overKauzu(soubor, data, content, new Set(stitky.keys()));
    chyby.push(...r.chyby);
    if (r.kauza) zaznamy.push({ slug, kauza: r.kauza, telo: content });
  }
  zaznamy.sort((a, b) => a.kauza.od - b.kauza.od || a.kauza.nazev.localeCompare(b.kauza.nazev, 'cs'));
  return { zaznamy, stitky, chyby };
}
```

`scripts/over-obsah.ts`:
```ts
import { overAdresar } from '../src/lib/validace';

const adresar = process.env.NV_OBSAH ?? 'obsah';
const { zaznamy, chyby } = overAdresar(adresar);
if (chyby.length) {
  console.error(`\nObsah v „${adresar}“ má ${chyby.length} chyb:\n`);
  for (const c of chyby) console.error(`  ${c.soubor}: ${c.zprava}`);
  console.error('\nWeb se nesestaví, dokud chyby neopravíte.\n');
  process.exit(1);
}
console.log(`Obsah v pořádku: ${zaznamy.length} kauz v „${adresar}“.`);
```

- [ ] **Step 5: Spustit testy a CLI**

Run: `npx vitest run tests/unit/validace.test.ts` → Expected: PASS.
Run: `npm run over` → Expected: `Obsah v pořádku: 0 kauz v „obsah“.`
Run: `npx cross-env NV_OBSAH=tests/fixtures/obsah npm run over` → Expected: `Obsah v pořádku: 6 kauz …`
Ověřit selhání: dočasně smazat `stanovisko` v `tests/fixtures/obsah/kauzy/alfa-dotace.md`, spustit předchozí příkaz → Expected: výpis chyby s názvem souboru a exit kód 1. Změnu vrátit.

- [ ] **Step 6: Commit**

```bash
git add src/lib/validace.ts scripts/over-obsah.ts tests/fixtures tests/unit/validace.test.ts
git commit -m "Validátor obsahu: build selže bez zdrojů, stanoviska nebo poznámek"
```

---

### Task 5: Časová osa a hledání (čistá logika)

**Files:**
- Create: `src/lib/casova-osa.ts`, `src/lib/hledani.ts`
- Test: `tests/unit/casova-osa.test.ts`, `tests/unit/hledani.test.ts`

**Interfaces:**
- Consumes: `Kauza` (Task 2), `KauzaZaznam` (Task 4), `sklonuj` (Task 2)
- Produces (`casova-osa.ts`):
  - `ROK_OD = 1980`, `rokDo(dnes?: Date): number`
  - `rokCislo(datum: string): number` (desetinný rok)
  - `naProcenta(rok: number, od: number, doRok: number): number` (0–100, oříznuto)
  - `rozsahText(od: number, doRok: number | null): string`
  - `delkaText(od: number, doRok: number | null, dnes?: Date): string`
  - `datumText(datum: string): string`
  - `znackyOsy(od: number, doRok: number): { rok: number; hlavni: boolean }[]`
- Produces (`hledani.ts`):
  - `normalizuj(t: string): string`
  - `type Filtr = { text: string; stitky: string[]; jenOtevrene: boolean }`
  - `type PolozkaHledani = { slug: string; otevrena: boolean; stitky: string[]; text: string }`
  - `vytvorPolozku(z: KauzaZaznam): PolozkaHledani`
  - `odpovida(p: PolozkaHledani, f: Filtr): boolean`
  - `jeAktivni(f: Filtr): boolean`

- [ ] **Step 1: Napsat failující testy**

`tests/unit/casova-osa.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { rokCislo, naProcenta, rozsahText, delkaText, datumText, znackyOsy, rokDo } from '../../src/lib/casova-osa';

const DNES = new Date('2026-11-10T12:00:00');

describe('časová osa', () => {
  it('rokCislo podle přesnosti data', () => {
    expect(rokCislo('2008')).toBe(2008.5);
    expect(rokCislo('2008-01')).toBeCloseTo(2008 + 0.5 / 12);
    expect(rokCislo('2008-07-01')).toBeCloseTo(2008 + 6 / 12);
  });
  it('naProcenta ořízne rozsah', () => {
    expect(naProcenta(1980, 1980, 2026)).toBe(0);
    expect(naProcenta(2026, 1980, 2026)).toBe(100);
    expect(naProcenta(1970, 1980, 2026)).toBe(0);
    expect(naProcenta(2030, 1980, 2026)).toBe(100);
  });
  it('rozsahText', () => {
    expect(rozsahText(1982, 2018)).toBe('1982–2018');
    expect(rozsahText(2007, null)).toBe('2007 – dosud');
    expect(rozsahText(2012, 2012)).toBe('2012');
  });
  it('delkaText se skloňováním', () => {
    expect(delkaText(1982, 2018, DNES)).toBe('36 let');
    expect(delkaText(2007, null, DNES)).toBe('19 let a dál');
    expect(delkaText(2012, 2014, DNES)).toBe('2 roky');
    expect(delkaText(2013, 2014, DNES)).toBe('1 rok');
    expect(delkaText(2014, 2014, DNES)).toBe('méně než rok');
  });
  it('datumText', () => {
    expect(datumText('2010')).toBe('2010');
    expect(datumText('2008-03')).toBe('březen 2008');
    expect(datumText('2023-01-09')).toBe('9. 1. 2023');
  });
  it('značky osy po pěti letech včetně posledního roku', () => {
    const z = znackyOsy(1980, 2026);
    expect(z[0]).toEqual({ rok: 1980, hlavni: true });
    expect(z.find(x => x.rok === 1985)?.hlavni).toBe(false);
    expect(z.at(-1)).toEqual({ rok: 2026, hlavni: true });
    expect(z.filter(x => x.rok === 2025)).toHaveLength(1);
  });
  it('rokDo je aktuální rok', () => expect(rokDo(DNES)).toBe(2026));
});
```

`tests/unit/hledani.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { normalizuj, odpovida, jeAktivni, type PolozkaHledani, type Filtr } from '../../src/lib/hledani';

const p: PolozkaHledani = { slug: 'alfa', otevrena: true, stitky: ['dotace', 'eu-fondy'], text: normalizuj('Čapí Alfa zpráva úřadu OLAF') };
const prazdny: Filtr = { text: '', stitky: [], jenOtevrene: false };

describe('hledání', () => {
  it('normalizuje diakritiku a velikost písmen', () => expect(normalizuj('Čapí HNÍZDO')).toBe('capi hnizdo'));
  it('prázdný filtr pustí vše', () => expect(odpovida(p, prazdny)).toBe(true));
  it('hledá bez diakritiky', () => expect(odpovida(p, { ...prazdny, text: 'capi' })).toBe(true));
  it('všechna slova musí sedět', () => {
    expect(odpovida(p, { ...prazdny, text: 'alfa olaf' })).toBe(true);
    expect(odpovida(p, { ...prazdny, text: 'alfa beta' })).toBe(false);
  });
  it('štítky jako NEBO', () => {
    expect(odpovida(p, { ...prazdny, stitky: ['offshore', 'dotace'] })).toBe(true);
    expect(odpovida(p, { ...prazdny, stitky: ['offshore'] })).toBe(false);
  });
  it('jen neuzavřené', () => {
    expect(odpovida({ ...p, otevrena: false }, { ...prazdny, jenOtevrene: true })).toBe(false);
  });
  it.each(['(', '+', '*', '\\', '"', '[a-z]', '   '])('zvláštní znak %j nespadne', t => {
    expect(() => odpovida(p, { ...prazdny, text: t })).not.toThrow();
  });
  it('samé mezery = žádný text', () => expect(odpovida(p, { ...prazdny, text: '   ' })).toBe(true));
  it('jeAktivni', () => {
    expect(jeAktivni(prazdny)).toBe(false);
    expect(jeAktivni({ ...prazdny, text: '  ' })).toBe(false);
    expect(jeAktivni({ ...prazdny, jenOtevrene: true })).toBe(true);
  });
});
```

- [ ] **Step 2: Spustit, ověřit selhání**

Run: `npx vitest run tests/unit/casova-osa.test.ts tests/unit/hledani.test.ts` → Expected: FAIL.

- [ ] **Step 3: Implementovat**

`src/lib/casova-osa.ts`:
```ts
import { sklonuj } from './cestina';

export const ROK_OD = 1980;
export const rokDo = (dnes: Date = new Date()): number => dnes.getFullYear();

export function rokCislo(datum: string): number {
  const [r, m, d] = datum.split('-').map(Number);
  if (!m) return r + 0.5;
  if (!d) return r + (m - 1 + 0.5) / 12;
  return r + (m - 1 + (d - 1) / 31) / 12;
}

export function naProcenta(rok: number, od: number, doRok: number): number {
  const p = ((rok - od) / (doRok - od)) * 100;
  return Math.min(100, Math.max(0, p));
}

export function rozsahText(od: number, doRok: number | null): string {
  if (doRok === null) return `${od} – dosud`;
  return od === doRok ? String(od) : `${od}–${doRok}`;
}

export function delkaText(od: number, doRok: number | null, dnes: Date = new Date()): string {
  const n = (doRok ?? rokDo(dnes)) - od;
  if (n <= 0) return 'méně než rok';
  return sklonuj(n, ['rok', 'roky', 'let']) + (doRok === null ? ' a dál' : '');
}

const MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
export function datumText(datum: string): string {
  const [r, m, d] = datum.split('-');
  if (d) return `${Number(d)}. ${Number(m)}. ${r}`;
  if (m) return `${MESICE[Number(m) - 1]} ${r}`;
  return r;
}

export function znackyOsy(od: number, doRok: number): { rok: number; hlavni: boolean }[] {
  const z: { rok: number; hlavni: boolean }[] = [];
  for (let r = Math.ceil(od / 5) * 5; r < doRok; r += 5) z.push({ rok: r, hlavni: r % 10 === 0 });
  z.push({ rok: doRok, hlavni: true });
  return z;
}
```

`src/lib/hledani.ts`:
```ts
import type { KauzaZaznam } from './validace';

export type Filtr = { text: string; stitky: string[]; jenOtevrene: boolean };
export type PolozkaHledani = { slug: string; otevrena: boolean; stitky: string[]; text: string };

export function normalizuj(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function vytvorPolozku(z: KauzaZaznam): PolozkaHledani {
  const k = z.kauza;
  const text = [k.nazev, k.shrnuti, k.stitky.join(' '), ...k.udalosti.map(u => `${u.nazev} ${u.popis}`)].join(' ');
  return { slug: z.slug, otevrena: k.do === null, stitky: k.stitky, text: normalizuj(text) };
}

const slova = (t: string) => normalizuj(t).split(/\s+/).filter(Boolean);

export function odpovida(p: PolozkaHledani, f: Filtr): boolean {
  if (f.jenOtevrene && !p.otevrena) return false;
  if (f.stitky.length && !p.stitky.some(s => f.stitky.includes(s))) return false;
  return slova(f.text).every(w => p.text.includes(w));
}

export function jeAktivni(f: Filtr): boolean {
  return f.jenOtevrene || f.stitky.length > 0 || slova(f.text).length > 0;
}
```

- [ ] **Step 4: Spustit testy**

Run: `npm test` → Expected: PASS (všechny dosavadní testy).

- [ ] **Step 5: Commit**

```bash
git add src/lib/casova-osa.ts src/lib/hledani.ts tests/unit/casova-osa.test.ts tests/unit/hledani.test.ts
git commit -m "Výpočty časové osy a hledání bez diakritiky"
```

---

### Task 6: Písma, portrét, náhled a CSS z prototypů

**Files:**
- Create: `nastroje/stahni-fonty.mjs`, `nastroje/vytahni-css.py`, `nastroje/vyrez_portretu.py` (zkopírovat z `design/nastroje/`), `nastroje/nahled.mjs`, `src/styles/fonty.css` (generované), `src/styles/hlavni.css`, `src/styles/stranky.css` (generované), `src/styles/upravy.css`, `public/fonty/*.woff2`, `public/obrazky/portret.webp`, `public/obrazky/nahled.png`
- Test: `tests/unit/styly.test.ts`

**Interfaces:**
- Produces: CSS soubory, které stránky importují. `hlavni.css` a `stranky.css` očekávají přesně DOM prototypů (třídy `graf`, `graf-vnitrek`, `osa-roku`, `radek`, `radek-btn`, `nazev`, `stopa`, `pruh`, `popisek`, `pasmo`, `pilulka`, `otevrit`, `legenda`, `filtry f4`, `f-cipy`, `detail m2`, `m2-hlava`, `mini-osa`, `zalozky`, `m2-panel`, `udalost-velka`, `listovani`, `zdroje`, `portret`, `met-hlava`, `v4-mrizka`, `v4-karta`, `v4-dlg`…). Rodiny písem: `"Redaction 10"`, `"JetBrains Mono"`.

- [ ] **Step 1: Napsat failující test na styly (žádné třetí strany)**

`tests/unit/styly.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const soubory = ['src/styles/fonty.css', 'src/styles/hlavni.css', 'src/styles/stranky.css', 'src/styles/upravy.css'];

describe('styly', () => {
  it.each(soubory)('%s existuje a nenačítá nic z cizích serverů', s => {
    expect(existsSync(s)).toBe(true);
    const css = readFileSync(s, 'utf8');
    expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic|@import\s+url\(\s*["']?https?:/);
  });
  it('fonty.css definuje obě rodiny a odkazuje na lokální soubory', () => {
    const css = readFileSync('src/styles/fonty.css', 'utf8');
    expect(css).toContain('"Redaction 10"');
    expect(css).toContain('"JetBrains Mono"');
    for (const m of css.matchAll(/url\(([^)]+)\)/g)) {
      const cesta = m[1].replace(/["']/g, '');
      expect(cesta.startsWith('/fonty/')).toBe(true);
      expect(existsSync('public' + cesta)).toBe(true);
    }
  });
  it('portrét a náhled existují', () => {
    expect(existsSync('public/obrazky/portret.webp')).toBe(true);
    expect(existsSync('public/obrazky/nahled.png')).toBe(true);
  });
});
```

Run: `npx vitest run tests/unit/styly.test.ts` → Expected: FAIL.

- [ ] **Step 2: Stáhnout písma lokálně**

`nastroje/stahni-fonty.mjs`:
```js
// Jednorázově stáhne Redaction 10 a JetBrains Mono (latin + latin-ext) z Google Fonts do public/fonty
// a vytvoří src/styles/fonty.css. Za běhu webu se Google Fonts nepoužívají.
import { mkdirSync, writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const RODINY = [
  'family=Redaction+10:ital,wght@0,400;0,700;1,400',
  'family=JetBrains+Mono:wght@400;600',
];
mkdirSync('public/fonty', { recursive: true });
let vystup = '/* Vygenerováno nastroje/stahni-fonty.mjs — písma jsou hostovaná lokálně (OFL). */\n';
for (const r of RODINY) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${r}&display=swap`, { headers: { 'User-Agent': UA } })).text();
  for (const blok of css.split('@font-face').slice(1)) {
    const podmnozina = (blok.match(/\/\*\s*([\w-]+)\s*\*\//) ?? [])[1];
    // komentář s podmnožinou je PŘED blokem, proto ho hledáme v předchozím textu
    const predchozi = css.slice(0, css.indexOf(blok)).split('/*').at(-1) ?? '';
    const sada = (predchozi.match(/^\s*([\w-]+)\s*\*\//) ?? [])[1] ?? podmnozina;
    if (sada !== 'latin' && sada !== 'latin-ext') continue;
    const rodina = blok.match(/font-family:\s*'([^']+)'/)[1];
    const styl = blok.match(/font-style:\s*(\w+)/)[1];
    const vaha = blok.match(/font-weight:\s*(\d+)/)[1];
    const url = blok.match(/url\(([^)]+)\)/)[1];
    const rozsah = blok.match(/unicode-range:\s*([^;]+);/)[1];
    const soubor = `${rodina.replace(/\s+/g, '')}-${vaha}${styl === 'italic' ? 'i' : ''}-${sada}.woff2`;
    writeFileSync(`public/fonty/${soubor}`, Buffer.from(await (await fetch(url)).arrayBuffer()));
    vystup += `@font-face { font-family: "${rodina}"; font-style: ${styl}; font-weight: ${vaha}; font-display: swap; src: url(/fonty/${soubor}) format("woff2"); unicode-range: ${rozsah}; }\n`;
  }
}
writeFileSync('src/styles/fonty.css', vystup);
console.log('Hotovo: src/styles/fonty.css');
```

Run: `node nastroje/stahni-fonty.mjs` → Expected: `public/fonty/` obsahuje soubory `Redaction10-400-latin.woff2`, `Redaction10-400-latin-ext.woff2`, …, `JetBrainsMono-600-latin-ext.woff2`. `src/styles/fonty.css` obsahuje 10 bloků `@font-face`.

- [ ] **Step 3: Převzít CSS z prototypů**

`nastroje/vytahni-css.py`:
```python
"""Poskládá CSS z odsouhlaseného prototypu (lokální <link> + bloky <style>) v pořadí dokumentu.
Použití: python -I nastroje/vytahni-css.py <prototyp.html> <vystup.css>"""
import re, sys, pathlib

html_cesta, vystup = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
html = html_cesta.read_text(encoding='utf-8')
casti = []
for m in re.finditer(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>|<style>(.*?)</style>', html, re.S):
    if m.group(1):
        href = m.group(1)
        if href.startswith('http'):
            continue
        css = (html_cesta.parent / href).read_text(encoding='utf-8')
        casti.append(f'/* ---- z {href} ---- */\n{css}')
    else:
        casti.append(f'/* ---- vložený <style> ---- */\n{m.group(2)}')
css = '\n'.join(casti)
css = re.sub(r'@import\s+url\([^)]*\)\s*;', '', css)
vystup.write_text('/* Vygenerováno nastroje/vytahni-css.py z ' + html_cesta.name + ' — neupravovat ručně, doplňky patří do upravy.css */\n' + css, encoding='utf-8')
print('zapsáno', vystup)
```

Run:
```bash
python -I nastroje/vytahni-css.py design/03-detail/portret-p4.html src/styles/hlavni.css
python -I nastroje/vytahni-css.py design/03-detail/metodika-v4.html src/styles/stranky.css
```
Expected: oba soubory existují a neobsahují `fonts.googleapis`.

- [ ] **Step 4: Doplňky pro produkční markup**

`src/styles/upravy.css`:
```css
/* Řádek osy je v produkci odkaz <a> (funguje i bez JavaScriptu), ne <button>. */
a.radek-btn { color: inherit; text-decoration: none; }
/* Chronologie: všechny události jsou v HTML, skript ukazuje vždy jednu. */
.udalosti-seznam { list-style: none; margin: 0; padding: 0; }
.udalosti-seznam > li[hidden] { display: none; }
/* Prázdný archiv před spuštěním */
.archiv-prazdny { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; padding: 24px; color: var(--meta); font-size: 17px; }
/* Portrét se načítá jako <img> s cestou z public/ */
.portret img { user-select: none; }
```

- [ ] **Step 5: Portrét a náhledový obrázek**

Zkopírovat `design/nastroje/vyrez_portretu.py` do `nastroje/vyrez_portretu.py` beze změny. Potom převést hotový výřez na WebP:

Run:
```bash
python -I nastroje/vyrez_portretu.py design/obrazky/babis-portret.jpg design/obrazky/babis-portret-vyrez.png
python -I -c "from PIL import Image; im=Image.open('design/obrazky/babis-portret-vyrez.png'); im.thumbnail((960,1280)); im.save('public/obrazky/portret.webp', 'WEBP', quality=82, method=6)"
```
Expected: `public/obrazky/portret.webp` (zhruba do 200 kB, s průhledností).

`nastroje/nahled.mjs`:
```js
// Vygeneruje public/obrazky/nahled.png (1200×630) pro náhled při sdílení odkazu.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const fonty = readFileSync('src/styles/fonty.css', 'utf8').replaceAll('url(/fonty/', `url(file://${process.cwd().replace(/\\/g, '/')}/public/fonty/`);
const html = `<!doctype html><html lang="cs"><head><meta charset="utf-8"><style>${fonty}
body{margin:0;width:1200px;height:630px;background:#F5F5F8;font-family:"Redaction 10",Georgia,serif;color:#16153A;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;border-top:14px solid #DB1F2D}
.nad{font:600 26px "JetBrains Mono",monospace;color:#DB1F2D;letter-spacing:.06em;text-transform:uppercase}
h1{font-size:96px;line-height:1;margin:18px 0 22px}
p{font-size:34px;color:#33325A;margin:0;max-width:880px}
.pruhy{margin-top:42px;display:grid;gap:12px;width:620px}.pruhy i{display:block;height:14px;background:#282661;border-radius:2px}
</style></head><body><div class="nad">Archiv kauz Andreje Babiše</div><h1>Nenechme vyhnít</h1><p>Kauzy přehledně, s daty a zdroji.</p>
<div class="pruhy"><i style="width:85%"></i><i style="width:45%;margin-left:55%"></i><i style="width:25%;margin-left:70%"></i></div></body></html>`;
const prohlizec = await chromium.launch();
const stranka = await prohlizec.newPage({ viewport: { width: 1200, height: 630 } });
await stranka.setContent(html, { waitUntil: 'networkidle' });
await stranka.screenshot({ path: 'public/obrazky/nahled.png' });
await prohlizec.close();
console.log('Hotovo: public/obrazky/nahled.png');
```

Run: `node nastroje/nahled.mjs` → Expected: `public/obrazky/nahled.png`. Otevřít a vizuálně zkontrolovat (česká diakritika, rozložení).

- [ ] **Step 6: Spustit testy**

Run: `npx vitest run tests/unit/styly.test.ts` → Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add nastroje public/fonty public/obrazky src/styles tests/unit/styly.test.ts
git commit -m "Lokální písma, portrét, náhled pro sdílení a styly z prototypů"
```

---

### Task 7: Základní rozvržení, hlavička a patička

**Files:**
- Create: `src/layouts/Zaklad.astro`, `src/components/Hlavicka.astro`, `src/components/PatickaRadek.astro`, `src/lib/kauzy.ts`, `playwright.config.ts`, `tests/e2e/pomocne.ts`, `tests/e2e/zaklad.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `overAdresar`, `KauzaZaznam` (Task 4)
- Produces:
  - `nactiKauzy(): KauzaZaznam[]` a `nactiStitky(): Map<string,string>` (z `NV_OBSAH`, výsledek je v paměti; při chybě vyhodí výjimku se seznamem chyb)
  - `<Zaklad titulek popis cesta styly="hlavni"|"stranky" otevrena?>`: slot obsahu, `<body data-otevrena={slug}>`
  - `<Hlavicka aktivni="kauzy"|"metodika"|"o-projektu" />`
  - `<PatickaRadek legenda={boolean} />`
  - `tests/e2e/pomocne.ts`: `VELIKOSTI`, `overBezPosouvani(page)`

- [ ] **Step 1: Konfigurace Playwright a pomocné funkce**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'npx serve dist-e2e -l 4321 --no-clipboard', port: 4321, reuseExistingServer: !process.env.CI },
    { command: 'npx serve dist-prazdny -l 4322 --no-clipboard', port: 4322, reuseExistingServer: !process.env.CI },
  ],
});
```

`tests/e2e/pomocne.ts`:
```ts
import { expect, type Page } from '@playwright/test';

export const VELIKOSTI = [
  { width: 1256, height: 528 },
  { width: 1342, height: 565 },
  { width: 1342, height: 676 },
  { width: 1896, height: 868 },
  { width: 390, height: 700 },
];

export async function overBezPosouvani(page: Page) {
  const { svisle, vyska } = await page.evaluate(() => ({
    svisle: document.scrollingElement!.scrollHeight,
    vyska: window.innerHeight,
  }));
  expect(svisle, 'stránka se nesmí posouvat dolů').toBeLessThanOrEqual(vyska);
}
```

- [ ] **Step 2: Napsat failující e2e test**

`tests/e2e/zaklad.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test('hlavička, jazyk a žádné cizí požadavky', async ({ page }) => {
  const cizi: string[] = [];
  page.on('request', r => { if (!r.url().startsWith('http://localhost')) cizi.push(r.url()); });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await expect(page.getByRole('link', { name: 'Nenechme vyhnít' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Metodika' })).toHaveAttribute('href', '/metodika/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://nenechmevyhnit.cz/obrazky/nahled.png');
  expect(cizi).toEqual([]);
  await overBezPosouvani(page);
});
```

Run: `npm run e2e -- tests/e2e/zaklad.spec.ts` → Expected: FAIL.

- [ ] **Step 3: Implementovat načítání a komponenty**

`src/lib/kauzy.ts`:
```ts
import { overAdresar, type KauzaZaznam } from './validace';

let mezipamet: ReturnType<typeof overAdresar> | undefined;

function nacti() {
  if (!mezipamet) {
    mezipamet = overAdresar(process.env.NV_OBSAH ?? 'obsah');
    if (mezipamet.chyby.length) {
      throw new Error('Chybný obsah:\n' + mezipamet.chyby.map(c => `  ${c.soubor}: ${c.zprava}`).join('\n'));
    }
  }
  return mezipamet;
}

export const nactiKauzy = (): KauzaZaznam[] => nacti().zaznamy;
export const nactiStitky = (): Map<string, string> => nacti().stitky;
```

`src/layouts/Zaklad.astro`:
```astro
---
import '../styles/fonty.css';
import '../styles/upravy.css';
import Hlavicka from '../components/Hlavicka.astro';

interface Props {
  titulek: string;
  popis: string;
  cesta: string;
  styly: 'hlavni' | 'stranky';
  aktivni: 'kauzy' | 'metodika' | 'o-projektu';
  otevrena?: string;
}
const { titulek, popis, cesta, styly, aktivni, otevrena } = Astro.props;
const url = new URL(cesta, Astro.site).toString();
const nahled = new URL('/obrazky/nahled.png', Astro.site).toString();
---
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{titulek}</title>
  <meta name="description" content={popis}>
  <link rel="canonical" href={url}>
  <meta property="og:type" content="website">
  <meta property="og:locale" content="cs_CZ">
  <meta property="og:site_name" content="Nenechme vyhnít">
  <meta property="og:title" content={titulek}>
  <meta property="og:description" content={popis}>
  <meta property="og:url" content={url}>
  <meta property="og:image" content={nahled}>
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
</head>
<body data-otevrena={otevrena}>
  <div class="wrap" id="obsah">
    <Hlavicka aktivni={aktivni} />
    <slot />
  </div>
  <slot name="mimo" />
</body>
</html>
```

Styly stránky se importují v komponentě stránky (`import '../styles/hlavni.css'` v `HlavniStranka.astro`, `import '../styles/stranky.css'` v `metodika.astro`, `o-projektu.astro` a `404.astro`). Astro je zabalí a zahashuje. Vlastnost `styly` slouží jen k tomu, aby rozvržení vědělo, o jaký typ stránky jde.

`src/components/Hlavicka.astro`:
```astro
---
interface Props { aktivni: 'kauzy' | 'metodika' | 'o-projektu' }
const { aktivni } = Astro.props;
const polozky = [
  { id: 'kauzy', nazev: 'Kauzy', href: '/' },
  { id: 'metodika', nazev: 'Metodika', href: '/metodika/' },
  { id: 'o-projektu', nazev: 'O projektu', href: '/o-projektu/' },
] as const;
---
<header class="top">
  <a class="brand" href="/">Nenechme vyhnít</a>
  <nav aria-label="Hlavní">
    {polozky.map(p => <a href={p.href} aria-current={p.id === aktivni ? 'page' : undefined}>{p.nazev}</a>)}
  </nav>
</header>
```

`src/components/PatickaRadek.astro`:
```astro
---
interface Props { legenda?: boolean }
const { legenda = false } = Astro.props;
const REPO = 'https://github.com/nenechmevyhnit/nenechmevyhnit.cz';
---
<div class="legenda">
  {legenda && <><span><i></i>uzavřeno</span><span><i class="ok"></i>dosud neuzavřeno</span><span><i class="ud"></i>událost v kauze</span></>}
  <span class="legenda-odkazy">
    <a href="https://commons.wikimedia.org/wiki/File:Andrej_Babi%C5%A1_2025_(cropped).jpg" title="Andrej Babiš, únor 2025. Vox España, Wikimedia Commons, CC0">Foto: Vox España (CC0)</a>
    <span>Nezávislý archiv</span>
    <a href={`${REPO}/issues/new?template=oprava.yml`}>Nahlásit chybu</a>
    <a href={`${REPO}/commits/main/obsah`}>Historie změn</a>
    <a href="mailto:nenechmevyhnit@gmail.com">nenechmevyhnit@gmail.com</a>
  </span>
</div>
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="8" height="8" x="4" y="0" fill="#282661"/><rect width="8" height="8" x="4" y="8" fill="#DB1F2D"/></svg>
```

Dočasná `src/pages/index.astro`:
```astro
---
import Zaklad from '../layouts/Zaklad.astro';
import PatickaRadek from '../components/PatickaRadek.astro';
import '../styles/hlavni.css';
---
<Zaklad titulek="Nenechme vyhnít — kauzy Andreje Babiše" popis="Archiv kauz Andreje Babiše přehledně, s daty a zdroji." cesta="/" styly="hlavni" aktivni="kauzy">
  <PatickaRadek legenda />
</Zaklad>
```

- [ ] **Step 4: Spustit e2e test**

Run: `npm run e2e -- tests/e2e/zaklad.spec.ts` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layouts src/components src/lib/kauzy.ts src/pages/index.astro public/favicon.svg playwright.config.ts tests/e2e
git commit -m "Základní rozvržení, hlavička a řádek patičky"
```

---

### Task 8: Hlavní stránka: úvod, osa a výběr kauzy

**Files:**
- Create: `src/components/Uvod.astro`, `src/components/Osa.astro`, `src/components/Portret.astro`, `src/components/HlavniStranka.astro`, `src/scripts/osa.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/osa.spec.ts`

**Interfaces:**
- Consumes: `nactiKauzy`, `nactiStitky` (Task 7), `naProcenta`, `rokCislo`, `rozsahText`, `delkaText`, `znackyOsy`, `ROK_OD`, `rokDo` (Task 5), `popisekStavu` (Task 2), `sklonuj`
- Produces:
  - `<HlavniStranka otevrena?: KauzaZaznam />`: celá hlavní stránka. Detail se doplní v Task 10.
  - DOM řádku: `.radek[data-slug][data-od][data-do][data-otevrena]`, kde `data-od`/`data-do` jsou procenta pozice (0–100) a `a.radek-btn[href="/kauzy/<slug>/"]`
  - `src/scripts/osa.ts`: `vyberKauzu(slug: string | null): void`

- [ ] **Step 1: Napsat failující e2e test**

`tests/e2e/osa.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('osa vykreslí kauzy seřazené podle začátku', async ({ page }) => {
  await page.goto('/');
  const radky = page.locator('.radek');
  await expect(radky).toHaveCount(6);
  await expect(radky.first().locator('strong')).toHaveText('Testovací kauza Beta');
  await expect(radky.first().locator('.popisek')).toContainText('1982–2018');
  await expect(radky.first().locator('.popisek')).toContainText('36 let');
  await expect(page.locator('.radek[data-slug="alfa-dotace"] .popisek')).toContainText('2007 – dosud');
  await expect(page.locator('.radek[data-slug="alfa-dotace"] .pruh')).toHaveClass(/otevrena/);
  await expect(page.locator('.radek[data-slug="alfa-dotace"] .pruh i')).toHaveCount(4);
});

test('úvod U2 a portrét', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Za půl roku si to nebudete pamatovat.');
  await expect(page.locator('.portret img')).toHaveAttribute('src', '/obrazky/portret.webp');
  await overBezPosouvani(page);
});

test('řádek je odkaz na stránku kauzy (funguje i bez JS)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.radek[data-slug="alfa-dotace"] a.radek-btn')).toHaveAttribute('href', '/kauzy/alfa-dotace/');
});

test('prázdný archiv ukáže hlášku a stránka se neposouvá', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', e => chyby.push(e.message));
  await page.goto('http://localhost:4322/');
  await expect(page.locator('.archiv-prazdny')).toContainText('Archiv se připravuje');
  await expect(page.locator('.radek')).toHaveCount(0);
  expect(chyby).toEqual([]);
  await overBezPosouvani(page);
});
```

Run: `npm run e2e -- tests/e2e/osa.spec.ts` → Expected: FAIL.

- [ ] **Step 2: Implementovat komponenty**

`src/components/Uvod.astro`:
```astro
<section class="hero u2">
  <p class="u2-nad">Archiv kauz Andreje Babiše</p>
  <h1>Za půl roku si to nebudete pamatovat.</h1>
  <p class="u2-pod">Proto je to tady zapsané, se zdrojem u každého tvrzení a se stanoviskem dotčené strany.</p>
</section>
```

Prototyp U2 měl podtitul jako `<span>` uvnitř `<h1>`. Kvůli čitelnému nadpisu pro čtečky obrazovky je tady samostatný odstavec. Do `src/styles/upravy.css` proto doplňte:
```css
.hero.u2 .u2-pod { font-family: var(--f-text); font-weight: 400; color: var(--text2); font-size: clamp(15px, 1.3vw, 18px); margin: 8px 0 0; }
```

`src/components/Portret.astro`:
```astro
<div class="portret" aria-hidden="true"><img src="/obrazky/portret.webp" alt="" width="960" height="1280" decoding="async"></div>
```

`src/components/Osa.astro`:
```astro
---
import type { KauzaZaznam } from '../lib/validace';
import { ROK_OD, rokDo, naProcenta, rokCislo, rozsahText, delkaText, znackyOsy } from '../lib/casova-osa';
import { popisekStavu } from '../lib/stavy';
import { sklonuj } from '../lib/cestina';

interface Props { zaznamy: KauzaZaznam[] }
const { zaznamy } = Astro.props;
const DO = rokDo();
const pct = (r: number) => naProcenta(r, ROK_OD, DO);
---
<div class="graf" id="graf">
  <div class="graf-vnitrek">
    <div class="osa-roku" aria-hidden="true">
      <div class="nazev-sloupce">Kauza</div>
      <div class="stitky">{znackyOsy(ROK_OD, DO).map(z => <span class={z.hlavni ? '' : 'malo'} style={`left:${pct(z.rok)}%`}>{z.rok}</span>)}</div>
    </div>
    <div class="pasmo"></div><span class="pilulka od"></span><span class="pilulka do"></span>
    <div class="radky" role="list">
      {zaznamy.length === 0 && <div class="archiv-prazdny">Archiv se připravuje. První ověřené kauzy přibudou brzy.</div>}
      {zaznamy.map(({ slug, kauza: k }, i) => {
        const l = pct(k.od), r = pct(k.do ?? DO), w = Math.max(r - l, 0.8);
        const konec = k.do ?? DO;
        return (
          <div class="radek" role="listitem" data-slug={slug} data-od={l.toFixed(3)} data-do={r.toFixed(3)} data-od-rok={k.od} data-do-rok={k.do ?? 'dosud'} data-otevrena={k.do === null ? 'ano' : 'ne'} style={`--i:${i};view-transition-name:r-${slug}`}>
            <a class="radek-btn" href={`/kauzy/${slug}/`} aria-haspopup="dialog" aria-label={`${k.nazev}, ${rozsahText(k.od, k.do)}. Otevřít detail kauzy.`}>
              <span class="nazev"><strong title={k.nazev}>{k.nazev}</strong><small>{popisekStavu(k.stav)} · {sklonuj(k.zdroje.length, ['zdroj', 'zdroje', 'zdrojů'])}</small></span>
              <span class="stopa">
                <span class="mrizka-roku" style="inset:0"></span>
                <span class={`pruh${k.do === null ? ' otevrena' : ''}${l > 45 ? ' konec' : ''}`} style={`left:${l}%;width:${w}%`}>
                  <span class="popisek">{rozsahText(k.od, k.do)} <em>· {delkaText(k.od, k.do)}</em></span>
                  {k.udalosti.map(u => <i style={`left:${Math.min(98, Math.max(0, ((rokCislo(u.datum) - k.od) / ((konec - k.od) || 1)) * 100))}%`}></i>)}
                </span>
              </span>
              <span class="otevrit" aria-hidden="true">Detail&nbsp;<span class="sipka-d">→</span></span>
            </a>
          </div>
        );
      })}
      <div class="prazdno" hidden>Žádná kauza neodpovídá filtru. <button type="button" data-zrusit>Zrušit filtry</button></div>
    </div>
  </div>
</div>
```

`src/components/HlavniStranka.astro`:
```astro
---
import Zaklad from '../layouts/Zaklad.astro';
import Uvod from './Uvod.astro';
import Osa from './Osa.astro';
import Portret from './Portret.astro';
import PatickaRadek from './PatickaRadek.astro';
import { nactiKauzy } from '../lib/kauzy';
import type { KauzaZaznam } from '../lib/validace';
import '../styles/hlavni.css';

interface Props { otevrena?: KauzaZaznam }
const { otevrena } = Astro.props;
const zaznamy = nactiKauzy();
const titulek = otevrena ? `${otevrena.kauza.nazev} — Nenechme vyhnít` : 'Nenechme vyhnít — kauzy Andreje Babiše';
const popis = otevrena ? otevrena.kauza.shrnuti : 'Archiv kauz Andreje Babiše přehledně, s daty a zdroji. Každé tvrzení má zdroj, každá kauza stanovisko dotčené strany.';
---
<Zaklad titulek={titulek} popis={popis} cesta={otevrena ? `/kauzy/${otevrena.slug}/` : '/'} styly="hlavni" aktivni="kauzy" otevrena={otevrena?.slug}>
  <Uvod />
  <slot name="filtry" />
  <Osa zaznamy={zaznamy} />
  <PatickaRadek legenda />
  <Fragment slot="mimo">
    <Portret />
    <slot name="detail" />
  </Fragment>
</Zaklad>
<script>
  import { inicializujOsu } from '../scripts/osa';
  inicializujOsu();
</script>
```

`src/scripts/osa.ts`:
```ts
const graf = () => document.getElementById('graf') as HTMLElement | null;

/** Zvýrazní kauzu na ose: pásmo přes celý graf a popisky od/do. null = zrušit výběr. */
export function vyberKauzu(slug: string | null): void {
  const g = graf();
  if (!g) return;
  g.querySelectorAll<HTMLElement>('.radek').forEach(r => r.classList.toggle('vybrany', r.dataset.slug === slug));
  const radek = slug ? g.querySelector<HTMLElement>(`.radek[data-slug="${CSS.escape(slug)}"]`) : null;
  if (!radek) { g.removeAttribute('data-vybrano'); return; }
  const prvni = !g.dataset.vybrano;
  g.dataset.vybrano = slug!;
  const od = Number(radek.dataset.od) / 100, doo = Number(radek.dataset.do) / 100;
  const otevrena = radek.dataset.otevrena === 'ano';
  const pasmo = g.querySelector<HTMLElement>('.pasmo')!;
  pasmo.style.setProperty('--od', String(od));
  pasmo.style.setProperty('--delka', String(Math.max(doo - od, 0.004)));
  pasmo.classList.toggle('otevrena', otevrena);
  const p1 = g.querySelector<HTMLElement>('.pilulka.od')!, p2 = g.querySelector<HTMLElement>('.pilulka.do')!;
  p1.style.setProperty('--x', String(od)); p1.textContent = radek.dataset.odRok ?? '';
  p2.style.setProperty('--x', String(doo)); p2.textContent = radek.dataset.doRok ?? '';
  p2.classList.toggle('otevrena', otevrena);
  p2.style.display = radek.dataset.odRok === radek.dataset.doRok ? 'none' : '';
  if (prvni) [pasmo, p1, p2].forEach(el => { el.classList.remove('animuj'); void el.offsetWidth; el.classList.add('animuj'); });
}

export function inicializujOsu(): void {
  const sPohybem = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => document.body.classList.add('nacteno'), sPohybem ? 2200 : 0);
}
```

`src/pages/index.astro`:
```astro
---
import HlavniStranka from '../components/HlavniStranka.astro';
---
<HlavniStranka />
```

- [ ] **Step 3: Spustit e2e testy**

Run: `npm run e2e -- tests/e2e/osa.spec.ts tests/e2e/zaklad.spec.ts` → Expected: PASS.

- [ ] **Step 4: Vizuální kontrola proti prototypu**

Run: `npm run dev`, otevřít `http://localhost:4321/` vedle `design/03-detail/portret-p4.html`. Expected: stejné rozvržení, barvy, písmo, portrét vpravo a osa celá vidět. Rozdíly opravit v `upravy.css`.

- [ ] **Step 5: Commit**

```bash
git add src/components src/scripts/osa.ts src/pages/index.astro src/styles/upravy.css tests/e2e/osa.spec.ts
git commit -m "Hlavní stránka: úvod, časová osa, portrét a prázdný archiv"
```

---

### Task 9: Filtry

**Files:**
- Create: `src/components/Filtry.astro`, `src/scripts/filtry.ts`
- Modify: `src/components/HlavniStranka.astro`
- Test: `tests/e2e/filtry.spec.ts`

**Interfaces:**
- Consumes: `vytvorPolozku`, `odpovida`, `jeAktivni`, `type Filtr`, `type PolozkaHledani` (Task 5), `nactiKauzy`, `nactiStitky` (Task 7)
- Produces: `<Filtry zaznamy stitky />` vloží `<script type="application/json" id="nv-hledani">` s `PolozkaHledani[]`. `src/scripts/filtry.ts`: `inicializujFiltry(): void`. Na `.radek` nastavuje `hidden`, aktualizuje `#pocet` a `.prazdno`.

- [ ] **Step 1: Napsat failující e2e test**

`tests/e2e/filtry.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const viditelne = (page) => page.locator('.radek:not([hidden])');

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('hledání bez diakritiky i v událostech', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('zprava uradu olaf');
  await expect(viditelne(page)).toHaveCount(1);
  await expect(viditelne(page).locator('strong')).toHaveText('Testovací kauza Alfa');
  await expect(page.locator('#pocet')).toHaveText('Zobrazeno 1 z 6 kauz');
});

test('štítky jako NEBO a zrušení filtrů', async ({ page }) => {
  await page.locator('.f-cipy button[data-stitek="offshore"]').click();
  await page.locator('.f-cipy button[data-stitek="dane"]').click();
  await expect(viditelne(page)).toHaveCount(2);
  const zrusit = page.locator('.f-zrusit');
  await expect(zrusit).toBeVisible();
  await zrusit.click();
  await expect(viditelne(page)).toHaveCount(6);
  await expect(page.locator('.f-cipy button[aria-pressed="true"]')).toHaveCount(0);
});

test('jen neuzavřené', async ({ page }) => {
  await page.getByLabel('jen neuzavřené').check();
  await expect(viditelne(page)).toHaveCount(3);
});

test('prázdný výsledek a tlačítko v něm', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill('nic takového neexistuje');
  await expect(page.locator('.prazdno')).toBeVisible();
  await page.locator('.prazdno [data-zrusit]').click();
  await expect(viditelne(page)).toHaveCount(6);
  await expect(page.getByRole('searchbox', { name: 'Hledat v kauzách' })).toHaveValue('');
});

test('zvláštní znaky v hledání nerozbijí stránku', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', e => chyby.push(e.message));
  for (const t of ['(', '+', '*', '\\', '"', '[a-z]']) {
    await page.getByRole('searchbox', { name: 'Hledat v kauzách' }).fill(t);
  }
  expect(chyby).toEqual([]);
  await overBezPosouvani(page);
});

test('místo pro Zrušit filtry je rezervované (nic se neposune)', async ({ page }) => {
  const pred = await page.locator('.f-hledat').boundingBox();
  await page.locator('.f-cipy button[data-stitek="dotace"]').click();
  const po = await page.locator('.f-hledat').boundingBox();
  expect(po).toEqual(pred);
});
```

Run: `npm run e2e -- tests/e2e/filtry.spec.ts` → Expected: FAIL.

- [ ] **Step 2: Implementovat**

`src/components/Filtry.astro`:
```astro
---
import type { KauzaZaznam } from '../lib/validace';
import { vytvorPolozku } from '../lib/hledani';

interface Props { zaznamy: KauzaZaznam[]; stitky: Map<string, string> }
const { zaznamy, stitky } = Astro.props;
const pouzite = [...new Set(zaznamy.flatMap(z => z.kauza.stitky))];
const cipy = pouzite.map(id => ({ id, nazev: stitky.get(id) ?? id })).sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs'));
const data = JSON.stringify(zaznamy.map(vytvorPolozku));
---
{zaznamy.length > 0 && (
  <div class="filtry f4">
    <label class="f-hledat"><input type="search" placeholder="Hledat v kauzách…" aria-label="Hledat v kauzách"></label>
    <div class="f-cipy-obal">
      <button class="sipka vlevo" type="button" aria-label="Předchozí témata" hidden>‹</button>
      <div class="f-cipy" role="group" aria-label="Témata">
        {cipy.map(c => <button type="button" data-stitek={c.id} aria-pressed="false">{c.nazev}</button>)}
      </div>
      <button class="sipka vpravo" type="button" aria-label="Další témata" hidden>›</button>
    </div>
    <label class="f-prepinac"><input type="checkbox" data-jen-otevrene> jen neuzavřené</label>
    <span class="vpravo"><span id="pocet" aria-live="polite"></span><button class="f-zrusit" type="button" hidden>Zrušit filtry</button></span>
  </div>
)}
<script type="application/json" id="nv-hledani" set:html={data}></script>
<script>
  import { inicializujFiltry } from '../scripts/filtry';
  inicializujFiltry();
</script>
```

`src/scripts/filtry.ts`:
```ts
import { odpovida, jeAktivni, type Filtr, type PolozkaHledani } from '../lib/hledani';

export function inicializujFiltry(): void {
  const panel = document.querySelector<HTMLElement>('.filtry');
  const data = document.getElementById('nv-hledani');
  if (!panel || !data) return;
  const polozky: PolozkaHledani[] = JSON.parse(data.textContent || '[]');
  const hledat = panel.querySelector<HTMLInputElement>('.f-hledat input')!;
  const cipy = panel.querySelector<HTMLElement>('.f-cipy')!;
  const jen = panel.querySelector<HTMLInputElement>('[data-jen-otevrene]')!;
  const pocet = document.getElementById('pocet')!;
  const zrusit = panel.querySelector<HTMLButtonElement>('.f-zrusit')!;
  const prazdno = document.querySelector<HTMLElement>('#graf .prazdno')!;
  const filtr: Filtr = { text: '', stitky: [], jenOtevrene: false };

  const proved = () => {
    let n = 0;
    for (const p of polozky) {
      const radek = document.querySelector<HTMLElement>(`.radek[data-slug="${CSS.escape(p.slug)}"]`);
      if (!radek) continue;
      const ok = odpovida(p, filtr);
      radek.hidden = !ok;
      if (ok) n++;
    }
    prazdno.hidden = n > 0;
    pocet.textContent = n === polozky.length ? `${polozky.length} kauz` : `Zobrazeno ${n} z ${polozky.length} kauz`;
    zrusit.hidden = !jeAktivni(filtr);
  };

  const aplikuj = () => {
    const sPohybem = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || !sPohybem || !document.body.classList.contains('nacteno')) return proved();
    let hotovo = false;
    const jednou = () => { if (!hotovo) { hotovo = true; proved(); } };
    const t = document.startViewTransition(jednou);
    [t.ready, t.finished, t.updateCallbackDone].forEach(p => p.catch(() => {}));
    setTimeout(() => { if (!hotovo) { t.skipTransition(); jednou(); } }, 200);
  };

  const reset = () => {
    filtr.text = ''; filtr.stitky = []; filtr.jenOtevrene = false;
    hledat.value = ''; jen.checked = false;
    cipy.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
    aplikuj();
  };

  hledat.addEventListener('input', () => { filtr.text = hledat.value; aplikuj(); });
  jen.addEventListener('change', () => { filtr.jenOtevrene = jen.checked; aplikuj(); });
  cipy.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    filtr.stitky = [...cipy.querySelectorAll<HTMLElement>('[aria-pressed="true"]')].map(x => x.dataset.stitek!);
    aplikuj();
  });
  zrusit.addEventListener('click', reset);
  prazdno.querySelector('[data-zrusit]')!.addEventListener('click', reset);

  // šipky u čipů (bez viditelného posuvníku)
  const obal = cipy.parentElement!, vl = obal.querySelector<HTMLButtonElement>('.vlevo')!, vp = obal.querySelector<HTMLButtonElement>('.vpravo')!;
  const sipky = () => {
    const max = cipy.scrollWidth - cipy.clientWidth, x = cipy.scrollLeft;
    const vlevo = max > 2 && x > 2, vpravo = max > 2 && x < max - 2;
    vl.hidden = !vlevo; vp.hidden = !vpravo;
    obal.classList.toggle('mizi-vlevo', vlevo); obal.classList.toggle('mizi-vpravo', vpravo);
  };
  vl.addEventListener('click', () => cipy.scrollBy({ left: -220, behavior: 'smooth' }));
  vp.addEventListener('click', () => cipy.scrollBy({ left: 220, behavior: 'smooth' }));
  cipy.addEventListener('scroll', sipky);
  addEventListener('resize', sipky);
  document.fonts.ready.then(sipky);
  proved();
}
```

V `src/components/HlavniStranka.astro` doplnit import a vložení filtrů místo `<slot name="filtry" />`:
```astro
---
import Filtry from './Filtry.astro';
import { nactiStitky } from '../lib/kauzy';
const stitky = nactiStitky();
---
<Filtry zaznamy={zaznamy} stitky={stitky} />
```

- [ ] **Step 3: Spustit e2e testy**

Run: `npm run e2e -- tests/e2e/filtry.spec.ts` → Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Filtry.astro src/components/HlavniStranka.astro src/scripts/filtry.ts tests/e2e/filtry.spec.ts
git commit -m "Filtry: hledání bez diakritiky, štítky, jen neuzavřené"
```

---

### Task 10: Detail kauzy (M2) a stránky kauz

**Files:**
- Create: `src/components/Detail.astro`, `src/pages/kauzy/[slug].astro`, `src/scripts/detail.ts`
- Modify: `src/components/HlavniStranka.astro`
- Test: `tests/e2e/detail.spec.ts`

**Interfaces:**
- Consumes: `KauzaZaznam`, `rozdelOdstavce`, `odstavecNaHtml`, `datumText`, `rokCislo`, `rozsahText`, `delkaText`, `popisekStavu`
- Produces:
  - `<Detail zaznam? />` vykreslí `<dialog class="detail m2" id="detail" data-slug>`. Bez záznamu vykreslí prázdný dialog (na `/`).
  - `src/scripts/detail.ts`: `inicializujDetail(dialog: HTMLDialogElement): void`, který obsluhuje záložky, listování událostí (tlačítka a ←/→), skok na zdroj a kopírování odkazu

- [ ] **Step 1: Napsat failující e2e test (bez navigace, ta je v Task 11)**

`tests/e2e/detail.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('přímá adresa otevře detail s vlastním náhledem', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const dlg = page.locator('dialog#detail');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading', { level: 2 })).toHaveText('Testovací kauza Alfa');
  await expect(page).toHaveTitle('Testovací kauza Alfa — Nenechme vyhnít');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://nenechmevyhnit.cz/kauzy/alfa-dotace/');
  await expect(page.locator('#graf')).toHaveAttribute('data-vybrano', 'alfa-dotace');
  await overBezPosouvani(page);
});

test('chronologie ukazuje poslední událost a listuje se', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const vid = page.locator('.udalosti-seznam > li:not([hidden])');
  await expect(vid).toHaveCount(1);
  await expect(vid.locator('h3')).toHaveText('Nepravomocné zproštění');
  await page.getByRole('button', { name: /předchozí/ }).click();
  await expect(vid.locator('h3')).toHaveText('Zpráva úřadu OLAF');
  await page.keyboard.press('ArrowRight');
  await expect(vid.locator('h3')).toHaveText('Nepravomocné zproštění');
  await page.locator('.mini-osa .bod').first().click();
  await expect(vid.locator('h3')).toHaveText('Vyčlenění firmy');
});

test('záložky a skok na zdroj', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await expect(page.locator('.m2-panel[data-p="souv"]')).toBeVisible();
  await page.locator('.m2-panel[data-p="souv"] a.pozn[data-zdroj="3"]').click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
  await expect(page.locator('#zdroj-3')).toHaveClass(/blik/);
  await expect(page).toHaveURL(/\/kauzy\/alfa-dotace\/$/);
});

test('stav a stanovisko', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('tab', { name: 'Stav a stanovisko' }).click();
  await expect(page.locator('.stav-box .stav')).toHaveText('Soudní řízení');
  await expect(page.locator('.stav-box')).toContainText('Naposledy ověřeno 12. 11. 2026');
  await expect(page.locator('.stanovisko')).toContainText('Firma Alfa pochybení odmítá.');
});

test('neexistující kauza vrátí stránku 404', async ({ page }) => {
  const odpoved = await page.goto('/kauzy/neexistuje/');
  expect(odpoved?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tahle stránka neexistuje');
});
```

Run: `npm run e2e -- tests/e2e/detail.spec.ts` → Expected: FAIL.

- [ ] **Step 2: Implementovat komponentu Detail**

`src/components/Detail.astro`:
```astro
---
import type { KauzaZaznam } from '../lib/validace';
import { rozdelOdstavce, odstavecNaHtml } from '../lib/souvislosti';
import { datumText, rokCislo, rozsahText, delkaText, rokDo } from '../lib/casova-osa';
import { popisekStavu } from '../lib/stavy';

interface Props { zaznam?: KauzaZaznam }
const { zaznam } = Astro.props;
const REPO = 'https://github.com/nenechmevyhnit/nenechmevyhnit.cz';
const k = zaznam?.kauza;
const konec = k ? (k.do ?? rokDo()) : 0;
const poloha = (d: string) => k ? Math.min(100, Math.max(0, ((rokCislo(d) - k.od) / ((konec - k.od) || 1)) * 100)) : 0;
const posledni = k ? k.udalosti.length - 1 : 0;
let posledniRok = -99;
const rokyOsy = k ? k.udalosti.flatMap(u => { const p = poloha(u.datum); if (p - posledniRok > 9) { posledniRok = p; return [{ p, rok: u.datum.slice(0, 4) }]; } return []; }) : [];
const chipy = (cisla: number[]) => cisla.map(c => `<a href="#zdroj-${c}" class="chip" data-zdroj="${c}" aria-label="Zdroj ${c}">${c}</a>`).join('');
---
<dialog class={`detail m2${k?.do === null ? ' otevrena' : ''}`} id="detail" aria-labelledby="detail-nadpis" data-slug={zaznam?.slug}>
  {k && zaznam && (
    <>
      <button class="zavrit" type="button" aria-label="Zavřít detail">×</button>
      <header class="m2-hlava">
        <div class="roky">{rozsahText(k.od, k.do)} · {delkaText(k.od, k.do)} · {popisekStavu(k.stav)}</div>
        <h2 id="detail-nadpis">{k.nazev}</h2>
        <p class="perex">{k.shrnuti}</p>
      </header>
      <div class="mini-osa" aria-label="Události kauzy v čase">
        <div class="linie"></div>
        {k.udalosti.map((u, i) => <button class="bod" type="button" data-i={i} style={`--i:${i};left:${poloha(u.datum)}%`} aria-label={`${datumText(u.datum)}: ${u.nazev}`}></button>)}
        {rokyOsy.map(r => <span class="rok" style={`left:${r.p}%`}>{r.rok}</span>)}
        <span class="vybrany-popis"></span>
      </div>
      <div class="zalozky" role="tablist">
        <button role="tab" type="button" data-p="chrono" aria-selected="true">Chronologie</button>
        <button role="tab" type="button" data-p="souv" aria-selected="false">Souvislosti</button>
        <button role="tab" type="button" data-p="stav" aria-selected="false">Stav a stanovisko</button>
        <button role="tab" type="button" data-p="zdroje" aria-selected="false">Zdroje ({k.zdroje.length})</button>
      </div>
      <div class="m2-panel" data-p="chrono" role="tabpanel">
        <ol class="udalosti-seznam">
          {k.udalosti.map((u, i) => (
            <li data-i={i} data-datum={u.datum}>
              <div class="udalost-velka">
                <time>{datumText(u.datum)}<small>událost {i + 1} z {k.udalosti.length}</small></time>
                <div><h3>{u.nazev}</h3><p>{u.popis}</p><div>Zdroje:<span class="chipy" set:html={chipy(u.zdroje)}></span></div></div>
              </div>
            </li>
          ))}
        </ol>
        <div class="listovani">
          <button type="button" data-krok="-1"><small>← předchozí</small><span></span></button>
          <button type="button" data-krok="1" style="text-align:right"><small>další →</small><span></span></button>
        </div>
      </div>
      <div class="m2-panel" data-p="souv" role="tabpanel" hidden>
        {rozdelOdstavce(zaznam.telo).map(o => <p set:html={odstavecNaHtml(o)}></p>)}
      </div>
      <div class="m2-panel" data-p="stav" role="tabpanel" hidden>
        <div class={`stav-box${k.do === null ? ' otevrena' : ''}`}>
          <div class="stav">{popisekStavu(k.stav)}</div>
          {k.stavPoznamka && <p>{k.stavPoznamka}</p>}
          {k.do === null && <p>Dokud soud pravomocně nerozhodne, platí presumpce neviny.</p>}
          <div class="overeno">Naposledy ověřeno {datumText(k.overeno)}</div>
        </div>
        <div class="stanovisko"><h4>Stanovisko dotčené strany</h4><p>{k.stanovisko.text}<span class="chipy" set:html={chipy(k.stanovisko.zdroje)}></span></p></div>
        {k.opravy.length > 0 && <div class="opravy"><h4>Opravy</h4><ul>{k.opravy.map(o => <li>{datumText(o.datum)}: {o.popis}</li>)}</ul></div>}
      </div>
      <div class="m2-panel" data-p="zdroje" role="tabpanel" hidden>
        <p class="posun-napoveda">Další zdroje najdete posunem do strany →</p>
        <ol class="zdroje">
          {k.zdroje.map(z => (
            <li id={`zdroj-${z.id}`}><div>
              <span class="vyd">{z.vydavatel}</span><span class={`druh ${z.druh}`}>{z.druh === 'primarni' ? 'primární' : 'média'}</span><br>
              {z.titulek}
              <div class="odkazy">{datumText(z.datum)} · <a href={z.url} rel="noopener noreferrer" target="_blank">originál ↗</a>{z.archiv && <> · <a href={z.archiv} rel="noopener noreferrer" target="_blank">archivní kopie ↗</a></>}</div>
            </div></li>
          ))}
        </ol>
        <div class="paticka-detailu">
          <a href={`${REPO}/commits/main/obsah/kauzy/${zaznam.slug}.md`}>Historie změn této kauzy</a>
          <a href={`${REPO}/issues/new?template=oprava.yml&title=${encodeURIComponent('Oprava: ' + k.nazev)}`}>Nahlásit chybu</a>
          <a href="#" data-sdilet>Zkopírovat odkaz na kauzu</a>
        </div>
      </div>
    </>
  )}
</dialog>
```

Do `src/styles/upravy.css` doplnit styl čipů a oprav:
```css
.chipy a.chip { font: 600 11px var(--f-mono); color: var(--modra); text-decoration: none; border: 1px solid var(--linka); padding: 0 5px; border-radius: 3px; margin-left: 4px; }
.opravy h4 { margin: 14px 0 4px; font: 600 12px var(--f-mono); text-transform: uppercase; letter-spacing: .08em; color: var(--meta); }
```

- [ ] **Step 3: Implementovat skript detailu**

`src/scripts/detail.ts`:
```ts
export function inicializujDetail(dlg: HTMLDialogElement): void {
  const polozky = [...dlg.querySelectorAll<HTMLElement>('.udalosti-seznam > li')];
  if (!polozky.length) return;
  const panelChrono = dlg.querySelector<HTMLElement>('.m2-panel[data-p="chrono"]')!;
  const body = [...dlg.querySelectorAll<HTMLElement>('.mini-osa .bod')];
  const popis = dlg.querySelector<HTMLElement>('.vybrany-popis')!;
  const [zpet, dal] = dlg.querySelectorAll<HTMLButtonElement>('.listovani [data-krok]');
  let akt = polozky.length - 1;

  const prepni = (p: string) => {
    dlg.querySelectorAll<HTMLElement>('.zalozky [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.p === p)));
    dlg.querySelectorAll<HTMLElement>('.m2-panel').forEach(x => { x.hidden = x.dataset.p !== p; });
  };

  const ukaz = (i: number, smer = true) => {
    const pred = akt;
    akt = Math.max(0, Math.min(polozky.length - 1, i));
    if (!smer || akt === pred) delete panelChrono.dataset.smer; else panelChrono.dataset.smer = akt > pred ? 'vpred' : 'zpet';
    polozky.forEach((li, j) => { li.hidden = j !== akt; });
    body.forEach((b, j) => b.setAttribute('aria-selected', String(j === akt)));
    popis.style.left = body[akt].style.left;
    popis.textContent = polozky[akt].querySelector('time')?.firstChild?.textContent ?? '';
    const nazev = (j: number) => polozky[j]?.querySelector('h3')?.textContent ?? '';
    zpet.disabled = akt === 0; dal.disabled = akt === polozky.length - 1;
    zpet.querySelector('span')!.textContent = akt > 0 ? nazev(akt - 1) : '';
    dal.querySelector('span')!.textContent = akt < polozky.length - 1 ? nazev(akt + 1) : '';
  };

  dlg.querySelector('.zalozky')!.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
    if (b) prepni(b.dataset.p!);
  });
  dlg.querySelector('.mini-osa')!.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.bod');
    if (b) { prepni('chrono'); ukaz(Number(b.dataset.i)); }
  });
  zpet.addEventListener('click', () => ukaz(akt - 1));
  dal.addEventListener('click', () => ukaz(akt + 1));
  dlg.addEventListener('keydown', e => {
    if (panelChrono.hidden) return;
    if (e.key === 'ArrowLeft') ukaz(akt - 1);
    if (e.key === 'ArrowRight') ukaz(akt + 1);
  });
  dlg.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-zdroj]');
    if (a) {
      e.preventDefault();
      prepni('zdroje');
      const cil = dlg.querySelector<HTMLElement>(`#zdroj-${a.dataset.zdroj}`);
      if (cil) { cil.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); cil.classList.add('blik'); setTimeout(() => cil.classList.remove('blik'), 1600); }
      return;
    }
    const s = (e.target as HTMLElement).closest<HTMLElement>('[data-sdilet]');
    if (s) { e.preventDefault(); navigator.clipboard?.writeText(location.href); s.textContent = 'Odkaz zkopírován ✓'; }
  });
  ukaz(akt, false);
}
```

Poznámka: třídu `blik` drží prvek 1,6 s. Test v Kroku 1 ji kontroluje hned po kliknutí.

- [ ] **Step 4: Stránky kauz, vložení detailu a stránka 404**

`src/pages/kauzy/[slug].astro`:
```astro
---
import HlavniStranka from '../../components/HlavniStranka.astro';
import Detail from '../../components/Detail.astro';
import { nactiKauzy } from '../../lib/kauzy';

export function getStaticPaths() {
  return nactiKauzy().map(z => ({ params: { slug: z.slug }, props: { zaznam: z } }));
}
const { zaznam } = Astro.props;
---
<HlavniStranka otevrena={zaznam}>
  <Detail slot="detail" zaznam={zaznam} />
</HlavniStranka>
```

V `src/pages/index.astro` vložit prázdný dialog:
```astro
---
import HlavniStranka from '../components/HlavniStranka.astro';
import Detail from '../components/Detail.astro';
---
<HlavniStranka>
  <Detail slot="detail" />
</HlavniStranka>
```

V `src/components/HlavniStranka.astro` doplnit do `<script>`:
```ts
import { inicializujDetail } from '../scripts/detail';
import { vyberKauzu } from '../scripts/osa';
const dlg = document.getElementById('detail') as HTMLDialogElement;
const otevrena = document.body.dataset.otevrena;
if (otevrena && dlg) {
  inicializujDetail(dlg);
  vyberKauzu(otevrena);
  dlg.showModal();
}
dlg?.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
dlg?.querySelector('.zavrit')?.addEventListener('click', () => dlg.close());
```

`src/pages/404.astro`:
```astro
---
import Zaklad from '../layouts/Zaklad.astro';
import '../styles/stranky.css';
---
<Zaklad titulek="Stránka neexistuje — Nenechme vyhnít" popis="Tahle stránka neexistuje." cesta="/404/" styly="stranky" aktivni="kauzy">
  <section class="met-hlava"><p class="nad">Chyba 404</p><h1>Tahle stránka neexistuje</h1><p class="lead">Možná byla kauza přejmenována. <a href="/">Zpět na časovou osu</a>.</p></section>
</Zaklad>
```

- [ ] **Step 5: Spustit e2e testy**

Run: `npm run e2e -- tests/e2e/detail.spec.ts` → Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Detail.astro src/components/HlavniStranka.astro src/pages src/scripts/detail.ts src/styles/upravy.css tests/e2e/detail.spec.ts
git commit -m "Detail kauzy: mini-osa, záložky, zdroje a stránky /kauzy/<slug>/"
```

---

### Task 11: Přechody mezi kauzami bez načítání (History API)

**Files:**
- Create: `src/scripts/navigace.ts`
- Modify: `src/components/HlavniStranka.astro` (nahradit inline inicializaci detailu z Task 10)
- Test: `tests/e2e/navigace.spec.ts`

**Interfaces:**
- Consumes: `inicializujDetail` (Task 10), `vyberKauzu` (Task 8)
- Produces: `inicializujNavigaci(): void`, `otevriDetail(slug: string, moznosti?: { pridatDoHistorie?: boolean }): Promise<void>`, `zavriDetail(moznosti?: { pridatDoHistorie?: boolean }): void`

- [ ] **Step 1: Napsat failující e2e test**

`tests/e2e/navigace.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test('klik na řádek otevře detail bez načtení stránky', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => ((window as any).__znacka = 'stejna-stranka'));
  await page.locator('.radek[data-slug="gama-offshore"] a.radek-btn').click();
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Gama');
  await expect(page).toHaveURL(/\/kauzy\/gama-offshore\/$/);
  expect(await page.evaluate(() => (window as any).__znacka)).toBe('stejna-stranka');
  await expect(page.locator('#graf')).toHaveAttribute('data-vybrano', 'gama-offshore');
});

test('zavření vrátí adresu na / a výběr zůstane', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await expect(page.locator('dialog#detail')).not.toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#graf')).toHaveAttribute('data-vybrano', 'alfa-dotace');
});

test('tlačítko Zpět zavře detail, Vpřed ho znovu otevře', async ({ page }) => {
  await page.goto('/');
  await page.locator('.radek[data-slug="beta-archiv"] a.radek-btn').click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog#detail')).not.toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Beta');
});

test('přepnutí na jinou kauzu z otevřeného detailu přes Zpět', async ({ page }) => {
  await page.goto('/');
  await page.locator('.radek[data-slug="beta-archiv"] a.radek-btn').click();
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await page.locator('.radek[data-slug="delta-dluhopisy"] a.radek-btn').click();
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Delta');
  await page.goBack(); // na /
  await page.goBack(); // na beta
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Beta');
});
```

Run: `npm run e2e -- tests/e2e/navigace.spec.ts` → Expected: FAIL.

- [ ] **Step 2: Implementovat**

`src/scripts/navigace.ts`:
```ts
import { inicializujDetail } from './detail';
import { vyberKauzu } from './osa';

const mezipamet = new Map<string, { html: string; trida: string; titulek: string }>();
const TITULEK_HLAVNI = 'Nenechme vyhnít — kauzy Andreje Babiše';
let zaviramZHistorie = false;

const dialog = () => document.getElementById('detail') as HTMLDialogElement;

async function nactiDetail(slug: string) {
  if (!mezipamet.has(slug)) {
    const odpoved = await fetch(`/kauzy/${slug}/`);
    if (!odpoved.ok) throw new Error(`Kauza ${slug} nenalezena`);
    const doc = new DOMParser().parseFromString(await odpoved.text(), 'text/html');
    const d = doc.getElementById('detail')!;
    mezipamet.set(slug, { html: d.innerHTML, trida: d.className, titulek: doc.title });
  }
  return mezipamet.get(slug)!;
}

export async function otevriDetail(slug: string, { pridatDoHistorie = true } = {}): Promise<void> {
  const dlg = dialog();
  if (dlg.dataset.slug !== slug) {
    let data;
    try { data = await nactiDetail(slug); } catch { location.href = `/kauzy/${slug}/`; return; }
    dlg.innerHTML = data.html;
    dlg.className = data.trida;
    dlg.dataset.slug = slug;
    inicializujDetail(dlg);
    document.title = data.titulek;
  } else {
    document.title = mezipamet.get(slug)?.titulek ?? document.title;
  }
  vyberKauzu(slug);
  if (pridatDoHistorie) history.pushState({ slug }, '', `/kauzy/${slug}/`);
  if (!dlg.open) dlg.showModal();
}

export function zavriDetail({ pridatDoHistorie = true } = {}): void {
  const dlg = dialog();
  zaviramZHistorie = !pridatDoHistorie;
  if (dlg.open) dlg.close();
  else if (pridatDoHistorie && location.pathname !== '/') history.pushState({}, '', '/');
}

export function inicializujNavigaci(): void {
  const dlg = dialog();
  if (!dlg) return;
  const otevrena = document.body.dataset.otevrena;
  if (otevrena) {
    mezipamet.set(otevrena, { html: dlg.innerHTML, trida: dlg.className, titulek: document.title });
    inicializujDetail(dlg);
    vyberKauzu(otevrena);
    history.replaceState({ slug: otevrena }, '');
    dlg.showModal();
  } else {
    history.replaceState({}, '');
  }

  document.querySelector('#graf')?.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.radek-btn');
    const me = e as MouseEvent;
    if (!a || me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
    e.preventDefault();
    otevriDetail(a.closest<HTMLElement>('.radek')!.dataset.slug!);
  });

  dlg.addEventListener('close', () => {
    document.title = TITULEK_HLAVNI;
    if (!zaviramZHistorie && location.pathname !== '/') history.pushState({}, '', '/');
    zaviramZHistorie = false;
  });
  dlg.addEventListener('click', e => {
    if (e.target === dlg || (e.target as HTMLElement).closest('.zavrit')) dlg.close();
  });

  addEventListener('popstate', e => {
    const slug = (e.state as { slug?: string } | null)?.slug;
    if (slug) otevriDetail(slug, { pridatDoHistorie: false });
    else zavriDetail({ pridatDoHistorie: false });
  });
}
```

V `src/components/HlavniStranka.astro` nahradit celý `<script>` blokem:
```astro
<script>
  import { inicializujOsu } from '../scripts/osa';
  import { inicializujNavigaci } from '../scripts/navigace';
  inicializujOsu();
  inicializujNavigaci();
</script>
```

- [ ] **Step 3: Spustit e2e testy (navigace i detail)**

Run: `npm run e2e -- tests/e2e/navigace.spec.ts tests/e2e/detail.spec.ts` → Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/navigace.ts src/components/HlavniStranka.astro tests/e2e/navigace.spec.ts
git commit -m "Přechody mezi kauzami bez načítání, Zpět/Vpřed a zavření na /"
```

---

### Task 12: Metodika a O projektu

**Files:**
- Create: `src/data/metodika.ts`, `src/data/o-projektu.ts`, `src/components/KartyStranky.astro`, `src/scripts/karty.ts`, `src/pages/metodika.astro`, `src/pages/o-projektu.astro`
- Test: `tests/e2e/stranky.spec.ts`

**Interfaces:**
- Produces:
  - `type SekceStranky = { id: string; nadpis: string; shrnuti: string; html: string }`
  - `metodika: { platiOd: string; sekce: SekceStranky[] }` a `oProjektu: { sekce: SekceStranky[] }`
  - `<KartyStranky nadtitulek nadpis perex sekce cta={{ nadpis, text, odkaz, popisek }} />`
  - `src/scripts/karty.ts`: `inicializujKarty(): void`

- [ ] **Step 1: Napsat failující e2e test**

`tests/e2e/stranky.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

for (const [cesta, nadpis, karet] of [['/metodika/', 'Jak archiv vedeme', 7], ['/o-projektu/', 'Kdo, proč a jak', 7]] as const) {
  test(`${cesta}: karty, modal s plným zněním, bez posouvání`, async ({ page }) => {
    await page.goto(cesta);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(nadpis);
    await expect(page.locator('.v4-karta:not(.v4-cta)')).toHaveCount(karet);
    await overBezPosouvani(page);
    await page.locator('.v4-karta button[data-sekce]').nth(1).click();
    const dlg = page.locator('dialog.v4-dlg');
    await expect(dlg).toBeVisible();
    await expect(dlg.locator('.v4-dlg-panel:not([hidden])')).toHaveCount(1);
    await dlg.locator('.v4-dlg-menu button').first().click();
    await expect(dlg.locator('.v4-dlg-menu button').first()).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Escape');
    await expect(dlg).not.toBeVisible();
  });
}

test('Metodika obsahuje slovníček stavů', async ({ page }) => {
  await page.goto('/metodika/');
  await page.locator('.v4-karta button[data-sekce="stavy"]').click();
  await expect(page.locator('.slovnicek dt')).toHaveCount(9);
});
```

Run: `npm run e2e -- tests/e2e/stranky.spec.ts` → Expected: FAIL.

- [ ] **Step 2: Data stránek**

`src/data/metodika.ts`: převést n-tice `SEKCE` z `design/03-detail/_metodika.py` (7 položek: `kriteria`, `zdroje`, `jazyk`, `strana`, `postup`, `opravy`, `stavy`) na objekty. Texty a HTML se přebírají doslova, je to schválený obsah:
```ts
export type SekceStranky = { id: string; nadpis: string; shrnuti: string; html: string };

export const metodika: { platiOd: string; sekce: SekceStranky[] } = {
  platiOd: '12. 11. 2026',
  sekce: [
    {
      id: 'kriteria',
      nadpis: 'Co do archivu patří',
      shrnuti: 'Kauza se týká Andreje Babiše osobně nebo firem, které vlastnil či ovládal, a splňuje aspoň jedno z kritérií.',
      html: `<p>Kauza se týká Andreje Babiše osobně nebo firem, které vlastnil či ovládal, a splňuje <strong>aspoň jedno</strong> z těchto kritérií:</p>
<ul><li>probíhá nebo proběhlo úřední řízení (policie, státní zastupitelství, soud, OLAF, Evropská komise, NKÚ, Ústavní soud),</li>
<li>existuje úřední zjištění, například rozsudek, audit nebo rozhodnutí úřadu,</li>
<li>věc nezávisle na sobě doložily aspoň dvě seriózní redakce.</li></ul>
<p>Kroky vlády jako celku zatím nezařazujeme. Archiv je na jejich pozdější zařazení připravený.</p>`,
    },
    // …zbylých 6 sekcí doslova z _metodika.py ve stejném tvaru
  ],
};
```

Postup převodu: pro každou n-tici `('id', 'nadpis', 'shrnutí', '''html''')` v `_metodika.py` vytvořit objekt `{ id, nadpis, shrnuti, html }`. HTML vložit do šablonového řetězce beze změny. Stejně vytvořit `src/data/o-projektu.ts` (`export const oProjektu = { sekce: [...] }`) ze 7 n-tic `SEKCE` v `design/03-detail/_oprojektu.py`. Odkazy `metodika-v4.html` přitom změnit na `/metodika/`. Nakonec ověřit: `grep -c "id:" src/data/metodika.ts` → `7`, totéž pro `o-projektu.ts`.

- [ ] **Step 3: Komponenta karet a skript**

`src/components/KartyStranky.astro`:
```astro
---
import type { SekceStranky } from '../data/metodika';

interface Props {
  nadtitulek: string; nadpis: string; perex: string; sekce: SekceStranky[];
  cta: { nadpis: string; text: string; odkaz: string; popisek: string };
  paticka: string;
}
const { nadtitulek, nadpis, perex, sekce, cta, paticka } = Astro.props;
const REPO = 'https://github.com/nenechmevyhnit/nenechmevyhnit.cz';
---
<section class="met-hlava"><p class="nad">{nadtitulek}</p><h1>{nadpis}</h1><p class="lead">{perex}</p></section>
<main class="met">
  <div class="v4-mrizka">
    {sekce.map((s, n) => (
      <article class="v4-karta"><span class="c">{String(n + 1).padStart(2, '0')}</span><h2>{s.nadpis}</h2><p>{s.shrnuti}</p><button type="button" data-sekce={s.id}>Celé znění →</button></article>
    ))}
    <article class="v4-karta v4-cta"><h2>{cta.nadpis}</h2><p>{cta.text}</p><a href={cta.odkaz}>{cta.popisek}</a></article>
  </div>
  <dialog class="detail v4-dlg" aria-labelledby={`v4-nadpis-${sekce[0].id}`}>
    <button class="zavrit" type="button" aria-label="Zavřít">×</button>
    <div class="v4-dlg-obal">
      <nav class="v4-dlg-menu" aria-label="Části stránky">{sekce.map(s => <button type="button" data-sekce={s.id}>{s.nadpis}</button>)}</nav>
      {sekce.map(s => <section class="v4-dlg-panel" data-sekce={s.id} hidden><h2 id={`v4-nadpis-${s.id}`}>{s.nadpis}</h2><Fragment set:html={s.html} /></section>)}
    </div>
  </dialog>
</main>
<div class="paticka-met"><span>{paticka} · <a href={`${REPO}/commits/main`} style="margin:0">historie změn</a></span><span><a href={`${REPO}/issues/new?template=oprava.yml`}>Nahlásit chybu</a><a href="mailto:nenechmevyhnit@gmail.com">nenechmevyhnit@gmail.com</a></span></div>
<script>
  import { inicializujKarty } from '../scripts/karty';
  inicializujKarty();
</script>
```

`src/scripts/karty.ts`:
```ts
export function inicializujKarty(): void {
  const dlg = document.querySelector<HTMLDialogElement>('.v4-dlg');
  if (!dlg) return;
  const ukaz = (id: string) => {
    dlg.querySelectorAll<HTMLElement>('.v4-dlg-panel').forEach(p => { p.hidden = p.dataset.sekce !== id; });
    dlg.querySelectorAll<HTMLElement>('.v4-dlg-menu button').forEach(b => b.setAttribute('aria-current', String(b.dataset.sekce === id)));
    dlg.setAttribute('aria-labelledby', `v4-nadpis-${id}`);
  };
  document.querySelectorAll<HTMLElement>('.v4-karta button[data-sekce]').forEach(b => b.addEventListener('click', () => { ukaz(b.dataset.sekce!); dlg.showModal(); }));
  dlg.querySelectorAll<HTMLElement>('.v4-dlg-menu button').forEach(b => b.addEventListener('click', () => ukaz(b.dataset.sekce!)));
  dlg.querySelector('.zavrit')!.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  setTimeout(() => document.body.classList.add('nacteno'), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1600);
}
```

- [ ] **Step 4: Stránky**

`src/pages/metodika.astro`:
```astro
---
import Zaklad from '../layouts/Zaklad.astro';
import KartyStranky from '../components/KartyStranky.astro';
import { metodika } from '../data/metodika';
import '../styles/stranky.css';
---
<Zaklad titulek="Metodika — Nenechme vyhnít" popis="Pravidla, podle kterých kauzy vybíráme, ověřujeme a opravujeme." cesta="/metodika/" styly="stranky" aktivni="metodika">
  <KartyStranky nadtitulek="Metodika" nadpis="Jak archiv vedeme" perex="Pravidla, podle kterých kauzy vybíráme, ověřujeme a opravujeme."
    sekce={metodika.sekce} paticka={`Pravidla platí od ${metodika.platiOd}`}
    cta={{ nadpis: 'Chcete vědět víc?', text: 'Každá změna metodiky i kauz je veřejně dohledatelná.', odkaz: 'https://github.com/nenechmevyhnit/nenechmevyhnit.cz/commits/main', popisek: 'Historie změn →' }} />
</Zaklad>
```

`src/pages/o-projektu.astro`:
```astro
---
import Zaklad from '../layouts/Zaklad.astro';
import KartyStranky from '../components/KartyStranky.astro';
import { oProjektu } from '../data/o-projektu';
import '../styles/stranky.css';
---
<Zaklad titulek="O projektu — Nenechme vyhnít" popis="Nezávislý archiv bez vazby na politickou stranu, bez reklam a bez sledování." cesta="/o-projektu/" styly="stranky" aktivni="o-projektu">
  <KartyStranky nadtitulek="O projektu" nadpis="Kdo, proč a jak" perex="Nezávislý archiv bez vazby na politickou stranu, bez reklam a bez sledování."
    sekce={oProjektu.sekce} paticka="Nezávislý archiv"
    cta={{ nadpis: 'Podle čeho kauzy vybíráme?', text: 'Kritéria, zdroje a postup ověřování popisuje metodika.', odkaz: '/metodika/', popisek: 'Metodika →' }} />
</Zaklad>
```

- [ ] **Step 5: Spustit e2e testy**

Run: `npm run e2e -- tests/e2e/stranky.spec.ts` → Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data src/components/KartyStranky.astro src/scripts/karty.ts src/pages/metodika.astro src/pages/o-projektu.astro tests/e2e/stranky.spec.ts
git commit -m "Stránky Metodika a O projektu: karty a plné znění v modalu"
```

---

### Task 13: Animace a omezení pohybu

**Files:**
- Test: `tests/e2e/pohyb.spec.ts`
- Modify: jen pokud test selže (`src/styles/upravy.css`)

**Interfaces:**
- Consumes: CSS animací převzaté v `hlavni.css` (blok z `animace.css`, `@media (prefers-reduced-motion: no-preference)`)

- [ ] **Step 1: Napsat test**

`tests/e2e/pohyb.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test('s omezeným pohybem nejsou žádné animace', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await page.goto('/');
  const animace = await page.evaluate(() => document.getAnimations().length);
  expect(animace).toBe(0);
  await expect(page.locator('body')).toHaveClass(/nacteno/);
  await ctx.close();
});

test('bez omezení pruhy při načtení dorůstají', async ({ page }) => {
  await page.goto('/');
  const jmena = await page.evaluate(() => document.getAnimations().map(a => (a as CSSAnimation).animationName));
  expect(jmena).toContain('nv-narust');
});
```

- [ ] **Step 2: Spustit**

Run: `npm run e2e -- tests/e2e/pohyb.spec.ts` → Expected: PASS. Pokud první test selže, najít v `hlavni.css` animaci mimo blok `prefers-reduced-motion: no-preference` a obalit ji v `upravy.css` pravidlem `@media (prefers-reduced-motion: reduce) { <selektor> { animation: none !important; transition: none !important; } }`.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/pohyb.spec.ts src/styles/upravy.css
git commit -m "Test: animace se vypínají při omezení pohybu"
```

---

### Task 14: Přístupnost a žádné svislé posouvání na všech velikostech

**Files:**
- Test: `tests/e2e/pristupnost.spec.ts`, `tests/e2e/bez-posouvani.spec.ts`
- Modify: podle nálezů (`src/styles/upravy.css`, komponenty)

- [ ] **Step 1: Napsat testy**

`tests/e2e/bez-posouvani.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

for (const v of VELIKOSTI) {
  test.describe(`${v.width}×${v.height}`, () => {
    test.use({ viewport: v });
    for (const cesta of ['/', '/kauzy/alfa-dotace/', '/metodika/', '/o-projektu/']) {
      test(`${cesta} se neposouvá dolů`, async ({ page }) => {
        await page.goto(cesta);
        await overBezPosouvani(page);
      });
    }
    test('celá osa je vidět', async ({ page }) => {
      await page.goto('/');
      const graf = await page.locator('#graf').boundingBox();
      expect(graf!.y + graf!.height).toBeLessThanOrEqual(v.height);
      const posledni = await page.locator('.radek').last().boundingBox();
      expect(posledni!.y + posledni!.height).toBeLessThanOrEqual(graf!.y + graf!.height + 1);
    });
  });
}

test('15 kauz: stránka se neposouvá, posouvá se jen seznam v ose', async ({ page }) => {
  await page.setViewportSize({ width: 1342, height: 565 });
  await page.goto('/');
  await page.evaluate(() => {
    const radky = document.querySelector('.radky')!;
    const vzor = [...document.querySelectorAll('.radek')];
    for (let i = 0; i < 9; i++) {
      const kopie = vzor[i % vzor.length].cloneNode(true) as HTMLElement;
      kopie.dataset.slug = `kopie-${i}`;
      kopie.style.setProperty('view-transition-name', `r-kopie-${i}`);
      radky.insertBefore(kopie, radky.querySelector('.prazdno'));
    }
  });
  await overBezPosouvani(page);
  const { vnitrni, vyska } = await page.evaluate(() => {
    const r = document.querySelector('.radky') as HTMLElement;
    return { vnitrni: r.scrollHeight, vyska: r.clientHeight };
  });
  expect(vnitrni).toBeGreaterThan(vyska);
});
```

`tests/e2e/pristupnost.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ viewport: { width: 1366, height: 768 } });

for (const cesta of ['/', '/kauzy/alfa-dotace/', '/metodika/', '/o-projektu/', 'http://localhost:4322/']) {
  test(`${cesta} bez závažných chyb přístupnosti`, async ({ page }) => {
    await page.goto(cesta);
    const vysledek = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const zavazne = vysledek.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(zavazne.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('ovládání klávesnicí: Tab dojde na řádek osy a Enter otevře detail', async ({ page }) => {
  await page.goto('/');
  await page.locator('.radek a.radek-btn').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog#detail')).not.toBeVisible();
});
```

- [ ] **Step 2: Spustit a opravit nálezy**

Run: `npm run e2e -- tests/e2e/bez-posouvani.spec.ts tests/e2e/pristupnost.spec.ts`
Expected: PASS. Typické nálezy a jejich opravy (v `upravy.css`):
- kontrast `.osa-roku .stitky span.malo` nebo `.legenda`: ztmavit na `var(--meta)`,
- `aria-hidden` na prvku s fokusovatelným obsahem: odstranit `aria-hidden` z `.osa-roku`, pokud obsahuje tlačítka,
- přetečení na 390×700: v `@media (max-width: 760px)` snížit `.radek { min-height }` a velikost `.hero.u2 h1`.

Po každé opravě spustit znovu, dokud není vše zelené.

- [ ] **Step 3: Spustit celou sadu**

Run: `npm test && npm run e2e` → Expected: vše PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e src/styles/upravy.css src/components
git commit -m "Přístupnost a kontrola, že se stránky nikde neposouvají dolů"
```

---

### Task 15: Kontroly a nasazení v GitHub Actions

**Files:**
- Create: `.github/workflows/kontrola.yml`, `.github/workflows/nasazeni.yml`, `lychee.toml`, `scripts/over-identitu.sh`
- Test: spuštění workflow na GitHubu (push větve)

**Interfaces:**
- Produces: workflow `Kontrola` (PR a push), workflow `Nasazení` (spouští se jen s proměnnou repozitáře `NASAZOVAT=ano`, nebo ručně)

- [ ] **Step 1: Kontrola anonymity commitů**

`scripts/over-identitu.sh`:
```bash
#!/usr/bin/env bash
# Selže, pokud má některý commit v rozsahu autora nebo committera mimo povolené noreply adresy.
set -euo pipefail
rozsah="${1:-HEAD}"
spatne=$(git log --format='%ae%n%ce' "$rozsah" | sort -u | grep -v -E '^(354814288\+nenechmevyhnit@users\.noreply\.github\.com|noreply@github\.com)$' || true)
if [ -n "$spatne" ]; then
  echo "Commity obsahují nepovolenou identitu:"; echo "$spatne"; exit 1
fi
echo "Identita commitů v pořádku."
```

Run lokálně: `bash scripts/over-identitu.sh` → Expected: `Identita commitů v pořádku.` (`noreply@anthropic.com` je jen v textu zprávy jako spoluautor, ne v poli autora.)

- [ ] **Step 2: Workflow Kontrola**

`.github/workflows/kontrola.yml`:
```yaml
name: Kontrola
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  kontrola:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Identita commitů
        run: bash scripts/over-identitu.sh
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - name: Validace skutečného obsahu
        run: npm run over
      - name: Build produkční verze
        run: npx astro build
      - name: Jednotkové testy
        run: npm test
      - run: npx playwright install --with-deps chromium
      - name: E2E testy
        run: npm run e2e
      - name: Změněné kauzy
        id: zmeny
        run: echo "soubory=$(git diff --name-only --diff-filter=AM origin/main...HEAD -- 'obsah/kauzy/*.md' | tr '\n' ' ')" >> "$GITHUB_OUTPUT"
      - name: Kontrola odkazů ve změněných kauzách
        if: steps.zmeny.outputs.soubory != ''
        uses: lycheeverse/lychee-action@v2
        with:
          args: --config lychee.toml ${{ steps.zmeny.outputs.soubory }}
          fail: true
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```

`lychee.toml`:
```toml
max_retries = 3
timeout = 30
accept = [200, 206, 429]
exclude = ["^https://example\\.com"]
```

- [ ] **Step 3: Workflow Nasazení (zatím vypnuté)**

`.github/workflows/nasazeni.yml`:
```yaml
name: Nasazení
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    # Web zatím nespouštíme. Zapne se proměnnou repozitáře NASAZOVAT=ano (Settings → Variables).
    if: vars.NASAZOVAT == 'ano' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.nasazeni.outputs.page_url }}' }
    steps:
      - id: nasazeni
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Ověřit na GitHubu**

```bash
git add .github/workflows lychee.toml scripts/over-identitu.sh
git commit -m "GitHub Actions: kontrola obsahu, testy, identita commitů, vypnuté nasazení"
git push
```
Expected: na GitHubu (Actions) proběhne `Kontrola` zeleně, `Nasazení` se přeskočí (podmínka `NASAZOVAT`). Pokud `Kontrola` selže, opravit podle logu a pushnout znovu.

---

### Task 16: Týdenní kontrola odkazů, archivace zdrojů a šablony pro přispěvatele

**Files:**
- Create: `src/lib/archiv.ts`, `scripts/archivuj.ts`, `.github/workflows/tydenni.yml`, `.github/ISSUE_TEMPLATE/nova-kauza.yml`, `.github/ISSUE_TEMPLATE/oprava.yml`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/spusteni.md`
- Test: `tests/unit/archiv.test.ts`

**Interfaces:**
- Produces:
  - `doplnArchiv(text: string, url: string, archiv: string): string` vloží řádek `archiv:` za odpovídající `url:` v blokovém i řádkovém YAML zápisu. Když `archiv` už existuje, text nemění.
  - `ziskejArchiv(url: string, fetchFn?: typeof fetch): Promise<string | null>`

- [ ] **Step 1: Napsat failující test**

`tests/unit/archiv.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { doplnArchiv, ziskejArchiv } from '../../src/lib/archiv';

const BLOK = `zdroje:
  - id: 1
    url: https://example.com/a
    druh: media
  - id: 2
    url: "https://example.com/b"
    archiv: https://web.archive.org/x/b
`;
const RADEK = `zdroje:
  - { id: 1, vydavatel: X, url: "https://example.com/a", druh: media }
`;

describe('doplnArchiv', () => {
  it('blokový zápis: vloží řádek se stejným odsazením', () => {
    const v = doplnArchiv(BLOK, 'https://example.com/a', 'https://web.archive.org/web/2026/https://example.com/a');
    expect(v).toContain('    url: https://example.com/a\n    archiv: https://web.archive.org/web/2026/https://example.com/a\n    druh: media');
  });
  it('existující archiv nemění', () => {
    expect(doplnArchiv(BLOK, 'https://example.com/b', 'https://jiny')).toBe(BLOK);
  });
  it('řádkový zápis: doplní klíč do objektu', () => {
    const v = doplnArchiv(RADEK, 'https://example.com/a', 'https://web.archive.org/web/2026/a');
    expect(v).toContain('url: "https://example.com/a", archiv: "https://web.archive.org/web/2026/a", druh: media');
  });
  it('neznámá URL nic nezmění', () => expect(doplnArchiv(BLOK, 'https://jine.cz', 'x')).toBe(BLOK));
});

describe('ziskejArchiv', () => {
  it('vrátí adresu snímku z odpovědi Save Page Now', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, url: 'https://web.archive.org/web/20261110120000/https://example.com/a', headers: new Headers() });
    expect(await ziskejArchiv('https://example.com/a', f as any)).toBe('https://web.archive.org/web/20261110120000/https://example.com/a');
  });
  it('při chybě vrátí null', async () => {
    const f = vi.fn().mockRejectedValue(new Error('síť'));
    expect(await ziskejArchiv('https://example.com/a', f as any)).toBeNull();
  });
});
```

Run: `npx vitest run tests/unit/archiv.test.ts` → Expected: FAIL.

- [ ] **Step 2: Implementovat**

`src/lib/archiv.ts`:
```ts
const escapuj = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function doplnArchiv(text: string, url: string, archiv: string): string {
  const u = escapuj(url);
  // řádkový zápis { ..., url: "x", ... }
  const radek = new RegExp(`(\\{[^}\\n]*url:\\s*["']?${u}["']?)(?![^}\\n]*archiv:)([^}\\n]*\\})`);
  if (radek.test(text)) return text.replace(radek, `$1, archiv: "${archiv}"$2`);
  // blokový zápis
  const radky = text.split('\n');
  const i = radky.findIndex(r => new RegExp(`^(\\s*)url:\\s*["']?${u}["']?\\s*$`).test(r));
  if (i === -1) return text;
  const odsazeni = radky[i].match(/^(\s*)/)![1];
  for (let j = i + 1; j < radky.length; j++) {
    const r = radky[j];
    const odsJ = r.match(/^(\s*)/)![1];
    if (r.trim() === '' || odsJ.length < odsazeni.length || r.trimStart().startsWith('- ')) break;
    if (r.trimStart().startsWith('archiv:')) return text;
  }
  radky.splice(i + 1, 0, `${odsazeni}archiv: ${archiv}`);
  return radky.join('\n');
}

export async function ziskejArchiv(url: string, fetchFn: typeof fetch = fetch): Promise<string | null> {
  try {
    const o = await fetchFn(`https://web.archive.org/save/${url}`, { redirect: 'follow' });
    if (!o.ok) return null;
    if (o.url.includes('/web/')) return o.url;
    const umisteni = o.headers.get('content-location');
    return umisteni ? `https://web.archive.org${umisteni}` : null;
  } catch {
    return null;
  }
}
```

`scripts/archivuj.ts`:
```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { overAdresar } from '../src/lib/validace';
import { doplnArchiv, ziskejArchiv } from '../src/lib/archiv';

const adresar = process.env.NV_OBSAH ?? 'obsah';
const { zaznamy, chyby } = overAdresar(adresar);
if (chyby.length) { console.error('Obsah má chyby, archivace se přeskočí.'); process.exit(1); }
let doplneno = 0;
for (const z of zaznamy) {
  const soubor = `${adresar}/kauzy/${z.slug}.md`;
  let text = readFileSync(soubor, 'utf8');
  for (const zdroj of z.kauza.zdroje.filter(x => !x.archiv)) {
    const archiv = await ziskejArchiv(zdroj.url);
    if (archiv) { text = doplnArchiv(text, zdroj.url, archiv); doplneno++; }
    await new Promise(r => setTimeout(r, 5000)); // šetrně k Wayback Machine
  }
  writeFileSync(soubor, text);
}
console.log(`Doplněno archivních kopií: ${doplneno}`);
```

- [ ] **Step 3: Týdenní workflow a šablony**

`.github/workflows/tydenni.yml`:
```yaml
name: Týdenní údržba zdrojů
on:
  schedule: [{ cron: '0 5 * * 1' }]
  workflow_dispatch:
permissions:
  contents: write
  issues: write
  pull-requests: write
jobs:
  odkazy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: lychee
        uses: lycheeverse/lychee-action@v2
        with:
          args: --config lychee.toml 'obsah/kauzy/*.md'
          fail: false
          output: lychee/vysledek.md
      - name: Nahlásit nefunkční odkazy
        if: steps.lychee.outputs.exit_code != 0
        uses: peter-evans/create-issue-from-file@v5
        with:
          title: Nefunkční odkazy na zdroje
          content-filepath: lychee/vysledek.md
          labels: zdroje
  archivace:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npx tsx scripts/archivuj.ts
      - uses: peter-evans/create-pull-request@v7
        with:
          branch: automat/archivace-zdroju
          title: Doplnění archivních kopií zdrojů
          commit-message: Doplnění archivních kopií zdrojů
          author: Nenechme vyhnít <354814288+nenechmevyhnit@users.noreply.github.com>
          committer: Nenechme vyhnít <354814288+nenechmevyhnit@users.noreply.github.com>
          body: Automaticky doplněné odkazy na Wayback Machine u zdrojů, které archivní kopii neměly.
```

`.github/ISSUE_TEMPLATE/nova-kauza.yml`:
```yaml
name: Nová kauza
description: Navrhněte kauzu, která v archivu chybí
title: "Nová kauza: "
labels: [nova-kauza]
body:
  - type: markdown
    attributes: { value: "Každá kauza musí splňovat [metodiku](https://nenechmevyhnit.cz/metodika/). Bez zdrojů návrh nemůžeme přijmout." }
  - type: input
    id: nazev
    attributes: { label: Název kauzy }
    validations: { required: true }
  - type: textarea
    id: popis
    attributes: { label: O co jde, description: "Jedna až tři věty, věcně." }
    validations: { required: true }
  - type: textarea
    id: zdroje
    attributes: { label: Zdroje, description: "Odkazy na soudní rozhodnutí, úřední dokumenty nebo seriózní média, každý na samostatném řádku." }
    validations: { required: true }
```

`.github/ISSUE_TEMPLATE/oprava.yml`:
```yaml
name: Oprava
description: Nahlaste chybu v kauze nebo na webu
title: "Oprava: "
labels: [oprava]
body:
  - type: input
    id: kde
    attributes: { label: Kde je chyba, description: "Odkaz na kauzu nebo stránku" }
    validations: { required: true }
  - type: textarea
    id: co
    attributes: { label: Co je špatně a jak to má být }
    validations: { required: true }
  - type: textarea
    id: zdroje
    attributes: { label: Zdroje k opravě }
    validations: { required: true }
```

`.github/ISSUE_TEMPLATE/config.yml`:
```yaml
blank_issues_enabled: false
contact_links:
  - name: E-mail
    url: mailto:nenechmevyhnit@gmail.com
    about: Pokud nechcete používat GitHub, napište nám e-mail.
```

`.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## Co se mění

## Kontrolní seznam
- [ ] Každé nové tvrzení má zdroj (primární, nebo dva nezávislé mediální)
- [ ] Kauza má stanovisko dotčené strany se zdrojem
- [ ] Datum ověření je aktuální
- [ ] Jazyk je věcný, bez hodnotících přívlastků
```

`docs/spusteni.md`:
```markdown
# Kontrolní seznam před spuštěním

- [ ] Aspoň 5 ověřených kauz v `obsah/kauzy/` (každý zdroj otevřel a ověřil člověk)
- [ ] Údaje držitele domény skryté ve WHOIS (kontakt bez vyplněné organizace; ověřit na https://rdap.nic.cz/entity/<id kontaktu>)
- [ ] Portrét pečlivě vyříznutý ručně (vlasy), nahradit `public/obrazky/portret.webp`
- [ ] Krátké právní ověření (podobizna, texty kauz)
- [ ] DNS u Webglobe: A záznamy 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; AAAA 2606:50c0:8000::153 až 8003::153; `www` CNAME na `nenechmevyhnit.github.io`
- [ ] GitHub: Settings → Pages → Verified domains → ověřit `nenechmevyhnit.cz` (TXT záznam), Source = GitHub Actions, Custom domain = `nenechmevyhnit.cz`, Enforce HTTPS
- [ ] Proměnná repozitáře `NASAZOVAT=ano`
- [ ] Všechny kontroly v Actions zelené
```

- [ ] **Step 4: Spustit testy**

Run: `npm test` → Expected: PASS (včetně `archiv.test.ts`).

- [ ] **Step 5: Commit a push**

```bash
git add src/lib/archiv.ts scripts/archivuj.ts .github docs/spusteni.md tests/unit/archiv.test.ts
git commit -m "Týdenní kontrola odkazů, archivace zdrojů a šablony pro přispěvatele"
git push
```
Expected: `Kontrola` na GitHubu zelená. V Actions jde ručně spustit „Týdenní údržba zdrojů“. Doběhne bez chyb, protože skutečný obsah je zatím prázdný.

---

## Pokrytí specifikace

| Oddíl specifikace | Úloha |
|---|---|
| 3 Identita a anonymita | 1 (kontrola identity), 15 (CI kontrola commitů), 16 (`docs/spusteni.md`: WHOIS, DNS) |
| 4 Metodika (postup, zdroje, druhá strana) | 2, 4 (vynucení), 12 (stránka), 16 (šablony) |
| 5 Datový model a pravidla buildu | 2, 3, 4 |
| 6 Hlavní stránka (U2, F4, osa F, patička) | 7, 8, 9 |
| 6 Detail M2 a `/kauzy/<slug>/`, History API | 10, 11 |
| 6 Metodika a O projektu (V4) | 12 |
| 7 Vizuální systém (T2, písma, portrét P4) | 6, 8 |
| 7 Žádné svislé posouvání | 7, 14 |
| 7 Animace a omezení pohybu | 6 (CSS), 8, 9, 13 |
| 7 Přístupnost | 14 |
| 8 Architektura (Astro, bez sledování) | 1, 7 (test cizích požadavků) |
| 9 Automatizace | 15, 16 |
| 10 Testování | všechny úlohy |
| 11 Podmínky spuštění | 16 (`docs/spusteni.md`) |
