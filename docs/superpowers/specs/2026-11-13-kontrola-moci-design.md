# Dopad na kontrolu moci: specifikace

*Rozšíření části „Změny pravidel“ o druhý důvod zařazení: pravidla, která mění kontrolní instituce nebo obcházejí standardní legislativní postup a na která upozornila instituce nebo profesní organizace.*

Stav: schválený design (brainstorming 13. 11. 2026). Navazuje na `2026-11-13-zmeny-pravidel-design.md` (dále „spec pravidel“). Všechna její pravidla platí, pokud tato specifikace výslovně neříká jinak. Platí i pravidla hlavní specifikace `2026-11-10-nenechme-vyhnit-design.md`: metodika zdrojů, jazyk bez hodnotících přívlastků, vizuální systém, žádné svislé posouvání a přístupnost.

## 1. Účel a úspěch

**Podnět:** veřejná debata (stream, listopad 2026) upozornila, že vláda každý týden předkládá změny, které mění pravidla kontroly moci, a ty rychle zapadnou. Příkladem je změna trestního řádu, kterou část odborné veřejnosti spojuje s kauzou Čapí hnízdo (sněmovní tisk 355).

**Účel:** zaznamenávat tyto změny ve stejné sbírce jako změny pravidel ve prospěch Babiše a Agrofertu. Archiv přitom sám nehodnotí, zda změna právní stát oslabuje. Zapisuje, *co pravidlo mění* a *kdo z institucí nebo profesních organizací na to upozornil*.

Rozšíření je úspěšné, když:
- každý záznam s tímto důvodem má aspoň jeden věcný znak doložený primárním zdrojem a aspoň jedno upozornění od subjektu z uzavřeného seznamu,
- čtenář v přehledu odliší důvody zařazení a může podle nich filtrovat,
- záznam, který má oba důvody, existuje jen jednou.

## 2. Důvody zařazení

Sbírka „Změny pravidel“ obsahuje pravidla vládní většiny od 9. 12. 2025, která mají aspoň jeden z důvodů:

- **prospěch Babišovi nebo Agrofertu**: test podle oddílu 2 spec pravidel beze změny, kromě rozšíření druhů (oddíl 3 této specifikace),
- **dopad na kontrolu moci**: test podle oddílu 4 této specifikace.

Záznam může mít oba důvody. Test `_koncepty/test-pravidla.md` se doplní o druhý test.

## 3. Nové druhy pravidel

Oba důvody zařazení nově zahrnují i exekutivní pravidla s oficiálním textem:

- **usnesení vlády**, kterým se stanoví obecné pravidlo (například pravidla nákupu, programy, závazné postupy úřadů),
- **pokyn nebo metodika ministerstva** s obecnou působností (například metodický pokyn pro státní organizace).

Rozhodnutí v jednotlivém případě dál nepatří do sbírky, ani personální rozhodnutí (odvolání nebo jmenování šéfa instituce). Mohou být událostí kauzy nebo souvislostí pravidla.

## 4. Test „dopad na kontrolu moci“

**Pravidlo patří do sbírky s tímto důvodem, když splní všechny čtyři podmínky:**

1. **Obecné pravidlo s oficiálním textem** podle oddílu 2 spec pravidel a oddílu 3 této specifikace.
2. **Předkladatel nebo vydavatel je současná vládní většina** podle oddílu 2 spec pravidel.
3. **Věcný znak.** Pravidlo má aspoň jeden znak:
   - *institucionální:* mění pravomoci, nezávislost, způsob jmenování nebo odvolání, nebo financování kontrolní instituce ze seznamu v oddílu 5,
   - *procedurální:* přílepek (pozměňovací návrh mimo předmět projednávaného zákona), projednání ve stavu legislativní nouze, schválení již v prvním čtení, zpětná účinnost.
4. **Upozornění.** Na tento znak doložitelně upozornila aspoň jedna instituce nebo profesní organizace ze seznamu v oddílu 5. Upozornění se musí týkat právě tohoto pravidla a znaku, ne obecného tématu.

**Do sbírky s tímto důvodem nepatří:**

- pravidlo, které kritizuje jen opozice, watchdogy nebo média a žádný subjekt ze seznamu na ně neupozornil. Takové pravidlo zůstane v konceptech, dokud upozornění nepřijde,
- personální a jiná jednotlivá rozhodnutí,
- záměry bez textu.

## 5. Jazyk a slovníky

- Slova „ohýbání“, „oslabení“ ani obdobná hodnocení se ve vlastním textu archivu nepoužívají. Smějí zaznít jen jako doslovná citace s uvedením mluvčího.
- Znak se popisuje věcně: co pravidlo mění, s odkazem na ustanovení. Upozornění se popisuje jako výrok subjektu: kdo a na co upozornil.
- Metodika uvádí, že záznam dopadu na kontrolu moci je **záznam upozornění institucí, ne hodnocení archivu**.

**Uzavřené slovníky** v `src/lib/pravidla-slovnik.ts` s popisky sdílenými webem a Metodikou:

| Slovník | Hodnoty (popisek) |
|---|---|
| Druhy znaků `DRUHY_ZNAKU` | `instituce` (mění kontrolní instituci), `prilepek` (přílepek), `legislativni-nouze` (legislativní nouze), `prvni-cteni` (schválení v prvním čtení), `zpetna-ucinnost` (zpětná účinnost) |
| Kontrolní instituce `KONTROLNI_INSTITUCE` | `soudy`, `statni-zastupitelstvi`, `nku`, `uohs`, `ombudsman`, `policie` (policie a GIBS), `media-verejne-sluzby` (ČT a ČRo), `dohled-strany` (Úřad pro dohled nad hospodařením politických stran a politických hnutí), `cnb`, `pristup-k-informacim` (svobodný přístup k informacím), `registr-smluv` |
| Kdo smí upozornit `UPOZORNOVATELE` | instituce: `ustavni-soud`, `legislativni-rada-vlady`, `ombudsman`, `nku`, `evropska-komise`, `benatska-komise`, `nejvyssi-soud`, `nejvyssi-statni-zastupitelstvi`, `legislativni-odbor-snemovny`; profesní organizace: `soudcovska-unie`, `unie-statnich-zastupcu`, `ceska-advokatni-komora`, `syndikat-novinaru` |

Každá položka `UPOZORNOVATELE` má popisek a typ (`instituce` / `profesni-organizace`). Rozšíření slovníku je změna metodiky a jde přes PR se zdůvodněním.

## 6. Datový model

Změny proti `src/lib/schema-pravidla.ts`. Stávající koncepty a testovací pravidla zůstávají platné bez úprav.

- `druh`: přibudou `usneseni-vlady` a `pokyn-ministerstva`.
- `cesta`: přibudou `usneseni-vlady` a `pokyn-ministerstva`, každá patří právě ke stejnojmennému druhu. Vynechané kontroly: žádné.
- Kroky průběhu pro nové druhy: stejné jako u ostatních nezákonných druhů (`pripominkove-rizeni`, `schvaleno`, `vyhlaseno`, `zruseno`, `zruseno-us`).
- `prospech`: nově nepovinný.
- `kontrolaMoci`: nový nepovinný blok.

```yaml
kontrolaMoci:
  znaky:                           # aspoň 1
    - druh: instituce              # DRUHY_ZNAKU
      instituce: soudy             # KONTROLNI_INSTITUCE; povinné právě u druh: instituce
      text: Odvolací soud by nemohl soud prvního stupně zavázat, jak hodnotit důkazy (§ 259 odst. 6 tr. ř.).
      zdroje: [1]                  # aspoň jeden zdroj druhu primarni
  upozorneni:                      # aspoň 1
    - kdo: legislativni-rada-vlady # UPOZORNOVATELE
      text: Pracovní komise upozornila, že změna by mohla prohloubit opakované rušení rozsudků.
      zdroje: [8]
```

`vyhrady` zůstávají pro výhrady institucí, které se netýkají znaků (například k prospěchu nebo k technické kvalitě). Upozornění ke znaku patří jen do `kontrolaMoci.upozorneni`. Toto redakční pravidlo validace nehlídá.

**Build selže, když** (navíc k oddílu 5 spec pravidel):

- záznam nemá `prospech` ani `kontrolaMoci`,
- `kontrolaMoci` nemá aspoň jeden znak nebo aspoň jedno upozornění,
- znak nemá aspoň jeden zdroj druhu `primarni`,
- znak `druh: instituce` nemá `instituce`, nebo jiný druh znaku `instituce` má,
- `instituce` není v `KONTROLNI_INSTITUCE`, `kdo` není v `UPOZORNOVATELE`, `druh` znaku není v `DRUHY_ZNAKU`,
- stejný znak (druh + instituce) je uveden dvakrát,
- odkaz znaku nebo upozornění míří na neexistující zdroj,
- `cesta` nepatří k `druh` (platí i pro nové druhy).

**Odvozené hodnoty:**

- **Důvody zařazení** záznamu: `prospech`, pokud má blok `prospech`, a `kontrola-moci`, pokud má blok `kontrolaMoci`. Odvozují se v `src/lib/pravidla.ts`, nikam se nezapisují.
- Stav projednávání, „v projednávání“ a vynechané kontroly se nemění.

## 7. Web

### Přehled `/pravidla/`
- **Nadpis:** „Které změny pravidel prospívají Babišovi a Agrofertu nebo mění kontrolu moci“.
- **Podtitul:** „Zákony, nařízení, usnesení vlády a pokyny ministerstev od prosince 2025. U každé změny rozbor se zdroji, upozornění institucí a stanovisko předkladatele.“
- **Filtr důvodu:** čipy „Prospěch“ a „Kontrola moci“ (NEBO mezi sebou, A s ostatními filtry). Zrušení filtrů je ruší také. Počítadlo a prázdný stav fungují jako dosud.
- **Řádek:** pod druhem a cestou textové označení důvodů:
  - „Prospěch: Andrej Babiš, Agrofert · prospěch pravděpodobný“ (jako dosud),
  - „Kontrola moci: soudy“ nebo „Kontrola moci: přílepek“; více znaků se oddělí čárkou.
  Barva důvod nehodnotí, červená se nepoužije. Na mobilu (390×700) se řádek skládá pod sebe bez svislého posouvání stránky.
- **Hledání** prohledává i texty znaků a popisky znaků a institucí.

### Detail `/pravidla/<slug>/`
- Nová záložka **„Kontrola moci“**: seznam znaků (popisek znaku, instituce, text, čísla zdrojů), pod ním „Kdo upozornil a na co“ (popisek subjektu s typem, text, zdroje) a řádek „Záznam upozornění institucí, ne hodnocení archivu“ s odkazem na `/metodika/#kontrola-moci`.
- Záložka „Komu prospívá“ se zobrazí, jen když záznam má `prospech`. Záložka „Kontrola moci“ jen když má `kontrolaMoci`.
- Pořadí záložek: Komu prospívá, Kontrola moci, Průběh, Výhrady a stanovisko, Souvislosti, Zdroje. Otevřená je první zobrazená.
- Hlavička, Průběh, Výhrady a stanovisko, Souvislosti, Zdroje a patička se nemění. Klik na číslo zdroje v nové záložce přepne na Zdroje jako jinde.
- Popis pro sdílení (Open Graph) zůstává `shrnuti`.

### Detail kauzy, menu
Beze změny. „Související změny pravidel“ zobrazují i záznamy jen s kontrolou moci, pokud mají vazbu v `kauzy`.

### Metodika a O projektu
- Oddíl `#pravidla` dostane pododdíl **„Dopad na kontrolu moci“** (kotva `#kontrola-moci`): test z oddílu 4, seznamy institucí a upozorňovatelů generované ze slovníků, jazykové pravidlo a upozornění z oddílu 5.
- Text o nových druzích (usnesení vlády, pokyn ministerstva) se doplní do popisu rozsahu.
- O projektu: věta o části „Změny pravidel“ zmíní oba důvody.

## 8. Postup obsahu

Stejný jako v oddílu 8 spec pravidel (soupis → rozbor → koncept → ověření agentem → člověk), s těmito doplňky:

- Soupis kandidátů na kontrolu moci: `_koncepty/pravidla/SOUPIS-kontrola-moci.md`. Prohledávají se stejné zdroje a navíc stanoviska LRV, nálezy a podání ÚS, zprávy ombudsmana, stanoviska Soudcovské unie, Unie státních zástupců, ČAK a Syndikátu novinářů, zpráva EK o právním státu a stanoviska Benátské komise.
- První kandidáti: sněmovní tisk 355 (doplnit `kontrolaMoci` do existujícího konceptu) a pokyn MZe k nákupu potravin státními organizacemi (ověřit, zda existuje text).
- Brief rozboru (`_koncepty/pravidla/brief-rozbor.md`) a převodu (`_koncepty/brief-pravidla.md`) se doplní o blok `kontrolaMoci`.

## 9. Testování

- **Vitest:**
  - vzorové pravidlo jen s `kontrolaMoci` projde, vzorové s oběma důvody projde,
  - pro každé pravidlo z oddílu 6 („Build selže“) existuje vzorové chybné, které selže,
  - slovníky: každá hodnota má popisek, každý upozorňovatel má typ, cesty nových druhů,
  - odvození důvodů zařazení,
  - hledání najde záznam podle textu znaku a popisku instituce bez diakritiky.
- **Testovací data:** `tests/fixtures/obsah/pravidla/`: nové pravidlo jen s `kontrolaMoci` (druh `usneseni-vlady`) a do `zakon-omega` doplnit `kontrolaMoci`. `tests/fixtures/prazdny` beze změny.
- **Playwright:**
  - filtr podle důvodu (každý čip zvlášť, oba, kombinace se štítkem, zrušení),
  - označení důvodů v řádku,
  - pořadí a výběr první záložky u záznamu jen s prospěchem, jen s kontrolou moci a s oběma,
  - záložka Kontrola moci: přepnutí na zdroj, odkaz na Metodiku,
  - žádné svislé posouvání na velikostech z hlavní specifikace (oddíl 7) a na mobilu,
  - axe bez závažných chyb.
- **Kontroly obsahu:** `npm run over` kontroluje nová pravidla validace.

## 10. Mimo tuto verzi

- Personální a jednotlivá rozhodnutí týkající se kontrolních institucí jako samostatný druh záznamu.
- Automatické sledování stanovisek LRV a ÚS.
- Kontrola moci na mapě souvislostí a v hledání na hlavní stránce.
