/** Jediné místo s údaji o webu. Název ani doménu nikam nepiš ručně:
 *  tests/unit/kostra.test.ts hlídá, že se nevrátí starý název projektu.
 *  Výjimka je public/robots.txt — statický soubor nic importovat nemůže,
 *  shodu s doménou odtud hlídá tests/unit/robots.test.ts. */
export const WEB = {
  nazev: 'Posuďte sami',
  domena: 'https://posudtesami.cz',
  popis: 'Archiv kauz Andreje Babiše přehledně, s daty a zdroji. Každé tvrzení má zdroj, každá kauza stanovisko dotčené strany.',
} as const;

/** Google ukazuje v titulku asi 60–65 znaků, zbytek odřízne. */
export const MAX_TITULEK = 65;
/** Delší popis Google ve výsledku zkrátí sám, a to i uprostřed slova. */
export const MAX_POPIS = 155;

/** Titulek stránky: „<co> — Posuďte sami“. Když by se s příponou nevešel do limitu,
 *  obětuje se přípona: celý název stránky je pro hledajícího užitečnější než jméno webu
 *  (názvy pravidel smějí mít 60 znaků, samotná přípona bere 15). */
export function titulek(co: string): string {
  const plny = `${co} — ${WEB.nazev}`;
  return plny.length <= MAX_TITULEK ? plny : co;
}

const rozsahLet = (od: number, doRok: number | null): string =>
  doRok === null ? `${od}–dosud` : od === doRok ? String(od) : `${od}–${doRok}`;

/** Titulek stránky kauzy. Roky berou dotazy typu „čapí hnízdo 2008“, dovětek říká,
 *  co na stránce navíc je. Co se nevejde, to postupně odpadá: nejdřív dovětek, pak roky. */
export function titulekKauzy(nazev: string, od: number, doRok: number | null): string {
  const roky = rozsahLet(od, doRok);
  const sDovetkem = `${nazev} ${roky}: časová osa a zdroje`;
  if (sDovetkem.length <= MAX_TITULEK) return titulek(sDovetkem);
  const sRoky = `${nazev} ${roky}`;
  return sRoky.length <= MAX_TITULEK ? titulek(sRoky) : titulek(nazev);
}

/** Popis stránky pro vyhledávače: zkrátí na hranici slova, ať Google neřízne uprostřed. */
export function popisKratky(text: string): string {
  if (text.length <= MAX_POPIS) return text;
  const rez = text.slice(0, MAX_POPIS);
  const mezera = rez.lastIndexOf(' ');
  return rez.slice(0, mezera > 0 ? mezera : MAX_POPIS).replace(/[\s,;:.–—-]+$/, '') + '…';
}
