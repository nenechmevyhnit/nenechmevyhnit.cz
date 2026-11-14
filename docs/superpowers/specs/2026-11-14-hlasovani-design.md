# Hlasování u zákonů a nařízení: specifikace

*U změn pravidel ukázat, jak hlasovaly poslanecké kluby a jednotliví poslanci. Data pocházejí z otevřených dat Poslanecké sněmovny.*

Stav: schválený design (brainstorming 14. 11. 2026). Navazuje na `2026-11-13-zmeny-pravidel-design.md` (dále „spec pravidel“) a `2026-11-13-kontrola-moci-design.md`. Platí i pravidla hlavní specifikace `2026-11-10-nenechme-vyhnit-design.md`: jazyk bez hodnotících přívlastků, vizuální systém, **žádné svislé posouvání stránky** a přístupnost.

## 1. Účel a úspěch

**Podnět:** uživatel chce u zákonů a nařízení vidět, kdo jak hlasoval.

**Účel:** čtenář má vidět, kdo změnu prosadil nebo ji udržel na pořadu, a sám si dohledat svého poslance. Archiv hlasování nekomentuje, jen ho zapisuje se zdrojem.

Funkce je úspěšná, když:
- u každého zapsaného hlasování je v detailu pravidla vidět výsledek a rozpis podle klubů,
- proklik na klub otevře stránku hlasování s tímto klubem ve filtru a se seznamem jeho poslanců,
- odkaz na stránku hlasování s vybraným klubem lze sdílet a funguje i bez JavaScriptu,
- čtenář na první pohled odliší hlasování procedurální od hlasování o obsahu,
- každé číslo jde ověřit proti psp.cz a snímek dat jde znovu vyrobit veřejným skriptem.

## 2. Která hlasování se zapisují

- **Hlasování o obsahu:** zamítnutí nebo propuštění v 1. čtení, přikázání výboru, schválení ve 3. čtení, hlasování o vetu prezidenta nebo o návrhu Senátu. U pravidla s cestou `pozmenovaci-navrh` je to hlasování o tomto pozměňovacím návrhu.
- **Procedurální hlasování, která rozhodla o osudu návrhu:** zařazení bodu na pořad, jeho vyřazení nebo přesunutí, zkrácení lhůt, schválení už v 1. čtení (§ 90 odst. 2 jednacího řádu).
- Nezapisuje se automaticky všechno, co Sněmovna k tisku odhlasovala, třeba každý pozměňovací návrh ve 3. čtení. Hlasování vybírá člověk při zápisu události, stejně jako vybírá zdroje.
- **Vláda, ministerstva, fondy:** jak hlasovali jednotliví ministři, se nezveřejňuje, vychází jen usnesení. U pravidel programů a pokynů se nehlasuje vůbec. Tyto záznamy proto hlasování nemají. Proč, vysvětlí Metodika.
- **Senát:** jmenovitá hlasování zveřejňuje jen jako HTML. Datový model počítá s polem `komora`, ale skript v této verzi stahuje jen ze Sněmovny (oddíl 11).

Typ hlasování určuje člověk podle předmětu hlasování:
- `proceduralni`: rozhoduje o pořadu, lhůtách nebo způsobu projednání, ne o obsahu návrhu,
- `obsah`: rozhoduje o návrhu samotném nebo o jeho znění.

## 3. Zdroj dat

Otevřená data Poslanecké sněmovny (https://www.psp.cz/sqw/hp.sqw?k=1300):

- `https://www.psp.cz/eknih/cdrom/opendata/hl-2025ps.zip` (10. volební období):
  - `hl2025s.unl`: jedno hlasování na řádek (id, orgán, schůze, číslo, bod, datum, čas, pro, proti, zdržel se, nehlasoval, přihlášeno, kvórum, druh, výsledek, název),
  - `hl2025h1.unl`: hlas každého poslance (id poslance, id hlasování, kód),
  - `omluvy.unl`: omluvy z jednání (orgán, id poslance, den, od, do; prázdný čas znamená celý den),
  - `zmatecne.unl`: hlasování prohlášená za zmatečná.
- `https://www.psp.cz/eknih/cdrom/opendata/poslanci.zip`: `osoby.unl` (jména), `poslanec.unl` (id poslance → id osoby), `organy.unl` (kluby jsou orgány typu 1 pod orgánem Sněmovny daného období), `zarazeni.unl` (členství v klubu od–do).

Soubory jsou v kódování windows-1250 a sloupce oddělují svislítka.

**Převod kódů hlasu:**

| Kód PSP | Hlas ve snímku | Popisek |
|---|---|---|
| A | `pro` | pro |
| B, N | `proti` | proti |
| C | `zdrzel` | zdržel se |
| F | `nehlasoval` | nehlasoval |
| K | `zdrzel-nehlasoval` | zdržel se nebo nehlasoval |
| M | `omluven` | omluven |
| @ s omluvou, která pokrývá čas hlasování | `omluven` | omluven |
| @ bez takové omluvy | `neprihlasen` | nepřihlášen |
| jiný (např. W, před složením slibu) | skript skončí chybou | |

V datech 10. období jsou zatím jen kódy A, B, K a @. U kódu K data nerozlišují, jestli se poslanec zdržel, nebo nehlasoval, přestože souhrn hlasování tato dvě čísla uvádí zvlášť. Stránka proto u jednotlivých poslanců ukáže „zdržel se nebo nehlasoval“ a legenda vysvětlí proč.

**Klub v den hlasování:** podle `zarazeni.unl` (členství v klubu, jehož interval obsahuje datum a čas hlasování), ne podle dnešního stavu. Poslanec bez klubu je „nezařazený“.

## 4. Datový model

### Pole `hlasovani` u události pravidla

Nové nepovinné pole v `udalostPravidlaSchema` (`src/lib/schema-pravidla.ts`). Události kauz se nemění.

```yaml
udalosti:
  - datum: 2026-11-03
    nazev: Návrhy na vyřazení z pořadu zamítnuty
    popis: '…'
    zdroje: [25, 26, 27, 28]
    hlasovani:
      - id: psp-10-34-311          # komora-obdobi-schuze-cislo
        typ: proceduralni          # proceduralni | obsah
        co: 'Návrh T. Malé (ANO) zařadit 1. čtení jako poslední bod jednacího dne'
```

- `id` má tvar `psp-<období>-<schůze>-<číslo>`, kde číslo je pořadové číslo hlasování na schůzi.
- `co`: jedna věta (nejvýš 200 znaků), o čem se hlasovalo. Data PSP mají jen obecný název, například „Pořad schůze“.
- Pole se smí objevit u jakéhokoli druhu pravidla. Výběr hlídá redakce, ne validace.

### Snímek hlasování

Soubor `obsah/hlasovani/<id>.yml` vyrábí skript (oddíl 5) a ručně se neupravuje. Hlavička souboru to říká komentářem.

```yaml
# Vygenerováno skriptem scripts/stahni-hlasovani.ts z otevřených dat PSP. Ručně neupravovat.
# Ověřit: https://www.psp.cz/sqw/hlasy.sqw?g=88900
komora: psp
obdobi: 10
schuze: 34
cislo: 311
idPsp: 88900                 # pro odkaz https://www.psp.cz/sqw/hlasy.sqw?g=88900
datum: 2026-11-03
cas: '17:12'
nazevPsp: Pořad schůze
vysledek: prijato            # prijato | zamitnuto
kvorum: 78
souhrn: { pro: 86, proti: 69, zdrzel: 0, nehlasoval: 0, prihlaseno: 155 }
kluby:                       # zkratka PSP → plný název z organy.unl
  ANO2011: Poslanecký klub ANO 2011
  ODS: Poslanecký klub ODS
poslanci:                    # seřazeno podle příjmení, jména a id (česká abeceda)
  - { id: 5941, jmeno: Jana, prijmeni: Příkladová, klub: ODS, hlas: proti }
  - { id: 6120, jmeno: Petr, prijmeni: Ukázkový, klub: null, hlas: neprihlasen }
stazeno: 2026-11-14
```

(Čísla v příkladu jsou jen ilustrační.)

- `id` poslance je `id_osoba` z PSP. Mezi obdobími se nemění, takže na něm může později stavět profil poslance.
- Jméno a příjmení se ukládají bez titulů.
- `klub` je zkratka PSP, nebo `null` u nezařazeného poslance.

### Slovník klubů

`src/lib/hlasovani-kluby.ts`: zkratka PSP → krátký popisek a slug pro adresu.

| Zkratka PSP | Popisek | Slug |
|---|---|---|
| ANO2011 | ANO | `ano` |
| SPD | SPD | `spd` |
| MS | Motoristé | `motoriste` |
| ODS | ODS | `ods` |
| STAN | STAN | `stan` |
| Piráti | Piráti | `pirati` |
| KDU-ČSL | KDU-ČSL | `kdu-csl` |
| TOP09 | TOP 09 | `top-09` |
| (null) | Nezařazení | `nezarazeni` |

Zkratka, která ve slovníku chybí, je chyba buildu („doplňte klub do hlasovani-kluby.ts“).

## 5. Skript `npm run hlasovani`

`scripts/stahni-hlasovani.ts` (v `package.json` jako `hlasovani`):

1. Projde `obsah/pravidla/*.md` a sebere všechna id hlasování. Adresář obsahu jde změnit parametrem `--obsah <adresář>`, třeba pro `_koncepty/obsah`.
2. Pro id, která nemají snímek, stáhne `hl-<rok>ps.zip` a `poslanci.zip` (vždy čerstvě, jen do paměti). Rok období určí slovník `10 → 2025`.
3. Rozbalí potřebné soubory (knihovna `fflate` jako vývojová závislost), dekóduje windows-1250 (`TextDecoder`) a sestaví snímek podle oddílu 4.
4. Zapíše `obsah/hlasovani/<id>.yml` a vypíše souhrn (id, výsledek, pro : proti).

Datum `stazeno` je den stažení v UTC, protože kontrola v CI hlídá, že neleží v budoucnosti, podle UTC. S parametrem `--znovu` přepočítá všechny odkazované snímky. Soubor přepíše, jen když se data liší v něčem jiném než `stazeno`. Bez změny dat tak nevzniká diff.

**Skript skončí chybou a soubor nezapíše, když:**
- hlasování s daným obdobím, schůzí a číslem v datech není,
- hlasování je v `zmatecne.unl`,
- výsledek není „přijato“ ani „zamítnuto“, nebo jde o ruční hlasování bez jmenovitých hlasů,
- počet poslanců v hlasování není 200,
- se vyskytne neznámý kód hlasu,
- čas hlasování není ve tvaru HH:MM (s časy omluv se porovnává jako text),
- součty jmenovitých hlasů nesedí se souhrnem (oddíl 6).

Čtení souborů PSP, převod kódů, určení klubu a sestavení snímku jsou čisté funkce v `src/lib/psp-data.ts`. Testují se bez sítě (oddíl 9).

## 6. Kontroly při buildu

`scripts/over-obsah.ts` a načítání obsahu (`src/lib/validace.ts`) nově validují i `obsah/hlasovani/`. **Build selže, když:**

- událost odkazuje na hlasování bez snímku (hláška: „spusťte npm run hlasovani“),
- snímek neodpovídá schématu (`src/lib/schema-hlasovani.ts`), například chybí pole nebo má neznámý hlas,
- součty nesedí:
  - počet `pro` = `souhrn.pro`, počet `proti` = `souhrn.proti`,
  - `zdrzel` + `nehlasoval` + `zdrzel-nehlasoval` = `souhrn.zdrzel` + `souhrn.nehlasoval`, a jsou-li v datech kódy C nebo F, sedí každý zvlášť,
  - `omluven` + `neprihlasen` = počet poslanců − `souhrn.prihlaseno`,
- klub poslance není v `kluby` snímku nebo ve slovníku klubů,
- hlasování je dřív než datum události (porovnání v přesnosti data události),
- stejné id je u jednoho pravidla uvedeno dvakrát,
- dvě pravidla uvádějí u stejného hlasování různý `typ`.

**Varování (build projde):** snímek, na který žádné pravidlo neodkazuje. Stránka se pro něj nevygeneruje.

Režim konceptů (`NV_KONCEPTY`) čte snímky z `<NV_OBSAH>/hlasovani/` a pravidla jsou stejná.

## 7. Web

### Detail pravidla `/pravidla/<slug>/`

**Úprava proti návrhu z brainstormingu:** schválený návrh dával rozpis podle klubů přímo pod text události v Průběhu. Panel Průběhu ale ukazuje jednu událost najednou, nesmí se posouvat a co se nevejde, ořízne (`.m2-panel { overflow: hidden }`). Událost tisku 221 ze 3. 11. má tři hlasování a s osmi kluby u každého by se na 1256×528 ani na mobilu nevešla. Rozpis proto bude ve vlastní záložce a Průběh na ni bude jen odkazovat.

- **Nová záložka „Hlasování (N)“** hned za Průběhem. Zobrazí se, jen když má pravidlo aspoň jedno hlasování. Pořadí ostatních záložek ani pravidlo „otevřená je první zobrazená“ se nemění.
- Obsah záložky: hlasování od nejnovějšího (rozhodující hlasování přichází na konci projednávání). U každého:
  ```
  3. 11. 2026 · hlasování č. 311 · procedurální
  Návrh T. Malé (ANO) zařadit 1. čtení jako poslední bod jednacího dne
  Přijato 86 : 69 · pro : proti · Všichni poslanci →
  [ANO 62 : 0] [SPD 14 : 0] [Motoristé 10 : 0] [ODS 0 : 25] [STAN 0 : 20] …
  ```
  (Počty v ukázce jsou ilustrační.)
  - Každý klub je odkaz na `/hlasovani/<id>/#<slug-klubu>`. „Všichni poslanci“ vede na `/hlasovani/<id>/`.
  - Kluby jsou seřazené podle počtu poslanců v hlasování, nezařazení na konci.
  - Pro čtečky obrazovky má každý klub za viditelným textem skrytý rozpis, takže přístupný název začíná tím, co je vidět (WCAG 2.5.3), například „ANO 62 : 0 (62 pro, 0 proti, 3 zdrželi se nebo nehlasovali, 1 omluven)“.
  - U procedurálního hlasování je pod blokem věta: „Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu.“
  - Když se hlasování nevejdou na výšku, panel pokračuje do sloupců a posouvá se do strany, stejně jako záložka Zdroje (`column-width` 400 px, aby čipy klubů zabraly méně řádků; blok hlasování se nedělí, pokud se vejde na výšku panelu). Na mobilu (do 760 px) jde záložka pod sebou a posouvá se dolů s celým detailem, stejně jako ostatní záložky.
- **Průběh:** událost s hlasováním dostane pod zdroje jeden řádek „Hlasování: č. 311 · č. 328 · č. 385“. Čísla vedou na stránky hlasování.
- Hlavička, ostatní záložky a patička se nemění.

### Stránka hlasování `/hlasovani/<id>/`

Statická stránka (`src/pages/hlasovani/[id].astro`) pro každý snímek, na který odkazuje aspoň jedno pravidlo. Na počítači rozvržení vyplní výšku okna a stránka se svisle neposouvá. Na mobilu (do 760 px) má stránka přirozenou výšku a posouvá se dolů jako ostatní stránky webu. Do strany se neposouvá nic.

1. **Drobečková navigace:** název části v menu › název pravidla › Hlasování č. 311. Když na hlasování odkazuje víc pravidel, drobečková navigace končí u části v menu.
2. **Nadpis:** „Hlasování č. 311, 34. schůze Poslanecké sněmovny“, pod ním datum a čas.
3. **O čem se hlasovalo:** za každé navázané pravidlo štítek typu, věta `co` a odkaz zpět na pravidlo. U procedurálního hlasování věta z detailu pravidla.
4. **Výsledek:** přijato nebo zamítnuto, pro, proti, zdržel se, nehlasoval, omluven, nepřihlášen a kvórum.
5. **Filtr a kluby:** na počítači tabulka klubů (klub, pro, proti, zdržel se nebo nehlasoval, nepřítomen) s prvním řádkem „Všichni“. Název klubu v řádku je odkaz na kotvu (`#ano`), kliknout jde na celý řádek. Se skriptem odkaz přepíná filtr a vybraný klub má `aria-current="true"`. Na mobilu (do 760 px) jsou místo tabulky čipy „Všichni (200) · ANO (80) …“, které se zalamují do více řádků. Do strany se neposouvají.
6. **Seznam poslanců:** na začátku krátká legenda kategorií včetně vysvětlení „zdržel se nebo nehlasoval“ (oddíl 3) a odkaz na `/metodika/#hlasovani`. Legenda je součástí seznamu a posouvá se s ním, aby hlavička zůstala nízká. Poslanci jsou seskupení podle hlasu (Pro, Proti, Zdržel se nebo nehlasoval, Omluven, Nepřihlášen), uvnitř skupiny podle příjmení. Klub je u jména vidět, jen když je vybráno „Všichni“. Na počítači seznam pokračuje do sloupců a posouvá se do strany, nadpis skupiny zůstává se svými jmény. Na mobilu jde seznam pod sebou bez sloupců (legenda zůstává na začátku) a posouvá se dolů s celou stránkou.
7. **Zdroj:** „Otevřená data Poslanecké sněmovny, staženo 14. 11. 2026“ a odkaz „Ověřit na psp.cz“ (`hlasy.sqw?g=<idPsp>`).

**Filtr a adresa:**
- Vybraný klub se čte z kotvy (`#ano`). Neznámá nebo prázdná kotva znamená „Všichni“.
- Přepnutí filtru změní kotvu přes `history.replaceState`, takže odkaz jde sdílet a tlačítko Zpět vede na pravidlo.
- **Bez JavaScriptu** jsou všechny kluby v seznamu jako oddíly s `id` podle slugu (každý oddíl seskupený podle hlasu). Kotva posune seznam na oddíl klubu, odkazy v tabulce klubů fungují jako obyčejné kotvy.

### Vzhled

- **Bez stranických barev** a bez zelené pro „pro“ a červené pro „proti“. Hlas pro návrh není hodnocení. Kategorie rozlišuje text, pořadí a neutrální odstíny ze stávající palety.
- Písma, čipy, tabulky a sloupce jsou ze stávajícího vizuálního systému. Styly jsou ve vlastním souboru `src/styles/hlasovani.css`, aby se co nejméně dotkly souborů, které mění souběžné větve.

### Metodika

Nový oddíl **„Hlasování“** (kotva `#hlasovani`) pod oddílem o změnách pravidel:
- která hlasování zapisujeme (oddíl 2) a rozdíl mezi procedurálním hlasováním a hlasováním o obsahu,
- odkud data jsou, jak často se stahují a jak je ověřit (skript je veřejný),
- proč u nařízení vlády, usnesení vlády a pravidel programů hlasování chybí,
- význam kategorií, včetně omezení u kódu K a toho, že „omluven“ se odvozuje z evidence omluv.

## 8. Postup

1. **Worktree** `C:\Users\reath\Projects\NenechmeVyhnit-hlasovani`, větev `hlasovani` z `origin/main` (ee35f2a). V hlavní složce a ve worktree `-pravidla` mají jiné relace necommitnutou práci.
2. **Kód:** schéma a slovník klubů, `psp-data.ts`, skript, kontroly, záložka v detailu pravidla, stránka hlasování, Metodika.
3. **Obsah:** u tisku 221 doplnit `hlasovani` do dvou událostí:
   - 13. 10. 2026: `psp-10-34-32`, procedurální, návrh R. Králíčka (ANO) na pořadí bodů 34. schůze včetně 1. čtení tisku 221,
   - 3. 11. 2026: `psp-10-34-311` (návrh T. Malé), `psp-10-34-328` (návrh Z. Hřiba a V. Rakušana na vyřazení), `psp-10-34-385` (návrh I. Bartoše na vyřazení, 4. 11.), všechna procedurální.

   Změnit `obsah/pravidla/novela-stretu-zajmu-2026.md`, pak `npm run hlasovani` a kontrola souhrnů proti psp.cz. Kopie v `_koncepty/obsah/pravidla/` se doplní až po sloučení do main: větve `zmeny-pravidel` a `oblasti` čtou `_koncepty` se striktním schématem bez pole `hlasovani` a jejich náhled konceptů by jinak přestal fungovat. Denní sledování čte koncepty přes gray-matter bez schématu, takže ho to neomezí.
4. **PR** zakládá uživatel.

**Riziko slučování:** větev `oblasti` a necommitnutá práce ve `-pravidla` mění `DetailPravidla.astro` a styly pravidel. Záložka Hlasování proto bude vlastní komponenta (`ZalozkaHlasovani.astro`) a do `DetailPravidla.astro` přibude jen položka záložky, panel a řádek v události.

## 9. Testování

- **Unit (vitest):**
  - čtení `.unl` ve windows-1250 a rozdělení sloupců (včetně prázdných polí a koncového svislítka),
  - převod kódů hlasu podle tabulky v oddílu 3, včetně @ s omluvou a bez ní a omluvy s prázdným časem,
  - klub v den hlasování (přestup mezi kluby před hlasováním a po něm, nezařazený poslanec),
  - sestavení snímku a jeho řazení podle české abecedy,
  - chyby skriptu: neexistující, zmatečné a ruční hlasování, neznámý kód, nesedící součty, jiný počet poslanců než 200,
  - schéma snímku a pole `hlasovani` (typ, délka `co`),
  - kontroly buildu z oddílu 6 včetně varování u snímku bez odkazu,
  - odvozené hodnoty pro web: souhrn podle klubů, pořadí klubů, rozpis pro čtečky.

  Vstupy jsou malé syntetické tabulky PSP sestavené přímo v testu (200 poslanců, dva kluby), dekódování windows-1250 se testuje na bajtech.
- **E2e (Playwright)** na fixtures (`tests/fixtures/obsah/hlasovani/`): vymyšlené hlasování s několika poslanci s vymyšlenými jmény a se zkratkami klubů ze slovníku. Fixture pravidlo `zakon-omega` dostane jedno procedurální hlasování a jedno o obsahu.
  - záložka Hlasování: počet v názvu, bloky od nejnovějšího, kluby s počty, věta u procedurálního hlasování, přístupný název klubu začínající viditelným textem,
  - řádek „Hlasování: č. …“ v Průběhu vede na stránku hlasování,
  - proklik na klub otevře stránku s vybraným klubem a jeho poslanci, ostatní jsou skrytí,
  - přepnutí filtru změní kotvu, načtení adresy s kotvou vybere klub, neznámá kotva ukáže všechny,
  - bez JavaScriptu (`javaScriptEnabled: false`) jsou vidět oddíly všech klubů,
  - odkaz zpět na pravidlo a odkaz na psp.cz,
  - na počítači (`POCITACE`) **žádné svislé posouvání** `/hlasovani/<fixture>/` a `/pravidla/zakon-omega/` s otevřenou záložkou Hlasování, na telefonech (`MOBILY`: 390×700, 375×667, 360×640, 320×568) žádné posouvání do strany, čipy klubů se zalamují (`bez-posouvani.spec.ts`, `hlasovani-stranka.spec.ts`, `hlasovani-detail.spec.ts`),
  - axe bez závažných chyb, i s otevřenou záložkou Hlasování.
- Testy se spouštějí podle zavedeného postupu: vitest z cesty `C:\`, Playwright na vlastním portu z buildu, aby se nepletly se souběžnými relacemi.
- **lychee** v CI zkontroluje i odkazy `hlasy.sqw?g=…`: krok „Změněné kauzy a pravidla“ v `.github/workflows/kontrola.yml` zahrne i `obsah/hlasovani/*.yml`, jejichž hlavička odkaz obsahuje.

## 10. Rozhodnutí z brainstormingu

- Rozpis podle klubů a jmenovitý seznam na samostatné stránce s filtrem klubu (varianta „A + proklik do detailu“).
- Zapisují se hlasování o obsahu a procedurální hlasování, která rozhodla o osudu návrhu, vždy s označením typu (varianta B).
- Stránka hlasování je samostatná statická stránka se sdílitelnou adresou (varianta A).
- Snímky dat v repozitáři z veřejného skriptu, žádné stahování při buildu.
- Bez stranických barev.

## 11. Mimo tuto verzi

- stahování hlasování ze Senátu (až do něj dojde první zapsaný zákon),
- profil poslance: jak hlasoval napříč všemi pravidly,
- označení poslanců, kteří jsou aktéry archivu,
- upozornění denního sledování, že k tisku přibylo hlasování (hodí se po 37. schůzi od 24. 11. 2026),
- filtr podle hlasu, nejen podle klubu,
- seskupení klubů na koalici a opozici.
