# Vyhledatelnost: indexace, strukturovaná data, náhledy

Datum: 14. 11. 2026
Větev: `vyhledatelnost` (worktree `NenechmeVyhnit-seo`, z `origin/main` @ 2ec7cf2)

## Proč

Web není nasazený — [nasazeni.yml](../../../.github/workflows/nasazeni.yml) čeká na
proměnnou `NASAZOVAT=ano`. Žádná URL tedy není v indexu a žádnou starou adresu
nemusíme chránit. To je nejlepší možný okamžik: co se rozhodne teď, platí od
prvního dne a nic se nebude přesměrovávat.

Dnes na webu chybí `robots.txt`, `sitemap.xml` i jakákoli strukturovaná data.
(`src/lib/schema.ts` a `schema-*.ts` jsou validace obsahu přes zod, ne schema.org.)

## Cíl a co cílem není

**Cíl:** obecné dotazy („Babiš kauzy“, „Čapí hnízdo“) jako priorita, dlouhé
dotazy („Krahulík ÚOHS pozdní platby“) jako realistická výhra.

**Čeho tento spec nedosáhne, a je potřeba to říct nahlas:** na dotaz „Babiš
kauzy“ dnes vyhrává Wikipedie a velká média, protože na ně vedou tisíce odkazů.
Všechno v tomhle specu je **vstupenka, ne výhra** — dostane web do indexu,
vyhraje dotazy bez konkurence a připraví stránky tak, aby je Google uměl
zhodnotit, až odkazy přijdou. Získávání odkazů se nedá naprogramovat.

Jedna výjimka z toho pravidla je v sekci 4 (napojení na entitu ve Wikidatech) —
to je jediná položka, která působí přímo na obecné dotazy.

## Rozhodnutí

| Co | Jak | Proč |
|---|---|---|
| Doména | `posudtesami.cz`, `nenechmevyhnit.cz` se zahodí bez přesměrování | rozhodnutí zadavatele; GitHub Pages umí jen jeden CNAME na repozitář |
| Analytika | **žádná** | [o-projektu](../../../src/data/o-projektu.ts) slibuje „bez reklam a bez sledování“; Search Console se ověří DNS TXT a data o pozicích dá i bez skriptu na stránce |
| Stránky kauz | zůstanou jak jsou (osa i mapa pod detailem) | viz Měření níže — opakovaný obsah tu není, samostatné stránky by měly cenu bez přínosu |
| Nové závislosti | **žádné** | náhledové obrázky vyrenderuje Playwright, který už je v devDependencies |
| `ClaimReview` | nepoužijeme | Google fact-check rich results v červnu 2025 zrušil, od září 2025 je nevykazuje ani Search Console; byla by to práce bez efektu na výsledky |

### Měření, které rozhodlo o stránkách kauz

Změřeno na postaveném `main` @ 2ec7cf2 (`npm run build`, 46 stránek):

| | surově | gzip | text | z toho detail |
|---|---|---|---|---|
| `/` | 164 kB | 50 kB | — | — |
| `/kauzy/capi-hnizdo/` | 219 kB | 62 kB | 21 385 znaků | **17 235 (81 %)** |

81 % viditelného textu je unikátní obsah kauzy; osa, filtry a hlavička dávají
~4 150 znaků. To je běžný boilerplate. Samostatné stránky kauz by tedy rozbily
zavírání modálu a připravily příchozí z Google o kontext osy, a nevyřešily by
žádný existující problém.

## Návrh

### 1. Název a doména na jedno místo

Název „Posuďte sami“ je dnes zadrátovaný na **11 místech** (`Hlavicka.astro`,
`HlavniStranka.astro`, `PrehledPravidel.astro` 3×, `Zaklad.astro`, `404.astro`,
`metodika.astro`, `o-projektu.astro`, `navigace.ts`, `navigace-pravidel.ts`,
`data/o-projektu.ts`).

Nové `src/lib/web.ts`: název, doména, popis webu, přípona titulků. Ostatní si to
berou odtud. Dělá se první, jinak SEO rozseje tytéž řetězce na další místa.

### 2. Indexace

**`public/robots.txt`** — statický soubor. Povolit vše, odkázat na sitemapu.
Nic nezakazovat: na statickém webu není co chránit a `Disallow` u omylem
zakázané cesty se draze hledá.

**`src/pages/sitemap.xml.ts`** — vlastní endpoint, **ne `@astrojs/sitemap`**.
Důvod: `lastmod` musí pocházet z pole `overeno` příslušné kauzy nebo pravidla.
Integrace by tam dala datum buildu, což je nepravda, a u archivu, který staví na
ověřitelnosti, je to nepřijatelné i mimo SEO.

Inventář URL (generuje se z obsahu, nikde se nepíše ručně). Počty ověřené
buildem `main` @ 2ec7cf2 — 45 adres plus `404.html`:

| Cesta | Počet dnes | `lastmod` |
|---|---|---|
| `/` | 1 | nejnovější `overeno` ze všech kauz |
| `/kauzy/<slug>/` | 33 | `overeno` kauzy |
| `/pravidla/` | 1 | nejnovější `overeno` z pravidel |
| `/pravidla/<slug>/` | 4 | `overeno` pravidla |
| `/pravidla/oblasti/<oblast>/` | **0** | nejnovější `overeno` v oblasti |
| `/hlasovani/<id>/` | 4 | datum hlasování |
| `/metodika/`, `/o-projektu/` | 2 | poslední změna zdroje stránky |

Pozor na oblasti: trasa `src/pages/pravidla/oblasti/[oblast].astro` existuje, ale
dnes **negeneruje ani jednu stránku** — obsah v `obsah/pravidla/` zatím oblasti
nedefinuje. Sitemapa se proto musí skládat z toho, co build vytvoří, ne ze
seznamu tras. Jinak budeme Googlu nabízet neexistující adresy a sklidíme 404
v Search Console.

Ze stejného důvodu je sekce „pravidla“ podmíněná `maPravidla()` a sitemapa musí
respektovat stejnou podmínku. `/404/` do sitemapy nepatří.
`trailingSlash: 'always'` musí platit i v sitemapě, jinak se každá adresa
nabídne ve dvou variantách.

### 3. Titulky, popisy, `<h1>`

**`<h1>`.** Dnes je na všech 33 stránkách kauz `<h1>` text „Za půl roku si to
jinak nikdo nebude pamatovat.“ — slogan z [Uvod.astro](../../../src/components/Uvod.astro),
protože [HlavniStranka.astro:24](../../../src/components/HlavniStranka.astro#L24)
vykresluje `<Uvod />` i na stránce kauzy. Název kauzy je až `<h2 id="detail-nadpis">`.
33 stránek tedy sdílí jeden `<h1>`, který neobsahuje nic z toho, na co chceme
být nalezeni.

Oprava: na stránkách kauz se slogan vykreslí jako `<p>` se stejným stylem a
`<h1>` se stane název kauzy v detailu. Hero `<h1>` zůstane na `/`. **Vizuálně
nulová změna** a chování po zavření modálu (`pushState` na `/` bez načtení
stránky, [navigace.ts](../../../src/scripts/navigace.ts)) zůstane jak je — proto
se hero ze stránky nemaže, jen se mu odebere role nadpisu.

Stejná kontrola platí pro `/pravidla/<slug>/` a `/hlasovani/<id>/`, kde je
`<h1>` „Komu prospívají nová pravidla?“ z `PrehledPravidel.astro`.

**Titulky.** Dnes `${nazev} — Posuďte sami`. Nově podle vzorce
`Čapí hnízdo 2007–2026: časová osa a zdroje | Posuďte sami` — roky berou dotazy
jako „čapí hnízdo 2008“. Názvy kauz mají limit 36 znaků, takže u dlouhých se
prostřední část vzorce vypustí; o tom rozhoduje jedna funkce ve `web.ts`,
hlídaná jednotkovým testem na délku.

**Popisy.** Dnes se `description` bere z celého `shrnuti` (až 320 znaků).
Zkrátí se na ~155 znaků na hranici slova, jinak to Google odřízne uprostřed věty.

### 4. Strukturovaná data (JSON-LD)

Nová komponenta `src/components/StrukturovanaData.astro`, vkládaná do
`Zaklad.astro`. Data se skládají z už ověřeného obsahu, nic se nezadává ručně.

- **`citation`** — každá kauza má 10–30 ověřených zdrojů s vydavatelem a datem
  (`zdroje[]`). Vypsat je jako `citation` (`CreativeWork` s `name`, `url`,
  `publisher`, `datePublished`) je přesně to, co tento archiv umí a co ve
  strojově čitelné podobě nemá ani Wikipedie.
- **`about` + `sameAs` na Wikidata** pro Andreje Babiše a Agrofert. Napojí web
  na entitu, kterou Google už zná. Z celého specu je to **jediná položka, která
  působí přímo na obecné dotazy** — a je to pět řádků.
- **`BreadcrumbList`** — Domů › Kauzy › název. Drobečky se ve výsledcích
  pořád zobrazují.
- **`correction`** z pole `opravy`, **`dateModified`** z `overeno`.
- **`datePublished` nepoužijeme.** Nemáme ho. Vymýšlet datum vydání u archivu,
  jehož hodnota stojí na ověřitelnosti, nebudeme.
- `WebSite` + `Organization` na `/`. Bez `SearchAction` — hledání je klientské,
  neexistuje URL, na kterou by dotaz šel.

### 5. Náhledové obrázky

Dnes má celý web jeden `public/obrazky/nahled.png`, takže všech 33 kauz vypadá
při sdílení identicky.

`nastroje/nahledy.mjs` vyrenderuje přes **Playwright** (už v devDependencies, CI
mu instaluje Chromium) HTML šablonu 1200×630 pro každou kauzu a vyfotí ji do
PNG. Výstup se zacommituje do `public/obrazky/nahledy/<slug>.png`.

Proč Playwright a ne `satori`: v repozitáři jsou **jen woff2 fonty**
([fonty.css](../../../src/styles/fonty.css)), a satori woff2 neumí — potřeboval
by jiný formát písma a navíc rasterizér. Chromium woff2 vykreslí nativně, takže
náhledy budou mít pravé Redaction. Žádná nová závislost.

Proč commitovat a negenerovat při nasazení: obsah se mění zřídka, ~1,5 MB,
nasazení zůstane rychlé. Precedens pro generované commitnuté soubory je
`nastroje/stahni-fonty.mjs` → `src/styles/fonty.css`.

Plus `og:image:width`, `og:image:height`, `og:image:alt` v `Zaklad.astro`.

Náhledy nezlepšují pozice. Jsou tu proto, že sdílení na sítích je realistická
cesta k odkazům, bez kterých cíl „Babiš kauzy“ nejde splnit.

### 6. Registrace (dělá zadavatel, ne kód)

Postup k odklikání, ne automatizace — jsou to osobní účty:

1. Google Search Console, ověření **DNS TXT** (nikoli skriptem na stránce).
2. **Seznam.cz Webmaster** — v Česku 10–15 % hledání a vlastní robot. Opomíjené.
3. Bing Webmaster (pokrývá i Copilot).
4. Odeslat `https://posudtesami.cz/sitemap.xml` ve všech třech.
5. Zapnout nasazení: `NASAZOVAT=ano` v Settings → Variables.

Bod 5 je podmínkou všeho ostatního a dnes není splněný.

## Testování

**Jednotkové:** sitemapa obsahuje právě URL, které build vytvoří (včetně
podmínky `maPravidla()`); `lastmod` se bere z `overeno`, ne z času běhu; všechny
cesty končí lomítkem; délka titulků v limitu; JSON-LD se parsuje a má povinná
pole; `description` nepřekročí limit a nekončí uprostřed slova.

**E2E:** každá stránka má právě jeden `<h1>`; na `/kauzy/<slug>/` je jím název
kauzy; `/robots.txt` a `/sitemap.xml` se servírují se správným content-type.

**Vizuální:** hero na `/kauzy/<slug>/` vypadá po změně `<h1>` → `<p>` stejně
jako dřív (existující e2e na nepohnutí layoutu).

## Backlog, vědomě mimo tento spec

- **Citovatelnost AI asistenty** (`llms.txt`, čistý textový export kauz).
  Odloženo rozhodnutím zadavatele.
- **Stránky štítků a aktérů** jako samostatné URL („Agrofert dotace“).
  Nejsilnější zbývající páka na obecné dotazy, ale je to nová informační
  architektura, ne ladění — vlastní spec.
- **RSS/Atom.**
- **`ClaimReview`** jen pro Fact Check Explorer, pokud by někdy mělo smysl být
  v něm; na výsledky vyhledávání nemá vliv.

## Otevřená rozhodnutí

- Identifikátory Wikidat pro Babiše a Agrofert je potřeba dohledat a ověřit,
  ne odhadnout.
- Přesná podoba šablony náhledového obrázku (co na něm je kromě názvu kauzy —
  roky, stav, logo?) je designové rozhodnutí, ne technické.
