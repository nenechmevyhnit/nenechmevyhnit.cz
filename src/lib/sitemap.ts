import { nactiKauzy, nactiPravidla, nactiOblasti, nactiHlasovani, maPravidla } from './kauzy';
import { WEB } from './web';

export type Zapis = { cesta: string; zmeneno?: string };

/** Nejnovější z dat ve tvaru RRRR-MM-DD. Hodnoty null (neověřené koncepty) vynechá. */
const nejnovejsi = (data: (string | null)[]): string | undefined => {
  const platna = data.filter((d): d is string => typeof d === 'string');
  return platna.length ? platna.slice().sort().at(-1) : undefined;
};

/** Seznam adres pro sitemapu. Skládá se ze stejných loaderů obsahu, jaké používají getStaticPaths,
 *  takže nemůže nabídnout adresu, kterou build nevytvoří. Stránka 404 do sitemapy nepatří. */
export function adresy(): Zapis[] {
  const kauzy = nactiKauzy();
  const zapisy: Zapis[] = [
    { cesta: '/', zmeneno: nejnovejsi(kauzy.map(z => z.kauza.overeno)) },
    ...kauzy.map(z => ({ cesta: `/kauzy/${z.slug}/`, zmeneno: z.kauza.overeno ?? undefined })),
  ];

  if (maPravidla()) {
    const pravidla = nactiPravidla();
    zapisy.push({ cesta: '/pravidla/', zmeneno: nejnovejsi(pravidla.map(z => z.pravidlo.overeno)) });
    for (const z of pravidla) zapisy.push({ cesta: `/pravidla/${z.slug}/`, zmeneno: z.pravidlo.overeno ?? undefined });
    for (const o of nactiOblasti()) {
      zapisy.push({ cesta: `/pravidla/oblasti/${o.id}/`, zmeneno: nejnovejsi(o.zmeny.map(z => z.pravidlo.overeno)) });
    }
  }

  // u hlasování je datum poslední změny stránky den, kdy se snímek stáhl z PSP, ne den hlasování
  for (const [id, s] of nactiHlasovani()) zapisy.push({ cesta: `/hlasovani/${id}/`, zmeneno: s.stazeno });

  zapisy.push({ cesta: '/metodika/' }, { cesta: '/o-projektu/' });
  return zapisy;
}

export function sitemapaXml(zapisy: Zapis[]): string {
  const polozka = (z: Zapis) => [
    '  <url>',
    `    <loc>${WEB.domena}${z.cesta}</loc>`,
    ...(z.zmeneno ? [`    <lastmod>${z.zmeneno}</lastmod>`] : []),
    '  </url>',
  ].join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...zapisy.map(polozka),
    '</urlset>',
    '',
  ].join('\n');
}
