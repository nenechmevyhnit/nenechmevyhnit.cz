import type { KauzaZaznam } from './validace';
import { WEB } from './web';

/** Entity, které Google už zná. Napojení přes sameAs je v celém zadání jediná věc,
 *  která působí přímo na obecné dotazy („Babiš kauzy“). Identifikátory ověřeny na wikidata.org. */
export const BABIS_WIKIDATA = 'https://www.wikidata.org/wiki/Q10819807';
export const AGROFERT_WIKIDATA = 'https://www.wikidata.org/wiki/Q5374450';

const adresa = (cesta: string): string => `${WEB.domena}${cesta}`;

export const organizace = () => ({
  '@type': 'Organization',
  name: WEB.nazev,
  url: adresa('/'),
  description: WEB.popis,
});

export const webJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: WEB.nazev,
  url: adresa('/'),
  description: WEB.popis,
  inLanguage: 'cs',
  publisher: organizace(),
});

const drobecky = (nazev: string, cesta: string) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Domů', item: adresa('/') },
    { '@type': 'ListItem', position: 2, name: 'Kauzy', item: adresa('/') },
    { '@type': 'ListItem', position: 3, name: nazev, item: adresa(cesta) },
  ],
});

export function kauzaJsonLd({ slug, kauza }: KauzaZaznam) {
  const cesta = `/kauzy/${slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: kauza.nazev,
    description: kauza.shrnuti,
    inLanguage: 'cs',
    mainEntityOfPage: adresa(cesta),
    // datum vydání nemáme a nebudeme ho vymýšlet; overeno je datum poslední kontroly
    ...(kauza.overeno ? { dateModified: kauza.overeno } : {}),
    publisher: organizace(),
    about: [
      { '@type': 'Person', name: 'Andrej Babiš', sameAs: BABIS_WIKIDATA },
      { '@type': 'Organization', name: 'Agrofert', sameAs: AGROFERT_WIKIDATA },
    ],
    citation: kauza.zdroje.map(z => ({
      '@type': 'CreativeWork',
      name: z.titulek,
      url: z.url,
      datePublished: z.datum,
      publisher: { '@type': 'Organization', name: z.vydavatel },
    })),
    ...(kauza.opravy.length
      ? { correction: kauza.opravy.map(o => ({ '@type': 'CorrectionComment', text: o.popis, dateCreated: o.datum })) }
      : {}),
    breadcrumb: drobecky(kauza.nazev, cesta),
  };
}
