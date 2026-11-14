/** Jediné místo s údaji o webu. Název ani doménu nikam nepiš ručně:
 *  tests/unit/kostra.test.ts hlídá, že se nevrátí starý název projektu. */
export const WEB = {
  nazev: 'Posuďte sami',
  domena: 'https://posudtesami.cz',
  popis: 'Archiv kauz Andreje Babiše přehledně, s daty a zdroji. Každé tvrzení má zdroj, každá kauza stanovisko dotčené strany.',
} as const;

/** Titulek stránky: „<co> — Posuďte sami“. */
export const titulek = (co: string): string => `${co} — ${WEB.nazev}`;

/** Google ukazuje v titulku asi 60–65 znaků, zbytek odřízne. */
export const MAX_TITULEK = 65;
/** Delší popis Google ve výsledku zkrátí sám, a to i uprostřed slova. */
export const MAX_POPIS = 155;

const rozsahLet = (od: number, doRok: number | null): string =>
  doRok === null ? `${od}–dosud` : od === doRok ? String(od) : `${od}–${doRok}`;

/** Titulek stránky kauzy. Roky v titulku berou dotazy typu „čapí hnízdo 2008“.
 *  U dlouhých názvů (limit je 36 znaků) se vypustí prostřední část, ať se titulek vejde. */
export function titulekKauzy(nazev: string, od: number, doRok: number | null): string {
  const roky = rozsahLet(od, doRok);
  const plny = titulek(`${nazev} ${roky}: časová osa a zdroje`);
  if (plny.length <= MAX_TITULEK) return plny;
  const kratsi = titulek(`${nazev} ${roky}`);
  return kratsi.length <= MAX_TITULEK ? kratsi : titulek(nazev);
}

/** Popis stránky pro vyhledávače: zkrátí na hranici slova, ať Google neřízne uprostřed. */
export function popisKratky(text: string): string {
  if (text.length <= MAX_POPIS) return text;
  const rez = text.slice(0, MAX_POPIS);
  const mezera = rez.lastIndexOf(' ');
  return rez.slice(0, mezera > 0 ? mezera : MAX_POPIS).replace(/[\s,;:.–—-]+$/, '') + '…';
}
