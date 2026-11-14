# Oblasti: specifikace

*Výchozí pohled přehledu `/pravidla/`: změny pravidel seskupené do oblastí státu a vysvětlené tak, aby jim rozuměl každý. U každé změny „Co by to znamenalo pro vás“, u každé oblasti úvod „K čemu to je“ a citace „Jak to hodnotí“.*

Stav: schválený design (brainstorming 13. 11. 2026). Navazuje na `2026-11-13-zmeny-pravidel-design.md` (dále „spec pravidel“), `2026-11-13-kontrola-moci-design.md` („spec kontroly moci“) a `2026-11-13-osa-pravidel-design.md` („spec osy“). Jejich pravidla platí, pokud tato specifikace výslovně neříká jinak. Platí i pravidla hlavní specifikace `2026-11-10-nenechme-vyhnit-design.md`: metodika zdrojů, jazyk bez hodnotících přívlastků, vizuální systém, žádné svislé posouvání stránky a přístupnost.

## 1. Účel a úspěch

**Podnět:** jednotlivé změny pravidel jsou v archivu doložené, ale čtenář bez právního vzdělání z nich těžko pozná, co znamenají pro něj a co se v jedné oblasti státu mění za sebou. Uživatel chce, aby aplikace ukázala, kam postupně směřuje to, co vláda dělá, a jaké to má důsledky, jazykem, kterému rozumí kdokoli.

**Účel:** ukázat směr skládáním faktů vedle sebe, ne vlastním hodnocením archivu. Archiv:
- u každé změny řekne obyčejnou řečí, co by znamenala pro čtenáře,
- seskupí změny do oblastí a u každé vysvětlí, k čemu oblast nebo instituce slouží,
- u oblasti ukáže doslovné citace pojmenovaných institucí a odborníků a vždy stanovisko vlády.

Archiv sám neformuluje, kam vláda směřuje. Směr si čtenář složí z doložených změn a citací.

Pohled je úspěšný, když:
- čtenář bez právního vzdělání po otevření oblasti pochopí, k čemu oblast je a co by pro něj jednotlivé změny znamenaly,
- každá věta textu archivu má zdroj a žádná nehodnotí vládu,
- každá oblast s hodnoceními obsahuje stanovisko vlády,
- všechny zveřejněné změny jsou dostupné přes oblasti i bez JavaScriptu,
- stránka se na žádné podporované velikosti svisle neposouvá.

## 2. Rozsah

- **Oblasti seskupují stávající sbírku změn pravidel.** Nová sbírka nevzniká. Do oblastí patří jen záznamy, které prošly testem prospěchu (spec pravidel) nebo testem kontroly moci (spec kontroly moci v rozšíření podle oddílu 6).
- **Kroky vlády mimo sbírku** (personální rozhodnutí, záměry bez textu, změny bez upozornění instituce ze seznamu) do oblastí nepatří. Zůstávají v konceptech nebo jako události kauz, jak určují dosavadní specifikace.
- **Obcházení připomínkového řízení není oblast.** Týká se změn napříč oblastmi, proto je to štítek a filtr (oddíl 8).

## 3. Oblasti

Uzavřený slovník `OBLASTI` v `src/lib/pravidla-slovnik.ts`. Každá položka má název a krátký popisek pro kartu. Rozšíření slovníku je změna metodiky a jde přes PR se zdůvodněním.

| Slug | Název | Popisek na kartě | Typický obsah |
|---|---|---|---|
| `dotace-stret-zajmu` | Dotace a střet zájmů | Kdo dostane peníze z dotací a kdo to hlídá | zákon o střetu zájmů, PGRLF |
| `zemedelstvi-potraviny` | Zemědělství a potraviny | Pravidla pro zemědělce, půdu a výrobu potravin | dotační programy pro zpracovatele, předkupní právo na půdu |
| `soudy-policie` | Soudy, státní zastupitelství a policie | Kdo vyšetřuje, žaluje a rozhoduje o vině | trestní řád, GIBS |
| `kontrolni-urady` | Kontrolní úřady | Kdo kontroluje, jak stát a strany hospodaří | NKÚ, ÚOHS, ombudsman, dohled nad stranami, registr smluv, přístup k informacím |
| `verejne-finance` | Veřejné finance | Jak stát hospodaří, zadlužuje se a kdo to hlídá | rozpočtová pravidla, Národní rozpočtová rada, ČNB |
| `verejnopravni-media` | Veřejnoprávní média | Jak fungují a z čeho se platí ČT a ČRo | poplatky, rady ČT a ČRo |
| `statni-sprava` | Státní správa a státní firmy | Jak se obsazují úřady a vedení státních firem | služební zákon, nominační zákon |
| `obcanska-spolecnost` | Občanská společnost | Pravidla pro spolky a neziskové organizace | registrace a financování neziskovek |

Popisky jsou neutrální a nepojmenovávají vládu ani konkrétní firmu. Jedna změna může patřit do více oblastí.

## 4. Jazyk pro občany

Platí jazyková pravidla spec pravidel (oddíl 3) a spec kontroly moci (oddíl 5), včetně podmiňovacího způsobu u neplatných pravidel a zákazu výrazů „ušité“, „na míru“, „ohýbání“, „oslabení“ ve vlastním textu archivu.

### 4.1 „Co by to znamenalo pro vás“ (pole `proVas` u změny)

- Povinné u každé zveřejněné změny (oddíl 7.3). Liší se od shrnutí „Proč by to prospělo“ (`prospech.proc`): to vysvětluje prospěch Babiše nebo Agrofertu, `proVas` dopad na čtenáře.
- 1–3 věty, nejvýš 400 znaků. Píše se pro čtenáře bez právního vzdělání.
- Bez čísel paragrafů a bez nevysvětlených zkratek. Odborný pojem se vysvětlí nebo nahradí („úřad, který vyplácí zemědělské dotace“ místo „SZIF“).
- Konkrétně: koho se změna týká (daňoví poplatníci, obžalovaní, úředníci, diváci a posluchači, žadatelé o dotace…) a co se pro ně změní. Čísla jen ze zdroje (lhůta 10 → 4 roky, částka).
- Jen důsledky, které plynou z textu předpisu, z důvodové zprávy nebo odůvodnění, z hodnocení dopadů regulace (RIA) nebo z upozornění instituce ze seznamu (spec kontroly moci, oddíl 5). Každá věta má aspoň jeden zdroj. Žádné domýšlení dalšího vývoje („to povede k…“).
- Když se změna běžného člověka přímo netýká, řekne se to otevřeně: „Přímo se vás to nedotkne. Změna se týká…“.

Příklad: „Kdyby novela prošla, stát by mohl chtít zpět neoprávněně vyplacenou dotaci jen 4 roky místo 10. Co se do té doby nevymůže, zůstane firmě, i když jde o peníze z veřejných rozpočtů.“

### 4.2 „K čemu to je“ (úvod oblasti)

- 2–3 věty, nejvýš 400 znaků: co instituce nebo oblast dělá pro běžného člověka.
- Zdroje jen primární nebo oficiální: Ústava, zákon, stránky instituce.
- Úvod nezmiňuje současnou vládu ani konkrétní změny. Musí platit stejně dnes jako za deset let.

Příklad: „NKÚ kontroluje, jak ministerstva a úřady hospodaří s penězi z daní. Jeho prezidenta a viceprezidenta jmenuje prezident republiky na návrh Sněmovny.“

## 5. „Jak to hodnotí“ (hodnocení u oblasti)

**Kdo smí být citován:**
- **vláda:** člen vlády, předkladatel nebo úřad vlády. Když vláda na kritiku veřejně nereagovala, cituje se deklarovaný účel z důvodové zprávy nebo odůvodnění (mluvčí „předkladatel, důvodová zpráva“),
- **instituce:** veřejná instituce nebo mezinárodní organizace (například Ústavní soud, NKÚ, Národní rozpočtová rada, Evropská komise, Benátská komise, OECD) a profesní organizace ze seznamu `UPOZORNOVATELE`,
- **odborník:** pojmenovaná osoba s ověřitelnou odbornou rolí v oboru oblasti: vyučující nebo výzkumník vysoké školy či Akademie věd, bývalý soudce Ústavního nebo Nejvyššího soudu, bývalý člen vedení kontrolní instituce.

**Necitují se** politici mimo vládu, novináři, komentátoři a zaměstnanci watchdogů v této roli. Smějí být zdrojem faktů, ne hodnocení.

**Pravidla:**
- Citace je doslovná, má mluvčího, funkci, datum a zdroj, ve kterém je ověřitelná.
- Citace se týká oblasti nebo konkrétních změn v ní, ne obecně vlády.
- Oblast, která má hodnocení, musí mít aspoň jedno od vlády.
- Odborníci, kteří postup vlády hájí, se uvádějí za stejných podmínek jako kritici. Rešerše hodnocení je musí hledat výslovně.
- Pořadí: vláda, instituce, odborníci. Uvnitř skupiny od nejnovějšího.
- Pod hodnoceními je řádek „Výběr citací podle metodiky, ne hodnocení archivu“ s odkazem na `/metodika/#oblasti`.

## 6. Rozšíření testu kontroly moci

Test podle oddílu 4 spec kontroly moci platí beze změny: obecné pravidlo s textem, současná vládní většina, doložený věcný znak a upozornění subjektu ze seznamu. Rozšiřují se jen slovníky:

- **`KONTROLNI_INSTITUCE`** přibudou (krátký / plný popisek):
  - `rozpoctova-rada`: Národní rozpočtová rada / Národní rozpočtová rada,
  - `rozpoctova-pravidla`: rozpočtová pravidla / pravidla rozpočtové odpovědnosti (limity dluhu a schodku, schvalování schodku Sněmovnou),
  - `statni-sluzba`: státní služba / státní služba (přijímání, hodnocení a odvolávání státních zaměstnanců),
  - `statni-podniky`: vedení státních firem / obsazování orgánů státních podniků a společností s účastí státu,
  - `neziskove-organizace`: neziskové organizace / spolky a neziskové organizace (registrace a financování).
- **Popisek znaku `instituce`** se mění z „mění kontrolní instituci“ na „mění instituci nebo pravidla státu“. Název slovníku v kódu se nemění.
- **`UPOZORNOVATELE`** přibude `narodni-rozpoctova-rada` (Národní rozpočtová rada, typ `instituce`).

Pododdíl Metodiky „Dopad na kontrolu moci“ se generuje ze slovníků, nové položky se v něm ukážou samy. Jeho úvodní text se upraví, aby nemluvil jen o kontrolních institucích.

## 7. Datový model

### 7.1 Změna pravidla

Změny proti `src/lib/schema-pravidla.ts`:

```yaml
oblasti: [dotace-stret-zajmu]      # OBLASTI, aspoň 1, bez opakování
proVas:
  text: Kdyby novela prošla, stát by mohl chtít zpět neoprávněně vyplacenou dotaci jen 4 roky místo 10.
  zdroje: [1]                      # aspoň 1
```

Obě pole jsou ve schématu nepovinná, povinnost hlídá validace podle oddílu 7.3. Stávající koncepty v `_koncepty/` (sdílené všemi větvemi) tak zůstanou platné i na větvích bez nového schématu.

### 7.2 Oblast

Nová kolekce `oblasti` v `obsah/oblasti/<slug>.md` (frontmatter, tělo se nepoužívá). Slug souboru musí být v `OBLASTI`. Soubor není povinný: oblast bez souboru nemá úvod ani hodnocení (oddíl 7.3).

```yaml
uvod:
  text: NKÚ kontroluje, jak ministerstva a úřady hospodaří s penězi z daní.
  zdroje: [1]
hodnoceni:                          # nepovinné
  - typ: vlada                      # vlada | instituce | odbornik
    kdo: Jméno Příjmení
    funkce: ministr financí         # povinné u vlada a odbornik
    citace: "Doslovná citace."      # nejvýš 500 znaků
    datum: 2026-06-20
    zdroje: [2]                     # aspoň 1
    pravidla: [novela-stretu-zajmu-2026]   # nepovinné, slugy existujících změn
zdroje:
  - { id: 1, vydavatel: …, titulek: …, datum: …, druh: primarni, url: … }
overeno: 2026-11-13
```

Formát zdrojů je stejný jako u změn pravidel.

### 7.3 Validace

**Build selže, když:**
- změna nemá `oblasti` nebo `proVas` (kromě režimu konceptů, viz níže),
- slug v `oblasti` nebo název souboru oblasti není v `OBLASTI`, nebo se slug v `oblasti` opakuje,
- `proVas.text` má víc než 400 znaků, `uvod.text` víc než 400, `citace` víc než 500,
- `proVas`, `uvod` nebo hodnocení nemá zdroj, nebo odkaz míří na neexistující zdroj,
- oblast, do které patří aspoň jedna zveřejněná změna, nemá soubor s úvodem,
- `typ` hodnocení není `vlada`, `instituce` ani `odbornik`, nebo `vlada`/`odbornik` nemá `funkce`,
- oblast má hodnocení, ale žádné typu `vlada`,
- `pravidla` u hodnocení obsahuje slug, který neexistuje nebo nepatří do této oblasti.

**Režim konceptů** (`NV_KONCEPTY=ano`): chybějící `oblasti`, `proVas` nebo úvod oblasti jen vypíše varování. Změna bez oblasti se nezobrazí v pohledu Oblasti, v Seznamu a na ose ano. Nástroj `_koncepty/nastroje/over-pravidla.ts` hlásí totéž jako varování.

**Odvozené hodnoty** (v `src/lib/oblasti.ts`, nikam se nezapisují):
- změny v oblasti, seřazené od nejnovější události,
- počty pro kartu a hlavičku oblasti podle stávajících stavů projednávání (`pravidla-stavy.ts`): celkem, schváleno nebo platí, v projednávání; ukončené (zamítnuto, staženo, zrušeno) jen když jsou nenulové,
- „bez připomínkového řízení“: změna, jejíž vynechané kontroly podle cesty předložení (spec pravidel) obsahují připomínkové řízení.

## 8. Web

### 8.1 Přehled `/pravidla/`

- Přepínač zobrazení ze spec osy dostane tři polohy: **Oblasti · Seznam · Časová osa**. Výchozí jsou Oblasti, další mají adresu `?pohled=seznam` a `?pohled=osa`. Tím se mění výchozí pohled ze spec osy (oddíl 2).
- **Oblasti** jsou mřížka karet: název, popisek, počty („3 změny · 1 schválena · 2 v projednávání“). Karta je odkaz na detail oblasti. Pořadí karet podle slovníku.
- Karta se zobrazí, jen když do oblasti patří aspoň jedna změna odpovídající filtrům. Když filtrům neodpovídá nic, platí prázdný stav přehledu ze spec pravidel.
- **Filtry** přehledu platí pro všechny tři pohledy. Přibude zaškrtávátko **„jen bez připomínkového řízení“**.
- **Štítek „bez připomínkového řízení“** se ukáže u změny v Seznamu a v detailu oblasti.
- **Bez JavaScriptu** se zobrazí Oblasti bez přepínače a filtrů. Karty vedou na statické stránky oblastí a odtud na statické detaily pravidel. Protože každá zveřejněná změna patří aspoň do jedné oblasti, jsou dostupné všechny. Tím Oblasti přebírají roli plné náhrady, kterou ve spec osy měl Seznam.
- Pohled Oblasti a přepínač existují jen tehdy, když existuje stránka `/pravidla/` (spec pravidel, oddíl 7).

### 8.2 Detail oblasti

- Vlastní statická stránka `/pravidla/oblasti/<slug>/`. Z přehledu se otevírá jako dialog jako detail kauzy nebo pravidla (načtení stránky a vložení do dialogu, adresa přes History API). Zavření vrátí `/pravidla/`. Přímá adresa otevře přehled s otevřeným dialogem.
- **Hlavička:** nadtitulek OBLAST, název, úvod „K čemu to je“ s čísly zdrojů, počty.
- **Záložka „Co se mění (N)“:** změny od nejnovější. U každé datum poslední události, cesta, stav, štítek „bez připomínkového řízení“ (pokud platí), název, zvýrazněný rámeček **„Co by to znamenalo pro vás“** se zdroji a odkaz **„Celý rozbor →“** do detailu pravidla.
- **Záložka „Jak to hodnotí (N)“:** jen když oblast má hodnocení. Skupiny Vláda, Instituce, Odborníci (prázdná skupina se nezobrazí), u každé citace mluvčí, funkce, datum, čísla zdrojů a případně odkazy na změny. Dole řádek z oddílu 5.
- **Zdroje** oblasti se zobrazí stejně jako u detailu pravidla.
- Stránka se svisle neposouvá, delší obsah záložky se posouvá uvnitř panelu. Záložky se ovládají stejně jako v detailu pravidla, včetně klávesnice.
- Barva nehodnotí. Červená (`#DB1F2D`) jen v nadtitulku, jako jinde.

### 8.3 Detail pravidla

- Pod hlavičkou přibude rámeček **„Co by to znamenalo pro vás“** se zdroji a odkazy na oblasti, do kterých změna patří.

### 8.4 Sdílení

Detail oblasti má vlastní titulek a popis pro náhled při sdílení: „Název oblasti — Nenechme vyhnít“ a text úvodu.

## 9. Metodika

Nový oddíl **„Oblasti“** (kotva `#oblasti`) za oddílem „Změny pravidel“:
- k čemu oblasti jsou a že archiv směr nehodnotí, jen skládá doložené změny a citace,
- seznam oblastí generovaný ze slovníku `OBLASTI`,
- pravidla pro „Co by to znamenalo pro vás“ a „K čemu to je“ (oddíl 4),
- kdo smí být citován v „Jak to hodnotí“, kdo ne a proč, povinné stanovisko vlády a stejné podmínky pro zastánce i kritiky (oddíl 5),
- věta „Výběr citací podle metodiky, ne hodnocení archivu.“

Pododdíl „Dopad na kontrolu moci“ dostane upravený úvod podle oddílu 6.

## 10. Obsah a postup

- Stejný postup jako u kauz a pravidel: koncept, ověřovací agent, schválení člověkem.
- Ověřovací agent u `proVas`, úvodů a hodnocení kontroluje: každá věta má zdroj, který ji dokládá; žádná zakázaná slova; žádné domýšlení; citace jsou doslovné; mluvčí odpovídá oddílu 5; v hodnoceních je stanovisko vlády a byli hledáni i zastánci.
- Briefy v `_koncepty/pravidla/` se doplní o oddíly 4 a 5.
- Pořadí: úvody osmi oblastí, `oblasti` a `proVas` pro stávající koncepty pravidel, potom hodnocení postupně podle oblastí.

## 11. Testy

- **Jednotkové:** každá podmínka z oddílu 7.3 (včetně režimu konceptů), odvozené počty a řazení, „bez připomínkového řízení“ pro každou cestu předložení, filtry v pohledu Oblasti.
- **Testovací data:** v `tests/fixtures/obsah/oblasti/` dvě oblasti, jedna s hodnoceními všech tří typů, jedna bez hodnocení. Stávající fixturní pravidla dostanou `oblasti` a `proVas`, jedno pravidlo patří do dvou oblastí. `tests/fixtures/prazdny` oblasti nemá.
- **E2e:** výchozí pohled Oblasti, přepínání tří pohledů a adresy, filtr skryje kartu, otevření detailu z karty i přímou adresou, zavření a návrat, obě záložky a klávesnice, „Celý rozbor →“, rámeček v detailu pravidla, varianta bez JavaScriptu, žádné svislé posouvání na podporovaných velikostech, prázdný archiv bez pohledu Oblasti.

## 12. Mimo rozsah

- Vlastní souhrn archivu „kam to směřuje“ nebo prognózy.
- Oblasti pro kauzy.
- Hodnocení u jednotlivých změn (zůstávají `vyhrady` a upozornění podle dosavadních specifikací).
- Statistiky poslaneckých návrhů mimo sbírku.
