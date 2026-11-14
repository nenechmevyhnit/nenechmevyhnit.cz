# Vyhledatelnost — implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dostat web do indexu vyhledávačů a dát každé stránce vlastní nadpis, titulek, popis, strukturovaná data a náhledový obrázek.

**Architecture:** Nový modul `src/lib/web.ts` drží údaje o webu a skládá titulky i popisy; `src/lib/sitemap.ts` sestaví seznam adres z týchž loaderů obsahu, které používají `getStaticPaths`, a tenký endpoint `src/pages/sitemap.xml.ts` ho vypíše; komponenta `StrukturovanaData.astro` v `Zaklad.astro` přidá JSON-LD; náhledové obrázky vyrobí skript `nastroje/nahledy.mjs` přes Playwright a zacommitují se do `public/obrazky/nahledy/`.

**Tech Stack:** Astro 7 (statický build, `trailingSlash: 'always'`), TypeScript, vitest (jednotkové), Playwright (e2e i generování náhledů), zod (validace obsahu — nepoužívá se pro schema.org).

**Spec:** [docs/superpowers/specs/2026-11-14-vyhledatelnost-design.md](../specs/2026-11-14-vyhledatelnost-design.md)

## Global Constraints

- Název webu je `Posuďte sami`, doména `https://posudtesami.cz`.
- **Starý název ani stará doména se nesmí nikde objevit.** `tests/unit/kostra.test.ts` prohledává `src`, `public`, `tests`, `nastroje`, `scripts`, `.github`, `astro.config.mjs`, `package.json` na `/nenechme\s+vyhn/i` a `/nenechmevyhnit\.cz|github\.com\/nenechmevyhnit|nenechmevyhnit\.github\.io/`. Padne, pokud to porušíš.
- **Žádné nové závislosti.** Náhledy renderuje `@playwright/test`, který už je v `devDependencies`.
- **Žádná analytika, žádný měřicí skript, žádné načítání z cizích serverů.** `tests/unit/styly.test.ts` hlídá, že CSS nestahuje z `fonts.googleapis` ani `fonts.gstatic`.
- `trailingSlash: 'always'` — každá adresa v sitemapě i v JSON-LD končí lomítkem (kromě `/robots.txt` a `/sitemap.xml`).
- `datePublished` se v JSON-LD nepoužívá, nemáme ho. `ClaimReview` se nepoužívá.
- Veškerý text pro lidi je česky, s diakritikou. Identifikátory v kódu česky podle zvyku projektu (`nactiKauzy`, `titulek`, `adresy`).
- `public/obrazky/nahled.png` musí zůstat — `styly.test.ts` jeho existenci kontroluje a je to záložní náhled pro stránky bez vlastního.

## Review Focus

Vstupy, které spec předpokládá, ale žádný úkol by je sám netestoval. U každého je uvedeno, kde se test doplňuje.

1. **Kauza s `do: null`** („dosud“) v titulku a v sitemapě — fixture `alfa-dotace.md` ji má, vzorec na rozsah let nesmí vypsat `2007–null`. *Test v úkolu 5.*
2. **Prázdný obsah** (`tests/fixtures/prazdny`, servírovaný na portu 4322) — sitemapa nesmí spadnout ani vypsat sekce, které build nevytvoří. *Test v úkolu 3.*
3. **`overeno: null`** v režimu konceptů — `lastmod` se musí vynechat, ne vypsat `null`. *Test v úkolu 3.*
4. **Název kauzy u horní hranice 36 znaků** — titulek nesmí přetéct limit, musí spadnout na kratší variantu vzorce. *Test v úkolu 5.*
5. **Shrnutí s uvozovkami a `&`** v `description` a v JSON-LD — nesmí rozbít atribut ani JSON. *Test v úkolu 6.*

---

### Task 1: Centrální údaje o webu

Čistě mechanický přesun: titulky musí po tomto úkolu zůstat **znak po znaku stejné**, aby šesti existujícím e2e testům na titulek nic nechybělo. Změna vzorce přijde až v úkolu 5.

**Files:**
- Create: `src/lib/web.ts`
- Create: `tests/unit/web.test.ts`
- Modify: `src/layouts/Zaklad.astro` (řádek s `og:site_name`)
- Modify: `src/components/Hlavicka.astro:8`
- Modify: `src/components/HlavniStranka.astro:19-20`
- Modify: `src/components/PrehledPravidel.astro:42-44`
- Modify: `src/pages/hlasovani/[id].astro:30`
- Modify: `src/pages/metodika.astro:10`
- Modify: `src/pages/o-projektu.astro:10`
- Modify: `src/pages/404.astro:5`
- Modify: `src/scripts/navigace.ts:6`
- Modify: `src/scripts/navigace-pravidel.ts:6`

**Interfaces:**
- Consumes: nic.
- Produces: `WEB: { nazev: string; domena: string; popis: string }`, `titulek(co: string): string`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/web.test.ts
import { describe, it, expect } from 'vitest';
import { WEB, titulek } from '../../src/lib/web';

describe('web', () => {
  it('drží název a doménu projektu', () => {
    expect(WEB.nazev).toBe('Posuďte sami');
    expect(WEB.domena).toBe('https://posudtesami.cz');
  });

  it('skládá titulek stránky s příponou názvu webu', () => {
    expect(titulek('Metodika')).toBe('Metodika — Posuďte sami');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/web.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/lib/web"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/web.ts
/** Jediné místo s údaji o webu. Název ani doménu nikam nepiš ručně:
 *  tests/unit/kostra.test.ts hlídá, že se nevrátí starý název projektu. */
export const WEB = {
  nazev: 'Posuďte sami',
  domena: 'https://posudtesami.cz',
  popis: 'Archiv kauz Andreje Babiše přehledně, s daty a zdroji. Každé tvrzení má zdroj, každá kauza stanovisko dotčené strany.',
} as const;

/** Titulek stránky: „<co> — Posuďte sami“. */
export const titulek = (co: string): string => `${co} — ${WEB.nazev}`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/web.test.ts`
Expected: PASS (2 testy).

- [ ] **Step 5: Nahradit zadrátovaný název v šablonách**

V `src/layouts/Zaklad.astro` přidej do frontmatteru `import { WEB } from '../lib/web';` a nahraď řádek

```astro
  <meta property="og:site_name" content="Posuďte sami">
```

za

```astro
  <meta property="og:site_name" content={WEB.nazev}>
```

V `src/components/Hlavicka.astro` přidej `import { WEB } from '../lib/web';` a nahraď

```astro
    <a class="brand" href="/">Posuďte sami</a>
```

za

```astro
    <a class="brand" href="/">{WEB.nazev}</a>
```

V `src/components/HlavniStranka.astro` přidej `import { WEB, titulek as nazevStranky } from '../lib/web';` a nahraď řádky 19–20

```ts
const titulek = otevrena ? `${otevrena.kauza.nazev} — Posuďte sami` : 'Archiv kauz Andreje Babiše — Posuďte sami';
const popis = otevrena ? otevrena.kauza.shrnuti : 'Archiv kauz Andreje Babiše přehledně, s daty a zdroji. Každé tvrzení má zdroj, každá kauza stanovisko dotčené strany.';
```

za

```ts
const titulek = nazevStranky(otevrena ? otevrena.kauza.nazev : 'Archiv kauz Andreje Babiše');
const popis = otevrena ? otevrena.kauza.shrnuti : WEB.popis;
```

V `src/components/PrehledPravidel.astro` přidej `import { titulek as nazevStranky } from '../lib/web';` a nahraď řádky 42–44

```ts
const titulek = otevrene ? `${otevrene.pravidlo.nazev} — Posuďte sami`
  : otevrenaOblast ? `${otevrenaOblast.nazev} — Posuďte sami`
  : 'Zákony a nařízení — Posuďte sami';
```

za

```ts
const titulek = nazevStranky(otevrene ? otevrene.pravidlo.nazev
  : otevrenaOblast ? otevrenaOblast.nazev
  : 'Zákony a nařízení');
```

V `src/pages/hlasovani/[id].astro` přidej `import { titulek as nazevStranky } from '../../lib/web';` a v řádku 30 nahraď `titulek={`${nadpis} — Posuďte sami`}` za `titulek={nazevStranky(nadpis)}`.

V `src/pages/metodika.astro`, `src/pages/o-projektu.astro` a `src/pages/404.astro` přidej `import { titulek as nazevStranky } from '../lib/web';` a nahraď řetězce:

- `titulek="Metodika — Posuďte sami"` → `titulek={nazevStranky('Metodika')}`
- `titulek="O projektu — Posuďte sami"` → `titulek={nazevStranky('O projektu')}`
- `titulek="Stránka neexistuje — Posuďte sami"` → `titulek={nazevStranky('Stránka neexistuje')}`

V `src/scripts/navigace.ts` nahraď řádek 6

```ts
const TITULEK_HLAVNI = 'Archiv kauz Andreje Babiše — Posuďte sami';
```

za

```ts
import { titulek } from '../lib/web';
const TITULEK_HLAVNI = titulek('Archiv kauz Andreje Babiše');
```

(`import` patří nahoru k ostatním importům, nikoli na řádek 6.)

V `src/scripts/navigace-pravidel.ts` nahraď řádek 6 obdobně:

```ts
import { titulek } from '../lib/web';
const TITULEK = titulek('Zákony a nařízení');
```

**Pozor:** `src/data/o-projektu.ts:62` obsahuje název uvnitř věty o licenci („stačí uvést „Posuďte sami“ a odkaz“). To je text pro čtenáře, ne titulek — **nech ho být**.

- [ ] **Step 6: Run all tests to verify nothing changed**

Run: `npm test`
Expected: PASS, včetně `kostra.test.ts` a nového `web.test.ts`.

Run: `npm run e2e`
Expected: PASS. Zejména `tests/e2e/detail.spec.ts`, `hlasovani-stranka.spec.ts`, `pravidla-detail.spec.ts`, `pravidla-oblasti-detail.spec.ts` a `pravidla-prehled.spec.ts` — ty kontrolují přesné titulky a po tomto úkolu musí projít **bez úpravy**. Pokud některý padne, znamená to, že se titulek změnil, a to v tomto úkolu nesmí.

- [ ] **Step 7: Commit**

```bash
git add src/lib/web.ts tests/unit/web.test.ts src/layouts/Zaklad.astro src/components/Hlavicka.astro src/components/HlavniStranka.astro src/components/PrehledPravidel.astro src/pages/hlasovani/\[id\].astro src/pages/metodika.astro src/pages/o-projektu.astro src/pages/404.astro src/scripts/navigace.ts src/scripts/navigace-pravidel.ts
git commit -m "Údaje o webu na jedno místo (src/lib/web.ts)"
```

---

### Task 2: robots.txt

**Files:**
- Create: `public/robots.txt`
- Create: `tests/unit/robots.test.ts`

**Interfaces:**
- Consumes: `WEB.domena` z úkolu 1 (jen jako hodnotu, kterou test porovná — soubor je statický).
- Produces: adresa `/robots.txt` v nasazeném webu.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/robots.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { WEB } from '../../src/lib/web';

describe('robots.txt', () => {
  const text = () => readFileSync('public/robots.txt', 'utf8');

  it('nikomu nic nezakazuje', () => {
    expect(text()).toMatch(/^Disallow:\s*$/m);
    expect(text()).not.toMatch(/^Disallow:\s*\//m);
  });

  it('odkazuje na sitemapu na vlastní doméně', () => {
    expect(text()).toContain(`Sitemap: ${WEB.domena}/sitemap.xml`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/robots.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'public/robots.txt'`.

- [ ] **Step 3: Write minimal implementation**

```
# Archiv je veřejný a statický, zakazovat není co.
User-agent: *
Disallow:

Sitemap: https://posudtesami.cz/sitemap.xml
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/robots.test.ts`
Expected: PASS (2 testy).

- [ ] **Step 5: Commit**

```bash
git add public/robots.txt tests/unit/robots.test.ts
git commit -m "robots.txt: nic nezakazuje, odkazuje na sitemapu"
```

---

### Task 3: Sitemapa

Sitemapa se skládá z týchž loaderů obsahu, které používají `getStaticPaths`. Tím je parita s buildem dána konstrukcí — a e2e test ji ověří proti skutečně postavenému webu.

**Pozor na trasu oblastí:** `src/pages/pravidla/oblasti/[oblast].astro` existuje, ale ve skutečném obsahu (`obsah/pravidla/`) dnes negeneruje **ani jednu** stránku, protože žádné pravidlo nemá pole `oblasti`. Ve fixtures (`tests/fixtures/obsah/oblasti/`) stránky vznikají. Sitemapa proto musí vycházet z `nactiOblasti()`, ne ze seznamu tras.

**Files:**
- Create: `src/lib/sitemap.ts`
- Create: `src/pages/sitemap.xml.ts`
- Create: `tests/unit/sitemap.test.ts`
- Create: `tests/e2e/sitemap.spec.ts`

**Interfaces:**
- Consumes: `WEB` z úkolu 1; `nactiKauzy`, `nactiPravidla`, `nactiOblasti`, `nactiHlasovani`, `maPravidla` z `src/lib/kauzy.ts`.
- Produces: `type Zapis = { cesta: string; zmeneno?: string }`, `adresy(): Zapis[]`, `sitemapaXml(zapisy: Zapis[]): string`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/sitemap.test.ts
import { describe, it, expect } from 'vitest';
import { adresy, sitemapaXml, type Zapis } from '../../src/lib/sitemap';

describe('sitemapaXml', () => {
  it('vypíše adresu s lastmod', () => {
    const xml = sitemapaXml([{ cesta: '/kauzy/alfa/', zmeneno: '2026-11-09' }]);
    expect(xml).toContain('<loc>https://posudtesami.cz/kauzy/alfa/</loc>');
    expect(xml).toContain('<lastmod>2026-11-09</lastmod>');
  });

  it('bez data ověření lastmod vynechá, nikdy nevypíše null', () => {
    const xml = sitemapaXml([{ cesta: '/kauzy/alfa/' }]);
    expect(xml).toContain('<loc>https://posudtesami.cz/kauzy/alfa/</loc>');
    expect(xml).not.toContain('lastmod');
    expect(xml).not.toContain('null');
  });

  it('každá adresa končí lomítkem', () => {
    for (const z of adresy()) expect(z.cesta.endsWith('/'), z.cesta).toBe(true);
  });

  it('obsahuje titulní stránku, kauzy a statické stránky, ale ne 404', () => {
    const cesty = adresy().map(z => z.cesta);
    expect(cesty).toContain('/');
    expect(cesty).toContain('/metodika/');
    expect(cesty).toContain('/o-projektu/');
    expect(cesty.some(c => c.startsWith('/kauzy/'))).toBe(true);
    expect(cesty).not.toContain('/404/');
  });

  it('neobsahuje duplicitní adresy', () => {
    const cesty = adresy().map(z => z.cesta);
    expect(cesty.length).toBe(new Set(cesty).size);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/sitemap.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/lib/sitemap"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/sitemap.ts
import { nactiKauzy, nactiPravidla, nactiOblasti, nactiHlasovani, maPravidla } from './kauzy';
import { WEB } from './web';

export type Zapis = { cesta: string; zmeneno?: string };

/** Nejnovější z dat ve tvaru RRRR-MM-DD. Hodnoty null (neověřené koncepty) vynechá. */
const nejnovejsi = (data: (string | null)[]): string | undefined => {
  const platna = data.filter((d): d is string => typeof d === 'string');
  return platna.length ? platna.slice().sort().at(-1) : undefined;
};

/** Seznam adres pro sitemapu. Skládá se ze stejných loaderů obsahu, jaké používají getStaticPaths,
 *  takže nemůže nabídnout adresu, kterou build nevytvoří. Stránka 404 do sitemapy nepatří. */
export function adresy(): Zapis[] {
  const kauzy = nactiKauzy();
  const zapisy: Zapis[] = [
    { cesta: '/', zmeneno: nejnovejsi(kauzy.map(z => z.kauza.overeno)) },
    ...kauzy.map(z => ({ cesta: `/kauzy/${z.slug}/`, zmeneno: z.kauza.overeno ?? undefined })),
  ];

  if (maPravidla()) {
    const pravidla = nactiPravidla();
    zapisy.push({ cesta: '/pravidla/', zmeneno: nejnovejsi(pravidla.map(z => z.pravidlo.overeno)) });
    for (const z of pravidla) zapisy.push({ cesta: `/pravidla/${z.slug}/`, zmeneno: z.pravidlo.overeno ?? undefined });
    for (const o of nactiOblasti()) {
      zapisy.push({ cesta: `/pravidla/oblasti/${o.id}/`, zmeneno: nejnovejsi(o.zmeny.map(z => z.pravidlo.overeno)) });
    }
  }

  // u hlasování je datum poslední změny stránky den, kdy se snímek stáhl z PSP, ne den hlasování
  for (const [id, s] of nactiHlasovani()) zapisy.push({ cesta: `/hlasovani/${id}/`, zmeneno: s.stazeno });

  zapisy.push({ cesta: '/metodika/' }, { cesta: '/o-projektu/' });
  return zapisy;
}

export function sitemapaXml(zapisy: Zapis[]): string {
  const polozka = (z: Zapis) => [
    '  <url>',
    `    <loc>${WEB.domena}${z.cesta}</loc>`,
    ...(z.zmeneno ? [`    <lastmod>${z.zmeneno}</lastmod>`] : []),
    '  </url>',
  ].join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...zapisy.map(polozka),
    '</urlset>',
    '',
  ].join('\n');
}
```

```ts
// src/pages/sitemap.xml.ts
import type { APIRoute } from 'astro';
import { adresy, sitemapaXml } from '../lib/sitemap';

export const GET: APIRoute = () => new Response(sitemapaXml(adresy()), {
  headers: { 'content-type': 'application/xml; charset=utf-8' },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/sitemap.test.ts`
Expected: PASS (5 testů).

- [ ] **Step 5: Write the e2e parity test**

Tenhle test je jádro úkolu: porovná sitemapu s tím, co build skutečně vytvořil, a ověří prázdný obsah na portu 4322.

```ts
// tests/e2e/sitemap.spec.ts
import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Adresy, které build skutečně vytvořil: každý index.html kromě 404. */
function postaveneAdresy(slozka: string): string[] {
  const najdi = (cesta: string): string[] => readdirSync(cesta, { withFileTypes: true }).flatMap(d => {
    const plna = join(cesta, d.name);
    if (d.isDirectory()) return najdi(plna);
    return d.name === 'index.html' ? [plna] : [];
  });
  return najdi(slozka)
    .map(f => '/' + f.slice(slozka.length + 1).split(sep).slice(0, -1).join('/'))
    .map(c => (c === '/' ? '/' : `${c}/`.replace('//', '/')))
    .sort();
}

const vSitemape = (xml: string): string[] =>
  [...xml.matchAll(/<loc>https:\/\/posudtesami\.cz([^<]*)<\/loc>/g)].map(m => m[1]).sort();

test('sitemapa nabízí právě ty adresy, které build vytvořil', async ({ request }) => {
  const odpoved = await request.get('/sitemap.xml');
  expect(odpoved.status()).toBe(200);
  expect(odpoved.headers()['content-type']).toContain('application/xml');
  expect(vSitemape(await odpoved.text())).toEqual(postaveneAdresy('dist-e2e'));
});

test('každá adresa ze sitemapy odpovídá 200', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const cesta of vSitemape(xml)) {
    expect((await request.get(cesta)).status(), cesta).toBe(200);
  }
});

test('robots.txt se servíruje a odkazuje na sitemapu', async ({ request }) => {
  const odpoved = await request.get('/robots.txt');
  expect(odpoved.status()).toBe(200);
  expect(await odpoved.text()).toContain('Sitemap: https://posudtesami.cz/sitemap.xml');
});

test('prázdný obsah: sitemapa existuje, má jen titulní a statické stránky', async ({ request }) => {
  const odpoved = await request.get('http://localhost:4322/sitemap.xml');
  expect(odpoved.status()).toBe(200);
  const cesty = vSitemape(await odpoved.text());
  expect(cesty).toContain('/');
  expect(cesty).toContain('/metodika/');
  expect(cesty.some(c => c.startsWith('/kauzy/'))).toBe(false);
  expect(cesty.some(c => c.startsWith('/pravidla/'))).toBe(false);
});
```

- [ ] **Step 6: Run the e2e test**

Run: `npm run e2e -- tests/e2e/sitemap.spec.ts`
Expected: PASS (4 testy).

Pokud padne první test na rozdílu v `/pravidla/oblasti/...`, zkontroluj, že `adresy()` bere oblasti z `nactiOblasti()` a ne ze seznamu tras — ve fixtures oblasti existují, ve skutečném obsahu ne.

- [ ] **Step 7: Run full suite**

Run: `npm test && npm run e2e`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/sitemap.ts src/pages/sitemap.xml.ts tests/unit/sitemap.test.ts tests/e2e/sitemap.spec.ts
git commit -m "Sitemapa z obsahu, s lastmod z data ověření"
```

---

### Task 4: Nadpis stránky je název kauzy

Dnes mají všechny stránky kauz `<h1>` „Za půl roku si to jinak nikdo nebude pamatovat.“ a stránky pravidel `<h1>` „Komu prospívají nová pravidla?“. Název kauzy je až `<h2 id="detail-nadpis">`.

**Vizuální změna musí být nulová.** `src/styles/hlavni.css` cílí na `.hero h1` na osmi místech a `src/styles/upravy.css` na jednom; `.hero p` má na řádku 442 vlastní pravidlo. Proto se nadpis **nejprve otagguje třídou `u2-titul`** a selektory se přepíšou na tu třídu — až potom se dá vyměnit element za `<p>`.

**Pozor na druhou polovinu změny.** Demotovat hero nadpis nestačí: na stránkách `/pravidla/<slug>/` a `/pravidla/oblasti/<oblast>/` je nadpis v detailu taky `<h2>`, takže by tyhle stránky zůstaly **úplně bez `<h1>`**. Nadpis detailu se proto musí promotovat ve všech třech detailech (kauza, pravidlo, oblast).

**Files:**
- Modify: `src/styles/hlavni.css:33,216,217,309,368,383,392,393,394,442`
- Modify: `src/styles/pravidla.css:99,128`
- Modify: `src/styles/upravy.css:106`
- Modify: `src/components/Uvod.astro`
- Modify: `src/components/HlavniStranka.astro` (předání vlastnosti)
- Modify: `src/components/PrehledPravidel.astro:56` (hero)
- Modify: `src/components/Detail.astro:29` (`<h2 id="detail-nadpis">`)
- Modify: `src/components/DetailPravidla.astro:45`
- Modify: `src/components/DetailOblasti.astro:30`
- Modify: `src/pages/kauzy/[slug].astro`, `src/pages/pravidla/[slug].astro`, `src/pages/pravidla/oblasti/[oblast].astro` (předání vlastnosti)
- **Nemodifikovat:** `src/pages/pravidla/[...prehled].astro` — přehled vykresluje `<DetailPravidla slot="detail" />` bez záznamu, takže v něm žádný nadpis nevzniká a hero si `<h1>` správně nechává.
- Create: `tests/e2e/nadpisy.spec.ts`

**Interfaces:**
- Consumes: nic z dřívějších úkolů.
- Produces: `Uvod.astro` přijímá `jakoNadpis?: boolean` (výchozí `true`); `Detail.astro`, `DetailPravidla.astro` a `DetailOblasti.astro` přijímají `jakoNadpis?: boolean` (výchozí `false`).

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/nadpisy.spec.ts
import { test, expect } from '@playwright/test';

/** Nadpisy se čtou z HTML po načtení, před otevřením dalšího detailu klientským skriptem. */
const nadpisy = (page: import('@playwright/test').Page) =>
  page.locator('h1').evaluateAll(els => els.map(e => e.textContent!.replace(/\s+/g, ' ').trim()));

test('titulní stránka má jeden h1 a je to slogan archivu', async ({ page }) => {
  await page.goto('/');
  expect(await nadpisy(page)).toEqual(['Za půl roku si to jinak nikdo nebude pamatovat.']);
});

test('stránka kauzy má jeden h1 a je to název kauzy', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  expect(await nadpisy(page)).toEqual(['Testovací kauza Alfa']);
});

test('přehled pravidel má jeden h1 a je to otázka přehledu', async ({ page }) => {
  await page.goto('/pravidla/');
  expect(await nadpisy(page)).toEqual(['Komu prospívají nová pravidla?']);
});

test('stránka pravidla má jeden h1 a je to název pravidla', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  expect(await nadpisy(page)).toEqual(['Testovací novela zákona Omega s dlouhým názvem pro mobil']);
});

test('stránka oblasti má jeden h1 a je to název oblasti', async ({ page }) => {
  await page.goto('/pravidla/oblasti/dotace-stret-zajmu/');
  expect(await nadpisy(page)).toEqual(['Dotace a střet zájmů']);
});

test('slogan na stránce kauzy zůstává vizuálně stejný jako na titulní', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const naTitulni = await page.locator('.hero .u2-titul').evaluate(e => {
    const s = getComputedStyle(e);
    return { velikost: s.fontSize, rodina: s.fontFamily, radek: s.lineHeight, tloustka: s.fontWeight };
  });
  await page.goto('/kauzy/alfa-dotace/');
  await page.evaluate(() => document.fonts.ready);
  const naKauze = await page.locator('.hero .u2-titul').evaluate(e => {
    const s = getComputedStyle(e);
    return { velikost: s.fontSize, rodina: s.fontFamily, radek: s.lineHeight, tloustka: s.fontWeight };
  });
  expect(naKauze).toEqual(naTitulni);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run e2e -- tests/e2e/nadpisy.spec.ts`
Expected: FAIL — test na stránku kauzy vrátí slogan místo názvu kauzy; test na vzhled selže, protože `.hero .u2-titul` neexistuje.

- [ ] **Step 3: Otagovat nadpis třídou a přepsat selektory**

V `src/components/Uvod.astro` nahraď celý soubor:

```astro
---
interface Props { jakoNadpis?: boolean }
const { jakoNadpis = true } = Astro.props;
const SLOGAN = 'Za půl roku si to jinak nikdo nebude pamatovat.';
---
<section class="hero u2">
  <p class="u2-nad">Archiv kauz Andreje Babiše</p>
  {/* Na stránce kauzy není slogan nadpisem stránky — tím je název kauzy v detailu — ale vypadá stejně. */}
  {jakoNadpis
    ? <h1 class="u2-titul">{SLOGAN}</h1>
    : <p class="u2-titul">{SLOGAN}</p>}
  <p class="u2-pod">Proto je to tady zapsané, se zdrojem u každého tvrzení a se stanoviskem dotčené strany.</p>
</section>
```

Text sloganu je přepsaný z `main` @ 2ec7cf2 znak po znaku, včetně „si to **jinak** nikdo“. Pokud se mezitím změnil, zkopíruj aktuální podobu z `src/components/Uvod.astro` a nic v ní nepřepisuj.

V `src/styles/hlavni.css` přepiš selektory tak, aby mířily na třídu, ne na element:

- řádek 33: `.hero h1 {` → `.hero .u2-titul {`
- řádek 216: `  .hero h1 { font-size: 30px !important; }` → `  .hero .u2-titul { font-size: 30px !important; }`
- řádek 217: `  .hero h1 span {` → `  .hero .u2-titul span {`
- řádek 309: `.m2-hlava h2 {` → `.m2-hlava :is(h1, h2) {`
- řádek 368: `  .m2-hlava h2 { font-size: 26px; }` → `  .m2-hlava :is(h1, h2) { font-size: 26px; }`
- řádek 383: `.hero h1, .m2-hlava h2, .brand {` → `.hero .u2-titul, .m2-hlava :is(h1, h2), .brand {`
- řádek 392: `.hero.u2 h1 {` → `.hero.u2 .u2-titul {`
- řádek 393: `.hero.u2 h1 span {` → `.hero.u2 .u2-titul span {`
- řádek 394: `.hero.u2 h1 { font-size: 24px; }` → `.hero.u2 .u2-titul { font-size: 24px; }`
- řádek 442: `.top nav a, .hero h1, .hero p, …` → `.top nav a, .hero .u2-titul, .hero p, …`

V `src/styles/upravy.css` řádek 106: `body .hero.u2 h1 {` → `body .hero.u2 .u2-titul {`

V `src/styles/pravidla.css` přepiš nadpis detailu pravidla na obě úrovně:

- řádek 99: `  .pravidlo .m2-hlava h2 {` → `  .pravidlo .m2-hlava :is(h1, h2) {`
- řádek 128: `  .pravidlo .m2-hlava h2 {` → `  .pravidlo .m2-hlava :is(h1, h2) {`

Bez téhle úpravy dostane nadpis pravidla na stránce `/pravidla/zakon-omega/` velikost ze `hlavni.css` (až 42 px) místo mobilních 22 px a padne `tests/e2e/pravidla-detail.spec.ts:60`, který právě tohle hlídá.

**`src/styles/stranky.css` nech být.** Jeho `.hero h1` na řádcích 33, 216, 217 patří stránkám `metodika`, `o-projektu` a `404`, kde je `<h1>` skutečný nadpis a nemění se.

- [ ] **Step 4: Předat vlastnost a vyměnit nadpis detailu**

V `src/components/HlavniStranka.astro` nahraď `<Uvod />` za:

```astro
    <Uvod jakoNadpis={!otevrena} />
```

V `src/components/PrehledPravidel.astro` nahraď na řádku 56

```astro
      <h1>Komu prospívají nová pravidla?</h1>
```

za

```astro
      {otevrena
        ? <p class="u2-titul">Komu prospívají nová pravidla?</p>
        : <h1 class="u2-titul">Komu prospívají nová pravidla?</h1>}
```

(`otevrena` je proměnná, kterou si `PrehledPravidel.astro` už počítá pár řádků nad `<Zaklad>`: `otevrene?.slug ?? (otevrenaOblast ? ... : undefined)`. Je neprázdná právě na stránce pravidla nebo oblasti, a prázdná na přehledu `/pravidla/`.)

V `src/components/Detail.astro` doplň do `interface Props` vlastnost `jakoNadpis?: boolean`, do destrukturalizace `jakoNadpis = false`, a nahraď

```astro
        <h2 id="detail-nadpis">{k.nazev}</h2>
```

za

```astro
        {jakoNadpis ? <h1 id="detail-nadpis">{k.nazev}</h1> : <h2 id="detail-nadpis">{k.nazev}</h2>}
```

Stejnou úpravu udělej v `src/components/DetailPravidla.astro` (řádek 45) a `src/components/DetailOblasti.astro` (řádek 30) — oba mají `<h2 id="detail-nadpis">`, oba dostanou vlastnost `jakoNadpis?: boolean` s výchozí hodnotou `false`:

```astro
        {jakoNadpis ? <h1 id="detail-nadpis">{p.nazev}</h1> : <h2 id="detail-nadpis">{p.nazev}</h2>}
```

(v `DetailOblasti.astro` je proměnná `o.nazev`, nikoli `p.nazev`, a nadpis není vnořený v `{p && (…)}`).

Předej vlastnost ze všech tří stránek s detailem:

```astro
<!-- src/pages/kauzy/[slug].astro -->
  <Detail slot="detail" zaznam={zaznam} vazby={vazby} naMapu={maMapu()} jakoNadpis />
```

```astro
<!-- src/pages/pravidla/[slug].astro -->
  <DetailPravidla slot="detail" zaznam={zaznam} jakoNadpis />
```

```astro
<!-- src/pages/pravidla/oblasti/[oblast].astro -->
  <DetailOblasti slot="detail" oblast={o} jakoNadpis />
```

**Proč takhle:** `aria-labelledby="detail-nadpis"` na dialogu zůstává funkční, protože se mění jen název elementu, ne `id`. Dialog na titulní stránce se vykresluje prázdný, takže tam druhý `<h1>` ze serveru nevznikne. Po klientském otevření detailu na titulní stránce se do dialogu vloží HTML ze stránky kauzy, které `<h1>` obsahuje — v DOMu pak krátce existují dva `<h1>`. Crawler to nikdy neuvidí (pracuje se statickým HTML) a axe pravidlo na počet `<h1>` nemá; proto to test kontroluje jen po načtení stránky.

- [ ] **Step 5: Run the e2e test**

Run: `npm run e2e -- tests/e2e/nadpisy.spec.ts`
Expected: PASS (6 testů).

- [ ] **Step 6: Ověřit, že se nic nerozsypalo**

Run: `npm run e2e -- tests/e2e/bez-posouvani.spec.ts tests/e2e/pohyb.spec.ts tests/e2e/pristupnost.spec.ts tests/e2e/nazvy.spec.ts tests/e2e/pravidla-detail.spec.ts tests/e2e/pravidla-oblasti-detail.spec.ts tests/e2e/modal-obsah.spec.ts`
Expected: PASS. Tyhle testy hlídají rozměry, přístupnost a velikost nadpisu detailu; změna velikosti písma by je shodila. `pravidla-detail.spec.ts:60` je přímý hlídač toho, že se `:is(h1, h2)` nezapomnělo v `pravidla.css`.

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Uvod.astro src/components/HlavniStranka.astro src/components/PrehledPravidel.astro src/components/Detail.astro src/components/DetailPravidla.astro src/components/DetailOblasti.astro src/pages/kauzy/\[slug\].astro src/pages/pravidla/\[slug\].astro src/pages/pravidla/oblasti/\[oblast\].astro src/styles/hlavni.css src/styles/pravidla.css src/styles/upravy.css tests/e2e/nadpisy.spec.ts
git commit -m "Nadpisem stránky je název kauzy, pravidla i oblasti; slogan zůstává vizuálně stejný"
```

---

### Task 5: Titulky s roky a zkrácené popisy

**Files:**
- Modify: `src/lib/web.ts`
- Modify: `tests/unit/web.test.ts`
- Modify: `src/components/HlavniStranka.astro`
- Modify: `src/layouts/Zaklad.astro` (popis projde zkrácením)
- Modify: `tests/e2e/detail.spec.ts:11`

**Interfaces:**
- Consumes: `WEB`, `titulek` z úkolu 1.
- Produces: `MAX_TITULEK = 65`, `MAX_POPIS = 155`, `titulekKauzy(nazev: string, od: number, doRok: number | null): string`, `popisKratky(text: string): string`.

- [ ] **Step 1: Write the failing test**

Přidej do `tests/unit/web.test.ts`:

```ts
import { MAX_TITULEK, MAX_POPIS, titulekKauzy, popisKratky } from '../../src/lib/web';

describe('titulekKauzy', () => {
  it('uzavřená kauza má v titulku rozsah let', () => {
    expect(titulekKauzy('Čapí hnízdo', 2007, 2026))
      .toBe('Čapí hnízdo 2007–2026: časová osa a zdroje — Posuďte sami');
  });

  it('jednoletá kauza má jen jeden rok', () => {
    expect(titulekKauzy('Omluva Filipové', 2024, 2024))
      .toBe('Omluva Filipové 2024: časová osa a zdroje — Posuďte sami');
  });

  it('neuzavřená kauza (do: null) píše „dosud“, nikdy null', () => {
    const t = titulekKauzy('Testovací kauza Alfa', 2007, null);
    expect(t).toContain('2007–dosud');
    expect(t).not.toContain('null');
  });

  it('dlouhý název spadne na kratší variantu a drží limit', () => {
    const nazev = 'A'.repeat(36); // horní hranice názvu kauzy podle schema.ts
    const t = titulekKauzy(nazev, 2007, null);
    expect(t.length).toBeLessThanOrEqual(MAX_TITULEK);
    expect(t).toContain(nazev);
    expect(t).toContain('Posuďte sami');
  });
});

describe('popisKratky', () => {
  it('krátký text nechá být', () => {
    expect(popisKratky('Krátké shrnutí.')).toBe('Krátké shrnutí.');
  });

  it('dlouhý text zkrátí na hranici slova a doplní výpustku', () => {
    const dlouhy = 'Fiktivní firma Alfa získala fiktivní dotaci padesát milionů korun pro malé podniky, přestože podle fiktivního městského soudu podmínky programu nesplňovala ani zdaleka.';
    const k = popisKratky(dlouhy);
    expect(k.length).toBeLessThanOrEqual(MAX_POPIS + 1);
    expect(k.endsWith('…')).toBe(true);
    expect(k).not.toMatch(/\s…$/);
    expect(dlouhy.startsWith(k.slice(0, -1))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/web.test.ts`
Expected: FAIL — `titulekKauzy is not a function`.

- [ ] **Step 3: Write minimal implementation**

Přidej do `src/lib/web.ts`:

```ts
/** Google ukazuje v titulku asi 60–65 znaků, zbytek odřízne. */
export const MAX_TITULEK = 65;
/** Delší popis Google ve výsledku zkrátí sám, a to i uprostřed slova. */
export const MAX_POPIS = 155;

const rozsahLet = (od: number, doRok: number | null): string =>
  doRok === null ? `${od}–dosud` : od === doRok ? String(od) : `${od}–${doRok}`;

/** Titulek stránky kauzy. Roky v titulku berou dotazy typu „čapí hnízdo 2008“.
 *  U dlouhých názvů (limit je 36 znaků) se vypustí prostřední část, ať se titulek vejde. */
export function titulekKauzy(nazev: string, od: number, doRok: number | null): string {
  const roky = rozsahLet(od, doRok);
  const plny = titulek(`${nazev} ${roky}: časová osa a zdroje`);
  if (plny.length <= MAX_TITULEK) return plny;
  const kratsi = titulek(`${nazev} ${roky}`);
  return kratsi.length <= MAX_TITULEK ? kratsi : titulek(nazev);
}

/** Popis stránky pro vyhledávače: zkrátí na hranici slova, ať Google neřízne uprostřed. */
export function popisKratky(text: string): string {
  if (text.length <= MAX_POPIS) return text;
  const rez = text.slice(0, MAX_POPIS);
  const mezera = rez.lastIndexOf(' ');
  return rez.slice(0, mezera > 0 ? mezera : MAX_POPIS).replace(/[\s,;:.–—-]+$/, '') + '…';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/web.test.ts`
Expected: PASS.

- [ ] **Step 5: Použít v šablonách**

V `src/components/HlavniStranka.astro` nahraď řádek s titulkem:

```ts
const titulek = nazevStranky(otevrena ? otevrena.kauza.nazev : 'Archiv kauz Andreje Babiše');
```

za

```ts
const titulek = otevrena
  ? titulekKauzy(otevrena.kauza.nazev, otevrena.kauza.od, otevrena.kauza.do)
  : nazevStranky('Archiv kauz Andreje Babiše');
```

a doplň `titulekKauzy` do importu z `../lib/web`.

V `src/layouts/Zaklad.astro` nech vstupní vlastnost `popis` beze změny, ale použij zkrácenou verzi v obou metaznačkách. Do frontmatteru přidej

```ts
const popisProVyhledavace = popisKratky(popis);
```

(`popisKratky` doplň do importu z `../lib/web`) a v `<head>` nahraď

```astro
  <meta name="description" content={popis}>
```

za

```astro
  <meta name="description" content={popisProVyhledavace}>
```

a

```astro
  <meta property="og:description" content={popis}>
```

za

```astro
  <meta property="og:description" content={popisProVyhledavace}>
```

- [ ] **Step 6: Upravit e2e očekávání titulku**

V `tests/e2e/detail.spec.ts` na řádku 11 nahraď

```ts
  await expect(page).toHaveTitle('Testovací kauza Alfa — Posuďte sami');
```

za

```ts
  // „Testovací kauza Alfa“ (20 znaků) + rozsah let už se s celým vzorcem nevejde do 65 znaků,
  // takže titulek spadne na kratší variantu bez „: časová osa a zdroje“.
  await expect(page).toHaveTitle('Testovací kauza Alfa 2007–dosud — Posuďte sami');
```

Ostatní čtyři testy na titulek (`hlasovani-stranka.spec.ts`, `pravidla-detail.spec.ts` 2×, `pravidla-oblasti-detail.spec.ts`, `pravidla-prehled.spec.ts`) se **nemění** — vzorec s roky platí jen pro kauzy.

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: PASS.

Run: `npm run e2e`
Expected: PASS. Pokud `detail.spec.ts` padne na jiném titulku, než je výše, vypiš skutečnou hodnotu a oprav očekávání podle `titulekKauzy` — nikoli naopak.

- [ ] **Step 8: Commit**

```bash
git add src/lib/web.ts tests/unit/web.test.ts src/components/HlavniStranka.astro src/layouts/Zaklad.astro tests/e2e/detail.spec.ts
git commit -m "Titulky kauz s rozsahem let, popisy zkrácené na hranici slova"
```

---

### Task 6: Strukturovaná data (JSON-LD)

**Files:**
- Create: `src/lib/jsonld.ts`
- Create: `src/components/StrukturovanaData.astro`
- Create: `tests/unit/jsonld.test.ts`
- Create: `tests/e2e/jsonld.spec.ts`
- Modify: `src/layouts/Zaklad.astro`
- Modify: `src/components/HlavniStranka.astro`
- Modify: `src/pages/kauzy/[slug].astro`

**Interfaces:**
- Consumes: `WEB` z úkolu 1; typ `KauzaZaznam` z `src/lib/validace.ts`; `kauzaSchema` z `src/lib/schema.ts` (jen v testu).
- Produces: `BABIS_WIKIDATA`, `AGROFERT_WIKIDATA`, `organizace(): object`, `webJsonLd(): object`, `kauzaJsonLd(zaznam: KauzaZaznam): object`; `Zaklad.astro` přijímá `jsonLd?: object | object[]`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/jsonld.test.ts
import { describe, it, expect } from 'vitest';
import { webJsonLd, kauzaJsonLd, BABIS_WIKIDATA, AGROFERT_WIKIDATA } from '../../src/lib/jsonld';
import { kauzaSchema } from '../../src/lib/schema';
import { platnaKauza } from './ukazka';

// ukazka.ts vrací surový objekt; teprve kauzaSchema.parse doplní výchozí hodnoty
// (opravy, akteri, navazuje, castky jako prázdná pole), se kterými jsonld.ts počítá.
const KAUZA = kauzaSchema.parse(platnaKauza());
const zaznam = { slug: 'alfa-dotace', kauza: KAUZA, telo: '' };

describe('webJsonLd', () => {
  it('popisuje web a vydavatele', () => {
    const d = webJsonLd() as any;
    expect(d['@type']).toBe('WebSite');
    expect(d.url).toBe('https://posudtesami.cz/');
    expect(d.publisher['@type']).toBe('Organization');
    expect(d.publisher.name).toBe('Posuďte sami');
  });

  it('nenabízí SearchAction, hledání je klientské', () => {
    expect(JSON.stringify(webJsonLd())).not.toContain('SearchAction');
  });
});

describe('kauzaJsonLd', () => {
  it('je Article s nadpisem, adresou a datem úpravy z data ověření', () => {
    const d = kauzaJsonLd(zaznam) as any;
    expect(d['@type']).toBe('Article');
    expect(d.headline).toBe(KAUZA.nazev);
    expect(d.mainEntityOfPage).toBe('https://posudtesami.cz/kauzy/alfa-dotace/');
    expect(d.dateModified).toBe(KAUZA.overeno);
  });

  it('nevymýšlí datum vydání', () => {
    expect(JSON.stringify(kauzaJsonLd(zaznam))).not.toContain('datePublished');
  });

  it('vypíše všechny zdroje jako citace s vydavatelem', () => {
    const d = kauzaJsonLd(zaznam) as any;
    expect(d.citation).toHaveLength(KAUZA.zdroje.length);
    expect(d.citation[0]).toMatchObject({
      '@type': 'CreativeWork',
      name: KAUZA.zdroje[0].titulek,
      url: KAUZA.zdroje[0].url,
      publisher: { '@type': 'Organization', name: KAUZA.zdroje[0].vydavatel },
    });
  });

  it('napojuje kauzu na entity ve Wikidatech', () => {
    const o = JSON.stringify((kauzaJsonLd(zaznam) as any).about);
    expect(o).toContain(BABIS_WIKIDATA);
    expect(o).toContain(AGROFERT_WIKIDATA);
  });

  it('má drobečkovou navigaci na tři úrovně', () => {
    const b = (kauzaJsonLd(zaznam) as any).breadcrumb;
    expect(b['@type']).toBe('BreadcrumbList');
    expect(b.itemListElement.map((p: any) => p.position)).toEqual([1, 2, 3]);
    expect(b.itemListElement[2].name).toBe(KAUZA.nazev);
  });

  it('text s uvozovkami a ampersandem projde JSON bez poškození', () => {
    const rozbitna = { ...zaznam, kauza: { ...KAUZA, nazev: 'Kauza "X" & spol.', shrnuti: 'Shrnutí s <ostrými> znaky & "uvozovkami".' } };
    const text = JSON.stringify(kauzaJsonLd(rozbitna as any));
    expect(JSON.parse(text).headline).toBe('Kauza "X" & spol.');
    expect(text).not.toContain('</script');
  });
});
```

Do `tests/unit/ukazka.ts` nic nepřidávej — `platnaKauza()` tam už je a používají ji i ostatní testy.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/jsonld.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/lib/jsonld"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/jsonld.ts
import type { KauzaZaznam } from './validace';
import { WEB } from './web';

/** Entity, které Google už zná. Napojení přes sameAs je v celém zadání jediná věc,
 *  která působí přímo na obecné dotazy („Babiš kauzy“). Identifikátory ověřeny na wikidata.org. */
export const BABIS_WIKIDATA = 'https://www.wikidata.org/wiki/Q10819807';
export const AGROFERT_WIKIDATA = 'https://www.wikidata.org/wiki/Q5374450';

const adresa = (cesta: string): string => `${WEB.domena}${cesta}`;

export const organizace = () => ({
  '@type': 'Organization',
  name: WEB.nazev,
  url: adresa('/'),
  description: WEB.popis,
});

export const webJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: WEB.nazev,
  url: adresa('/'),
  description: WEB.popis,
  inLanguage: 'cs',
  publisher: organizace(),
});

const drobecky = (nazev: string, cesta: string) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Domů', item: adresa('/') },
    { '@type': 'ListItem', position: 2, name: 'Kauzy', item: adresa('/') },
    { '@type': 'ListItem', position: 3, name: nazev, item: adresa(cesta) },
  ],
});

export function kauzaJsonLd({ slug, kauza }: KauzaZaznam) {
  const cesta = `/kauzy/${slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: kauza.nazev,
    description: kauza.shrnuti,
    inLanguage: 'cs',
    mainEntityOfPage: adresa(cesta),
    // datum vydání nemáme a nebudeme ho vymýšlet; overeno je datum poslední kontroly
    ...(kauza.overeno ? { dateModified: kauza.overeno } : {}),
    publisher: organizace(),
    about: [
      { '@type': 'Person', name: 'Andrej Babiš', sameAs: BABIS_WIKIDATA },
      { '@type': 'Organization', name: 'Agrofert', sameAs: AGROFERT_WIKIDATA },
    ],
    citation: kauza.zdroje.map(z => ({
      '@type': 'CreativeWork',
      name: z.titulek,
      url: z.url,
      datePublished: z.datum,
      publisher: { '@type': 'Organization', name: z.vydavatel },
    })),
    ...(kauza.opravy.length
      ? { correction: kauza.opravy.map(o => ({ '@type': 'CorrectionComment', text: o.popis, dateCreated: o.datum })) }
      : {}),
    breadcrumb: drobecky(kauza.nazev, cesta),
  };
}
```

```astro
---
// src/components/StrukturovanaData.astro
interface Props { data: object | object[] }
const { data } = Astro.props;
const seznam = Array.isArray(data) ? data : [data];
/** </script> uvnitř JSON by ukončil blok skriptu; escapuje se lomítko, JSON zůstane platný. */
const bezpecne = (d: object) => JSON.stringify(d).replace(/<\//g, '<\\/');
---
{seznam.map(d => <script type="application/ld+json" set:html={bezpecne(d)} is:inline />)}
```

V `src/layouts/Zaklad.astro` doplň do `interface Props` vlastnost `jsonLd?: object | object[]`, do destrukturalizace `jsonLd`, import komponenty a do `<head>` před `</head>`:

```astro
  {jsonLd && <StrukturovanaData data={jsonLd} />}
```

V `src/components/HlavniStranka.astro` doplň import `import { webJsonLd, kauzaJsonLd } from '../lib/jsonld';` a předej `Zakladu`:

```astro
<Zaklad … jsonLd={otevrena ? kauzaJsonLd(otevrena) : webJsonLd()}>
```

(doplň jen vlastnost `jsonLd`, ostatní vlastnosti nech, jak jsou).

Stránka `src/pages/kauzy/[slug].astro` nepotřebuje nic — `HlavniStranka` dostává `otevrena` a rozhodne sama.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/jsonld.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the e2e test**

```ts
// tests/e2e/jsonld.spec.ts
import { test, expect } from '@playwright/test';

const data = async (page: import('@playwright/test').Page) =>
  (await page.locator('script[type="application/ld+json"]').allTextContents()).map(t => JSON.parse(t));

test('titulní stránka nese platný WebSite', async ({ page }) => {
  await page.goto('/');
  const d = await data(page);
  expect(d).toHaveLength(1);
  expect(d[0]['@type']).toBe('WebSite');
});

test('stránka kauzy nese platný Article s citacemi a drobečky', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const [d] = await data(page);
  expect(d['@type']).toBe('Article');
  expect(d.headline).toBe('Testovací kauza Alfa');
  expect(d.citation.length).toBeGreaterThan(0);
  expect(d.breadcrumb.itemListElement).toHaveLength(3);
  expect(d.datePublished).toBeUndefined();
});
```

- [ ] **Step 6: Run the e2e test**

Run: `npm run e2e -- tests/e2e/jsonld.spec.ts`
Expected: PASS (2 testy).

- [ ] **Step 7: Run full suite**

Run: `npm test && npm run e2e`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/jsonld.ts src/components/StrukturovanaData.astro src/layouts/Zaklad.astro src/components/HlavniStranka.astro tests/unit/jsonld.test.ts tests/e2e/jsonld.spec.ts
git commit -m "JSON-LD: citace ze zdrojů kauzy, napojení na Wikidata, drobečky"
```

---

### Task 7: Náhledové obrázky pro kauzy

Dnes má celý web jeden `public/obrazky/nahled.png`, takže všech 33 kauz vypadá při sdílení stejně. Náhledy renderuje Playwright, který už v projektu je — žádná nová závislost. Výstup se commituje, aby nasazení zůstalo rychlé; vzor je `nastroje/stahni-fonty.mjs`.

**Files:**
- Create: `nastroje/nahledy.mjs`
- Create: `tests/unit/nahledy.test.ts`
- Modify: `package.json` (skript `nahledy`)
- Modify: `src/layouts/Zaklad.astro` (vlastní náhled + rozměry a alt)
- Modify: `src/components/HlavniStranka.astro` (předání cesty k náhledu)

**Interfaces:**
- Consumes: `WEB` z úkolu 1; `nactiKauzy` z `src/lib/kauzy.ts`.
- Produces: `public/obrazky/nahledy/<slug>.png` (1200 × 630); `Zaklad.astro` přijímá `nahledSoubor?: string`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/nahledy.test.ts
import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { nactiKauzy } from '../../src/lib/kauzy';

describe('náhledové obrázky', () => {
  it('každá zveřejněná kauza má vlastní náhled', () => {
    const chybi = nactiKauzy()
      .map(z => `public/obrazky/nahledy/${z.slug}.png`)
      .filter(c => !existsSync(c));
    expect(chybi).toEqual([]);
  });

  it('náhledy nejsou prázdné soubory', () => {
    for (const z of nactiKauzy()) {
      expect(statSync(`public/obrazky/nahledy/${z.slug}.png`).size, z.slug).toBeGreaterThan(1000);
    }
  });

  it('záložní náhled pro stránky bez vlastního zůstal', () => {
    expect(existsSync('public/obrazky/nahled.png')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/nahledy.test.ts`
Expected: FAIL — první test vypíše 33 chybějících cest.

- [ ] **Step 3: Napsat generátor**

```js
// nastroje/nahledy.mjs
// Náhledové obrázky kauz pro sdílení na sítích (1200 × 630).
// Renderuje Chromium z Playwrightu, který už je v devDependencies — kvůli náhledům
// nepřidáváme žádnou závislost. Satori by nešel: v repozitáři jsou jen woff2 fonty.
// Spuštění: npm run nahledy. Výstup se commituje, nasazení nic negeneruje.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { nactiKauzy } from '../src/lib/kauzy.ts';
import { WEB } from '../src/lib/web.ts';
import { rozsahText } from '../src/lib/casova-osa.ts';

const SIRKA = 1200, VYSKA = 630;
const VYSTUP = 'public/obrazky/nahledy';

const escapuj = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const stranka = (kauza) => `<!doctype html>
<html lang="cs"><head><meta charset="utf-8">
<style>
  ${readFileSync('src/styles/fonty.css', 'utf8')}
  * { margin: 0; box-sizing: border-box; }
  body { width: ${SIRKA}px; height: ${VYSKA}px; padding: 72px; background: #FBF9F4; color: #16130F;
         font-family: "Redaction 10", Georgia, serif; display: flex; flex-direction: column; justify-content: space-between; }
  .nad { font: 600 22px var(--f-mono, monospace); color: #DB1F2D; letter-spacing: .06em; text-transform: uppercase; }
  h1 { font-family: "Redaction 50", Georgia, serif; font-weight: 700; font-size: 82px; line-height: 1.02; letter-spacing: -0.02em; }
  .roky { font-size: 30px; color: #5B544B; margin-top: 20px; }
  .pata { display: flex; justify-content: space-between; align-items: baseline; font-size: 26px; color: #5B544B; }
  .pata strong { font-family: "Redaction 35", Georgia, serif; font-size: 32px; color: #16130F; }
</style></head>
<body>
  <p class="nad">Archiv kauz Andreje Babiše</p>
  <div>
    <h1>${escapuj(kauza.nazev)}</h1>
    <p class="roky">${escapuj(rozsahText(kauza.od, kauza.do))}</p>
  </div>
  <p class="pata"><strong>${escapuj(WEB.nazev)}</strong><span>${kauza.zdroje.length} zdrojů · ověřeno ${escapuj(kauza.overeno ?? '—')}</span></p>
</body></html>`;

const prohlizec = await chromium.launch();
const list = await prohlizec.newPage({ viewport: { width: SIRKA, height: VYSKA }, deviceScaleFactor: 1 });
mkdirSync(VYSTUP, { recursive: true });

for (const { slug, kauza } of nactiKauzy()) {
  await list.setContent(stranka(kauza), { waitUntil: 'load' });
  await list.evaluate(() => document.fonts.ready);
  writeFileSync(`${VYSTUP}/${slug}.png`, await list.screenshot({ type: 'png' }));
  console.log(`${VYSTUP}/${slug}.png`);
}

await prohlizec.close();
```

Fonty jsou v CSS adresované jako `/fonty/…`, což v `setContent` neplatí. Proto před smyčkou přesměruj požadavky na soubory:

```js
await list.route('**/fonty/*', (route) => route.fulfill({ path: 'public' + new URL(route.request().url()).pathname }));
```

(vlož hned za vytvoření `list`, před `mkdirSync`).

Do `package.json` do `scripts` přidej:

```json
    "nahledy": "tsx nastroje/nahledy.mjs",
```

(`tsx` je v devDependencies a umí importovat `.ts` moduly, které skript potřebuje.)

- [ ] **Step 4: Vygenerovat náhledy a zkontrolovat je očima**

Run: `npm run nahledy`
Expected: 33 vypsaných cest, žádná chyba.

Otevři tři náhledy (`public/obrazky/nahledy/capi-hnizdo.png`, `omluva-filipove.png` a kauzu s nejdelším názvem) a zkontroluj, že text není uříznutý, že se použilo písmo Redaction (ne Georgia) a že se dlouhý název vejde. Pokud přetéká, zmenši `h1 { font-size }` na 72 px a vygeneruj znovu.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/nahledy.test.ts`
Expected: PASS (3 testy).

- [ ] **Step 6: Použít náhled v metaznačkách**

V `src/layouts/Zaklad.astro` doplň do `interface Props` vlastnost `nahledSoubor?: string`, do destrukturalizace `nahledSoubor`, a nahraď

```ts
const nahled = new URL('/obrazky/nahled.png', Astro.site).toString();
```

za

```ts
const nahled = new URL(nahledSoubor ?? '/obrazky/nahled.png', Astro.site).toString();
```

a v `<head>` za řádek s `og:image` doplň:

```astro
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content={titulek}>
```

V `src/components/HlavniStranka.astro` předej `Zakladu` vlastnost:

```astro
<Zaklad … nahledSoubor={otevrena ? `/obrazky/nahledy/${otevrena.slug}.png` : undefined}>
```

- [ ] **Step 7: Ověřit metaznačky e2e**

Přidej do `tests/e2e/jsonld.spec.ts` (test o metaznačkách patří k témuž tématu, nový soubor není potřeba):

```ts
test('stránka kauzy má vlastní náhledový obrázek s rozměry', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  const obsah = (vlastnost: string) => page.locator(`meta[property="${vlastnost}"]`).getAttribute('content');
  expect(await obsah('og:image')).toBe('https://posudtesami.cz/obrazky/nahledy/alfa-dotace.png');
  expect(await obsah('og:image:width')).toBe('1200');
  expect(await obsah('og:image:height')).toBe('630');
  expect(await obsah('og:image:alt')).toContain('Testovací kauza Alfa');
});

test('titulní stránka má záložní náhled', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('meta[property="og:image"]').getAttribute('content'))
    .toBe('https://posudtesami.cz/obrazky/nahled.png');
});
```

**Pozor:** fixtury mají jiné slugy než skutečný obsah, takže `tests/fixtures/obsah/kauzy/alfa-dotace.md` potřebuje náhled v `public/obrazky/nahledy/alfa-dotace.png`. Vygeneruj náhledy i pro fixtury:

```bash
NV_OBSAH=tests/fixtures/obsah npm run nahledy
```

(na Windows v PowerShellu: `$env:NV_OBSAH='tests/fixtures/obsah'; npm run nahledy; $env:NV_OBSAH=$null`)

Náhledy fixtur se commitují spolu s ostatními — jsou malé a e2e je potřebuje.

- [ ] **Step 8: Run full suite**

Run: `npm test && npm run e2e`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add nastroje/nahledy.mjs package.json public/obrazky/nahledy src/layouts/Zaklad.astro src/components/HlavniStranka.astro tests/unit/nahledy.test.ts tests/e2e/jsonld.spec.ts
git commit -m "Náhledové obrázky kauz přes Playwright, bez nové závislosti"
```

---

## Co plán nedělá

Sekce 6 specu (registrace v Google Search Console, Seznam.cz Webmaster a Bing Webmaster, ověření DNS TXT, zapnutí `NASAZOVAT=ano`) je **práce zadavatele v jeho účtech**, ne kód. Po dokončení těchto sedmi úkolů je potřeba ji udělat, jinak nic z toho nebude mít efekt — web zůstane nenasazený.
