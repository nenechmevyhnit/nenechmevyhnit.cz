import { describe, it, expect } from 'vitest';
import { sklonuj, vlnky, vlnkyVHtml } from '../../src/lib/cestina';

const LET: [string, string, string] = ['rok', 'roky', 'let'];
const NB = ' ';

describe('sklonuj', () => {
  it.each([[1, '1 rok'], [2, '2 roky'], [4, '4 roky'], [5, '5 let'], [12, '12 let'], [0, '0 let']])('%i → %s', (n, ocekavano) => {
    expect(sklonuj(n, LET)).toBe(ocekavano);
  });
});

describe('vlnky', () => {
  it('za jednopísmennou předložkou a spojkou je nezlomitelná mezera', () => {
    expect(vlnky('se zdrojem u každého tvrzení a se stanoviskem')).toBe(`se zdrojem u${NB}každého tvrzení a${NB}se stanoviskem`);
  });
  it('zvládne více předložek za sebou i velká písmena', () => {
    expect(vlnky('a v Praze. V roce 1995 k tomu')).toBe(`a${NB}v${NB}Praze. V${NB}roce 1995 k${NB}tomu`);
  });
  it('za uvozovkou a závorkou také', () => {
    expect(vlnky('(s výjimkou) „a tak“')).toBe(`(s${NB}výjimkou) „a${NB}tak“`);
  });
  it('nesahá na písmena uvnitř slov ani na zkratky s tečkou', () => {
    expect(vlnky('Babiš a A. Babiš, firma OFI s.r.o.')).toBe(`Babiš a${NB}A. Babiš, firma OFI s.r.o.`);
  });
});

describe('vlnkyVHtml', () => {
  it('mění jen text, ne značky, atributy ani skripty', () => {
    const html = '<p title="a b">je to u nás</p><script>const a = "v b";</script><style>a b{}</style><textarea>u x</textarea>';
    expect(vlnkyVHtml(html)).toBe(`<p title="a b">je to u${NB}nás</p><script>const a = "v b";</script><style>a b{}</style><textarea>u x</textarea>`);
  });
  it('předložka na konci prvku se spojí s textem v dalším prvku', () => {
    expect(vlnkyVHtml('<b>slovo</b> a <i>další</i>')).toBe(`<b>slovo</b> a${NB}<i>další</i>`);
  });
});
