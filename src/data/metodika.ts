import { KONTROLNI_INSTITUCE, popisekInstituce, DRUHY_ZNAKU, popisekDruhuZnaku, UPOZORNOVATELE, upozornovatel, OBLASTI, oblast } from '../lib/pravidla-slovnik';

// Seznamy pro pododdíl Dopad na kontrolu moci se generují ze slovníků, aby nemohly zastarat.
const seznamInstituci = KONTROLNI_INSTITUCE.map(i => popisekInstituce(i, 'plne')).join(', ');
const seznamProcedur = DRUHY_ZNAKU.filter(d => d !== 'instituce').map(popisekDruhuZnaku).join(', ');
const upozornovateleTypu = (typ: 'instituce' | 'profesni-organizace') => UPOZORNOVATELE.filter(u => upozornovatel(u).typ === typ).map(u => upozornovatel(u).nazev).join(', ');
const seznamOblasti = OBLASTI.map(o => oblast(o).nazev).join(', ');

// Texty převzaté doslova ze schválených prototypů (design/03-detail/_metodika.py).
export type SekceStranky = { id: string; nadpis: string; shrnuti: string; html: string };

/** Sekce Zákony a nařízení a věta o ní v kritériích se zobrazí jen tehdy, když archiv nějaká pravidla má (jinak stránka ani menu neexistují). */
export const metodika = (sPravidly: boolean): { platiOd: string; sekce: SekceStranky[] } => ({
  platiOd: '13. 11. 2026',
  sekce: [
    {
      id: "kriteria",
      nadpis: "Co do archivu patří",
      shrnuti: "Kauza se týká Andreje Babiše osobně nebo firem, které vlastnil či ovládal, a splňuje aspoň jedno z kritérií.",
      html: `<p>Kauza se týká Andreje Babiše osobně nebo firem, které vlastnil či ovládal, a splňuje <strong>aspoň jedno</strong> z těchto kritérií:</p>
<ul><li>probíhá nebo proběhlo úřední řízení (policie, státní zastupitelství, soud, OLAF, Evropská komise, NKÚ, Ústavní soud),</li>
<li>existuje úřední zjištění, například rozsudek, audit nebo rozhodnutí úřadu,</li>
<li>věc nezávisle na sobě doložily aspoň dvě seriózní redakce.</li></ul>
<p>U každé kauzy je hned na začátku vysvětleno, <strong>proč je to kauza</strong>: v čem je věc sporná a proč ji řešil úřad nebo média, se zdrojem. Uvádíme také, podle kterého kritéria je zařazena. Kontrola při sestavení webu ho ověřuje: úřední řízení a úřední zjištění musí doložit primární zdroj, dvě redakce musí doložit dva mediální zdroje od různých vydavatelů.</p>
${sPravidly ? '<p>Zákony, nařízení a další pravidla, která předkládá nebo vydává vláda či vládní koalice, mají vlastní část archivu s vlastními pravidly (oddíl Zákony a nařízení).</p>' : '<p>Kroky vlády jako celku zatím nezařazujeme.</p>'}
<h3 id="vazby">Vazby mezi kauzami</h3>
<p>Kauzy lze kromě časové osy zobrazit jako <strong>mapu souvislostí</strong>. Ukazuje, přes které firmy, osoby a nástroje (například svěřenské fondy) jsou kauzy spojené s Andrejem Babišem a které kauzy na sebe přímo navazují.</p>
<ul><li>Každá vazba má <strong>roli</strong> z pevného seznamu (například <em>vlastní</em>, <em>příjemce dotace</em>, <em>vychází z</em>), krátké vysvětlení a <strong>zdroj</strong>. Bez zdroje se web nesestaví. Vztahy firem, osob a nástrojů mají navíc období, kdy platily.</li>
<li>Aktérem může být firma nebo nástroj, které Andrej Babiš nebo jeho firmy ovládaly, a to jen pro období, kdy je ovládaly. Osoba jen tehdy, když je veřejně činná nebo už byla v souvislosti s řízením jmenována v médiích nebo v úředních dokumentech.</li>
<li>Úřady a instituce aktéry nejsou.</li>
<li><strong>Vazba sama o sobě neznamená vinu ani spoluodpovědnost.</strong> Říká jen, že dvě věci spolu doloženě souvisejí.</li></ul>
<p>Vazby ověřuje člověk stejně jako ostatní obsah kauzy.</p>`,
    },
    {
      id: "zdroje",
      nadpis: "Jaké zdroje uznáváme",
      shrnuti: "Primární dokumenty a seriózní média. Sociální sítě a názorové texty nejsou doklad faktu.",
      html: `<ol class="stupne"><li><strong>Primární zdroje:</strong> soudní rozhodnutí, tiskové zprávy státních zastupitelství, zprávy OLAF, Evropské komise a NKÚ, sněmovní tisky a hlasování, veřejné rejstříky.</li>
<li><strong>Seriózní média a investigativní redakce:</strong> například ČT, Český rozhlas, Seznam Zprávy, Deník N, Hospodářské noviny, Respekt, Investigace.cz, OCCRP.</li>
<li><strong>Stanovisko dotčené strany:</strong> prohlášení Andreje Babiše, jeho firem nebo hnutí. Ve zdrojích je označené zvlášť, protože dokládá jen to, co dotčená strana tvrdí, ne fakta. Proto také nepodkládá kritérium zařazení kauzy.</li>
<li><strong>Nepřípustné jako doklad faktu:</strong> sociální sítě, blogy, anonymní weby, komentáře a názorové texty.</li></ol>
<p>Každé faktické tvrzení má aspoň jeden zdroj. Klíčová tvrzení, tedy obvinění, rozsudek nebo výsledek auditu, mají primární zdroj nebo dva nezávislé mediální zdroje.</p>`,
    },
    {
      id: "jazyk",
      nadpis: "Jak píšeme",
      shrnuti: "Věcně a podle stavu řízení. Žádné hodnotící přívlastky, u neuzavřených věcí platí presumpce neviny. U částek vždy říkáme, co znamenají.",
      html: `<ul><li>Používáme slovesa podle skutečného stavu řízení: <em>obviněn, obžalován, zproštěn, odsouzen nepravomocně / pravomocně</em>.</li>
<li>Nepoužíváme hodnotící přívlastky ani spekulace o úmyslech.</li>
<li>U každé kauzy je vidět její aktuální stav a datum, kdy jsme ho naposledy ověřili.</li>
<li>Dokud soud pravomocně nerozhodne, platí presumpce neviny. Připomínáme to přímo u kauzy.</li></ul>
<h3 id="castky">Částky</h3>
<p>U kauz, ve kterých jde o peníze, uvádíme v detailu nejvýš tři částky. Každá má zdroj a označení, co znamená:</p>
<dl class="slovnicek">
<dt>dotace</dt><dd>Přiznaná nebo vyplacená dotace či jiná podpora z veřejných peněz.</dd>
<dt>škoda podle obvinění / obžaloby</dt><dd>Škoda, kterou vyčíslila policie nebo státní zástupce. Není to rozhodnutí soudu.</dd>
<dt>škoda podle rozsudku</dt><dd>Škoda, kterou stanovil soud.</dd>
<dt>vráceno nebo k vrácení</dt><dd>Co příjemce vrátil nebo podle rozhodnutí úřadu vrátit musí.</dd>
<dt>finanční korekce</dt><dd>Výdaje, které po auditu nebyly proplaceny z rozpočtu EU nebo je stát musel vrátit.</dd>
<dt>pozastavené platby</dt><dd>Platby, které úřad dočasně zadržel. O konečném výsledku to nic neříká.</dd>
<dt>pokuta</dt><dd>Pokuta, peněžitý trest nebo jiná peněžní sankce.</dd>
<dt>objem peněz</dt><dd>Kolik peněz v kauze prošlo, například zakázky, nákupy, dary nebo výdaje. <strong>Neznamená to, že o ně stát přišel.</strong></dd>
</dl>
<p><strong>Na ose, při řazení a ve filtru podle částky objem peněz nepoužíváme.</strong> Číslo bez souvislostí by mohlo vyvolat dojem, že o ty peníze někdo přišel, i když šlo o běžný obchod s protihodnotou. Objem proto ukazujeme jen v detailu kauzy, vždy s popisem, o jaké peníze jde.</p>
<p>Škodu uvádíme jen tehdy, když ji vyčíslila policie, obžaloba nebo soud. Částky různého druhu nesčítáme. Částku z cizí měny nepřepočítáváme; pro řazení a filtr podle částky ji jen přibližně převedeme na koruny, přepočtené číslo ale nikde neukazujeme. Pokutu, která nenabyla právní moci nebo byla zrušena, na ose neukazujeme.</p>`,
    },
    {
      id: "strana",
      nadpis: "Stanovisko dotčené strany",
      shrnuti: "U každé kauzy je stanovisko Andreje Babiše, jeho obhajoby, firem nebo hnutí, s vlastním zdrojem.",
      html: `<p>Každá kauza obsahuje <strong>stanovisko dotčené strany</strong>, tedy vyjádření Andreje Babiše, jeho obhajoby, mluvčího, jeho firem nebo hnutí. I stanovisko má svůj zdroj.</p>
<p>Kauzu bez stanoviska nezveřejníme. Pokud se dotčená strana k věci veřejně nevyjádřila, uvedeme to.</p>`,
    },
    {
      id: "postup",
      nadpis: "Jak vzniká záznam",
      shrnuti: "Koncept, ověření každého zdroje člověkem, datum ověření, zveřejnění. Bez zdroje se web technicky nesestaví.",
      html: `<ol class="kroky"><li>Vznikne koncept kauzy se zdroji. Do ověření není veřejný.</li>
<li>Člověk otevře každý zdroj a ověří, že tvrzení skutečně podporuje.</li>
<li>Zapíše se datum ověření a kauza se zveřejní.</li></ol>
<p>Pravidla hlídá i stroj. Když kauze chybí zdroj, stanovisko dotčené strany, stav řízení nebo datum ověření, web se nesestaví. Ke zdrojům ukládáme archivní kopie pro případ, že původní článek zmizí.</p>`,
    },
    {
      id: "opravy",
      nadpis: "Opravy a historie změn",
      shrnuti: "Každá změna je veřejně dohledatelná. Chybu nám můžete nahlásit e-mailem nebo přes GitHub.",
      html: `<p>Celý archiv je veřejný repozitář, takže <strong>každá změna má datum a je dohledatelná</strong>. U věcné opravy přidáme ke kauze viditelnou poznámku, co a proč se změnilo.</p>
<p>Našli jste chybu, nebo znáte kauzu, která chybí? Napište na <a href="mailto:nenechmevyhnit@gmail.com">nenechmevyhnit@gmail.com</a> nebo navrhněte úpravu přes GitHub. Každý návrh projde stejnými pravidly.</p>`,
    },
    {
      id: "stavy",
      nadpis: "Slovníček stavů řízení",
      shrnuti: "Co přesně znamená „obžaloba“, „nepravomocně zproštěn“ nebo „úřední zjištění“.",
      html: `<dl class="slovnicek">
<dt>Prověřování</dt><dd>Policie zjišťuje, zda se stal trestný čin. Nikdo zatím není obviněn.</dd>
<dt>Obvinění</dt><dd>Policie zahájila trestní stíhání konkrétní osoby.</dd>
<dt>Obžaloba</dt><dd>Státní zástupce podal k soudu obžalobu.</dd>
<dt>Nepravomocně odsouzen / zproštěn</dt><dd>Soud rozhodl, ale proti rozhodnutí se lze odvolat.</dd>
<dt>Pravomocně odsouzen / zproštěn</dt><dd>Rozhodnutí už nelze napadnout řádným opravným prostředkem.</dd>
<dt>Odloženo</dt><dd>Věc byla odložena bez zahájení trestního stíhání.</dd>
<dt>Zastaveno</dt><dd>Trestní stíhání skončilo bez rozhodnutí soudu o vině.</dd>
<dt>Promlčeno</dt><dd>Uplynula zákonná lhůta, čin už nelze stíhat.</dd>
<dt>Úřední zjištění</dt><dd>Závěr úřadu mimo trestní řízení, například audit Evropské komise nebo NKÚ.</dd>
</dl>`,
    },
    ...(sPravidly ? [{
      id: "pravidla",
      nadpis: "Zákony a nařízení",
      shrnuti: "Zákony, nařízení a další pravidla současné vlády, u kterých rozbor archivu ukazuje prospěch pro Andreje Babiše nebo Agrofert, nebo která mění kontrolu moci a instituce na to upozornily.",
      html: `<p>Vedle kauz archiv zaznamenává <strong>zákony a nařízení</strong> v širším smyslu: zákony a jejich novely, pozměňovací návrhy, nařízení vlády, vyhlášky ministerstev, pravidla dotačních programů, usnesení vlády a pokyny ministerstev s obecnou působností. Zapisujeme je od chvíle, kdy jsou oficiálně předložené nebo zveřejněné, a průběžně doplňujeme, jak projednávání pokračuje. Záznamy nemažeme: zamítnutý nebo stažený návrh zůstává v archivu s tímto stavem.</p>
<p>Změna pravidla do archivu patří ze dvou důvodů: když rozbor ukáže prospěch pro Andreje Babiše nebo Agrofert, nebo když mění kontrolu moci a instituce nebo profesní organizace na to upozornila (viz níže). Kvůli prospěchu patří do archivu, když splní <strong>všechny</strong> tyto podmínky:</p>
<ul><li>má oficiální text (sněmovní tisk, připomínkové řízení, Sbírka zákonů nebo zveřejněná výzva),</li>
<li>předložila nebo vydala ji vláda jmenovaná 9. 12. 2025, její ministerstva, státní fondy, nebo poslanci a senátoři vládní koalice,</li>
<li>rozbor ukáže prospěch pro Andreje Babiše osobně nebo pro Agrofert,</li>
<li>dopadá na ně zvlášť, ne plošně na všechny: na úzký obor, příjemce konkrétní dotace, členy vlády nebo na řízení, které Babiš či Agrofert vedou.</li></ul>
<p>Plošné změny, třeba sazbu DPH pro všechny, sem nezařazujeme. Rozhodnutí v jednotlivém případě patří ke kauze, které se týká.</p>
<p>Zatím nezařazujeme ani záměry bez oficiálního textu, změny, u kterých rozbor vede jen k jiným podnikům než k Agrofertu, a kroky z let 2014–2021, kdy byl Andrej Babiš ministrem financí a premiérem.</p>
<h3 id="retezec">Rozbor krok za krokem</h3>
<p>U každé změny sestavíme z textu předpisu <strong>řetězec</strong>: co pravidlo mění, jakého faktu o Babišovi nebo Agrofertu se to týká a jaký z toho plyne důsledek. Každý krok má vlastní zdroj a první krok vždy cituje text předpisu. Krok, který stojí na odhadu, je viditelně označený. Každá změna má navíc krátké shrnutí, proč by prospěla. Je to jedna až dvě věty se zdrojem, podrobnosti jsou v řetězci.</p>
<dl class="slovnicek">
<dt>prospěch doložen</dt><dd>Žádný krok řetězce nestojí na odhadu.</dd>
<dt>prospěch pravděpodobný</dt><dd>Aspoň jeden krok stojí na odhadu, například jak se nová lhůta uplatní na už zahájená řízení.</dd>
</dl>
<p>Kde z rozboru nic jasného nevyjde, změnu nezveřejníme. <strong>Závěr je rozbor archivu, ne úřední zjištění.</strong> U každé změny uvádíme stanovisko předkladatele. Když chybí, uvedeme aspoň účel, který předkladatel napsal do důvodové zprávy nebo odůvodnění.</p>
<h3 id="cesta">Cesta předložení</h3>
<p>Vládní návrh zákona projde meziresortním připomínkovým řízením, hodnocením dopadů regulace (RIA) a Legislativní radou vlády. U jiných cest tyto kontroly odpadají a u záznamu to uvádíme:</p>
<ul><li><strong>poslanecký a senátní návrh:</strong> bez meziresortního připomínkového řízení a bez hodnocení dopadů regulace,</li>
<li><strong>pozměňovací návrh:</strong> navíc bez stanoviska vlády a bez prvního čtení, protože se podává až ve druhém čtení jako změna projednávaného návrhu.</li></ul>
<p>Jde o popis legislativního procesu, ne o hodnocení.</p>
<h3 id="kontrola-moci">Dopad na kontrolu moci</h3>
<p>Druhým důvodem zařazení je změna, která se týká kontroly moci nebo dalších institucí a pravidel státu, třeba státní služby, rozpočtových pravidel nebo neziskových organizací. Do archivu patří, když splní <strong>všechny</strong> tyto podmínky:</p>
<ul><li>má oficiální text a předložila nebo vydala ji vládní většina, stejně jako u prospěchu,</li>
<li><strong>institucionální znak:</strong> mění pravomoci, nezávislost, způsob jmenování nebo odvolání, nebo financování některé z těchto institucí a pravidel: ${seznamInstituci},</li>
<li><strong>procedurální znak:</strong> ${seznamProcedur}. Přílepek je pozměňovací návrh mimo předmět projednávaného zákona, legislativní nouze je projednání ve stavu legislativní nouze,</li>
<li>na tento znak upozornila aspoň jedna instituce (${upozornovateleTypu('instituce')}) nebo profesní organizace (${upozornovateleTypu('profesni-organizace')}). Upozornění se musí týkat právě tohoto pravidla a tohoto znaku, ne obecného tématu.</li></ul>
<p>Kritika jen od opozice, watchdogů nebo médií k zařazení nestačí. Hodnotící slova ve vlastním textu nepoužíváme. Zapisujeme, co pravidlo mění, s odkazem na ustanovení, a kdo na to upozornil. <strong>Záznam dopadu na kontrolu moci je záznam upozornění institucí, ne hodnocení archivu.</strong> Personální a jiná jednotlivá rozhodnutí sem nepatří.</p>
<h3 id="hlasovani">Hlasování</h3>
<p>U zákonů projednávaných ve Sněmovně zapisujeme, jak hlasovaly poslanecké kluby a jednotliví poslanci. Zapisujeme <strong>hlasování o obsahu</strong> (zamítnutí nebo propuštění v 1. čtení, přikázání výboru, schválení ve 3. čtení, hlasování o vetu prezidenta nebo o návrhu Senátu, u pozměňovacího návrhu hlasování o něm) a <strong>procedurální hlasování</strong>, která rozhodla o osudu návrhu: zařazení na pořad, vyřazení nebo přesunutí bodu, zkrácení lhůt nebo schválení už v 1. čtení. Procedurální hlasování rozhoduje o pořadu nebo způsobu projednání, ne o obsahu návrhu, a vždy ho tak označujeme. Hlasování vybíráme, nezapisujeme automaticky každé hlasování k tisku.</p>
<p>Údaje pocházejí z <a href="https://www.psp.cz/sqw/hp.sqw?k=1300">otevřených dat Poslanecké sněmovny</a>. Stahuje je veřejný skript <code>scripts/stahni-hlasovani.ts</code>. U každého hlasování uvádíme datum stažení a odkaz na jeho stránku na psp.cz, kde lze čísla ověřit. Klub poslance je ten, ve kterém byl v den hlasování.</p>
<dl class="slovnicek hl-slovnicek">
<dt>zdržel se nebo nehlasoval</dt><dd>Poslanec byl přihlášen, ale nehlasoval pro ani proti. Data PSP u jednotlivých poslanců tyto dvě možnosti nerozlišují, souhrn hlasování je uvádí zvlášť.</dd>
<dt>omluven</dt><dd>Poslanec nebyl přihlášen a na dobu hlasování měl omluvu z jednání.</dd>
<dt>nepřihlášen</dt><dd>Poslanec nebyl přihlášen a omluvu v evidenci neměl.</dd>
</dl>
<p>U nařízení vlády, usnesení vlády, pravidel dotačních programů a pokynů ministerstev hlasování neuvádíme: jak hlasovali jednotliví členové vlády, se nezveřejňuje, a o pravidlech programů a pokynech se nehlasuje vůbec.</p>
<h3 id="vyhrady">Výhrady a jazyk</h3>
<p>Uvádíme výhrady institucí, jako je Legislativní rada vlády, ÚOHS, NKÚ, Evropská komise nebo veřejný ochránce práv. Výhrady opozice patří do souvislostí a označujeme je jako politické. Dokud změna neplatí, píšeme podmiňovacím způsobem: novela <em>by zkrátila</em>, <em>umožnila by</em>. Upozornění ke znaku kontroly moci neřadíme mezi výhrady, uvádíme je v záložce Kontrola moci (oddíl Dopad na kontrolu moci).</p>`,
    }, {
      id: "oblasti",
      nadpis: "Oblasti",
      shrnuti: "Změny pravidel seskupené podle oblastí státu, u každé změny co by znamenala pro vás a u oblasti citace institucí, odborníků a vlády.",
      html: `<p>Výchozí pohled změn pravidel je rozdělený do <strong>oblastí státu</strong>: ${seznamOblasti}. Jedna změna může patřit do víc oblastí. Oblasti ukazují, co se v jedné části státu mění za sebou. <strong>Kam to celé vede, archiv sám neříká.</strong> Skládá vedle sebe doložené změny a citace a závěr nechává na vás.</p>
<h3 id="pro-vas">Co by to znamenalo pro vás</h3>
<p>U každé změny je jedna až tři věty obyčejnou řečí: koho se změna týká a co se pro něj změní. Píšeme bez čísel paragrafů a bez nevysvětlených zkratek. Uvádíme jen důsledky, které plynou z textu předpisu, z důvodové zprávy, z hodnocení dopadů regulace nebo z upozornění instituce, a každá věta má zdroj. Další vývoj nedomýšlíme. Když se změna běžného člověka přímo netýká, napíšeme to. Dokud změna neplatí, píšeme podmiňovacím způsobem.</p>
<h3 id="k-cemu">K čemu to je</h3>
<p>Úvod oblasti vysvětluje, co daná instituce nebo oblast dělá pro běžného člověka. Opírá se o Ústavu, zákon nebo oficiální stránky instituce. O současné vládě ani o změnách úvod nic neříká.</p>
<h3 id="hodnoceni">Jak to hodnotí</h3>
<p>U oblasti uvádíme doslovné citace s mluvčím, funkcí, datem a zdrojem. Citujeme jen:</p>
<ul><li><strong>vládu:</strong> člena vlády, předkladatele nebo úřad vlády. Stanovisko vlády má každá oblast, u které citace jsou. Když vláda veřejně nereagovala, citujeme účel z důvodové zprávy,</li>
<li><strong>instituce:</strong> veřejné instituce, mezinárodní organizace a profesní organizace, které smějí upozornit na dopad na kontrolu moci,</li>
<li><strong>odborníky:</strong> pojmenované osoby s ověřitelnou odbornou rolí v oboru, například vyučující vysoké školy, výzkumníky Akademie věd nebo bývalé soudce Ústavního či Nejvyššího soudu.</li></ul>
<p>Necitujeme politiky mimo vládu, novináře, komentátory ani watchdogy. Mohou být zdrojem faktů, ne hodnocení. Odborníky, kteří postup vlády hájí, uvádíme za stejných podmínek jako kritiky. <strong>Výběr citací podle metodiky, ne hodnocení archivu.</strong></p>`,
    }] : []),
  ],
});
