// Texty převzaté doslova ze schválených prototypů (design/03-detail/_oprojektu.py).
import type { SekceStranky } from './metodika';

export const oProjektu: { sekce: SekceStranky[] } = {
  sekce: [
    {
      id: "proc",
      nadpis: "Proč archiv vznikl",
      shrnuti: "Kauzy zapadají. Za půl roku si nikdo nepamatuje, co se stalo, a právě na to se spoléhá.",
      html: `<p>Každý týden přijde nová kauza, novela nebo rozhodnutí a ta předchozí zapadne. Za půl roku si ji pamatuje málokdo, za tři roky skoro nikdo.</p>
<p>Myšlenka vzešla z rozhovoru v podcastu <em>Kecy a politika</em>: někdo by měl tyhle věci soustavně zapisovat a archivovat, jinak zmizí. Tento web se o to pokouší, přehledně, v čase a se zdrojem u každého tvrzení.</p>
<p>Název odkazuje na rčení „nechat věc vyhnít“, tedy nechat ji ležet, dokud sama nevyšumí. Archiv drží kauzy na očích i potom, co zmizí ze zpráv.</p>`,
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
      html: `<p>Texty archivu jsou pod licencí <strong>Creative Commons Uveďte původ 4.0</strong>. Můžete je sdílet, citovat i dál zpracovávat, stačí uvést „Nenechme vyhnít“ a odkaz.</p>
<p>Citované články a dokumenty patří svým autorům, odkazujeme na ně. Portrét na hlavní stránce: Vox España, Wikimedia Commons, licence CC0.</p>`,
    },
    {
      id: "kontakt",
      nadpis: "Kontakt",
      shrnuti: "nenechmevyhnit@gmail.com. Opravy mají přednost před vším ostatním.",
      html: `<p>Pište na <a href="mailto:nenechmevyhnit@gmail.com">nenechmevyhnit@gmail.com</a>.</p>
<p>Upozornění na věcnou chybu řešíme přednostně. Pokud jste dotčená osoba nebo její zástupce a chcete doplnit stanovisko, ozvěte se, zveřejníme ho.</p>`,
    },
  ],
};
