import { describe, it, expect } from 'vitest';
import { vytvorPolozkuPravidla, odpovidaPravidlo } from '../../src/lib/hledani-pravidel';
import { overAdresar } from '../../src/lib/validace';

const vysledek = overAdresar('tests/fixtures/obsah');
const polozky = vysledek.pravidla.map(z => vytvorPolozkuPravidla(z, vysledek.stitky));
const najdi = (f: Partial<{ text: string; stitky: string[]; jenProjednavane: boolean }>) =>
  polozky.filter(p => odpovidaPravidlo(p, { text: '', stitky: [], jenProjednavane: false, ...f })).map(p => p.slug);

describe('hledání pravidel', () => {
  it('bez filtru najde všechna', () => expect(najdi({})).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau']));
  it('hledá bez diakritiky a velikosti písmen i v krocích řetězce', () => {
    expect(najdi({ text: 'ZAHAJENA RIZENI' })).toEqual(['zakon-omega']);
    expect(najdi({ text: 'lhutu k vymahani' })).toEqual(['zakon-omega']);
  });
  it('hledá každé slovo zvlášť, na pořadí nezáleží', () => {
    expect(najdi({ text: 'omega novela' })).toEqual(['zakon-omega']);
    expect(najdi({ text: 'novela omega' })).toEqual(['zakon-omega']);
  });
  it('hledá i v názvech štítků', () => expect(najdi({ text: 'střet zájmů' })).toEqual(['zakon-omega']));
  it('hledá v předkladateli', () => expect(najdi({ text: 'fiktivni vlada' })).toEqual(['narizeni-tau']));
  it('štítky se spojují logikou NEBO', () => expect(najdi({ stitky: ['eu-fondy', 'stret-zajmu'] })).toEqual(['zakon-omega', 'narizeni-tau']));
  it('jen v projednávání vynechá zamítnuté a vyhlášené', () => expect(najdi({ jenProjednavane: true })).toEqual(['zakon-omega']));
  it('mezery kolem hledaného textu nevadí', () => expect(najdi({ text: '  drubez  ' })).toEqual(['narizeni-tau']));
});
