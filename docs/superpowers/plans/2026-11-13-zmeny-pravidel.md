# Změny pravidel: plán implementace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přidat do archivu samostatnou část „Změny pravidel“ (`/pravidla/`): zákony, nařízení a dotační pravidla s řetězcem prospěchu pro A. Babiše nebo Agrofert, průběhem projednávání a vazbou na kauzy.

**Architecture:** Samostatná sbírka `obsah/pravidla/<slug>.md` s vlastním Zod schématem (znovu používá stavební kameny ze `schema.ts`), validovaná v `overAdresar` spolu s kauzami. Vlastní stránky `/pravidla/` a `/pravidla/<slug>/` používají stejný modal (`dialog.detail.m2`) a skript záložek (`detail.ts`) jako kauzy. Kauzy, osa, mapa ani hledání na hlavní stránce se nemění, jen detail kauzy dostane seznam souvisejících pravidel.

**Tech Stack:** Astro 7 (statický výstup), `astro/zod` (Zod 4), TypeScript, Vitest 5, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-11-13-zmeny-pravidel-design.md`. Pravidla hlavní specifikace `docs/superpowers/specs/2026-11-10-nenechme-vyhnit-design.md` platí dál.

## Global Constraints

- Všechny texty v UI, chybových hláškách, komentářích a commitech jsou česky se správnou diakritikou. Identifikátory se píšou česky bez diakritiky, stejně jako ve zbytku repozitáře (`nactiPravidla`, `stavPravidla`).
- Na webu ani v kódu se nepoužívají výrazy „ušité“, „na míru“ ani „agrobaron“. Žádné hodnotící přívlastky.
- Barva nesmí hodnotit stav ani závěr. Červená (`#DB1F2D`) se pro pravidla nepoužije vůbec.
- **Žádné svislé posouvání stránky, nikde.** `document.scrollingElement.scrollHeight <= innerHeight` na velikostech 1256×528, 1342×565, 1342×676, 1896×868 a 390×700 (`VELIKOSTI` v `tests/e2e/pomocne.ts`).
- WCAG 2.1 AA: axe bez závažných chyb, ovládání klávesnicí, viditelný fokus.
- Bez sledování: žádné skripty ani písma z cizích serverů.
- Klientský JavaScript bez frameworku.
- Stránka i položka menu „Změny pravidel“ existují jen tehdy, když je aspoň jedno pravidlo (v režimu konceptů `NV_KONCEPTY=ano` vždy).
- Pracuje se ve worktree `C:\Users\reath\Projects\NenechmeVyhnit-pravidla`, větev `zmeny-pravidel`. Hlavní složku `C:\Users\reath\Projects\NenechmeVyhnit` nepoužívat, souběžně v ní pracují jiné relace.
- **Spouštění testů (Windows):** Vitest i Playwright spouštět z PowerShellu po `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-pravidla'` (velké `C:`). Z Bash cesty `/c/...` Vitest padá chybou `Cannot read properties of undefined (reading 'config')`.
- **E2E a porty:** `npm run build:e2e` sestaví `dist-e2e` a `dist-prazdny` uvnitř worktree. Playwright servíruje 4321 (fixtures) a 4322 (prázdný archiv). Před během zkontrolovat `netstat -ano | findstr ":4321 :4322"`. Když porty drží jiná relace (`astro dev`), nic cizího nezastavovat. Místo toho vytvořit necommitovaný `playwright.local.config.ts` s portem 4331 pro `dist-e2e` (`baseURL: 'http://localhost:4331'`) a spustit `npx playwright test -c playwright.local.config.ts`. Testy volají prázdný archiv natvrdo na 4322, ten musí servírovat `dist-prazdny`.
- **Commity:** zpráva česky, končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Hooky nepřeskakovat.
- Obsahová rešerše (soupis, koncepty v `_koncepty/`) běží souběžně mimo tento plán. Soubory v `_koncepty/` tento plán nemění.

## Review Focus

1. **Zákon vrácený Senátem nebo vetovaný prezidentem a pak přehlasovaný Sněmovnou.** Průběh nesmí ukázat Senát ani Podpis jako hotové a nesmí skončit dřív. Fáze nese poznámku „Vráceno Senátem“ / „Vráceno prezidentem“. → test v Task 1.
2. **Odkaz pravidla na kauzu, kterou daný build nevidí.** Ve veřejném buildu je kauza jen koncept: build projde s varováním a odkaz se nezobrazí. V režimu konceptů míří odkaz na už zveřejněnou kauzu, která v `_koncepty/obsah` není: musí projít, nesmí to být chyba. → testy v Task 3.
3. **Nejdelší povolený název (60 znaků) a pět fází průběhu na mobilu 390×700.** Řádek se složí a stránka se neposouvá dolů. → testovací pravidlo `zakon-omega` má 56 znaků, test velikostí v Task 5.
4. **Hledání bez diakritiky v textu kroků řetězce a v předkladateli** („lhutu k vymahani“ najde „lhůtu k vymáhání“). → jednotkový test v Task 5.
5. **Návštěvník bez JavaScriptu na `/pravidla/<slug>/`.** Všechny části detailu jsou vidět pod sebou, stejně jako u kauz. → e2e test v Task 6.

---

## Mapa souborů

| Soubor | Odpovědnost |
|---|---|
| `src/lib/pravidla-slovnik.ts` (nový) | druhy pravidel, cesty předložení, komu, závěry, popisky, vynechané kontroly |
| `src/lib/pravidla-stavy.ts` (nový) | kroky projednávání, popisky, odvození stavu, fáze průběhu |
| `src/lib/schema.ts` | export sdílených stavebních kamenů (beze změny chování) |
| `src/lib/schema-pravidla.ts` (nový) | `pravidloSchema`, `pravidloSchemaKoncepty`, typy |
| `src/lib/validace.ts` | `overPravidlo`, `overVazbyPravidel`, načtení `pravidla/` v `overAdresar` |
| `src/lib/pravidla.ts` (nový) | řazení pravidel, zpětné vazby kauza → pravidla |
| `src/lib/hledani-pravidel.ts` (nový) | položka hledání a shoda s filtrem (sdílí server i klient) |
| `src/lib/kauzy.ts` | `nactiPravidla`, `maPravidla`, známé kauzy pro režim konceptů |
| `src/layouts/Zaklad.astro`, `src/components/Hlavicka.astro` | položka menu |
| `src/components/PrehledPravidel.astro` (nový) | stránka přehledu (úvod, filtry, seznam) |
| `src/components/PrubehPravidla.astro` (nový) | ukazatel průběhu (řádek i hlavička detailu) |
| `src/components/DetailPravidla.astro` (nový) | modal detailu pravidla |
| `src/components/SeznamZdroju.astro` (nový) | seznam zdrojů s filtrem, sdílený kauzou i pravidlem |
| `src/components/Detail.astro` | použije `SeznamZdroju`, přidá „Související změny pravidel“ |
| `src/pages/pravidla/[...prehled].astro`, `src/pages/pravidla/[slug].astro` (nové) | stránky |
| `src/pages/kauzy/[slug].astro` | předá související pravidla |
| `src/scripts/pravidla-filtr.ts`, `src/scripts/navigace-pravidel.ts` (nové) | filtr a otevírání detailu bez načítání |
| `src/scripts/detail.ts` | snese detail bez mini-osy, klik na krok průběhu |
| `src/styles/pravidla.css` (nový), `src/styles/upravy.css` | vzhled |
| `src/data/metodika.ts`, `src/data/o-projektu.ts` | texty |
| `scripts/over-obsah.ts`, `scripts/archivuj.ts`, `.github/workflows/*.yml` | kontroly a údržba |
| `tests/fixtures/obsah/pravidla/*.md` (nové) | fiktivní pravidla |

---

### Task 1: Slovníky pravidel a odvození průběhu

**Files:**
- Create: `src/lib/pravidla-slovnik.ts`
- Create: `src/lib/pravidla-stavy.ts`
- Test: `tests/unit/pravidla-slovnik.test.ts`
- Modify: `docs/superpowers/specs/2026-11-13-zmeny-pravidel-design.md` (oddíl 5, vynechané kontroly u pozměňovacího návrhu, a oddíl 6, název modulu)

**Interfaces:**
- Produces (`pravidla-slovnik.ts`): `DRUHY_PRAVIDEL`, `type DruhPravidla`, `CESTY`, `type Cesta`, `cestyProDruh(d: DruhPravidla): readonly Cesta[]`, `popisekCesty(c: Cesta): string`, `vynechaneKontroly(c: Cesta): string[]`, `KOMU`, `type Komu`, `popisekKomu(k: readonly Komu[]): string`, `ZAVERY`, `type Zaver`, `popisekZaveru(z: Zaver): string`
- Produces (`pravidla-stavy.ts`): `KROKY`, `type Krok`, `UKONCUJICI: readonly Krok[]`, `krokyProDruh(d: DruhPravidla): readonly Krok[]`, `popisekKroku(k: Krok): string`, `stavPravidla(udalosti: { krok?: Krok }[]): Krok`, `vProjednavani(s: Krok): boolean`, `type Faze = { id: string; nazev: string; datum: string | null; udalost: number | null; poznamka: string | null; hotovo: boolean }`, `prubeh(druh: DruhPravidla, udalosti: { datum: string; krok?: Krok }[]): { faze: Faze[]; konec: { krok: Krok; datum: string; udalost: number } | null }`

Poznámka k odchylce od specifikace: spec uvádí modul `pravidla-cesty.ts`. Slovník obsahuje i „komu“ a závěry, proto se jmenuje `pravidla-slovnik.ts`. U pozměňovacího návrhu spec uvádí „bez vlastní důvodové zprávy“. Pozměňovací návrhy ale obvykle mají krátké odůvodnění, takže tvrzení by bylo napadnutelné. Přesný fakt podle jednacího řádu je „bez stanoviska vlády“ (§ 87 se týká jen návrhů zákonů) a „bez prvního čtení“. Obojí se v tomto tasku opraví i ve specifikaci.

- [ ] **Step 1: Připravit worktree**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-pravidla'
npm ci
npx vitest run
```
Expected: všechny stávající testy PASS. Pokud ne, zastavit a nahlásit, nic neopravovat.

- [ ] **Step 2: Napsat padající test**

`tests/unit/pravidla-slovnik.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { cestyProDruh, popisekCesty, vynechaneKontroly, popisekKomu, popisekZaveru } from '../../src/lib/pravidla-slovnik';
import { krokyProDruh, popisekKroku, stavPravidla, vProjednavani, prubeh, KROKY, UKONCUJICI } from '../../src/lib/pravidla-stavy';

describe('slovník pravidel', () => {
  it('cesty patří k druhům', () => {
    expect(cestyProDruh('zakon')).toEqual(['vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh']);
    expect(cestyProDruh('narizeni-vlady')).toEqual(['narizeni-vlady']);
    expect(cestyProDruh('vyhlaska')).toEqual(['vyhlaska-ministerstva']);
    expect(cestyProDruh('pravidla-programu')).toEqual(['pravidla-programu']);
  });
  it('popisky cest', () => {
    expect(popisekCesty('poslanecky-navrh')).toBe('Poslanecký návrh zákona');
    expect(popisekCesty('pozmenovaci-navrh')).toBe('Pozměňovací návrh');
    expect(popisekCesty('pravidla-programu')).toBe('Pravidla dotačního programu');
  });
  it('vynechané kontroly podle cesty', () => {
    expect(vynechaneKontroly('vladni-navrh')).toEqual([]);
    expect(vynechaneKontroly('narizeni-vlady')).toEqual([]);
    expect(vynechaneKontroly('poslanecky-navrh')).toEqual(['neprošel meziresortním připomínkovým řízením', 'bez hodnocení dopadů regulace (RIA)']);
    expect(vynechaneKontroly('senatni-navrh')).toEqual(vynechaneKontroly('poslanecky-navrh'));
    expect(vynechaneKontroly('pozmenovaci-navrh')).toEqual([
      'neprošel meziresortním připomínkovým řízením', 'bez hodnocení dopadů regulace (RIA)', 'bez stanoviska vlády', 'bez prvního čtení',
    ]);
  });
  it('komu a závěr', () => {
    expect(popisekKomu(['agrofert', 'babis'])).toBe('Andrej Babiš, Agrofert');
    expect(popisekKomu(['agrofert'])).toBe('Agrofert');
    expect(popisekZaveru('dolozen')).toBe('prospěch doložen');
    expect(popisekZaveru('pravdepodobny')).toBe('prospěch pravděpodobný');
  });
});

describe('kroky a stav', () => {
  it('kroky podle druhu', () => {
    expect(krokyProDruh('zakon')).toContain('schvaleno-snemovnou');
    expect(krokyProDruh('zakon')).not.toContain('schvaleno');
    expect(krokyProDruh('narizeni-vlady')).toEqual(['pripominkove-rizeni', 'schvaleno', 'vyhlaseno', 'zruseno', 'zruseno-us']);
    for (const k of [...krokyProDruh('zakon'), ...krokyProDruh('vyhlaska')]) expect(KROKY).toContain(k);
  });
  it('každý krok má popisek', () => {
    for (const k of KROKY) expect(popisekKroku(k).length).toBeGreaterThan(0);
    expect(popisekKroku('zruseno-us')).toBe('Zrušeno Ústavním soudem');
  });
  it('stav je krok poslední události s krokem', () => {
    expect(stavPravidla([{ krok: 'predlozeno' }, {}, { krok: 'schvaleno-snemovnou' }, {}])).toBe('schvaleno-snemovnou');
  });
  it('stav bez kroku je chyba programu', () => {
    expect(() => stavPravidla([{}])).toThrow();
  });
  it('v projednávání', () => {
    expect(vProjednavani('schvaleno-snemovnou')).toBe(true);
    expect(vProjednavani('pripominkove-rizeni')).toBe(true);
    expect(vProjednavani('vyhlaseno')).toBe(false);
    for (const k of UKONCUJICI) expect(vProjednavani(k)).toBe(false);
  });
});

describe('průběh', () => {
  it('zákon: hotové fáze s datem a odkazem na událost', () => {
    const { faze, konec } = prubeh('zakon', [
      { datum: '2026-06-10', krok: 'predlozeno' },
      { datum: '2026-07-01' },
      { datum: '2026-09-20', krok: 'schvaleno-snemovnou' },
    ]);
    expect(faze.map(f => f.nazev)).toEqual(['Podáno', 'Sněmovna', 'Senát', 'Podpis', 'Vyhlášeno']);
    expect(faze.map(f => f.hotovo)).toEqual([true, true, false, false, false]);
    expect(faze[1]).toMatchObject({ datum: '2026-09-20', udalost: 2, poznamka: null });
    expect(faze[2]).toMatchObject({ datum: null, udalost: null });
    expect(konec).toBeNull();
  });
  it('vrácení Senátem a veto se přehlasováním nejsou hotové fáze', () => {
    const { faze, konec } = prubeh('zakon', [
      { datum: '2026-01-10', krok: 'predlozeno' },
      { datum: '2026-03-01', krok: 'schvaleno-snemovnou' },
      { datum: '2026-03-25', krok: 'vraceno-senatem' },
      { datum: '2026-04-10', krok: 'schvaleno-snemovnou' },
      { datum: '2026-04-20', krok: 'vetovano' },
      { datum: '2026-05-05', krok: 'schvaleno-snemovnou' },
      { datum: '2026-05-20', krok: 'vyhlaseno' },
    ]);
    expect(faze.find(f => f.id === 'snemovna')).toMatchObject({ hotovo: true, datum: '2026-05-05', udalost: 5 });
    expect(faze.find(f => f.id === 'senat')).toMatchObject({ hotovo: false, poznamka: 'Vráceno Senátem', udalost: 2 });
    expect(faze.find(f => f.id === 'podpis')).toMatchObject({ hotovo: false, poznamka: 'Vráceno prezidentem', udalost: 4 });
    expect(faze.find(f => f.id === 'vyhlaseno')).toMatchObject({ hotovo: true, udalost: 6 });
    expect(konec).toBeNull();
  });
  it('ukončující krok uzavře průběh', () => {
    const { konec } = prubeh('zakon', [{ datum: '2026-04-02', krok: 'predlozeno' }, { datum: '2026-05-14', krok: 'zamitnuto' }]);
    expect(konec).toEqual({ krok: 'zamitnuto', datum: '2026-05-14', udalost: 1 });
  });
  it('nařízení má vlastní fáze', () => {
    const { faze } = prubeh('narizeni-vlady', [{ datum: '2026-02-01', krok: 'pripominkove-rizeni' }, { datum: '2026-03-01', krok: 'schvaleno' }]);
    expect(faze.map(f => [f.nazev, f.hotovo])).toEqual([['Připomínky', true], ['Schváleno', true], ['Vyhlášeno', false]]);
  });
});
```

- [ ] **Step 3: Spustit test, ověřit, že padá**

Run: `npx vitest run tests/unit/pravidla-slovnik.test.ts`
Expected: FAIL, nelze načíst `../../src/lib/pravidla-slovnik`.

- [ ] **Step 4: Napsat `src/lib/pravidla-slovnik.ts`**

```ts
/** Slovníky části „Změny pravidel“ (specifikace 2026-11-13, oddíl 5). Popisky sdílí web i Metodika. */
export const DRUHY_PRAVIDEL = ['zakon', 'narizeni-vlady', 'vyhlaska', 'pravidla-programu'] as const;
export type DruhPravidla = (typeof DRUHY_PRAVIDEL)[number];

export const CESTY = [
  'vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh',
  'narizeni-vlady', 'vyhlaska-ministerstva', 'pravidla-programu',
] as const;
export type Cesta = (typeof CESTY)[number];

const CESTY_DRUHU: Record<DruhPravidla, readonly Cesta[]> = {
  zakon: ['vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh'],
  'narizeni-vlady': ['narizeni-vlady'],
  vyhlaska: ['vyhlaska-ministerstva'],
  'pravidla-programu': ['pravidla-programu'],
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
};
export const popisekCesty = (c: Cesta): string => POPISKY_CEST[c];

/** Kontroly legislativního procesu, které cesta předložení vynechává (jednací řád Sněmovny,
 *  Legislativní pravidla vlády). Je to popis procesu, ne hodnocení. */
const BEZ_PRIPOMINEK = ['neprošel meziresortním připomínkovým řízením', 'bez hodnocení dopadů regulace (RIA)'];
export function vynechaneKontroly(c: Cesta): string[] {
  if (c === 'poslanecky-navrh' || c === 'senatni-navrh') return [...BEZ_PRIPOMINEK];
  if (c === 'pozmenovaci-navrh') return [...BEZ_PRIPOMINEK, 'bez stanoviska vlády', 'bez prvního čtení'];
  return [];
}

export const KOMU = ['babis', 'agrofert'] as const;
export type Komu = (typeof KOMU)[number];
const POPISKY_KOMU: Record<Komu, string> = { babis: 'Andrej Babiš', agrofert: 'Agrofert' };
/** Vždy v pořadí Babiš, Agrofert, bez ohledu na pořadí v souboru. */
export const popisekKomu = (k: readonly Komu[]): string => KOMU.filter(x => k.includes(x)).map(x => POPISKY_KOMU[x]).join(', ');

export const ZAVERY = ['dolozen', 'pravdepodobny'] as const;
export type Zaver = (typeof ZAVERY)[number];
const POPISKY_ZAVERU: Record<Zaver, string> = { dolozen: 'prospěch doložen', pravdepodobny: 'prospěch pravděpodobný' };
export const popisekZaveru = (z: Zaver): string => POPISKY_ZAVERU[z];
```

- [ ] **Step 5: Napsat `src/lib/pravidla-stavy.ts`**

```ts
import type { DruhPravidla } from './pravidla-slovnik';

/** Kroky projednávání (specifikace 2026-11-13, oddíl 5). Stav pravidla je krok poslední události, která ho má. */
export const KROKY = [
  'pripominkove-rizeni', 'predlozeno', 'schvaleno-snemovnou', 'schvaleno-senatem', 'vraceno-senatem',
  'vetovano', 'podepsano', 'schvaleno', 'vyhlaseno', 'zamitnuto', 'stazeno', 'zruseno', 'zruseno-us',
] as const;
export type Krok = (typeof KROKY)[number];

const KROKY_ZAKONA: readonly Krok[] = [
  'pripominkove-rizeni', 'predlozeno', 'schvaleno-snemovnou', 'schvaleno-senatem', 'vraceno-senatem',
  'vetovano', 'podepsano', 'vyhlaseno', 'zamitnuto', 'stazeno', 'zruseno-us',
];
const KROKY_OSTATNI: readonly Krok[] = ['pripominkove-rizeni', 'schvaleno', 'vyhlaseno', 'zruseno', 'zruseno-us'];
export const krokyProDruh = (d: DruhPravidla): readonly Krok[] => (d === 'zakon' ? KROKY_ZAKONA : KROKY_OSTATNI);

export const UKONCUJICI: readonly Krok[] = ['zamitnuto', 'stazeno', 'zruseno', 'zruseno-us'];
const VRACENI: readonly Krok[] = ['vraceno-senatem', 'vetovano'];

const POPISKY: Record<Krok, string> = {
  'pripominkove-rizeni': 'Připomínkové řízení',
  predlozeno: 'Předloženo',
  'schvaleno-snemovnou': 'Schváleno Sněmovnou',
  'schvaleno-senatem': 'Schváleno Senátem',
  'vraceno-senatem': 'Vráceno Senátem',
  vetovano: 'Vráceno prezidentem',
  podepsano: 'Podepsáno prezidentem',
  schvaleno: 'Schváleno',
  vyhlaseno: 'Vyhlášeno',
  zamitnuto: 'Zamítnuto',
  stazeno: 'Staženo',
  zruseno: 'Zrušeno',
  'zruseno-us': 'Zrušeno Ústavním soudem',
};
export const popisekKroku = (k: Krok): string => POPISKY[k];

/** Schéma zaručuje aspoň jednu událost s krokem; výjimka značí chybu programu, ne obsahu. */
export function stavPravidla(udalosti: readonly { krok?: Krok }[]): Krok {
  for (let i = udalosti.length - 1; i >= 0; i--) {
    const k = udalosti[i].krok;
    if (k) return k;
  }
  throw new Error('Pravidlo nemá žádnou událost s krokem projednávání');
}

export const vProjednavani = (s: Krok): boolean => s !== 'vyhlaseno' && !UKONCUJICI.includes(s);

export type Faze = { id: string; nazev: string; datum: string | null; udalost: number | null; poznamka: string | null; hotovo: boolean };

const FAZE_ZAKONA: { id: string; nazev: string; kroky: readonly Krok[] }[] = [
  { id: 'podano', nazev: 'Podáno', kroky: ['predlozeno'] },
  { id: 'snemovna', nazev: 'Sněmovna', kroky: ['schvaleno-snemovnou'] },
  { id: 'senat', nazev: 'Senát', kroky: ['schvaleno-senatem', 'vraceno-senatem'] },
  { id: 'podpis', nazev: 'Podpis', kroky: ['podepsano', 'vetovano'] },
  { id: 'vyhlaseno', nazev: 'Vyhlášeno', kroky: ['vyhlaseno'] },
];
const FAZE_OSTATNI: typeof FAZE_ZAKONA = [
  { id: 'pripominky', nazev: 'Připomínky', kroky: ['pripominkove-rizeni'] },
  { id: 'schvaleno', nazev: 'Schváleno', kroky: ['schvaleno'] },
  { id: 'vyhlaseno', nazev: 'Vyhlášeno', kroky: ['vyhlaseno'] },
];

/** Fáze pro ukazatel průběhu. Fáze bere poslední událost, jejíž krok k ní patří. Vrácení (Senát, veto)
 *  fázi nedokončí, jen ji označí poznámkou; Sněmovna pak hlasuje znovu a její fáze dostane novější datum. */
export function prubeh(druh: DruhPravidla, udalosti: readonly { datum: string; krok?: Krok }[]): { faze: Faze[]; konec: { krok: Krok; datum: string; udalost: number } | null } {
  const faze = (druh === 'zakon' ? FAZE_ZAKONA : FAZE_OSTATNI).map(f => {
    let i = -1;
    udalosti.forEach((u, j) => { if (u.krok && f.kroky.includes(u.krok)) i = j; });
    const krok = i >= 0 ? udalosti[i].krok! : null;
    const vraceno = krok !== null && VRACENI.includes(krok);
    return {
      id: f.id,
      nazev: f.nazev,
      datum: i >= 0 ? udalosti[i].datum : null,
      udalost: i >= 0 ? i : null,
      poznamka: vraceno ? POPISKY[krok!] : null,
      hotovo: krok !== null && !vraceno,
    };
  });
  let konec: { krok: Krok; datum: string; udalost: number } | null = null;
  udalosti.forEach((u, j) => { if (u.krok && UKONCUJICI.includes(u.krok)) konec = { krok: u.krok, datum: u.datum, udalost: j }; });
  return { faze, konec };
}
```

- [ ] **Step 6: Spustit test, ověřit, že prochází**

Run: `npx vitest run tests/unit/pravidla-slovnik.test.ts`
Expected: PASS.

- [ ] **Step 7: Opravit specifikaci**

V `docs/superpowers/specs/2026-11-13-zmeny-pravidel-design.md`:
- v oddíle 5 nahradit řádek `- \`pozmenovaci-navrh\`: navíc bez prvního čtení a bez vlastní důvodové zprávy,` řádkem `- \`pozmenovaci-navrh\`: navíc bez stanoviska vlády a bez prvního čtení,`,
- v témže oddíle nahradit `` Texty jsou ve slovníku `src/lib/pravidla-cesty.ts` `` textem `` Texty jsou ve slovníku `src/lib/pravidla-slovnik.ts` ``,
- v oddíle 6 nahradit `` `src/lib/pravidla-cesty.ts` (cesty, popisky, vynechané kontroly) `` textem `` `src/lib/pravidla-slovnik.ts` (druhy, cesty, komu, závěry, popisky, vynechané kontroly) ``,
- v oddíle 7 nahradit `Vrácení Senátem nebo veto se ukáže jako vrácení na krok Sněmovny s popiskem,` textem `Vrácení Senátem nebo veto označí fázi Senát nebo Podpis poznámkou („Vráceno Senátem“, „Vráceno prezidentem“) a nové hlasování Sněmovny posune datum fáze Sněmovna,`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/pravidla-slovnik.ts src/lib/pravidla-stavy.ts tests/unit/pravidla-slovnik.test.ts docs/superpowers/specs/2026-11-13-zmeny-pravidel-design.md
git commit -m "Změny pravidel: slovníky druhů, cest a kroků, odvození průběhu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Schéma pravidla

**Files:**
- Modify: `src/lib/schema.ts` (exporty řádků 8, 34–38, 57–58)
- Create: `src/lib/schema-pravidla.ts`
- Modify: `tests/unit/ukazka.ts` (přidat `platnePravidlo`)
- Test: `tests/unit/schema-pravidla.test.ts`

**Interfaces:**
- Consumes: z Task 1 `KROKY`, `krokyProDruh`, `DRUHY_PRAVIDEL`, `CESTY`, `KOMU`, `ZAVERY`, `cestyProDruh`
- Produces: `pravidloSchema`, `pravidloSchemaKoncepty`, `udalostPravidlaSchema`, `type Pravidlo`, `type UdalostPravidla`; `tests/unit/ukazka.ts` → `platnePravidlo(): Record<string, unknown>`
- Produces (`schema.ts`, nově exportované): `naText`, `datum`, `datumPresne`, `text`, `odkazy`, `idTvar`, `popisVazby`

- [ ] **Step 1: Přidat vzorové pravidlo do `tests/unit/ukazka.ts`**

Na konec souboru:

```ts
export function platnePravidlo(): Record<string, unknown> {
  return {
    nazev: 'Testovací novela Omega',
    shrnuti: 'Fiktivní novela by zkrátila fiktivní lhůtu k vymáhání fiktivních dotací.',
    druh: 'zakon',
    cesta: 'poslanecky-navrh',
    predkladatel: 'fiktivní poslanci A a B',
    stitky: ['dotace'],
    overeno: '2026-11-09',
    zdroje: [
      { id: 1, vydavatel: 'Fiktivní sněmovna', titulek: 'Fiktivní tisk 1', datum: '2026-06-10', druh: 'primarni', url: 'https://example.com/tisk' },
      { id: 2, vydavatel: 'Fiktivní deník', titulek: 'Fond vymáhá dotace', datum: '2026-06-12', druh: 'media', url: 'https://example.com/clanek' },
      { id: 3, vydavatel: 'Fiktivní poslanec A', titulek: 'Prohlášení', datum: '2026-06-15', druh: 'stanovisko', url: 'https://example.com/prohlaseni' },
    ],
    udalosti: [{ datum: '2026-06-10', krok: 'predlozeno', nazev: 'Návrh podán', popis: 'Fiktivní poslanci podali návrh.', zdroje: [1] }],
    prospech: {
      komu: ['agrofert'],
      zaver: 'dolozen',
      retezec: [
        { text: 'Novela by zkrátila fiktivní lhůtu z deseti na čtyři roky.', zdroje: [1] },
        { text: 'Fiktivní fond vymáhá po fiktivní firmě dotace.', zdroje: [2] },
      ],
    },
    stanovisko: { text: 'Předkladatel souvislost s firmou odmítá.', zdroje: [3] },
  };
}
```

- [ ] **Step 2: Napsat padající test**

`tests/unit/schema-pravidla.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pravidloSchema, pravidloSchemaKoncepty } from '../../src/lib/schema-pravidla';
import { platnePravidlo } from './ukazka';

const chyby = (data: unknown, schema = pravidloSchema) => {
  const r = schema.safeParse(data);
  return r.success ? [] : r.error.issues.map(i => i.message);
};
const s = (upravy: (p: any) => void) => { const p: any = platnePravidlo(); upravy(p); return p; };

describe('pravidloSchema', () => {
  it('přijme platné pravidlo a doplní výchozí hodnoty', () => {
    expect(chyby(platnePravidlo())).toEqual([]);
    const p = pravidloSchema.parse(platnePravidlo());
    expect(p.vyhrady).toEqual([]);
    expect(p.kauzy).toEqual([]);
    expect(p.opravy).toEqual([]);
    expect(p.prospech.retezec[0].odhad).toBe(false);
  });
  it('převede data z YAML (Date) na text, i účinnost v budoucnosti', () => {
    const p = pravidloSchema.parse({ ...platnePravidlo(), overeno: new Date('2026-11-09T00:00:00Z'), ucinnostOd: new Date('2099-01-01T00:00:00Z') });
    expect(p.overeno).toBe('2026-11-09');
    expect(p.ucinnostOd).toBe('2099-01-01');
  });
  it('odmítne neexistující datum účinnosti', () => expect(chyby({ ...platnePravidlo(), ucinnostOd: '2027-02-30' }).join(' ')).toMatch(/Datum účinnosti neexistuje/));
  it('odmítne událost v budoucnosti', () => expect(chyby(s(p => { p.udalosti[0].datum = '2099-01-01'; })).join(' ')).toMatch(/leží v budoucnosti/));
  it('odmítne název delší než 60 znaků', () => expect(chyby({ ...platnePravidlo(), nazev: 'x'.repeat(61) }).join(' ')).toMatch(/nejvýš 60 znaků/));
  it('odmítne chybějící stanovisko', () => expect(chyby(s(p => { delete p.stanovisko; })).length).toBeGreaterThan(0));
  it('odmítne chybějící ověření mimo režim konceptů, v konceptech smí být null', () => {
    expect(chyby(s(p => { delete p.overeno; })).length).toBeGreaterThan(0);
    expect(chyby(s(p => { p.overeno = null; }), pravidloSchemaKoncepty)).toEqual([]);
  });
  it('odmítne neznámou vlastnost', () => expect(chyby({ ...platnePravidlo(), typ: 'kauza' }).length).toBeGreaterThan(0));

  describe('řetězec a závěr', () => {
    it('řetězec musí mít aspoň 2 kroky', () => expect(chyby(s(p => { p.prospech.retezec.pop(); })).join(' ')).toMatch(/aspoň 2 kroky/));
    it('doložený prospěch nesmí mít odhad', () => expect(chyby(s(p => { p.prospech.retezec[1].odhad = true; })).join(' ')).toMatch(/nesmí mít krok s odhadem/));
    it('pravděpodobný prospěch musí mít odhad', () => expect(chyby(s(p => { p.prospech.zaver = 'pravdepodobny'; })).join(' ')).toMatch(/vyžaduje aspoň jeden krok s odhadem/));
    it('pravděpodobný prospěch s odhadem projde', () => expect(chyby(s(p => { p.prospech.zaver = 'pravdepodobny'; p.prospech.retezec[1].odhad = true; }))).toEqual([]));
    it('první krok musí mít primární zdroj', () => expect(chyby(s(p => { p.prospech.retezec[0].zdroje = [2]; })).join(' ')).toMatch(/První krok řetězce .* primární zdroj/));
    it('komu musí být neprázdné a bez opakování', () => {
      expect(chyby(s(p => { p.prospech.komu = []; })).length).toBeGreaterThan(0);
      expect(chyby(s(p => { p.prospech.komu = ['babis', 'babis']; })).join(' ')).toMatch(/dvakrát/);
      expect(chyby(s(p => { p.prospech.komu = ['zemedelci']; })).length).toBeGreaterThan(0);
    });
  });

  describe('cesta a kroky', () => {
    it('pozměňovací návrh vyžaduje pripojenoK', () => expect(chyby(s(p => { p.cesta = 'pozmenovaci-navrh'; })).join(' ')).toMatch(/ke kterému zákonu/));
    it('pozměňovací návrh s pripojenoK projde', () => expect(chyby(s(p => { p.cesta = 'pozmenovaci-navrh'; p.pripojenoK = { nazev: 'Fiktivní zákon', zdroje: [1] }; }))).toEqual([]));
    it('pripojenoK u jiné cesty je chyba', () => expect(chyby(s(p => { p.pripojenoK = { nazev: 'Fiktivní zákon', zdroje: [1] }; })).join(' ')).toMatch(/patří jen k pozměňovacímu návrhu/));
    it('cesta musí patřit k druhu', () => expect(chyby(s(p => { p.druh = 'narizeni-vlady'; })).join(' ')).toMatch(/nepatří k druhu/));
    it('aspoň jedna událost musí mít krok', () => expect(chyby(s(p => { delete p.udalosti[0].krok; })).join(' ')).toMatch(/krok projednávání/));
    it('krok musí patřit k druhu', () => expect(chyby(s(p => { p.udalosti[0].krok = 'schvaleno'; })).join(' ')).toMatch(/Krok „schvaleno“ .* nepatří k druhu „zakon“/));
    it('neznámý krok je chyba', () => expect(chyby(s(p => { p.udalosti[0].krok = 'odhlasovano'; })).length).toBeGreaterThan(0));
  });

  describe('odkazy a pořadí', () => {
    it('duplicitní id zdroje', () => expect(chyby(s(p => { p.zdroje[1].id = 1; })).join(' ')).toMatch(/Duplicitní id zdroje 1/));
    it.each([
      ['událost', (p: any) => { p.udalosti[0].zdroje = [9]; }, /Událost 1 \(„Návrh podán“\) odkazuje na neexistující zdroj 9/],
      ['stanovisko', (p: any) => { p.stanovisko.zdroje = [9]; }, /Stanovisko odkazuje na neexistující zdroj 9/],
      ['krok řetězce', (p: any) => { p.prospech.retezec[1].zdroje = [9]; }, /Krok řetězce 2 odkazuje na neexistující zdroj 9/],
      ['další dotčení', (p: any) => { p.prospech.dalsiDotceni = { text: 'Velké podniky.', zdroje: [9] }; }, /Další dotčení odkazuje na neexistující zdroj 9/],
      ['výhrada', (p: any) => { p.vyhrady = [{ kdo: 'Fiktivní rada', text: 'Výhrada.', zdroje: [9] }]; }, /Výhrada \(„Fiktivní rada“\) odkazuje na neexistující zdroj 9/],
      ['vazba na kauzu', (p: any) => { p.kauzy = [{ kauza: 'kauza-a', popis: 'Souvisí.', zdroje: [9] }]; }, /Vazba na kauzu „kauza-a“ odkazuje na neexistující zdroj 9/],
    ])('neexistující zdroj: %s', (_, uprava, hlaska) => expect(chyby(s(uprava)).join(' ')).toMatch(hlaska));
    it('vazba na kauzu dvakrát', () => expect(chyby(s(p => { p.kauzy = [{ kauza: 'a', popis: 'x', zdroje: [2] }, { kauza: 'a', popis: 'y', zdroje: [2] }]; })).join(' ')).toMatch(/Vazba na kauzu „a“ je uvedena dvakrát/));
    it('události musí jít chronologicky', () => {
      const p = s(p => { p.udalosti.push({ datum: '2026-05-01', nazev: 'Dřívější', popis: 'x', zdroje: [1] }); });
      expect(chyby(p).join(' ')).toMatch(/nejsou v časovém pořadí/);
    });
  });
});
```

- [ ] **Step 3: Spustit test, ověřit, že padá**

Run: `npx vitest run tests/unit/schema-pravidla.test.ts`
Expected: FAIL, nelze načíst `../../src/lib/schema-pravidla`.

- [ ] **Step 4: Exportovat stavební kameny ze `src/lib/schema.ts`**

Přidat `export` před tyto deklarace a nic jiného neměnit:
- řádek 8: `const naText = …` → `export const naText = …`
- řádky 34–38: `const datum`, `const datumPresne`, `const text`, `const odkazHttp`, `const odkazy` → `export const …` (`odkazHttp` také, kvůli jednotnosti bloku)
- řádky 57–58: `const idTvar`, `const popisVazby` → `export const …`

- [ ] **Step 5: Napsat `src/lib/schema-pravidla.ts`**

```ts
import { z } from 'astro/zod';
import { naText, existujeDatum, datum, datumPresne, text, odkazy, idTvar, popisVazby, zdrojSchema, udalostSchema } from './schema';
import { KROKY, krokyProDruh } from './pravidla-stavy';
import { DRUHY_PRAVIDEL, CESTY, KOMU, ZAVERY, cestyProDruh } from './pravidla-slovnik';

/** Účinnost je jediné datum pravidla, které smí ležet v budoucnosti. */
const ucinnost = z.preprocess(naText, z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Účinnost musí být ve tvaru RRRR-MM-DD')
  .refine(existujeDatum, 'Datum účinnosti neexistuje'));
const sZdroji = (co: string) => z.object({ text: text(), zdroje: odkazy(co) }).strict();

export const udalostPravidlaSchema = udalostSchema.extend({ krok: z.enum(KROKY).optional() }).strict();
const krokRetezceSchema = z.object({ text: text(), odhad: z.boolean().default(false), zdroje: odkazy('Krok řetězce') }).strict();

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
    overeno: koncepty ? datumPresne.nullable().default(null) : datumPresne,
    zdroje: z.array(zdrojSchema).min(1, 'Pravidlo musí mít aspoň jeden zdroj'),
    udalosti: z.array(udalostPravidlaSchema).min(1, 'Pravidlo musí mít aspoň jednu událost'),
    prospech: z.object({
      komu: z.array(z.enum(KOMU)).min(1, 'Řetězec musí vést aspoň k jednomu z: babis, agrofert'),
      zaver: z.enum(ZAVERY),
      retezec: z.array(krokRetezceSchema).min(2, 'Řetězec prospěchu musí mít aspoň 2 kroky'),
      dalsiDotceni: sZdroji('Další dotčení').optional(),
    }).strict(),
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
    over(p.stanovisko.zdroje, 'Stanovisko');
    if (p.pripojenoK) over(p.pripojenoK.zdroje, 'Připojení k zákonu');
    p.prospech.retezec.forEach((k, i) => over(k.zdroje, `Krok řetězce ${i + 1}`));
    if (p.prospech.dalsiDotceni) over(p.prospech.dalsiDotceni.zdroje, 'Další dotčení');
    p.vyhrady.forEach(v => over(v.zdroje, `Výhrada („${v.kdo}“)`));
    p.kauzy.forEach(k => over(k.zdroje, `Vazba na kauzu „${k.kauza}“`));

    // Závěr řetězce (spec, oddíl 4)
    const odhadu = p.prospech.retezec.filter(k => k.odhad).length;
    if (p.prospech.zaver === 'dolozen' && odhadu > 0) chyba('Závěr „prospěch doložen“ nesmí mít krok s odhadem (použijte zaver: pravdepodobny)');
    if (p.prospech.zaver === 'pravdepodobny' && odhadu === 0) chyba('Závěr „prospěch pravděpodobný“ vyžaduje aspoň jeden krok s odhadem (jinak zaver: dolozen)');
    const prvni = p.prospech.retezec[0];
    if (prvni && !p.zdroje.some(zd => zd.druh === 'primarni' && prvni.zdroje.includes(zd.id)))
      chyba('První krok řetězce (co pravidlo mění) musí mít primární zdroj, tedy text předpisu');
    if (new Set(p.prospech.komu).size !== p.prospech.komu.length) chyba('Pole komu obsahuje stejnou hodnotu dvakrát');

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
```

- [ ] **Step 6: Spustit testy schémat**

Run: `npx vitest run tests/unit/schema-pravidla.test.ts tests/unit/schema.test.ts`
Expected: PASS. Kdyby test „odmítne neznámou vlastnost“ prošel jen díky `typ`, ověřit, že `udalostSchema.extend(...).strict()` odmítá i neznámé klíče v události: dočasně přidat `p.udalosti[0].x = 1` a ověřit chybu. Úpravu pak vrátit.

- [ ] **Step 7: Commit**

```bash
git add src/lib/schema.ts src/lib/schema-pravidla.ts tests/unit/ukazka.ts tests/unit/schema-pravidla.test.ts
git commit -m "Změny pravidel: schéma s řetězcem prospěchu, cestou předložení a kroky

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Validace adresáře, vazby na kauzy a testovací pravidla

**Files:**
- Modify: `src/lib/validace.ts`
- Create: `src/lib/pravidla.ts`
- Create: `tests/fixtures/obsah/pravidla/zakon-omega.md`, `pozmenovaci-sigma.md`, `narizeni-tau.md`
- Modify: `scripts/over-obsah.ts`
- Test: `tests/unit/validace-pravidla.test.ts`

**Interfaces:**
- Consumes: `pravidloSchema`, `pravidloSchemaKoncepty`, `type Pravidlo` (Task 2); `stavPravidla`, `popisekKroku` (Task 1)
- Produces (`validace.ts`): `type PravidloZaznam = { slug: string; pravidlo: Pravidlo; telo: string }`; `type Rezim = { koncepty?: boolean; znameKauzy?: Iterable<string> }`; `overPravidlo(soubor: string, data: unknown, telo: string, stitky: Set<string>, rezim?: Rezim): { pravidlo?: Pravidlo; chyby: Chyba[] }`; `overVazbyPravidel(adresar: string, pravidla: PravidloZaznam[], slugyKauz: Set<string>, rezim?: Rezim): { pravidla: PravidloZaznam[]; chyby: Chyba[]; varovani: Chyba[] }`; `overAdresar(...)` vrací navíc `pravidla: PravidloZaznam[]` (seřazená) a varování z obou vazeb
- Produces (`pravidla.ts`): `posledniDatum(z: PravidloZaznam): string`; `seraditPravidla(p: PravidloZaznam[]): PravidloZaznam[]`; `type SouvisejiciPravidlo = { slug: string; nazev: string; popis: string; stav: string }`; `pravidlaKauzy(pravidla: PravidloZaznam[], slug: string): SouvisejiciPravidlo[]`
- Testovací data (používají Tasky 5–7): `zakon-omega` (poslanecký návrh, stav Schváleno Sněmovnou, pravděpodobný prospěch, vazba na `zeta-stret`, výhrada), `pozmenovaci-sigma` (pozměňovací návrh, zamítnutý), `narizeni-tau` (nařízení, vyhlášeno, se Souvislostmi). Pořadí od nejnovější poslední události: omega, sigma, tau.

- [ ] **Step 1: Vytvořit testovací pravidla**

`tests/fixtures/obsah/pravidla/zakon-omega.md`:

```markdown
---
nazev: Testovací novela zákona Omega s dlouhým názvem pro mobil
shrnuti: Fiktivní poslanecká novela by zkrátila fiktivní lhůtu k vymáhání fiktivních dotací.
druh: zakon
cesta: poslanecky-navrh
predkladatel: fiktivní poslanci A, B a C
oznaceni: fiktivní sněmovní tisk 1
stitky: [dotace, stret-zajmu]
overeno: 2026-11-09
zdroje:
  - { id: 1, vydavatel: Fiktivní sněmovna, titulek: Fiktivní sněmovní tisk 1, datum: 2026-06-10, druh: primarni, url: "https://example.com/omega/tisk" }
  - { id: 2, vydavatel: Fiktivní deník, titulek: Fiktivní fond vymáhá dotace, datum: 2026-06-12, druh: media, url: "https://example.com/omega/clanek" }
  - { id: 3, vydavatel: Fiktivní poslanec A, titulek: Prohlášení předkladatele, datum: 2026-06-15, druh: stanovisko, url: "https://example.com/omega/prohlaseni" }
  - { id: 4, vydavatel: Fiktivní legislativní rada, titulek: Stanovisko rady, datum: 2026-07-01, druh: primarni, url: "https://example.com/omega/rada" }
udalosti:
  - { datum: 2026-06-10, krok: predlozeno, nazev: Návrh podán, popis: Fiktivní poslanci podali návrh., zdroje: [1] }
  - { datum: 2026-09-20, krok: schvaleno-snemovnou, nazev: Schváleno Sněmovnou, popis: Fiktivní sněmovna návrh schválila., zdroje: [1] }
prospech:
  komu: [babis, agrofert]
  zaver: pravdepodobny
  retezec:
    - { text: Novela by zkrátila fiktivní lhůtu k vymáhání z deseti na čtyři roky., zdroje: [1] }
    - { text: Fiktivní fond vymáhá po fiktivní firmě dotace z let 2017–2021., zdroje: [2] }
    - { text: Zkrácení by se vztáhlo i na zahájená řízení., odhad: true, zdroje: [2] }
vyhrady:
  - { kdo: Fiktivní legislativní rada, text: Rada upozornila na fiktivní zpětnou účinnost., zdroje: [4] }
stanovisko:
  text: Předkladatel tvrdí, že novela nevznikla kvůli konkrétní firmě.
  zdroje: [3]
kauzy:
  - { kauza: zeta-stret, popis: Zkrácení lhůty by se dotklo fiktivního řízení Žeta., zdroje: [2] }
---
```

`tests/fixtures/obsah/pravidla/pozmenovaci-sigma.md`:

```markdown
---
nazev: Testovací pozměňovací návrh Sigma
shrnuti: Fiktivní pozměňovací návrh by rozšířil fiktivní dotaci na velké podniky.
druh: zakon
cesta: pozmenovaci-navrh
predkladatel: fiktivní poslanec D
pripojenoK:
  nazev: Fiktivní novela zákona o fiktivních dotacích
  zdroje: [1]
stitky: [dotace]
overeno: 2026-11-09
zdroje:
  - { id: 1, vydavatel: Fiktivní sněmovna, titulek: Pozměňovací návrh Sigma, datum: 2026-04-02, druh: primarni, url: "https://example.com/sigma/navrh" }
  - { id: 2, vydavatel: Fiktivní fond, titulek: Seznam příjemců, datum: 2026-03-01, druh: primarni, url: "https://example.com/sigma/prijemci" }
  - { id: 3, vydavatel: Fiktivní poslanec D, titulek: Odůvodnění návrhu, datum: 2026-04-02, druh: stanovisko, url: "https://example.com/sigma/oduvodneni" }
udalosti:
  - { datum: 2026-04-02, krok: predlozeno, nazev: Návrh podán ve druhém čtení, popis: Fiktivní poslanec podal pozměňovací návrh., zdroje: [1] }
  - { datum: 2026-05-14, krok: zamitnuto, nazev: Návrh zamítnut, popis: Fiktivní sněmovna návrh nepřijala., zdroje: [1] }
prospech:
  komu: [agrofert]
  zaver: dolozen
  retezec:
    - { text: Návrh by zrušil fiktivní strop dotace pro velké podniky., zdroje: [1] }
    - { text: Fiktivní firma je největším příjemcem fiktivní dotace., zdroje: [2] }
stanovisko:
  text: Předkladatel uvádí, že strop poškozuje všechny velké podniky.
  zdroje: [3]
---
```

`tests/fixtures/obsah/pravidla/narizeni-tau.md`:

```markdown
---
nazev: Testovací nařízení Tau
shrnuti: Fiktivní nařízení vlády mění fiktivní podmínky fiktivního programu.
druh: narizeni-vlady
cesta: narizeni-vlady
predkladatel: Fiktivní vláda
ucinnostOd: 2027-01-01
stitky: [eu-fondy]
overeno: 2026-11-09
zdroje:
  - { id: 1, vydavatel: Fiktivní Sbírka zákonů, titulek: Nařízení vlády Tau, datum: 2026-03-15, druh: primarni, url: "https://example.com/tau/narizeni" }
  - { id: 2, vydavatel: Fiktivní rozhlas, titulek: Nařízení Tau a fiktivní firma, datum: 2026-03-16, druh: media, url: "https://example.com/tau/zprava" }
  - { id: 3, vydavatel: Fiktivní ministerstvo, titulek: Odůvodnění nařízení, datum: 2026-02-01, druh: stanovisko, url: "https://example.com/tau/oduvodneni" }
udalosti:
  - { datum: 2026-02-01, krok: pripominkove-rizeni, nazev: Připomínkové řízení, popis: Fiktivní ministerstvo rozeslalo návrh., zdroje: [3] }
  - { datum: 2026-03-01, krok: schvaleno, nazev: Vláda schválila, popis: Fiktivní vláda nařízení schválila., zdroje: [1] }
  - { datum: 2026-03-15, krok: vyhlaseno, nazev: Vyhlášeno, popis: Nařízení vyšlo ve fiktivní Sbírce., zdroje: [1] }
prospech:
  komu: [agrofert]
  zaver: dolozen
  retezec:
    - { text: Nařízení by navýšilo fiktivní sazbu pro chov drůbeže., zdroje: [1] }
    - { text: Fiktivní firma provozuje největší fiktivní drůbežárny., zdroje: [2] }
stanovisko:
  text: Ministerstvo uvádí, že nařízení podporuje všechny chovatele.
  zdroje: [3]
---
Fiktivní nařízení navazuje na fiktivní program z minulých let.[^1]
```

- [ ] **Step 2: Napsat padající test**

`tests/unit/validace-pravidla.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { overPravidlo, overVazbyPravidel, overAdresar, type PravidloZaznam } from '../../src/lib/validace';
import { pravidloSchema } from '../../src/lib/schema-pravidla';
import { pravidlaKauzy, seraditPravidla } from '../../src/lib/pravidla';
import { platnePravidlo } from './ukazka';

const STITKY = new Set(['dotace']);
const zaznam = (slug: string, upravy: Record<string, unknown> = {}): PravidloZaznam =>
  ({ slug, pravidlo: pravidloSchema.parse({ ...platnePravidlo(), ...upravy }), telo: '' });

describe('overPravidlo', () => {
  it('platné pravidlo bez chyb', () => {
    const r = overPravidlo('p.md', platnePravidlo(), '', STITKY);
    expect(r.chyby).toEqual([]);
    expect(r.pravidlo?.nazev).toBe('Testovací novela Omega');
  });
  it('neznámý štítek', () => {
    const r = overPravidlo('p.md', { ...platnePravidlo(), stitky: ['neznamy'] }, '', STITKY);
    expect(r.chyby[0].zprava).toMatch(/Neznámý štítek „neznamy“/);
  });
  it('odstavec souvislostí bez poznámky a poznámka na neexistující zdroj', () => {
    const r = overPravidlo('p.md', platnePravidlo(), 'S poznámkou.[^1]\n\nBez poznámky.\n\nŠpatně.[^8]', STITKY);
    const t = r.chyby.map(c => c.zprava).join(' ');
    expect(t).toMatch(/Odstavec 2 souvislostí nemá poznámku/);
    expect(t).toMatch(/Poznámka \[\^8\] odkazuje na neexistující zdroj/);
  });
  it('chyba schématu nese cestu k poli a název souboru', () => {
    const r = overPravidlo('obsah/pravidla/x.md', { ...platnePravidlo(), druh: 'zakonik' }, '', STITKY);
    expect(r.chyby[0].zprava).toMatch(/^druh:/);
    expect(r.chyby.every(c => c.soubor === 'obsah/pravidla/x.md')).toBe(true);
  });
  it('v režimu konceptů smí chybět ověření', () => {
    const p = { ...platnePravidlo(), overeno: null };
    expect(overPravidlo('p.md', p, '', STITKY).chyby.length).toBeGreaterThan(0);
    expect(overPravidlo('p.md', p, '', STITKY, { koncepty: true }).chyby).toEqual([]);
  });
});

describe('overVazbyPravidel', () => {
  const sVazbou = () => zaznam('novela-x', { kauzy: [{ kauza: 'kauza-a', popis: 'Souvisí.', zdroje: [2] }] });
  it('vazba na existující kauzu zůstane', () => {
    const r = overVazbyPravidel('obsah', [sVazbou()], new Set(['kauza-a']));
    expect(r.chyby).toEqual([]);
    expect(r.varovani).toEqual([]);
    expect(r.pravidla[0].pravidlo.kauzy).toHaveLength(1);
  });
  it('veřejný build neznámou kauzu vynechá s varováním', () => {
    const r = overVazbyPravidel('obsah', [sVazbou()], new Set());
    expect(r.chyby).toEqual([]);
    expect(r.varovani[0].zprava).toMatch(/Vazba na neexistující kauzu „kauza-a“ \(vazba se nezobrazí\)/);
    expect(r.pravidla[0].pravidlo.kauzy).toEqual([]);
  });
  it('režim konceptů hlásí neznámou kauzu jako chybu', () => {
    const r = overVazbyPravidel('obsah', [sVazbou()], new Set(), { koncepty: true });
    expect(r.chyby[0].zprava).toMatch(/Vazba na neexistující kauzu „kauza-a“/);
  });
  it('v režimu konceptů projde kauza ze zveřejněného archivu', () => {
    const r = overVazbyPravidel('obsah', [sVazbou()], new Set(), { koncepty: true, znameKauzy: ['kauza-a'] });
    expect(r.chyby).toEqual([]);
    expect(r.pravidla[0].pravidlo.kauzy).toHaveLength(1);
  });
  it('slug shodný s kauzou je chyba', () => {
    const r = overVazbyPravidel('obsah', [zaznam('kauza-a')], new Set(['kauza-a']));
    expect(r.chyby[0].zprava).toMatch(/Slug „kauza-a“ už používá kauza/);
  });
});

describe('overAdresar s pravidly', () => {
  it('načte fiktivní pravidla seřazená od nejnovější události', () => {
    const r = overAdresar('tests/fixtures/obsah');
    expect(r.chyby).toEqual([]);
    expect(r.pravidla.map(p => p.slug)).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau']);
    expect(r.zaznamy).toHaveLength(6);
  });
  it('prázdný archiv nemá pravidla', () => {
    const r = overAdresar('tests/fixtures/prazdny');
    expect(r.chyby).toEqual([]);
    expect(r.pravidla).toEqual([]);
  });
});

describe('řazení a zpětné vazby', () => {
  it('stejné datum řadí podle názvu', () => {
    const a = zaznam('a', { nazev: 'Beta' }), b = zaznam('b', { nazev: 'Alfa' });
    expect(seraditPravidla([a, b]).map(z => z.slug)).toEqual(['b', 'a']);
  });
  it('kauza zná pravidla, která na ni odkazují', () => {
    const r = overAdresar('tests/fixtures/obsah');
    expect(pravidlaKauzy(r.pravidla, 'zeta-stret')).toEqual([{
      slug: 'zakon-omega',
      nazev: 'Testovací novela zákona Omega s dlouhým názvem pro mobil',
      popis: 'Zkrácení lhůty by se dotklo fiktivního řízení Žeta.',
      stav: 'Schváleno Sněmovnou',
    }]);
    expect(pravidlaKauzy(r.pravidla, 'alfa-dotace')).toEqual([]);
  });
});
```

- [ ] **Step 3: Spustit test, ověřit, že padá**

Run: `npx vitest run tests/unit/validace-pravidla.test.ts`
Expected: FAIL (`overPravidlo` není exportováno, `src/lib/pravidla` neexistuje).

- [ ] **Step 4: Napsat `src/lib/pravidla.ts`**

```ts
import type { PravidloZaznam } from './validace';
import { stavPravidla, popisekKroku } from './pravidla-stavy';

/** Události jdou chronologicky (hlídá schéma), poslední je tedy nejnovější. */
export const posledniDatum = (z: PravidloZaznam): string => z.pravidlo.udalosti[z.pravidlo.udalosti.length - 1].datum;

export function seraditPravidla(p: PravidloZaznam[]): PravidloZaznam[] {
  return [...p].sort((a, b) => posledniDatum(b).localeCompare(posledniDatum(a)) || a.pravidlo.nazev.localeCompare(b.pravidlo.nazev, 'cs'));
}

export type SouvisejiciPravidlo = { slug: string; nazev: string; popis: string; stav: string };

/** „Související změny pravidel“ v detailu kauzy: sestaví se zpětně z polí `kauzy` všech pravidel. */
export function pravidlaKauzy(pravidla: PravidloZaznam[], slug: string): SouvisejiciPravidlo[] {
  return pravidla.flatMap(z => z.pravidlo.kauzy
    .filter(k => k.kauza === slug)
    .map(k => ({ slug: z.slug, nazev: z.pravidlo.nazev, popis: k.popis, stav: popisekKroku(stavPravidla(z.pravidlo.udalosti)) })));
}
```

- [ ] **Step 5: Upravit `src/lib/validace.ts`**

5a. Importy na začátku souboru doplnit:

```ts
import { pravidloSchema, pravidloSchemaKoncepty, type Pravidlo } from './schema-pravidla';
import { seraditPravidla } from './pravidla';
```

5b. Nahradit typ `Rezim` a přidat `PravidloZaznam`:

```ts
export type KauzaZaznam = { slug: string; kauza: Kauza; telo: string };
export type PravidloZaznam = { slug: string; pravidlo: Pravidlo; telo: string };
/** koncepty: lokální náhled neověřených konceptů (smí chybět overeno). Nikdy pro veřejný web.
 *  znameKauzy: slugy kauz mimo načítaný adresář (náhled konceptů nevidí zveřejněné kauzy, pravidla na ně ale odkazují). */
export type Rezim = { koncepty?: boolean; znameKauzy?: Iterable<string> };
```

5c. Kontrolu odstavců z `overKauzu` vytáhnout do sdílené funkce a v `overKauzu` ji použít (chování beze změny):

```ts
function overSouvislosti(soubor: string, telo: string, ids: Set<number>): Chyba[] {
  const chyby: Chyba[] = [];
  rozdelOdstavce(telo).forEach((o, i) => {
    const p = poznamkyVOdstavci(o);
    if (p.length === 0) chyby.push({ soubor, zprava: `Odstavec ${i + 1} souvislostí nemá poznámku se zdrojem [^n]` });
    for (const n of p) if (!ids.has(n)) chyby.push({ soubor, zprava: `Poznámka [^${n}] odkazuje na neexistující zdroj` });
  });
  return chyby;
}
```

V `overKauzu` nahradit blok `const ids = …; rozdelOdstavce(telo).forEach(…);` řádkem:

```ts
  chyby.push(...overSouvislosti(soubor, telo, new Set(k.zdroje.map(z => z.id))));
```

5d. Pod `overKauzu` přidat:

```ts
export function overPravidlo(soubor: string, data: unknown, telo: string, stitky: Set<string>, rezim: Rezim = {}): { pravidlo?: Pravidlo; chyby: Chyba[] } {
  const chyby: Chyba[] = [];
  const r = (rezim.koncepty ? pravidloSchemaKoncepty : pravidloSchema).safeParse(data);
  if (!r.success) {
    for (const i of r.error.issues) chyby.push({ soubor, zprava: `${i.path.join('.') || 'pravidlo'}: ${i.message}` });
    return { chyby };
  }
  const p = r.data;
  for (const s of p.stitky) if (!stitky.has(s)) chyby.push({ soubor, zprava: `Neznámý štítek „${s}“ (doplňte ho do stitky.yml)` });
  chyby.push(...overSouvislosti(soubor, telo, new Set(p.zdroje.map(z => z.id))));
  return chyby.length ? { chyby } : { pravidlo: p, chyby };
}

/** Vazby pravidel na kauzy. Stejně jako overVazby: veřejný build neexistující kauzu vynechá s varováním,
 *  v režimu konceptů je to chyba. Slug pravidla se nesmí shodovat se slugem kauzy. */
export function overVazbyPravidel(adresar: string, pravidla: PravidloZaznam[], slugyKauz: Set<string>, rezim: Rezim = {}): { pravidla: PravidloZaznam[]; chyby: Chyba[]; varovani: Chyba[] } {
  const chyby: Chyba[] = [];
  const varovani: Chyba[] = [];
  const zname = new Set([...slugyKauz, ...(rezim.znameKauzy ?? [])]);
  const vysledek = pravidla.map(z => {
    const soubor = join(adresar, 'pravidla', `${z.slug}.md`);
    if (zname.has(z.slug)) chyby.push({ soubor, zprava: `Slug „${z.slug}“ už používá kauza; pravidlo musí mít jiný název souboru` });
    const kauzy = z.pravidlo.kauzy.filter(k => {
      if (zname.has(k.kauza)) return true;
      const zprava = `Vazba na neexistující kauzu „${k.kauza}“`;
      if (rezim.koncepty) chyby.push({ soubor, zprava });
      else varovani.push({ soubor, zprava: `${zprava} (vazba se nezobrazí)` });
      return false;
    });
    return { ...z, pravidlo: { ...z.pravidlo, kauzy } };
  });
  return { pravidla: vysledek, chyby, varovani };
}
```

5e. Nahradit celé `overAdresar`:

```ts
type SouborObsahu = { slug: string; soubor: string; data: unknown; content: string };

function nactiSlozku(adresar: string, nazev: string, chyby: Chyba[]): SouborObsahu[] {
  const slozka = join(adresar, nazev);
  const soubory = existsSync(slozka) ? readdirSync(slozka).filter(f => f.endsWith('.md')).sort() : [];
  const vysledek: SouborObsahu[] = [];
  for (const f of soubory) {
    const soubor = join(slozka, f);
    const slug = basename(f, '.md');
    if (!/^[a-z0-9-]+$/.test(slug)) { chyby.push({ soubor, zprava: 'Název souboru smí obsahovat jen malá písmena bez diakritiky, číslice a pomlčky' }); continue; }
    const { data, content } = matter(readFileSync(soubor, 'utf8'));
    vysledek.push({ slug, soubor, data, content });
  }
  return vysledek;
}

export function overAdresar(adresar: string, rezim: Rezim = {}): { zaznamy: KauzaZaznam[]; pravidla: PravidloZaznam[]; stitky: Map<string, string>; akteri: Map<string, Akter>; chyby: Chyba[]; varovani: Chyba[] } {
  const stitky = nactiSlovnikStitku(adresar);
  const sadaStitku = new Set(stitky.keys());
  const chyby: Chyba[] = [];
  const nactene: KauzaZaznam[] = [];
  for (const s of nactiSlozku(adresar, 'kauzy', chyby)) {
    const r = overKauzu(s.soubor, s.data, s.content, sadaStitku, rezim);
    chyby.push(...r.chyby);
    if (r.kauza) nactene.push({ slug: s.slug, kauza: r.kauza, telo: s.content });
  }
  const slovnik = nactiSlovnikAkteru(adresar, rezim);
  chyby.push(...slovnik.chyby);
  const vazby = overVazby(adresar, nactene, slovnik.akteri, rezim);
  chyby.push(...vazby.chyby);
  const zaznamy = vazby.zaznamy;
  zaznamy.sort((a, b) => a.kauza.od - b.kauza.od || a.kauza.nazev.localeCompare(b.kauza.nazev, 'cs'));

  const nactenaPravidla: PravidloZaznam[] = [];
  for (const s of nactiSlozku(adresar, 'pravidla', chyby)) {
    const r = overPravidlo(s.soubor, s.data, s.content, sadaStitku, rezim);
    chyby.push(...r.chyby);
    if (r.pravidlo) nactenaPravidla.push({ slug: s.slug, pravidlo: r.pravidlo, telo: s.content });
  }
  const vazbyPravidel = overVazbyPravidel(adresar, nactenaPravidla, new Set(zaznamy.map(z => z.slug)), rezim);
  chyby.push(...vazbyPravidel.chyby);

  return {
    zaznamy,
    pravidla: seraditPravidla(vazbyPravidel.pravidla),
    stitky,
    akteri: slovnik.akteri,
    chyby,
    varovani: [...vazby.varovani, ...vazbyPravidel.varovani],
  };
}
```

- [ ] **Step 6: Upravit `scripts/over-obsah.ts`**

Nahradit destrukturaci a poslední řádek:

```ts
const { zaznamy, pravidla, chyby, varovani } = overAdresar(adresar);
```

```ts
console.log(`Obsah v pořádku: ${sklonuj(zaznamy.length, ['kauza', 'kauzy', 'kauz'])} a ${sklonuj(pravidla.length, ['pravidlo', 'pravidla', 'pravidel'])} v „${adresar}“.`);
```

- [ ] **Step 7: Spustit testy**

Run: `npx vitest run`
Expected: PASS všech testů včetně stávajících `validace.test.ts` a `vazby.test.ts`.

Run: `$env:NV_OBSAH='tests/fixtures/obsah'; npx tsx scripts/over-obsah.ts; Remove-Item Env:NV_OBSAH`
Expected: `Obsah v pořádku: 6 kauz a 3 pravidla v „tests/fixtures/obsah“.`

- [ ] **Step 8: Commit**

```bash
git add src/lib/validace.ts src/lib/pravidla.ts scripts/over-obsah.ts tests/fixtures/obsah/pravidla tests/unit/validace-pravidla.test.ts
git commit -m "Změny pravidel: validace adresáře, vazby na kauzy a testovací pravidla

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Načítání pravidel a položka menu

**Files:**
- Modify: `src/lib/kauzy.ts`
- Modify: `src/layouts/Zaklad.astro`
- Modify: `src/components/Hlavicka.astro`
- Modify: `src/styles/upravy.css` (na konec)
- Modify: `tests/e2e/stranky.spec.ts:83-92`

**Interfaces:**
- Consumes: `overAdresar(…, { koncepty, znameKauzy })` a `PravidloZaznam` (Task 3), `pravidlaKauzy` (Task 3)
- Produces (`kauzy.ts`): `nactiPravidla(): PravidloZaznam[]`, `maPravidla(): boolean`, `souvisejiciPravidla(slug: string): SouvisejiciPravidlo[]`
- Produces (`Zaklad.astro`, `Hlavicka.astro`): `aktivni` přijímá i `'pravidla'`

Menu vyžaduje stránku `/pravidla/`, ta vznikne v Tasku 5. Odkaz se proto v tomto tasku ověří jen v náhledu HTML, e2e testy přijdou v Tasku 5.

- [ ] **Step 1: Upravit `src/lib/kauzy.ts`**

Importy a načítání:

```ts
import { existsSync, readdirSync } from 'node:fs';
import { basename } from 'node:path';
import { overAdresar, type KauzaZaznam, type PravidloZaznam } from './validace';
import type { Akter } from './schema';
import { sestavGraf, type Graf } from './mapa';
import { pravidlaKauzy, type SouvisejiciPravidlo } from './pravidla';

/** Lokální náhled neověřených konceptů (npm run koncepty). Veřejný build ho nikdy nezapíná. */
export const rezimKonceptu = (): boolean => process.env.NV_KONCEPTY === 'ano';

/** Náhled konceptů nevidí zveřejněné kauzy (leží v obsah/kauzy), pravidla v konceptech na ně ale odkazují. */
function slugyZverejnenychKauz(): string[] {
  const slozka = 'obsah/kauzy';
  return existsSync(slozka) ? readdirSync(slozka).filter(f => f.endsWith('.md')).map(f => basename(f, '.md')) : [];
}

let mezipamet: ReturnType<typeof overAdresar> | undefined;

function nacti() {
  // ve vývoji se obsah čte pokaždé znovu, aby se úpravy kauz projevily bez restartu serveru
  if (!mezipamet || import.meta.env.DEV) {
    const koncepty = rezimKonceptu();
    mezipamet = overAdresar(process.env.NV_OBSAH ?? 'obsah', { koncepty, znameKauzy: koncepty ? slugyZverejnenychKauz() : undefined });
    if (mezipamet.chyby.length) {
      throw new Error('Chybný obsah:\n' + mezipamet.chyby.map(c => `  ${c.soubor}: ${c.zprava}`).join('\n'));
    }
  }
  return mezipamet;
}
```

Pod `nactiAktery` přidat:

```ts
export const nactiPravidla = (): PravidloZaznam[] => nacti().pravidla;
/** Stránka a položka menu „Změny pravidel“: ve veřejném buildu až s prvním ověřeným pravidlem, v náhledu konceptů vždy. */
export const maPravidla = (): boolean => rezimKonceptu() || nactiPravidla().length > 0;
export const souvisejiciPravidla = (slug: string): SouvisejiciPravidlo[] => pravidlaKauzy(nactiPravidla(), slug);
```

- [ ] **Step 2: Upravit `src/layouts/Zaklad.astro`**

```astro
import { rezimKonceptu, maPravidla } from '../lib/kauzy';

interface Props {
  titulek: string;
  popis: string;
  cesta: string;
  styly: 'hlavni' | 'stranky';
  aktivni?: 'kauzy' | 'pravidla' | 'metodika' | 'o-projektu';
  otevrena?: string;
}
```

a `<Hlavicka aktivni={aktivni} />` nahradit `<Hlavicka aktivni={aktivni} pravidla={maPravidla()} />`.

- [ ] **Step 3: Přepsat `src/components/Hlavicka.astro`**

```astro
---
interface Props { aktivni?: 'kauzy' | 'pravidla' | 'metodika' | 'o-projektu'; pravidla?: boolean }
const { aktivni, pravidla = false } = Astro.props;
const aktualni = (id: string) => (id === aktivni ? 'page' : undefined);
---
<header class="top">
  <div class="hlavicka-znacka">
    <a class="brand" href="/">Nenechme vyhnít</a>
    <span class="hlavicka-pod">nezávislý archiv se zdroji</span>
  </div>
  <nav aria-label="Hlavní">
    <a href="/" aria-current={aktualni('kauzy')}>Kauzy</a>
    {/* na mobilu se plný název nevejde na řádek se značkou; skrytý tvar (display: none) se nečte ani čtečkou */}
    {pravidla && <a href="/pravidla/" aria-current={aktualni('pravidla')}><span class="menu-dlouhy">Změny pravidel</span><span class="menu-kratky">Pravidla</span></a>}
    <a href="/metodika/" aria-current={aktualni('metodika')}>Metodika</a>
    <a href="/o-projektu/" aria-current={aktualni('o-projektu')}>O projektu</a>
  </nav>
</header>
```

- [ ] **Step 4: Přidat na konec `src/styles/upravy.css`**

```css
/* položka menu Změny pravidel: na mobilu krátký tvar, aby se menu vešlo na jeden řádek */
.menu-kratky { display: none; }
@media (max-width: 760px) {
  .menu-dlouhy { display: none; }
  .menu-kratky { display: inline; }
}
```

- [ ] **Step 5: Upravit test menu na mobilu v `tests/e2e/stranky.spec.ts`**

Test `menu ukazuje všechny tři odkazy na jednom řádku` přejmenovat na `menu ukazuje všechny odkazy na jednom řádku` a `toHaveCount(3)` nahradit `toHaveCount(4)` (testovací data mají pravidla). Zbytek testu (viditelnost, výška pod 30 px) zůstává.

- [ ] **Step 6: Ověřit build a stávající testy**

Run: `npx vitest run`
Expected: PASS.

Run: `npm run build:e2e`
Expected: build projde. V `dist-e2e/index.html` je odkaz `href="/pravidla/"`, v `dist-prazdny/index.html` není (`Select-String -Path dist-e2e/index.html -Pattern 'href="/pravidla/"'`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/kauzy.ts src/layouts/Zaklad.astro src/components/Hlavicka.astro src/styles/upravy.css tests/e2e/stranky.spec.ts
git commit -m "Změny pravidel: načítání a položka menu (jen když jsou pravidla)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Přehled `/pravidla/` s průběhem a filtry

**Files:**
- Create: `src/lib/hledani-pravidel.ts`
- Create: `src/components/PrubehPravidla.astro`
- Create: `src/components/PrehledPravidel.astro`
- Create: `src/pages/pravidla/[...prehled].astro`
- Create: `src/scripts/pravidla-filtr.ts`
- Create: `src/styles/pravidla.css`
- Modify: `tests/unit/styly.test.ts:4` (přidat `src/styles/pravidla.css`)
- Test: `tests/unit/hledani-pravidel.test.ts`, `tests/e2e/pravidla-prehled.spec.ts`

**Interfaces:**
- Consumes: `nactiPravidla`, `nactiStitky`, `maPravidla` (Task 4); `prubeh`, `popisekKroku`, `stavPravidla`, `vProjednavani`, `type Krok` (Task 1); `popisekCesty`, `popisekKomu`, `popisekZaveru`, `type DruhPravidla` (Task 1); `normalizuj` z `src/lib/hledani.ts`; `jsonDoSkriptu` z `src/lib/html.ts`; `datumText` z `src/lib/casova-osa.ts`
- Produces: `type PolozkaPravidla = { slug: string; text: string; stitky: string[]; projednava: boolean }`, `type FiltrPravidel = { text: string; stitky: string[]; jenProjednavane: boolean }`, `vytvorPolozkuPravidla(z: PravidloZaznam): PolozkaPravidla`, `odpovidaPravidlo(p: PolozkaPravidla, f: FiltrPravidel): boolean`; komponenta `PrehledPravidel` (props `otevrene?: PravidloZaznam`, slot `detail`); komponenta `PrubehPravidla` (props `druh`, `udalosti`, `interaktivni?: boolean`, v interaktivní verzi tlačítka `[data-udalost]` a třída `prubeh-detail`); `inicializujFiltrPravidel(): void`. Řádky seznamu: `li.pr-radek[data-slug]` s odkazem `a.pr-btn`.

- [ ] **Step 1: Napsat padající jednotkový test**

`tests/unit/hledani-pravidel.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { vytvorPolozkuPravidla, odpovidaPravidlo } from '../../src/lib/hledani-pravidel';
import { overAdresar } from '../../src/lib/validace';

const polozky = overAdresar('tests/fixtures/obsah').pravidla.map(vytvorPolozkuPravidla);
const najdi = (f: Partial<{ text: string; stitky: string[]; jenProjednavane: boolean }>) =>
  polozky.filter(p => odpovidaPravidlo(p, { text: '', stitky: [], jenProjednavane: false, ...f })).map(p => p.slug);

describe('hledání pravidel', () => {
  it('bez filtru najde všechna', () => expect(najdi({})).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau']));
  it('hledá bez diakritiky a velikosti písmen i v krocích řetězce', () => {
    expect(najdi({ text: 'ZAHAJENA RIZENI' })).toEqual(['zakon-omega']);
    expect(najdi({ text: 'lhutu k vymahani' })).toEqual(['zakon-omega']);
  });
  it('hledá v předkladateli', () => expect(najdi({ text: 'poslanec d' })).toEqual(['pozmenovaci-sigma']));
  it('štítky se spojují logikou NEBO', () => expect(najdi({ stitky: ['eu-fondy', 'stret-zajmu'] })).toEqual(['zakon-omega', 'narizeni-tau']));
  it('jen v projednávání vynechá zamítnuté a vyhlášené', () => expect(najdi({ jenProjednavane: true })).toEqual(['zakon-omega']));
  it('mezery kolem hledaného textu nevadí', () => expect(najdi({ text: '  drubez  ' })).toEqual(['narizeni-tau']));
});
```

- [ ] **Step 2: Spustit test, ověřit, že padá**

Run: `npx vitest run tests/unit/hledani-pravidel.test.ts`
Expected: FAIL, nelze načíst `../../src/lib/hledani-pravidel`.

- [ ] **Step 3: Napsat `src/lib/hledani-pravidel.ts`**

```ts
import { normalizuj } from './hledani';
import { stavPravidla, vProjednavani } from './pravidla-stavy';
import type { PravidloZaznam } from './validace';

export type PolozkaPravidla = { slug: string; text: string; stitky: string[]; projednava: boolean };
export type FiltrPravidel = { text: string; stitky: string[]; jenProjednavane: boolean };

/** Data pro filtr v prohlížeči (vkládají se do stránky jako JSON). */
export function vytvorPolozkuPravidla(z: PravidloZaznam): PolozkaPravidla {
  const p = z.pravidlo;
  const text = [p.nazev, p.shrnuti, p.predkladatel, p.stitky.join(' '), ...p.prospech.retezec.map(k => k.text)].join(' ');
  return { slug: z.slug, text: normalizuj(text), stitky: p.stitky, projednava: vProjednavani(stavPravidla(p.udalosti)) };
}

export function odpovidaPravidlo(p: PolozkaPravidla, f: FiltrPravidel): boolean {
  const hledany = normalizuj(f.text.trim());
  if (hledany && !p.text.includes(hledany)) return false;
  if (f.stitky.length && !f.stitky.some(s => p.stitky.includes(s))) return false;
  if (f.jenProjednavane && !p.projednava) return false;
  return true;
}
```

- [ ] **Step 4: Spustit test, ověřit, že prochází**

Run: `npx vitest run tests/unit/hledani-pravidel.test.ts`
Expected: PASS.

- [ ] **Step 5: Napsat padající e2e test**

`tests/e2e/pravidla-prehled.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

const NAZVY = ['Testovací novela zákona Omega s dlouhým názvem pro mobil', 'Testovací pozměňovací návrh Sigma', 'Testovací nařízení Tau'];

test('menu vede na změny pravidel a přehled je seřazený od nejnovější změny', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: 'Změny pravidel' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page).toHaveTitle('Změny pravidel — Nenechme vyhnít');
  await expect(page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: 'Změny pravidel' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Které změny pravidel prospívají Babišovi a Agrofertu');
  await expect(page.locator('.pr-radek .pr-nazev strong')).toHaveText(NAZVY);
  const prvni = page.locator('.pr-radek').first();
  await expect(prvni).toContainText('Poslanecký návrh zákona');
  await expect(prvni).toContainText('Schváleno Sněmovnou');
  await expect(prvni).toContainText('Andrej Babiš, Agrofert');
  await expect(prvni).toContainText('prospěch pravděpodobný');
});

test('řádek ukazuje průběh projednávání', async ({ page }) => {
  await page.goto('/pravidla/');
  const omega = page.locator('.pr-radek[data-slug="zakon-omega"] .prubeh');
  await expect(omega.locator('li:not(.konec)')).toHaveCount(5);
  await expect(omega.locator('li.hotovo')).toHaveCount(2);
  await expect(page.locator('.pr-radek[data-slug="pozmenovaci-sigma"] .prubeh li.konec')).toContainText('Zamítnuto');
  await expect(page.locator('.pr-radek[data-slug="narizeni-tau"] .prubeh li.hotovo')).toHaveCount(3);
});

test('filtry: hledání bez diakritiky, štítek, jen v projednávání, zrušení a prázdný stav', async ({ page }) => {
  await page.goto('/pravidla/');
  const viditelne = page.locator('.pr-radek:not([hidden])');
  const hledat = page.getByRole('searchbox', { name: 'Hledat ve změnách pravidel' });
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 3 z 3');
  await hledat.fill('lhutu k vymahani');
  await expect(viditelne).toHaveCount(1);
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 1 z 3');
  await page.locator('.pr-filtry .f-zrusit').click();
  await expect(viditelne).toHaveCount(3);
  await expect(hledat).toHaveValue('');
  await page.locator('.pr-filtry [data-stitek="eu-fondy"]').click();
  await expect(viditelne).toHaveCount(1);
  await expect(viditelne.first()).toHaveAttribute('data-slug', 'narizeni-tau');
  await page.locator('.pr-filtry [data-stitek="eu-fondy"]').click();
  await page.getByLabel('jen v projednávání').check();
  await expect(viditelne).toHaveCount(1);
  await expect(viditelne.first()).toHaveAttribute('data-slug', 'zakon-omega');
  await hledat.fill('nic takoveho neexistuje');
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeVisible();
  await page.locator('.pravidla-seznam .prazdno [data-zrusit]').click();
  await expect(viditelne).toHaveCount(3);
  await expect(page.locator('.pravidla-seznam .prazdno')).toBeHidden();
});

test('prázdný archiv nemá položku menu ani stránku pravidel', async ({ page }) => {
  await page.goto('http://localhost:4322/');
  await expect(page.getByRole('navigation', { name: 'Hlavní' }).getByRole('link', { name: /pravidel|Pravidla/ })).toHaveCount(0);
  const odpoved = await page.goto('http://localhost:4322/pravidla/');
  expect(odpoved?.status()).toBe(404);
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: přehled se neposouvá dolů a poslední řádek jde zobrazit`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/');
    await overBezPosouvani(page);
    const posledni = page.locator('.pr-radek').last();
    await posledni.scrollIntoViewIfNeeded();
    await expect(posledni).toBeInViewport();
  });
}
```

- [ ] **Step 6: Napsat `src/components/PrubehPravidla.astro`**

```astro
---
import { prubeh, popisekKroku, type Krok } from '../lib/pravidla-stavy';
import type { DruhPravidla } from '../lib/pravidla-slovnik';
import { datumText } from '../lib/casova-osa';

/** Ukazatel průběhu projednávání. V řádku přehledu je jen k pohledu (leží v odkazu, nesmí obsahovat tlačítka),
 *  v hlavičce detailu (interaktivni) kroky otevírají své události. */
interface Props { druh: DruhPravidla; udalosti: { datum: string; krok?: Krok }[]; interaktivni?: boolean }
const { druh, udalosti, interaktivni = false } = Astro.props;
const { faze, konec } = prubeh(druh, udalosti);
const stavFaze = (f: (typeof faze)[number]) => (f.hotovo ? 'hotovo' : f.poznamka ? f.poznamka.toLowerCase() : 'zatím ne');
---
<ol class={`prubeh${interaktivni ? ' prubeh-detail' : ''}`} aria-label="Průběh projednávání">
  {faze.map(f => {
    const obsah = <><span class="f-nazev">{f.nazev}</span><time>{f.poznamka ?? (f.datum ? datumText(f.datum) : ' ')}</time><span class="jen-ctecka">{`: ${stavFaze(f)}${f.datum ? `, ${datumText(f.datum)}` : ''}`}</span></>;
    return (
      <li class={[f.hotovo && 'hotovo', f.poznamka && 'vraceno'].filter(Boolean).join(' ') || undefined}>
        {interaktivni && f.udalost !== null ? <button type="button" data-udalost={f.udalost}>{obsah}</button> : obsah}
      </li>
    );
  })}
  {konec && (
    <li class="konec">
      {interaktivni
        ? <button type="button" data-udalost={konec.udalost}>{popisekKroku(konec.krok)} <time>{datumText(konec.datum)}</time></button>
        : <>{popisekKroku(konec.krok)} <time>{datumText(konec.datum)}</time></>}
    </li>
  )}
</ol>
```

- [ ] **Step 7: Napsat `src/components/PrehledPravidel.astro`**

```astro
---
import Zaklad from '../layouts/Zaklad.astro';
import PatickaRadek from './PatickaRadek.astro';
import PrubehPravidla from './PrubehPravidla.astro';
import { nactiPravidla, nactiStitky } from '../lib/kauzy';
import { popisekCesty, popisekKomu, popisekZaveru } from '../lib/pravidla-slovnik';
import { stavPravidla, popisekKroku } from '../lib/pravidla-stavy';
import { vytvorPolozkuPravidla } from '../lib/hledani-pravidel';
import { jsonDoSkriptu } from '../lib/html';
import type { PravidloZaznam } from '../lib/validace';
import '../styles/hlavni.css';
import '../styles/pravidla.css';

interface Props { otevrene?: PravidloZaznam }
const { otevrene } = Astro.props;
const zaznamy = nactiPravidla();
const stitky = nactiStitky();
const cipy = [...new Set(zaznamy.flatMap(z => z.pravidlo.stitky))]
  .map(id => ({ id, nazev: stitky.get(id) ?? id }))
  .sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs'));
const titulek = otevrene ? `${otevrene.pravidlo.nazev} — Nenechme vyhnít` : 'Změny pravidel — Nenechme vyhnít';
const popis = otevrene
  ? otevrene.pravidlo.shrnuti
  : 'Zákony, nařízení a dotační pravidla od prosince 2025, ze kterých mají prospěch Andrej Babiš nebo Agrofert. U každé změny rozbor krok za krokem se zdroji a stanovisko předkladatele.';
---
<Zaklad titulek={titulek} popis={popis} cesta={otevrene ? `/pravidla/${otevrene.slug}/` : '/pravidla/'} styly="hlavni" aktivni="pravidla" otevrena={otevrene?.slug}>
  <main class="hlavni-obsah">
    <section class="hero u2 pr-hero">
      <p class="u2-nad">Změny pravidel</p>
      <h1>Které změny pravidel prospívají Babišovi a Agrofertu</h1>
      <p class="u2-pod">Zákony, nařízení a dotační pravidla od prosince 2025. U každé změny rozbor krok za krokem se zdroji a stanovisko předkladatele.</p>
    </section>
    {zaznamy.length > 0 && (
      <>
        <h2 class="jen-ctecka">Hledání a filtry</h2>
        <div class="filtry f4 pr-filtry">
          <label class="f-hledat"><input type="search" placeholder="Hledat ve změnách pravidel…" aria-label="Hledat ve změnách pravidel"></label>
          <div class="f-cipy-obal">
            <div class="f-cipy" role="group" aria-label="Témata">
              {cipy.map(c => <button type="button" data-stitek={c.id} aria-pressed="false">{c.nazev}</button>)}
            </div>
          </div>
          <label class="f-prepinac"><input type="checkbox" data-jen-projednavane> jen v projednávání</label>
          <span class="vpravo"><span class="pocet" aria-live="polite"></span><button class="f-zrusit" type="button" hidden>Zrušit filtry</button></span>
        </div>
      </>
    )}
    <h2 class="jen-ctecka">Změny pravidel</h2>
    <div class="pravidla-obal">
      <ul class="pravidla-seznam">
        {zaznamy.length === 0 && <li class="archiv-prazdny">Zatím tu nejsou žádné ověřené záznamy.</li>}
        {zaznamy.map(({ slug, pravidlo: p }) => (
          <li class="pr-radek" data-slug={slug}>
            <a class="pr-btn" href={`/pravidla/${slug}/`} aria-haspopup="dialog">
              <span class="pr-nazev">
                <strong title={p.nazev}>{p.nazev}</strong>
                <small>{popisekCesty(p.cesta)} · {popisekKroku(stavPravidla(p.udalosti))} · {popisekKomu(p.prospech.komu)} · {popisekZaveru(p.prospech.zaver)}</small>
              </span>
              {/* stav je v textu výše, ukazatel je pro čtečku nadbytečný */}
              <span class="pr-prubeh" aria-hidden="true"><PrubehPravidla druh={p.druh} udalosti={p.udalosti} /></span>
              <span class="otevrit" aria-hidden="true">Detail</span>
            </a>
          </li>
        ))}
        <li class="prazdno" hidden>Žádná změna pravidel neodpovídá filtru. <button type="button" data-zrusit>Zrušit filtry</button></li>
      </ul>
    </div>
  </main>
  <PatickaRadek />
  <Fragment slot="mimo"><slot name="detail" /></Fragment>
</Zaklad>
<script type="application/json" id="nv-pravidla" set:html={jsonDoSkriptu(zaznamy.map(vytvorPolozkuPravidla))}></script>
<script>
  import { inicializujFiltrPravidel } from '../scripts/pravidla-filtr';
  inicializujFiltrPravidel();
</script>
```

- [ ] **Step 8: Napsat `src/pages/pravidla/[...prehled].astro`**

```astro
---
import PrehledPravidel from '../../components/PrehledPravidel.astro';
import { maPravidla } from '../../lib/kauzy';

// Volitelný parametr: stránka /pravidla/ vznikne jen tehdy, když jsou pravidla (jinak 404 a žádná položka menu).
export function getStaticPaths() {
  return maPravidla() ? [{ params: { prehled: undefined } }] : [];
}
---
<PrehledPravidel />
```

- [ ] **Step 9: Napsat `src/scripts/pravidla-filtr.ts`**

```ts
import { odpovidaPravidlo, type PolozkaPravidla, type FiltrPravidel } from '../lib/hledani-pravidel';

export function inicializujFiltrPravidel(): void {
  const data = document.getElementById('nv-pravidla');
  const obal = document.querySelector<HTMLElement>('.pr-filtry');
  if (!data || !obal) return;
  const polozky: PolozkaPravidla[] = JSON.parse(data.textContent ?? '[]');
  const hledat = obal.querySelector<HTMLInputElement>('input[type="search"]')!;
  const jen = obal.querySelector<HTMLInputElement>('[data-jen-projednavane]')!;
  const cipy = [...obal.querySelectorAll<HTMLButtonElement>('[data-stitek]')];
  const pocet = obal.querySelector<HTMLElement>('.pocet')!;
  const zrusit = obal.querySelector<HTMLButtonElement>('.f-zrusit')!;
  const prazdno = document.querySelector<HTMLElement>('.pravidla-seznam .prazdno')!;
  const radky = new Map([...document.querySelectorAll<HTMLElement>('.pr-radek')].map(r => [r.dataset.slug!, r]));

  const filtr = (): FiltrPravidel => ({
    text: hledat.value,
    stitky: cipy.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.stitek!),
    jenProjednavane: jen.checked,
  });
  const pouzij = () => {
    const f = filtr();
    let n = 0;
    for (const p of polozky) {
      const ok = odpovidaPravidlo(p, f);
      const r = radky.get(p.slug);
      if (r) r.hidden = !ok;
      if (ok) n++;
    }
    prazdno.hidden = n > 0;
    pocet.textContent = `Zobrazeno ${n} z ${polozky.length}`;
    zrusit.hidden = !(f.text.trim() || f.stitky.length || f.jenProjednavane);
  };
  const vycisti = () => {
    hledat.value = '';
    jen.checked = false;
    cipy.forEach(c => c.setAttribute('aria-pressed', 'false'));
    pouzij();
  };
  hledat.addEventListener('input', pouzij);
  jen.addEventListener('change', pouzij);
  cipy.forEach(c => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    pouzij();
  }));
  zrusit.addEventListener('click', vycisti);
  prazdno.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);
  pouzij();
}
```

- [ ] **Step 10: Napsat `src/styles/pravidla.css`**

```css
/* Změny pravidel: přehled a detail. Barvy a písma z hlavni.css, žádná červená, barva nehodnotí. */
.pr-hero { padding: 28px 0 18px; }
.pr-hero h1 { font-size: clamp(26px, 3.2vw, 44px); line-height: 1.05; }

.pravidla-obal { flex: 1; min-height: 0; display: flex; flex-direction: column; margin-top: 12px; background: var(--plocha); border: 1px solid var(--linka); }
.pravidla-seznam { flex: 1; min-height: 0; overflow-y: auto; list-style: none; margin: 0; padding: 0; }
.pr-radek + .pr-radek { border-top: 1px solid var(--linka); }
.pr-btn { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 1fr) auto; gap: 6px 24px; align-items: center; padding: 10px 18px; color: inherit; text-decoration: none; }
.pr-btn:hover, .pr-radek.vybrany .pr-btn { background: color-mix(in srgb, var(--modra) 6%, var(--plocha)); }
.pr-btn:focus-visible { outline: 2px solid var(--modra); outline-offset: -2px; }
.pr-nazev { min-width: 0; }
.pr-nazev strong { display: block; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pr-nazev small { display: block; font: 12px/1.4 var(--f-mono); color: var(--meta); }
.pr-btn .otevrit { font: 12px var(--f-mono); color: var(--modra); }
.archiv-prazdny, .pravidla-seznam .prazdno { padding: 18px; color: var(--meta); }

.prubeh { display: flex; gap: 4px; list-style: none; margin: 0; padding: 0; font: 11px/1.3 var(--f-mono); }
.prubeh li { flex: 1 1 0; min-width: 0; border-top: 3px solid var(--linka); padding-top: 4px; color: var(--meta); }
.prubeh li.hotovo { border-top-color: var(--modra); color: var(--inkoust); }
.prubeh li.vraceno { border-top-style: dashed; border-top-color: var(--inkoust); }
.prubeh li.konec { flex: none; align-self: flex-end; border: 1px solid var(--inkoust); padding: 1px 6px; color: var(--inkoust); }
.prubeh .f-nazev { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prubeh time { display: block; white-space: nowrap; }

/* detail */
.prubeh-detail { margin: 16px 0 4px; max-width: 720px; font-size: 12px; }
.prubeh-detail button { all: unset; display: block; width: 100%; cursor: pointer; }
.prubeh-detail button:focus-visible { outline: 2px solid var(--modra); outline-offset: 2px; }
.pr-zaver { margin: 0 0 8px; }
.retezec { margin: 0 0 12px; padding-left: 1.4em; max-width: 46em; }
.retezec li { margin: 6px 0; }
.odhad { font: 11px var(--f-mono); border: 1px solid var(--inkoust); padding: 0 5px; margin-right: 4px; white-space: nowrap; }
.dalsi-dotceni { max-width: 46em; }
.cesta-box { margin: 0 0 14px; padding: 8px 14px; border-left: 3px solid var(--linka); }
.cesta-box p { margin: 0 0 4px; }
.vynechano { margin: 4px 0 0; padding-left: 1.2em; font-size: 14px; color: var(--text2); }
.vyhrady ul { padding-left: 1.2em; }

@media (max-width: 760px) {
  .pr-hero { padding: 14px 0 10px; }
  .pr-hero .u2-pod { display: none; }
  .pr-btn { grid-template-columns: minmax(0, 1fr); padding: 10px 14px; }
  .pr-btn .otevrit { display: none; }
  .pr-nazev strong { white-space: normal; }
  .pr-nazev small { display: none; }
}
```

- [ ] **Step 11: Přidat `src/styles/pravidla.css` do seznamu v `tests/unit/styly.test.ts`**

Řádek 4 doplnit o `'src/styles/pravidla.css'`.

- [ ] **Step 12: Spustit testy**

Run: `npx vitest run`
Expected: PASS.

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-prehled.spec.ts tests/e2e/stranky.spec.ts` (při obsazených portech podle Global Constraints s `-c playwright.local.config.ts`)
Expected: PASS. Když test velikostí padá na svislém posouvání, upravit jen `pravidla.css` (úvod, mezery). Testy se nemění.

- [ ] **Step 13: Vizuální kontrola**

Pořídit snímky `/pravidla/` na 1342×565 a 390×700 (Playwright `page.screenshot` v dočasném skriptu mimo repozitář). Ověřit, že úvod, filtry a seznam nepřekrývají, průběh je čitelný a fáze nepřetékají. Snímky necommitovat.

- [ ] **Step 14: Commit**

```bash
git add src/lib/hledani-pravidel.ts src/components/PrubehPravidla.astro src/components/PrehledPravidel.astro "src/pages/pravidla/[...prehled].astro" src/scripts/pravidla-filtr.ts src/styles/pravidla.css tests/unit/styly.test.ts tests/unit/hledani-pravidel.test.ts tests/e2e/pravidla-prehled.spec.ts
git commit -m "Změny pravidel: přehled s průběhem projednávání a filtry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Detail pravidla

**Files:**
- Create: `src/components/SeznamZdroju.astro`
- Modify: `src/components/Detail.astro` (blok zdrojů → `SeznamZdroju`)
- Create: `src/components/DetailPravidla.astro`
- Create: `src/pages/pravidla/[slug].astro`
- Modify: `src/pages/pravidla/[...prehled].astro` (prázdný dialog)
- Modify: `src/components/PrehledPravidel.astro` (skript navigace)
- Create: `src/scripts/navigace-pravidel.ts`
- Modify: `src/scripts/detail.ts`
- Test: `tests/e2e/pravidla-detail.spec.ts`; regresně `tests/e2e/detail.spec.ts`, `tests/e2e/modal-obsah.spec.ts`

**Interfaces:**
- Consumes: `PrehledPravidel`, `PrubehPravidla` (Task 5); `nactiPravidla`, `nactiKauzy` (Task 4); slovníky (Task 1); `inicializujDetail(dlg)` ze `src/scripts/detail.ts`
- Produces: `SeznamZdroju` (props `zdroje: Zdroj[]`); `DetailPravidla` (props `zaznam?: PravidloZaznam`, `<dialog id="detail" class="detail m2 pravidlo">`, panely `data-p` = `prospech`, `chrono`, `vyhrady`, `souv` (jen s textem), `zdroje`); `otevriPravidlo(slug, { pridatDoHistorie? })`, `inicializujNavigaciPravidel()`

- [ ] **Step 1: Napsat padající e2e test**

`tests/e2e/pravidla-detail.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });
const OMEGA = 'Testovací novela zákona Omega s dlouhým názvem pro mobil';

test('přímá adresa otevře detail pravidla s vlastním náhledem', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  const dlg = page.locator('dialog#detail');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading', { level: 2 })).toHaveText(OMEGA);
  await expect(page).toHaveTitle(`${OMEGA} — Nenechme vyhnít`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://nenechmevyhnit.cz/pravidla/zakon-omega/');
  await expect(dlg.locator('.m2-hlava .roky')).toHaveText('Poslanecký návrh zákona · Schváleno Sněmovnou');
  await expect(page.locator('.pr-radek[data-slug="zakon-omega"]')).toHaveClass(/vybrany/);
  await overBezPosouvani(page);
});

test('první záložka Komu prospívá: závěr, řetězec s odhadem, související kauza', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  const tab = page.getByRole('tab').first();
  await expect(tab).toHaveText('Komu prospívá');
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const panel = page.locator('.m2-panel[data-p="prospech"]');
  await expect(panel.locator('.pr-zaver')).toHaveText(/prospěch pravděpodobný: Andrej Babiš, Agrofert/);
  await expect(panel.locator('.retezec > li')).toHaveCount(3);
  await expect(panel.locator('.retezec > li').nth(2).locator('.odhad')).toHaveText('odhad');
  await expect(panel.locator('.retezec > li').nth(0).locator('.odhad')).toHaveCount(0);
  await expect(panel.getByRole('link', { name: 'Testovací kauza Žeta' })).toHaveAttribute('href', '/kauzy/zeta-stret/');
  await expect(panel.getByRole('link', { name: 'Jak rozbor děláme' })).toHaveAttribute('href', '/metodika/#pravidla');
});

test('záložka Průběh: cesta předložení, vynechané kontroly a listování', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const panel = page.locator('.m2-panel[data-p="chrono"]');
  await expect(panel.locator('.cesta-box')).toContainText('Předkládá: fiktivní poslanci A, B a C.');
  await expect(panel.locator('.vynechano li')).toHaveText(['neprošel meziresortním připomínkovým řízením', 'bez hodnocení dopadů regulace (RIA)']);
  const aktualni = panel.locator('.udalosti-seznam > li:not([hidden]) h3');
  await expect(aktualni).toHaveText('Schváleno Sněmovnou');
  await page.keyboard.press('ArrowLeft');
  await expect(aktualni).toHaveText('Návrh podán');
});

test('klik na krok průběhu v hlavičce ukáže jeho událost', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.locator('.prubeh-detail [data-udalost="0"]').click();
  await expect(page.locator('.m2-panel[data-p="chrono"]')).toBeVisible();
  await expect(page.locator('.udalosti-seznam > li:not([hidden]) h3')).toHaveText('Návrh podán');
});

test('pozměňovací návrh: k čemu byl připojen a ukončení průběhu', async ({ page }) => {
  await page.goto('/pravidla/pozmenovaci-sigma/');
  await expect(page.locator('.prubeh-detail li.konec')).toContainText('Zamítnuto');
  await page.getByRole('tab', { name: 'Průběh' }).click();
  const panel = page.locator('.m2-panel[data-p="chrono"]');
  await expect(panel.locator('.cesta-box')).toContainText('Připojeno k: Fiktivní novela zákona o fiktivních dotacích');
  await expect(panel.locator('.vynechano li')).toHaveCount(4);
});

test('výhrady, stanovisko a přechod na zdroj', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.getByRole('tab', { name: 'Výhrady a stanovisko' }).click();
  const panel = page.locator('.m2-panel[data-p="vyhrady"]');
  await expect(panel.locator('.vyhrady')).toContainText('Fiktivní legislativní rada');
  await expect(panel.locator('.stanovisko')).toContainText('Předkladatel tvrdí, že novela nevznikla kvůli konkrétní firmě.');
  await expect(panel.locator('.overeno')).toContainText('Naposledy ověřeno');
  await panel.locator('.stanovisko a[data-zdroj="3"]').click();
  await expect(page.locator('.m2-panel[data-p="zdroje"]')).toBeVisible();
  await expect(page.locator('#zdroj-3')).toBeInViewport();
  await expect(page.getByRole('link', { name: 'Historie změn tohoto pravidla' })).toHaveAttribute('href', /\/commits\/main\/obsah\/pravidla\/zakon-omega\.md$/);
});

test('pravidlo bez výhrad to věcně uvede', async ({ page }) => {
  await page.goto('/pravidla/narizeni-tau/');
  await page.getByRole('tab', { name: 'Výhrady a stanovisko' }).click();
  await expect(page.locator('.m2-panel[data-p="vyhrady"]')).toContainText('Výhrady institucí zatím nejsou zapsané.');
});

test('záložka Souvislosti jen u pravidla s textem', async ({ page }) => {
  await page.goto('/pravidla/narizeni-tau/');
  await expect(page.getByRole('tab', { name: 'Souvislosti' })).toHaveCount(1);
  await page.goto('/pravidla/zakon-omega/');
  await expect(page.getByRole('tab', { name: 'Souvislosti' })).toHaveCount(0);
});

test('z přehledu se detail otevře bez načtení stránky a zavřením se adresa vrátí', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  await page.locator('.pr-radek[data-slug="narizeni-tau"] a.pr-btn').click();
  await expect(page).toHaveURL(/\/pravidla\/narizeni-tau\/$/);
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací nařízení Tau');
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page).toHaveTitle('Změny pravidel — Nenechme vyhnít');
  await expect(page.locator('.pr-radek.vybrany')).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/pravidla\/narizeni-tau\/$/);
  await expect(page.locator('dialog#detail')).toBeVisible();
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('detail ukáže všechny části pod sebou', async ({ page }) => {
    await page.goto('/pravidla/zakon-omega/');
    for (const p of ['prospech', 'chrono', 'vyhrady', 'zdroje']) await expect(page.locator(`.m2-panel[data-p="${p}"]`)).toBeVisible();
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: detail pravidla se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/zakon-omega/');
    await overBezPosouvani(page);
  });
}
```

- [ ] **Step 2: Vytáhnout seznam zdrojů do `src/components/SeznamZdroju.astro`**

```astro
---
import type { Zdroj } from '../lib/schema';
import { datumText } from '../lib/casova-osa';
import { popisekDruhu, skupinaZdroje, popisekSkupiny, SKUPINY_ZDROJU } from '../lib/zdroje';

/** Seznam zdrojů v detailu kauzy i pravidla. Filtr má smysl jen u delšího seznamu, v němž jsou aspoň dvě skupiny. */
interface Props { zdroje: Zdroj[] }
const { zdroje } = Astro.props;
const skupiny = SKUPINY_ZDROJU.map(s => ({ s, pocet: zdroje.filter(z => skupinaZdroje(z) === s).length })).filter(x => x.pocet > 0);
const filtr = zdroje.length >= 6 && skupiny.length >= 2;
---
{filtr && (
  <div class="zdroje-filtr" role="group" aria-label="Zobrazit zdroje">
    <button type="button" aria-pressed="true" data-skupina="">Vše <span class="zf-pocet">{zdroje.length}</span></button>
    {skupiny.map(x => <button type="button" aria-pressed="false" data-skupina={x.s}>{popisekSkupiny(x.s)} <span class="zf-pocet">{x.pocet}</span></button>)}
  </div>
)}
<ol class="zdroje">
  {zdroje.map(z => (
    <li id={`zdroj-${z.id}`} data-cislo={z.id} data-skupina={skupinaZdroje(z)}><div>
      <span class="vyd">{z.vydavatel}</span>{/* třída „stanovisko“ už patří boxu stanoviska, proto u zdroje „vyjadreni“ */}<span class={`druh ${z.druh === 'stanovisko' ? 'vyjadreni' : z.druh}`}>{popisekDruhu(z.druh)}</span><br>
      {z.titulek}
      <div class="odkazy">{datumText(z.datum)} · <a href={z.url} rel="noopener noreferrer" target="_blank">originál ↗</a>{z.archiv && <> · <a href={z.archiv} rel="noopener noreferrer" target="_blank">archivní kopie ↗</a></>}</div>
    </div></li>
  ))}
</ol>
```

V `src/components/Detail.astro`:
- přidat `import SeznamZdroju from './SeznamZdroju.astro';`,
- smazat konstanty `skupinyZdroju` a `filtrZdroju` a z importu ze `'../lib/zdroje'` odebrat to, co už se nepoužívá (zůstane nic, import celý smazat),
- v panelu `data-p="zdroje"` nahradit celý blok od `{filtrZdroju && (` po uzavírací `</ol>` řádkem `<SeznamZdroju zdroje={k.zdroje} />`.

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/detail.spec.ts tests/e2e/modal-obsah.spec.ts`
Expected: PASS (refaktoring bez změny chování).

- [ ] **Step 3: Upravit `src/scripts/detail.ts`, aby snesl detail bez mini-osy**

- `const popis = dlg.querySelector<HTMLElement>('.vybrany-popis')!;` → `const popis = dlg.querySelector<HTMLElement>('.vybrany-popis');`
- v `ukaz` nahradit dva řádky `popis.style.left = …` a `popis.textContent = …` blokem:

```ts
    if (popis && body[akt]) {
      popis.style.left = body[akt].style.left;
      popis.textContent = polozky[akt].querySelector('time')?.firstChild?.textContent ?? '';
    }
```

- `dlg.querySelector('.mini-osa')!.addEventListener('click', …)` → `dlg.querySelector('.mini-osa')?.addEventListener('click', …)`
- hned pod něj přidat klik na krok průběhu (detail pravidla):

```ts
  // detail pravidla: krok v ukazateli průběhu otevře svou událost (prvek je uvnitř dialogu, s obsahem se vyměňuje)
  dlg.querySelector('.prubeh-detail')?.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-udalost]');
    if (b) { prepni('chrono'); ukaz(Number(b.dataset.udalost)); }
  });
```

- [ ] **Step 4: Napsat `src/components/DetailPravidla.astro`**

```astro
---
import type { PravidloZaznam } from '../lib/validace';
import PrubehPravidla from './PrubehPravidla.astro';
import SeznamZdroju from './SeznamZdroju.astro';
import { rozdelOdstavce, odstavecNaHtml } from '../lib/souvislosti';
import { datumText } from '../lib/casova-osa';
import { popisekCesty, popisekKomu, popisekZaveru, vynechaneKontroly } from '../lib/pravidla-slovnik';
import { stavPravidla, popisekKroku } from '../lib/pravidla-stavy';
import { nactiKauzy } from '../lib/kauzy';

interface Props { zaznam?: PravidloZaznam }
const { zaznam } = Astro.props;
const REPO = 'https://github.com/nenechmevyhnit/nenechmevyhnit.cz';
const p = zaznam?.pravidlo;
const nazvyKauz = new Map(nactiKauzy().map(z => [z.slug, z.kauza.nazev]));
const odstavce = zaznam ? rozdelOdstavce(zaznam.telo) : [];
const kontroly = p ? vynechaneKontroly(p.cesta) : [];
const chipy = (cisla: number[]) => cisla.map(c => `<a href="#zdroj-${c}" class="chip" data-zdroj="${c}" aria-label="Zdroj ${c}">${c}</a>`).join('');
---
<!-- Stránka pravidla má dialog otevřený už v HTML, aby byl obsah vidět i bez JavaScriptu; skript ho přepne na modální. -->
<dialog class="detail m2 pravidlo" id="detail" aria-labelledby="detail-nadpis" data-slug={zaznam?.slug} open={p ? true : undefined}>
  {p && zaznam && (
    <>
      <button class="zavrit" type="button" aria-label="Zavřít detail">×</button>
      <header class="m2-hlava">
        <div class="roky">{popisekCesty(p.cesta)} · {popisekKroku(stavPravidla(p.udalosti))}</div>
        <h2 id="detail-nadpis">{p.nazev}</h2>
        <p class="perex" id="detail-perex">{p.shrnuti}</p>
        <button class="perex-vice" type="button" aria-expanded="false" aria-controls="detail-perex" hidden>celé shrnutí</button>
        <PrubehPravidla druh={p.druh} udalosti={p.udalosti} interaktivni />
      </header>
      <div class="zalozky" role="tablist">
        <button role="tab" type="button" data-p="prospech" aria-selected="true">Komu prospívá</button>
        <button role="tab" type="button" data-p="chrono" aria-selected="false">Průběh</button>
        <button role="tab" type="button" data-p="vyhrady" aria-selected="false">Výhrady a stanovisko</button>
        {odstavce.length > 0 && <button role="tab" type="button" data-p="souv" aria-selected="false">Souvislosti</button>}
        <button role="tab" type="button" data-p="zdroje" aria-selected="false">Zdroje ({p.zdroje.length})</button>
      </div>
      <div class="m2-panel" data-p="prospech" role="tabpanel">
        <h3 class="panel-nadpis">Komu prospívá</h3>{/* jen bez JavaScriptu, kdy jsou všechny části pod sebou */}
        <p class="pr-zaver"><strong>{popisekZaveru(p.prospech.zaver)}</strong>: {popisekKomu(p.prospech.komu)}</p>
        <ol class="retezec">
          {p.prospech.retezec.map(k => <li>{k.odhad && <span class="odhad">odhad</span>}{k.odhad && ' '}{k.text}<span class="chipy" set:html={chipy(k.zdroje)}></span></li>)}
        </ol>
        {p.prospech.dalsiDotceni && <p class="dalsi-dotceni"><strong>Koho dalšího se změna týká:</strong> {p.prospech.dalsiDotceni.text}<span class="chipy" set:html={chipy(p.prospech.dalsiDotceni.zdroje)}></span></p>}
        {p.kauzy.length > 0 && (
          <section class="vazby" aria-labelledby="kauzy-pravidla-nadpis">
            <h3 id="kauzy-pravidla-nadpis">Související kauzy</h3>
            <ul>{p.kauzy.map(k => <li><a href={`/kauzy/${k.kauza}/`}>{nazvyKauz.get(k.kauza) ?? k.kauza}</a>: {k.popis}<span class="chipy" set:html={chipy(k.zdroje)}></span></li>)}</ul>
          </section>
        )}
        <p class="kriterium">Závěr je rozbor archivu podle metodiky, ne úřední zjištění. <a href="/metodika/#pravidla">Jak rozbor děláme</a></p>
      </div>
      <div class="m2-panel" data-p="chrono" role="tabpanel" hidden>
        <h3 class="panel-nadpis">Průběh</h3>
        <div class="cesta-box">
          <p><strong>{popisekCesty(p.cesta)}</strong>{p.oznaceni && <>, {p.oznaceni}</>}. Předkládá: {p.predkladatel}.</p>
          {p.pripojenoK && <p>Připojeno k: {p.pripojenoK.nazev}<span class="chipy" set:html={chipy(p.pripojenoK.zdroje)}></span></p>}
          {kontroly.length > 0 && <ul class="vynechano" aria-label="Vynechané kontroly legislativního procesu">{kontroly.map(t => <li>{t}</li>)}</ul>}
          {p.ucinnostOd && <p>Účinnost od {datumText(p.ucinnostOd)}</p>}
        </div>
        <ol class="udalosti-seznam">
          {p.udalosti.map((u, i) => (
            <li data-i={i} data-datum={u.datum}>
              <div class="udalost-velka">
                <time>{datumText(u.datum)}<small>{u.krok ? popisekKroku(u.krok) : `událost ${i + 1} z ${p.udalosti.length}`}</small></time>
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
      <div class="m2-panel" data-p="vyhrady" role="tabpanel" hidden>
        <h3 class="panel-nadpis">Výhrady a stanovisko</h3>
        <div class="vyhrady">
          <h4>Výhrady institucí</h4>
          {p.vyhrady.length > 0
            ? <ul>{p.vyhrady.map(v => <li><strong>{v.kdo}:</strong> {v.text}<span class="chipy" set:html={chipy(v.zdroje)}></span></li>)}</ul>
            : <p>Výhrady institucí zatím nejsou zapsané.</p>}
        </div>
        <div class="stanovisko"><h4>Stanovisko předkladatele</h4><p>{p.stanovisko.text}<span class="chipy" set:html={chipy(p.stanovisko.zdroje)}></span></p></div>
        <div class="overeno">{p.overeno ? <>Naposledy ověřeno {datumText(p.overeno)}</> : <strong>Koncept, zatím neověřeno</strong>}</div>
        {p.opravy.length > 0 && <div class="opravy"><h4>Opravy</h4><ul>{p.opravy.map(o => <li>{datumText(o.datum)}: {o.popis}</li>)}</ul></div>}
      </div>
      {odstavce.length > 0 && (
        <div class="m2-panel" data-p="souv" role="tabpanel" hidden>
          <h3 class="panel-nadpis">Souvislosti</h3>
          {odstavce.map(o => <p set:html={odstavecNaHtml(o)}></p>)}
        </div>
      )}
      <div class="m2-panel" data-p="zdroje" role="tabpanel" hidden>
        <h3 class="panel-nadpis">{`Zdroje (${p.zdroje.length})`}</h3>
        <SeznamZdroju zdroje={p.zdroje} />
        <div class="paticka-detailu">
          <a href={`${REPO}/commits/main/obsah/pravidla/${zaznam.slug}.md`}>Historie změn tohoto pravidla</a>
          <a href={`${REPO}/issues/new?template=oprava.yml&title=${encodeURIComponent('Oprava: ' + p.nazev)}`}>Nahlásit chybu</a>
          <a href="#" data-sdilet>Zkopírovat odkaz na pravidlo</a>
        </div>
      </div>
    </>
  )}
</dialog>
```

- [ ] **Step 5: Napsat `src/pages/pravidla/[slug].astro` a doplnit přehled**

```astro
---
import PrehledPravidel from '../../components/PrehledPravidel.astro';
import DetailPravidla from '../../components/DetailPravidla.astro';
import { nactiPravidla } from '../../lib/kauzy';

export function getStaticPaths() {
  return nactiPravidla().map(z => ({ params: { slug: z.slug }, props: { zaznam: z } }));
}
const { zaznam } = Astro.props;
---
<PrehledPravidel otevrene={zaznam}>
  <DetailPravidla slot="detail" zaznam={zaznam} />
</PrehledPravidel>
```

V `src/pages/pravidla/[...prehled].astro` nahradit `<PrehledPravidel />`:

```astro
<PrehledPravidel>
  <DetailPravidla slot="detail" />
</PrehledPravidel>
```

a do frontmatteru přidat `import DetailPravidla from '../../components/DetailPravidla.astro';`.

- [ ] **Step 6: Napsat `src/scripts/navigace-pravidel.ts`**

```ts
import { inicializujDetail } from './detail';

/** Otevírání detailu pravidla bez načítání stránky (obdoba navigace.ts pro kauzy, bez osy a mapy). */
const TITULEK = 'Změny pravidel — Nenechme vyhnít';
const mezipamet = new Map<string, { html: string; trida: string; titulek: string }>();
let zaviramZHistorie = false;

const dialog = () => document.getElementById('detail') as HTMLDialogElement | null;
const vyber = (slug: string | null) =>
  document.querySelectorAll<HTMLElement>('.pr-radek').forEach(r => r.classList.toggle('vybrany', r.dataset.slug === slug));

async function nacti(slug: string) {
  if (!mezipamet.has(slug)) {
    const odpoved = await fetch(`/pravidla/${slug}/`);
    if (!odpoved.ok) throw new Error(`Pravidlo ${slug} nenalezeno`);
    const doc = new DOMParser().parseFromString(await odpoved.text(), 'text/html');
    const d = doc.getElementById('detail')!;
    mezipamet.set(slug, { html: d.innerHTML, trida: d.className, titulek: doc.title });
  }
  return mezipamet.get(slug)!;
}

export async function otevriPravidlo(slug: string, { pridatDoHistorie = true } = {}): Promise<void> {
  const dlg = dialog();
  if (!dlg) return;
  if (dlg.dataset.slug !== slug) {
    let data;
    try { data = await nacti(slug); } catch { location.href = `/pravidla/${slug}/`; return; }
    dlg.innerHTML = data.html;
    dlg.className = data.trida;
    dlg.dataset.slug = slug;
    inicializujDetail(dlg);
    document.title = data.titulek;
  } else {
    document.title = mezipamet.get(slug)?.titulek ?? document.title;
  }
  vyber(slug);
  if (pridatDoHistorie) history.pushState({ slug }, '', `/pravidla/${slug}/`);
  if (!dlg.open) dlg.showModal();
}

export function inicializujNavigaciPravidel(): void {
  const dlg = dialog();
  if (!dlg) return;
  const otevrena = document.body.dataset.otevrena;
  if (otevrena) {
    mezipamet.set(otevrena, { html: dlg.innerHTML, trida: dlg.className, titulek: document.title });
    inicializujDetail(dlg);
    vyber(otevrena);
    history.replaceState({ slug: otevrena }, '');
    // v HTML je dialog otevřený (kvůli návštěvníkům bez JavaScriptu); modálně ho jde otevřít jen zavřený
    dlg.removeAttribute('open');
    dlg.showModal();
  } else {
    history.replaceState({}, '');
  }

  document.querySelector('.pravidla-seznam')?.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.pr-btn');
    const me = e as MouseEvent;
    if (!a || me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
    e.preventDefault();
    otevriPravidlo(a.closest<HTMLElement>('.pr-radek')!.dataset.slug!);
  });

  dlg.addEventListener('close', () => {
    document.title = TITULEK;
    const slug = dlg.dataset.slug;
    delete document.body.dataset.otevrena;
    // detail otevřený rovnou z adresy nemá kam vrátit fokus: vrátí se na řádek pravidla
    if ((document.activeElement === document.body || !document.activeElement) && slug) {
      document.querySelector<HTMLElement>(`.pr-radek[data-slug="${CSS.escape(slug)}"]:not([hidden]) a.pr-btn`)?.focus();
    }
    if (!zaviramZHistorie && location.pathname !== '/pravidla/') history.pushState({}, '', '/pravidla/');
    zaviramZHistorie = false;
    vyber(null);
  });
  dlg.addEventListener('click', e => {
    if (e.target === dlg || (e.target as HTMLElement).closest('.zavrit')) dlg.close();
  });

  addEventListener('popstate', e => {
    const slug = (e.state as { slug?: string } | null)?.slug;
    if (slug) { otevriPravidlo(slug, { pridatDoHistorie: false }); return; }
    if (dlg.open) { zaviramZHistorie = true; dlg.close(); }
  });
}
```

V `src/components/PrehledPravidel.astro` doplnit klientský skript:

```astro
<script>
  import { inicializujFiltrPravidel } from '../scripts/pravidla-filtr';
  import { inicializujNavigaciPravidel } from '../scripts/navigace-pravidel';
  inicializujFiltrPravidel();
  inicializujNavigaciPravidel();
</script>
```

- [ ] **Step 7: Spustit testy**

Run: `npx vitest run`
Expected: PASS.

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-detail.spec.ts tests/e2e/pravidla-prehled.spec.ts tests/e2e/detail.spec.ts tests/e2e/modal-obsah.spec.ts tests/e2e/navigace.spec.ts`
Expected: PASS. Když detail na malém okně svisle přetéká, upravit jen `pravidla.css` (např. `.prubeh-detail` menší okraje, na mobilu skrytá data fází).

- [ ] **Step 8: Vizuální kontrola**

Snímky `/pravidla/zakon-omega/` na 1342×565 a 390×700, každá záložka. Ověřit čitelnost ukazatele průběhu v hlavičce, označení „odhad“ a odsazení řetězce. Snímky necommitovat.

- [ ] **Step 9: Commit**

```bash
git add src/components/SeznamZdroju.astro src/components/Detail.astro src/components/DetailPravidla.astro src/components/PrehledPravidel.astro "src/pages/pravidla/[slug].astro" "src/pages/pravidla/[...prehled].astro" src/scripts/navigace-pravidel.ts src/scripts/detail.ts src/styles/pravidla.css tests/e2e/pravidla-detail.spec.ts
git commit -m "Změny pravidel: detail s řetězcem prospěchu, průběhem, výhradami a zdroji

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Související změny pravidel v detailu kauzy

**Files:**
- Modify: `src/components/Detail.astro`
- Modify: `src/pages/kauzy/[slug].astro`
- Test: `tests/e2e/pravidla-kauzy.spec.ts`

**Interfaces:**
- Consumes: `souvisejiciPravidla(slug)` a `type SouvisejiciPravidlo` (Task 4 a 3)
- Produces: `Detail` přijímá prop `pravidla?: SouvisejiciPravidlo[]` a v panelu `souv` vykreslí `section.souvisejici-pravidla`

- [ ] **Step 1: Napsat padající e2e test**

`tests/e2e/pravidla-kauzy.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test('kauza ukazuje související změny pravidel a vede na ně', async ({ page }) => {
  await page.goto('/kauzy/zeta-stret/');
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  const sekce = page.locator('.m2-panel[data-p="souv"] .souvisejici-pravidla');
  await expect(sekce.getByRole('heading')).toHaveText('Související změny pravidel');
  await expect(sekce).toContainText('Schváleno Sněmovnou');
  await expect(sekce).toContainText('Zkrácení lhůty by se dotklo fiktivního řízení Žeta.');
  await sekce.getByRole('link', { name: 'Testovací novela zákona Omega s dlouhým názvem pro mobil' }).click();
  await expect(page).toHaveURL(/\/pravidla\/zakon-omega\/$/);
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací novela zákona Omega s dlouhým názvem pro mobil');
});

test('z pravidla se jde na kauzu', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  await page.locator('.m2-panel[data-p="prospech"]').getByRole('link', { name: 'Testovací kauza Žeta' }).click();
  await expect(page).toHaveURL(/\/kauzy\/zeta-stret\/$/);
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací kauza Žeta');
});

test('kauza bez souvisejících pravidel sekci nemá', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  await expect(page.locator('.souvisejici-pravidla')).toHaveCount(0);
});

test('přechod mezi kauzami bez načtení stránky přenese i související pravidla', async ({ page }) => {
  // na alfa-dotace navazuje v testovacích datech jen zeta-stret („Navazují na ni“)
  await page.goto('/kauzy/alfa-dotace/');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await page.locator('.m2-panel[data-p="souv"] a[data-kauza="zeta-stret"]').click();
  await expect(page).toHaveURL(/\/kauzy\/zeta-stret\/$/);
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
  await page.getByRole('tab', { name: 'Souvislosti' }).click();
  await expect(page.locator('.m2-panel[data-p="souv"] .souvisejici-pravidla')).toBeVisible();
});
```

- [ ] **Step 2: Spustit test, ověřit, že padá**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-kauzy.spec.ts`
Expected: FAIL u prvního testu (sekce neexistuje).

- [ ] **Step 3: Upravit `src/pages/kauzy/[slug].astro`**

```astro
---
import HlavniStranka from '../../components/HlavniStranka.astro';
import Detail from '../../components/Detail.astro';
import { nactiKauzy, nactiAktery, maMapu, souvisejiciPravidla } from '../../lib/kauzy';
import { vazbyKauzy } from '../../lib/mapa';

export function getStaticPaths() {
  return nactiKauzy().map(z => ({ params: { slug: z.slug }, props: { zaznam: z } }));
}
const { zaznam } = Astro.props;
const vazby = vazbyKauzy(nactiKauzy(), nactiAktery(), zaznam.slug);
---
<HlavniStranka otevrena={zaznam}>
  <Detail slot="detail" zaznam={zaznam} vazby={vazby} naMapu={maMapu()} pravidla={souvisejiciPravidla(zaznam.slug)} />
</HlavniStranka>
```

- [ ] **Step 4: Upravit `src/components/Detail.astro`**

Frontmatter:

```ts
import type { SouvisejiciPravidlo } from '../lib/pravidla';

interface Props { zaznam?: KauzaZaznam; vazby?: VazbyKauzy; naMapu?: boolean; pravidla?: SouvisejiciPravidlo[] }
const { zaznam, vazby, naMapu = false, pravidla = [] } = Astro.props;
```

V panelu `data-p="souv"` za blok `{maVazby && vazby && (…)}` přidat:

```astro
        {pravidla.length > 0 && (
          <section class="vazby souvisejici-pravidla" aria-labelledby="pravidla-kauzy-nadpis">
            <h3 id="pravidla-kauzy-nadpis">Související změny pravidel</h3>
            <ul>
              {pravidla.map(p => <li><a href={`/pravidla/${p.slug}/`}>{p.nazev}</a> ({p.stav}): {p.popis}</li>)}
            </ul>
          </section>
        )}
```

Čísla zdrojů se tu záměrně neukazují: zdroje vazby patří k pravidlu, ne ke kauze.

- [ ] **Step 5: Spustit testy**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-kauzy.spec.ts tests/e2e/detail.spec.ts tests/e2e/modal-obsah.spec.ts tests/e2e/mapa.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Detail.astro "src/pages/kauzy/[slug].astro" tests/e2e/pravidla-kauzy.spec.ts
git commit -m "Detail kauzy: související změny pravidel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Metodika a O projektu

**Files:**
- Modify: `src/data/metodika.ts`
- Modify: `src/data/o-projektu.ts`
- Modify: `tests/e2e/stranky.spec.ts:6`
- Test: `tests/e2e/stranky.spec.ts` (nový test)

**Interfaces:**
- Produces: sekce Metodiky s `id: "pravidla"` (kotva `/metodika/#pravidla`, na kterou odkazuje detail pravidla z Tasku 6)

- [ ] **Step 1: Napsat padající test**

Do `tests/e2e/stranky.spec.ts`:
- v řádku 6 změnit počet karet Metodiky z `7` na `8` (`['/metodika/', 'Jak archiv vedeme', 8]`),
- za první `for` cyklus přidat:

```ts
test('/metodika/#pravidla otevře oddíl Změny pravidel', async ({ page }) => {
  await page.goto('/metodika/#pravidla');
  const panel = page.locator('.v4-dlg-panel[data-sekce="pravidla"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('Změny pravidel');
  await expect(panel).toContainText('Závěr je rozbor archivu, ne úřední zjištění.');
  await expect(panel.locator('.slovnicek dt')).toHaveText(['prospěch doložen', 'prospěch pravděpodobný']);
});
```

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/stranky.spec.ts`
Expected: FAIL (7 karet, oddíl neexistuje).

- [ ] **Step 2: Upravit `src/data/metodika.ts`**

V oddílu `kriteria` nahradit `<p>Kroky vlády jako celku zatím nezařazujeme.</p>` textem:

```html
<p>Změny pravidel, které předkládá nebo vydává vláda či vládní koalice, mají vlastní část archivu s vlastními pravidly (oddíl Změny pravidel).</p>
```

Na konec pole `sekce` (za oddíl `stavy`) přidat:

```ts
    {
      id: "pravidla",
      nadpis: "Změny pravidel",
      shrnuti: "Zákony, nařízení a dotační pravidla současné vlády, ze kterých mají prospěch Andrej Babiš nebo Agrofert. Prospěch dokládá rozbor krok za krokem.",
      html: `<p>Vedle kauz archiv zaznamenává <strong>změny pravidel</strong>: zákony a jejich novely, pozměňovací návrhy, nařízení vlády, vyhlášky ministerstev a pravidla dotačních programů. Zapisujeme je od chvíle, kdy jsou oficiálně předložené nebo zveřejněné, a průběžně doplňujeme, jak projednávání pokračuje. Záznamy nemažeme: zamítnutý nebo stažený návrh zůstává v archivu s tímto stavem.</p>
<p>Změna pravidla do archivu patří, když splní <strong>všechny</strong> tyto podmínky:</p>
<ul><li>má oficiální text (sněmovní tisk, připomínkové řízení, Sbírka zákonů nebo zveřejněná výzva),</li>
<li>předložila nebo vydala ji vláda jmenovaná 9. 12. 2025, její ministerstva, státní fondy, nebo poslanci a senátoři vládní koalice,</li>
<li>rozbor ukáže prospěch pro Andreje Babiše osobně nebo pro Agrofert,</li>
<li>dopadá na ně zvlášť, ne plošně na všechny: na úzký obor, příjemce konkrétní dotace, členy vlády nebo na řízení, které Babiš či Agrofert vedou.</li></ul>
<p>Plošné změny, třeba sazbu DPH pro všechny, sem nezařazujeme. Rozhodnutí v jednotlivém případě patří ke kauze, které se týká.</p>
<h3 id="retezec">Rozbor krok za krokem</h3>
<p>U každé změny sestavíme z textu předpisu <strong>řetězec</strong>: co pravidlo mění, jakého faktu o Babišovi nebo Agrofertu se to týká a jaký z toho plyne důsledek. Každý krok má vlastní zdroj a první krok vždy cituje text předpisu. Krok, který stojí na odhadu, je viditelně označený.</p>
<dl class="slovnicek">
<dt>prospěch doložen</dt><dd>Žádný krok řetězce nestojí na odhadu.</dd>
<dt>prospěch pravděpodobný</dt><dd>Aspoň jeden krok stojí na odhadu, například jak se nová lhůta uplatní na už zahájená řízení.</dd>
</dl>
<p>Kde z rozboru nic jasného nevyjde, změnu nezveřejníme. <strong>Závěr je rozbor archivu, ne úřední zjištění.</strong> U každé změny uvádíme stanovisko předkladatele. Když chybí, uvedeme aspoň účel, který předkladatel napsal do důvodové zprávy nebo odůvodnění.</p>
<h3 id="cesta">Cesta předložení</h3>
<p>Vládní návrh zákona projde meziresortním připomínkovým řízením, hodnocením dopadů regulace (RIA) a Legislativní radou vlády. U jiných cest tyto kontroly odpadají a u záznamu to uvádíme:</p>
<ul><li><strong>poslanecký a senátní návrh:</strong> bez meziresortního připomínkového řízení a bez hodnocení dopadů regulace,</li>
<li><strong>pozměňovací návrh:</strong> navíc bez stanoviska vlády a bez prvního čtení, protože se podává až ve druhém čtení k jinému zákonu.</li></ul>
<p>Jde o popis legislativního procesu, ne o hodnocení.</p>
<h3 id="vyhrady">Výhrady a jazyk</h3>
<p>Uvádíme výhrady institucí, jako je Legislativní rada vlády, ÚOHS, NKÚ, Evropská komise nebo veřejný ochránce práv. Výhrady opozice patří do souvislostí a označujeme je jako politické. Dokud změna neplatí, píšeme podmiňovacím způsobem: novela <em>by zkrátila</em>, <em>umožnila by</em>.</p>`,
    },
```

`platiOd` změnit na dnešní datum ve tvaru `D. M. RRRR` (den, kdy se task provádí).

- [ ] **Step 3: Upravit `src/data/o-projektu.ts`**

V oddílu `proc` na konec prvního odstavce (za „…za tři roky skoro nikdo.“) přidat větu:

```
 Proto archiv vedle kauz zapisuje i změny pravidel, ze kterých mají prospěch Andrej Babiš nebo Agrofert.
```

- [ ] **Step 4: Spustit testy**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/stranky.spec.ts tests/e2e/bez-posouvani.spec.ts`
Expected: PASS. Oddíl je delší, modal Metodiky ho podle stávajícího chování rozdělí do sloupců. Když `bez-posouvani` padá na `/metodika/`, zkrátit text, CSS neměnit.

- [ ] **Step 5: Commit**

```bash
git add src/data/metodika.ts src/data/o-projektu.ts tests/e2e/stranky.spec.ts
git commit -m "Metodika: oddíl Změny pravidel; O projektu: zmínka o nové části

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Kontroly, údržba, přístupnost a celkové ověření

**Files:**
- Modify: `.github/workflows/kontrola.yml:31`
- Modify: `.github/workflows/tydenni.yml:16,19`
- Modify: `scripts/archivuj.ts`
- Modify: `tests/e2e/pristupnost.spec.ts:6`
- Modify: `tests/e2e/bez-posouvani.spec.ts:7`

**Interfaces:**
- Consumes: `overAdresar(...).pravidla` (Task 3), stránky z Tasků 5–6

- [ ] **Step 1: Rozšířit testy přístupnosti a posouvání**

- `tests/e2e/pristupnost.spec.ts` řádek 6: do pole cest přidat `'/pravidla/'`, `'/pravidla/zakon-omega/'` a `'/pravidla/pozmenovaci-sigma/'`.
- `tests/e2e/bez-posouvani.spec.ts` řádek 7: do pole cest přidat `'/pravidla/'` a `'/pravidla/zakon-omega/'`.

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pristupnost.spec.ts tests/e2e/bez-posouvani.spec.ts`
Expected: PASS. Opravovat jen kód, testy ne. Typické nálezy axe: kontrast `.prubeh li` (barva `--meta` na bílé projde) a seznam `ol` uvnitř odkazu (je skrytý přes `aria-hidden`).

- [ ] **Step 2: Kontrola odkazů v CI**

`.github/workflows/kontrola.yml`, krok „Změněné kauzy“: přejmenovat na „Změněné kauzy a pravidla“ a v příkazu `git diff` doplnit cestu:

```yaml
        run: echo "soubory=$(git diff --name-only --diff-filter=AM origin/main...HEAD -- 'obsah/kauzy/*.md' 'obsah/pravidla/*.md' | tr '\n' ' ')" >> "$GITHUB_OUTPUT"
```

a krok „Kontrola odkazů ve změněných kauzách“ přejmenovat na „Kontrola odkazů ve změněných kauzách a pravidlech“.

`.github/workflows/tydenni.yml`, krok `lychee`:

```yaml
        if: hashFiles('obsah/kauzy/*.md', 'obsah/pravidla/*.md') != ''
        uses: lycheeverse/lychee-action@v2
        with:
          args: --config lychee.toml 'obsah/kauzy/*.md' 'obsah/pravidla/*.md'
```

Glob bez shody lychee nehlásí jako chybu, pokud jiný vstup existuje. Ověřit lokálně, je-li lychee k dispozici (`lychee --version`): `lychee --config lychee.toml --dump 'obsah/kauzy/*.md' 'obsah/pravidla/*.md'` musí skončit bez chyby i bez složky `obsah/pravidla`. Pokud lychee lokálně není, uvést to v závěrečné zprávě jako neověřené.

- [ ] **Step 3: Archivace zdrojů i u pravidel**

`scripts/archivuj.ts` přepsat:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { overAdresar } from '../src/lib/validace';
import { doplnArchiv, ziskejArchiv } from '../src/lib/archiv';

const adresar = process.env.NV_OBSAH ?? 'obsah';
const { zaznamy, pravidla, chyby } = overAdresar(adresar);
if (chyby.length) { console.error('Obsah má chyby, archivace se přeskočí.'); process.exit(1); }
const soubory = [
  ...zaznamy.map(z => ({ soubor: `${adresar}/kauzy/${z.slug}.md`, zdroje: z.kauza.zdroje })),
  ...pravidla.map(z => ({ soubor: `${adresar}/pravidla/${z.slug}.md`, zdroje: z.pravidlo.zdroje })),
];
let doplneno = 0;
for (const { soubor, zdroje } of soubory) {
  let text = readFileSync(soubor, 'utf8');
  for (const zdroj of zdroje.filter(x => !x.archiv)) {
    const archiv = await ziskejArchiv(zdroj.url);
    if (archiv) { text = doplnArchiv(text, zdroj.url, archiv); doplneno++; }
    await new Promise(r => setTimeout(r, 5000)); // šetrně k Wayback Machine
  }
  writeFileSync(soubor, text);
}
console.log(`Doplněno archivních kopií: ${doplneno}`);
```

Ověření bez sítě: `$env:NV_OBSAH='tests/fixtures/prazdny'; npx tsx scripts/archivuj.ts; Remove-Item Env:NV_OBSAH`
Expected: `Doplněno archivních kopií: 0`.

- [ ] **Step 4: Celkové ověření**

```powershell
Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-pravidla'
npm run over
npx astro build
npx vitest run
npm run e2e
```
Expected:
- `npm run over` vypíše `Obsah v pořádku: 33 kauz a 0 pravidel v „obsah“.` (počet kauz podle aktuálního `main`),
- produkční build projde a v `dist/` není složka `pravidla` ani odkaz `href="/pravidla/"` (`Select-String -Path dist/index.html -Pattern '/pravidla/'` nic nenajde),
- Vitest i celý Playwright PASS.

Výsledky (počty testů, případné neověřené kroky) zapsat do závěrečné zprávy.

- [ ] **Step 5: Náhled konceptů**

Pokud v hlavní složce existuje `_koncepty/obsah/pravidla/` s aspoň jedním konceptem, zkopírovat `_koncepty/obsah` do `%TEMP%\nv-koncepty` (koncepty jiné relace mohou být rozpracované) a spustit `$env:NV_OBSAH="$env:TEMP\nv-koncepty"; $env:NV_KONCEPTY='ano'; npx astro build --outDir "$env:TEMP\nv-koncepty-dist"`. Build musí projít, nebo jen hlásit chyby v obsahu konceptů. Nesmí hlásit chybu vazby na zveřejněnou kauzu (`znameKauzy`). Pozor: `obsah/kauzy` se čte relativně k aktuální složce, build proto spouštět z worktree. Když koncepty pravidel zatím nejsou, krok přeskočit a uvést to.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/kontrola.yml .github/workflows/tydenni.yml scripts/archivuj.ts tests/e2e/pristupnost.spec.ts tests/e2e/bez-posouvani.spec.ts
git commit -m "Změny pravidel: kontrola odkazů, archivace zdrojů, přístupnost a posouvání

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Po dokončení

- Větev `zmeny-pravidel` zůstane lokálně, push a PR dělá uživatel (`gh` tu nemá přístup), viz superpowers:finishing-a-development-branch.
- Web se po sloučení nezmění, dokud v `obsah/pravidla/` nebude první ověřené pravidlo (podmínka v `maPravidla`).
- Obsah (soupis, koncepty, ověření) běží odděleně podle oddílu 8 specifikace a `_koncepty/test-pravidla.md`.
