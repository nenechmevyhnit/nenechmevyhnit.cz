/** Druhy částek u kauzy. Škodu tvrdí jen druhy skoda-* (vyčíslila ji policie, obžaloba nebo soud); ostatní druhy škodu netvrdí. */
export const DRUHY_CASTEK = [
  'dotace', 'skoda-obvineni', 'skoda-obzaloba', 'skoda-rozsudek', 'vraceno', 'korekce', 'pozastaveno', 'pokuta', 'objem',
] as const;
export type DruhCastky = (typeof DRUHY_CASTEK)[number];

export const MENY = ['CZK', 'EUR', 'USD'] as const;
export const PRESNOSTI = ['pres', 'temer', 'asi'] as const;

export type Castka = {
  castka: number; mena: (typeof MENY)[number]; presnost?: (typeof PRESNOSTI)[number];
  druh: DruhCastky; popis: string; zdroje: number[];
};

const POPISKY: Record<DruhCastky, string> = {
  'dotace': 'dotace',
  'skoda-obvineni': 'škoda podle obvinění',
  'skoda-obzaloba': 'škoda podle obžaloby',
  'skoda-rozsudek': 'škoda podle rozsudku',
  'vraceno': 'vráceno nebo k vrácení',
  'korekce': 'finanční korekce',
  'pozastaveno': 'pozastavené platby',
  'pokuta': 'pokuta',
  'objem': 'objem peněz, ne škoda',
};

export function popisekDruhu(d: DruhCastky): string {
  return POPISKY[d];
}

const NB = ' ';
const JEDNOTKA = { CZK: 'Kč', EUR: 'eur', USD: 'USD' } as const;
const PREDPONA = { pres: 'přes', temer: 'téměř', asi: 'asi' } as const;

/** Číslo s nejvýš dvěma desetinnými místy a desetinnou čárkou; nuly na konci zahodí. */
const desetinne = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
const poTisicich = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB);

type CastkaKZobrazeni = Pick<Castka, 'castka' | 'mena' | 'presnost'>;

function sestav(c: CastkaKZobrazeni, cislo: string): string {
  const text = `${cislo}${NB}${JEDNOTKA[c.mena]}`;
  return c.presnost ? `${PREDPONA[c.presnost]}${NB}${text}` : text;
}

/** Částka česky pro čtenáře: „přes 19 mld. Kč“, „52,8 mil. Kč“, „500 000 Kč“. */
export function castkaText(c: CastkaKZobrazeni): string {
  const n = c.castka;
  const cislo = n >= 1e9 ? `${desetinne(n / 1e9)}${NB}mld.`
    : n >= 1e6 ? `${desetinne(n / 1e6)}${NB}mil.`
    : poTisicich(n);
  return sestav(c, cislo);
}

/** Na tři platné číslice; „přes“ zaokrouhlí dolů a „téměř“ nahoru, aby předpona pořád platila. */
function naTriCislice(x: number, presnost: CastkaKZobrazeni['presnost']): number {
  const f = 10 ** (x >= 100 ? 0 : x >= 10 ? 1 : 2);
  const y = x * f;
  const r = presnost === 'pres' ? Math.floor(y + 1e-9) : presnost === 'temer' ? Math.ceil(y - 1e-9) : Math.round(y);
  return r / f;
}

/** Zkrácená částka pro seznam na ose: „285 mil. Kč“ místo „285,23 mil. Kč“. Přesná částka je v detailu. */
export function castkaKratce(c: CastkaKZobrazeni): string {
  const n = c.castka;
  if (n < 1e6) return sestav(c, poTisicich(n));
  let mld = n >= 1e9;
  let x = naTriCislice(n / (mld ? 1e9 : 1e6), c.presnost);
  if (!mld && x >= 1000) { mld = true; x = naTriCislice(x / 1000, c.presnost); }
  return sestav(c, `${desetinne(x)}${NB}${mld ? 'mld.' : 'mil.'}`);
}

/** Částka pro osu, řazení a filtr: první, která není objem. Objem sám neříká, že někdo o peníze přišel
 *  (za zakázku nebo nákup obvykle stojí protihodnota), proto se ukazuje jen v detailu se svým popisem. */
export function hlavniCastka<T extends Pick<Castka, 'druh'>>(castky: T[]): T | undefined {
  return castky.find(c => c.druh !== 'objem');
}

/** Přibližné kurzy jen pro pořadí při řazení; přepočtená částka se na webu nikdy nezobrazuje ani nesčítá. */
const KURZ_PRO_RAZENI = { CZK: 1, EUR: 25, USD: 23 } as const;

export function castkaProRazeni(c: Pick<Castka, 'castka' | 'mena'>): number {
  return c.castka * KURZ_PRO_RAZENI[c.mena];
}
