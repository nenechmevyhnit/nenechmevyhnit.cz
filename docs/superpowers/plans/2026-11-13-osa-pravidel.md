# Časová osa změn pravidel: plán implementace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přidat do přehledu `/pravidla/` druhé zobrazení „Časová osa“: každá změna pravidla ve vlastním řádku, události jako body na společné ose měsíců od 1. 12. 2025 do nejzazší účinnosti, klik na bod otevře událost v detailu.

**Architecture:** Čistá funkce `osaPravidel()` (`src/lib/osa-pravidel.ts`) spočítá na serveru rozsah osy, značky a body. Komponenta `OsaPravidel.astro` je vykreslí jako HTML a CSS. Klientský skript `src/scripts/osa-pravidel.ts` přepíná zobrazení (`?pohled=osa`), ukazuje popisky a posouvá osu na „dnes“. Navigace detailu umí otevřít konkrétní událost (`?udalost=`), filtr skrývá i řádky osy.

**Tech Stack:** Astro 7 (statický výstup), TypeScript, klientský JS bez frameworku, Vitest, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-11-13-osa-pravidel-design.md`. Navazuje na `2026-11-13-zmeny-pravidel-design.md` a `2026-11-13-kontrola-moci-design.md`.

## Global Constraints

- **Souběžná práce:** do tohoto worktree zapisuje i jiná relace (stránkování seznamu, čipy „+N další“ v `PrehledPravidel.astro`, `pravidla-filtr.ts`, `navigace-pravidel.ts`, `pravidla.css`). **Před každým úkolem** ověř `git status --short`. Pokud jsou v těchto souborech necommitované cizí změny, nezačínej a ohlas to (BLOCKED). Vždy si přečti aktuální podobu souborů, kódové úryvky v plánu napoj na to, co tam skutečně je.
- Texty v UI, hláškách, komentářích a commitech jsou česky se správnou diakritikou. Identifikátory česky bez diakritiky.
- Ve vlastním textu webu nepoužívat „ohýbání“, „oslabení“, „ušité“, „na míru“, „agrobaron“ ani jiná hodnocení. Barva nehodnotí druh události ani stav, červená `#DB1F2D` se nepoužije.
- **Žádné svislé posouvání stránky:** `document.scrollingElement.scrollHeight <= innerHeight` na `VELIKOSTI` z `tests/e2e/pomocne.ts` (1256×528, 1342×565, 1342×676, 1896×868, 390×700). Posouvat se smí jen uvnitř plochy osy (svisle řádky, do strany čas).
- WCAG 2.1 AA: axe bez závažných chyb, ovládání klávesnicí, viditelný fokus.
- Klientský JavaScript bez frameworku. Žádné cizí skripty ani písma.
- Osa začíná `2025-12-01`, okraj za koncem je půl měsíce, „dnes“ je datum sestavení (na serveru `new Date()`).
- Pracuje se ve worktree `C:\Users\reath\Projects\NenechmeVyhnit-pravidla`, větev `zmeny-pravidel`. Hlavní složku `C:\Users\reath\Projects\NenechmeVyhnit` nepoužívat. `_koncepty` (propojená složka) tento plán nemění.
- **Testy (Windows):** Vitest i Playwright z PowerShellu po `Set-Location 'C:\Users\reath\Projects\NenechmeVyhnit-pravidla'` (velké `C:`). `npm run build:e2e` sestaví `dist-e2e` a `dist-prazdny`. Playwright servíruje 4321 a 4322. Když jsou obsazené, nic cizího nezastavuj a použij necommitovaný `playwright.local.config.ts` s portem 4331. Na 4500 běží cizí `astro dev`, na 127.0.0.1:4410 náhled konceptů. Nezastavovat.
- Konce řádků LF. Commity česky, končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Hooky nepřeskakovat.

## Review Focus

1. **Zavření detailu otevřeného z osy** vrátí `/pravidla/?pohled=osa`, osa zůstane zobrazená a fokus se vrátí na název řádku osy (ne na skrytý řádek seznamu). → test v Task 3.
2. **Neplatné `?udalost=`** (záporné, příliš velké, text) detail otevře normálně bez chyby v konzoli. → test v Task 3.
3. **Filtr bez výsledku v zobrazení osy** ukáže prázdný stav s „Zrušit filtry“ i v ose, ne jen ve skrytém seznamu. → test v Task 4.
4. **Popisek u bodu na okraji** (první měsíc, poslední bod u pravého okraje) zůstane celý v okně. → test v Task 2.
5. **Přechod Seznam → Osa → Seznam** zachová filtr a počítadlo a stránkování seznamu se po návratu obnoví. → test v Task 4.

---

## Mapa souborů

| Soubor | Odpovědnost |
|---|---|
| `src/lib/osa-pravidel.ts` (nový) | výpočet osy: rozsah, značky, „dnes“, řádky, body, čáry, „dříve“ |
| `src/components/OsaPravidel.astro` (nový) | vykreslení osy, legenda, popisek, prázdný stav |
| `src/scripts/osa-pravidel.ts` (nový) | přepínač zobrazení, `?pohled=osa`, popisky, posun na „dnes“, klik na bod |
| `src/components/PrehledPravidel.astro` | přepínač, vložení osy |
| `src/styles/pravidla.css` | styly osy a přepínače |
| `src/scripts/detail.ts` | `ukazUdalost(dlg, i)` |
| `src/scripts/navigace-pravidel.ts` | otevření na události, `?udalost=`, návrat na osu |
| `src/scripts/pravidla-filtr.ts` | filtr skrývá i řádky osy, prázdný stav osy |
| `tests/unit/osa-pravidel.test.ts` (nový) | jednotkové testy výpočtu |
| `tests/fixtures/obsah/pravidla/pozmenovaci-sigma.md` | událost před 1. 12. 2025 |
| `tests/e2e/pravidla-osa.spec.ts` (nový) | testy v prohlížeči |

---

### Task 1: Výpočet osy

**Files:**
- Create: `src/lib/osa-pravidel.ts`
- Test: `tests/unit/osa-pravidel.test.ts`

**Interfaces:**
- Consumes: `rokCislo`, `datumText` z `src/lib/casova-osa.ts`. `popisekKroku`, `UKONCUJICI`, `type Krok` z `src/lib/pravidla-stavy.ts`. `popisekCesty`, `type Cesta` z `src/lib/pravidla-slovnik.ts`.
- Produces:
  - `OSA_OD = '2025-12-01'`
  - `type DruhBodu = 'krok' | 'konec' | 'udalost' | 'ucinnost'`
  - `type BodOsy = { x: number; druh: DruhBodu; datum: string; popisek: string; popisekSkupiny: string | null; udalost: number | null; posun: number }`
  - `type RadekOsy = { slug: string; nazev: string; cesta: string; body: BodOsy[]; cara: { od: number; do: number } | null; caraBudouci: { od: number; do: number } | null; drive: { pocet: number; udalost: number } | null }`
  - `type ZnackaOsy = { x: number; text: string; rok: boolean }`
  - `type Osa = { od: string; do: string; dnes: number; znacky: ZnackaOsy[]; radky: RadekOsy[] }`
  - `osaPravidel(zaznamy: readonly ZaznamOsy[], dnes: Date): Osa`, kde `ZaznamOsy = { slug: string; pravidlo: { nazev: string; cesta: Cesta; udalosti: readonly { datum: string; krok?: Krok; nazev: string }[]; ucinnostOd?: string } }` (`PravidloZaznam` tomu vyhovuje).
  - `x` jsou procenta šířky osy zaokrouhlená na 2 desetinná místa.

- [ ] **Step 1: Napiš padající testy**

`tests/unit/osa-pravidel.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { osaPravidel, OSA_OD } from '../../src/lib/osa-pravidel';

const DNES = new Date('2026-11-13T12:00:00Z');
type U = { datum: string; krok?: any; nazev: string };
const z = (slug: string, nazev: string, udalosti: U[], ucinnostOd?: string, cesta: any = 'poslanecky-navrh') =>
  ({ slug, pravidlo: { nazev, cesta, udalosti, ...(ucinnostOd ? { ucinnostOd } : {}) } });

describe('osaPravidel', () => {
  it('rozsah začíná 1. 12. 2025 a končí dneškem s okrajem, bez budoucí účinnosti', () => {
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03-01', krok: 'predlozeno', nazev: 'Podáno' }])], DNES);
    expect(o.od).toBe(OSA_OD);
    expect(o.do).toBe('2026-11-13');
    expect(o.dnes).toBeGreaterThan(90);
    expect(o.dnes).toBeLessThan(100);
  });
  it('rozsah sahá k nejzazší budoucí účinnosti a „dnes“ je uvnitř', () => {
    const o = osaPravidel([
      z('a', 'A', [{ datum: '2026-03-01', krok: 'predlozeno', nazev: 'Podáno' }], '2027-07-01'),
      z('b', 'B', [{ datum: '2026-04-01', krok: 'predlozeno', nazev: 'Podáno' }], '2027-01-01'),
    ], DNES);
    expect(o.do).toBe('2027-07-01');
    expect(o.dnes).toBeGreaterThan(50);
    expect(o.dnes).toBeLessThan(70);
    const a = o.radky.find(r => r.slug === 'a')!;
    const ucinnost = a.body.find(b => b.druh === 'ucinnost')!;
    expect(ucinnost.udalost).toBeNull();
    expect(ucinnost.popisek).toBe('Účinnost od 1. 7. 2027');
    expect(ucinnost.x).toBeGreaterThan(95);
    expect(ucinnost.x).toBeLessThanOrEqual(100);
  });
  it('značky po měsících: první s rokem, leden jako letopočet', () => {
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03-01', krok: 'predlozeno', nazev: 'Podáno' }])], DNES);
    expect(o.znacky[0]).toEqual({ x: 0, text: 'pro 2025', rok: true });
    expect(o.znacky[1]).toMatchObject({ text: '2026', rok: true });
    expect(o.znacky[2]).toMatchObject({ text: 'úno', rok: false });
    expect(o.znacky).toHaveLength(12);
  });
  it('druh bodu podle kroku, popisky, index události', () => {
    const o = osaPravidel([z('a', 'Novela A', [
      { datum: '2026-03-01', krok: 'predlozeno', nazev: 'Návrh podán' },
      { datum: '2026-04-01', nazev: 'Článek v médiích' },
      { datum: '2026-05-14', krok: 'zamitnuto', nazev: 'Zamítnuto' },
    ])], DNES);
    const [b0, b1, b2] = o.radky[0].body;
    expect(b0).toMatchObject({ druh: 'krok', datum: '2026-03-01', popisek: '1. 3. 2026 · Předloženo', udalost: 0, posun: 0, popisekSkupiny: null });
    expect(b1).toMatchObject({ druh: 'udalost', popisek: '1. 4. 2026 · Článek v médiích', udalost: 1 });
    expect(b2).toMatchObject({ druh: 'konec', popisek: '14. 5. 2026 · Zamítnuto', udalost: 2 });
    expect(b0.x).toBeLessThan(b1.x);
    expect(b1.x).toBeLessThan(b2.x);
    expect(o.radky[0].cesta).toBe('Poslanecký návrh zákona');
  });
  it('plná čára mezi prvním a posledním krokem, přerušovaná k budoucí účinnosti', () => {
    const o = osaPravidel([z('a', 'A', [
      { datum: '2026-01-10', nazev: 'Událost' },
      { datum: '2026-03-01', krok: 'predlozeno', nazev: 'Podáno' },
      { datum: '2026-09-20', krok: 'schvaleno-snemovnou', nazev: 'Sněmovna' },
    ], '2027-01-01')], DNES);
    const r = o.radky[0];
    const kroky = r.body.filter(b => b.druh === 'krok');
    expect(r.cara).toEqual({ od: kroky[0].x, do: kroky[1].x });
    expect(r.caraBudouci).toEqual({ od: kroky[1].x, do: r.body.find(b => b.druh === 'ucinnost')!.x });
  });
  it('jediný krok nemá plnou čáru, účinnost v minulosti se nekreslí', () => {
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03-01', krok: 'vyhlaseno', nazev: 'Vyhlášeno' }], '2026-04-01', 'narizeni-vlady')], DNES);
    expect(o.radky[0].cara).toBeNull();
    expect(o.radky[0].caraBudouci).toBeNull();
    expect(o.radky[0].body.map(b => b.druh)).toEqual(['krok']);
  });
  it('události před 1. 12. 2025 se nekreslí, značka „dříve“ nese počet a index první', () => {
    const o = osaPravidel([z('a', 'A', [
      { datum: '2025-06-23', nazev: 'Rozhodnutí soudu' },
      { datum: '2025-11', nazev: 'Listopad' },
      { datum: '2026-04-29', krok: 'pripominkove-rizeni', nazev: 'Připomínky' },
    ], undefined, 'vladni-navrh')], DNES);
    expect(o.radky[0].drive).toEqual({ pocet: 2, udalost: 0 });
    expect(o.radky[0].body).toHaveLength(1);
    expect(o.radky[0].body[0].udalost).toBe(2);
  });
  it('neúplné datum leží uprostřed období', () => {
    const o = osaPravidel([z('a', 'A', [{ datum: '2026-03', nazev: 'Březen' }, { datum: '2026-03-01', krok: 'predlozeno', nazev: 'P' }, { datum: '2026-03-31', krok: 'schvaleno-snemovnou', nazev: 'S' }])], DNES);
    const [mesic, prvni, posledni] = o.radky[0].body;
    expect(mesic.x).toBeGreaterThan(prvni.x);
    expect(mesic.x).toBeLessThan(posledni.x);
  });
  it('body ve stejný den dostanou posun a společný popisek', () => {
    const o = osaPravidel([z('a', 'A', [
      { datum: '2026-10-26', nazev: 'Vláda schválila' },
      { datum: '2026-10-26', krok: 'predlozeno', nazev: 'Podáno' },
    ])], DNES);
    const [b0, b1] = o.radky[0].body;
    expect(b0.x).toBe(b1.x);
    expect([b0.posun, b1.posun]).toEqual([0, 1]);
    expect(b0.popisekSkupiny).toBe('26. 10. 2026 · Vláda schválila; 26. 10. 2026 · Předloženo');
    expect(b1.popisekSkupiny).toBe(b0.popisekSkupiny);
  });
  it('řádky podle první události od 1. 12. 2025, při shodě podle názvu', () => {
    const o = osaPravidel([
      z('c', 'Čtvrtý', [{ datum: '2026-05-01', krok: 'predlozeno', nazev: 'P' }]),
      z('b', 'Beta', [{ datum: '2026-02-01', krok: 'predlozeno', nazev: 'P' }]),
      z('a', 'Alfa', [{ datum: '2025-01-01', nazev: 'Dávno' }, { datum: '2026-02-01', krok: 'predlozeno', nazev: 'P' }]),
      z('d', 'Delta', [{ datum: '2026-01-15', krok: 'predlozeno', nazev: 'P' }]),
    ], DNES);
    expect(o.radky.map(r => r.slug)).toEqual(['d', 'a', 'b', 'c']);
  });
  it('prázdný vstup dá osu bez řádků', () => {
    const o = osaPravidel([], DNES);
    expect(o.radky).toEqual([]);
    expect(o.znacky.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Spusť testy a ověř, že padají**

Run: `npx vitest run tests/unit/osa-pravidel.test.ts`
Expected: FAIL. Modul `../../src/lib/osa-pravidel` neexistuje.

- [ ] **Step 3: Implementuj**

`src/lib/osa-pravidel.ts`:

```ts
import { rokCislo, datumText } from './casova-osa';
import { popisekKroku, UKONCUJICI, type Krok } from './pravidla-stavy';
import { popisekCesty, type Cesta } from './pravidla-slovnik';

/** Časová osa změn pravidel (spec 2026-11-13-osa-pravidel). Jen výpočet; vykreslení je v OsaPravidel.astro. */
export const OSA_OD = '2025-12-01';
const OKRAJ = 0.5 / 12; // půl měsíce za koncem osy
const MESICE = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];

export type DruhBodu = 'krok' | 'konec' | 'udalost' | 'ucinnost';
export type BodOsy = { x: number; druh: DruhBodu; datum: string; popisek: string; popisekSkupiny: string | null; udalost: number | null; posun: number };
export type RadekOsy = {
  slug: string; nazev: string; cesta: string; body: BodOsy[];
  cara: { od: number; do: number } | null; caraBudouci: { od: number; do: number } | null;
  drive: { pocet: number; udalost: number } | null;
};
export type ZnackaOsy = { x: number; text: string; rok: boolean };
export type Osa = { od: string; do: string; dnes: number; znacky: ZnackaOsy[]; radky: RadekOsy[] };
export type ZaznamOsy = {
  slug: string;
  pravidlo: { nazev: string; cesta: Cesta; udalosti: readonly { datum: string; krok?: Krok; nazev: string }[]; ucinnostOd?: string };
};

const kulate = (n: number) => Math.round(n * 100) / 100;

export function osaPravidel(zaznamy: readonly ZaznamOsy[], dnes: Date): Osa {
  const dnesIso = dnes.toISOString().slice(0, 10);
  const budouci = zaznamy.map(z => z.pravidlo.ucinnostOd).filter((d): d is string => !!d && d > dnesIso);
  const konec = [dnesIso, ...budouci].sort().at(-1)!;
  const od = rokCislo(OSA_OD), doCislo = rokCislo(konec) + OKRAJ;
  const x = (datum: string) => kulate(Math.min(100, Math.max(0, ((rokCislo(datum) - od) / (doCislo - od)) * 100)));

  const znacky: ZnackaOsy[] = [];
  for (let r = 2025, m = 12; rokCislo(`${r}-${String(m).padStart(2, '0')}-01`) <= doCislo; m === 12 ? (r++, m = 1) : m++) {
    const d = `${r}-${String(m).padStart(2, '0')}-01`;
    const prvni = znacky.length === 0;
    znacky.push({ x: x(d), text: prvni ? `${MESICE[m - 1]} ${r}` : m === 1 ? String(r) : MESICE[m - 1], rok: prvni || m === 1 });
  }

  const radky = zaznamy.map(({ slug, pravidlo: p }) => {
    const body: BodOsy[] = [];
    let pocetDrive = 0, prvniDrive = -1;
    p.udalosti.forEach((u, i) => {
      if (rokCislo(u.datum) < od) { pocetDrive++; if (prvniDrive < 0) prvniDrive = i; return; }
      const druh: DruhBodu = u.krok ? (UKONCUJICI.includes(u.krok) ? 'konec' : 'krok') : 'udalost';
      body.push({ x: x(u.datum), druh, datum: u.datum, popisek: `${datumText(u.datum)} · ${u.krok ? popisekKroku(u.krok) : u.nazev}`, popisekSkupiny: null, udalost: i, posun: 0 });
    });
    if (p.ucinnostOd && p.ucinnostOd > dnesIso)
      body.push({ x: x(p.ucinnostOd), druh: 'ucinnost', datum: p.ucinnostOd, popisek: `Účinnost od ${datumText(p.ucinnostOd)}`, popisekSkupiny: null, udalost: null, posun: 0 });
    // body ve stejný den: posun vedle sebe a společný popisek
    const podleDne = new Map<string, BodOsy[]>();
    for (const b of body) podleDne.set(b.datum, [...(podleDne.get(b.datum) ?? []), b]);
    for (const skupina of podleDne.values()) {
      if (skupina.length < 2) continue;
      const spolecny = skupina.map(b => b.popisek).join('; ');
      skupina.forEach((b, k) => { b.posun = k; b.popisekSkupiny = spolecny; });
    }
    const kroky = body.filter(b => b.druh === 'krok' || b.druh === 'konec');
    const ucinnost = body.find(b => b.druh === 'ucinnost');
    const posledniKrok = kroky.at(-1);
    return {
      slug, nazev: p.nazev, cesta: popisekCesty(p.cesta), body,
      cara: kroky.length >= 2 ? { od: kroky[0].x, do: posledniKrok!.x } : null,
      caraBudouci: ucinnost && posledniKrok ? { od: posledniKrok.x, do: ucinnost.x } : null,
      drive: pocetDrive ? { pocet: pocetDrive, udalost: prvniDrive } : null,
      razeni: body.find(b => b.udalost !== null)?.datum ?? '9999',
    };
  });
  radky.sort((a, b) => a.razeni.localeCompare(b.razeni) || a.nazev.localeCompare(b.nazev, 'cs'));
  return { od: OSA_OD, do: konec, dnes: x(dnesIso), znacky, radky: radky.map(({ razeni, ...r }) => r) };
}
```

Poznámka k testu řazení: řádek `a` má první kreslenou událost 2026-02-01 stejně jako `b`. Rozhodne název („Alfa“ < „Beta“).

- [ ] **Step 4: Spusť testy a ověř, že projdou**

Run: `npx vitest run tests/unit/osa-pravidel.test.ts`, pak `npx vitest run`.
Expected: PASS. Pokud test počtu značek (12) nesedí s tvou implementací kvůli hranici okraje, ověř ručně: od 1. 12. 2025 do 13. 11. 2026 + půl měsíce je 12 začátků měsíců (pro 2025 až lis 2026). Oprav kód, ne test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/osa-pravidel.ts tests/unit/osa-pravidel.test.ts
git commit -m "Časová osa pravidel: výpočet rozsahu, značek a bodů

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Osa v přehledu a přepínač

**Files:**
- Create: `src/components/OsaPravidel.astro`, `src/scripts/osa-pravidel.ts`, `tests/e2e/pravidla-osa.spec.ts`
- Modify: `src/components/PrehledPravidel.astro`, `src/styles/pravidla.css`, `tests/fixtures/obsah/pravidla/pozmenovaci-sigma.md`, `tests/e2e/pristupnost.spec.ts`

**Interfaces:**
- Consumes: `osaPravidel`, `type Osa` (Task 1). `nactiPravidla()` z `src/lib/kauzy.ts`.
- Produces:
  - DOM: `section.osa-pravidel[data-osa-pravidel]` (výchozí `hidden`), uvnitř `.op-plocha` (posouvá se), `.op-hlava` se značkami `.op-znacka` a `.op-dnes-popisek`, `ol.op-radky` s `li.op-radek[data-slug]`. Řádek má `a.op-nazev`, `.op-cas`, body `a.op-bod.krok|konec|udalost[data-udalost]`, `span.op-bod.ucinnost[tabindex=0][role=img]`, `a.op-drive[data-udalost]`, `.op-cara`, `.op-cara.budouci`, `.op-dnes`. Dále `.op-legenda`, `div.op-popisek[role=tooltip]` a `p.op-prazdno[hidden]` s `button[data-zrusit]`.
  - Přepínač `div.pr-pohled[role=group][aria-label="Zobrazení změn pravidel"]` (výchozí `hidden`) s `button[data-pohled="seznam"|"osa"][aria-pressed]`.
  - `document.body.dataset.pohledPravidel = 'seznam' | 'osa'`.
  - Klientský modul `src/scripts/osa-pravidel.ts`: `inicializujOsuPravidel(): void` a `aktualniPohled(): 'seznam' | 'osa'`.

- [ ] **Step 1: Testovací data**

Do `tests/fixtures/obsah/pravidla/pozmenovaci-sigma.md` přidej jako **první** událost (před stávající) a nový zdroj id 4:

```yaml
  - { id: 4, vydavatel: Fiktivní deník, titulek: Fiktivní poslanec chystá návrh, datum: 2025-11-20, druh: media, url: "https://example.com/sigma/clanek" }
```

```yaml
  - { datum: 2025-11-20, nazev: Návrh ohlášen v médiích, popis: Fiktivní deník napsal o chystaném návrhu., zdroje: [4] }
```

Spusť `npx vitest run` a oprav jen očekávání, která tím přirozeně změnila hodnotu (počty událostí nebo zdrojů sigmy), nic neoslabuj. Spusť i `npx playwright test tests/e2e/pravidla-detail.spec.ts` po `npm run build:e2e` a oprav stejně (například „Zdroje (3)“ → „Zdroje (4)“ u sigmy).

- [ ] **Step 2: Napiš padající e2e testy**

`tests/e2e/pravidla-osa.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { VELIKOSTI, overBezPosouvani } from './pomocne';

test.use({ viewport: { width: 1366, height: 768 } });

test('přepínač Seznam · Časová osa a adresa ?pohled=osa', async ({ page }) => {
  await page.goto('/pravidla/');
  const prepinac = page.getByRole('group', { name: 'Zobrazení změn pravidel' });
  await expect(prepinac.getByRole('button', { name: 'Seznam' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.osa-pravidel')).toBeHidden();
  await prepinac.getByRole('button', { name: 'Časová osa' }).click();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await expect(page.locator('.pravidla-obal')).toBeHidden();
  await prepinac.getByRole('button', { name: 'Seznam' }).click();
  await expect(page).toHaveURL(/\/pravidla\/$/);
  await expect(page.locator('.pravidla-obal')).toBeVisible();
});

test('přímá adresa ?pohled=osa otevře osu: řádky, body, dnes, legenda, dříve', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const osa = page.locator('.osa-pravidel');
  await expect(osa).toBeVisible();
  await expect(osa.locator('.op-radek')).toHaveCount(4);
  // řazení podle první kreslené události od 1. 12. 2025: Kappa 12. 1., Tau 1. 2., Sigma 2. 4., Omega 10. 6. 2026
  const slugy = await osa.locator('.op-radek').evaluateAll(r => r.map(e => (e as HTMLElement).dataset.slug));
  expect(slugy).toEqual(['usneseni-kappa', 'narizeni-tau', 'pozmenovaci-sigma', 'zakon-omega']);
  await expect(osa.locator('.op-dnes-popisek')).toHaveText('dnes');
  await expect(osa.locator('.op-legenda')).toContainText('krok projednávání');
  await expect(osa.locator('.op-legenda')).toContainText('ukončující krok');
  await expect(osa.locator('.op-legenda')).toContainText('ostatní událost');
  await expect(osa.locator('.op-legenda')).toContainText('budoucí účinnost');
  const sigma = osa.locator('.op-radek[data-slug="pozmenovaci-sigma"]');
  await expect(sigma.locator('.op-bod.konec')).toHaveCount(1);
  await expect(sigma.locator('.op-drive')).toHaveText('◀ dříve (1)');
  const omega = osa.locator('.op-radek[data-slug="zakon-omega"]');
  await expect(omega.locator('a.op-bod.krok')).toHaveCount(2);
  await expect(omega.locator('.op-cara:not(.budouci)')).toHaveCount(1);
});

test('fokus na bod ukáže popisek, který je celý v okně', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const body = page.locator('.op-radek a.op-bod');
  const n = await body.count();
  for (const i of [0, n - 1]) {
    await body.nth(i).focus();
    const popisek = page.locator('.op-popisek');
    await expect(popisek).toBeVisible();
    await expect(popisek).toHaveText(/\d{4} · /);
    const box = (await popisek.boundingBox())!;
    const okno = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(okno.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('.op-popisek')).toBeHidden();
});

test('body mají přístupný název s názvem pravidla a datem', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const bod = page.locator('.op-radek[data-slug="zakon-omega"] a.op-bod').first();
  await expect(bod).toHaveAttribute('aria-label', /^Testovací novela zákona Omega s dlouhým názvem pro mobil: \d+\. \d+\. 2026 · /);
});

test.describe('bez JavaScriptu', () => {
  test.use({ javaScriptEnabled: false });
  test('není přepínač ani osa, seznam je vidět', async ({ page }) => {
    await page.goto('/pravidla/?pohled=osa');
    await expect(page.locator('.pr-pohled')).toBeHidden();
    await expect(page.locator('.osa-pravidel')).toBeHidden();
    await expect(page.locator('.pravidla-obal')).toBeVisible();
  });
});

test.describe('mobil 390×700', () => {
  test.use({ viewport: { width: 390, height: 700 } });
  test('osa se posouvá do strany, názvy zůstávají vlevo a je vidět dnes', async ({ page }) => {
    await page.goto('/pravidla/?pohled=osa');
    const plocha = page.locator('.op-plocha');
    expect(await plocha.evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true);
    await expect(page.locator('.op-dnes').first()).toBeInViewport();
    const nazev = page.locator('.op-radek .op-nazev').first();
    expect(await nazev.evaluate(e => getComputedStyle(e).position)).toBe('sticky');
    await overBezPosouvani(page);
  });
});

for (const v of VELIKOSTI) {
  test(`${v.width}×${v.height}: osa se neposouvá dolů`, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto('/pravidla/?pohled=osa');
    await expect(page.locator('.osa-pravidel')).toBeVisible();
    await overBezPosouvani(page);
    if (v.width > 1000) expect(await page.locator('.op-plocha').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  });
}
```

V `tests/e2e/pristupnost.spec.ts` přidej do seznamu cest `'/pravidla/?pohled=osa'`. Pokud test prochází cesty bez čekání na skript, přidej pro tuto cestu `await expect(page.locator('.osa-pravidel')).toBeVisible()` podle struktury souboru.

- [ ] **Step 3: Sestav, ověř že testy padají**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-osa.spec.ts`
Expected: FAIL (přepínač ani osa neexistují).

- [ ] **Step 4: Komponenta osy**

`src/components/OsaPravidel.astro`:

```astro
---
import type { Osa } from '../lib/osa-pravidel';
interface Props { osa: Osa }
const { osa } = Astro.props;
const styl = (x: number, posun = 0) => `left:${x}%;--posun:${posun}`;
---
<!-- Bez JavaScriptu zůstává skrytá: seznam nese stejné informace (spec osy, oddíl 2). -->
<section class="osa-pravidel" data-osa-pravidel aria-label="Časová osa změn pravidel" hidden>
  <div class="op-plocha" tabindex="0" aria-label="Časová osa, posouvá se do strany">
    <div class="op-hlava" aria-hidden="true">
      <span class="op-roh"></span>
      <div class="op-mesice">
        {osa.znacky.map(z => <span class:list={['op-znacka', { rok: z.rok }]} style={`left:${z.x}%`}>{z.text}</span>)}
        <span class="op-dnes-popisek" style={`left:${osa.dnes}%`}>dnes</span>
      </div>
    </div>
    <ol class="op-radky">
      {osa.radky.map(r => (
        <li class="op-radek" data-slug={r.slug}>
          <a class="op-nazev" href={`/pravidla/${r.slug}/`} title={r.nazev} aria-haspopup="dialog"><strong>{r.nazev}</strong><small>{r.cesta}</small></a>
          <div class="op-cas">
            <span class="op-dnes" style={`left:${osa.dnes}%`} aria-hidden="true"></span>
            {r.cara && <span class="op-cara" style={`left:${r.cara.od}%;width:${r.cara.do - r.cara.od}%`} aria-hidden="true"></span>}
            {r.caraBudouci && <span class="op-cara budouci" style={`left:${r.caraBudouci.od}%;width:${r.caraBudouci.do - r.caraBudouci.od}%`} aria-hidden="true"></span>}
            {r.drive && <a class="op-drive" href={`/pravidla/${r.slug}/?udalost=${r.drive.udalost}`} data-udalost={r.drive.udalost} aria-label={`${r.nazev}: ${r.drive.pocet} starší události před prosincem 2025`}>◀ dříve ({r.drive.pocet})</a>}
            {r.body.map(b => b.udalost === null
              ? <span class:list={['op-bod', b.druh]} style={styl(b.x, b.posun)} tabindex="0" role="img" aria-label={`${r.nazev}: ${b.popisek}`} data-popisek={b.popisekSkupiny ?? b.popisek}></span>
              : <a class:list={['op-bod', b.druh]} style={styl(b.x, b.posun)} href={`/pravidla/${r.slug}/?udalost=${b.udalost}`} data-udalost={b.udalost} aria-label={`${r.nazev}: ${b.popisek}`} data-popisek={b.popisekSkupiny ?? b.popisek}></a>)}
          </div>
        </li>
      ))}
    </ol>
  </div>
  <p class="op-prazdno" hidden>Žádná změna pravidel neodpovídá filtru. <button type="button" data-zrusit>Zrušit filtry</button></p>
  <p class="op-legenda">
    <span><i class="op-bod krok" aria-hidden="true"></i> krok projednávání</span>
    <span><i class="op-bod konec" aria-hidden="true"></i> ukončující krok</span>
    <span><i class="op-bod udalost" aria-hidden="true"></i> ostatní událost</span>
    <span><i class="op-bod ucinnost" aria-hidden="true"></i> budoucí účinnost</span>
  </p>
  <div class="op-popisek" role="tooltip" hidden></div>
</section>
```

- [ ] **Step 5: Vložení do přehledu a přepínač**

V `src/components/PrehledPravidel.astro`:

1. Importy:

```astro
import OsaPravidel from './OsaPravidel.astro';
import { osaPravidel } from '../lib/osa-pravidel';
```

2. Ve frontmatteru: `const osa = osaPravidel(zaznamy, new Date());`
3. Do lišty filtrů (`.pr-filtry`) vlož těsně před `<span class="vpravo">` přepínač:

```astro
          <div class="pr-pohled" role="group" aria-label="Zobrazení změn pravidel" hidden>
            <button type="button" data-pohled="seznam" aria-pressed="true">Seznam</button>
            <button type="button" data-pohled="osa" aria-pressed="false">Časová osa</button>
          </div>
```

4. Hned za uzavírací `</div>` prvku `.pravidla-obal` vlož `{zaznamy.length > 0 && <OsaPravidel osa={osa} />}`.
5. Do inline `<script>` přidej import a volání (za `inicializujNavigaciPravidel();`):

```ts
  import { inicializujOsuPravidel } from '../scripts/osa-pravidel';
  inicializujOsuPravidel();
```

- [ ] **Step 6: Klientský skript osy**

`src/scripts/osa-pravidel.ts`:

```ts
/** Přepínání Seznam · Časová osa, popisky bodů a posun osy na „dnes“ (spec osy pravidel, oddíl 2, 5 a 6). */
export type Pohled = 'seznam' | 'osa';

export const aktualniPohled = (): Pohled => (document.body.dataset.pohledPravidel === 'osa' ? 'osa' : 'seznam');

export function inicializujOsuPravidel(): void {
  const osa = document.querySelector<HTMLElement>('[data-osa-pravidel]');
  const prepinac = document.querySelector<HTMLElement>('.pr-pohled');
  const seznam = document.querySelector<HTMLElement>('.pravidla-obal');
  if (!osa || !prepinac || !seznam) return;
  const plocha = osa.querySelector<HTMLElement>('.op-plocha')!;
  const popisek = osa.querySelector<HTMLElement>('.op-popisek')!;
  prepinac.hidden = false;

  const nastav = (p: Pohled, zapsat: boolean) => {
    document.body.dataset.pohledPravidel = p;
    osa.hidden = p !== 'osa';
    seznam.hidden = p === 'osa';
    prepinac.querySelectorAll<HTMLButtonElement>('[data-pohled]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pohled === p)));
    if (zapsat && location.pathname === '/pravidla/') history.replaceState(history.state, '', p === 'osa' ? '/pravidla/?pohled=osa' : '/pravidla/');
    if (p === 'osa') requestAnimationFrame(posunNaDnes);
    document.dispatchEvent(new CustomEvent('nv:pohled-pravidel', { detail: p }));
  };
  const posunNaDnes = () => {
    if (plocha.scrollWidth <= plocha.clientWidth) return;
    const dnes = osa.querySelector<HTMLElement>('.op-radek .op-dnes, .op-hlava .op-dnes-popisek');
    if (!dnes) return;
    const r = dnes.getBoundingClientRect(), p = plocha.getBoundingClientRect();
    plocha.scrollLeft += r.left - p.left - plocha.clientWidth / 2;
  };

  prepinac.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pohled]');
    if (b) nastav(b.dataset.pohled as Pohled, true);
  });
  nastav(new URLSearchParams(location.search).get('pohled') === 'osa' ? 'osa' : 'seznam', false);

  // popisek bodu: jeden prvek s position: fixed, aby ho neořízla posouvaná plocha
  const ukazPopisek = (el: HTMLElement) => {
    const text = el.dataset.popisek;
    if (!text) return;
    popisek.textContent = text;
    popisek.hidden = false;
    const r = el.getBoundingClientRect(), w = popisek.offsetWidth, h = popisek.offsetHeight;
    const left = Math.min(Math.max(4, r.left + r.width / 2 - w / 2), innerWidth - w - 4);
    const top = r.top - h - 6 >= 4 ? r.top - h - 6 : r.bottom + 6;
    popisek.style.left = `${left}px`;
    popisek.style.top = `${top}px`;
  };
  const skryjPopisek = () => { popisek.hidden = true; };
  const bod = (t: EventTarget | null) => (t as HTMLElement | null)?.closest<HTMLElement>('.op-bod[data-popisek]') ?? null;
  osa.addEventListener('pointerover', e => { const b = bod(e.target); if (b) ukazPopisek(b); });
  osa.addEventListener('pointerout', e => { if (bod(e.target)) skryjPopisek(); });
  osa.addEventListener('focusin', e => { const b = bod(e.target); if (b) ukazPopisek(b); else skryjPopisek(); });
  osa.addEventListener('focusout', skryjPopisek);
  osa.addEventListener('keydown', e => { if (e.key === 'Escape') skryjPopisek(); });
  plocha.addEventListener('scroll', skryjPopisek, { passive: true });
}
```

- [ ] **Step 7: Styly**

Na konec `src/styles/pravidla.css` přidej (hodnoty uprav jen tehdy, když to vyžadují testy bez posouvání):

```css
/* Přepínač Seznam · Časová osa (stejný vzhled jako přepínač Osa · Mapa na hlavní stránce) */
.pr-pohled { display: inline-flex; border: 1px solid var(--linka); flex: none; }
.pr-pohled button { font: 500 12px var(--f-text); border: 0; background: var(--plocha); color: var(--inkoust); padding: 2px 9px; cursor: pointer; }
.pr-pohled button[aria-pressed="true"] { background: var(--modra); color: #fff; }

/* Časová osa: zabírá stejné místo jako seznam, posouvá se jen uvnitř */
.osa-pravidel { flex: 1; min-height: 0; display: flex; flex-direction: column; margin-top: 12px; background: var(--plocha); border: 1px solid var(--linka); }
.osa-pravidel[hidden] { display: none; }
.op-plocha { flex: 1; min-height: 0; overflow: auto; --nazvy: 240px; }
.op-hlava, .op-radek { display: grid; grid-template-columns: var(--nazvy) 1fr; }
.op-hlava { position: sticky; top: 0; z-index: 2; background: var(--plocha); border-bottom: 1px solid var(--linka); height: 22px; }
.op-roh { position: sticky; left: 0; background: var(--plocha); z-index: 1; }
.op-mesice, .op-cas { position: relative; margin: 0 14px; }
.op-znacka { position: absolute; top: 3px; transform: translateX(-1px); font: 11px var(--f-mono); color: var(--meta); white-space: nowrap; border-left: 1px solid var(--linka); padding-left: 3px; }
.op-znacka.rok { color: var(--inkoust); border-left-color: var(--inkoust); }
.op-dnes-popisek { position: absolute; top: 3px; transform: translateX(-50%); font: 600 11px var(--f-mono); color: var(--modra); background: var(--plocha); padding: 0 3px; }
.op-radky { list-style: none; margin: 0; padding: 0; }
.op-radek { min-height: 40px; border-bottom: 1px solid var(--linka); }
.op-radek[hidden] { display: none; }
.op-nazev { position: sticky; left: 0; z-index: 1; background: var(--plocha); display: flex; flex-direction: column; justify-content: center; padding: 4px 10px; min-width: 0; color: inherit; text-decoration: none; border-right: 1px solid var(--linka); }
.op-nazev strong { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.op-nazev small { font: 11px var(--f-mono); color: var(--meta); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.op-dnes { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px dashed var(--modra); }
.op-cara { position: absolute; top: 50%; height: 2px; background: var(--inkoust); transform: translateY(-1px); }
.op-cara.budouci { background: none; border-top: 2px dashed var(--meta); height: 0; }
.op-bod { position: absolute; top: 50%; width: 12px; height: 12px; transform: translate(calc(-50% + var(--posun, 0) * 9px), -50%); box-sizing: border-box; }
.op-bod.krok { border-radius: 50%; background: var(--inkoust); }
.op-bod.konec { background: var(--inkoust); }
.op-bod.udalost { width: 9px; height: 9px; border-radius: 50%; border: 2px solid var(--meta); background: var(--plocha); }
.op-bod.ucinnost { border: 2px dashed var(--inkoust); background: var(--plocha); transform: translate(-50%, -50%) rotate(45deg); }
.op-bod:focus-visible { outline: 3px solid var(--modra); outline-offset: 2px; }
.op-drive { position: absolute; left: 0; top: 50%; transform: translateY(-50%); font: 11px var(--f-mono); color: var(--meta); white-space: nowrap; }
.op-legenda { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0; padding: 6px 10px; font-size: 12px; color: var(--meta); border-top: 1px solid var(--linka); }
.op-legenda .op-bod { position: static; display: inline-block; vertical-align: middle; transform: none; }
.op-legenda .op-bod.ucinnost { transform: rotate(45deg); }
.op-prazdno { margin: 12px; }
.op-popisek { position: fixed; z-index: 20; max-width: min(360px, calc(100vw - 8px)); padding: 4px 8px; font-size: 12px; background: var(--inkoust); color: #fff; pointer-events: none; }
@media (max-width: 760px) {
  .op-plocha { --nazvy: 120px; }
  .op-radky, .op-hlava { min-width: 760px; }
  .op-nazev small { display: none; }
}
```

Před použitím ověř, že proměnné `--plocha`, `--linka`, `--inkoust`, `--modra`, `--meta`, `--f-mono`, `--f-text` existují v `src/styles/hlavni.css`. Pokud se některá jmenuje jinak, použij existující.

- [ ] **Step 8: Sestav a spusť testy**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-osa.spec.ts tests/e2e/pravidla-prehled.spec.ts tests/e2e/pristupnost.spec.ts tests/e2e/bez-posouvani.spec.ts`
Expected: PASS. Pokud se data fixtures liší od komentáře v testu řazení (například je mezitím změnila jiná relace), oprav očekávané pořadí podle skutečných dat první kreslené události, ne kód.

- [ ] **Step 9: Commit**

```bash
git add src/components/OsaPravidel.astro src/scripts/osa-pravidel.ts src/components/PrehledPravidel.astro src/styles/pravidla.css tests/e2e/pravidla-osa.spec.ts tests/e2e/pristupnost.spec.ts tests/fixtures/obsah/pravidla/pozmenovaci-sigma.md
git add -u tests
git commit -m "Časová osa pravidel: zobrazení v přehledu, přepínač a popisky bodů

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Klik na bod otevře událost v detailu

**Files:**
- Modify: `src/scripts/detail.ts`, `src/scripts/navigace-pravidel.ts`, `src/scripts/osa-pravidel.ts`
- Test: `tests/e2e/pravidla-osa.spec.ts`

**Interfaces:**
- Consumes: `aktualniPohled()` (Task 2), DOM osy (Task 2).
- Produces:
  - `ukazUdalost(dlg: HTMLDialogElement, i: number): boolean` v `src/scripts/detail.ts`. Přepne na Průběh a ukáže událost i. Vrací `false` a nic nedělá pro neplatný index.
  - `otevriPravidlo(slug, { pridatDoHistorie?, udalost? })` v `navigace-pravidel.ts`. S `udalost` zapíše adresu `/pravidla/<slug>/?udalost=<i>` a stav `{ slug, udalost }`.

- [ ] **Step 1: Napiš padající testy**

Připiš do `tests/e2e/pravidla-osa.spec.ts`:

```ts
test('klik na bod otevře Průběh na dané události, zavření vrátí osu a fokus', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.evaluate(() => { (window as any).bezNacteni = true; });
  const bod = page.locator('.op-radek[data-slug="zakon-omega"] a.op-bod.krok').nth(1);
  const index = await bod.getAttribute('data-udalost');
  await bod.click();
  await expect(page).toHaveURL(new RegExp(`/pravidla/zakon-omega/\\?udalost=${index}$`));
  await expect(page.locator('dialog#detail')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Průběh' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`.udalosti-seznam > li[data-i="${index}"]`)).toBeVisible();
  expect(await page.evaluate(() => (window as any).bezNacteni)).toBe(true);
  await page.getByRole('button', { name: 'Zavřít detail' }).click();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('.osa-pravidel')).toBeVisible();
  await expect(page.locator('.op-radek[data-slug="zakon-omega"] .op-nazev')).toBeFocused();
});

test('přímá adresa ?udalost= otevře detail na události', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/?udalost=1');
  await expect(page.getByRole('tab', { name: 'Průběh' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.udalosti-seznam > li[data-i="1"]')).toBeVisible();
});

test('neplatné ?udalost= otevře detail normálně a bez chyby', async ({ page }) => {
  const chyby: string[] = [];
  page.on('pageerror', e => chyby.push(e.message));
  for (const u of ['-1', '99', 'abc']) {
    await page.goto(`/pravidla/zakon-omega/?udalost=${u}`);
    await expect(page.locator('dialog#detail')).toBeVisible();
    await expect(page.getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
  }
  expect(chyby).toEqual([]);
});

test('značka „dříve“ otevře první starší událost', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.locator('.op-radek[data-slug="pozmenovaci-sigma"] .op-drive').click();
  await expect(page).toHaveURL(/\/pravidla\/pozmenovaci-sigma\/\?udalost=0$/);
  await expect(page.locator('.udalosti-seznam > li[data-i="0"]')).toBeVisible();
});

test('klik na název řádku osy otevře detail', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.locator('.op-radek[data-slug="narizeni-tau"] .op-nazev').click();
  await expect(page).toHaveURL(/\/pravidla\/narizeni-tau\/$/);
  await expect(page.locator('dialog#detail h2')).toHaveText('Testovací nařízení Tau');
});

test('zpět v prohlížeči po otevření z osy vrátí osu', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  await page.locator('.op-radek[data-slug="zakon-omega"] a.op-bod').first().click();
  await expect(page.locator('dialog#detail')).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog#detail')).toBeHidden();
  await expect(page).toHaveURL(/\/pravidla\/\?pohled=osa$/);
  await expect(page.locator('.osa-pravidel')).toBeVisible();
});
```

- [ ] **Step 2: Sestav a ověř, že testy padají**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-osa.spec.ts`
Expected: FAIL. Klik na bod načte celou stránku a `?udalost=` se ignoruje.

- [ ] **Step 3: `ukazUdalost` v detailu**

V `src/scripts/detail.ts` přidej nad `export function inicializujDetail`:

```ts
/** Zobrazení události zvenku (osa pravidel, adresa ?udalost=): inicializujDetail sem uloží funkci pro aktuální obsah. */
const ukazovace = new WeakMap<HTMLDialogElement, (i: number) => boolean>();
export function ukazUdalost(dlg: HTMLDialogElement, i: number): boolean {
  return ukazovace.get(dlg)?.(i) ?? false;
}
```

Na konec `inicializujDetail` (za `ukaz(akt, false);`) přidej:

```ts
  ukazovace.set(dlg, (i: number) => {
    if (!Number.isInteger(i) || i < 0 || i >= polozky.length) return false;
    prepni('chrono');
    ukaz(i, false);
    return true;
  });
```

- [ ] **Step 4: Navigace**

V `src/scripts/navigace-pravidel.ts` (napoj na aktuální podobu souboru):

1. Importy:

```ts
import { inicializujDetail, ukazUdalost } from './detail';
import { aktualniPohled } from './osa-pravidel';
```

2. Pomocná funkce pro čtení indexu z adresy:

```ts
const udalostZAdresy = (): number | undefined => {
  const u = new URLSearchParams(location.search).get('udalost');
  return u !== null && /^\d+$/.test(u) ? Number(u) : undefined;
};
```

3. Signatura a konec `otevriPravidlo`:

```ts
export async function otevriPravidlo(slug: string, { pridatDoHistorie = true, udalost }: { pridatDoHistorie?: boolean; udalost?: number } = {}): Promise<void> {
```

Na konci funkce nahraď zápis historie a otevření:

```ts
  vyber(slug);
  const naUdalosti = udalost !== undefined && ukazUdalost(dlg, udalost);
  if (pridatDoHistorie) history.pushState({ slug, ...(naUdalosti ? { udalost } : {}) }, '', `/pravidla/${slug}/${naUdalosti ? `?udalost=${udalost}` : ''}`);
  if (!dlg.open) dlg.showModal();
```

4. V `inicializujNavigaciPravidel` ve větvi `if (otevrena)` za `inicializujDetail(dlg);` přidej:

```ts
    const u = udalostZAdresy();
    if (u !== undefined) ukazUdalost(dlg, u);
```

5. V obsluze `close` nahraď návrat adresy a fokus:

```ts
    const naOse = aktualniPohled() === 'osa';
    // na ose se fokus vrací vždy na název řádku (bod mohl zmizet pod popiskem), v seznamu jen když fokus nikde není
    if (slug && (naOse || document.activeElement === document.body || !document.activeElement)) {
      const cil = naOse
        ? `.op-radek[data-slug="${CSS.escape(slug)}"]:not([hidden]) .op-nazev`
        : `.pr-radek[data-slug="${CSS.escape(slug)}"]:not([hidden]) a.pr-btn`;
      document.querySelector<HTMLElement>(cil)?.focus();
    }
    const zpet = naOse ? '/pravidla/?pohled=osa' : '/pravidla/';
    if (!zaviramZHistorie && location.pathname + location.search !== zpet) history.pushState({}, '', zpet);
```

(Zachovej zbytek obsluhy: `document.title`, `delete document.body.dataset.otevrena`, `zaviramZHistorie = false`, `vyber(null)`.)

6. V `popstate`:

```ts
    const stav = e.state as { slug?: string; udalost?: number } | null;
    if (stav?.slug) { otevriPravidlo(stav.slug, { pridatDoHistorie: false, udalost: stav.udalost }); return; }
```

- [ ] **Step 5: Klik v ose**

Na konec `inicializujOsuPravidel` v `src/scripts/osa-pravidel.ts` přidej. Import `otevriPravidlo` dej nahoru, cyklický import s `navigace-pravidel.ts` je v pořádku, obě strany volají funkce až za běhu.

```ts
  osa.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.op-bod, a.op-drive, a.op-nazev');
    const me = e as MouseEvent;
    if (!a || me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
    e.preventDefault();
    skryjPopisek();
    const slug = a.closest<HTMLElement>('.op-radek')!.dataset.slug!;
    const u = a.dataset.udalost;
    otevriPravidlo(slug, u !== undefined ? { udalost: Number(u) } : {});
  });
```

```ts
import { otevriPravidlo } from './navigace-pravidel';
```

Zpět v prohlížeči: po `pushState` detailu vede „Zpět“ na stav osy. Protože `nastav()` používá `replaceState`, stav osy v historii je `/pravidla/?pohled=osa`. `popstate` bez `slug` zavře dialog a adresa zůstane `?pohled=osa`. Ověř to testem „zpět v prohlížeči…“.

- [ ] **Step 6: Sestav a spusť testy**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-osa.spec.ts tests/e2e/pravidla-detail.spec.ts tests/e2e/pravidla-prehled.spec.ts`
Expected: PASS (včetně stávajících testů zavření detailu ze seznamu).

- [ ] **Step 7: Commit**

```bash
git add src/scripts/detail.ts src/scripts/navigace-pravidel.ts src/scripts/osa-pravidel.ts tests/e2e/pravidla-osa.spec.ts
git commit -m "Časová osa pravidel: klik na bod otevře událost v detailu (?udalost=)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Filtry platí i pro osu

**Files:**
- Modify: `src/scripts/pravidla-filtr.ts`
- Test: `tests/e2e/pravidla-osa.spec.ts`

**Interfaces:**
- Consumes: DOM osy `.op-radek[data-slug]`, `.op-prazdno`, `.op-prazdno [data-zrusit]` (Task 2). Událost `nv:pohled-pravidel` (Task 2).
- Produces: řádky osy mají `hidden` podle filtru. `.op-prazdno` je viditelný, když filtru nic neodpovídá.

- [ ] **Step 1: Napiš padající testy**

```ts
test('filtry skrývají řádky osy, počítadlo a prázdný stav platí i pro osu', async ({ page }) => {
  await page.goto('/pravidla/?pohled=osa');
  const radky = page.locator('.op-radek:not([hidden])');
  await expect(radky).toHaveCount(4);
  await page.getByRole('searchbox', { name: 'Hledat ve změnách pravidel' }).fill('lhutu k vymahani');
  await expect(radky).toHaveCount(1);
  await expect(radky.first()).toHaveAttribute('data-slug', 'zakon-omega');
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 1 z 4');
  await page.getByRole('searchbox', { name: 'Hledat ve změnách pravidel' }).fill('nic takoveho neexistuje');
  await expect(page.locator('.op-prazdno')).toBeVisible();
  await page.locator('.op-prazdno [data-zrusit]').click();
  await expect(radky).toHaveCount(4);
  await expect(page.locator('.op-prazdno')).toBeHidden();
});

test('Seznam → Osa → Seznam zachová filtr i počítadlo', async ({ page }) => {
  await page.goto('/pravidla/');
  await page.locator('.pr-filtry [data-stitek="soudy"]').click();
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 1 z 4');
  await page.getByRole('button', { name: 'Časová osa' }).click();
  await expect(page.locator('.op-radek:not([hidden])')).toHaveCount(1);
  await page.getByRole('button', { name: 'Seznam' }).click();
  await expect(page.locator('.pr-radek:not([hidden])')).toHaveCount(1);
  await expect(page.locator('.pr-filtry .pocet')).toHaveText('Zobrazeno 1 z 4');
});
```

Pokud stránkování seznamu skrývá řádky jinak než atributem `hidden` (například třídou), uprav selektor `.pr-radek:not([hidden])` podle aktuálního `pravidla-filtr.ts` tak, aby počítal viditelné řádky.

- [ ] **Step 2: Ověř, že testy padají**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-osa.spec.ts -g "filtr|Seznam → Osa"`
Expected: FAIL. Řádky osy filtr neskrývá.

- [ ] **Step 3: Implementuj**

V `src/scripts/pravidla-filtr.ts` (aktuální podoba může obsahovat stránkování od jiné relace, napoj se na funkci, která aplikuje výsledek filtru na řádky):

1. Na začátku inicializace:

```ts
  const radkyOsy = new Map([...document.querySelectorAll<HTMLElement>('.op-radek')].map(r => [r.dataset.slug!, r]));
  const prazdnoOsy = document.querySelector<HTMLElement>('.op-prazdno');
```

2. V místě, kde se pro každou položku počítá shoda (`odpovidaPravidlo`), nastav i řádek osy: `const ro = radkyOsy.get(p.slug); if (ro) ro.hidden = !ok;`. Po smyčce: `if (prazdnoOsy) prazdnoOsy.hidden = n > 0;`. Stránkování se na osu nevztahuje, osa bere jen výsledek filtru.
3. Tlačítko v prázdném stavu osy volá stejné vyčištění filtrů jako `.prazdno [data-zrusit]`: `prazdnoOsy?.querySelector('[data-zrusit]')?.addEventListener('click', vycisti);`.
4. Pokud stránkování přepočítává stránky podle výšky seznamu, při návratu na seznam ho přepočítej: `document.addEventListener('nv:pohled-pravidel', e => { if ((e as CustomEvent).detail === 'seznam') <funkce přepočtu stránkování>(); });`. Použij funkci, kterou soubor pro přepočet skutečně má. Pokud žádnou nemá, krok vynech.

- [ ] **Step 4: Spusť testy**

Run: `npm run build:e2e`, pak `npx playwright test tests/e2e/pravidla-osa.spec.ts tests/e2e/pravidla-prehled.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/pravidla-filtr.ts tests/e2e/pravidla-osa.spec.ts
git commit -m "Časová osa pravidel: filtry a prázdný stav platí i pro osu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Celková kontrola

**Files:** žádné nové, jen opravy.

- [ ] **Step 1:** `npx vitest run`, výsledek PASS.
- [ ] **Step 2:** `npm run build:e2e` a celé `npx playwright test`, výsledek PASS.
- [ ] **Step 3:** `npx tsx _koncepty/nastroje/over-pravidla.ts`, výsledek „34 kauz, 7 pravidel platných“ (nebo aktuální počet) bez řádku CHYBA.
- [ ] **Step 4:** `git grep -n -i -E "ohýbá|oslaben|ušité|\bušit|na míru|agrobaron" -- src`. Žádný výsledek, kromě „Zrušit“ jako falešné shody.
- [ ] **Step 5:** Náhled konceptů: `npx cross-env NV_OBSAH=_koncepty/obsah NV_KONCEPTY=ano NV_VYSTUP=dist-koncepty astro build`. Build projde a `dist-koncepty/pravidla/index.html` obsahuje `data-osa-pravidel`. Běžící náhled na 4410 nezastavuj, servíruje složku a nová data se ukážou po obnovení stránky.
- [ ] **Step 6:** Commit oprav, jen pokud nějaké byly (`Časová osa pravidel: opravy po celkové kontrole`).
