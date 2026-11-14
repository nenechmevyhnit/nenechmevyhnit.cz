// Texty převzaté doslova ze schválených prototypů (design/03-detail/_oprojektu.py).
import type { SekceStranky } from './metodika';

/** Věta o změnách pravidel se zobrazí jen tehdy, když archiv nějaká pravidla má. */
export const oProjektu = (sPravidly: boolean): { sekce: SekceStranky[] } => ({
  sekce: [
    {
      id: "proc",
      nadpis: "Proč archiv vznikl",
      shrnuti: "Kauzy zapadají. Za půl roku si málokdo pamatuje, co se stalo.",
      html: `<p>Každý týden přijde nová kauza, novela nebo rozhodnutí a ta předchozí zapadne. Za půl roku si ji pamatuje málokdo, za tři roky skoro nikdo.${sPravidly ? ' Proto archiv vedle kauz zapisuje i zákony a nařízení, u kterých rozbor archivu ukazuje prospěch pro Andreje Babiše nebo Agrofert, a takové, které mění kontrolu moci a na které upozornily instituce.' : ''}</p>
<p>Myšlenka vzešla z rozhovoru v podcastu <em>Kecy a politika</em>: někdo by měl tyhle věci soustavně zapisovat a archivovat, jinak zmizí. Tento web se o to pokouší, přehledně, v čase a se zdrojem u každého tvrzení.</p>
<p>Název popisuje, jak archiv funguje. Nikomu neříká, co si má myslet. Ke každému tvrzení dává zdroj, ke každé kauze stanovisko dotčené strany a úsudek nechává na vás.</p>`,
    },
    {
      id: "kdo",
      nadpis: "Kdo za webem stojí",
      shrnuti: "Nezávislý volič. Bez vazby na politickou stranu, hnutí nebo sponzora.",
      html: `<p>Web vede jeden člověk, nezávislý volič, který není členem žádné politické strany ani hnutí a nikdo ho neplatí.</p>
<p>Autor zůstává anonymní záměrně: obsah se má posuzovat podle zdrojů, ne podle toho, kdo ho napsal. Každé tvrzení má odkaz na zdroj, takže si ho můžete ověřit sami a nemusíte nikomu věřit na slovo.</p>`,
    },
    {
      id: "penize",
      nadpis: "Financování",
      shrnuti: "Žádné peníze, žádné reklamy. Web běží zdarma.",
      html: `<p>Web nemá žádné příjmy. Jediný výdaj je doména, kterou autor platí ze svého. Web běží zdarma na službě GitHub Pages, nemá reklamy a nepřijímá dary od politických stran, hnutí ani firem.</p>
<p>Kdyby se cokoli z toho změnilo, zveřejníme to právě tady, s datem.</p>`,
    },
    {
      id: "soukromi",
      nadpis: "Soukromí",
      shrnuti: "Žádné sledování, žádné cookies, žádné skripty třetích stran.",
      html: `<p>Sami žádné údaje o návštěvnících nesbíráme. Web nepoužívá analytiku, cookies ani skripty reklamních a sociálních sítí. Písma hostujeme sami.</p>
<p>Hosting GitHub Pages ukládá kvůli provozu a bezpečnosti běžné technické záznamy o přístupech, například IP adresu. My k nim přístup nemáme.</p>
<p>Proto tu také nenajdete lištu se souhlasem s cookies: není k čemu souhlasit.</p>`,
    },
    {
      id: "dotcene-osoby",
      nadpis: "Pokud o vás píšeme",
      shrnuti: "Máte právo na opravu, na zveřejnění svého stanoviska a na námitku proti konkrétnímu zveřejnění.",
      html: `<p>Archiv zpracovává osobní údaje pro novinářské účely podle § 17 zákona č. 110/2019 Sb., o zpracování osobních údajů. Pro takové zpracování platí obecné nařízení o ochraně osobních údajů (GDPR) jen v rozsahu, který tentýž zákon stanoví.</p>
<p>Vycházíme z veřejných zdrojů: z úředních dokumentů, veřejných rejstříků a z médií. Zapisujeme jen to, co už bylo zveřejněno a co je k pochopení věci potřeba. Nikoho nesledujeme, údaje nikomu nepředáváme a nikoho podle nich automaticky nevyhodnocujeme.</p>
<p>Pokud o vás archiv píše, můžete:</p>
<ul><li><strong>žádat opravu věcné chyby.</strong> Opravy mají přednost před vším ostatním. U věcné opravy zůstane u záznamu viditelná poznámka, co a proč se změnilo,</li>
<li><strong>poslat své stanovisko.</strong> Zveřejníme ho u záznamu, kterého se týká,</li>
<li><strong>podat námitku proti konkrétnímu zveřejnění</strong> podle § 22 téhož zákona. Napište, o které zveřejnění jde a proč podle vás váš zájem převáží nad zájmem na tom, aby byla věc veřejně dostupná. Vždy vám odpovíme, jak jsme s námitkou naložili.</li></ul>
<p>Na nezveřejněné koncepty a na zdroje se vztahuje ochrana zdroje a obsahu informací podle téhož zákona.</p>
<p>Pište na <a href="mailto:nenechmevyhnit@gmail.com">nenechmevyhnit@gmail.com</a>. Dozor nad zpracováním osobních údajů vykonává <a href="https://uoou.gov.cz/">Úřad pro ochranu osobních údajů</a>.</p>`,
    },
    {
      id: "prispet",
      nadpis: "Jak přispět",
      shrnuti: "Navrhněte kauzu, doplnění nebo opravu e-mailem nebo přes GitHub.",
      html: `<ol class="kroky"><li>Pošlete návrh na <a href="mailto:nenechmevyhnit@gmail.com">nenechmevyhnit@gmail.com</a> nebo založte návrh na GitHubu.</li>
<li>Přiložte zdroje. Bez nich návrh nemůžeme přijmout.</li>
<li>Návrh projde stejnými pravidly jako každá kauza (viz <a href="/metodika/">Metodika</a>). Když ho přijmeme, uvidíte změnu v historii.</li></ol>`,
    },
    {
      id: "licence",
      nadpis: "Sdílení a citace",
      shrnuti: "Texty archivu můžete volně sdílet a citovat s uvedením zdroje.",
      html: `<p>Texty archivu jsou pod licencí <strong>Creative Commons Uveďte původ 4.0</strong>. Můžete je sdílet, citovat i dál zpracovávat, stačí uvést „Posuďte sami“ a odkaz.</p>
<p>Citované články a dokumenty patří svým autorům, odkazujeme na ně. Portrét na hlavní stránce: Vox España, Wikimedia Commons, licence CC0.${sPravidly ? ' Socha Spravedlnosti na stránce Zákony a nařízení: Renate007, Wikimedia Commons, licence CC BY-SA 4.0, upraveno (odstraněné pozadí).' : ''}</p>`,
    },
    {
      id: "kontakt",
      nadpis: "Kontakt",
      shrnuti: "nenechmevyhnit@gmail.com. Opravy mají přednost před vším ostatním.",
      html: `<p>Pište na <a href="mailto:nenechmevyhnit@gmail.com">nenechmevyhnit@gmail.com</a>.</p>
<p>Upozornění na věcnou chybu řešíme přednostně. Pokud jste dotčená osoba nebo její zástupce a chcete doplnit stanovisko, ozvěte se, zveřejníme ho.</p>`,
    },
  ],
});
