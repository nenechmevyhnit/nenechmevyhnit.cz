import { describe, it, expect } from 'vitest';
import { vytvorPolozkuPravidla, odpovidaPravidlo, seraditPolozkyPravidel } from '../../src/lib/hledani-pravidel';
import { overAdresar } from '../../src/lib/validace';
import { pravidloSchema } from '../../src/lib/schema-pravidla';
import { platnePravidloKontrolaMoci } from './ukazka';

const vysledek = overAdresar('tests/fixtures/obsah');
const polozky = vysledek.pravidla.map(z => vytvorPolozkuPravidla(z, vysledek.stitky));
const najdi = (f: Partial<Parameters<typeof odpovidaPravidlo>[1]>) =>
  polozky.filter(p => odpovidaPravidlo(p, { text: '', stitky: [], jenProjednavane: false, duvody: [], ...f })).map(p => p.slug);

describe('hledání pravidel', () => {
  it('filtr druhu (cesty předložení) a stavu', () => {
    expect(najdi({ cesta: 'narizeni-vlady' })).toEqual(['narizeni-tau']);
    expect(najdi({ stav: 'zamitnuto' })).toEqual(['pozmenovaci-sigma']);
    expect(najdi({ cesta: 'narizeni-vlady', stav: 'zamitnuto' })).toEqual([]);
    expect(najdi({ cesta: '', stav: '' })).toHaveLength(4);
  });
  it('řazení: výchozí odpovídá pořadí ze serveru, podle názvu abecedně, od nejstarší podle první události', () => {
    expect(seraditPolozkyPravidel(polozky, 'aktivita').map(p => p.slug)).toEqual(polozky.map(p => p.slug));
    const nazvy = seraditPolozkyPravidel(polozky, 'nazev').map(p => p.nazev);
    expect(nazvy).toEqual([...nazvy].sort((a, b) => a.localeCompare(b, 'cs')));
    const prvni = seraditPolozkyPravidel(polozky, 'starsi').map(p => p.prvni);
    expect(prvni).toEqual([...prvni].sort());
    expect(seraditPolozkyPravidel(polozky, 'novejsi').map(p => p.prvni)).toEqual([...prvni].reverse());
  });
  it('bez filtru najde všechna', () => expect(najdi({})).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau', 'usneseni-kappa']));
  it('hledá v textu znaků a v popiscích znaků a institucí bez diakritiky', () => {
    expect(najdi({ text: 'vyber fiktivnich soudcu ministrovi' })).toEqual(['usneseni-kappa']);
    expect(najdi({ text: 'zpetna ucinnost' })).toEqual(['zakon-omega']);
    expect(najdi({ text: 'instituci nebo pravidla statu' })).toEqual(['usneseni-kappa']);
  });
  it('filtr důvodu: NEBO mezi sebou, A se štítky', () => {
    expect(najdi({ duvody: ['kontrola-moci'] })).toEqual(['zakon-omega', 'usneseni-kappa']);
    expect(najdi({ duvody: ['prospech'] })).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau']);
    expect(najdi({ duvody: ['prospech', 'kontrola-moci'] })).toHaveLength(4);
    expect(najdi({ duvody: ['prospech'], stitky: ['soudy'] })).toEqual([]);
  });
  it('položka nese důvody zařazení', () => expect(polozky.find(p => p.slug === 'zakon-omega')!.duvody).toEqual(['prospech', 'kontrola-moci']));
  it('hledá i v textu „Co by to znamenalo pro vás“', () => expect(najdi({ text: 'vyssi fiktivni sazbu na zvire' })).toEqual(['narizeni-tau']));
  it('filtr bez připomínkového řízení', () => {
    expect(najdi({ jenBezPripominek: true })).toEqual(['zakon-omega', 'pozmenovaci-sigma']);
    expect(najdi({ jenBezPripominek: true, jenProjednavane: true })).toEqual(['zakon-omega']);
  });
  it('položka nese oblasti, kategorii stavu a příznak', () => {
    const omega = polozky.find(p => p.slug === 'zakon-omega')!;
    expect(omega.oblasti).toEqual(['dotace-stret-zajmu', 'kontrolni-urady']);
    expect(omega.kategorie).toBe('projednava');
    expect(omega.bezPripominek).toBe(true);
    expect(polozky.find(p => p.slug === 'usneseni-kappa')!).toMatchObject({ kategorie: 'prijato', bezPripominek: false });
  });
  it('hledá bez diakritiky a velikosti písmen i v krocích řetězce', () => {
    expect(najdi({ text: 'ZAHAJENA RIZENI' })).toEqual(['zakon-omega']);
    expect(najdi({ text: 'lhutu k vymahani' })).toEqual(['zakon-omega']);
  });
  it('hledá v shrnutí „proč“ bez diakritiky', () => expect(najdi({ text: 'dluznikem' })).toEqual(['zakon-omega']));
  it('hledá každé slovo zvlášť, na pořadí nezáleží', () => {
    expect(najdi({ text: 'omega novela' })).toEqual(['zakon-omega']);
    expect(najdi({ text: 'novela omega' })).toEqual(['zakon-omega']);
  });
  it('hledá i v názvech štítků', () => expect(najdi({ text: 'střet zájmů' })).toEqual(['zakon-omega']));
  it('hledá v předkladateli', () => expect(najdi({ text: 'fiktivni vlada' })).toEqual(['narizeni-tau']));
  it('štítky se spojují logikou NEBO', () => expect(najdi({ stitky: ['eu-fondy', 'stret-zajmu'] })).toEqual(['zakon-omega', 'narizeni-tau']));
  it('jen v projednávání vynechá zamítnuté a vyhlášené', () => expect(najdi({ jenProjednavane: true })).toEqual(['zakon-omega']));
  it('mezery kolem hledaného textu nevadí', () => expect(najdi({ text: '  drubez  ' })).toEqual(['narizeni-tau']));
  it('hledá v textech upozornění a ve jménech upozorňovatelů bez diakritiky', () => {
    expect(najdi({ text: 'ustavni soud' })).toEqual(['usneseni-kappa']);
    expect(najdi({ text: 'legislativni rada' })).toEqual(['zakon-omega']);
  });
  it('popisek instituce se hledá nezávisle na štítcích', () => {
    const p = platnePravidloKontrolaMoci() as any;
    p.kontrolaMoci.znaky[0].instituce = 'statni-zastupitelstvi';
    const polozka = vytvorPolozkuPravidla({ slug: 'vzorek', pravidlo: pravidloSchema.parse(p), telo: '' });
    expect(polozka.text).toContain('statni zastupitelstvi');
  });
});
