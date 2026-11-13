# Dopad na kontrolu moci: plán implementace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přidat do části „Změny pravidel“ druhý důvod zařazení „dopad na kontrolu moci“ (věcný znak a upozornění instituce nebo profesní organizace) a nové druhy pravidel usnesení vlády a pokyn ministerstva.

**Architecture:** Vše zůstává v jedné sbírce `obsah/pravidla/`. Schéma (`schema-pravidla.ts`) dostane nepovinný blok `kontrolaMoci` a nepovinný `prospech`. Uzavřené slovníky (`pravidla-slovnik.ts`) hlídají, kdo smí upozornit. Důvody zařazení se odvozují v `pravidla.ts` a používá je hledání, přehled (filtr a řádek) i detail (záložky). Metodika generuje seznamy ze slovníků.

**Tech Stack:** Astro 7 (statický výstup), `astro/zod` (Zod 4), TypeScript, Vitest, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-11-13-kontrola-moci-design.md`. Navazuje na `docs/superpowers/specs/2026-11-13-zmeny-pravidel-design.md` a plán `docs/superpowers/plans/2026-11-13-zmeny-pravidel.md` (už implementovaný v této větvi).

## Global Constraints

- Všechny texty v UI, chybových hláškách, komentářích a commitech jsou česky se správnou diakritikou. Identifikátory česky bez diakritiky (`kontrolaMoci`, `duvodyPravidla`).
- Ve vlastním textu webu se nepoužívají slova „ohýbání“, „oslabení“ ani jiná hodnocení. Ani výrazy „ušité“, „na míru“, „agrobaron“.
- Barva nesmí hodnotit důvod, stav ani závěr. Červená (`#DB1F2D`) se pro pravidla nepoužije.
- **Žádné svislé posouvání stránky, nikde.** `document.scrollingElement.scrollHeight <= innerHeight` na velikostech z `VELIKOSTI` v `tests/e2e/pomocne.ts` (1256×528, 1342×565, 1342×676, 1896×868, 390×700).
- WCAG 2.1 AA: axe bez závažných chyb, ovládání klávesnicí, viditelný fokus.
- Klientský JavaScript bez frameworku. Žádné cizí skripty ani písma.
- Stávající koncepty v `_koncepty/obsah/pravidla/` (7 pravidel, všechny jen s `prospech`) musí po změnách dál projít validací.
- Pracuje se ve worktree `C:\Users\reath\Projects\NenechmeVyhnit-pravidla`, větev `zmeny-pravidel`. Hlavní složku `C:\Users\reath\Projects\NenechmeVyhnit` nepoužívat, souběžně v ní pracují jiné relace. `_koncepty` ve worktree je propojená složka (junction) na hlavní složku. Soubory v ní tento plán nemění.
- **Spouštění testů (Windows):** Vitest i Playwright spouštět z PowerShellu po `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-pravidla'` (velké `C:`). Z Bash cesty `/c/...` Vitest padá chybou `Cannot read properties of undefined (reading 'config')`.
- **E2E a porty:** `npm run build:e2e` sestaví `dist-e2e` a `dist-prazdny`. Playwright servíruje 4321 (fixtures) a 4322 (prázdný archiv). Před během zkontroluj `netstat -ano | findstr ":4321 :4322"`. Když porty drží jiná relace, nic cizího nezastavuj. Vytvoř necommitovaný `playwright.local.config.ts` s portem 4331 pro `dist-e2e` (`baseURL: 'http://localhost:4331'`) a spusť `npx playwright test -c playwright.local.config.ts`. Prázdný archiv testy volají natvrdo na 4322. Ve worktree může běžet cizí `astro dev` na 4500 a statický náhled konceptů na 4410. Nezastavuj je.
- **Commity:** zpráva česky, končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Hooky nepřeskakovat.

## Review Focus

1. **Záznam jen s kontrolou moci v řádku přehledu.** Nesmí se objevit prázdné oddělovače („ ·  · “) ani slovo „prospěch“. → test v Task 4.
2. **Přímý odkaz na pododdíl `/metodika/#kontrola-moci`.** Kotva není id karty, ale nadpis uvnitř oddílu `pravidla`. Musí otevřít oddíl a nadpis ukázat. → test v Task 6.
3. **Filtr důvodu v kombinaci se štítkem a se „Zrušit filtry“.** Kombinace bez výsledku ukáže prázdný stav, zrušení vrátí všechny řádky a odznačí čipy důvodu. → test v Task 4.
4. **Přechod mezi pravidly bez načtení stránky:** z pravidla, kde je první záložka „Komu prospívá“, na pravidlo jen s kontrolou moci. Otevřená musí být „Kontrola moci“, ne záložka podle předchozího pravidla. → test v Task 5.
5. **Stávající koncepty jen s prospěchem** po změně schématu dál projdou. → kontrola v Task 7.

---

## Mapa souborů

| Soubor | Změna |
|---|---|
| `src/lib/pravidla-slovnik.ts` | nové druhy a cesty, důvody, druhy znaků, kontrolní instituce, upozorňovatelé, popisky |
| `src/lib/schema-pravidla.ts` | `prospech` nepovinný, blok `kontrolaMoci`, nové kontroly v `superRefine` |
| `src/lib/pravidla.ts` | `duvodyPravidla` |
| `src/lib/hledani-pravidel.ts` | důvody v položce, text znaků v hledání, filtr důvodu |
| `src/components/PrehledPravidel.astro` | nadpis, podtitul, čipy důvodu, označení v řádku |
| `src/scripts/pravidla-filtr.ts` | čipy důvodu |
| `src/components/DetailPravidla.astro` | záložka Kontrola moci, podmíněná záložka Komu prospívá, první záložka |
| `src/styles/pravidla.css`, `src/styles/hlavni.css` | seznamy znaků a upozornění, oddělovač čipů |
| `src/data/metodika.ts`, `src/data/o-projektu.ts` | pododdíl Dopad na kontrolu moci, věta o nové části |
| `src/scripts/karty.ts` | kotva na nadpis uvnitř oddílu |
| `tests/unit/ukazka.ts` | vzorové pravidlo s kontrolou moci |
| `tests/fixtures/obsah/pravidla/usneseni-kappa.md` (nový), `zakon-omega.md` | testovací data |
| `tests/unit/*.test.ts`, `tests/e2e/*.spec.ts` | testy |

---

### Task 1: Slovníky

**Files:**
- Modify: `src/lib/pravidla-slovnik.ts`
- Test: `tests/unit/pravidla-slovnik.test.ts`

**Interfaces:**
- Produces:
  - `DRUHY_PRAVIDEL` navíc s `'usneseni-vlady' | 'pokyn-ministerstva'`, `CESTY` navíc se stejnojmennými cestami.
  - `DUVODY = ['prospech', 'kontrola-moci']`, `type Duvod`, `popisekDuvodu(d: Duvod): string`.
  - `DRUHY_ZNAKU`, `type DruhZnaku`, `popisekDruhuZnaku(d: DruhZnaku): string`.
  - `KONTROLNI_INSTITUCE`, `type KontrolniInstituce`, `popisekInstituce(i, delka?: 'kratce' | 'plne'): string`.
  - `popisekZnaku(z: { druh: DruhZnaku; instituce?: KontrolniInstituce }): string`: u `instituce` krátký popisek instituce, jinak popisek druhu.
  - `UPOZORNOVATELE`, `type Upozornovatel`, `type TypUpozornovatele = 'instituce' | 'profesni-organizace'`, `upozornovatel(id): { nazev: string; typ: TypUpozornovatele }`, `popisekTypuUpozornovatele(t): string`.

- [ ] **Step 1: Napiš padající testy**

Na konec `tests/unit/pravidla-slovnik.test.ts` připiš (import doplň na začátek souboru):

```ts
import {
  DRUHY_PRAVIDEL, DUVODY, popisekDuvodu, DRUHY_ZNAKU, popisekDruhuZnaku, KONTROLNI_INSTITUCE, popisekInstituce,
  popisekZnaku, UPOZORNOVATELE, upozornovatel, popisekTypuUpozornovatele,
} from '../../src/lib/pravidla-slovnik';

describe('slovník kontroly moci', () => {
  it('nové druhy mají vlastní cestu bez vynechaných kontrol a kroky jako ostatní nezákonné druhy', () => {
    expect(DRUHY_PRAVIDEL).toContain('usneseni-vlady');
    expect(DRUHY_PRAVIDEL).toContain('pokyn-ministerstva');
    expect(cestyProDruh('usneseni-vlady')).toEqual(['usneseni-vlady']);
    expect(cestyProDruh('pokyn-ministerstva')).toEqual(['pokyn-ministerstva']);
    expect(popisekCesty('usneseni-vlady')).toBe('Usnesení vlády');
    expect(popisekCesty('pokyn-ministerstva')).toBe('Pokyn ministerstva');
    expect(vynechaneKontroly('usneseni-vlady')).toEqual([]);
    expect(vynechaneKontroly('pokyn-ministerstva')).toEqual([]);
    expect(krokyProDruh('usneseni-vlady')).toEqual(krokyProDruh('narizeni-vlady'));
    expect(prubeh('pokyn-ministerstva', [{ datum: '2026-01-01', krok: 'vyhlaseno' }]).faze.map(f => f.nazev)).toEqual(['Připomínky', 'Schváleno', 'Vyhlášeno']);
  });
  it('důvody zařazení', () => {
    expect(DUVODY).toEqual(['prospech', 'kontrola-moci']);
    expect(popisekDuvodu('prospech')).toBe('Prospěch');
    expect(popisekDuvodu('kontrola-moci')).toBe('Kontrola moci');
  });
  it('každý druh znaku, instituce a upozorňovatel má neprázdný popisek', () => {
    for (const d of DRUHY_ZNAKU) expect(popisekDruhuZnaku(d).length).toBeGreaterThan(0);
    for (const i of KONTROLNI_INSTITUCE) {
      expect(popisekInstituce(i).length).toBeGreaterThan(0);
      expect(popisekInstituce(i, 'plne').length).toBeGreaterThanOrEqual(popisekInstituce(i).length);
    }
    for (const u of UPOZORNOVATELE) {
      expect(upozornovatel(u).nazev.length).toBeGreaterThan(0);
      expect(['instituce', 'profesni-organizace']).toContain(upozornovatel(u).typ);
    }
  });
  it('uzavřené seznamy odpovídají specifikaci', () => {
    expect(DRUHY_ZNAKU).toEqual(['instituce', 'prilepek', 'legislativni-nouze', 'prvni-cteni', 'zpetna-ucinnost']);
    expect(KONTROLNI_INSTITUCE).toEqual(['soudy', 'statni-zastupitelstvi', 'nku', 'uohs', 'ombudsman', 'policie', 'media-verejne-sluzby', 'dohled-strany', 'cnb', 'pristup-k-informacim', 'registr-smluv']);
    expect(UPOZORNOVATELE.filter(u => upozornovatel(u).typ === 'instituce')).toEqual(['ustavni-soud', 'legislativni-rada-vlady', 'ombudsman', 'nku', 'evropska-komise', 'benatska-komise', 'nejvyssi-soud', 'nejvyssi-statni-zastupitelstvi', 'legislativni-odbor-snemovny']);
    expect(UPOZORNOVATELE.filter(u => upozornovatel(u).typ === 'profesni-organizace')).toEqual(['soudcovska-unie', 'unie-statnich-zastupcu', 'ceska-advokatni-komora', 'syndikat-novinaru']);
  });
  it('popisky znaků a typů', () => {
    expect(popisekZnaku({ druh: 'instituce', instituce: 'soudy' })).toBe('soudy');
    expect(popisekZnaku({ druh: 'zpetna-ucinnost' })).toBe('zpětná účinnost');
    expect(popisekZnaku({ druh: 'prilepek' })).toBe('přílepek');
    expect(popisekInstituce('dohled-strany')).toBe('dohled nad financováním stran');
    expect(popisekInstituce('dohled-strany', 'plne')).toBe('Úřad pro dohled nad hospodařením politických stran a politických hnutí');
    expect(upozornovatel('soudcovska-unie')).toEqual({ nazev: 'Soudcovská unie ČR', typ: 'profesni-organizace' });
    expect(popisekTypuUpozornovatele('profesni-organizace')).toBe('profesní organizace');
    expect(popisekTypuUpozornovatele('instituce')).toBe('instituce');
  });
});
```

- [ ] **Step 2: Spusť testy a ověř, že padají**

Run (PowerShell, ve worktree): `npx vitest run tests/unit/pravidla-slovnik.test.ts`
Expected: FAIL. Importované názvy neexistují (`DUVODY is not defined` / chyba importu).

- [ ] **Step 3: Implementuj slovníky**

V `src/lib/pravidla-slovnik.ts` uprav začátek souboru:

```ts
/** Slovníky části „Změny pravidel“ (specifikace 2026-11-13, oddíl 5, a specifikace kontroly moci, oddíl 3 a 5).
 *  Popisky sdílí web i Metodika. */
export const DRUHY_PRAVIDEL = ['zakon', 'narizeni-vlady', 'vyhlaska', 'pravidla-programu', 'usneseni-vlady', 'pokyn-ministerstva'] as const;
export type DruhPravidla = (typeof DRUHY_PRAVIDEL)[number];

export const CESTY = [
  'vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh',
  'narizeni-vlady', 'vyhlaska-ministerstva', 'pravidla-programu', 'usneseni-vlady', 'pokyn-ministerstva',
] as const;
export type Cesta = (typeof CESTY)[number];

const CESTY_DRUHU: Record<DruhPravidla, readonly Cesta[]> = {
  zakon: ['vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh'],
  'narizeni-vlady': ['narizeni-vlady'],
  vyhlaska: ['vyhlaska-ministerstva'],
  'pravidla-programu': ['pravidla-programu'],
  'usneseni-vlady': ['usneseni-vlady'],
  'pokyn-ministerstva': ['pokyn-ministerstva'],
};
export const cestyProDruh = (d: DruhPravidla): readonly Cesta[] => CESTY_DRUHU[d];

const POPISKY_CEST: Record<Cesta, string> = {
  'vladni-navrh': 'Vládní návrh zákona',
  'poslanecky-navrh': 'Poslanecký návrh zákona',
  'senatni-navrh': 'Senátní návrh zákona',
  'pozmenovaci-navrh': 'Pozměňovací návrh',
  'narizeni-vlady': 'Nařízení vlády',
  'vyhlaska-ministerstva': 'Vyhláška ministerstva',
  'pravidla-programu': 'Pravidla dotačního programu',
  'usneseni-vlady': 'Usnesení vlády',
  'pokyn-ministerstva': 'Pokyn ministerstva',
};
```

Zbytek souboru (`popisekCesty`, `vynechaneKontroly`, `KOMU`, `ZAVERY`) nech, jak je, a na konec souboru připiš:

```ts
/** Důvody zařazení (specifikace kontroly moci, oddíl 2). Neukládají se, odvozují se z bloků prospech a kontrolaMoci. */
export const DUVODY = ['prospech', 'kontrola-moci'] as const;
export type Duvod = (typeof DUVODY)[number];
const POPISKY_DUVODU: Record<Duvod, string> = { prospech: 'Prospěch', 'kontrola-moci': 'Kontrola moci' };
export const popisekDuvodu = (d: Duvod): string => POPISKY_DUVODU[d];

/** Věcné znaky dopadu na kontrolu moci: jeden institucionální, ostatní procedurální. */
export const DRUHY_ZNAKU = ['instituce', 'prilepek', 'legislativni-nouze', 'prvni-cteni', 'zpetna-ucinnost'] as const;
export type DruhZnaku = (typeof DRUHY_ZNAKU)[number];
const POPISKY_ZNAKU: Record<DruhZnaku, string> = {
  instituce: 'mění kontrolní instituci',
  prilepek: 'přílepek',
  'legislativni-nouze': 'legislativní nouze',
  'prvni-cteni': 'schválení v prvním čtení',
  'zpetna-ucinnost': 'zpětná účinnost',
};
export const popisekDruhuZnaku = (d: DruhZnaku): string => POPISKY_ZNAKU[d];

export const KONTROLNI_INSTITUCE = [
  'soudy', 'statni-zastupitelstvi', 'nku', 'uohs', 'ombudsman', 'policie', 'media-verejne-sluzby',
  'dohled-strany', 'cnb', 'pristup-k-informacim', 'registr-smluv',
] as const;
export type KontrolniInstituce = (typeof KONTROLNI_INSTITUCE)[number];
/** Krátký popisek se vejde do řádku přehledu, plný je pro Metodiku. */
const POPISKY_INSTITUCI: Record<KontrolniInstituce, { kratce: string; plne: string }> = {
  soudy: { kratce: 'soudy', plne: 'soudy' },
  'statni-zastupitelstvi': { kratce: 'státní zastupitelství', plne: 'státní zastupitelství' },
  nku: { kratce: 'NKÚ', plne: 'Nejvyšší kontrolní úřad' },
  uohs: { kratce: 'ÚOHS', plne: 'Úřad pro ochranu hospodářské soutěže' },
  ombudsman: { kratce: 'ombudsman', plne: 'veřejný ochránce práv' },
  policie: { kratce: 'policie a GIBS', plne: 'policie a Generální inspekce bezpečnostních sborů' },
  'media-verejne-sluzby': { kratce: 'ČT a ČRo', plne: 'Česká televize a Český rozhlas' },
  'dohled-strany': { kratce: 'dohled nad financováním stran', plne: 'Úřad pro dohled nad hospodařením politických stran a politických hnutí' },
  cnb: { kratce: 'ČNB', plne: 'Česká národní banka' },
  'pristup-k-informacim': { kratce: 'přístup k informacím', plne: 'svobodný přístup k informacím' },
  'registr-smluv': { kratce: 'registr smluv', plne: 'registr smluv' },
};
export const popisekInstituce = (i: KontrolniInstituce, delka: 'kratce' | 'plne' = 'kratce'): string => POPISKY_INSTITUCI[i][delka];
export const popisekZnaku = (z: { druh: DruhZnaku; instituce?: KontrolniInstituce }): string =>
  z.druh === 'instituce' && z.instituce ? popisekInstituce(z.instituce) : popisekDruhuZnaku(z.druh);

/** Kdo smí upozornit na znak (podmínka 4 testu). Uzavřený seznam: rozšíření je změna metodiky a jde přes PR se zdůvodněním. */
export type TypUpozornovatele = 'instituce' | 'profesni-organizace';
const UPOZORNOVATELE_DATA = {
  'ustavni-soud': { nazev: 'Ústavní soud', typ: 'instituce' },
  'legislativni-rada-vlady': { nazev: 'Legislativní rada vlády', typ: 'instituce' },
  ombudsman: { nazev: 'Veřejný ochránce práv', typ: 'instituce' },
  nku: { nazev: 'Nejvyšší kontrolní úřad', typ: 'instituce' },
  'evropska-komise': { nazev: 'Evropská komise', typ: 'instituce' },
  'benatska-komise': { nazev: 'Benátská komise', typ: 'instituce' },
  'nejvyssi-soud': { nazev: 'Nejvyšší soud', typ: 'instituce' },
  'nejvyssi-statni-zastupitelstvi': { nazev: 'Nejvyšší státní zastupitelství', typ: 'instituce' },
  'legislativni-odbor-snemovny': { nazev: 'Legislativní odbor Kanceláře Poslanecké sněmovny', typ: 'instituce' },
  'soudcovska-unie': { nazev: 'Soudcovská unie ČR', typ: 'profesni-organizace' },
  'unie-statnich-zastupcu': { nazev: 'Unie státních zástupců ČR', typ: 'profesni-organizace' },
  'ceska-advokatni-komora': { nazev: 'Česká advokátní komora', typ: 'profesni-organizace' },
  'syndikat-novinaru': { nazev: 'Syndikát novinářů ČR', typ: 'profesni-organizace' },
} as const satisfies Record<string, { nazev: string; typ: TypUpozornovatele }>;
export type Upozornovatel = keyof typeof UPOZORNOVATELE_DATA;
export const UPOZORNOVATELE = Object.keys(UPOZORNOVATELE_DATA) as [Upozornovatel, ...Upozornovatel[]];
export const upozornovatel = (id: Upozornovatel): { nazev: string; typ: TypUpozornovatele } => UPOZORNOVATELE_DATA[id];
const POPISKY_TYPU: Record<TypUpozornovatele, string> = { instituce: 'instituce', 'profesni-organizace': 'profesní organizace' };
export const popisekTypuUpozornovatele = (t: TypUpozornovatele): string => POPISKY_TYPU[t];
```

Do importu v testu doplň i `krokyProDruh` a `prubeh`, pokud tam ještě nejsou (jsou v druhém importu ze `pravidla-stavy`).

- [ ] **Step 4: Spusť testy a ověř, že projdou**

Run: `npx vitest run tests/unit/pravidla-slovnik.test.ts`
Expected: PASS (všechny testy včetně stávajících).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pravidla-slovnik.ts tests/unit/pravidla-slovnik.test.ts
git commit -m "Slovníky kontroly moci: nové druhy pravidel, důvody, znaky, instituce a kdo smí upozornit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Schéma a odvození důvodů

**Files:**
- Modify: `src/lib/schema-pravidla.ts`, `src/lib/pravidla.ts`
- Modify: `tests/unit/ukazka.ts`
- Test: `tests/unit/schema-pravidla.test.ts`

**Interfaces:**
- Consumes: `DRUHY_ZNAKU`, `KONTROLNI_INSTITUCE`, `UPOZORNOVATELE`, `type Duvod` z Task 1.
- Produces:
  - `Pravidlo['prospech']` je nově `… | undefined`.
  - `Pravidlo['kontrolaMoci']`: `{ znaky: { druh: DruhZnaku; instituce?: KontrolniInstituce; text: string; zdroje: number[] }[]; upozorneni: { kdo: Upozornovatel; text: string; zdroje: number[] }[] } | undefined`.
  - `duvodyPravidla(p: Pick<Pravidlo, 'prospech' | 'kontrolaMoci'>): Duvod[]` v `src/lib/pravidla.ts`, pořadí vždy `prospech`, `kontrola-moci`.
  - `platnePravidloKontrolaMoci(): Record<string, unknown>` v `tests/unit/ukazka.ts`.

- [ ] **Step 1: Přidej vzorové pravidlo s kontrolou moci**

Na konec `tests/unit/ukazka.ts` připiš:

```ts
/** Platné pravidlo jen s důvodem „kontrola moci“ (usnesení vlády, bez prospěchu). */
export function platnePravidloKontrolaMoci(): Record<string, unknown> {
  const p = platnePravidlo();
  delete p.prospech;
  return {
    ...p,
    nazev: 'Testovací usnesení Kappa',
    druh: 'usneseni-vlady',
    cesta: 'usneseni-vlady',
    predkladatel: 'Fiktivní ministr spravedlnosti',
    udalosti: [{ datum: '2026-01-12', krok: 'schvaleno', nazev: 'Vláda schválila usnesení', popis: 'Fiktivní vláda usnesení přijala.', zdroje: [1] }],
    kontrolaMoci: {
      znaky: [{ druh: 'instituce', instituce: 'soudy', text: 'Usnesení by svěřilo výběr fiktivních soudců ministrovi.', zdroje: [1] }],
      upozorneni: [{ kdo: 'soudcovska-unie', text: 'Unie upozornila na zásah do výběru soudců.', zdroje: [2] }],
    },
  };
}
```

- [ ] **Step 2: Napiš padající testy**

V `tests/unit/schema-pravidla.test.ts`:

1. Doplň importy:

```ts
import { platnePravidlo, platnePravidloKontrolaMoci } from './ukazka';
import { duvodyPravidla } from '../../src/lib/pravidla';
```

2. Nahraď test `it('odmítne chybějící prospěch', …)` tímto:

```ts
  it('odmítne záznam bez důvodu zařazení', () => expect(chyby(s(p => { delete p.prospech; })).join(' ')).toMatch(/aspoň jeden důvod zařazení/));
```

3. Na konec souboru (mimo stávající `describe`) připiš:

```ts
const k = (upravy: (p: any) => void) => { const p: any = platnePravidloKontrolaMoci(); upravy(p); return p; };

describe('kontrola moci', () => {
  it('pravidlo jen s kontrolou moci projde', () => expect(chyby(platnePravidloKontrolaMoci())).toEqual([]));
  it('pravidlo s oběma důvody projde', () => expect(chyby(s(p => { p.kontrolaMoci = (platnePravidloKontrolaMoci() as any).kontrolaMoci; }))).toEqual([]));
  it('musí mít aspoň jeden znak', () => expect(chyby(k(p => { p.kontrolaMoci.znaky = []; })).join(' ')).toMatch(/aspoň jeden znak/));
  it('musí mít aspoň jedno upozornění', () => expect(chyby(k(p => { p.kontrolaMoci.upozorneni = []; })).join(' ')).toMatch(/aspoň jedno upozornění/));
  it('znak musí mít primární zdroj', () => expect(chyby(k(p => { p.kontrolaMoci.znaky[0].zdroje = [2]; })).join(' ')).toMatch(/Znak 1 musí mít primární zdroj/));
  it('znak „instituce“ musí instituci uvést', () => expect(chyby(k(p => { delete p.kontrolaMoci.znaky[0].instituce; })).join(' ')).toMatch(/Znak 1 mění kontrolní instituci, musí ji uvést/));
  it('instituce patří jen ke znaku „instituce“', () => expect(chyby(k(p => { p.kontrolaMoci.znaky[0].druh = 'prilepek'; })).join(' ')).toMatch(/instituce patří jen ke znaku druhu „instituce“/));
  it('neznámá instituce, upozorňovatel a druh znaku jsou chyba', () => {
    expect(cesty(k(p => { p.kontrolaMoci.znaky[0].instituce = 'armada'; }))).toEqual(['kontrolaMoci.znaky.0.instituce']);
    expect(cesty(k(p => { p.kontrolaMoci.upozorneni[0].kdo = 'opozice'; }))).toEqual(['kontrolaMoci.upozorneni.0.kdo']);
    expect(cesty(k(p => { p.kontrolaMoci.znaky[0].druh = 'nevim'; }))).toContain('kontrolaMoci.znaky.0.druh');
  });
  it('stejný znak dvakrát je chyba', () => expect(chyby(k(p => { p.kontrolaMoci.znaky.push({ ...p.kontrolaMoci.znaky[0] }); })).join(' ')).toMatch(/Znak „instituce\/soudy“ je uveden dvakrát/));
  it('procedurální znaky stejného druhu se počítají jako duplicita, různé ne', () => {
    expect(chyby(k(p => { p.kontrolaMoci.znaky = [{ druh: 'prilepek', text: 'A.', zdroje: [1] }, { druh: 'prilepek', text: 'B.', zdroje: [1] }]; })).join(' ')).toMatch(/Znak „prilepek“ je uveden dvakrát/);
    expect(chyby(k(p => { p.kontrolaMoci.znaky.push({ druh: 'prilepek', text: 'A.', zdroje: [1] }); }))).toEqual([]);
  });
  it.each([
    ['znak', (p: any) => { p.kontrolaMoci.znaky[0].zdroje = [9]; }, /Znak 1 odkazuje na neexistující zdroj 9/],
    ['upozornění', (p: any) => { p.kontrolaMoci.upozorneni[0].zdroje = [9]; }, /Upozornění \(„soudcovska-unie“\) odkazuje na neexistující zdroj 9/],
  ])('neexistující zdroj: %s', (_, uprava, hlaska) => expect(chyby(k(uprava)).join(' ')).toMatch(hlaska));
  it('nové druhy: cesta musí patřit k druhu a kroky jsou jako u ostatních nezákonných druhů', () => {
    expect(chyby(k(p => { p.cesta = 'pokyn-ministerstva'; })).join(' ')).toMatch(/Cesta „pokyn-ministerstva“ nepatří k druhu „usneseni-vlady“/);
    expect(chyby(k(p => { p.udalosti[0].krok = 'predlozeno'; })).join(' ')).toMatch(/Krok „predlozeno“ .* nepatří k druhu „usneseni-vlady“/);
    expect(chyby(k(p => { p.druh = 'pokyn-ministerstva'; p.cesta = 'pokyn-ministerstva'; p.udalosti[0].krok = 'vyhlaseno'; }))).toEqual([]);
  });
  it('neznámá vlastnost v bloku je chyba', () => expect(chyby(k(p => { p.kontrolaMoci.hodnoceni = 'oslabení'; })).length).toBeGreaterThan(0));
});

describe('důvody zařazení', () => {
  it('odvodí se z bloků, vždy v pořadí prospěch, kontrola moci', () => {
    const oba = pravidloSchema.parse(s(p => { p.kontrolaMoci = (platnePravidloKontrolaMoci() as any).kontrolaMoci; }));
    expect(duvodyPravidla(oba)).toEqual(['prospech', 'kontrola-moci']);
    expect(duvodyPravidla(pravidloSchema.parse(platnePravidlo()))).toEqual(['prospech']);
    expect(duvodyPravidla(pravidloSchema.parse(platnePravidloKontrolaMoci()))).toEqual(['kontrola-moci']);
  });
});
```

- [ ] **Step 3: Spusť testy a ověř, že padají**

Run: `npx vitest run tests/unit/schema-pravidla.test.ts`
Expected: FAIL. `duvodyPravidla` neexistuje a pravidlo s `kontrolaMoci` se odmítne jako neznámá vlastnost.

- [ ] **Step 4: Uprav schéma**

V `src/lib/schema-pravidla.ts`:

1. Import slovníku:

```ts
import { DRUHY_PRAVIDEL, CESTY, KOMU, ZAVERY, DRUHY_ZNAKU, KONTROLNI_INSTITUCE, UPOZORNOVATELE, cestyProDruh } from './pravidla-slovnik';
```

2. Pod `krokRetezceSchema` přidej:

```ts
const znakSchema = z.object({
  druh: z.enum(DRUHY_ZNAKU),
  instituce: z.enum(KONTROLNI_INSTITUCE).optional(),
  text: text(),
  zdroje: odkazy('Znak'),
}).strict();
const upozorneniSchema = z.object({ kdo: z.enum(UPOZORNOVATELE), text: text(), zdroje: odkazy('Upozornění') }).strict();
```

3. V objektu schématu změň `prospech` na nepovinný (přidej `.optional()` za `.strict()` bloku `prospech`) a hned za něj přidej:

```ts
    kontrolaMoci: z.object({
      znaky: z.array(znakSchema).min(1, 'Kontrola moci musí mít aspoň jeden znak'),
      upozorneni: z.array(upozorneniSchema).min(1, 'Kontrola moci musí mít aspoň jedno upozornění instituce nebo profesní organizace'),
    }).strict().optional(),
```

4. V `superRefine` nahraď řádky, které pracují s `p.prospech`, tímto blokem. Odkazy řetězce, dalšího dotčení a kontroly závěru se přesunou dovnitř podmínky. Ostatní kontroly (`udalosti`, `stanovisko`, `pripojenoK`, `vyhrady`, `kauzy`, cesta, kroky, chronologie) zůstanou beze změny.

```ts
    if (!p.prospech && !p.kontrolaMoci) chyba('Záznam musí mít aspoň jeden důvod zařazení: prospech nebo kontrolaMoci');

    // Závěr řetězce (spec pravidel, oddíl 4)
    if (p.prospech) {
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
        if (zn.druh === 'instituce' && !zn.instituce) chyba(`Znak ${i + 1} mění kontrolní instituci, musí ji uvést (instituce)`);
        if (zn.druh !== 'instituce' && zn.instituce) chyba(`Znak ${i + 1}: instituce patří jen ke znaku druhu „instituce“`);
      });
      p.kontrolaMoci.znaky.map(zn => (zn.instituce ? `${zn.druh}/${zn.instituce}` : zn.druh))
        .filter((x, i, a) => a.indexOf(x) !== i)
        .forEach(x => chyba(`Znak „${x}“ je uveden dvakrát`));
      p.kontrolaMoci.upozorneni.forEach(u => over(u.zdroje, `Upozornění („${u.kdo}“)`));
    }
```

Starý řádek `p.prospech.retezec.forEach((k, i) => over(k.zdroje, …))` a `if (p.prospech.dalsiDotceni) over(…)` z bloku odkazů smaž, protože jsou nově uvnitř podmínky.

- [ ] **Step 5: Přidej odvození důvodů**

Na konec `src/lib/pravidla.ts` připiš:

```ts
import type { Duvod } from './pravidla-slovnik';
import type { Pravidlo } from './schema-pravidla';

/** Důvody zařazení se nezapisují, plynou z bloků prospech a kontrolaMoci (spec kontroly moci, oddíl 6). */
export const duvodyPravidla = (p: Pick<Pravidlo, 'prospech' | 'kontrolaMoci'>): Duvod[] => [
  ...(p.prospech ? (['prospech'] as const) : []),
  ...(p.kontrolaMoci ? (['kontrola-moci'] as const) : []),
];
```

(Importy přesuň na začátek souboru k ostatním.)

- [ ] **Step 6: Spusť testy a ověř, že projdou**

Run: `npx vitest run tests/unit/schema-pravidla.test.ts tests/unit/pravidla-slovnik.test.ts tests/unit/validace-pravidla.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/schema-pravidla.ts src/lib/pravidla.ts tests/unit/ukazka.ts tests/unit/schema-pravidla.test.ts
git commit -m "Schéma pravidel: nepovinný prospěch, blok kontrolaMoci a odvození důvodů zařazení

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Testovací data a hledání

**Files:**
- Create: `tests/fixtures/obsah/pravidla/usneseni-kappa.md`
- Modify: `tests/fixtures/obsah/pravidla/zakon-omega.md`
- Modify: `src/lib/hledani-pravidel.ts`
- Test: `tests/unit/hledani-pravidel.test.ts`, `tests/unit/validace-pravidla.test.ts`

**Interfaces:**
- Consumes: `duvodyPravidla` (Task 2), `popisekZnaku`, `popisekDruhuZnaku`, `type Duvod` (Task 1).
- Produces:
  - `PolozkaPravidla = { slug; text; stitky; projednava; duvody: Duvod[] }`.
  - `FiltrPravidel = { text; stitky; jenProjednavane; duvody: Duvod[] }`.
  - Fixtures: `usneseni-kappa` (jen kontrola moci, znak `instituce/soudy`, upozornění `soudcovska-unie`, poslední událost 2026-01-20, stav Vyhlášeno). `zakon-omega` má oba důvody (znak `zpetna-ucinnost`, upozornění `legislativni-rada-vlady`).

- [ ] **Step 1: Vytvoř testovací data**

`tests/fixtures/obsah/pravidla/usneseni-kappa.md`:

```markdown
---
nazev: Testovací usnesení vlády Kappa
shrnuti: Fiktivní usnesení vlády by změnilo fiktivní způsob výběru fiktivních soudců.
druh: usneseni-vlady
cesta: usneseni-vlady
predkladatel: Fiktivní ministr spravedlnosti
stitky: [soudy]
overeno: 2026-11-09
zdroje:
  - { id: 1, vydavatel: Fiktivní úřad vlády, titulek: Usnesení vlády Kappa, datum: 2026-01-12, druh: primarni, url: "https://example.com/kappa/usneseni" }
  - { id: 2, vydavatel: Fiktivní soudcovská unie, titulek: Stanovisko k usnesení Kappa, datum: 2026-01-15, druh: media, url: "https://example.com/kappa/unie" }
  - { id: 3, vydavatel: Fiktivní ministerstvo spravedlnosti, titulek: Odůvodnění usnesení, datum: 2026-01-12, druh: stanovisko, url: "https://example.com/kappa/oduvodneni" }
udalosti:
  - { datum: 2026-01-12, krok: schvaleno, nazev: Vláda schválila usnesení, popis: Fiktivní vláda usnesení přijala., zdroje: [1] }
  - { datum: 2026-01-20, krok: vyhlaseno, nazev: Usnesení zveřejněno, popis: Fiktivní úřad vlády usnesení zveřejnil., zdroje: [1] }
kontrolaMoci:
  znaky:
    - { druh: instituce, instituce: soudy, text: Usnesení by svěřilo výběr fiktivních soudců fiktivnímu ministrovi., zdroje: [1] }
  upozorneni:
    - { kdo: soudcovska-unie, text: Unie upozornila na fiktivní zásah do výběru soudců., zdroje: [2] }
stanovisko:
  text: Ministerstvo uvádí, že usnesení zrychlí obsazování fiktivních míst.
  zdroje: [3]
---
```

V `tests/fixtures/obsah/pravidla/zakon-omega.md` změň text výhrady na `Rada upozornila na fiktivní nejasnost pojmů.` (upozornění ke znaku patří jen do `kontrolaMoci`) a za blok `prospech` (před `vyhrady`) vlož:

```yaml
kontrolaMoci:
  znaky:
    - { druh: zpetna-ucinnost, text: Novela by zkrátila fiktivní lhůtu i pro dříve vyplacené fiktivní dotace., zdroje: [1] }
  upozorneni:
    - { kdo: legislativni-rada-vlady, text: Rada upozornila, že zkrácení lhůty by působilo i zpětně., zdroje: [4] }
```

- [ ] **Step 2: Napiš padající testy**

V `tests/unit/validace-pravidla.test.ts` změň očekávané pořadí v testu `načte fiktivní pravidla seřazená od nejnovější události`:

```ts
    expect(r.pravidla.map(p => p.slug)).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau', 'usneseni-kappa']);
```

V `tests/unit/hledani-pravidel.test.ts` změň pomocnou funkci a první test a přidej nové:

```ts
const najdi = (f: Partial<{ text: string; stitky: string[]; jenProjednavane: boolean; duvody: ('prospech' | 'kontrola-moci')[] }>) =>
  polozky.filter(p => odpovidaPravidlo(p, { text: '', stitky: [], jenProjednavane: false, duvody: [], ...f })).map(p => p.slug);
```

```ts
  it('bez filtru najde všechna', () => expect(najdi({})).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau', 'usneseni-kappa']));
  it('hledá v textu znaků a v popiscích znaků a institucí bez diakritiky', () => {
    expect(najdi({ text: 'vyber fiktivnich soudcu ministrovi' })).toEqual(['usneseni-kappa']);
    expect(najdi({ text: 'zpetna ucinnost' })).toEqual(['zakon-omega']);
    expect(najdi({ text: 'kontrolni instituci' })).toEqual(['usneseni-kappa']);
  });
  it('filtr důvodu: NEBO mezi sebou, A se štítky', () => {
    expect(najdi({ duvody: ['kontrola-moci'] })).toEqual(['zakon-omega', 'usneseni-kappa']);
    expect(najdi({ duvody: ['prospech'] })).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau']);
    expect(najdi({ duvody: ['prospech', 'kontrola-moci'] })).toHaveLength(4);
    expect(najdi({ duvody: ['prospech'], stitky: ['soudy'] })).toEqual([]);
  });
  it('položka nese důvody zařazení', () => expect(polozky.find(p => p.slug === 'zakon-omega')!.duvody).toEqual(['prospech', 'kontrola-moci']));
```

Stávající test `jen v projednávání vynechá zamítnuté a vyhlášené` musí dál vracet `['zakon-omega']`, protože `usneseni-kappa` je vyhlášené.

- [ ] **Step 3: Spusť testy a ověř, že padají**

Run: `npx vitest run tests/unit/hledani-pravidel.test.ts tests/unit/validace-pravidla.test.ts`
Expected: FAIL. `hledani-pravidel.ts` čte `p.prospech.retezec` z pravidla bez prospěchu (`Cannot read properties of undefined (reading 'retezec')`) a položka nemá `duvody`.

- [ ] **Step 4: Implementuj hledání**

Celý `src/lib/hledani-pravidel.ts` nahraď:

```ts
import { normalizuj, slova } from './hledani';
import { stavPravidla, vProjednavani } from './pravidla-stavy';
import { duvodyPravidla } from './pravidla';
import { popisekZnaku, popisekDruhuZnaku, type Duvod } from './pravidla-slovnik';
import type { PravidloZaznam } from './validace';

export type PolozkaPravidla = { slug: string; text: string; stitky: string[]; projednava: boolean; duvody: Duvod[] };
export type FiltrPravidel = { text: string; stitky: string[]; jenProjednavane: boolean; duvody: Duvod[] };

/** Data pro filtr v prohlížeči (vkládají se do stránky jako JSON). Hledá se i v názvech štítků („střet zájmů“)
 *  a v popiscích znaků kontroly moci („zpětná účinnost“, „soudy“). */
export function vytvorPolozkuPravidla(z: PravidloZaznam, nazvyStitku: ReadonlyMap<string, string> = new Map()): PolozkaPravidla {
  const p = z.pravidlo;
  const text = [
    p.nazev, p.shrnuti, p.predkladatel, p.stitky.join(' '), ...p.stitky.map(s => nazvyStitku.get(s) ?? ''),
    ...(p.prospech?.retezec.map(k => k.text) ?? []),
    ...(p.kontrolaMoci?.znaky.flatMap(zn => [zn.text, popisekZnaku(zn), popisekDruhuZnaku(zn.druh)]) ?? []),
  ].join(' ');
  return { slug: z.slug, text: normalizuj(text), stitky: p.stitky, projednava: vProjednavani(stavPravidla(p.udalosti)), duvody: duvodyPravidla(p) };
}

export function odpovidaPravidlo(p: PolozkaPravidla, f: FiltrPravidel): boolean {
  if (!slova(f.text).every(w => p.text.includes(w))) return false;
  if (f.stitky.length && !f.stitky.some(s => p.stitky.includes(s))) return false;
  if (f.duvody.length && !f.duvody.some(d => p.duvody.includes(d))) return false;
  if (f.jenProjednavane && !p.projednava) return false;
  return true;
}
```

- [ ] **Step 5: Spusť celý Vitest**

Run: `npx vitest run`
Expected: PASS. Pokud jiný test počítá pravidla ve fixtures (`grep -rn "narizeni-tau'\]" tests/unit`), doplň `usneseni-kappa` na konec očekávaného seznamu.

- [ ] **Step 6: Commit**

```bash
git add tests/fixtures/obsah/pravidla/usneseni-kappa.md tests/fixtures/obsah/pravidla/zakon-omega.md src/lib/hledani-pravidel.ts tests/unit/hledani-pravidel.test.ts tests/unit/validace-pravidla.test.ts
git commit -m "Hledání pravidel: důvody zařazení, texty znaků kontroly moci a testovací usnesení vlády

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Přehled `/pravidla/`

**Files:**
- Modify: `src/components/PrehledPravidel.astro`, `src/scripts/pravidla-filtr.ts`, `src/styles/hlavni.css`
- Test: `tests/e2e/pravidla-prehled.spec.ts`, `tests/e2e/pristupnost.spec.ts`

**Interfaces:**
- Consumes: `duvodyPravidla` (Task 2), `DUVODY`, `popisekDuvodu`, `popisekZnaku` (Task 1), `FiltrPravidel.duvody` (Task 3).
- Produces: tlačítka `button[data-duvod="prospech|kontrola-moci"]` v `.pr-filtry .f-cipy` (jen když se v archivu vyskytují oba důvody). Řádek obsahuje text `Kontrola moci: <popisky znaků oddělené čárkou>`.

- [ ] **Step 1: Uprav stávající e2e testy na nová data a napiš nové**

V `tests/e2e/pravidla-prehled.spec.ts`:

1. `NAZVY` rozšiř o čtvrtý název na konec:

```ts
const NAZVY = ['Testovací novela zákona Omega s dlouhým názvem pro mobil', 'Testovací pozměňovací návrh Sigma', 'Testovací nařízení Tau', 'Testovací usnesení vlády Kappa'];
```

2. V prvním testu změň očekávaný nadpis:

```ts
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Které změny pravidel prospívají Babišovi a Agrofertu nebo mění kontrolu moci');
```

3. V testu filtrů nahraď `'Zobrazeno 3 z 3'` za `'Zobrazeno 4 z 4'`, `'Zobrazeno 1 z 3'` za `'Zobrazeno 1 z 4'` a obě `toHaveCount(3)` u `viditelne` za `toHaveCount(4)`.

4. Přidej nové testy:

```ts
test('řádek označí důvody zařazení textem, bez prázdných oddělovačů', async ({ page }) => {
  await page.goto('/pravidla/');
  const omega = page.locator('.pr-radek[data-slug="zakon-omega"] .pr-nazev small');
  await expect(omega).toContainText('prospěch pravděpodobný');
  await expect(omega).toContainText('Kontrola moci: zpětná účinnost');
  const kappa = page.locator('.pr-radek[data-slug="usneseni-kappa"] .pr-nazev small');
  await expect(kappa).toHaveText('Usnesení vlády · Vyhlášeno · Kontrola moci: soudy');
  await expect(kappa).not.toContainText('prospěch');
  await expect(page.locator('.pr-radek[data-slug="narizeni-tau"] .pr-nazev small')).not.toContainText('Kontrola moci');
});

test('filtr důvodu: každý čip zvlášť, oba, kombinace se štítkem a zrušení', async ({ page }) => {
  await page.goto('/pravidla/');
  const viditelne = page.locator('.pr-radek:not([hidden])');
  const prospech = page.locator('.pr-filtry [data-duvod="prospech"]');
  const kontrola = page.locator('.pr-filtry [data-duvod="kontrola-moci"]');
  await expect(prospech).toHaveText('Prospěch');
  await expect(kontrola).toHaveText('Kontrola moci');
  await kontrola.click();
  await expect(kontrola).toHaveAttribute('aria-pressed', 'true');
  await expect(viditelne).toHaveCount(2);
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 2 z 4');
  await prospech.click();
  await expect(viditelne).toHaveCount(4);
  await kontrola.click();
  await expect(viditelne).toHaveCount(3);
  await page.locator('.pr-filtry [data-stitek="soudy"]').click();
  await expect(viditelne).toHaveCount(0);
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeVisible();
  await page.locator('.pr-filtry .f-zrusit').click();
  await expect(viditelne).toHaveCount(4);
  await expect(prospech).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.pr-filtry .f-zrusit')).toBeHidden();
});
```

5. V `test.describe('mobil 390×700')` přidej:

```ts
  test('řádek jen s kontrolou moci ukazuje důvod jako text', async ({ page }) => {
    await page.goto('/pravidla/');
    const text = await page.locator('.pr-radek[data-slug="usneseni-kappa"]').evaluate(e => (e as HTMLElement).innerText);
    expect(text).toContain('Kontrola moci: soudy');
    await overBezPosouvani(page);
  });
```

V `tests/e2e/pristupnost.spec.ts` přidej do seznamu cest `'/pravidla/usneseni-kappa/'` (za `'/pravidla/pozmenovaci-sigma/'`).

- [ ] **Step 2: Sestav a spusť testy, ověř, že padají**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-prehled.spec.ts` (případně s `-c playwright.local.config.ts` podle Global Constraints).
Expected: FAIL. Starý nadpis, chybí čipy `data-duvod` a řádek Kappa neobsahuje „Kontrola moci“. Build může spadnout už v `PrehledPravidel.astro` na `p.prospech.komu` (undefined) u `usneseni-kappa`. I to je očekávané selhání.

- [ ] **Step 3: Uprav přehled**

V `src/components/PrehledPravidel.astro`:

1. Importy:

```astro
import { popisekCesty, popisekKomu, popisekZaveru, popisekZnaku, popisekDuvodu, DUVODY } from '../lib/pravidla-slovnik';
import { duvodyPravidla } from '../lib/pravidla';
```

2. Pod výpočet `cipy` přidej:

```ts
// Filtr důvodu má smysl, jen když archiv obsahuje záznamy s oběma důvody.
const duvody = DUVODY.filter(d => zaznamy.some(z => duvodyPravidla(z.pravidlo).includes(d)));
const sDuvody = duvody.length > 1;
```

3. Popis pro sdílení:

```ts
  : 'Zákony, nařízení, usnesení vlády a pokyny ministerstev od prosince 2025, u kterých rozbor archivu ukazuje prospěch pro Andreje Babiše nebo Agrofert, nebo které mění kontrolu moci a instituce na to upozornily.';
```

4. Úvod:

```astro
      <h1>Které změny pravidel prospívají Babišovi a Agrofertu nebo mění kontrolu moci</h1>
      <p class="u2-pod">Zákony, nařízení, usnesení vlády a pokyny ministerstev od prosince 2025. U každé změny rozbor se zdroji, upozornění institucí a stanovisko předkladatele.</p>
```

5. Skupina čipů:

```astro
            <div class="f-cipy" role="group" aria-label={sDuvody ? 'Důvod zařazení a témata' : 'Témata'}>
              {sDuvody && duvody.map(d => <button type="button" data-duvod={d} aria-pressed="false">{popisekDuvodu(d)}</button>)}
              {sDuvody && <span class="f-oddelovac" aria-hidden="true"></span>}
              {cipy.map(c => <button type="button" data-stitek={c.id} aria-pressed="false">{c.nazev}</button>)}
            </div>
```

6. Text řádku (`<small>`):

```astro
                <small><span class="pr-cesta">{popisekCesty(p.cesta)} · </span>{popisekKroku(stavPravidla(p.udalosti))}{p.prospech && ` · ${popisekKomu(p.prospech.komu)} · ${popisekZaveru(p.prospech.zaver)}`}{p.kontrolaMoci && ` · Kontrola moci: ${p.kontrolaMoci.znaky.map(popisekZnaku).join(', ')}`}</small>
```

V `src/styles/hlavni.css` za pravidlo `.f-cipy button[aria-pressed="true"]::before` přidej:

```css
.f-oddelovac { flex: none; width: 1px; align-self: stretch; margin: 4px 4px; background: var(--linka); }
```

- [ ] **Step 4: Uprav klientský filtr**

V `src/scripts/pravidla-filtr.ts`:

1. Import typu:

```ts
import { odpovidaPravidlo, type PolozkaPravidla, type FiltrPravidel } from '../lib/hledani-pravidel';
import type { Duvod } from '../lib/pravidla-slovnik';
```

2. Pod `const cipy = …` přidej:

```ts
  const cipyDuvodu = [...obal.querySelectorAll<HTMLButtonElement>('[data-duvod]')];
```

3. `filtr`:

```ts
  const filtr = (): FiltrPravidel => ({
    text: hledat.value,
    stitky: cipy.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.stitek!),
    jenProjednavane: jen.checked,
    duvody: cipyDuvodu.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.duvod as Duvod),
  });
```

4. V `pouzij` změň podmínku viditelnosti tlačítka zrušení:

```ts
    zrusit.hidden = !(f.text.trim() || f.stitky.length || f.duvody.length || f.jenProjednavane);
```

5. V `vycisti` odznač i čipy důvodu a připoj posluchače ke všem čipům:

```ts
  const vycisti = () => {
    hledat.value = '';
    jen.checked = false;
    [...cipy, ...cipyDuvodu].forEach(c => c.setAttribute('aria-pressed', 'false'));
    pouzij();
  };
  hledat.addEventListener('input', pouzij);
  jen.addEventListener('change', pouzij);
  [...cipy, ...cipyDuvodu].forEach(c => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    pouzij();
  }));
```

(Původní `cipy.forEach(c => c.addEventListener('click', …))` a původní `vycisti` nahraď výše uvedeným.)

- [ ] **Step 5: Sestav a spusť testy, ověř, že projdou**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-prehled.spec.ts tests/e2e/pristupnost.spec.ts tests/e2e/bez-posouvani.spec.ts`
Expected: PASS. Pokud axe hlásí `/pravidla/usneseni-kappa/`, je to chyba detailu bez prospěchu, kterou opraví Task 5. V tom případě dočasně vyřaď cestu ze seznamu a vrať ji v Task 5, Step 1.

- [ ] **Step 6: Commit**

```bash
git add src/components/PrehledPravidel.astro src/scripts/pravidla-filtr.ts src/styles/hlavni.css tests/e2e/pravidla-prehled.spec.ts tests/e2e/pristupnost.spec.ts
git commit -m "Přehled změn pravidel: filtr a označení důvodu zařazení, nový nadpis

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Detail pravidla: záložka Kontrola moci

**Files:**
- Modify: `src/components/DetailPravidla.astro`, `src/styles/pravidla.css`
- Test: `tests/e2e/pravidla-detail.spec.ts`

**Interfaces:**
- Consumes: `popisekZnaku`, `popisekDruhuZnaku`, `upozornovatel`, `popisekTypuUpozornovatele` (Task 1). Fixture `usneseni-kappa` (Task 3).
- Produces: záložka `[role="tab"][data-p="kontrola"]` s textem „Kontrola moci“ a panel `.m2-panel[data-p="kontrola"]` se seznamy `ul.znaky` a `ul.upozorneni` a řádkem `.kriterium`. Záložka `data-p="prospech"` existuje jen u pravidla s prospěchem. První zobrazená záložka má `aria-selected="true"` a její panel nemá `hidden`.

- [ ] **Step 1: Napiš padající testy**

V `tests/e2e/pravidla-detail.spec.ts`:

1. Pole `ZALOZKY` a smyčku přes adresy nahraď:

```ts
const ZALOZKY = ['Komu prospívá', 'Průběh', 'Výhrady a stanovisko', /^Zdroje/];
const ZALOZKY_KAPPA = ['Kontrola moci', 'Průběh', 'Výhrady a stanovisko', /^Zdroje/];
```

a v seznamu adres v testu oříznutého obsahu:

```ts
    for (const [adresa, zalozky] of [
      ['/pravidla/zakon-omega/', [...ZALOZKY, 'Kontrola moci']],
      ['/pravidla/pozmenovaci-sigma/', ZALOZKY],
      ['/pravidla/narizeni-tau/', [...ZALOZKY, 'Souvislosti']],
      ['/pravidla/usneseni-kappa/', ZALOZKY_KAPPA],
    ] as const) {
```

2. Ve smyčce `for (const v of VELIKOSTI)` testu „detail pravidla se neposouvá dolů“ projdi obě adresy:

```ts
    for (const adresa of ['/pravidla/zakon-omega/', '/pravidla/usneseni-kappa/']) {
      await page.goto(adresa);
      await overBezPosouvani(page);
    }
```

3. Do bloku `test.describe('bez JavaScriptu')` přidej:

```ts
  test('detail jen s kontrolou moci ukáže všechny své části pod sebou', async ({ page }) => {
    await page.goto('/pravidla/usneseni-kappa/');
    for (const p of ['kontrola', 'chrono', 'vyhrady', 'zdroje']) await expect(page.locator(`.m2-panel[data-p="${p}"]`)).toBeVisible();
    await expect(page.locator('.m2-panel[data-p="prospech"]')).toHaveCount(0);
  });
```

4. Přidej nové testy:

```ts
test('pravidlo jen s kontrolou moci otevře záložku Kontrola moci: znaky, upozornění a odkaz na Metodiku', async ({ page }) => {
  await page.goto('/pravidla/usneseni-kappa/');
  await expect(page.getByRole('tab')).toHaveText(['Kontrola moci', 'Průběh', 'Výhrady a stanovisko', 'Zdroje (3)']);
  await expect(page.getByRole('tab', { name: 'Kontrola moci' })).toHaveAttribute('aria-selected', 'true');
  const panel = page.locator('.m2-panel[data-p="kontrola"]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.kriterium')).toContainText('Záznam upozornění institucí, ne hodnocení archivu.');
  await expect(panel.locator('.kriterium').getByRole('link')).toHaveAttribute('href', '/metodika/#kontrola-moci');
  await expect(panel.locator('.znaky > li')).toHaveCount(1);
  await expect(panel.locator('.znaky > li')).toContainText('soudy');
  await expect(panel.locator('.znaky > li')).toContainText('Usnesení by svěřilo výběr fiktivních soudců');
  await expect(panel.locator('.upozorneni > li')).toContainText('Soudcovská unie ČR');
  await expect(panel.locator('.upozorneni > li')).toContainText('profesní organizace');
  await panel.locator('.upozorneni a[data-zdroj="2"]').click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
  await expect(page.locator('#zdroj-2')).toBeInViewport();
});

test('pravidlo s oběma důvody má obě záložky v pořadí Komu prospívá, Kontrola moci', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await expect(page.getByRole('tab')).toHaveText(['Komu prospívá', 'Kontrola moci', 'Průběh', 'Výhrady a stanovisko', 'Zdroje (4)']);
  await expect(page.getByRole('tab', { name: 'Komu prospívá' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Kontrola moci' }).click();
  await expect(page.locator('.m2-panel[data-p="kontrola"] .znaky > li')).toContainText('zpětná účinnost');
  await expect(page.locator('.m2-panel[data-p="kontrola"] .upozorneni > li')).toContainText('Legislativní rada vlády');
});

test('pravidlo jen s prospěchem záložku Kontrola moci nemá', async ({ page }) => {
  await page.goto('/pravidla/narizeni-tau/');
  await expect(page.getByRole('tab', { name: 'Kontrola moci' })).toHaveCount(0);
});

test('přechod bez načtení z pravidla s prospěchem na pravidlo jen s kontrolou moci otevře Kontrolu moci', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await page.locator('.pr-radek[data-slug="usneseni-kappa"] a.pr-btn').click();
  await expect(page).toHaveURL(/\/pravidla\/usneseni-kappa\/$/);
  await expect(page.getByRole('tab', { name: 'Kontrola moci' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.m2-panel[data-p="kontrola"]')).toBeVisible();
});

test('Průběh usnesení vlády: cesta bez vynechaných kontrol', async ({ page }) => {
  await page.goto('/pravidla/usneseni-kappa/');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const panel = page.locator('.m2-panel[data-p="chrono"]');
  await expect(panel.locator('.cesta-box')).toContainText('Usnesení vlády');
  await expect(panel.locator('.vynechano')).toHaveCount(0);
});
```

- [ ] **Step 2: Sestav a spusť testy, ověř, že padají**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-detail.spec.ts`
Expected: FAIL. Build může spadnout v `DetailPravidla.astro` na `p.prospech.zaver` u `usneseni-kappa`. Jinak chybí záložka „Kontrola moci“.

- [ ] **Step 3: Uprav detail**

V `src/components/DetailPravidla.astro`:

1. Importy:

```astro
import { popisekCesty, popisekKomu, popisekZaveru, vynechaneKontroly, popisekZnaku, popisekDruhuZnaku, upozornovatel, popisekTypuUpozornovatele } from '../lib/pravidla-slovnik';
```

2. Ve frontmatteru pod `const chipy = …` přidej:

```ts
// Záložky podle toho, co záznam má. Otevřená je první zobrazená (spec kontroly moci, oddíl 7).
const zalozky = p ? [
  ...(p.prospech ? [{ id: 'prospech', nazev: 'Komu prospívá' }] : []),
  ...(p.kontrolaMoci ? [{ id: 'kontrola', nazev: 'Kontrola moci' }] : []),
  { id: 'chrono', nazev: 'Průběh' },
  { id: 'vyhrady', nazev: 'Výhrady a stanovisko' },
  ...(odstavce.length > 0 ? [{ id: 'souv', nazev: 'Souvislosti' }] : []),
  { id: 'zdroje', nazev: `Zdroje (${p.zdroje.length})` },
] : [];
const prvni = zalozky[0]?.id;
```

3. Lištu záložek nahraď:

```astro
      <div class="zalozky" role="tablist">
        {zalozky.map(z => <button role="tab" type="button" data-p={z.id} aria-selected={String(z.id === prvni)}>{z.nazev}</button>)}
      </div>
```

4. Panel `prospech` obal podmínkou a skrytí řiď proměnnou `prvni`:

```astro
      {p.prospech && (
        <div class="m2-panel" data-p="prospech" role="tabpanel" hidden={prvni !== 'prospech'}>
          …stávající obsah panelu beze změny…
        </div>
      )}
```

5. Hned za něj vlož panel kontroly moci:

```astro
      {p.kontrolaMoci && (
        <div class="m2-panel" data-p="kontrola" role="tabpanel" hidden={prvni !== 'kontrola'}>
          <h3 class="panel-nadpis">Kontrola moci</h3>
          <p class="kriterium">Záznam upozornění institucí, ne hodnocení archivu. <a href="/metodika/#kontrola-moci">Jak záznam děláme</a></p>
          <h4>Co pravidlo mění</h4>
          <ul class="znaky">
            {p.kontrolaMoci.znaky.map(zn => (
              <li><strong>{popisekZnaku(zn)}</strong>{zn.druh === 'instituce' && <> ({popisekDruhuZnaku(zn.druh)})</>}: {zn.text}<span class="chipy" set:html={chipy(zn.zdroje)}></span></li>
            ))}
          </ul>
          <h4>Kdo upozornil a na co</h4>
          <ul class="upozorneni">
            {p.kontrolaMoci.upozorneni.map(u => (
              <li><strong>{upozornovatel(u.kdo).nazev}</strong> ({popisekTypuUpozornovatele(upozornovatel(u.kdo).typ)}): {u.text}<span class="chipy" set:html={chipy(u.zdroje)}></span></li>
            ))}
          </ul>
        </div>
      )}
```

6. U ostatních panelů nahraď pevné `hidden` výrazem podle `prvni`:
   - `<div class="m2-panel" data-p="chrono" role="tabpanel" hidden={prvni !== 'chrono'}>`
   - `<div class="m2-panel" data-p="vyhrady" role="tabpanel" hidden={prvni !== 'vyhrady'}>`
   - `<div class="m2-panel" data-p="souv" role="tabpanel" hidden={prvni !== 'souv'}>`
   - `<div class="m2-panel" data-p="zdroje" role="tabpanel" hidden={prvni !== 'zdroje'}>`

Řádek „Záznam upozornění…“ stojí na začátku panelu (ne za seznamy), stejně jako upozornění „Závěr je rozbor archivu“ v záložce Komu prospívá. Na mobilu je tak vidět hned po otevření (commit 3c37481).

V `src/styles/pravidla.css` za pravidlo `.dalsi-dotceni` přidej:

```css
.znaky, .upozorneni { margin: 0 0 12px; padding-left: 1.2em; max-width: 46em; }
.znaky li, .upozorneni li { margin: 6px 0; }
.m2-panel[data-p="kontrola"] h4 { margin: 12px 0 4px; font-size: 14px; }
```

a za pravidlo `.pravidlo .retezec { max-width: none; }` přidej:

```css
.pravidlo .znaky, .pravidlo .upozorneni { max-width: none; }
```

- [ ] **Step 4: Sestav a spusť testy, ověř, že projdou**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-detail.spec.ts tests/e2e/pravidla-kauzy.spec.ts tests/e2e/pristupnost.spec.ts`
Expected: PASS. Pokud jsi v Task 4 dočasně vyřadil `/pravidla/usneseni-kappa/` z `pristupnost.spec.ts`, vrať ho teď.

- [ ] **Step 5: Commit**

```bash
git add src/components/DetailPravidla.astro src/styles/pravidla.css tests/e2e/pravidla-detail.spec.ts tests/e2e/pristupnost.spec.ts
git commit -m "Detail pravidla: záložka Kontrola moci a záložky podle důvodů zařazení

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Metodika, O projektu a kotva na pododdíl

**Files:**
- Modify: `src/data/metodika.ts`, `src/data/o-projektu.ts`, `src/scripts/karty.ts`
- Test: `tests/e2e/stranky.spec.ts`

**Interfaces:**
- Consumes: `KONTROLNI_INSTITUCE`, `popisekInstituce`, `DRUHY_ZNAKU`, `popisekDruhuZnaku`, `UPOZORNOVATELE`, `upozornovatel` (Task 1).
- Produces: nadpis `<h3 id="kontrola-moci">Dopad na kontrolu moci</h3>` v oddílu `pravidla`. Adresa `/metodika/#<id>` otevře oddíl, ve kterém je prvek s tímto id.

- [ ] **Step 1: Napiš padající testy**

Do `tests/e2e/stranky.spec.ts` za test `/metodika/#pravidla otevře oddíl Změny pravidel` přidej:

```ts
test('/metodika/#kontrola-moci otevře oddíl Změny pravidel na pododdílu Dopad na kontrolu moci', async ({ page }) => {
  await page.goto('/metodika/#kontrola-moci');
  const panel = page.locator('.v4-dlg-panel[data-sekce="pravidla"]');
  await expect(panel).toBeVisible();
  const nadpis = panel.locator('#kontrola-moci');
  await expect(nadpis).toHaveText('Dopad na kontrolu moci');
  await expect(nadpis).toBeInViewport();
  await expect(panel).toContainText('Záznam dopadu na kontrolu moci je záznam upozornění institucí, ne hodnocení archivu.');
  await expect(panel).toContainText('Soudcovská unie ČR');
  await expect(panel).toContainText('Úřad pro dohled nad hospodařením politických stran a politických hnutí');
  await expect(panel).toContainText('zpětná účinnost');
  await expect(panel).toContainText('usnesení vlády');
  await overBezPosouvani(page);
});

test('O projektu zmíní oba důvody zařazení změn pravidel', async ({ page }) => {
  await page.goto('/o-projektu/');
  await page.locator('.v4-karta button[data-sekce="proc"]').click();
  await expect(page.locator('.v4-dlg-panel[data-sekce="proc"]')).toContainText('mění kontrolu moci');
});
```

Pokud `overBezPosouvani` není v souboru importovaný, doplň `import { overBezPosouvani } from './pomocne';`.

Stávající testy `Metodika a O projektu mluví o prospěchu neutrálně` a `/metodika/#pravidla …` musí projít beze změny. Text „u kterých rozbor archivu ukazuje prospěch pro Andreje Babiše nebo Agrofert“ zůstává a výčet `.slovnicek dt` v oddílu pravidel se nemění (nové seznamy nejsou `.slovnicek`).

- [ ] **Step 2: Sestav a spusť testy, ověř, že padají**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/stranky.spec.ts`
Expected: FAIL. Nadpis `#kontrola-moci` neexistuje a kotva neotevře dialog.

- [ ] **Step 3: Doplň Metodiku**

V `src/data/metodika.ts`:

1. Na začátek souboru přidej import a pomocné texty:

```ts
import { KONTROLNI_INSTITUCE, popisekInstituce, DRUHY_ZNAKU, popisekDruhuZnaku, UPOZORNOVATELE, upozornovatel } from '../lib/pravidla-slovnik';

// Seznamy pro pododdíl Dopad na kontrolu moci se generují ze slovníků, aby nemohly zastarat.
const seznamInstituci = KONTROLNI_INSTITUCE.map(i => popisekInstituce(i, 'plne')).join(', ');
const seznamProcedur = DRUHY_ZNAKU.filter(d => d !== 'instituce').map(popisekDruhuZnaku).join(', ');
const upozornovateleTypu = (typ: 'instituce' | 'profesni-organizace') => UPOZORNOVATELE.filter(u => upozornovatel(u).typ === typ).map(u => upozornovatel(u).nazev).join(', ');
```

2. V oddílu `id: "pravidla"` změň `shrnuti`:

```ts
      shrnuti: "Zákony, nařízení a další pravidla současné vlády, u kterých rozbor archivu ukazuje prospěch pro Andreje Babiše nebo Agrofert, nebo která mění kontrolu moci a instituce na to upozornily.",
```

3. V `html` oddílu změň první odstavec a uvedení podmínek:

```html
<p>Vedle kauz archiv zaznamenává <strong>změny pravidel</strong>: zákony a jejich novely, pozměňovací návrhy, nařízení vlády, vyhlášky ministerstev, pravidla dotačních programů, usnesení vlády a pokyny ministerstev s obecnou působností. Zapisujeme je od chvíle, kdy jsou oficiálně předložené nebo zveřejněné, a průběžně doplňujeme, jak projednávání pokračuje. Záznamy nemažeme: zamítnutý nebo stažený návrh zůstává v archivu s tímto stavem.</p>
<p>Změna pravidla do archivu patří ze dvou důvodů: když rozbor ukáže prospěch pro Andreje Babiše nebo Agrofert, nebo když mění kontrolu moci a instituce nebo profesní organizace na to upozornila (viz níže). Kvůli prospěchu patří do archivu, když splní <strong>všechny</strong> tyto podmínky:</p>
```

(Seznam podmínek `<ul>…</ul>` pro prospěch zůstává beze změny.)

4. Mezi konec oddílu `<h3 id="cesta">` (odstavec „Jde o popis legislativního procesu, ne o hodnocení.“) a `<h3 id="vyhrady">` vlož:

```html
<h3 id="kontrola-moci">Dopad na kontrolu moci</h3>
<p>Druhým důvodem zařazení je změna, která se týká kontroly moci. Do archivu patří, když splní <strong>všechny</strong> tyto podmínky:</p>
<ul><li>má oficiální text a předložila nebo vydala ji vládní většina, stejně jako u prospěchu,</li>
<li>mění pravomoci, nezávislost, způsob jmenování nebo odvolání, nebo financování některé z těchto oblastí: ${seznamInstituci}, nebo nese procedurální znak: ${seznamProcedur},</li>
<li>na tento znak upozornila aspoň jedna instituce (${upozornovateleTypu('instituce')}) nebo profesní organizace (${upozornovateleTypu('profesni-organizace')}).</li></ul>
<p>Kritika jen od opozice, watchdogů nebo médií k zařazení nestačí. Hodnotící slova ve vlastním textu nepoužíváme. Zapisujeme, co pravidlo mění, s odkazem na ustanovení, a kdo na to upozornil. <strong>Záznam dopadu na kontrolu moci je záznam upozornění institucí, ne hodnocení archivu.</strong> Personální a jiná jednotlivá rozhodnutí sem nepatří.</p>
```

(`html` je šablonový řetězec v backtickách, takže `${…}` se vyhodnotí.)

5. V `src/data/o-projektu.ts` změň větu o pravidlech:

```ts
${sPravidly ? ' Proto archiv vedle kauz zapisuje i změny pravidel, u kterých rozbor archivu ukazuje prospěch pro Andreje Babiše nebo Agrofert, a změny, které mění kontrolu moci a na které upozornily instituce.' : ''}
```

- [ ] **Step 4: Kotva na pododdíl**

V `src/scripts/karty.ts` nahraď dva řádky pod komentářem `// přímý odkaz na část stránky, např. /metodika/#kriteria`:

```ts
  // přímý odkaz na část stránky, např. /metodika/#kriteria, nebo na pododdíl, např. /metodika/#kontrola-moci
  const cil = decodeURIComponent(location.hash.slice(1));
  const panelCile = cil
    ? dlg.querySelector<HTMLElement>(`.v4-dlg-panel[data-sekce="${CSS.escape(cil)}"]`)
      ?? dlg.querySelector<HTMLElement>(`#${CSS.escape(cil)}`)?.closest<HTMLElement>('.v4-dlg-panel')
      ?? null
    : null;
  if (panelCile) {
    ukaz(panelCile.dataset.sekce!);
    dlg.showModal();
    if (panelCile.dataset.sekce !== cil) requestAnimationFrame(() => dlg.querySelector<HTMLElement>(`#${CSS.escape(cil)}`)?.scrollIntoView({ block: 'nearest', inline: 'start' }));
  }
```

- [ ] **Step 5: Sestav a spusť testy, ověř, že projdou**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/stranky.spec.ts tests/e2e/bez-posouvani.spec.ts tests/e2e/pristupnost.spec.ts`
Expected: PASS. Pokud nadpis není v zobrazení (`toBeInViewport`), protože panel přetéká do sloupců, ověř v prohlížeči, kterým směrem panel posouvá (`overPreteceni` v `karty.ts`). Pak uprav jen volbu `scrollIntoView`, test neměň.

- [ ] **Step 6: Commit**

```bash
git add src/data/metodika.ts src/data/o-projektu.ts src/scripts/karty.ts tests/e2e/stranky.spec.ts
git commit -m "Metodika: pododdíl Dopad na kontrolu moci ze slovníků, O projektu a odkaz na pododdíl

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Celková kontrola

**Files:**
- žádné nové. Jen opravy, pokud kontrola něco najde.

- [ ] **Step 1: Jednotkové testy a kontrola obsahu**

Run (PowerShell, ve worktree):
```
npx vitest run
npm run over
npx tsx _koncepty/nastroje/over-pravidla.ts
```
Expected:
- Vitest: PASS.
- `npm run over`: „Obsah v pořádku“.
- Kontrola konceptů: `34 kauz, 7 pravidel platných` a žádný řádek `CHYBA`. Stávající koncepty mají jen `prospech`, viz Review Focus 5.

- [ ] **Step 2: Celé E2E**

Run: `npm run build:e2e`, pak `npx playwright test` (případně s `-c playwright.local.config.ts`)
Expected: PASS všech testů.

- [ ] **Step 3: Zkontroluj zakázaná slova**

Run: `git grep -n -i -E "ohýbá|ohýbání|oslaben|ušit|na míru|agrobaron" -- src tests`
Expected: žádný výsledek (slovo „oslabení“ smí být jen v testu `neznámá vlastnost v bloku je chyba` jako hodnota neplatné vlastnosti v `tests/unit/schema-pravidla.test.ts`).

- [ ] **Step 4: Náhled konceptů**

Sestav statický náhled konceptů a ověř, že přehled funguje i bez záznamu s kontrolou moci (filtr důvodu se nezobrazí):

```
npx cross-env NV_OBSAH=_koncepty/obsah NV_KONCEPTY=ano NV_VYSTUP=dist-koncepty astro build
```

Expected: build projde. V `dist-koncepty/pravidla/index.html` není `data-duvod` (`Select-String -Path dist-koncepty/pravidla/index.html -Pattern 'data-duvod'` nic nenajde). Běžící `astro preview` na 4410 tím dostane nová data, nic nezastavuj.

- [ ] **Step 5: Commit oprav (jen pokud nějaké byly)**

```bash
git add -A src tests
git commit -m "Kontrola moci: opravy po celkové kontrole

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Mimo tento plán

Obsah běží souběžně v `_koncepty/` (gitignorováno) a tento plán ho nemění:
- doplnění druhého testu do `_koncepty/test-pravidla.md` a bloku `kontrolaMoci` do `_koncepty/pravidla/brief-rozbor.md` a `_koncepty/brief-pravidla.md`,
- soupis `_koncepty/pravidla/SOUPIS-kontrola-moci.md`,
- doplnění `kontrolaMoci` do konceptu `trestni-rad-pokyny-odvolaciho-soudu`,
- dohledání pokynu MZe k nákupu potravin.
