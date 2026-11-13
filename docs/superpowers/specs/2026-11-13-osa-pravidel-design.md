# Časová osa změn pravidel: specifikace

*Druhé zobrazení přehledu `/pravidla/`: všechny změny pravidel na společné časové ose, každá ve vlastním řádku s průběhem projednávání.*

Stav: schválený design (brainstorming 13. 11. 2026). Navazuje na `2026-11-13-zmeny-pravidel-design.md` a `2026-11-13-kontrola-moci-design.md`. Jejich pravidla platí beze změny. Platí také pravidla hlavní specifikace `2026-11-10-nenechme-vyhnit-design.md`: jazyk bez hodnotících přívlastků, vizuální systém, žádné svislé posouvání stránky a přístupnost.

## 1. Účel a úspěch

**Podnět:** změny pravidel přicházejí každý týden a jednotlivé kroky rychle zapadnou. Seznam ukazuje stav každé změny, ale ne to, *kdy* se co dělo a jak se kroky různých změn časově řadily.

**Účel:** ukázat na jedné ose od prosince 2025 průběh všech zapsaných změn. Kdy byly předloženy, schváleny, vyhlášeny nebo zamítnuty, co jim předcházelo a kdy by začaly platit.

Zobrazení je úspěšné, když:
- čtenář na první pohled vidí, co se dělo v kterém měsíci napříč změnami, i průběh každé jednotlivé změny,
- každý bod vede jedním kliknutím na danou událost v detailu pravidla,
- filtry přehledu platí stejně pro seznam i pro osu,
- stránka se na žádné podporované velikosti svisle neposouvá.

## 2. Přepínač zobrazení

- Přehled `/pravidla/` dostane přepínač **Seznam · Časová osa** se stejným vzhledem a chováním jako přepínač „Osa · Mapa“ na hlavní stránce (`PrepinacPohledu`).
- Výchozí je Seznam. Volba časové osy se zapíše do adresy jako `/pravidla/?pohled=osa` přes History API bez načtení stránky. Přímá adresa s `?pohled=osa` otevře osu.
- Bez JavaScriptu se přepínač ani osa nezobrazí. Seznam nese stejné informace a je plnou náhradou osy.
- Přepínač a osa existují jen tehdy, když existuje stránka `/pravidla/` (oddíl 7 spec pravidel).

## 3. Rozvržení osy

- **Levý sloupec:** krátký název pravidla (zkrácený třemi tečkami, celý v `title` a v popisu pro čtečku) a pod ním cesta předložení (například „Poslanecký návrh zákona“).
- **Časová plocha:** začíná **1. 12. 2025** a končí nejzazším z dat `dnes` a všech `ucinnostOd` zobrazených pravidel, s okrajem půl měsíce. Značky jsou po měsících (zkratka měsíce), přelom roku má výraznější značku s letopočtem. Svislá čára **„dnes“** s popiskem. „Dnes“ je datum sestavení webu (statický výstup), stejně jako u ostatních dat na webu.
- **Řádky** jsou seřazené podle první události s datem od 1. 12. 2025, nejstarší nahoře. Při shodě rozhoduje název podle české abecedy. Seznam zůstává řazený podle poslední události (spec pravidel).
- Při mnoha řádcích se plocha řádků posouvá svisle uvnitř. Záhlaví s měsíci a čára „dnes“ zůstávají vidět.

## 4. Body a čáry

Tvar rozlišuje druh události. Barva nehodnotí a červená (`#DB1F2D`) se nepoužije.

| Tvar | Význam | Zdroj dat |
|---|---|---|
| ● | krok projednávání | událost s `krok`, který není ukončující |
| ■ | ukončující krok (zamítnuto, staženo, zrušeno, zrušeno Ústavním soudem) | událost s `krok` z `UKONCUJICI` |
| ○ (menší, prázdný) | ostatní událost | událost bez `krok` |
| ◇ (přerušovaný obrys) | budoucí účinnost | `ucinnostOd` později než dnes |

- **Plná čára** vede od prvního do posledního kroku projednávání v řádku. **Přerušovaná čára** vede od posledního kroku k budoucí účinnosti, je-li zapsána.
- Účinnost v minulosti nebo dnes se neukazuje jako zvláštní bod (krok `vyhlaseno` už stojí na ose).
- Vrácení Senátem a veto (`vraceno-senatem`, `vetovano`) jsou kroky ●. Popisek je pojmenuje.
- Události s datem před 1. 12. 2025 se nekreslí. Začátek řádku je označí značkou **„◀ dříve (N)“**, kde N je jejich počet. Značka vede do detailu na první z nich.
- Události s neúplným datem (rok nebo rok a měsíc) se umístí doprostřed daného období, stejně jako na ose kauz (`rokCislo` v `src/lib/casova-osa.ts`).
- Body, které by se v jednom řádku překrývaly (stejný den), se kreslí vedle sebe s malým posunem a mají společný popisek se všemi událostmi.
- Pod osou je **legenda** tvarů.

## 5. Ovládání

- **Najetí myší a fokus** na bod ukáže popisek: datum, popisek kroku nebo název události a název pravidla. Například „30. 10. 2026 · Předloženo · Novela trestního řádu o pokynech odvolacího soudu“.
- **Klik na bod** otevře detail pravidla bez načtení stránky v záložce Průběh na dané události. Adresa je `/pravidla/<slug>/?udalost=<index>`, kde index je pořadí události v `udalosti` od 0. Přímá adresa s `?udalost=` otevře detail na této události. Neplatný index se ignoruje.
- **Zavření** detailu otevřeného z osy vrátí adresu na `/pravidla/?pohled=osa` a osu.
- **Klik na název** v levém sloupci otevře detail jako v seznamu.
- **Klávesnice:** každý bod je odkaz s přístupným názvem (název pravidla, datum, krok nebo název události). Tabulátor prochází řádky shora a v řádku body zleva. Viditelný fokus.
- **Filtry** (hledání, štítky, důvod, „jen v projednávání“) skrývají řádky osy stejně jako řádky seznamu. Počítadlo „Zobrazeno X z Y“ a prázdný stav s „Zrušit filtry“ platí pro obě zobrazení. Rozsah osy se filtrem nemění.

## 6. Velikosti obrazovky

- **Počítač** (velikosti z hlavní specifikace, oddíl 7): osa se vejde na šířku bez posouvání do strany, nejméně do rozsahu 20 měsíců. Při delším rozsahu se plocha posouvá do strany uvnitř a sloupec názvů zůstává přichycený vlevo.
- **Mobil 390×700:** plocha se posouvá do strany uvnitř. Sloupec názvů je přichycený vlevo a užší (jen název). Po otevření osy se plocha posune tak, aby byla vidět čára „dnes“.
- Na žádné velikosti se stránka svisle neposouvá (`document.scrollingElement.scrollHeight <= innerHeight`).

## 7. Architektura

- `src/lib/osa-pravidel.ts`: čistá funkce `osaPravidel(zaznamy, dnes)`. Vrací rozsah osy (od, do, značky měsíců a let, pozici „dnes“) a řádky seřazené podle oddílu 3. Každý řádek obsahuje slug, název, cestu, body (pozice v %, druh `krok | konec | udalost | ucinnost`, datum, popisek, index události), úsek plné a přerušované čáry a počet událostí „dříve“ s indexem první z nich. Nezapisuje nic do obsahu.
- `src/components/OsaPravidel.astro`: vykreslí osu z výsledku funkce (HTML a CSS, body jako odkazy).
- `src/components/PrehledPravidel.astro`: přepínač a osa vedle seznamu. Obě zobrazení sdílí filtry.
- `src/scripts/pravidla-filtr.ts`: skrývá řádky seznamu i osy podle stejné položky hledání.
- `src/scripts/navigace-pravidel.ts`: přepínání zobrazení s `?pohled=osa`, otevření detailu z bodu s `?udalost=`, návrat na osu po zavření.
- `src/scripts/detail.ts`: otevření na události podle `?udalost=`. Využije existující přepnutí na Průběh a zobrazení události.
- Kauzy, hlavní stránka, mapa ani detail pravidla se jinak nemění.

## 8. Testování

- **Vitest** (`osa-pravidel`):
  - rozsah osy (začátek 1. 12. 2025, konec podle dneška a nejzazší účinnosti s okrajem),
  - pozice bodů v %, druh bodu podle kroku, ukončující krok,
  - plná a přerušovaná čára, pravidlo bez účinnosti, účinnost v minulosti,
  - značka „dříve“ s počtem a indexem,
  - neúplné datum, body ve stejný den,
  - řazení řádků včetně shody.
- **Testovací data:** stávající fixtures pokrývají zákon s průběhem, zamítnutý pozměňovací návrh, nařízení s účinností a usnesení. Doplní se událost před 1. 12. 2025 a budoucí `ucinnostOd`, kde chybí.
- **Playwright:**
  - přepínač a adresa `?pohled=osa`, přímá adresa,
  - počet řádků a bodů podle fixtures, čára „dnes“, legenda,
  - popisek při fokusu,
  - klik na bod otevře Průběh na správné události, `?udalost=` v adrese, zavření vrátí osu,
  - filtry skrývají řádky osy, počítadlo a prázdný stav,
  - mobil: posouvání do strany a přichycený sloupec názvů,
  - bez JavaScriptu není přepínač ani osa,
  - žádné svislé posouvání na všech velikostech,
  - axe bez závažných chyb.

## 9. Mimo tuto verzi

- Časová osa jednoho pravidla v detailu (zůstává ukazatel fází a záložka Průběh).
- Přibližování a oddalování osy, seskupení po týdnech.
- Pravidla na ose kauz na hlavní stránce.
