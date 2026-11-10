# Mapa souvislostí: specifikace

*Druhý pohled na kauzy: kdo a co je spojuje s A. Babišem a jak na sebe kauzy navazují.*
Stav: schválený design (brainstorming 10. 11. 2026). Navazuje na `2026-11-10-nenechme-vyhnit-design.md`, jehož pravidla (metodika, vizuální systém, žádné svislé posouvání, přístupnost) platí beze změny.

## 1. Účel a úspěch

**Podnět:** při rešerši se ukázalo, že řada kauz má společné aktéry (Agrofert, Penam, svěřenské fondy…) nebo na sebe přímo navazuje (audit EK → vymáhání dotací).
**Účel:** ukázat tyto spojitosti přehledně, doloženě a neutrálně. Inspirací je vyšetřovatelská nástěnka, mapa ale tak nesmí působit: žádné „provázky“, žádné zdůrazňování, žádný dojem odhalování.

Mapa je úspěšná, když:
- u každé čáry je jasné, **čím** věci souvisejí (role), **odkdy dokdy** (období) a **podle čeho** (zdroj),
- návštěvník z mapy otevře detail kauzy jedním kliknutím a z detailu se jedním kliknutím dostane na mapu,
- mapa i mobilní strom jsou ovladatelné klávesnicí a čtečkou obrazovky (WCAG 2.1 AA).

## 2. Druhy vazeb

1. **Vztah aktéra:** nadřazený (Babiš nebo jiný aktér) → aktér, např. Babiš → Agrofert, Agrofert → Penam. Má roli, období a zdroj. Vztahů může mít aktér víc, protože se v čase mění.
2. **Aktér v kauze:** aktér → kauza, např. Penam → Toastová linka. Má roli, větu popisu a zdroj.
3. **Návaznost:** kauza → kauza, např. Vymáhání zemědělských dotací → Audit EK. Má roli, větu popisu a zdroj.

Kauza bez aktérů (např. Svazky StB) visí přímo pod Babišem, bez role.

## 3. Datový model

### Slovník aktérů

`obsah/akteri.yml`, pro náhled konceptů `_koncepty/obsah/akteri.yml` (stejně jako `stitky.yml`). Klíč je id aktéra ve tvaru `^[a-z0-9-]+$`. Id `babis` je rezervované pro střed mapy a ve slovníku není.

Ukázka (hodnoty „…“ jsou zkrácené, nejde o ověřená data):

```yaml
penam:
  nazev: Penam
  druh: firma                    # firma | osoba | nastroj
  overeno: 2026-11-20            # povinné ve veřejném buildu, v konceptech smí být null
  vztahy:                        # aspoň jeden
    - nadrazeny: agrofert        # babis nebo id jiného aktéra
      role: vlastni
      od: 2004                   # rok
      do: 2019                   # rok nebo null = dosud
      popis: Agrofert koupil Penam v roce 2004, v roce 2019 Penam vstoupil do skupiny United Bakeries.
      zdroje:                    # aspoň jeden, stejný tvar jako zdroj kauzy, bez id
        - vydavatel: ÚOHS
          titulek: …
          datum: 2006-…
          druh: primarni
          url: https://…
```

### Nová nepovinná pole kauzy

```yaml
akteri:
  - id: penam
    role: prijemce-dotace
    popis: Penam, firma koncernu Agrofert od roku 2004, žádal o dotaci na toastovou linku.
    zdroje: [2, 7]               # id zdrojů téže kauzy
navazuje:
  - kauza: stret-zajmu-audit-ek  # slug
    role: vychazi-z
    popis: Vymáhání dotací vychází ze závěrů auditu Evropské komise z roku 2019.
    zdroje: [5]
```

Obě pole mají výchozí hodnotu `[]`. `popis` je jedna věta, nejvýš 200 znaků, a řídí se pravidly jazyka z metodiky.

### Slovník rolí

`src/lib/role.ts`, stejně jako `stavy.ts`: výčty a lidské popisky sdílené s webem a Metodikou.

| Druh vazby | Role (popisek) |
|---|---|
| Vztah aktéra | `vlastni` (vlastní), `zalozil` (založil), `clen-rodiny` (člen rodiny), `pracovni-vztah` (pracovní vztah) |
| Aktér v kauze | `prijemce-dotace` (příjemce dotace), `dodavatel-zakazky` (dodavatel zakázky), `ucastnik-rizeni` (účastník řízení), `predmet-kauzy` (předmět kauzy) |
| Návaznost | `vychazi-z` (vychází z), `souvisejici-rizeni` (související řízení), `tataz-vec` (táž věc) |

Nová role se přidává jen do slovníku a vyžaduje lidský popisek.

### Kdo smí být aktérem

- Firmy a nástroje (svěřenské fondy) ovládané A. Babišem nebo jeho firmami, v období, kdy je ovládali.
- Osoby, jen pokud jsou veřejně činné, nebo už jsou jmenované ve zveřejněných kauzách v souvislosti s řízením.
- Instituce (EK, EPPO, SZIF, soudy) v této verzi aktéry nejsou. Ve stromu pod Babišem by vypadaly jako jeho vlastnictví.

## 4. Validace

Build selže, když:
- aktér nemá `nazev`, platný `druh` nebo aspoň jeden vztah,
- vztah, aktér v kauze nebo návaznost nemá zdroj, nebo role není ze slovníku pro daný druh vazby,
- vztah odkazuje na neexistujícího nadřazeného, `do < od`, nebo vztahy tvoří kruh či z aktéra nevede cesta k `babis`,
- kauza odkazuje na neexistujícího aktéra, na zdroj s neexistujícím `id`, nebo navazuje sama na sebe,
- návaznost odkazuje na slug, který neexistuje ani mezi koncepty,
- ve veřejném buildu má aktér `overeno` prázdné.

Ve veřejném buildu se návaznost na kauzu, která existuje jen v konceptech, **vynechá** a build vypíše varování. Ověřená kauza tak nečeká na neověřenou. Totéž platí pro aktéra, který je zatím jen v `_koncepty/obsah/akteri.yml`: vazba na něj se ve veřejném buildu nezobrazí a build upozorní. Do `obsah/akteri.yml` se aktér přesouvá až s vyplněným `overeno`.

## 5. Mapa na počítači

### Přepínač a adresa
- Přepínač „Osa | Mapa“ v záhlaví nad osou, vedle počítadla. Mapa se zobrazí na místě osy.
- Pohled je v adrese: `/?pohled=mapa`. Detail otevřený z mapy má `/kauzy/<slug>/?pohled=mapa` a po zavření se vrátí na mapu.
- `/?pohled=mapa&vyber=<slug>` otevře mapu se zvýrazněnou cestou dané kauzy.
- Přepínač se ve veřejném buildu zobrazí, až v něm bude aspoň jeden ověřený aktér. V náhledu konceptů je vidět vždy.

### Rozložení (vrstvy zleva doprava)
- Sloupce: Babiš → aktéři podle hloubky ve stromu (tolik sloupců, kolik je úrovní) → kauzy.
- Aktér s více vztahy stojí ve sloupci podle své nejhlubší cesty k Babišovi a vede k němu víc čar.
- Kauzy jsou seskupené podle prvního aktéra (kauzy bez aktéra tvoří vlastní skupinu pod Babišem) a ve skupině seřazené podle `od`.
- Kauza s více aktéry je na mapě jednou a vede k ní víc čar.
- Když se mapa nevejde, posouvá se uvnitř své plochy jako celek. Stránka se svisle neposouvá.
- Pozadí mapy je stejně poloprůhledné jako u osy a portrét zůstává vzadu.

### Vzhled
- Jen barvy z palety webu. Červená se nepoužívá.
- Čáry jsou tenké a stejně silné. Tloušťka čar ani velikost uzlů nevyjadřují počet kauz.
- Vztahy a aktéři v kauze jsou plné čáry, návaznosti čárkované oblouky mezi kauzami.
- V klidu jsou vidět jen názvy uzlů. Role a období se zobrazí u zvýrazněné cesty.

### Ovládání
- Najetí myší nebo fokus na uzel zvýrazní jeho cestu k Babišovi a navazující kauzy, ostatní se ztlumí.
- Klik na kauzu otevře detail (stávající navigace přes History API).
- Klik na aktéra nebo čáru otevře panel s rolí, obdobím, větou popisu a odkazy na zdroje. Esc ho zavře.
- Filtry (hledání, štítky, jen neuzavřené) platí i pro mapu. Kauzy mimo filtr zmizí a s nimi aktéři, kterým nezbude žádná kauza. Počítadlo se chová stejně jako u osy.
- Přechod Osa ↔ Mapa přes View Transitions. Při `prefers-reduced-motion` bez animace.

## 6. Strom: mobil a přístupnost

Základem mapy je strom z vnořených `<ul>`. Je jedinou ovládací vrstvou pro obě podoby:
- **Mobil** (stejná hranice jako u zúžené osy): strom je vidět místo SVG.
- **Počítač:** strom je vizuálně skrytý, ale čtečky obrazovky čtou jeho obsah a klávesnice se pohybuje po něm. SVG má `aria-hidden="true"`. Fokus na položce stromu zvýrazní odpovídající uzel v SVG (viditelný fokus) a klik na uzel v SVG spustí akci položky stromu.

Chování stromu:
- Babiš nahoře, přímí aktéři rozbalení, hlubší úrovně sbalené. Rozbalení přes tlačítko s `aria-expanded`.
- Každý řádek aktéra má malým písmem roli a období („vlastní · 2004–2019“). Tlačítko ⓘ rozbalí pod řádkem větu popisu a odkazy na zdroje.
- Řádek kauzy: název, roky (`od–do`) a případně „navazuje na: <název>“ jako odkaz. Aktivace řádku otevře detail.
- Filtry strom prořezávají stejně jako mapu.

## 7. Detail kauzy

V záložce **Souvislosti** přibude blok **Aktéři a návaznosti** (jen když má kauza aspoň jednu vazbu):
- aktéři: název, role, věta popisu a značky zdrojů,
- *Navazuje na:* kauza (role), věta, značky zdrojů,
- *Navazují na ni:* kauzy, které na tuto odkazují (dopočítané při buildu, bez vlastní věty),
- odkaz **Ukázat na mapě** → `/?pohled=mapa&vyber=<slug>`.

Klik na kauzu přejde do jejího detailu stávající navigací. Značky zdrojů fungují jako v textu Souvislostí: přepnou na záložku Zdroje a zdroj zvýrazní.

## 8. Architektura

- `src/lib/role.ts`: výčty rolí a popisky.
- `src/lib/schema.ts`: schéma aktéra a nová pole kauzy (verze pro veřejný build i koncepty).
- `src/lib/validace.ts`: kontroly napříč soubory (existence aktérů a kauz, kruhy, cesta k Babišovi, vynechání neověřených vazeb).
- `src/lib/kauzy.ts`: načtení `akteri.yml` vedle `stitky.yml`.
- `src/lib/mapa.ts`: čistá funkce `(kauzy, aktéři) → { sloupce, uzly, cesty, strom, navazujiNaNi }`. Bez DOM, testuje se ve Vitestu.
- `src/components/Mapa.astro`: SVG a strom z výsledku `mapa.ts`.
- `src/components/Detail.astro`: blok Aktéři a návaznosti.
- `src/scripts/mapa.ts`: přepínač, zvýraznění, panel, rozbalování stromu, napojení na filtry a navigaci. Bez knihovny pro grafy.
- Úpravy `filtry.ts` a `navigace.ts` pro parametr `pohled` a `vyber`.

## 9. Obsah a metodika

- Do 20 současných konceptů se doplní `akteri` a `navazuje` a vznikne `_koncepty/obsah/akteri.yml`. Zdroje se berou jen z konceptů samotných, případně z obchodního rejstříku. Vše zůstává neověřené (`overeno: null`).
- Brief pro rešeršní agenty se rozšíří o vyplňování vazeb, aby je další dávky měly rovnou.
- Stránka Metodika dostane oddíl **Vazby mezi kauzami**: co je vazba, že každá má zdroj a období, kdo smí být aktérem a že vazba sama o sobě neznamená vinu ani spoluodpovědnost.
- Kontrolní seznam před spuštěním mapy: každá osoba-aktér splňuje pravidlo z oddílu 3.

## 10. Testování

**Vitest:**
- vzorový správný aktér i kauza s vazbami projdou, ke každému pravidlu z oddílu 4 existuje chybná vzorová data, která selžou,
- vynechání návaznosti na neověřenou kauzu ve veřejném režimu,
- `mapa.ts`: sloupce podle hloubky, aktér s více vztahy, kauza bez aktérů pod Babišem, seskupení a řazení kauz, prořezání aktérů filtrem, dopočet „navazují na ni“.

**Playwright:**
- přepínač, adresa `?pohled=mapa` a návrat z detailu na mapu,
- zvýraznění cesty, panel vazby se zdroji, zavření Esc,
- filtry na mapě a „Ukázat na mapě“ z detailu,
- mobilní strom: rozbalení, ⓘ, otevření kauzy,
- ovládání klávesnicí a viditelný fokus v SVG,
- žádné svislé posouvání s mapou na velikostech z hlavní specifikace (1256×528, 1342×565, 1342×676, 1896×868, 390×700),
- axe bez závažných chyb.

## 11. Mimo rozsah

- Instituce jako aktéři.
- Shlukování podle podobných vzorců bez společného aktéra.
- Přibližování a posouvání mapy myší, export obrázku.
- Vazby mezi aktéry mimo strom vlastnictví a vztahů k Babišovi (např. známosti).
