// Texty převzaté doslova ze schválených prototypů (design/03-detail/_metodika.py).
export type SekceStranky = { id: string; nadpis: string; shrnuti: string; html: string };

export const metodika: { platiOd: string; sekce: SekceStranky[] } = {
  platiOd: '12. 11. 2026',
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
<p>Kroky vlády jako celku zatím nezařazujeme. Archiv je na jejich pozdější zařazení připravený.</p>
<h3 id="vazby">Vazby mezi kauzami</h3>
<p>Kauzy lze kromě časové osy zobrazit jako <strong>mapu souvislostí</strong>. Ukazuje, přes které firmy, osoby a nástroje (například svěřenské fondy) jsou kauzy spojené s Andrejem Babišem a které kauzy na sebe přímo navazují.</p>
<ul><li>Každá vazba má <strong>roli</strong> z pevného seznamu (například <em>vlastní</em>, <em>příjemce dotace</em>, <em>vychází z</em>), krátké vysvětlení a <strong>zdroj</strong>. Bez zdroje se web nesestaví. Vztahy firem, osob a nástrojů mají navíc období, kdy platily.</li>
<li>Aktérem může být firma nebo nástroj, které Andrej Babiš nebo jeho firmy ovládaly, a to jen pro období, kdy je ovládaly. Osoba jen tehdy, když je veřejně činná nebo už byla jmenována ve zveřejněných kauzách v souvislosti s řízením.</li>
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
      shrnuti: "Věcně a podle stavu řízení. Žádné hodnotící přívlastky, u neuzavřených věcí platí presumpce neviny.",
      html: `<ul><li>Používáme slovesa podle skutečného stavu řízení: <em>obviněn, obžalován, zproštěn, odsouzen nepravomocně / pravomocně</em>.</li>
<li>Nepoužíváme hodnotící přívlastky ani spekulace o úmyslech.</li>
<li>U každé kauzy je vidět její aktuální stav a datum, kdy jsme ho naposledy ověřili.</li>
<li>Dokud soud pravomocně nerozhodne, platí presumpce neviny. Připomínáme to přímo u kauzy.</li></ul>`,
    },
    {
      id: "strana",
      nadpis: "Druhá strana má slovo",
      shrnuti: "U každé kauzy je stanovisko Andreje Babiše nebo jeho obhajoby, s vlastním zdrojem.",
      html: `<p>Každá kauza obsahuje <strong>stanovisko dotčené strany</strong>, tedy vyjádření Andreje Babiše, jeho obhajoby nebo mluvčího. I stanovisko má svůj zdroj.</p>
<p>Kauzu bez stanoviska nezveřejníme. Pokud se dotčená strana nevyjádřila, uvedeme to i s datem, kdy jsme o vyjádření usilovali.</p>`,
    },
    {
      id: "postup",
      nadpis: "Jak vzniká záznam",
      shrnuti: "Koncept, ověření každého zdroje člověkem, datum ověření, zveřejnění. Bez zdroje se web technicky nesestaví.",
      html: `<ol class="kroky"><li>Vznikne koncept kauzy se zdroji. Do ověření není veřejný.</li>
<li>Člověk otevře každý zdroj a ověří, že tvrzení skutečně podporuje.</li>
<li>Zapíše se datum ověření a kauza se zveřejní.</li></ol>
<p>Pravidla hlídá i stroj. Když kauze chybí zdroj, stanovisko druhé strany, stav řízení nebo datum ověření, web se nesestaví. Ke každému zdroji ukládáme archivní kopii pro případ, že původní článek zmizí.</p>`,
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
  ],
};
