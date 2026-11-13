# Posuďte sami — specifikace v1

*Archiv kauz Andreje Babiše přehledně, s daty a zdroji.*
Stav: schválený design (brainstorming 10. 11. 2026). Prototypy všech obrazovek jsou v `design/03-detail/`.

## 1. Účel a úspěch

**Problém:** kauzy a sporné kroky zapadají. Za půl roku si je nikdo nepamatuje.
**Účel:** veřejný, anonymní a důvěryhodný archiv, kde si kdokoli projde kauzy na časové ose a ke každému tvrzení najde zdroj.
**Publikum:** voliči, hlavně nerozhodnutí, kteří přicházejí z mobilu přes sdílený odkaz.

Web je úspěšný, když:
- každé faktické tvrzení má dohledatelný zdroj a každá kauza stanovisko dotčené strany,
- návštěvník na první obrazovce vidí celou časovou osu a do detailu kauzy se dostane jedním kliknutím,
- konkrétní kauzu jde sdílet odkazem s vlastním náhledem.

## 2. Rozsah

**V1 obsahuje:** historické kauzy Andreje Babiše (rozsah „A“), hlavní stránku s osou, detail kauzy, stránky Metodika a O projektu, automatické kontroly a nasazení.

**Mimo v1:** průběžný záznam kroků vlády (legislativa, exekutiva; rozsah „B“). Datový model je na něj připravený přes pole `typ`. Dále mimo v1: fulltext přes celý web mimo hledání na hlavní stránce, anglická verze, redakční systém (CMS) a generované náhledové obrázky pro jednotlivé kauzy.

## 3. Identita a anonymita (pevná pravidla)

- Projekt vystupuje pod názvem *Posuďte sami* (do 13. 11. 2026 *Nenechme vyhnít*). Na webu ani v repozitáři nesmí být osobní údaje provozovatele.
- Web běží na vlastní doméně **`https://posudtesami.cz`** (GitHub Pages s vlastní doménou; `www.posudtesami.cz` přesměrovává na hlavní adresu). Doména musí být v GitHubu ověřená (Settings → Pages → Verified domains), aby ji nikdo nemohl převzít, a HTTPS je vynucené. Do buildu patří soubor `CNAME` s doménou.
- GitHub účet `posudtesami` (do 13. 11. 2026 `nenechmevyhnit`). Název repozitáře nemá s vlastní doménou na adresu vliv. Repozitář se jmenuje `posudtesami.cz` (do 13. 11. 2026 `nenechmevyhnit.cz`).
- Doménu si provozovatel registruje sám. Při registraci zvolí skrytí osobních údajů ve veřejném WHOIS. Registrátor a CZ.NIC jeho identitu znají, takže anonymita vůči úřadům ani soudům není absolutní.
- Kontakt `nenechmevyhnit@gmail.com`.
- Lokální git identita jen pro tento repozitář: jméno „Posuďte sami“ a noreply e-mail GitHubu. Nastaví se před prvním commitem.
- Push přes samostatný SSH klíč s aliasem hostitele `github-nenechme`, nikdy přes uložené přihlášení osobního účtu.
- Repozitář je samostatný, mimo nadřazený osobní repozitář `Projects`.
- Neověřené koncepty kauz nejsou nikdy veřejné. Leží v `_koncepty/`, které je v `.gitignore`.

## 4. Metodika obsahu

Plné znění je na stránce Metodika (text v prototypu `design/03-detail/_metodika.py`). Shrnutí pravidel, která musí implementace vynucovat:

- **Zařazení:** kauza se týká A. Babiše nebo jím ovládaných firem a splňuje aspoň jedno z kritérií: úřední řízení, úřední zjištění, nebo doložení dvěma nezávislými seriózními redakcemi. Každá kauza uvádí, podle kterého kritéria je zařazena, a se zdrojem vysvětluje, proč je to kauza.
- **Zdroje:** primární > seriózní média. Sociální sítě a názorové texty nejsou doklad faktu. Klíčová tvrzení mají primární zdroj nebo dva nezávislé mediální.
- **Jazyk:** slovesa podle stavu řízení, bez hodnotících přívlastků. U neuzavřených věcí presumpce neviny.
- **Druhá strana:** stanovisko dotčené strany je povinné a má vlastní zdroj.
- **Postup:** koncept (připravuje Claude) → člověk otevře každý zdroj a ověří ho → zapíše datum ověření → kauza se přesune z `_koncepty/` do `src/content/kauzy/` a zveřejní se.
- **Opravy:** veřejná historie v gitu. U věcné opravy viditelná poznámka v kauze.

## 5. Datový model

Každá kauza je soubor `src/content/kauzy/<slug>.md`. Slug je zároveň URL a identifikátor.

```yaml
---
typ: kauza                      # výčet: kauza (později legislativa, exekutiva)
nazev: Čapí hnízdo
shrnuti: 1–2 věty (karta, náhled při sdílení)
od: 2007                        # rok začátku (pro osu)
do: null                        # rok konce, null = dosud neuzavřeno
stav: soudni-rizeni             # výčet, viz níže
stavPoznamka: Krátké upřesnění stavu.
stitky: [dotace, eu-fondy]      # témata pro filtr; slovník štítků v src/content/stitky.yml
overeno: 2026-11-12             # datum posledního ověření člověkem (povinné)
zdroje:
  - id: 1
    vydavatel: Městský soud v Praze
    titulek: …
    datum: 2023-01-09
    druh: primarni              # primarni | media | stanovisko (vyjádření dotčené strany, nepodkládá kritérium)
    url: https://…
    archiv: https://web.archive.org/…   # smí chybět, doplní automatizace
udalosti:
  - datum: 2008-03              # přesnost rok / rok-měsíc / rok-měsíc-den
    nazev: Žádost o dotaci 50 milionů Kč
    popis: …
    zdroje: [2, 5]              # odkazy na id zdrojů výše
stanovisko:
  text: …
  zdroje: [10]
kriterium: uredni-rizeni        # výčet: uredni-rizeni | uredni-zjisteni | dve-redakce
proc:                           # „Proč je to kauza“: 1–3 věty, v čem je věc sporná a proč ji řešil úřad nebo média
  text: …
  zdroje: [1, 4]
opravy:                         # nepovinné
  - datum: 2026-12-01
    popis: Co a proč bylo opraveno.
---
Volitelný text „Souvislosti“. Každý odstavec končí aspoň jednou poznámkou [^id] odkazující na zdroj.
```

**Výčet stavů:** `provereni`, `obvineni`, `obzaloba`, `nepravomocne-odsouzen`, `pravomocne-odsouzen`, `nepravomocne-zprosten`, `pravomocne-zprosten`, `odlozeno`, `zastaveno`, `promlceno`, `soudni-rizeni`, `uredni-zjisteni`, `jine` (u `jine` je `stavPoznamka` povinná). Lidské popisky stavů jsou v jednom slovníku sdíleném s webem a se slovníčkem v Metodice.

**Build selže, když:**
- chybí `overeno`, `stanovisko`, `kriterium`, `proc`, aspoň jedna událost nebo aspoň jeden zdroj,
- kritérium nepodkládají zdroje u `proc`: `uredni-rizeni` a `uredni-zjisteni` vyžadují aspoň jeden primární zdroj, `dve-redakce` dva mediální zdroje od různých vydavatelů,
- `nazev` má víc než 36 znaků (musí být na ose celý vidět),
- událost, stanovisko nebo `proc` nemá zdroj, nebo odkazuje na neexistující `id`,
- `stav` není z výčtu, `do < od`, nebo datum události leží mimo `od`–(`do` nebo dnes),
- zdroj nemá `url`, `vydavatel` nebo `druh`,
- odstavec „Souvislostí“ nemá poznámku se zdrojem, nebo poznámka odkazuje na neexistující zdroj,
- štítek není ve slovníku štítků.

## 6. Stránky a chování

### Hlavní stránka `/`
Shora dolů (prototyp `design/03-detail/portret-p4.html`):
1. **Hlavička:** značka, menu Kauzy / Metodika / O projektu, červená linka.
2. **Úvod (U2):** nadtitulek „Archiv kauz Andreje Babiše“, nadpis „Za půl roku si to nebudete pamatovat.“, podtitul o zdrojích a stanovisku.
3. **Filtry (F4):**
   - hledání v názvu, shrnutí, štítcích a událostech, bez ohledu na diakritiku a velikost písmen,
   - štítky jako čipy s výběrem více najednou (logika NEBO). Přetečení se řeší šipkami ‹ › a mizejícím okrajem, bez viditelného posuvníku,
   - zaškrtávátko „jen neuzavřené“ a počítadlo „Zobrazeno X z Y kauz“,
   - místo pro „Zrušit filtry“ je rezervované, aby se nic neposouvalo.
4. **Osa (F):**
   - sloupec názvů vlevo (přilepený), osa roků 1980 až aktuální rok, sloupec „Detail →“ vpravo (přilepený),
   - každá kauza je řádek s pruhem v reálném měřítku, popiskem „od–do · N let“ a čárkami událostí. Neuzavřené kauzy mají světlý konec se šipkou,
   - výběr kauzy zvýrazní pásmo přes celý graf a popisky od/do na ose roků. Ostatní řádky se ztlumí. Zavření detailu výběr na ose zruší (v pohledu mapy, i po „Ukázat na mapě“, kauza zůstane zvýrazněná),
   - prázdný výsledek filtru ukáže hlášku s tlačítkem „Zrušit filtry“.
5. **Řádek patičky:** legenda vlevo, kredit fotky, „Nezávislý archiv“, Nahlásit chybu, Historie změn a e-mail vpravo.

### Detail kauzy `/kauzy/<slug>/` (M2)
Statická stránka pro každou kauzu se stejným rozvržením jako hlavní stránka a otevřeným modalem. Vlastní `<title>`, popis a Open Graph umožňují náhled při sdílení. Mezi kauzami se přechází bez načítání stránky, mění se jen adresa (History API). Zavření modalu vrátí adresu na `/` a zruší výběr na ose.

Obsah modalu:
- nadtitulek (od–do · délka · stav), název a shrnutí (max. 3 řádky),
- mini-osa kauzy s body událostí a popiskem vybrané události,
- záložky:
  - **Proč je to kauza** (otevřená jako první): text se zdroji a řádek „Zařazeno podle metodiky: …“ s odkazem na /metodika/#kriteria,
  - **Chronologie:** jedna událost, listování ← → i klávesnicí,
  - **Souvislosti:** text s poznámkami,
  - **Stav a stanovisko:** stav s datem ověření, presumpce neviny a stanovisko dotčené strany,
  - **Zdroje (N):** vydavatel, druh, titulek, datum, originál a archivní kopie.
- Klik na číslo zdroje přepne na Zdroje a zdroj krátce zvýrazní.
- Patička modalu: Historie změn této kauzy, Nahlásit chybu, Zkopírovat odkaz.

### Metodika `/metodika/` a O projektu `/o-projektu/` (V4)
- Pod hlavičkou krátký úvod a mřížka karet (pravidlo jednou větou + „Celé znění →“) a jedna zvýrazněná karta s odkazem na druhou stránku.
- „Celé znění“ otevře modal se seznamem částí vlevo a textem vpravo. Delší text se řadí do sloupců.
- Prototypy: `metodika-v4.html`, `oprojektu.html`.

## 7. Vizuální systém

- **Barvy (T2):** pozadí `#F5F5F8`, plochy `#FFFFFF`, hlavní modrá `#282661`, text `#16153A` / `#33325A`, linky `#D3D3E2`, popisky `#5C5B7A`, „dosud“ `#8F8DC4`. Červená `#DB1F2D` jen ve značce, linkách hlavičky a nadtitulcích, nikdy ve stavu kauzy. Barva nesmí hodnotit stav řízení.
- **Písma:** Redaction 10 (nadpisy i text, latin-ext) a JetBrains Mono (data, roky, popisky). Obě se hostují ve vlastním repozitáři, žádné Google Fonts za běhu.
- **Portrét (P4):** černobílá fotografie A. Babiše (Wikimedia Commons, Vox España, CC0). Je vyříznutá bez pozadí (`design/nastroje/vyrez_portretu.py`), pevně za obsahem v pravé části okna a měkce se ztrácí vlevo a dole. Horní pás s menu zůstává čistý. Osa má lehce průsvitné pozadí (84 %) a texty nad portrétem světlou auru. Kredit fotky je v řádku patičky. Před spuštěním se postava vyřízne ručně a pečlivěji (vlasy).
- **Žádné svislé posouvání stránky, nikde.** Rozvržení vyplní výšku okna (`100dvh`). Do strany se smí posouvat jen osa a delší texty v modalech. Celá osa musí být vidět bez posouvání na těchto velikostech okna (vnitřní rozměr): 1256×528, 1342×565, 1342×676 a 1896×868. Na mobilu (390×700) je osa zúžená a název kauzy je nad pruhem.
- **Animace:**
  - načtení: úvod vyjede, názvy naskočí a pruhy postupně dorostou zleva,
  - výběr kauzy: pásmo přejede na novou kauzu,
  - filtrování: přeskupení řádků přes View Transitions, s pojistkou 200 ms pro okamžité provedení,
  - modal: otevření i zavření přes `@starting-style`,
  - mini-osa: listování ve směru pohybu.
  - Při `prefers-reduced-motion` se vše vypne.
- **Přístupnost:** WCAG 2.1 AA (kontrast, ovládání klávesnicí, viditelný fokus, role a aria u záložek a modalů, `lang="cs"`).

## 8. Architektura

- **Astro** (statický výstup) + **content collections se Zod schématem** pro kauzy a štítky. Validace z oddílu 5 běží jako součást buildu: Zod pro strukturu, vlastní kontroly pro odkazy na zdroje a poznámky v těle.
- **Komponenty:**
  - `Hlavicka`, `Uvod`, `Filtry`, `Osa` (řádek, pásmo, popisky), `DetailKauzy` (mini-osa, záložky), `KartyStranky`, `ModalTextu`, `Patička`, `Portret`,
  - sdílené moduly: `stavy.ts` (výčet a popisky), `casova-osa.ts` (přepočet roků na pozice), `hledani.ts` (normalizace bez diakritiky).
- **Klientský JavaScript:** malý a bez frameworku. Filtrování, výběr, modal, směrování přes History API a animace. Data všech kauz (bez dlouhých textů) se vloží do stránky jako JSON. Plný obsah detailu je předgenerovaný v HTML každé stránky `/kauzy/<slug>/`, při přechodu mezi kauzami se načte jejich JSON.
- **Bez sledování:** žádná analytika, cookies ani skripty třetích stran.
- Prototypy v `design/` slouží jen jako vizuální a interakční reference, produkční kód se z nich nekopíruje.

## 9. Automatizace (GitHub Actions)

- **Při pull requestu a pushi:** instalace, build (s validacemi), Vitest, Playwright, kontrola odkazů u změněných kauz (lychee). Větev `main` je chráněná a bez zelených kontrol se nemerguje.
- **Při pushi do `main`:** nasazení na GitHub Pages.
- **Jednou týdně a na vyžádání:**
  - kontrola všech odkazů, nefunkční se hlásí jako issue,
  - archivace zdrojů bez `archiv` přes Wayback Machine (Save Page Now), doplněná automatickým pull requestem.
- **Šablony** issue a PR pro přispěvatele: „Nová kauza“ a „Oprava“, s povinnými zdroji.

## 10. Testování

- **Vitest:** schéma a validace. Vzorová správná kauza projde a pro každé pravidlo z oddílu 5 existuje vzorová chybná kauza, která selže. K tomu testy `casova-osa.ts` a `hledani.ts`.
- **Playwright:**
  - osa vykreslí všechny kauzy seřazené podle začátku, filtry (hledání bez diakritiky, čipy NEBO, jen neuzavřené, zrušení, prázdný stav),
  - otevření detailu z řádku i přímou adresou, listování událostmi, přepnutí na zdroj, zavření a zrušení výběru,
  - **žádné svislé posouvání:** `document.scrollingElement.scrollHeight <= innerHeight` na všech velikostech z oddílu 7, a celá osa je ve viewportu,
  - axe bez závažných chyb přístupnosti.
- **lychee:** kontrola odkazů v CI.

## 11. Podmínky spuštění (veřejné oznámení)

- aspoň 5 ověřených kauz,
- hotové stránky Metodika a O projektu,
- všechny kontroly v CI zelené,
- splněný kontrolní seznam anonymity z oddílu 3 a pečlivý ruční výřez portrétu.
- před zveřejněním mapy souvislostí: každá osoba-aktér splňuje pravidlo z `2026-11-10-mapa-souvislosti-design.md`, oddíl 3 (veřejně činná, nebo už jmenovaná ve zveřejněných kauzách v souvislosti s řízením).

## 12. Výchozí rozhodnutí k potvrzení a známá rizika

- **Licence textů:** CC BY 4.0 (výchozí). Alternativa CC BY-SA 4.0.
- **Dary:** v1 nepřijímá žádné dary.
- **Více než zhruba 12 kauz:** řádky se na notebook nevejdou. Do té doby se při přetečení posouvá jen seznam uvnitř osy. Před překročením je potřeba rozhodnout o řešení: skládání nepřekrývajících se kauz do drah, seskupení podle témat, nebo zhuštění.
- **Podobizna veřejné osoby:** použití v souvislosti s veřejným působením. Před spuštěním doporučeno krátké právní ověření.
- **Obsah prototypů je ilustrační a neověřený.** Žádný text z `design/` se nesmí zveřejnit bez postupu z oddílu 4.
