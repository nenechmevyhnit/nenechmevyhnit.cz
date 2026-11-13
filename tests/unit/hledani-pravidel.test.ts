import { describe, it, expect } from 'vitest';
import { vytvorPolozkuPravidla, odpovidaPravidlo } from '../../src/lib/hledani-pravidel';
import { overAdresar } from '../../src/lib/validace';
import { pravidloSchema } from '../../src/lib/schema-pravidla';
import { platnePravidloKontrolaMoci } from './ukazka';

const vysledek = overAdresar('tests/fixtures/obsah');
const polozky = vysledek.pravidla.map(z => vytvorPolozkuPravidla(z, vysledek.stitky));
const najdi = (f: Partial<{ text: string; stitky: string[]; jenProjednavane: boolean; duvody: ('prospech' | 'kontrola-moci')[] }>) =>
  polozky.filter(p => odpovidaPravidlo(p, { text: '', stitky: [], jenProjednavane: false, duvody: [], ...f })).map(p => p.slug);

describe('hledání pravidel', () => {
  it('bez filtru najde všechna', () => expect(najdi({})).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau', 'usneseni-kappa']));
  it('hledá v textu znaků a v popiscích znaků a institucí bez diakritiky', () => {
    expect(najdi({ text: 'vyber fiktivnich soudcu ministrovi' })).toEqual(['usneseni-kappa']);
    expect(najdi({ text: 'zpetna ucinnost' })).toEqual(['zakon-omega']);
    expect(najdi({ text: 'kontrolni instituci' })).toEqual(['usneseni-kappa']);
  });
  it('filtr důvodu: NEBO mezi sebou, A se štítky', () => {
    expect(najdi({ duvody: ['kontrola-moci'] })).toEqual(['zakon-omega', 'usneseni-kappa']);
    expect(najdi({ duvody: ['prospech'] })).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau']);
    expect(najdi({ duvody: ['prospech', 'kontrola-moci'] })).toHaveLength(4);
    expect(najdi({ duvody: ['prospech'], stitky: ['soudy'] })).toEqual([]);
  });
  it('položka nese důvody zařazení', () => expect(polozky.find(p => p.slug === 'zakon-omega')!.duvody).toEqual(['prospech', 'kontrola-moci']));
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
