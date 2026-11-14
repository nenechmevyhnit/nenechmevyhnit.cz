import { describe, it, expect } from 'vitest';
import { webJsonLd, kauzaJsonLd, BABIS_WIKIDATA, AGROFERT_WIKIDATA } from '../../src/lib/jsonld';
import { kauzaSchema } from '../../src/lib/schema';
import { platnaKauza } from './ukazka';

// ukazka.ts vrací surový objekt; teprve kauzaSchema.parse doplní výchozí hodnoty
// (opravy, akteri, navazuje, castky jako prázdná pole), se kterými jsonld.ts počítá.
const KAUZA = kauzaSchema.parse(platnaKauza());
const zaznam = { slug: 'alfa-dotace', kauza: KAUZA, telo: '' };

describe('webJsonLd', () => {
  it('popisuje web a vydavatele', () => {
    const d = webJsonLd() as any;
    expect(d['@type']).toBe('WebSite');
    expect(d.url).toBe('https://posudtesami.cz/');
    expect(d.publisher['@type']).toBe('Organization');
    expect(d.publisher.name).toBe('Posuďte sami');
  });

  it('nenabízí SearchAction, hledání je klientské', () => {
    expect(JSON.stringify(webJsonLd())).not.toContain('SearchAction');
  });
});

describe('kauzaJsonLd', () => {
  it('je Article s nadpisem, adresou a datem úpravy z data ověření', () => {
    const d = kauzaJsonLd(zaznam) as any;
    expect(d['@type']).toBe('Article');
    expect(d.headline).toBe(KAUZA.nazev);
    expect(d.mainEntityOfPage).toBe('https://posudtesami.cz/kauzy/alfa-dotace/');
    expect(d.dateModified).toBe(KAUZA.overeno);
  });

  it('nevymýšlí datum vydání kauzy, ale u citací datum článku uvádí', () => {
    const d = kauzaJsonLd(zaznam) as any;
    // u kauzy datum vydání neznáme; u citovaného zdroje je to jeho skutečné datum
    expect(d).not.toHaveProperty('datePublished');
    expect(d.citation[0].datePublished).toBe(KAUZA.zdroje[0].datum);
  });

  it('vypíše všechny zdroje jako citace s vydavatelem', () => {
    const d = kauzaJsonLd(zaznam) as any;
    expect(d.citation).toHaveLength(KAUZA.zdroje.length);
    expect(d.citation[0]).toMatchObject({
      '@type': 'CreativeWork',
      name: KAUZA.zdroje[0].titulek,
      url: KAUZA.zdroje[0].url,
      publisher: { '@type': 'Organization', name: KAUZA.zdroje[0].vydavatel },
    });
  });

  it('napojuje kauzu na Andreje Babiše, který je předmětem celého archivu', () => {
    const o = JSON.stringify((kauzaJsonLd(zaznam) as any).about);
    expect(o).toContain(BABIS_WIKIDATA);
  });

  it('Agrofert tvrdí jen u kauzy, která ho má mezi aktéry', () => {
    const bez = kauzaJsonLd(zaznam) as any;
    expect(JSON.stringify(bez.about)).not.toContain(AGROFERT_WIKIDATA);

    const sAgrofertem = kauzaJsonLd({
      ...zaznam,
      kauza: { ...KAUZA, akteri: [{ id: 'agrofert', role: 'vlastnik', popis: 'Vlastní.', zdroje: [1] }] },
    } as any) as any;
    expect(JSON.stringify(sAgrofertem.about)).toContain(AGROFERT_WIKIDATA);
  });

  it('má drobečkovou navigaci bez dvou položek na stejnou adresu', () => {
    const b = (kauzaJsonLd(zaznam) as any).breadcrumb;
    expect(b['@type']).toBe('BreadcrumbList');
    const adresy = b.itemListElement.map((p: any) => p.item);
    expect(new Set(adresy).size).toBe(adresy.length);
    expect(b.itemListElement.at(-1).name).toBe(KAUZA.nazev);
  });

  it('text s uvozovkami a ampersandem projde JSON bez poškození', () => {
    const rozbitna = { ...zaznam, kauza: { ...KAUZA, nazev: 'Kauza "X" & spol.', shrnuti: 'Shrnutí s <ostrými> znaky & "uvozovkami".' } };
    const text = JSON.stringify(kauzaJsonLd(rozbitna as any));
    expect(JSON.parse(text).headline).toBe('Kauza "X" & spol.');
    expect(text).not.toContain('</script');
  });
});
