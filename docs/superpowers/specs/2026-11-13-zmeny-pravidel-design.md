# Změny pravidel: specifikace

*Druhá část archivu: zákony, nařízení a dotační pravidla současné vlády, ze kterých mají prospěch A. Babiš nebo Agrofert, s doloženým rozborem krok za krokem.*
Stav: schválený design (brainstorming 13. 11. 2026). Navazuje na `2026-11-10-nenechme-vyhnit-design.md`. Jeho pravidla platí beze změny: metodika zdrojů, jazyk bez hodnotících přívlastků, vizuální systém, žádné svislé posouvání a přístupnost. Tato specifikace nahrazuje zmínku o „rozsahu B“ přes pole `typ` (oddíl 2 a 5 hlavní specifikace).

## 1. Účel a úspěch

**Podnět:** vláda jmenovaná 9. 12. 2025 předkládá a vydává pravidla, ze kterých mohou mít prospěch její předseda nebo jeho holding. Příkladem je poslanecká novela zákona o střetu zájmů z června 2026, která by zkrátila lhůtu SZIF k vymáhání dotací.
**Účel:** průběžně zaznamenávat taková pravidla od chvíle, kdy jsou předložena. U každého pravidla se z textu předpisu sestaví logický řetězec, zda a jak z něj Babiš nebo Agrofert budou mít prospěch. Každý krok řetězce má zdroj, takže si ho čtenář ověří sám a nemusí věřit úsudku archivu.

Část je úspěšná, když:
- každý záznam má řetězec prospěchu, ve kterém je každý krok doložen zdrojem a první krok cituje text předpisu,
- je vidět, v jaké fázi projednávání pravidlo je a které kontroly legislativního procesu vynechalo,
- každý záznam má stanovisko předkladatele,
- z pravidla se jedním kliknutím dostanete na kauzu, které se týká, a naopak.

## 2. Rozsah: co patří do archivu

Test zařazení je v `_koncepty/test-pravidla.md` (obdoba `test-kauzy.md`), shrnutí je na stránce Metodika.

**Pravidlo patří do archivu, když splní všechny čtyři podmínky:**

1. **Obecné pravidlo s oficiálním textem.** Patří sem zákon nebo novela, pozměňovací návrh, nařízení vlády, vyhláška ministerstva a pravidla dotačního programu (výzva, podmínky SZIF nebo MZe). Pravidlo musí být oficiálně předložené nebo zveřejněné: sněmovní tisk, eKLEP/ODOK, e-Sbírka nebo zveřejněná výzva.
2. **Předkladatel nebo vydavatel je současná vládní většina:** vláda jmenovaná 9. 12. 2025, její ministerstva, státní fondy, nebo poslanci a senátoři vládní koalice. Starší kroky z let 2014–2021 jsou zatím mimo rozsah. Lze je později doplnit stejným formátem rozšířením této podmínky.
3. **Řetězec prospěchu dovede k A. Babišovi osobně nebo k Agrofertu** (jeho firmám, případně svěřenským fondům) se závěrem aspoň „pravděpodobný“ (oddíl 4). Osobním prospěchem je například změna pravidel střetu zájmů, která se týká člena vlády.
4. **Změna dopadá na Babiše nebo Agrofert zvlášť, ne plošně na všechny.** Dotčená skupina je úzká, například velké zemědělské, potravinářské nebo chemické podniky, příjemci konkrétní dotace nebo členové vlády. Případně se změna dotýká konkrétního řízení či sporu Babiše nebo Agrofertu.

**Do archivu nepatří:**

- **plošné změny**, například sazba DPH nebo daně z příjmů pro všechny firmy. Výjimkou je ustanovení mířící na úzký obor, například spotřební daň z biopaliv,
- **rozhodnutí v jednotlivém případě.** Například rozhodnutí SZIF nevymáhat dotace Agrofertu patří jako událost do kauzy *Vymáhání zemědělských dotací*,
- **záměr bez textu**, například rozhovor ministra o chystané změně. Zapíše se až s textem,
- pravidlo, u kterého řetězec vede **jen k jiným podnikům** než Agrofertu,
- pravidlo, u kterého rozbor nedá aspoň „pravděpodobný“ prospěch. Zůstane v konceptech, dokud se věc nevyjasní.

Záznamy se nemažou. Pravidlo, které Sněmovna zamítne nebo předkladatel stáhne, zůstává v archivu s tímto stavem.

## 3. Jazyk

- Dokud pravidlo neplatí, píše se podmiňovacím způsobem: „novela by zkrátila…“, „umožnila by…“.
- Výrazy „ušité“, „na míru“ a „agrobaron“ se ve vlastním textu archivu nepoužívají. Smějí zaznít jen jako doslovná citace s uvedením mluvčího.
- **Výhrady** (pole `vyhrady`) se uvádějí jen od institucí: Legislativní rada vlády, ÚOHS, NKÚ, Evropská komise, veřejný ochránce práv, ČNB, soudy a podobně. Výhrady opozice smějí do „Souvislostí“, označené jako politické.
- **Stanovisko předkladatele je povinné.** Když chybí veřejná reakce na kritiku, uvede se deklarovaný účel z důvodové zprávy nebo odůvodnění.
- Závěr řetězce je **rozbor archivu, ne úřední zjištění.** Metodika to výslovně uvádí.

## 4. Řetězec prospěchu a závěr

Řetězec je posloupnost aspoň dvou kroků. Každý krok je jedna věta a má aspoň jeden zdroj:

1. **první krok:** co pravidlo mění. Zdroj musí být primární (text předpisu, tisk, pozměňovací návrh), ideálně s uvedením paragrafu,
2. **další kroky:** fakta, kterých se změna dotýká (například „SZIF vymáhá po firmách Agrofertu dotace z let 2017–2021“), a důsledek,
3. krok, který stojí na odhadu (například jak se nová lhůta uplatní na zahájená řízení), má příznak `odhad: true`. Na webu se zobrazí viditelné označení „odhad“.

**Dva stupně závěru:**

- **prospěch doložen** (`dolozen`): žádný krok není odhad,
- **prospěch pravděpodobný** (`pravdepodobny`): aspoň jeden krok je odhad.

Nepovinné pole `dalsiDotceni` uvádí se zdrojem, koho dalšího se změna týká, například „podniky nad 1 000 ha“. Čtenář tak vidí, jestli jde o úzké pravidlo pro jednu firmu, nebo o změnu pro širší skupinu.

## 5. Datový model

Každé pravidlo je soubor `obsah/pravidla/<slug>.md`, koncepty jsou v `_koncepty/obsah/pravidla/<slug>.md`. Slug je zároveň URL. Slovník štítků je společný s kauzami (`obsah/stitky.yml`).

Ukázka (hodnoty jsou ilustrační, neověřené):

```yaml
---
nazev: Novela zákona o střetu zájmů 2026   # nejvýš 60 znaků
shrnuti: 1–2 věty (přehled, náhled při sdílení)   # nejvýš 320 znaků
druh: zakon            # zakon | narizeni-vlady | vyhlaska | pravidla-programu
cesta: poslanecky-navrh
  # vladni-navrh | poslanecky-navrh | senatni-navrh | pozmenovaci-navrh
  # | narizeni-vlady | vyhlaska-ministerstva | pravidla-programu
predkladatel: poslanci A. Vondráček, P. Turek, J. Pražák a M. Pošarová
oznaceni: sněmovní tisk 123, 10. volební období   # nepovinné
pripojenoK:            # povinné právě u cesta: pozmenovaci-navrh
  nazev: Novela zákona o …
  zdroje: [2]
ucinnostOd: 2027-01-01 # nepovinné, RRRR-MM-DD, jako jediné datum smí ležet v budoucnosti
stitky: [stret-zajmu, dotace]
overeno: 2026-11-20    # povinné ve veřejném buildu, v konceptech null
zdroje:                # stejný tvar jako u kauz: id, vydavatel, titulek, datum, druh, url, archiv?
  - id: 1
    vydavatel: Poslanecká sněmovna
    titulek: Sněmovní tisk 123 – novela zákona o střetu zájmů
    datum: 2026-06-10
    druh: primarni
    url: https://www.psp.cz/…
udalosti:              # průběh, od nejstarší; aspoň jedna
  - datum: 2026-06-10
    krok: predlozeno   # nepovinné, výčet kroků níže
    nazev: Návrh podán do Sněmovny
    popis: …
    zdroje: [1]
prospech:
  komu: [babis, agrofert]   # neprázdná podmnožina {babis, agrofert}
  zaver: pravdepodobny      # dolozen | pravdepodobny
  retezec:                  # aspoň 2 kroky
    - text: Novela by zkrátila lhůtu SZIF k vymáhání dotací z 10 na 4 roky (§ …).
      zdroje: [1]
    - text: SZIF vymáhá po firmách Agrofertu dotace z let 2017–2021.
      zdroje: [5]
    - text: Zkrácení by se vztáhlo i na zahájená řízení.
      odhad: true
      zdroje: [6]
  dalsiDotceni:             # nepovinné
    text: …
    zdroje: [7]
vyhrady:                    # nepovinné
  - kdo: Legislativní rada vlády
    text: …
    zdroje: [8]
stanovisko:                 # povinné
  text: …
  zdroje: [3]
kauzy:                      # nepovinné; vazba na kauzy v obsah/kauzy/
  - kauza: vymahani-zemedelskych-dotaci
    popis: Zkrácení lhůty by se dotklo vymáhání dotací z let 2017–2021.   # nejvýš 200 znaků
    zdroje: [5]
opravy: []                  # jako u kauz
---
Volitelný text „Souvislosti“. Každý odstavec končí aspoň jednou poznámkou [^id].
```

**Kroky průběhu (`krok`):**

| Kroky | Platí pro |
|---|---|
| `pripominkove-rizeni`, `predlozeno`, `schvaleno-snemovnou`, `schvaleno-senatem`, `vraceno-senatem`, `vetovano`, `podepsano`, `vyhlaseno`, `zamitnuto`, `stazeno`, `zruseno-us` | `druh: zakon` |
| `pripominkove-rizeni`, `schvaleno`, `vyhlaseno`, `zruseno`, `zruseno-us` | ostatní druhy |

Ukončující kroky jsou `zamitnuto`, `stazeno`, `zruseno` a `zruseno-us`.

**Odvozené hodnoty (nikam se nezapisují):**

- **Stav projednávání** je `krok` poslední události, která krok má (aspoň jedna ho mít musí). Popisky stavů jsou v jednom slovníku (`src/lib/pravidla-stavy.ts`) sdíleném s webem a Metodikou.
- **„V projednávání“** znamená, že stav není `vyhlaseno` ani ukončující krok.
- **Vynechané kontroly** podle cesty předložení:
  - `poslanecky-navrh`, `senatni-navrh`: bez meziresortního připomínkového řízení a bez hodnocení dopadů regulace (RIA),
  - `pozmenovaci-navrh`: navíc bez stanoviska vlády a bez prvního čtení,
  - ostatní cesty: žádné.

  Texty jsou ve slovníku `src/lib/pravidla-slovnik.ts`, Metodika je vysvětluje.
- **Související změny pravidel u kauzy** se sestaví zpětně z polí `kauzy` všech pravidel.

**Build selže, když:**

- chybí `overeno` (mimo režim konceptů), `stanovisko`, `prospech`, aspoň jedna událost nebo aspoň jeden zdroj,
- `zaver: dolozen` a některý krok má `odhad: true`, nebo `zaver: pravdepodobny` a žádný krok odhad nemá,
- řetězec má méně než 2 kroky, nebo první krok nemá aspoň jeden zdroj druhu `primarni`,
- `cesta: pozmenovaci-navrh` nemá `pripojenoK`, nebo jiná cesta `pripojenoK` má,
- žádná událost nemá `krok`, nebo `krok` události nepatří k danému `druh`,
- jakýkoli odkaz na zdroj míří na neexistující `id`, duplicitní id zdroje,
- události nejsou v časovém pořadí, datum (mimo `ucinnostOd`) leží v budoucnosti nebo neexistuje,
- odkaz v `kauzy` míří na neexistující kauzu. Ve veřejném buildu se taková vazba vynechá s varováním, protože veřejný build nevidí koncepty (stejně jako `overVazby` u kauz). V režimu konceptů je to chyba,
- štítek není ve slovníku, odstavec „Souvislostí“ nemá poznámku nebo poznámka míří na neexistující zdroj,
- slug pravidla je shodný se slugem kauzy (sdílené odkazy a hlášení chyb musí být jednoznačné).

## 6. Architektura

- **Samostatná sbírka**, ne rozšíření schématu kauz. Kauzy, osa, filtry hlavní stránky, mapa ani hledání se nemění a pravidla do nich nepronikají.
- `src/lib/schema.ts`: `pravidloSchema` a `pravidloSchemaKoncepty` znovu použijí `zdrojSchema`, `udalostSchema` (rozšířené o `krok`), `datum`, `odkazy` a tvar stanoviska. Kontroly z oddílu 5 jsou v `superRefine`.
- `src/lib/validace.ts`: `overPravidlo` a načtení adresáře `pravidla/` do výsledku `overAdresar`, včetně kontroly vazeb na kauzy a shody slugů. `scripts/over-obsah.ts` tak pravidla kontroluje automaticky.
- `src/lib/kauzy.ts`: `nactiPravidla()`, `pravidlaKauzy(slug)` a `maPravidla()` (stránka a odkaz v menu existují, jen když je aspoň jedno pravidlo).
- Nové moduly: `src/lib/pravidla-stavy.ts` (kroky, popisky, odvození stavu), `src/lib/pravidla-slovnik.ts` (druhy, cesty, komu, závěry, popisky, vynechané kontroly).
- Stránky `src/pages/pravidla/index.astro` a `src/pages/pravidla/[slug].astro`, komponenty `PrehledPravidel.astro`, `DetailPravidla.astro`, `PrubehPravidla.astro` (ukazatel průběhu). Klientský skript `src/scripts/pravidla.ts` řeší filtr, otevírání detailu a History API stejně jako u kauz. Normalizace hledání se bere z `hledani.ts`.
- CI: kontrola odkazů (lychee) v `kontrola.yml` a `tydenni.yml` zahrne i `obsah/pravidla/*.md`.

## 7. Stránky a chování

### Menu
Kauzy · **Změny pravidel** · Metodika · O projektu. Položka a stránky existují jen tehdy, když `obsah/pravidla/` obsahuje aspoň jedno pravidlo (v náhledu konceptů vždy). Kód lze proto sloučit do `main` dřív než první ověřený obsah.

### Přehled `/pravidla/`
- **Úvod:** nadtitulek „Změny pravidel“, nadpis „Které změny pravidel prospívají Babišovi a Agrofertu“, podtitul „Zákony, nařízení a dotační pravidla od prosince 2025. U každé změny rozbor krok za krokem se zdroji a stanovisko předkladatele.“
- **Filtry:** hledání v názvu, shrnutí, štítcích a krocích řetězce bez ohledu na diakritiku a velikost písmen, štítky jako čipy (NEBO), zaškrtávátko „jen v projednávání“, počítadlo „Zobrazeno X z Y“ a rezervované místo pro „Zrušit filtry“.
- **Seznam řádků**, nejnovější poslední událost nahoře. Řádek obsahuje:
  - název, druh s cestou (například „Poslanecký návrh zákona“),
  - komu (Babiš / Agrofert) a závěr textem („prospěch doložen“ / „prospěch pravděpodobný“). Barva závěr ani stav nehodnotí, červená se nepoužije,
  - **ukazatel průběhu**: řada kroků podle druhu (u zákona podáno → Sněmovna → Senát → podpis → vyhlášeno), hotové kroky vyplněné a s datem. Ukončující krok uzavře řadu textovým štítkem. Vrácení Senátem nebo veto označí fázi Senát nebo Podpis poznámkou („Vráceno Senátem“, „Vráceno prezidentem“) a nové hlasování Sněmovny posune datum fáze Sněmovna,
  - „Detail →“.
- Seznam se posouvá uvnitř, stránka ne. Na mobilu (390×700) se řádek skládá pod sebe.
- Prázdný výsledek filtru ukáže hlášku s tlačítkem „Zrušit filtry“.

### Detail `/pravidla/<slug>/`
Statická stránka se stejným rozvržením jako přehled a otevřeným modalem, vlastní `<title>`, popis a Open Graph. Mezi pravidly se přechází bez načítání stránky, zavření vrátí adresu na `/pravidla/`.

- **Hlavička:** druh · cesta · stav, název, shrnutí a ukazatel průběhu. Klik na krok přepne na záložku Průběh s danou událostí.
- **Záložky:**
  1. **Komu prospívá** (otevřená jako první): závěr a komu, řetězec jako číslované kroky se zdroji (krok s odhadem s označením „odhad“), další dotčení, „Související kauzy“ s popisem vazby a odkazem na detail kauzy, řádek „Závěr je rozbor archivu podle metodiky“ s odkazem na `/metodika/#pravidla`.
  2. **Průběh:** cesta předložení a vynechané kontroly (například „Poslanecký návrh: neprošel připomínkovým řízením ani hodnocením dopadů regulace“), u pozměňovacího návrhu zákon, ke kterému byl připojen, a účinnost, pokud je známa. Pod tím události s listováním ← → i klávesnicí.
  3. **Výhrady a stanovisko:** výhrady institucí, pak stanovisko předkladatele.
  4. **Souvislosti:** jen pokud je text.
  5. **Zdroje (N):** stejné jako u kauz (seskupení, filtr, originál a archiv). Klik na číslo zdroje kdekoli v modalu přepne na Zdroje a zdroj zvýrazní.
- **Patička:** Historie změn tohoto pravidla, Nahlásit chybu, Zkopírovat odkaz.

### Detail kauzy
V záložce Souvislosti přibude seznam **„Související změny pravidel“** (název pravidla, popis vazby, stav, odkaz). Kauza bez textu Souvislostí tuto záložku zobrazí, pokud má aspoň jedno související pravidlo.

### Metodika a O projektu
- Metodika dostane oddíl **„Změny pravidel“** (kotva `#pravidla`). Popisuje rozsah (oddíl 2), řetězec a oba stupně závěru (oddíl 4), vynechané kontroly podle cesty předložení, pravidla jazyka (oddíl 3) a upozornění, že závěr je rozbor archivu, ne úřední zjištění.
- O projektu dostane jednu větu o nové části.

## 8. Postup obsahu

1. **Soupis kandidátů** v `_koncepty/pravidla/SOUPIS.md`. Prohledávají se:
   - sněmovní tisky a pozměňovací návrhy od 12/2025 (psp.cz),
   - připomínková řízení (eKLEP/ODOK),
   - e-Sbírka,
   - výzvy a pravidla SZIF a MZe,
   - Hlídač státu a média.

   První známý kandidát je `novela-stretu-zajmu-2026` (ze `_koncepty/soupis/SOUPIS.md`).
2. **Koncept** v `_koncepty/obsah/pravidla/<slug>.md` s `overeno: null`. Agent přečte samotný text (tisk, důvodovou zprávu, pozměňovací návrhy), projde test `test-pravidla.md` a sestaví řetězec. Kandidát, který testem neprojde, se přesune do `_koncepty/vyrazene/` s důvodem v `DUVODY.md`. Sdílený brief je `_koncepty/brief-pravidla.md`.
3. **Ověření proti zdrojům** druhým agentem podle `_koncepty/brief-overeni-pravidla.md`. Kontroluje hlavně, zda kroky řetězce stojí na citovaných paragrafech a zda krok s odhadem není vydáván za fakt.
4. **Kontrolní list pro člověka.** Člověk ověří zdroje, doplní `overeno`, záznam se přesune do `obsah/pravidla/` a otevře se PR.
5. **Aktualizace:** změna stavu projednávání se zapíše jako nová událost s `krok` a zdrojem a znovu se ověří. Automatické hlídání změn na psp.cz není součástí této verze.

## 9. Testování

- **Vitest:**
  - vzorové správné pravidlo projde,
  - pro každé pravidlo z oddílu 5 existuje vzorové chybné, které selže,
  - testy odvození stavu (včetně vrácení a ukončujících kroků), „v projednávání“, vynechaných kontrol a zpětných vazeb kauza → pravidla,
  - test shody slugu pravidla a kauzy.
- **Testovací data:** 2–3 pravidla v `tests/fixtures/obsah/pravidla/`: zákon s poslaneckým návrhem a vazbou na fixturní kauzu, pozměňovací návrh, nařízení. `tests/fixtures/prazdny` pravidla nemá.
- **Playwright:**
  - přehled ukáže všechna pravidla seřazená podle poslední události,
  - filtry (hledání bez diakritiky, čipy, jen v projednávání, zrušení, prázdný stav),
  - otevření detailu z řádku i přímou adresou, záložky, přepnutí na zdroj, zavření,
  - odkaz z pravidla na kauzu a z kauzy na pravidlo,
  - v prázdném buildu není položka menu ani stránka `/pravidla/`,
  - žádné svislé posouvání na velikostech z hlavní specifikace (oddíl 7) a na mobilu,
  - axe bez závažných chyb.
- **Kontroly obsahu:** `npm run over` a lychee zahrnují `obsah/pravidla/`.

## 10. Mimo tuto verzi

- Pravidla z let 2014–2021 (Babiš jako ministr financí a premiér).
- Pravidla na mapě souvislostí.
- Pravidla v hledání na hlavní stránce.
- Automatické hlídání průběhu projednávání na psp.cz.
