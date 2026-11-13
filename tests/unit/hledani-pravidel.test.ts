import { describe, it, expect } from 'vitest';
import { vytvorPolozkuPravidla, odpovidaPravidlo } from '../../src/lib/hledani-pravidel';
import { overAdresar } from '../../src/lib/validace';

const polozky = overAdresar('tests/fixtures/obsah').pravidla.map(vytvorPolozkuPravidla);
const najdi = (f: Partial<{ text: string; stitky: string[]; jenProjednavane: boolean }>) =>
  polozky.filter(p => odpovidaPravidlo(p, { text: '', stitky: [], jenProjednavane: false, ...f })).map(p => p.slug);

describe('hledání pravidel', () => {
  it('bez filtru najde všechna', () => expect(najdi({})).toEqual(['zakon-omega', 'pozmenovaci-sigma', 'narizeni-tau']));
  it('hledá bez diakritiky a velikosti písmen i v krocích řetězce', () => {
    expect(najdi({ text: 'ZAHAJENA RIZENI' })).toEqual(['zakon-omega']);
    expect(najdi({ text: 'lhutu k vymahani' })).toEqual(['zakon-omega']);
  });
  it('hledá v předkladateli', () => expect(najdi({ text: 'poslanec d' })).toEqual(['pozmenovaci-sigma']));
  it('štítky se spojují logikou NEBO', () => expect(najdi({ stitky: ['eu-fondy', 'stret-zajmu'] })).toEqual(['zakon-omega', 'narizeni-tau']));
  it('jen v projednávání vynechá zamítnuté a vyhlášené', () => expect(najdi({ jenProjednavane: true })).toEqual(['zakon-omega']));
  it('mezery kolem hledaného textu nevadí', () => expect(najdi({ text: '  drubez  ' })).toEqual(['narizeni-tau']));
});
